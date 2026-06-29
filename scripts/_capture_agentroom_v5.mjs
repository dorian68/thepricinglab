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

try {
  await page.goto(`${BASE}/agent-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await submit("J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?");
  await page.screenshot({ path: `${OUT}/agent-room-oil-v5.png`, fullPage: true });
  log('shot agent-room-oil-v5');

  // badge (section 3 "right")
  const badge = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /Structurer ·/.test(s.textContent));
    return el ? el.textContent.trim() : null;
  });
  log('  Section-3 badge =', badge);

  // footer (the model statement line)
  const footer = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((d) => /Payoffs et primes calcul/.test(d.textContent) && d.children.length === 0);
    return el ? el.textContent.trim() : null;
  });
  log('  Section-3 footer =', footer);

  // routing line
  const routing = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((d) => /Routé vers le desk/.test(d.textContent) && d.children.length === 0);
    return el ? el.textContent.trim() : null;
  });
  log('  Routing line =', routing);

  // BEST prime vs desk MID
  const midTxt = await page.locator('text=/^MID /').first().innerText().catch(() => '');
  const mid = midTxt.replace(/MID\s+/, '').trim();
  const best = await page.evaluate(() => {
    const badge = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === 'BEST');
    const card = badge?.closest('button');
    const labels = card ? [...card.querySelectorAll('div')] : [];
    const pl = labels.find((d) => d.textContent.trim() === 'Prime est.');
    const name = card?.querySelector('span')?.textContent.trim();
    return { name, prime: pl ? pl.nextElementSibling?.textContent.trim() : null };
  });
  log(`  BEST card = ${best.name} | Prime est. = ${best.prime} | desk MID = ${mid}`);
} catch (e) {
  log('CAPTURE ERROR:', e.message);
} finally {
  log('--- console errors ---');
  log(consoleErrs.length ? consoleErrs.join('\n') : '(none)');
  await browser.close();
}
