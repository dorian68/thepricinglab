import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4180;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const shotsDirectory = path.resolve('scripts/_shots');
const outputDirectory = path.resolve('.payoff-browser-dist');
const supabaseOrigin = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const storageKey = 'sb-kjybaatgyigpqyywlmnw-auth-token';
const starterId = '00000000-0000-4000-8000-000000000025';

const encodeTokenPart = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const nowSeconds = Math.floor(Date.now() / 1_000);
const accessToken = [
  encodeTokenPart({ alg: 'HS256', typ: 'JWT' }),
  encodeTokenPart({ aud: 'authenticated', exp: nowSeconds + 3600, iat: nowSeconds, iss: `${supabaseOrigin}/auth/v1`, role: 'authenticated', sub: starterId, email: 'payoff.contract@example.test' }),
  'contract-fixture-signature',
].join('.');
const user = { id: starterId, aud: 'authenticated', role: 'authenticated', email: 'payoff.contract@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { prenom: 'QA', nom: 'Payoff' }, identities: [], created_at: '2026-07-19T00:00:00.000Z', updated_at: '2026-07-19T00:00:00.000Z', is_anonymous: false };
const session = { access_token: accessToken, refresh_token: 'contract-refresh', expires_at: nowSeconds + 3600, expires_in: 3600, token_type: 'bearer', user };
const corsHeaders = { 'Access-Control-Allow-Origin': baseUrl, 'Access-Control-Allow-Headers': 'authorization, apikey, content-profile, content-type, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

if (path.dirname(outputDirectory) !== process.cwd() || path.basename(outputDirectory) !== '.payoff-browser-dist') throw new Error('Refusing unsafe payoff build directory');

const runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve(output) : reject(new Error(`Command exited with ${code}: ${output.slice(-4000)}`)));
});
const waitForServer = async (serverOutput, serverProcess) => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) throw new Error(`Vite exited early: ${serverOutput()}`);
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Vite preview did not start: ${serverOutput()}`);
};
const step = async (number, name, input, action, next) => {
  try {
    const output = await action();
    console.log(`[STEP ${number}] ${name} · [STATUS] ok · [REQUEST] production browser journey · [INPUT] ${input} · [OUTPUT] ${output} · [ERROR] none · [NEXT] ${next}`);
  } catch (error) {
    console.error(`[STEP ${number}] ${name} · [STATUS] fail · [ERROR] ${error instanceof Error ? error.message : String(error)} · [NEXT] release blocked`);
    throw error;
  }
};
const seedAuth = (page) => page.addInitScript(({ key, authSession, authUser }) => {
  localStorage.setItem(key, JSON.stringify(authSession));
  localStorage.setItem(`${key}-user`, JSON.stringify({ user: authUser }));
}, { key: storageKey, authSession: session, authUser: user });
const mockSupabase = (page) => page.route(`${supabaseOrigin}/**`, async (route) => {
  const request = route.request();
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders });
  if (new URL(request.url()).pathname.startsWith('/rest/v1/profiles')) return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: starterId, prenom: 'QA', nom: 'Payoff', role: 'user' }) });
  return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
});
const downloadText = async (download) => readFile(await download.path(), 'utf8');
const screenshotResults = async (page, fileName) => {
  const style = await page.addStyleTag({ content: 'header.nav{position:static!important}.agui-fab{visibility:hidden!important}' });
  try { await page.locator('[data-payoff-results="true"]').screenshot({ path: path.join(shotsDirectory, fileName) }); }
  finally { await style.evaluate((element) => element.remove()); }
};

let server;
let browser;
let serverOutput = '';
try {
  await mkdir(shotsDirectory, { recursive: true });
  await rm(outputDirectory, { recursive: true, force: true });
  await runCommand(process.execPath, [viteBin, 'build', '--outDir', outputDirectory], { cwd: process.cwd(), env: { ...process.env, VITE_TPL_RAG_API_URL: 'http://127.0.0.1:8000', VITE_TPL_RUM_ENABLED: 'false' } });
  server = spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort', '--outDir', outputDirectory], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', (chunk) => { serverOutput += chunk; });
  server.stderr.on('data', (chunk) => { serverOutput += chunk; });
  await waitForServer(() => serverOutput.slice(-2000), server);
  browser = await chromium.launch({ headless: true });
  const pageErrors = [];
  const consoleErrors = [];
  const criticalFailures = [];

  await step(1, 'Anonymous Starter lock', 'no session', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.route('http://127.0.0.1:8000/**', (route) => route.fulfill({ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: '{}' }));
    await page.goto(`${baseUrl}/tools/payoff`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor();
    assert.equal(await page.locator('[data-payoff-strategy-lab="true"]').count(), 0);
    await context.close();
    return 'locked panel visible; premium calculator absent';
  }, 'prove inactive signed-in denial');

  await step(2, 'Inactive entitlement denial', 'valid session plus server plan=free', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await seedAuth(page); await mockSupabase(page);
    await page.route('http://127.0.0.1:8000/**', (route) => route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false, plan: 'free' }) }));
    await page.goto(`${baseUrl}/tools/payoff`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor();
    assert.equal(await page.locator('[data-payoff-strategy-lab="true"]').count(), 0);
    await context.close();
    return 'profile metadata cannot self-grant paid access';
  }, 'unlock using bearer-bound Starter contract');

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  let bearerObserved = false;
  const pricingPayloadLeaks = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => { if (/manualPremium|long-call|terminalPnl/.test(request.postData() || '')) pricingPayloadLeaks.push(request.url()); });
  page.on('requestfailed', (request) => { if (request.resourceType() === 'script' || request.url().includes('PayoffStrategy')) criticalFailures.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`); });
  await seedAuth(page); await mockSupabase(page);
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders });
    if (new URL(request.url()).pathname === '/billing/entitlement') {
      bearerObserved = request.headers().authorization === `Bearer ${accessToken}`;
      return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: true, plan: 'starter' }) });
    }
    return route.fulfill({ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: '{}' });
  });

  await step(3, 'Starter route and visible contract', 'bearer-bound entitlement', async () => {
    await page.goto(`${baseUrl}/tools/payoff`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Option Strategy & Terminal P&L Lab', exact: true }).first().waitFor();
    assert.equal(bearerObserved, true);
    assert.equal(await page.locator('[data-payoff-strategy-lab="true"]').count(), 1);
    assert.equal(await page.getByRole('button', { name: /Save strategy/i }).count(), 0);
    for (const text of ['Exact tails and breakevens', 'User assumptions only', 'Contract multiplier', 'Premium source']) assert.ok((await page.locator('body').innerText()).includes(text), `missing ${text}`);
    return 'dedicated lazy lab active; market, contract and premium conventions visible; fake save absent';
  }, 'run default model-premium spread');

  await step(4, 'Default spread and signed Greeks', 'model-premium bull call spread ×100', async () => {
    await page.getByRole('button', { name: 'Analyze exact strategy', exact: true }).click();
    await page.locator('[data-payoff-results="true"]').waitFor();
    const text = await page.locator('[data-payoff-results="true"]').innerText();
    assert.match(text, /Maximum profit\s+USD/i);
    assert.match(text, /Maximum loss\s+USD/i);
    assert.match(text, /SHA-256 [a-f0-9]{64}/);
    await page.getByRole('tab', { name: 'Greeks', exact: true }).click();
    const shortRow = page.getByText('Per-leg valuation audit', { exact: true }).locator('..').getByRole('row').filter({ hasText: /short 1× call/ });
    assert.match(await shortRow.locator('td').nth(4).innerText(), /^-/, 'short gamma is not negative');
    assert.match(await shortRow.locator('td').nth(5).innerText(), /^-/, 'short vega is not negative');
    return 'finite exact bounds, SHA evidence and negative short Gamma/Vega visible';
  }, 'prove naked short-call unlimited loss');

  await step(5, 'Unlimited risk and off-window roots', 'naked short then long K=200 premium=5 multiplier=1', async () => {
    await page.getByRole('button', { name: 'Naked short call', exact: true }).click();
    await page.getByRole('button', { name: 'Analyze exact strategy', exact: true }).click();
    await page.locator('[data-payoff-results="true"]').waitFor();
    assert.match(await page.locator('[data-payoff-results="true"]').innerText(), /Maximum loss\s+Unlimited/i);
    const row = page.locator('[data-payoff-leg-table="true"] tbody tr').first();
    await row.locator('select').nth(0).selectOption('long');
    await row.locator('input').nth(0).fill('200');
    await row.locator('select').nth(2).selectOption('manual');
    await row.locator('input').nth(2).fill('5');
    await page.getByLabel('Contract multiplier').fill('1');
    await page.getByRole('button', { name: 'Analyze exact strategy', exact: true }).click();
    await page.locator('[data-payoff-results="true"]').waitFor();
    const longText = await page.locator('[data-payoff-results="true"]').innerText();
    assert.match(longText, /Maximum profit\s+Unlimited/i);
    assert.match(longText, /Maximum loss\s+USD 5\.00/i);
    assert.match(longText, /Breakevens\s+205\.000/i);
    await screenshotResults(page, 'payoff-strategy-desktop.png');
    return 'short loss unlimited; long gain unlimited; K=200 root 205 found outside former 50–150 grid';
  }, 'test bounded long put and evidence downloads');

  await step(6, 'Put boundary and real exports', 'long put K=200 premium=5', async () => {
    const row = page.locator('[data-payoff-leg-table="true"] tbody tr').first();
    await row.locator('select').nth(1).selectOption('put');
    await page.getByRole('button', { name: 'Analyze exact strategy', exact: true }).click();
    await page.locator('[data-payoff-results="true"]').waitFor();
    const text = await page.locator('[data-payoff-results="true"]').innerText();
    assert.match(text, /Maximum profit\s+USD 195\.00/i);
    assert.match(text, /Maximum loss\s+USD 5\.00/i);
    assert.match(text, /Breakevens\s+195\.000/i);
    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON evidence', exact: true }).click()]);
    const json = JSON.parse(await downloadText(jsonDownload));
    assert.equal(json.bounds.maxProfit.amount, 195);
    assert.deepEqual(json.breakevens, [195]);
    const [curveDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Curve CSV', exact: true }).click()]);
    assert.match(await downloadText(curveDownload), /^schemaVersion,engineVersion,analysisId,terminalSpot,grossPayoff,terminalPnl/);
    const [scenarioDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Scenarios CSV', exact: true }).click()]);
    assert.match(await downloadText(scenarioDownload), /^schemaVersion,engineVersion,analysisId,terminalSpot,grossPayoff,terminalPnl,legContributions/);
    return 'S_T=0 bound yields max profit USD 195; JSON and two CSV exports validated';
  }, 'reject invalid quantity and clear stale results');

  await step(7, 'Fail-closed stale clearing', 'fractional contract quantity', async () => {
    const row = page.locator('[data-payoff-leg-table="true"] tbody tr').first();
    await row.locator('input').nth(1).fill('1.5');
    assert.equal(await page.locator('[data-payoff-results="true"]').count(), 0, 'input edit retained stale result');
    await page.getByRole('button', { name: 'Analyze exact strategy', exact: true }).click();
    await page.locator('[data-payoff-error="true"]').waitFor();
    assert.match(await page.locator('[data-payoff-error="true"]').innerText(), /positive safe integer/);
    assert.equal(await page.locator('[data-payoff-results="true"]').count(), 0);
    return 'invalid quantity rejected and no stale result/history success rendered';
  }, 'verify mobile layout and privacy');

  await step(8, 'History currency and monotone runs', 'ten successful runs across USD/EUR/GBP with an eight-row cap', async () => {
    const row = page.locator('[data-payoff-leg-table="true"] tbody tr').first();
    await row.locator('input').nth(1).fill('1');
    await page.getByLabel('Currency').fill('EUR');
    await page.getByRole('button', { name: 'Analyze exact strategy', exact: true }).click();
    await page.locator('[data-payoff-results="true"]').waitFor();
    await page.getByLabel('Currency').fill('GBP');
    for (let run = 0; run < 5; run += 1) {
      await page.getByRole('button', { name: 'Analyze exact strategy', exact: true }).click();
      await page.locator('[data-payoff-results="true"]').waitFor();
    }
    await page.getByRole('tab', { name: 'Audit & history', exact: true }).click();
    const history = page.locator('[data-payoff-history="true"]');
    const historyText = await history.innerText();
    assert.equal(await history.locator('[data-payoff-history-run]').count(), 8, 'history cap is not eight successful runs');
    assert.match(historyText, /Run 10 · 1 legs/, 'run number did not remain monotone after reaching the history cap');
    assert.match(historyText, /Net debit EUR 5\.00/, 'historical EUR premium was reformatted with the current currency');
    assert.match(historyText, /Net debit GBP 5\.00/, 'current GBP history amount is missing');
    return 'eight-entry cap retained; run advanced to 10; EUR and GBP stayed attached to their own analyses';
  }, 'verify mobile layout and privacy');

  await step(9, 'Mobile layout and privacy gate', '390×844 valid long put', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.documentElement.scrollWidth === document.documentElement.clientWidth, undefined, { timeout: 3000 });
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
    if (dimensions.document !== dimensions.viewport) {
      const offenders = await page.evaluate(() => [...document.querySelectorAll('*')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, className: String(element.className).slice(0, 180), width: Math.round(rect.width), right: Math.round(rect.right), scrollWidth: element.scrollWidth };
        })
        .filter((item) => item.right > document.documentElement.clientWidth + 1 || item.width > document.documentElement.clientWidth + 1)
        .sort((left, right) => right.right - left.right)
        .slice(0, 12));
      console.log('[MOBILE OVERFLOW]', JSON.stringify(offenders));
    }
    assert.deepEqual(dimensions, { viewport: 390, document: 390 });
    const sticky = await page.locator('[data-payoff-leg-table="true"] tbody td').first().evaluate((element) => getComputedStyle(element).position);
    assert.equal(sticky, 'sticky');
    await page.getByRole('tab', { name: 'P&L profile', exact: true }).click();
    await page.locator('[data-payoff-chart="true"] svg').first().waitFor({ state: 'visible' });
    await screenshotResults(page, 'payoff-strategy-mobile.png');
    assert.equal(pricingPayloadLeaks.length, 0);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(criticalFailures, []);
    return `mobile=${dimensions.document}/${dimensions.viewport}; sticky leg column; local analysis; errors=0; pricing leaks=0`;
  }, 'independent Technical RL revalidation');

  console.log('[VERDICT] PASS · F-CAL-5 Starter entitlement, exact tails, signed Greeks, exports, durable history, failures, mobile and privacy are production-browser-tested');
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { server.kill(); await new Promise((resolve) => server.once('exit', resolve)); }
  await rm(outputDirectory, { recursive: true, force: true });
}
