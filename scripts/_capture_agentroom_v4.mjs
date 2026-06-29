import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.TPL_BASE || 'http://localhost:4174';
const OUT = './scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1700 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(25000);
const consoleErrs = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });

async function submit(text) {
  const ta = page.locator('textarea').first();
  await ta.fill(text);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForSelector('text=Routé vers le desk', { timeout: 8000 }).catch(() => log('  (desk API offline — local approaches still shown)'));
  await page.waitForTimeout(2000);
}

// Read the BEST card "Prime est." and the desk-quote MID, assert they reconcile.
async function bestVsDesk(label) {
  // desk MID from the quote box
  const midTxt = await page.locator('text=/^MID /').first().innerText().catch(() => '');
  const mid = midTxt.replace(/MID\s+/, '').trim();
  // BEST card: find the approach button flagged BEST, read its "Prime est." value
  const best = await page.evaluate(() => {
    const badge = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === 'BEST');
    if (!badge) return null;
    const card = badge.closest('button');
    if (!card) return null;
    const labels = [...card.querySelectorAll('div')];
    const pl = labels.find((d) => d.textContent.trim() === 'Prime est.');
    return pl ? pl.nextElementSibling?.textContent.trim() : null;
  });
  log(`  [${label}] BEST Prime est. = ${best} | desk MID = ${mid}`);
  return { best, mid };
}

try {
  // ---- OIL ----
  await page.goto(`${BASE}/agent-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await submit("J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?");
  await page.screenshot({ path: `${OUT}/agent-room-oil-v4.png`, fullPage: true });
  log('shot agent-room-oil-v4');
  await bestVsDesk('OIL');

  // ---- RATES ----
  await page.goto(`${BASE}/agent-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await submit('Hedge rising rates over 2 years');
  await page.screenshot({ path: `${OUT}/agent-room-rates-v4.png`, fullPage: true });
  log('shot agent-room-rates-v4');
  await bestVsDesk('RATES');
  log('  rates underlying card "US Rates":', await page.locator('text=US Rates').first().isVisible().catch(() => false));
  log('  rates leftover "EUR Rates":', await page.locator('text=EUR Rates').first().isVisible().catch(() => false));
} catch (e) {
  log('CAPTURE ERROR:', e.message);
} finally {
  log('--- console errors ---');
  log(consoleErrs.length ? consoleErrs.join('\n') : '(none)');
  await browser.close();
}
