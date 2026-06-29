// Industrialized UI/UX capture for ThePricingLibrary via Playwright (headless
// Chromium). Boots against the running preview server (localhost:4173) and
// captures key screens to scripts/_shots/. No backend agent calls are triggered
// here (avoids unknown OpenAI cost) — only static render + opening the dock.
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.TPL_BASE || 'http://localhost:4173';
const OUT = process.argv[2] || './scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(20000);

async function shot(name, opts = {}) {
  const p = `${OUT}/${name}.png`;
  await page.screenshot({ path: p, ...opts });
  log('shot', name, opts.fullPage ? '(full)' : '');
}

try {
  // 1) Home
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await shot('01-home');

  // 2) Course page — see editorial prose + demonstration + market widget
  await page.goto(`${BASE}/courses/black-scholes`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await shot('02-course-top');
  // scroll to the editorial narrative if present
  const edi = page.locator('.lesson-editorial').first();
  if (await edi.count()) {
    await edi.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await shot('03-course-editorial');
  } else { log('NOTE: .lesson-editorial not found on course page'); }
  // scroll to the demonstration proof
  const demo = page.locator('.course-equation-demo').first();
  if (await demo.count()) {
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await shot('04-course-demonstration');
  } else { log('NOTE: .course-equation-demo not found'); }
  // market widget
  const mkt = page.locator('.course-market-widget').first();
  if (await mkt.count()) {
    await mkt.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await shot('05-course-market');
  } else { log('NOTE: .course-market-widget not found (only shows on one lesson)'); }

  // 3) Agent dock — open via the FAB, capture empty state (no message sent)
  const fab = page.locator('.agui-fab, button:has(.icon-sparkles)').first();
  if (await fab.count()) {
    await fab.click();
    await page.waitForTimeout(1000);
    const panel = page.locator('.agui-panel').first();
    if (await panel.count()) await panel.screenshot({ path: `${OUT}/06-agent-dock.png` });
    else await shot('06-agent-dock');
    log('shot 06-agent-dock');
  } else { log('NOTE: agent FAB not found'); }

  // 4) Mobile view of the course page
  const m = await ctx.newPage();
  await m.setViewportSize({ width: 390, height: 844 });
  await m.goto(`${BASE}/courses/black-scholes`, { waitUntil: 'networkidle' });
  await m.waitForTimeout(2000);
  await m.screenshot({ path: `${OUT}/07-course-mobile.png` });
  log('shot 07-course-mobile');

  log('DONE. Screens in', OUT);
} catch (e) {
  log('CAPTURE ERROR:', e.message);
} finally {
  await browser.close();
}
