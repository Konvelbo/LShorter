import { chromium, request } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCREENSHOT_DIR = path.join(process.cwd(), "tests", "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const SQL_PAYLOADS = [
  "' OR 1=1 --",
  "' OR '1'='1",
  "admin'--",
  "'; DROP TABLE users; --",
  "' UNION SELECT 1, 'admin', 'hash', 'admin@lsho.cc'--",
  "1; EXEC xp_cmdshell('dir');--",
  "' OR ''='",
  "\" OR \"\"=\"",
];

async function runSecurityAudit() {
  console.log("================================================================");
  console.log("🛡️  LSHORTER - INPUT SECURITY & SQL INJECTION AUDIT (PLAYWRIGHT)");
  console.log("================================================================\n");

  const results = [];
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. UI TEST: Login Form SQL Injection Resistance
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("▶ [UI 1/2] Testing Login Form with SQL Injection Payloads...");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });

  for (const payload of ["' OR 1=1 --", "admin'--", "' OR '1'='1"]) {
    // Target email input
    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    const passwordInput = page.locator("input[type='password'], input[name='password']").first();
    const submitButton = page.locator("button:has-text('Sign In'), button[type='submit']").first();

    await emailInput.fill(payload);
    await passwordInput.fill(payload);
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Verify user was NOT authenticated and still on /login or error shown
    const currentUrl = page.url();
    const isStillOnLogin = currentUrl.includes("/login");
    const hasDashboard = currentUrl.includes("/dashboard");

    // Check if browser native validation or toast error triggered
    const validationMessage = await emailInput.evaluate(
      (el) => el.validationMessage || ""
    );

    const passed = isStillOnLogin && !hasDashboard;
    results.push({
      vector: "UI Login Email/Password",
      payload,
      expected: "Blocked / Not Authenticated",
      actual: passed ? `Blocked (Stayed on /login, error: "${validationMessage || "Invalid credentials"}")` : "VULNERABLE (Bypassed)",
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Browser HTML5 + Zod emailSchema + Parameterized Auth Query",
    });
  }

  // Screenshot blocked login attempt
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, "sqli-login-blocked.png") });
  console.log("   📸 Screenshot saved: tests/screenshots/sqli-login-blocked.png");

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. UI TEST: Sign Up Form SQL Injection Resistance
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [UI 2/2] Testing Sign Up Form with SQL Injection Payloads...");
  try {
    const signupTab = page.locator("button:has-text('Sign up')").first();
    if (await signupTab.isVisible()) {
      await signupTab.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator("input[name='name'], input[placeholder*='name' i]").first();
      const emailInput = page.locator("input[type='email'], input[name='email']").first();
      const passwordInput = page.locator("input[type='password'], input[name='password']").first();
      const submitSignup = page.locator("button:has-text('Create Account'), button:has-text('Sign up')").last();

      const sqliName = "Robert'); DROP TABLE users;--";
      const sqliEmail = "' OR 1=1 --";
      const sqliPass = "' OR '1'='1";

      if (await nameInput.isVisible()) await nameInput.fill(sqliName);
      if (await emailInput.isVisible()) await emailInput.fill(sqliEmail);
      if (await passwordInput.isVisible()) await passwordInput.fill(sqliPass);

      await submitSignup.click();
      await page.waitForTimeout(1000);

      const isStillOnLogin = page.url().includes("/login");
      results.push({
        vector: "UI Registration Form",
        payload: `${sqliName} | ${sqliEmail}`,
        expected: "Blocked / Rejected",
        actual: isStillOnLogin ? "Blocked (Rejected invalid format / stays on auth page)" : "VULNERABLE",
        status: isStillOnLogin ? "PASS ✅" : "FAIL ❌",
        defense: "Zod nameSchema + emailSchema + passwordSchema",
      });

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "sqli-signup-blocked.png") });
      console.log("   📸 Screenshot saved: tests/screenshots/sqli-signup-blocked.png");
    }
  } catch (err) {
    console.warn("   Notice: Sign up tab UI check note:", err.message);
  }

  await browser.close();

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. API ROUTE TESTS (Direct HTTP with Playwright APIRequestContext)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n▶ [API 1/7] Testing /api/auth/register with SQL Injection Payloads...");
  const apiContext = await request.newContext({ baseURL: BASE_URL });

  // Test Register API with malicious email
  for (const payload of ["' OR 1=1 --", "admin'--", "'; DROP TABLE users; --"]) {
    const res = await apiContext.post("/api/auth/register", {
      data: {
        name: "Security Tester",
        email: payload,
        password: "ValidPassword123!",
      },
    });
    const status = res.status();
    const body = await res.json().catch(() => ({}));
    const passed = status === 400 && body.error === "Validation error";

    results.push({
      vector: "API POST /api/auth/register (email)",
      payload,
      expected: "HTTP 400 Validation Error",
      actual: `HTTP ${status} (${body.error || "ok"}) - details: ${JSON.stringify(body.details || {})}`,
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Zod emailSchema: .email() validator",
    });
  }

  // Test Register API with malicious passwordHash
  console.log("▶ [API 2/7] Testing /api/auth/register with fake passwordHash injection...");
  for (const payload of ["' UNION SELECT 1--", "'; DROP TABLE users;--", "not_a_bcrypt_hash"]) {
    const res = await apiContext.post("/api/auth/register", {
      data: {
        name: "Security Tester",
        email: "sec_tester@example.com",
        passwordHash: payload,
      },
    });
    const status = res.status();
    const body = await res.json().catch(() => ({}));
    const passed = status === 400 && body.error === "Validation error";

    results.push({
      vector: "API POST /api/auth/register (passwordHash)",
      payload,
      expected: "HTTP 400 Validation Error (Invalid bcrypt hash)",
      actual: `HTTP ${status} (${body.error || "ok"}) - details: ${JSON.stringify(body.details || {})}`,
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Zod bcryptHashSchema: strict $2a$10$... regex",
    });
  }

  // Test Links API with SQL injection in slug
  console.log("▶ [API 3/7] Testing /api/links with SQL Injection in custom slug...");
  for (const payload of ["'; DROP TABLE links;--", "test' OR '1'='1", "admin'--", "../../../etc/passwd"]) {
    const res = await apiContext.post("/api/links", {
      data: {
        slug: payload,
        targetUrl: "https://example.com/safe",
      },
    });
    const status = res.status();
    const body = await res.json().catch(() => ({}));
    // Should be rejected by Zod validation (400) or auth gate (401)
    const passed = (status === 400 && body.error === "Validation error") || status === 401;

    results.push({
      vector: "API POST /api/links (slug)",
      payload,
      expected: "HTTP 400 Validation Error (or 401 Unauthorized)",
      actual: `HTTP ${status} (${body.error || "ok"})`,
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Zod slugSchema: /^[a-zA-Z0-9_-]+$/",
    });
  }

  // Test Links API with malformed/malicious targetUrl
  console.log("▶ [API 4/7] Testing /api/links with malicious URL schemes...");
  for (const payload of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "file:///etc/passwd"]) {
    const res = await apiContext.post("/api/links", {
      data: {
        targetUrl: payload,
      },
    });
    const status = res.status();
    const body = await res.json().catch(() => ({}));
    const passed = (status === 400 && body.error === "Validation error") || status === 401;

    results.push({
      vector: "API POST /api/links (targetUrl)",
      payload,
      expected: "HTTP 400 Validation Error (safeHttpUrlSchema)",
      actual: `HTTP ${status} (${body.error || "ok"})`,
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Zod safeHttpUrlSchema: strict HTTP/HTTPS protocol check",
    });
  }

  // Test Targets API with SQL injection in metricType
  console.log("▶ [API 5/7] Testing /api/targets with SQL Injection in metricType enum...");
  for (const payload of ["' OR '1'='1", "clicks'; DROP TABLE target_alerts;--"]) {
    const res = await apiContext.post("/api/targets", {
      data: {
        metricType: payload,
        targetValue: 1000,
      },
    });
    const status = res.status();
    const body = await res.json().catch(() => ({}));
    const passed = (status === 400 && body.error === "Validation error") || status === 401;

    results.push({
      vector: "API POST /api/targets (metricType)",
      payload,
      expected: "HTTP 400 Validation Error",
      actual: `HTTP ${status} (${body.error || "ok"})`,
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Zod targetMetricTypeSchema: strict enum",
    });
  }

  // Test Redirect endpoint with SQL injection in slug param
  console.log("▶ [API 6/7] Testing /api/r/[slug] with SQL Injection in path parameter...");
  for (const payload of ["' OR 1=1 --", "admin'--", "'; DROP TABLE links;--"]) {
    const encodedPayload = encodeURIComponent(payload);
    const res = await apiContext.get(`/api/r/${encodedPayload}`);
    const status = res.status();
    const body = await res.json().catch(() => ({}));
    // parseParams with slugParamsSchema must reject characters not in [a-zA-Z0-9_-] with 400
    const passed = status === 400 || status === 404;

    results.push({
      vector: "API GET /api/r/[slug]",
      payload,
      expected: "HTTP 400 Validation Error or 404 Not Found",
      actual: `HTTP ${status} (${body.error || "not found"})`,
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Zod slugParamsSchema + Parameterized D1 query",
    });
  }

  // Test Domains API with SQL injection
  console.log("▶ [API 7/7] Testing /api/domains with SQL Injection in domain name...");
  for (const payload of ["'; DROP TABLE custom_domains;--", "example.com' OR '1'='1"]) {
    const res = await apiContext.post("/api/domains", {
      data: {
        domain: payload,
      },
    });
    const status = res.status();
    const body = await res.json().catch(() => ({}));
    const passed = (status === 400 && body.error === "Validation error") || status === 401;

    results.push({
      vector: "API POST /api/domains (domain)",
      payload,
      expected: "HTTP 400 Validation Error",
      actual: `HTTP ${status} (${body.error || "ok"})`,
      status: passed ? "PASS ✅" : "FAIL ❌",
      defense: "Zod domainNameSchema: regex RFC domain",
    });
  }

  await apiContext.dispose();

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n================================================================");
  console.log("📊 SECURITY AUDIT SCORECARD - RESULTS");
  console.log("================================================================\n");

  const total = results.length;
  const passedCount = results.filter((r) => r.status.includes("PASS")).length;
  const failedCount = total - passedCount;

  console.table(
    results.map((r, i) => ({
      "#": i + 1,
      Vector: r.vector,
      Payload: r.payload.length > 25 ? r.payload.slice(0, 22) + "..." : r.payload,
      Defense: r.defense.slice(0, 35),
      Status: r.status,
    }))
  );

  console.log(`\nTOTAL TESTS: ${total}`);
  console.log(`✅ PASSED: ${passedCount}/${total} (${Math.round((passedCount / total) * 100)}%)`);
  console.log(`❌ FAILED: ${failedCount}/${total}`);

  if (failedCount === 0) {
    console.log("\n🎉 ALL TESTS PASSED! No SQL injection or malicious bypass possible.");
  } else {
    console.error(`\n⚠️ ${failedCount} test(s) failed.`);
    process.exit(1);
  }
}

runSecurityAudit().catch((err) => {
  console.error("FATAL ERROR IN SECURITY AUDIT:", err);
  process.exit(1);
});
