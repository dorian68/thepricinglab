import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.TPL_BASE || 'http://localhost:4174';
const OUT = './scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);

const badReqs = [];
page.on('requestfailed', (r) => badReqs.push(`FAILED ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) badReqs.push(`${r.status()} ${r.url()}`); });
const consoleErrs = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });

try {
  await page.goto(`${BASE}/agent-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // let default oil RFQ + market ctx + ticker settle
  await page.screenshot({ path: `${OUT}/agent-room-real-desktop.png`, fullPage: true });
  log('shot agent-room-real-desktop');

  // verify WTI value rendered in Market Context
  const ctxText = await page.locator('text=Crude Oil (WTI)').first().textContent().catch(() => null);
  log('Market Context label:', ctxText);

  // GOAL A: live submit
  const ta = page.locator('textarea').first();
  await ta.fill('Hedge rising rates over 2 years');
  await page.locator('form button[type="submit"]').first().click();
  // wait for the real desk result banner ("Routé vers le desk")
  await page.waitForSelector('text=Routé vers le desk', { timeout: 30000 }).catch((e) => log('no desk banner:', e.message));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/agent-room-submit.png`, fullPage: true });
  log('shot agent-room-submit');

  const banner = await page.locator('text=Routé vers le desk').first().textContent().catch(() => null);
  log('Desk banner:', banner);
  const pipeline = await page.locator('text=Pipeline multi-agents').first().isVisible().catch(() => false);
  log('Pipeline panel visible:', pipeline);
} catch (e) {
  log('CAPTURE ERROR:', e.message);
} finally {
  log('--- 4xx/failed requests ---');
  log(badReqs.length ? badReqs.join('\n') : '(none)');
  log('--- console errors ---');
  log(consoleErrs.length ? consoleErrs.join('\n') : '(none)');
  await browser.close();
}
