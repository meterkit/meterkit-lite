import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const run = async (): Promise<void> => {
  mkdirSync('docs', { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4310', { waitUntil: 'networkidle' });
  await page.locator('.mk-lite-dashboard').waitFor();
  await page.locator('main').screenshot({ path: 'docs/lite-dashboard.png' });
  await browser.close();
  console.log('wrote docs/lite-dashboard.png');
};
run();
