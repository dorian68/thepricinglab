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
  await page.waitForSelector('text=Routé vers le desk', { timeout: 12000 }).catch(() => log('  (desk API offline — local approaches still shown)'));
  await page.waitForTimeout(2500);
}

try {
  await page.goto(`${BASE}/agent-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await submit("J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?");
  await page.screenshot({ path: `${OUT}/agent-room-oil-v6.png`, fullPage: true });
  log('shot agent-room-oil-v6');

  const footer = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((d) => /Payoffs et primes calcul/.test(d.textContent) && d.children.length === 0);
    return el ? el.textContent.trim() : null;
  });
  log('  Section-3 footer =', footer);

  const midTxt = await page.locator('text=/^MID /').first().innerText().catch(() => '');
  const mid = midTxt.replace(/MID\s+/, '').trim();

  // BEST + Bull Call Spread prime est. from the cards
  const cards = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('button').forEach((card) => {
      const name = card.querySelector('span')?.textContent?.trim();
      if (!name) return;
      const pl = [...card.querySelectorAll('div')].find((d) => d.textContent.trim() === 'Prime est.');
      if (pl) out[name] = pl.nextElementSibling?.textContent.trim();
    });
    return out;
  });
  log(`  desk MID = ${mid}`);
  log(`  BEST Long Call Prime est. = ${cards['Long Call']}`);
  log(`  Bull Call Spread Prime est. = ${cards['Bull Call Spread']}`);

  // Recompute ATM reconciliation from the footer's stated forward + vol
  const m = footer && footer.match(/forward ([\d.,]+).*?vol [^\d]*([\d.]+)%/);
  if (m) {
    const F = parseFloat(m[1].replace(/,/g, ''));
    const sig = parseFloat(m[2]) / 100;
    const T = (parseFloat((footer.match(/T=([\d.]+)a/) || [])[1]) || 0.42);
    const r = 0.04;
    const nc = (x) => { const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911; const s=x<0?-1:1; x=Math.abs(x)/Math.SQRT2; const t=1/(1+p*x); const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x); return 0.5*(1+s*y); };
    const d1=(Math.log(F/F)+0.5*sig*sig*T)/(sig*Math.sqrt(T)), d2=d1-sig*Math.sqrt(T);
    const atm = Math.exp(-r*T)*(F*nc(d1)-F*nc(d2));
    log(`  Recomputed Black-76 ATM(F=${F}, K=F, vol=${(sig*100).toFixed(1)}%, T=${T}) = ${atm.toFixed(3)}  (should ≈ desk MID ${mid})`);
  } else {
    log('  (could not parse forward/vol from footer)');
  }
} catch (e) {
  log('CAPTURE ERROR:', e.message);
} finally {
  log('--- console errors ---');
  log(consoleErrs.length ? consoleErrs.join('\n') : '(none)');
  await browser.close();
}
