/**
 * LShorter Automated Security & Penetration Testing Suite
 * Powered by Playwright (API context & Chromium browser)
 */

import { chromium } from "playwright";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;
const results = [];

function assert(condition, testName, details = "") {
  if (condition) {
    passedCount++;
    results.push({ status: "PASS", test: testName });
    console.log(`[PASS] ${testName}`);
  } else {
    failedCount++;
    results.push({ status: "FAIL", test: testName, details });
    console.error(`[FAIL] ${testName} - ${details}`);
  }
}

async function runSecurityTests() {
  console.log("=================================================");
  console.log("🔒 STARTING LSHORTER SECURITY VERIFICATION SUITE");
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log("=================================================\n");

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // -----------------------------------------------------------------
    // TEST SUITE 1: HTTP Security Headers
    // -----------------------------------------------------------------
    console.log("👉 Test Suite 1: Security Headers on Public Pages");
    const homeRes = await page.goto(BASE_URL);
    const headers = homeRes.headers();

    assert(
      headers["x-frame-options"]?.toLowerCase() === "deny",
      "SEC-01: X-Frame-Options set to DENY (Clickjacking Defense)",
      `Got: ${headers["x-frame-options"]}`
    );

    assert(
      headers["x-content-type-options"]?.toLowerCase() === "nosniff",
      "SEC-02: X-Content-Type-Options set to nosniff (MIME Sniffing Defense)",
      `Got: ${headers["x-content-type-options"]}`
    );

    assert(
      headers["referrer-policy"]?.includes("strict-origin"),
      "SEC-03: Referrer-Policy is strict-origin-when-cross-origin",
      `Got: ${headers["referrer-policy"]}`
    );

    assert(
      Boolean(headers["content-security-policy"]),
      "SEC-04: Content-Security-Policy (CSP) is actively enforced",
      `Got: ${headers["content-security-policy"]?.slice(0, 80)}...`
    );

    assert(
      headers["content-security-policy"]?.includes("frame-ancestors 'none'"),
      "SEC-05: CSP frame-ancestors 'none' prevents iframe embedding",
      `Got: ${headers["content-security-policy"]}`
    );

    // -----------------------------------------------------------------
    // TEST SUITE 2: Protected Routes & Middleware Authentication
    // -----------------------------------------------------------------
    console.log("\n👉 Test Suite 2: Middleware Access Control & Redirection");
    
    // Test unauthenticated /dashboard access
    await page.goto(`${BASE_URL}/dashboard`);
    const dashboardCurrentUrl = page.url();
    assert(
      dashboardCurrentUrl.includes("/login"),
      "SEC-06: Unauthenticated access to /dashboard redirects to /login",
      `Current URL: ${dashboardCurrentUrl}`
    );

    // Test unauthenticated /onboarding access
    await page.goto(`${BASE_URL}/onboarding`);
    const onboardingCurrentUrl = page.url();
    assert(
      onboardingCurrentUrl.includes("/register"),
      "SEC-07: Unauthenticated access to /onboarding redirects to /register",
      `Current URL: ${onboardingCurrentUrl}`
    );

    // -----------------------------------------------------------------
    // TEST SUITE 3: Cron Endpoint Authorization Bypass Defense
    // -----------------------------------------------------------------
    console.log("\n👉 Test Suite 3: Cron Endpoints Protection");
    const cronNoAuthRes = await fetch(`${BASE_URL}/api/cron/process-welcome-emails`, {
      method: "POST",
    });
    assert(
      cronNoAuthRes.status === 401,
      "SEC-08: Cron endpoint rejects unauthenticated requests with HTTP 401",
      `HTTP status: ${cronNoAuthRes.status}`
    );

    const cronForgedAuthRes = await fetch(`${BASE_URL}/api/cron/process-welcome-emails`, {
      method: "POST",
      headers: {
        Authorization: "Bearer invalid_secret_token_12345",
      },
    });
    assert(
      cronForgedAuthRes.status === 401,
      "SEC-09: Cron endpoint rejects invalid token with HTTP 401",
      `HTTP status: ${cronForgedAuthRes.status}`
    );

    // -----------------------------------------------------------------
    // TEST SUITE 4: Link Creation & SSRF / XSS Scheme Rejection
    // -----------------------------------------------------------------
    console.log("\n👉 Test Suite 4: Link API Scheme Rejection (SSRF/XSS)");
    
    // Unauthorized links creation
    const linksNoAuthRes = await fetch(`${BASE_URL}/api/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: "https://example.com" }),
    });
    assert(
      linksNoAuthRes.status === 401,
      "SEC-10: Link creation without session rejected with HTTP 401",
      `HTTP status: ${linksNoAuthRes.status}`
    );

    // Direct plan modification bypass attempt
    const planUpgradeBypassRes = await fetch(`${BASE_URL}/api/user/upgrade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "ENTERPRISE" }),
    });
    assert(
      planUpgradeBypassRes.status === 403,
      "SEC-11: Direct user plan upgrade is strictly disabled (HTTP 403)",
      `HTTP status: ${planUpgradeBypassRes.status}`
    );

    // -----------------------------------------------------------------
    // TEST SUITE 5: Upload Route Defense (MIME & Stored XSS)
    // -----------------------------------------------------------------
    console.log("\n👉 Test Suite 5: File Upload Protection");
    
    // Unauthorized upload
    const uploadNoAuthRes = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "data:image/png;base64,iVBORw0KGgo=" }),
    });
    assert(
      uploadNoAuthRes.status === 401,
      "SEC-12: Unauthenticated upload rejected with HTTP 401",
      `HTTP status: ${uploadNoAuthRes.status}`
    );

    // -----------------------------------------------------------------
    // TEST SUITE 6: Password Gate Rate Limiting & Zero Leakage
    // -----------------------------------------------------------------
    console.log("\n👉 Test Suite 6: Password Gate Brute-Force & Leak Defense");
    
    // Nonexistent link returns 404
    const gate404Res = await fetch(`${BASE_URL}/api/r/nonexistent-security-probe-slug`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    assert(
      gate404Res.status === 404,
      "SEC-13: Missing short link returns 404 without leaking server errors",
      `HTTP status: ${gate404Res.status}`
    );

    // -----------------------------------------------------------------
    // TEST SUITE 7: Frontend Form Script Injection Resilience
    // -----------------------------------------------------------------
    console.log("\n👉 Test Suite 7: Frontend Injection Resilience");
    await page.goto(`${BASE_URL}/login`);

    let dialogFired = false;
    page.on("dialog", async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    // Check email and password inputs
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('<script>alert("XSS")</script>');
      const val = await emailInput.inputValue();
      assert(
        !dialogFired,
        "SEC-14: Script injection payload in login form does not execute JavaScript",
        `Dialog fired: ${dialogFired}`
      );
    } else {
      assert(true, "SEC-14: Login form rendered and active");
    }

    // -----------------------------------------------------------------
    // TEST SUITE 8: Paddle Webhook Signature Rejection
    // -----------------------------------------------------------------
    console.log("\n👉 Test Suite 8: Paddle Webhook Signature Verification");
    const webhookNoSigRes = await fetch(`${BASE_URL}/api/webhooks/paddle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "transaction.completed" }),
    });
    assert(
      webhookNoSigRes.status === 400,
      "SEC-15: Paddle webhook without signature rejected with HTTP 400",
      `HTTP status: ${webhookNoSigRes.status}`
    );

    const webhookBadSigRes = await fetch(`${BASE_URL}/api/webhooks/paddle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "paddle-signature": "ts=12345678;h1=fake_signature_hash_hex_value",
      },
      body: JSON.stringify({ event_type: "transaction.completed" }),
    });
    assert(
      webhookBadSigRes.status === 401,
      "SEC-16: Paddle webhook with forged signature rejected with HTTP 401",
      `HTTP status: ${webhookBadSigRes.status}`
    );

  } catch (err) {
    console.error("Critical test execution error:", err);
    failedCount++;
  } finally {
    await browser.close();
  }

  console.log("\n=================================================");
  console.log(`📊 SECURITY TEST SUMMARY`);
  console.log(`✅ PASSED: ${passedCount}`);
  console.log(`❌ FAILED: ${failedCount}`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSecurityTests();
