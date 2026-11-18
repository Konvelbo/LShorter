const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // 2400x1260 super crisp
  });

  const bannerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      background: #07090E;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #FFFFFF;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px 72px;
    }
    /* Ambient Neon Glows */
    .glow-1 {
      position: absolute;
      top: -120px;
      right: -80px;
      width: 550px;
      height: 550px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 102, 255, 0.28) 0%, rgba(96, 165, 250, 0.12) 40%, transparent 70%);
      pointer-events: none;
    }
    .glow-2 {
      position: absolute;
      bottom: -150px;
      left: 10%;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(0, 102, 255, 0.1) 45%, transparent 70%);
      pointer-events: none;
    }
    /* Subtle Background Grid */
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(circle at 60% 40%, black 30%, transparent 85%);
      pointer-events: none;
    }
    /* Top Bar */
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-logo {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: linear-gradient(135deg, #0066FF 0%, #3B82F6 100%);
      box-shadow: 0 8px 24px rgba(0, 102, 255, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
      color: white;
      letter-spacing: -0.5px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #FFFFFF;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(0, 102, 255, 0.14);
      border: 1px solid rgba(0, 102, 255, 0.35);
      color: #60A5FA;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
    }

    /* Center Content */
    .main-body {
      position: relative;
      z-index: 10;
      margin: auto 0;
    }
    .badge-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94A3B8;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .hero-title {
      font-size: 48px;
      line-height: 1.15;
      font-weight: 850;
      letter-spacing: -0.035em;
      color: #F8FAFC;
      max-width: 950px;
    }
    .hero-title span {
      background: linear-gradient(135deg, #60A5FA 0%, #38BDF8 60%, #A78BFA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-desc {
      font-size: 20px;
      line-height: 1.45;
      color: #94A3B8;
      max-width: 880px;
      margin-top: 16px;
      font-weight: 450;
    }

    /* Bottom Features Bar */
    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .feature-chips {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
      font-weight: 600;
      color: #E2E8F0;
    }
    .chip-accent {
      color: #60A5FA;
    }
    .domain-tag {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 14px;
      font-weight: 600;
      color: #64748B;
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  <div class="grid-bg"></div>

  <!-- Top Bar -->
  <div class="top-bar">
    <div class="brand-wrap">
      <div class="brand-logo">LS</div>
      <div class="brand-title">LShorter</div>
    </div>
    <div class="brand-badge">
      <span class="pulse-dot"></span>
      <span>Cloudflare Anycast Edge · 300+ PoPs</span>
    </div>
  </div>

  <!-- Main Headline -->
  <div class="main-body">
    <div class="badge-label">
      <span>Enterprise Edge Link Management</span>
      <span>•</span>
      <span>Next-Gen URL Architecture</span>
    </div>
    <h1 class="hero-title">
      Every click directed with <span>1.2ms precision</span>, attribution & security.
    </h1>
    <p class="hero-desc">
      Programmable ISO Geo & Device edge routing, PathLock™ protection, weighted A/B split-testing, and real-time revenue analytics.
    </p>
  </div>

  <!-- Bottom Badges -->
  <div class="bottom-bar">
    <div class="feature-chips">
      <div class="chip">
        <span class="chip-accent">⚡</span>
        <span>1.2ms Latency</span>
      </div>
      <div class="chip">
        <span class="chip-accent">🛡️</span>
        <span>PathLock™ PIN Mask</span>
      </div>
      <div class="chip">
        <span class="chip-accent">🎯</span>
        <span>Targeting & Retargeting</span>
      </div>
      <div class="chip">
        <span class="chip-accent">💰</span>
        <span>Zero-Cookie Revenue</span>
      </div>
    </div>
    <div class="domain-tag">lsho.cc</div>
  </div>
</body>
</html>
  `;

  await page.setContent(bannerHtml, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const targets = [
    path.join(__dirname, "../public/default_banner.jpg"),
    path.join(__dirname, "../public/uploads/banner_1788548429949_ro7ky.png"),
    path.join(__dirname, "../public/uploads/banner_1788550130779_06dci.jpg"),
  ];

  for (const t of targets) {
    fs.mkdirSync(path.dirname(t), { recursive: true });
    if (t.endsWith(".jpg") || t.endsWith(".jpeg")) {
      await page.screenshot({ path: t, type: "jpeg", quality: 95 });
    } else {
      await page.screenshot({ path: t, type: "png" });
    }
    console.log("Successfully generated fresh banner at:", t);
  }

  await browser.close();
})();
