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

  await browser.close();
  console.log('Playwright captures completed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
