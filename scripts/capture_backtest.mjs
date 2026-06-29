// Capture the REAL Trading Lab backtest panel. Boots against the preview server
// and the live FastAPI backend (127.0.0.1:8000). Runs a real backtest + walk-
// forward when the backend is up; otherwise captures the honest backend-required
// state. Output: scripts/_shots/trading-lab-backtest.png
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = process.env.TPL_BASE || 'http://localhost:4180';
const OUT = './scripts/_shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.setDefaultTimeout(30000);

await page.goto(`${BASE}/lab/backtest`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Try to run a real backtest if the Run button is enabled (backend up).
try {
  const runBtn = page.getByRole('button', { name: /Run backtest/i }).first();
  if (await runBtn.count() && await runBtn.isEnabled()) {
    await runBtn.click();
    await page.waitForTimeout(12000); // engine subprocess
    const wfBtn = page.getByRole('button', { name: /Walk-forward/i }).first();
    if (await wfBtn.count() && await wfBtn.isEnabled()) {
      await wfBtn.click();
      await page.waitForTimeout(25000); // walk-forward is heavier
    }
  } else {
    console.log('Run button disabled -> capturing honest backend-required state');
  }
} catch (e) {
  console.log('interaction note:', e.message);
}

await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/trading-lab-backtest.png`, fullPage: true });
console.log('shot trading-lab-backtest.png');
await browser.close();
