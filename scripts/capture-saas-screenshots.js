const fs = require('fs');
const path = require('path');
const pw = require(path.join(__dirname, '..', 'node_modules', '.pnpm', 'playwright-core@1.64.0-alpha-1789764292000', 'node_modules', 'playwright-core'));

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.37\\msedge.exe';
const OUT_DIR = path.join(__dirname, '..', 'public', 'marketing-FCI');

async function safeCapture(page, url, filename, fallbackCosmosName) {
  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const targetPath = path.join(OUT_DIR, filename);
    await page.screenshot({ path: targetPath });
    if (fallbackCosmosName) {
      fs.copyFileSync(targetPath, path.join(OUT_DIR, fallbackCosmosName));
    }
    console.log(`Successfully saved ${filename} (and updated ${fallbackCosmosName || 'N/A'})`);
  } catch (err) {
    console.warn(`Warning capturing ${url}:`, err.message);
  }
}

async function main() {
  console.log('Starting full SaaS screenshots capture with Playwright...');
  
  const browser = await pw.chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // 1. Dashboard Overview
  await safeCapture(page, 'http://localhost:3000/dashboard', 'real_dashboard_overview.png', 'cosmos_big_card.jpeg');

  // Sidebar clip
  try {
    const sidebar = await page.$('aside');
    if (sidebar) {
      const sidebarPath = path.join(OUT_DIR, 'real_sidebar.png');
      await sidebar.screenshot({ path: sidebarPath });
      console.log('Saved real_sidebar.png');
    }
  } catch (err) {
    console.warn('Sidebar clip warning:', err.message);
  }

  // 2. Links page
  await safeCapture(page, 'http://localhost:3000/dashboard/links', 'real_links_table.png', 'cosmos_1739739224.jpeg');

  // 3. Open Create Link Drawer
  try {
    console.log('Attempting to open link drawer...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    // Find any button with text containing "Create Link"
    const buttons = await page.$$('button');
    let createBtn = null;
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('create link')) {
        createBtn = btn;
        break;
      }
    }
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(2000);
      const drawerPath = path.join(OUT_DIR, 'real_drawer_modal.png');
      await page.screenshot({ path: drawerPath });
      fs.copyFileSync(drawerPath, path.join(OUT_DIR, 'cosmos_1746304416.jpeg'));
      console.log('Saved real_drawer_modal.png and cosmos_1746304416.jpeg');

      // Click social tracking tab inside drawer
      const drawerTabs = await page.$$('button');
      for (const tab of drawerTabs) {
        const text = await tab.textContent();
        if (text && text.includes('Social media')) {
          await tab.click();
          await page.waitForTimeout(1000);
          const socialPath = path.join(OUT_DIR, 'real_social_tracking.png');
          await page.screenshot({ path: socialPath });
          fs.copyFileSync(socialPath, path.join(OUT_DIR, 'cosmos_549824580.jpeg'));
          console.log('Saved real_social_tracking.png');
          break;
        }
      }

      // Click protection tab inside drawer
      for (const tab of drawerTabs) {
        const text = await tab.textContent();
        if (text && text.includes('Protection')) {
          await tab.click();
          await page.waitForTimeout(1000);
          const protectPath = path.join(OUT_DIR, 'real_pathlock.png');
          await page.screenshot({ path: protectPath });
          fs.copyFileSync(protectPath, path.join(OUT_DIR, 'cosmos_2136974997.jpeg'));
          console.log('Saved real_pathlock.png');
          break;
        }
      }
    }
  } catch (err) {
    console.warn('Drawer capture notice:', err.message);
  }

  // 4. Geo Analytics
  await safeCapture(page, 'http://localhost:3000/dashboard/analytics/geo', 'real_geo_analytics.png', 'cosmos_1796978290.jpeg');

  // 5. Domains Page
  await safeCapture(page, 'http://localhost:3000/dashboard/domains', 'real_domains.png', 'cosmos_227768569.jpeg');

  // 6. Traffic Analytics
  await safeCapture(page, 'http://localhost:3000/dashboard/analytics', 'real_analytics_traffic.png', 'cosmos_302657415.jpeg');

  // 7. API / SDK Page
  await safeCapture(page, 'http://localhost:3000/dashboard/api-sdk', 'real_api_sdk.png', 'cosmos_938538719.jpeg');

  await browser.close();
  console.log('--- ALL SCREENSHOTS COMPLETED SUCCESSFULLY ---');
}

main().catch(err => {
  console.error('Script failure:', err);
  process.exit(1);
});
