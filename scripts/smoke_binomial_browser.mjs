import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4183;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const shotsDirectory = path.resolve('scripts/_shots');
const outputDirectory = path.resolve('.binomial-browser-dist');
const supabaseOrigin = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const storageKey = 'sb-kjybaatgyigpqyywlmnw-auth-token';
const studentId = '00000000-0000-4000-8000-000000000027';
const encodeTokenPart = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const nowSeconds = Math.floor(Date.now() / 1_000);
const accessToken = [
  encodeTokenPart({ alg: 'HS256', typ: 'JWT' }),
  encodeTokenPart({ aud: 'authenticated', exp: nowSeconds + 3_600, iat: nowSeconds, iss: `${supabaseOrigin}/auth/v1`, role: 'authenticated', sub: studentId, email: 'binomial.contract@example.test' }),
  'contract-fixture-signature',
].join('.');
const user = {
  id: studentId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'binomial.contract@example.test',
  email_confirmed_at: '2026-07-19T00:00:00.000Z',
  confirmed_at: '2026-07-19T00:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { prenom: 'QA', nom: 'Binomial' },
  identities: [],
  created_at: '2026-07-19T00:00:00.000Z',
  updated_at: '2026-07-19T00:00:00.000Z',
  is_anonymous: false,
};
const session = { access_token: accessToken, refresh_token: 'contract-refresh', expires_at: nowSeconds + 3_600, expires_in: 3_600, token_type: 'bearer', user };
const corsHeaders = {
  'Access-Control-Allow-Origin': baseUrl,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-profile, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

if (path.dirname(outputDirectory) !== process.cwd() || path.basename(outputDirectory) !== '.binomial-browser-dist') throw new Error('Refusing unsafe Binomial build directory');

const runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.on('error', reject);
  child.on('exit', (code) => code === 0 ? resolve(output) : reject(new Error(`Command exited with ${code}: ${output.slice(-4_000)}`)));
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
  if (new URL(request.url()).pathname.startsWith('/rest/v1/profiles')) {
    return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: studentId, prenom: 'QA', nom: 'Binomial', role: 'user' }) });
  }
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
  await waitForServer(() => serverOutput.slice(-2_000), server);
  browser = await chromium.launch({ headless: true });

  await step(1, 'Anonymous Student lock', 'no session', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.route('http://127.0.0.1:8000/**', (route) => route.fulfill({ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: '{}' }));
    await page.goto(`${baseUrl}/tools/binomial`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Student plan required', exact: true }).waitFor();
    assert.equal(await page.locator('[data-binomial-lab="true"]').count(), 0);
    await context.close();
    return 'Student lock visible; lattice engine absent';
  }, 'prove inactive signed-in denial');

  await step(2, 'Inactive entitlement denial', 'valid session plus server plan=free', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await seedAuth(page); await mockSupabase(page);
    await page.route('http://127.0.0.1:8000/**', (route) => route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false, plan: 'free' }) }));
    await page.goto(`${baseUrl}/tools/binomial`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Student plan required', exact: true }).waitFor();
    assert.equal(await page.locator('[data-binomial-lab="true"]').count(), 0);
    await context.close();
    return 'profile/session metadata cannot self-grant Student access';
  }, 'unlock with bearer-bound Student entitlement');

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const criticalFailures = [];
  const calculationLeaks = [];
  let bearerObserved = false;
  let workerRequests = 0;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => {
    if (request.url().includes('binomial.worker-')) workerRequests += 1;
    if (/riskFreeRate|dividendYield|earlyExercisePremium/.test(request.postData() || '')) calculationLeaks.push(request.url());
  });
  page.on('requestfailed', (request) => { if (request.resourceType() === 'script' || request.url().includes('Binomial')) criticalFailures.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`); });
  await seedAuth(page); await mockSupabase(page);
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders });
    if (new URL(request.url()).pathname === '/billing/entitlement') {
      bearerObserved = request.headers().authorization === `Bearer ${accessToken}`;
      return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: true, plan: 'student' }) });
    }
    return route.fulfill({ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: '{}' });
  });

  await step(3, 'Student route and explicit contract', 'bearer-bound entitlement', async () => {
    await page.goto(`${baseUrl}/tools/binomial`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'American Option & CRR Lattice Lab', exact: true }).first().waitFor();
    assert.equal(bearerObserved, true);
    assert.equal(await page.locator('[data-binomial-lab="true"]').count(), 1);
    const text = await page.locator('body').innerText();
    for (const marker of ['Measure Q', 'ACT/365F', 'No probability clamping', 'N vs N−1 convergence', 'Student']) assert.ok(text.includes(marker), `missing ${marker}`);
    return 'lazy validated lab active; measure, day-count, no-clamp rule, convergence and Student tier visible';
  }, 'price and audit the default American put');

  await step(4, 'American put exercise audit', 'S=K=100; r=5%; vol=20%; N=300', async () => {
    await page.getByRole('button', { name: 'Price & audit lattice', exact: true }).click();
    await page.locator('[data-binomial-results="true"]').waitFor({ timeout: 20_000 });
    const text = await page.locator('[data-binomial-results="true"]').innerText();
    assert.match(text, /american put · 300 steps/i);
    assert.match(text, /USD 6\.0[78]/);
    assert.match(text, /Early-exercise premium\s+USD 0\.[45-6]/i);
    assert.match(text, /European same-tree/i);
    assert.match(text, /p\*\s+0\./i);
    assert.ok(workerRequests >= 1, 'worker asset was not requested');
    await page.getByRole('tab', { name: 'Exercise', exact: true }).click();
    const exerciseText = await page.locator('[data-binomial-results="true"]').innerText();
    assert.match(exerciseText, /Optimal exercise frontier/);
    assert.match(exerciseText, /exercise nodes; first at step/);
    assert.ok(await page.locator('[data-binomial-results="true"] svg').count() > 0);
    return `price, same-tree European value, positive premium and inspectable frontier visible; worker=${workerRequests}`;
  }, 'inspect Greeks and retained node decisions');

  await step(5, 'Greeks and node-level evidence', 'same canonical American-put run', async () => {
    await page.getByRole('tab', { name: 'Greeks', exact: true }).click();
    const greekText = await page.locator('[data-binomial-results="true"]').innerText();
    for (const marker of ['Delta', 'Gamma', 'Vega', 'Theta', 'Rho', 'Signed position', 'per +1 vol point']) assert.ok(greekText.includes(marker), `missing ${marker}`);
    await page.getByRole('tab', { name: 'Node audit', exact: true }).click();
    const nodeText = await page.locator('[data-binomial-node-table="true"]').innerText();
    for (const marker of ['Intrinsic', 'Continuation', 'Option value', 'Decision', 'hold']) assert.ok(nodeText.includes(marker), `missing node marker ${marker}`);
    return 'five convention-labelled Greeks and retained intrinsic/continuation/decision nodes visible';
  }, 'prove dividend-call exercise and downloadable evidence');

  let dividendAnalysisId = '';
  await step(6, 'Dividend-call frontier and evidence', 'q=12%; K=90; American call', async () => {
    await page.getByRole('button', { name: 'Dividend call', exact: true }).click();
    await page.getByRole('button', { name: 'Price & audit lattice', exact: true }).click();
    await page.locator('[data-binomial-results="true"]').waitFor({ timeout: 20_000 });
    const text = await page.locator('[data-binomial-results="true"]').innerText();
    assert.match(text, /american call · 300 steps/i);
    assert.match(text, /Early-exercise premium\s+USD [3-9]/i);
    await page.getByRole('tab', { name: 'Exercise', exact: true }).click();
    assert.match(await page.locator('[data-binomial-results="true"]').innerText(), /Boundary is lowest exercised spot by date/);
    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON', exact: true }).click()]);
    const json = JSON.parse(await downloadText(jsonDownload));
    dividendAnalysisId = json.analysisId;
    assert.ok(json.valuation.earlyExercisePremiumPerUnit > 3);
    assert.ok(json.earlyExercise.boundary.length > 250);
    const [convergenceDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Convergence CSV', exact: true }).click()]);
    const convergenceCsv = await downloadText(convergenceDownload);
    assert.match(convergenceCsv, /^schemaVersion,engineVersion,analysisId,exerciseStyle,optionType,steps,pricePerUnit,europeanPricePerUnit,blackScholesBenchmark,absoluteBenchmarkError\n/);
    assert.ok(convergenceCsv.includes(dividendAnalysisId));
    const [frontierDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Frontier CSV', exact: true }).click()]);
    const frontierCsv = await downloadText(frontierDownload);
    assert.match(frontierCsv, /^schemaVersion,engineVersion,analysisId,optionType,step,timeYears,boundarySpot,exerciseNodeCount\n/);
    assert.ok(frontierCsv.includes(dividendAnalysisId));
    return `positive call premium, >250 frontier dates and SHA-bound JSON/two CSV exports verified (${dividendAnalysisId.slice(0, 12)})`;
  }, 'benchmark a European contract against Black-Scholes');

  await step(7, 'European benchmark honesty', 'European ATM call; N=1000', async () => {
    await page.getByRole('button', { name: 'European benchmark', exact: true }).click();
    await page.getByRole('button', { name: 'Price & audit lattice', exact: true }).click();
    await page.locator('[data-binomial-results="true"]').waitFor({ timeout: 20_000 });
    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON', exact: true }).click()]);
    const json = JSON.parse(await downloadText(jsonDownload));
    assert.equal(json.input.exerciseStyle, 'european');
    assert.equal(json.input.steps, 1_000);
    assert.ok(json.valuation.benchmarkAbsoluteError < 0.003);
    await page.getByRole('tab', { name: 'Exercise', exact: true }).click();
    assert.match(await page.locator('[data-binomial-results="true"]').innerText(), /Only terminal payoff is exercisable/);
    return `CRR=${json.valuation.pricePerUnit.toFixed(6)}; BS error=${json.valuation.benchmarkAbsoluteError.toExponential(2)}; exercise limitation explicit`;
  }, 'reject an invalid no-arbitrage probability without stale output');

  await step(8, 'Fail-closed stale clearing', 'vol=1%; r=15%; N=5', async () => {
    const historyBefore = await page.getByText(/^Run \d+$/).count();
    await page.getByLabel('Binomial volatility').fill('1');
    await page.getByLabel('Binomial risk-free rate').fill('15');
    await page.getByLabel('Binomial steps').fill('5');
    assert.equal(await page.locator('[data-binomial-results="true"]').count(), 0, 'input edit retained stale results');
    await page.getByRole('button', { name: 'Price & audit lattice', exact: true }).click();
    await page.locator('[data-binomial-error="true"]').waitFor();
    assert.match(await page.locator('[data-binomial-error="true"]').innerText(), /outside \[0,1\]/);
    assert.equal(await page.locator('[data-binomial-results="true"]').count(), 0);
    assert.equal(await page.getByText(/^Run \d+$/).count(), historyBefore, 'invalid attempt entered successful history');
    return 'invalid probability rejected; stale result cleared; successful history unchanged';
  }, 'verify mobile layout and local-data privacy');

  await step(9, 'Mobile layout and privacy gate', '390×844 American-put run', async () => {
    await page.getByRole('button', { name: 'American put', exact: true }).click();
    await page.getByRole('button', { name: 'Price & audit lattice', exact: true }).click();
    await page.locator('[data-binomial-results="true"]').waitFor({ timeout: 20_000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll('[data-binomial-lab="true"] *')].map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName, text: (element.textContent || '').trim().slice(0, 80), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), className: typeof element.className === 'string' ? element.className.slice(0, 120) : '' };
      }).filter((item) => item.right > document.documentElement.clientWidth + 1 || item.left < -1).slice(0, 12),
      containers: ['html', 'body', '#root', '.top-strip', '.top-strip-inner', '.ticker', 'main', '[data-binomial-lab="true"]'].map((selector) => {
        const element = document.querySelector(selector); if (!element) return { selector, missing: true };
        const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
        return { selector, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), overflowX: style.overflowX, minWidth: style.minWidth, maxWidth: style.maxWidth };
      }),
    }));
    assert.deepEqual({ viewport: dimensions.viewport, document: dimensions.document }, { viewport: 390, document: 390 }, `mobile overflow: ${JSON.stringify({ offenders: dimensions.offenders, containers: dimensions.containers })}`);
    const runButton = page.getByRole('button', { name: 'Price & audit lattice', exact: true });
    await runButton.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const runButtonBox = await runButton.boundingBox();
    assert.ok(runButtonBox && runButtonBox.height >= 44, `mobile run CTA height is ${runButtonBox?.height ?? 'missing'}px`);
    assert.ok(runButtonBox.y >= 0 && runButtonBox.y + runButtonBox.height <= 844 - 56, 'mobile run CTA is obscured by a viewport edge or fixed dock');
    await page.getByRole('tab', { name: 'Exercise', exact: true }).click();
    assert.ok(await page.locator('[data-binomial-results="true"] svg').count() > 0);
    await page.screenshot({ path: path.join(shotsDirectory, 'binomial-mobile.png'), fullPage: true });
    assert.equal(calculationLeaks.length, 0);
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(criticalFailures, []);
    return `mobile=${dimensions.document}/${dimensions.viewport}; CTA=${Math.round(runButtonBox.height)}px; frontier visible; errors=0; calculation leaks=0`;
  }, 'independent Technical RL validation');

  console.log('[VERDICT] PASS · F-CAL-7 Student entitlement, CRR valuation, exercise frontier, Greeks, nodes, evidence, failures, mobile and privacy are production-browser-tested');
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) { server.kill(); await new Promise((resolve) => server.once('exit', resolve)); }
  await rm(outputDirectory, { recursive: true, force: true });
}
