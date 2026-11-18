const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const mockLinks = [
  {
    id: "link_summer_sale",
    user_id: "usr_marketing_preview",
    slug: "summer-sale-2026",
    domain_name: "lsho.cc",
    domainName: "lsho.cc",
    shortUrl: "https://lsho.cc/r/summer-sale-2026",
    target_url: "https://store.brand.com/collections/summer-sale?utm_source=lshorter&utm_campaign=summer26",
    targetUrl: "https://store.brand.com/collections/summer-sale?utm_source=lshorter&utm_campaign=summer26",
    clicks_count: 48250,
    clicksCount: 48250,
    clicks: 48250,
    unique_clicks: 36400,
    uniqueClicks: 36400,
    conversions_count: 1420,
    conversionsCount: 1420,
    revenue: 14200.0,
    pixels: ["Meta Pixel", "TikTok Pixel", "Google Tag"],
    tags: ["promo", "ecommerce", "summer"],
    og_title: "Summer Sale 2026 - Up to 50% Off Exclusive Collection",
    ogTitle: "Summer Sale 2026 - Up to 50% Off Exclusive Collection",
    og_image: "/uploads/banner_1788548429949_ro7ky.png",
    ogImage: "/uploads/banner_1788548429949_ro7ky.png",
    banner_url: "/uploads/banner_1788548429949_ro7ky.png",
    bannerUrl: "/uploads/banner_1788548429949_ro7ky.png",
    hasCustomBanner: true,
    is_active: 1,
    isActive: true,
    status: "Active",
    created_at: "2026-05-15T09:30:00.000Z",
    createdAt: "2026-05-15T09:30:00.000Z",
  },
  {
    id: "link_blackfriday_vip",
    user_id: "usr_marketing_preview",
    slug: "blackfriday-vip",
    domain_name: "lsho.cc",
    domainName: "lsho.cc",
    shortUrl: "https://lsho.cc/r/blackfriday-vip",
    target_url: "https://store.brand.com/vip-access?invite=q4_exclusive",
    targetUrl: "https://store.brand.com/vip-access?invite=q4_exclusive",
    clicks_count: 34180,
    clicksCount: 34180,
    clicks: 34180,
    unique_clicks: 26500,
    uniqueClicks: 26500,
    conversions_count: 890,
    conversionsCount: 890,
    revenue: 8900.0,
    pixels: ["Meta Pixel", "Google Tag"],
    tags: ["blackfriday", "vip", "deals"],
    og_title: "VIP Early Black Friday Access • Exclusive Tier",
    ogTitle: "VIP Early Black Friday Access • Exclusive Tier",
    og_image: "/uploads/banner_1788549676640_qxpnu.jpg",
    ogImage: "/uploads/banner_1788549676640_qxpnu.jpg",
    banner_url: "/uploads/banner_1788549676640_qxpnu.jpg",
    bannerUrl: "/uploads/banner_1788549676640_qxpnu.jpg",
    hasCustomBanner: true,
    is_active: 1,
    isActive: true,
    status: "Active",
    created_at: "2026-06-01T14:20:00.000Z",
    createdAt: "2026-06-01T14:20:00.000Z",
  },
  {
    id: "link_ios_app",
    user_id: "usr_marketing_preview",
    slug: "ios-app-launch",
    domain_name: "lsho.cc",
    domainName: "lsho.cc",
    shortUrl: "https://lsho.cc/r/ios-app-launch",
    target_url: "https://apps.apple.com/app/lshorter/id644918239",
    targetUrl: "https://apps.apple.com/app/lshorter/id644918239",
    clicks_count: 24150,
    clicksCount: 24150,
    clicks: 24150,
    unique_clicks: 21300,
    uniqueClicks: 21300,
    conversions_count: 430,
    conversionsCount: 430,
    revenue: 2150.0,
    pixels: ["TikTok Pixel"],
    tags: ["mobile", "app", "ios"],
    og_title: "Download LShorter for iOS & Android",
    ogTitle: "Download LShorter for iOS & Android",
    og_image: "/uploads/banner_1788550130779_06dci.jpg",
    ogImage: "/uploads/banner_1788550130779_06dci.jpg",
    banner_url: "/uploads/banner_1788550130779_06dci.jpg",
    bannerUrl: "/uploads/banner_1788550130779_06dci.jpg",
    hasCustomBanner: true,
    is_active: 1,
    isActive: true,
    status: "Active",
    created_at: "2026-06-18T11:00:00.000Z",
    createdAt: "2026-06-18T11:00:00.000Z",
  },
  {
    id: "link_partner_portal",
    user_id: "usr_marketing_preview",
    slug: "partner-portal",
    domain_name: "lsho.cc",
    domainName: "lsho.cc",
    shortUrl: "https://lsho.cc/r/partner-portal",
    target_url: "https://partners.lshorter.io/onboarding-2026",
    targetUrl: "https://partners.lshorter.io/onboarding-2026",
    clicks_count: 12400,
    clicksCount: 12400,
    clicks: 12400,
    unique_clicks: 11200,
    uniqueClicks: 11200,
    conversions_count: 120,
    conversionsCount: 120,
    revenue: 1200.0,
    pixels: [],
    tags: ["partners", "b2b", "security"],
    is_active: 1,
    isActive: true,
    status: "Active",
    created_at: "2026-07-02T08:15:00.000Z",
    createdAt: "2026-07-02T08:15:00.000Z",
  },
  {
    id: "link_yt_breakdown",
    user_id: "usr_marketing_preview",
    slug: "youtube-tech-breakdown",
    domain_name: "lsho.cc",
    domainName: "lsho.cc",
    shortUrl: "https://lsho.cc/r/youtube-tech-breakdown",
    target_url: "https://youtube.com/watch?v=global-edge-infra-deepdive",
    targetUrl: "https://youtube.com/watch?v=global-edge-infra-deepdive",
    clicks_count: 9850,
    clicksCount: 9850,
    clicks: 9850,
    unique_clicks: 9100,
    uniqueClicks: 9100,
    conversions_count: 0,
    conversionsCount: 0,
    revenue: 0,
    pixels: [],
    tags: ["youtube", "video", "education"],
    is_active: 1,
    isActive: true,
    status: "Active",
    created_at: "2026-07-12T16:40:00.000Z",
    createdAt: "2026-07-12T16:40:00.000Z",
  },
  {
    id: "link_q4_deck",
    user_id: "usr_marketing_preview",
    slug: "q4-enterprise-deck",
    domain_name: "lsho.cc",
    domainName: "lsho.cc",
    shortUrl: "https://lsho.cc/r/q4-enterprise-deck",
    target_url: "https://docsend.com/view/lshorter-q4-overview",
    targetUrl: "https://docsend.com/view/lshorter-q4-overview",
    clicks_count: 6720,
    clicksCount: 6720,
    clicks: 6720,
    unique_clicks: 5400,
    uniqueClicks: 5400,
    conversions_count: 65,
    conversionsCount: 65,
    revenue: 3250.0,
    pixels: ["LinkedIn Insight", "Google Tag"],
    tags: ["enterprise", "deck", "sales"],
    is_active: 1,
    isActive: true,
    status: "Active",
    created_at: "2026-07-20T10:00:00.000Z",
    createdAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "link_ai_summit",
    user_id: "usr_marketing_preview",
    slug: "ai-edge-summit-2026",
    domain_name: "lsho.cc",
    domainName: "lsho.cc",
    shortUrl: "https://lsho.cc/r/ai-edge-summit-2026",
    target_url: "https://summit.lshorter.io/register",
    targetUrl: "https://summit.lshorter.io/register",
    clicks_count: 5240,
    clicksCount: 5240,
    clicks: 5240,
    unique_clicks: 3500,
    uniqueClicks: 3500,
    conversions_count: 210,
    conversionsCount: 210,
    revenue: 1050.0,
    pixels: ["Meta Pixel", "LinkedIn Insight"],
    tags: ["webinar", "ai", "summit"],
    is_active: 1,
    isActive: true,
    status: "Active",
    created_at: "2026-08-01T13:10:00.000Z",
    createdAt: "2026-08-01T13:10:00.000Z",
  },
];

async function setupRoutes(page) {
  await page.route("**/api/auth/session*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "usr_marketing_preview",
          name: "Alexandre Vance",
          email: "alexandre@lshorter.io",
          plan: "ENTERPRISE",
          hasCompletedOnboarding: true,
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
        },
        hasCompletedOnboarding: true,
        expires: "2099-01-01T00:00:00.000Z",
      }),
    });
  });

  await page.route("**/api/links*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: mockLinks,
        total: mockLinks.length,
      }),
    });
  });

  await page.route("**/api/v1/links*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: mockLinks,
        total: mockLinks.length,
      }),
    });
  });

  await page.route("**/api/analytics*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          totalClicks: 140790,
          total_clicks: 140790,
          uniqueClicks: 126711,
          unique_clicks: 126711,
          trackedRevenue: 30750,
          tracked_revenue: 30750,
        },
      }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem("lshorter_user_id", "usr_marketing_preview");
    localStorage.setItem("lshorter_live_clicks_usr_marketing_preview", "140790");
    localStorage.setItem(
      "lshorter_cached_user",
      JSON.stringify({
        name: "Alexandre Vance",
        email: "alexandre@lshorter.io",
        plan: "ENTERPRISE",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      })
    );
    localStorage.setItem(
      "lshorter_user_profile",
      JSON.stringify({
        name: "Alexandre Vance",
        email: "alexandre@lshorter.io",
        plan: "ENTERPRISE",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      })
    );
  });
}

async function convertPngToWebp(page, pngBuffer, quality = 0.92) {
  const base64Png = pngBuffer.toString("base64");
  const webpDataUrl = await page.evaluate(
    async ({ b64, q }) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/webp", q));
        };
        img.src = `data:image/png;base64,${b64}`;
      });
    },
    { b64: base64Png, q: quality }
  );
  const webpBase64 = webpDataUrl.split(",")[1];
  return Buffer.from(webpBase64, "base64");
}

async function writeToMultipleTargets(sourceBuffer, relativePaths) {
  for (const rel of relativePaths) {
    const fullPath = path.join(__dirname, "../public/screenshots", rel);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, sourceBuffer);
    console.log(`Saved: ${fullPath} (${sourceBuffer.length} bytes)`);
  }
}

async function capture() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  for (const mode of ["dark", "light"]) {
    console.log(`\n=== Capturing Short Links in ${mode.toUpperCase()} mode (4K) ===`);
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      colorScheme: mode,
      deviceScaleFactor: 2, // 3840x2160
    });
    const page = await context.newPage();
    await setupRoutes(page);

    await page.goto("http://localhost:3000/dashboard/links?playwright_preview=1&userId=usr_marketing_preview", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    await page.waitForTimeout(2000);

    // Apply theme & strip debugging/toast overlays
    await page.evaluate((m) => {
      localStorage.setItem("lshorter_theme_v2", m);
      localStorage.setItem("lshorter_theme", m);
      localStorage.setItem("theme", m);
      if (m === "dark") {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        document.documentElement.style.colorScheme = "light";
      }
      window.dispatchEvent(new Event("storage"));

      const style = document.createElement("style");
      style.innerHTML = `
        nextjs-portal,
        #nextjs-dev-tools,
        [data-nextjs-toast],
        [data-nextjs-dialog],
        [data-tanstack-query-devtools],
        .tsqd-parent-container {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }, mode);

    await page.waitForTimeout(800);

    // 1. Normal 16:9 4K Screenshot
    const normalPngBuf = await page.screenshot({ fullPage: false });
    const normalWebpBuf = await convertPngToWebp(page, normalPngBuf, 0.92);

    await writeToMultipleTargets(normalPngBuf, [
      `${mode}/links/links_normal_4k.png`,
      `normal/${mode}/links/links_normal_4k.png`,
    ]);
    await writeToMultipleTargets(normalWebpBuf, [
      `${mode}/links/links_normal_4k.webp`,
      `normal/${mode}/links/links_normal_4k.webp`,
    ]);

    // 2. Fullpage 4K Screenshot
    await page.evaluate(() => {
      const vignette = document.querySelector(".ds-bottom-blur-vignette");
      if (vignette) vignette.style.display = "none";

      const scrollContainer = document.querySelector(".ds-main-scroll");
      const rightCol = scrollContainer ? scrollContainer.parentElement : null;
      const appShell = rightCol ? rightCol.parentElement : null;

      if (appShell) {
        appShell.style.height = "auto";
        appShell.style.minHeight = "100vh";
        appShell.style.overflow = "visible";
      }
      if (rightCol) {
        rightCol.style.height = "auto";
        rightCol.style.overflow = "visible";
      }
      if (scrollContainer) {
        scrollContainer.style.height = "auto";
        scrollContainer.style.overflow = "visible";
      }
      document.body.style.height = "auto";
      document.body.style.overflow = "visible";
      document.documentElement.style.height = "auto";
      document.documentElement.style.overflow = "visible";
    });

    await page.waitForTimeout(500);

    const fullpagePngBuf = await page.screenshot({ fullPage: true });
    const fullpageWebpBuf = await convertPngToWebp(page, fullpagePngBuf, 0.92);

    await writeToMultipleTargets(fullpagePngBuf, [
      `fullpage/${mode}/links/links_fullpage_4k.png`,
      `fullscreen/${mode}/links/links_fullpage_4k.png`,
    ]);
    await writeToMultipleTargets(fullpageWebpBuf, [
      `fullpage/${mode}/links/links_fullpage_4k.webp`,
      `fullscreen/${mode}/links/links_fullpage_4k.webp`,
    ]);

    await context.close();
  }

  await browser.close();
  console.log("\nAll 4K Short Links screenshots successfully captured and converted to WebP!");
}

capture().catch((err) => {
  console.error("Capture failure:", err);
  process.exit(1);
});
