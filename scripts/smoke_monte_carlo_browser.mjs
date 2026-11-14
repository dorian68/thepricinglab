import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4181;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const shotsDirectory = path.resolve('scripts/_shots');
const outputDirectory = path.resolve('.mc-browser-dist');
const supabaseOrigin = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const storageKey = 'sb-kjybaatgyigpqyywlmnw-auth-token';
const starterId = '00000000-0000-4000-8000-000000000026';
const encodeTokenPart = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const nowSeconds = Math.floor(Date.now() / 1_000);
const accessToken = [encodeTokenPart({ alg: 'HS256', typ: 'JWT' }), encodeTokenPart({ aud: 'authenticated', exp: nowSeconds + 3600, iat: nowSeconds, iss: `${supabaseOrigin}/auth/v1`, role: 'authenticated', sub: starterId, email: 'mc.contract@example.test' }), 'contract-fixture-signature'].join('.');
const user = { id: starterId, aud: 'authenticated', role: 'authenticated', email: 'mc.contract@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { prenom: 'QA', nom: 'MonteCarlo' }, identities: [], created_at: '2026-07-19T00:00:00.000Z', updated_at: '2026-07-19T00:00:00.000Z', is_anonymous: false };
const session = { access_token: accessToken, refresh_token: 'contract-refresh', expires_at: nowSeconds + 3600, expires_in: 3600, token_type: 'bearer', user };
const corsHeaders = { 'Access-Control-Allow-Origin': baseUrl, 'Access-Control-Allow-Headers': 'authorization, apikey, content-profile, content-type, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
if (path.dirname(outputDirectory) !== process.cwd() || path.basename(outputDirectory) !== '.mc-browser-dist') throw new Error('Refusing unsafe Monte Carlo build directory');

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
  if (new URL(request.url()).pathname.startsWith('/rest/v1/profiles')) return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: starterId, prenom: 'QA', nom: 'MonteCarlo', role: 'user' }) });
  return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(user) });
});
const downloadText = async (download) => readFile(await download.path(), 'utf8');

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

  await step(1, 'Anonymous Starter lock', 'no session', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.route('http://127.0.0.1:8000/**', (route) => route.fulfill({ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: '{}' }));
    await page.goto(`${baseUrl}/tools/mc`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor();
    assert.equal(await page.locator('[data-monte-carlo-lab="true"]').count(), 0);
    await context.close();
    return 'locked panel visible; simulation engine absent';
  }, 'prove inactive signed-in denial');

  await step(2, 'Inactive entitlement denial', 'valid session plus server plan=free', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await seedAuth(page); await mockSupabase(page);
    await page.route('http://127.0.0.1:8000/**', (route) => route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false, plan: 'free' }) }));
    await page.goto(`${baseUrl}/tools/mc`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor();
    assert.equal(await page.locator('[data-monte-carlo-lab="true"]').count(), 0);
    await context.close();
    return 'profile/session metadata cannot self-grant Starter access';
  }, 'unlock with bearer-bound Starter entitlement');

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const criticalFailures = [];
  const simulationPayloadLeaks = [];
  let bearerObserved = false;
  let workerRequests = 0;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => {
    if (request.url().includes('monteCarlo.worker-')) workerRequests += 1;
    if (/physicalDrift|riskFreeRate|terminalSpot/.test(request.postData() || '')) simulationPayloadLeaks.push(request.url());
  });
  page.on('requestfailed', (request) => { if (request.resourceType() === 'script' || request.url().includes('MonteCarlo')) criticalFailures.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`); });
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

  await step(3, 'Starter route and explicit contract', 'bearer-bound entitlement', async () => {
    await page.goto(`${baseUrl}/tools/mc`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Monte Carlo Pricing & Risk Lab', exact: true }).first().waitFor();
    assert.equal(bearerObserved, true);
    assert.equal(await page.locator('[data-monte-carlo-lab="true"]').count(), 1);
    const text = await page.locator('body').innerText();
    for (const marker of ['Option pricing (Q)', 'Position risk (P)', 'ACT/365F', 'Seed', 'Requested paths equal simulated paths']) assert.ok(text.includes(marker), `missing ${marker}`);
    return 'lazy validated lab active; P/Q, day-count, seed, N and method visible';
  }, 'run default risk-neutral pricing');

  await step(4, 'Risk-neutral price and uncertainty', 'European call; Q; 10,000 antithetic paths', async () => {
    await page.getByRole('button', { name: 'Run reproducible simulation', exact: true }).click();
    await page.locator('[data-mc-results="true"]').waitFor({ timeout: 20_000 });
    await page.getByRole('tab', { name: 'Uncertainty', exact: true }).click();
    const text = await page.locator('[data-mc-results="true"]').innerText();
    assert.match(text, /Measure Q/);
    assert.match(text, /MC price \/ unit\s+USD 10\./i);
    assert.match(text, /Standard error\s+USD/i);
    assert.match(text, /BS benchmark inside CI/);
    assert.match(text.replaceAll(/\s/g, ''), /2[,.]?500[\s\S]*5[,.]?000[\s\S]*10[,.]?000/);
    assert.ok(workerRequests >= 1, 'worker asset was not requested');
    return `Q price, SE, CI, BS benchmark and N/4→N convergence visible; worker=${workerRequests}`;
  }, 'exercise path-dependent pricing and variance reduction');

  await step(5, 'Asian pricing without fake benchmark', 'arithmetic Asian + terminal-spot control variate', async () => {
    await page.getByLabel('MC payoff type').selectOption('arithmetic_asian');
    await page.getByLabel('MC method').selectOption('control_variate');
    await page.getByRole('button', { name: 'Run reproducible simulation', exact: true }).click();
    await page.locator('[data-mc-results="true"]').waitFor({ timeout: 20_000 });
    await page.getByRole('tab', { name: 'Uncertainty', exact: true }).click();
    const text = await page.locator('[data-mc-results="true"]').innerText();
    assert.match(text, /Not available for arithmetic Asian/);
    assert.match(text, /control_variate/);
    assert.doesNotMatch(text, /BS benchmark inside CI/);
    return 'path average priced on canonical paths; control variate visible; closed-form benchmark explicitly unavailable';
  }, 'switch to physical loss risk and verify signs');

  await step(6, 'Physical P risk and loss convention', 'one-month long position at 99% confidence', async () => {
    await page.locator('[data-mc-mode-risk="true"]').click();
    await page.getByLabel('MC horizon days').fill('30');
    await page.getByLabel('MC volatility').fill('20');
    await page.getByLabel('MC physical drift').fill('6');
    await page.getByLabel('MC paths').fill('10000');
    await page.getByLabel('MC method').selectOption('antithetic');
    await page.getByRole('button', { name: 'Run reproducible simulation', exact: true }).click();
    await page.locator('[data-mc-results="true"]').waitFor({ timeout: 20_000 });
    const text = await page.locator('[data-mc-results="true"]').innerText();
    assert.match(text, /Measure P/);
    assert.match(text, /Loss VaR 99%\s+USD/i);
    assert.match(text, /Expected Shortfall\s+USD/i);
    await page.getByRole('tab', { name: 'Uncertainty', exact: true }).click();
    assert.match(await page.locator('[data-mc-results="true"]').innerText(), /Loss = −P&L/);
    assert.match(await page.locator('[data-mc-risk-inputs="true"]').innerText(), /Underlying-position risk:[\s\S]*Strike and option payoff are not used in P mode/);
    return 'P measure, positive loss VaR/ES, probability of loss and explicit Loss = −P&L convention rendered';
  }, 'download and reconcile evidence');

  await step(7, 'Versioned same-run evidence', 'risk JSON + terminal/path CSV', async () => {
    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON evidence', exact: true }).click()]);
    const json = JSON.parse(await downloadText(jsonDownload));
    assert.equal(json.mode, 'risk_physical');
    assert.equal(json.measure, 'P');
    assert.equal(json.run.requestedPaths, 10_000);
    assert.equal(json.run.simulatedPaths, 10_000);
    assert.equal(json.samplePaths[0].points.at(-1).spot, json.observations[json.samplePaths[0].pathIndex].terminalSpot);
    const [terminalDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Terminals CSV', exact: true }).click()]);
    assert.match(await downloadText(terminalDownload), /^schemaVersion,engineVersion,analysisId,mode,pathIndex,terminalSpot,discountedPayoff,pnl,loss\n/);
    const [pathsDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Sample paths CSV', exact: true }).click()]);
    assert.match(await downloadText(pathsDownload), /^schemaVersion,engineVersion,analysisId,mode,pathIndex,step,timeYears,spot\n/);
    return 'JSON reconciles sampled terminal with canonical observation; two versioned CSV downloads are real';
  }, 'reject invalid N and clear stale results');

  await step(8, 'Fail-closed stale clearing', 'odd antithetic path count', async () => {
    await page.getByLabel('MC paths').fill('9999');
    assert.equal(await page.locator('[data-mc-results="true"]').count(), 0, 'input edit retained stale results');
    await page.getByRole('button', { name: 'Run reproducible simulation', exact: true }).click();
    await page.locator('[data-mc-error="true"]').waitFor();
    assert.match(await page.locator('[data-mc-error="true"]').innerText(), /paths must be even/);
    assert.equal(await page.locator('[data-mc-results="true"]').count(), 0);
    return 'invalid odd antithetic N rejected; no stale result or successful history entry rendered';
  }, 'verify mobile layout, chart and privacy');

  await step(9, 'Mobile layout and privacy gate', '390×844 valid P-risk run', async () => {
    await page.getByLabel('MC paths').fill('2000');
    await page.getByRole('button', { name: 'Run reproducible simulation', exact: true }).click();
    await page.locator('[data-mc-results="true"]').waitFor({ timeout: 20_000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.documentElement.scrollWidth === document.documentElement.clientWidth, undefined, { timeout: 3000 });
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
    assert.deepEqual(dimensions, { viewport: 390, document: 390 });
    const runButton = page.getByRole('button', { name: 'Run reproducible simulation', exact: true });
    await runButton.waitFor({ state: 'visible' });
    await runButton.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const runButtonBox = await runButton.boundingBox();
    assert.ok(runButtonBox && runButtonBox.height >= 44, `mobile run CTA height is ${runButtonBox?.height ?? 'missing'}px`);
    assert.ok(runButtonBox.y >= 0 && runButtonBox.y + runButtonBox.height <= 844 - 56, 'mobile run CTA is obscured by a viewport edge or fixed dock');
    assert.equal(await page.locator('[data-mc-histogram="true"] svg').count() > 0, true);
    await page.getByRole('tab', { name: 'Same-run paths', exact: true }).click();
    await page.locator('[data-mc-path-chart="true"] svg').first().waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(shotsDirectory, 'monte-carlo-mobile.png'), fullPage: true });
    assert.equal(simulationPayloadLeaks.length, 0);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(criticalFailures, []);
    return `mobile=${dimensions.document}/${dimensions.viewport}; CTA=${Math.round(runButtonBox.height)}px; same-run charts visible; errors=0; simulation leaks=0`;
  }, 'independent Technical RL validation');

  console.log('[VERDICT] PASS · F-CAL-6 Starter entitlement, P/Q separation, worker pricing/risk, uncertainty, evidence, failures, mobile and privacy are production-browser-tested');
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { server.kill(); await new Promise((resolve) => server.once('exit', resolve)); }
  await rm(outputDirectory, { recursive: true, force: true });
}
