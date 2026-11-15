import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4174;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
}

async function waitForPreview(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Vite preview did not become ready at ${baseUrl}`);
}

const preview = spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});

let browser;
try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  const loadedScripts = [];
  let courseScriptStatus = null;

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/assets/') && url.endsWith('.js')) loadedScripts.push(url);
    if (url.includes('/course-scripts/vanilla-options-quote.md')) courseScriptStatus = response.status();
  });

  await page.goto(`${baseUrl}/starter-kit`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Du modèle au livrable défendable.', exact: true }).waitFor();
  check(!loadedScripts.some((url) => /markdown-[^/]+\.js$/.test(url)), 'Markdown and KaTeX renderer are absent from the non-course Starter Kit load');

  await page.goto(`${baseUrl}/tools`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Quantitative Tools', exact: true }).waitFor();
  check(await page.locator('.course-card').count() === 9, 'tools index renders every declared catalogue card');
  check(await page.locator('.course-card .badge', { hasText: 'Starter' }).count() === 5, 'tools index renders all five Starter badges without a tier crash');
  const realizedCard = page.locator('.course-card', { hasText: 'Realized Volatility Lab' });
  check(await realizedCard.getByText('validated engine v1', { exact: true }).count() === 1, 'tools index exposes the validated realized-volatility engine');
  check(await page.getByText('v1.2 · stable', { exact: true }).count() === 0, 'tools index makes no global unproved stable claim');

  await page.goto(`${baseUrl}/courses/black-scholes`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Black-Scholes Model', exact: true, level: 1 }).waitFor();
  check(courseScriptStatus === 200, 'bounded Black-Scholes markdown preview loads from the production bundle');
  check(await page.getByText('Read the option ticket', { exact: true }).count() >= 1, 'anonymous course renders the bounded two-module preview');
  check(await page.getByRole('heading', { name: 'Starter plan required', exact: true }).count() === 1, 'preview states the full-course entitlement');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const mobileCourseLayout = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const layout = document.querySelector('.course-detail-layout')?.getBoundingClientRect();
    const reader = document.querySelector('.course-module-reader')?.getBoundingClientRect();
    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      layoutRight: layout ? Math.round(layout.right) : null,
      readerRight: reader ? Math.round(reader.right) : null,
    };
  });
  check(
    mobileCourseLayout.viewport === 390
      && mobileCourseLayout.documentWidth === 390
      && (mobileCourseLayout.layoutRight ?? 391) <= 390
      && (mobileCourseLayout.readerRight ?? 391) <= 390,
    `course mobile layout fits 390px viewport (${JSON.stringify(mobileCourseLayout)})`,
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  check(!loadedScripts.some((url) => /AgentDock-[^/]+\.js$/.test(url)), 'assistant renderer is absent from the initial route load');
  const blockedPaidAsset = await page.request.get(`${baseUrl}/course-scripts/yield-curve-bootstrapping.md`);
  check(blockedPaidAsset.status() === 404, 'legacy public URL for a paid course returns 404');

  await page.getByRole('button', { name: 'Full script', exact: true }).click();
  await page.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor();
  check(await page.locator('.course-script-shell').count() === 0, 'anonymous Script tab renders no full course shell');
  check(loadedScripts.some((url) => /markdown-[^/]+\.js$/.test(url)), 'Markdown renderer loads only for the bounded course preview');

  await page.goto(`${baseUrl}/starter-kit`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Du modèle au livrable défendable.', exact: true }).waitFor();
  check(await page.locator('[data-deliverable]').count() === 7, 'Starter Kit workspace renders exactly seven deliverables');
  check(await page.locator('[data-release-ready="false"]').count() === 1, 'Starter Kit workspace fails closed when backend availability is unavailable');
  check(await page.locator('[data-product-checkout="true"]').count() === 0, 'anonymous Starter Kit visitor receives no checkout control');
  check(await page.getByRole('link', { name: 'Créer un compte', exact: true }).count() === 1, 'anonymous Starter Kit visitor receives the account path');
  check(await page.getByText('6.120654', { exact: true }).count() === 1, 'Starter Kit workspace renders the reproducible golden price');
  check(loadedScripts.some((url) => /StarterKitPage-[^/]+\.js$/.test(url)), 'Starter Kit workspace loads as a separate production chunk');

  await page.goto(`${baseUrl}/starter-kit/cancel`, { waitUntil: 'networkidle' });
  check(await page.getByText("Le paiement a été annulé. Aucun droit produit n'a été créé.", { exact: true }).count() === 1, 'Starter Kit cancel return grants no product right');

  await page.goto(`${baseUrl}/starter-kit/success`, { waitUntil: 'networkidle' });
  check(await page.getByText('Reconnectez-vous avec le compte utilisé au paiement pour synchroniser le droit créé par le webhook signé.', { exact: true }).count() === 1, 'signed-out Starter Kit success return requires account synchronisation');
  check(pageErrors.length === 0, `journey has no uncaught page errors${pageErrors.length ? `: ${pageErrors.join('; ')}` : ''}`);

  console.log('Frontend journey smoke complete.');
} finally {
  if (browser) await browser.close();
  preview.kill('SIGTERM');
}
