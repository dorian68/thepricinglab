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
  await page.waitForTimeout(1800);
}

try {
  // ---- RATES ----
  await page.goto(`${BASE}/agent-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await submit('Hedge rising rates over 2 years');
  await page.screenshot({ path: `${OUT}/agent-room-rates-v3.png`, fullPage: true });
  log('shot agent-room-rates-v3');
  for (const t of ['Payer Swap', 'Cap', 'Swaption', 'DV01', 'BEST']) {
    log(`  rates has "${t}":`, await page.locator(`text=${t}`).first().isVisible().catch(() => false));
  }
  log('  rates has "Long Call":', await page.locator('text=Long Call').first().isVisible().catch(() => false));

  // ---- OIL (commodity BS) ----
  await page.goto(`${BASE}/agent-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await submit("J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?");
  await page.screenshot({ path: `${OUT}/agent-room-oil-v3.png`, fullPage: true });
  log('shot agent-room-oil-v3');
  for (const t of ['Long Call', 'Bull Call Spread', 'Long Future']) {
    log(`  oil has "${t}":`, await page.locator(`text=${t}`).first().isVisible().catch(() => false));
  }
} catch (e) {
  log('CAPTURE ERROR:', e.message);
} finally {
  log('--- console errors ---');
  log(consoleErrs.length ? consoleErrs.join('\n') : '(none)');
  await browser.close();
}
