const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

async function capture() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 800, height: 1100 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const previewDir = path.join(process.cwd(), "public", "email-previews");
  const artifactDir = "C:/Users/user/.gemini/antigravity/brain/2b243af5-ec24-4b83-b965-30d233d3fbaf";

  const preHtml = path.join(previewDir, "pre-renewal-overage-alert.html");
  const postHtml = path.join(previewDir, "post-renewal-overage-confirmation.html");

  // 1. Screenshot Pre-Renewal
  await page.goto("file://" + preHtml.replace(/\\/g, "/"), { waitUntil: "networkidle" });
  const preShot = path.join(artifactDir, "pre_renewal_email.png");
  await page.screenshot({ path: preShot, fullPage: true });
  console.log("Captured pre-renewal screenshot:", preShot);

  // 2. Screenshot Post-Renewal
  await page.goto("file://" + postHtml.replace(/\\/g, "/"), { waitUntil: "networkidle" });
  const postShot = path.join(artifactDir, "post_renewal_email.png");
  await page.screenshot({ path: postShot, fullPage: true });
  console.log("Captured post-renewal screenshot:", postShot);

  await browser.close();
  console.log("Screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
