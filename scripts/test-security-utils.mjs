import { isSafeHttpUrl, validateSvgSafety, checkRateLimit } from "../lib/security-utils.ts";

let passed = 0;
let failed = 0;

function expect(condition, desc) {
  if (condition) {
    passed++;
    console.log(`[PASS] ${desc}`);
  } else {
    failed++;
    console.error(`[FAIL] ${desc}`);
  }
}

console.log("--- Testing URL Security Validation ---");
expect(isSafeHttpUrl("https://example.com"), "Accepts standard HTTPS URL");
expect(isSafeHttpUrl("http://sub.domain.org/path?a=1&b=2"), "Accepts HTTP with params");
expect(isSafeHttpUrl("https://lsho.cc/dashboard"), "Accepts valid app URLs");
expect(!isSafeHttpUrl("javascript:alert(1)"), "Rejects javascript: scheme");
expect(!isSafeHttpUrl("JAVASCRIPT:alert(document.cookie)"), "Rejects uppercase JAVASCRIPT: scheme");
expect(!isSafeHttpUrl("data:text/html;base64,PHNjcmlwdD4="), "Rejects data: URI scheme");
expect(!isSafeHttpUrl("file:///etc/passwd"), "Rejects file: scheme");
expect(!isSafeHttpUrl("vbscript:MsgBox(1)"), "Rejects vbscript: scheme");
expect(!isSafeHttpUrl("blob:https://example.com/uuid"), "Rejects blob: scheme");
expect(!isSafeHttpUrl("java\0script:alert(1)"), "Rejects null-byte injection attempt");
expect(!isSafeHttpUrl(""), "Rejects empty string");
expect(!isSafeHttpUrl(null), "Rejects null");

console.log("\n--- Testing SVG Security & Stored XSS Prevention ---");
const safeSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
expect(validateSvgSafety(safeSvg).isSafe, "Accepts safe SVG");

const scriptSvg = '<svg><script>alert("XSS")</script></svg>';
expect(!validateSvgSafety(scriptSvg).isSafe, "Rejects SVG with <script> tag");

const onloadSvg = '<svg onload="alert(1)"><rect width="10" height="10"/></svg>';
expect(!validateSvgSafety(onloadSvg).isSafe, "Rejects SVG with onload handler");

const onclickSvg = '<svg><rect width="10" height="10" onclick="evil()"/></svg>';
expect(!validateSvgSafety(onclickSvg).isSafe, "Rejects SVG with onclick handler");

const jsHrefSvg = '<svg><a href="javascript:alert(1)"><text>Click</text></a></svg>';
expect(!validateSvgSafety(jsHrefSvg).isSafe, "Rejects SVG with href=javascript:");

const xxeSvg = '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>';
expect(!validateSvgSafety(xxeSvg).isSafe, "Rejects SVG with XXE entity definition");

const foreignSvg = '<svg><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><h1>PWN</h1></body></foreignObject></svg>';
expect(!validateSvgSafety(foreignSvg).isSafe, "Rejects SVG with <foreignObject>");

console.log("\n--- Testing Rate Limiting Utility ---");
const testKey = "test_ip_127.0.0.1";
let allowedAll = true;
for (let i = 0; i < 5; i++) {
  const r = checkRateLimit(testKey, 5, 10000);
  if (!r.allowed) allowedAll = false;
}
expect(allowedAll, "Allows attempts up to limit (5 attempts)");
const blockedAttempt = checkRateLimit(testKey, 5, 10000);
expect(!blockedAttempt.allowed, "Blocks 6th attempt exceeding limit");
expect(blockedAttempt.retryAfterSec > 0, "Provides positive retryAfterSec value");

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
