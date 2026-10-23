import { chromium, devices } from 'playwright';

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const iPhone = devices['iPhone 15'];
  const context = await browser.newContext({
    ...iPhone,
    extraHTTPHeaders: {
      'x-playwright-preview': 'true',
    },
  });

  const page = await context.newPage();

  // Mock /api/links with realistic data
  await page.route('**/api/links*', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'link_1',
            slug: 'black-friday',
            target_url: 'https://store.brand.com/campaigns/promo-nov2026?ref=meta',
            domain_name: 'lsho.cc',
            clicks_count: 1842,
            unique_clicks: 1520,
            conversions_count: 48,
            revenue: 324.5,
            is_active: 1,
            created_at: '2026-10-20T10:00:00Z',
            tags: ['promo', 'meta-ads'],
            pixels: ['Meta Pixel', 'TikTok Ads'],
          },
          {
            id: 'link_2',
            slug: 'investors-deck',
            target_url: 'https://notion.so/pitch-deck-series-a-confidential-2026',
            domain_name: 'lsho.cc',
            clicks_count: 94,
            unique_clicks: 89,
            conversions_count: 0,
            revenue: 0,
            is_active: 1,
            is_password_protected: 1,
            password: 'demo',
            created_at: '2026-10-21T14:30:00Z',
            tags: ['investors'],
            pixels: [],
          },
          {
            id: 'link_3',
            slug: 'summer-beta',
            target_url: 'https://app.lshorter.com/beta-testers-signup',
            domain_name: 'lsho.cc',
            clicks_count: 420,
            unique_clicks: 390,
            conversions_count: 12,
            revenue: 0,
            is_active: 0,
            created_at: '2026-10-18T09:15:00Z',
            tags: ['beta'],
            pixels: ['Google Analytics'],
          },
        ],
      }),
    });
  });

  // Mock /api/domains
  await page.route('**/api/domains*', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'dom_1',
            domain: 'go.brand.com',
            status: 'active',
            link_count: 14,
            created_at: '2026-10-10T08:00:00Z',
            dns_records: [
              { type: 'CNAME', name: 'go', value: 'cname.lsho.cc', ttl: 'Auto' },
            ],
          },
          {
            id: 'dom_2',
            domain: 'link.startup.io',
            status: 'pending',
            link_count: 0,
            created_at: '2026-10-22T18:00:00Z',
            dns_records: [
              { type: 'CNAME', name: 'link', value: 'cname.lsho.cc', ttl: 'Auto' },
              { type: 'TXT', name: '_lshorter-verify.link.startup.io', value: 'lshorter-verify=dom_2', ttl: 'Auto' },
            ],
          },
        ],
      }),
    });
  });

  // Mock /api/analytics
  await page.route('**/api/analytics*', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          totalClicks: 2310,
          uniqueClicks: 2100,
          total_revenue: 1485.5,
          trackedRevenue: 1485.5,
          clicksByDay: [],
          topCountries: [
            { country: 'FR', clicks: 840 },
            { country: 'US', clicks: 620 },
          ],
          topCities: [],
          topDevices: [],
          topBrowsers: [],
          topReferrers: [],
          liveClickEvents: [
            {
              id: 'ev_1',
              timestamp: new Date(Date.now() - 1000 * 25).toISOString(),
              slug: 'black-friday',
              countryCode: 'FR',
              countryName: 'France',
              city: 'Paris',
              device: 'Mobile',
              os: 'iOS 18',
              browser: 'Safari',
              referrer: 'Instagram',
              customerName: 'Alexandre Martin',
              latencyMs: '2.1ms',
            },
            {
              id: 'ev_2',
              timestamp: new Date(Date.now() - 1000 * 95).toISOString(),
              slug: 'enterprise-pack',
              countryCode: 'US',
              countryName: 'United States',
              city: 'San Francisco',
              device: 'Desktop',
              os: 'macOS 15',
              browser: 'Chrome',
              referrer: 'Google Search',
              customerName: 'Sarah Jenkins',
              latencyMs: '1.9ms',
            },
            {
              id: 'ev_3',
              timestamp: new Date(Date.now() - 1000 * 180).toISOString(),
              slug: 'summer-beta',
              countryCode: 'DE',
              countryName: 'Germany',
              city: 'Berlin',
              device: 'Desktop',
              os: 'Windows 11',
              browser: 'Firefox',
              referrer: 'Twitter / X',
              latencyMs: '2.4ms',
            },
            {
              id: 'ev_4',
              timestamp: new Date(Date.now() - 1000 * 300).toISOString(),
              slug: 'black-friday',
              countryCode: 'JP',
              countryName: 'Japan',
              city: 'Tokyo',
              device: 'Mobile',
              os: 'Android 15',
              browser: 'Chrome Mobile',
              referrer: 'Direct',
              latencyMs: '3.1ms',
            },
          ],
          recentConversions: [
            {
              id: 'conv_1',
              customerName: 'Alexandre Martin',
              customerEmail: 'alex.martin@studio.fr',
              amount: 249.0,
              slug: 'black-friday',
              countryCode: 'FR',
              countryName: 'France',
              city: 'Paris',
              clicks: 4,
              created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
            },
            {
              id: 'conv_2',
              customerName: 'Sarah Jenkins',
              customerEmail: 'sarah.j@techflow.io',
              amount: 690.0,
              slug: 'enterprise-pack',
              countryCode: 'US',
              countryName: 'United States',
              city: 'San Francisco',
              clicks: 7,
              created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
            },
            {
              id: 'conv_3',
              customerName: 'Liam Chen',
              customerEmail: 'liam.chen@nexus.ca',
              amount: 120.0,
              slug: 'black-friday',
              countryCode: 'CA',
              countryName: 'Canada',
              city: 'Toronto',
              clicks: 2,
              created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            },
            {
              id: 'conv_4',
              customerName: 'Elena Rostova',
              customerEmail: 'elena@berlin-design.de',
              amount: 426.5,
              slug: 'black-friday',
              countryCode: 'DE',
              countryName: 'Germany',
              city: 'Berlin',
              clicks: 5,
              created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
            },
          ],
        },
      }),
    });
  });

  console.log('1. Capturing /dashboard/links (Short links card feed)...');
  await page.goto('http://localhost:3000/dashboard/links?playwright_preview=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Scroll data list into view
  await page.evaluate(() => {
    const el = document.querySelector('.ds-main-scroll');
    if (el) el.scrollTop = 480;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/mobile-links-feed.png', fullPage: false });
  console.log('Saved public/mobile-links-feed.png');

  // Test expanding first link card
  await page.evaluate(() => {
    const chevron = document.querySelector('.sm\\:hidden [title="Afficher les détails"]');
    if (chevron) chevron.click();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'public/mobile-links-expanded.png', fullPage: false });
  console.log('Saved public/mobile-links-expanded.png');

  console.log('2. Capturing /dashboard/domains (DNS cards)...');
  await page.goto('http://localhost:3000/dashboard/domains?playwright_preview=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const el = document.querySelector('.ds-main-scroll');
    if (el) el.scrollTop = 350;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/mobile-domains-feed.png', fullPage: false });
  console.log('Saved public/mobile-domains-feed.png');

  console.log('3. Capturing /dashboard/analytics/revenue (Customers & Revenue cards)...');
  await page.goto('http://localhost:3000/dashboard/analytics/revenue?playwright_preview=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const mobileFeed = document.querySelector('.md\\:hidden.flex.flex-col.gap-2\\.5');
    if (mobileFeed) {
      mobileFeed.scrollIntoView();
    } else {
      const el = document.querySelector('.ds-main-scroll');
      if (el) el.scrollTop = 1500;
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/mobile-revenue-feed.png', fullPage: false });
  console.log('Saved public/mobile-revenue-feed.png');

  console.log('4. Capturing /dashboard/analytics/live (Live stream mobile cards)...');
  await page.goto('http://localhost:3000/dashboard/analytics/live?playwright_preview=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => {
    const mobileFeed = document.querySelector('.md\\:hidden.flex.flex-col.gap-2\\.5');
    if (mobileFeed) {
      mobileFeed.scrollIntoView();
    } else {
      const el = document.querySelector('.ds-main-scroll');
      if (el) el.scrollTop = 900;
    }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'public/mobile-live-feed.png', fullPage: false });
  console.log('Saved public/mobile-live-feed.png');

  await browser.close();
  console.log('Playwright captures completed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
