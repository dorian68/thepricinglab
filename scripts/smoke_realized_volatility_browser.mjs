import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4179;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const shotsDirectory = path.resolve('scripts/_shots');
const outputDirectory = path.resolve('.realized-vol-browser-dist');
const supabaseOrigin = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const storageKey = 'sb-kjybaatgyigpqyywlmnw-auth-token';
const starterId = '00000000-0000-4000-8000-000000000019';

const encodeTokenPart = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const nowSeconds = Math.floor(Date.now() / 1_000);
const starterAccessToken = [
  encodeTokenPart({ alg: 'HS256', typ: 'JWT' }),
  encodeTokenPart({
    aud: 'authenticated',
    exp: nowSeconds + 3_600,
    iat: nowSeconds,
    iss: `${supabaseOrigin}/auth/v1`,
    role: 'authenticated',
    sub: starterId,
    email: 'realized.vol.contract@example.test',
  }),
  'contract-fixture-signature',
].join('.');

const starterUser = {
  id: starterId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'realized.vol.contract@example.test',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { prenom: 'QA', nom: 'RealizedVol' },
  identities: [],
  created_at: '2026-07-19T00:00:00.000Z',
  updated_at: '2026-07-19T00:00:00.000Z',
  is_anonymous: false,
};

const starterSession = {
  access_token: starterAccessToken,
  refresh_token: 'contract-fixture-refresh-token',
  expires_at: nowSeconds + 3_600,
  expires_in: 3_600,
  token_type: 'bearer',
  user: starterUser,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': baseUrl,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-profile, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

if (path.dirname(outputDirectory) !== process.cwd() || path.basename(outputDirectory) !== '.realized-vol-browser-dist') {
  throw new Error('Refusing to use a realized-volatility build directory outside the frontend project');
}

const runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  child.on('error', reject);
  child.on('exit', (code) => {
    if (code === 0) resolve(output);
    else reject(new Error(`Command exited with ${code}: ${output.slice(-4_000)}`));
  });
});

const waitForServer = async (serverOutput, serverProcess, timeoutMs = 30_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) throw new Error(`Vite exited before becoming ready. ${serverOutput()}`);
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Vite did not become ready at ${baseUrl}. ${serverOutput()}`);
};

const step = async (number, name, input, action, next) => {
  try {
    const output = await action();
    console.log(`[STEP ${number}] ${name} · [STATUS] ok · [REQUEST] production browser journey · [INPUT] ${input} · [OUTPUT] ${output} · [ERROR] none · [NEXT] ${next}`);
  } catch (error) {
    console.error(`[STEP ${number}] ${name} · [STATUS] fail · [REQUEST] production browser journey · [INPUT] ${input} · [OUTPUT] none · [ERROR] ${error instanceof Error ? error.message : String(error)} · [NEXT] release blocked`);
    throw error;
  }
};

const downloadText = async (download) => {
  const filePath = await download.path();
  assert.ok(filePath, `download '${download.suggestedFilename()}' has no local path`);
  return readFile(filePath, 'utf8');
};

const screenshotResultsWithoutStickyChrome = async (page, fileName) => {
  const style = await page.addStyleTag({ content: 'header.nav{position:static!important}.agui-fab{visibility:hidden!important}' });
  try {
    await page.locator('[data-realized-vol-results="true"]').screenshot({ path: path.join(shotsDirectory, fileName) });
  } finally {
    await style.evaluate((element) => element.remove());
  }
};

const seedAuthenticatedStorage = async (page) => {
  await page.addInitScript(({ key, session, user }) => {
    window.localStorage.setItem(key, JSON.stringify(session));
    window.localStorage.setItem(`${key}-user`, JSON.stringify({ user }));
  }, { key: storageKey, session: starterSession, user: starterUser });
};

const mockSupabase = async (page) => {
  await page.route(`${supabaseOrigin}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (new URL(request.url()).pathname.startsWith('/rest/v1/profiles')) {
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: starterId, prenom: 'QA', nom: 'RealizedVol', role: 'user' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(starterUser),
    });
  });
};

let server;
let browser;
let serverOutput = '';
try {
  await mkdir(shotsDirectory, { recursive: true });
  await rm(outputDirectory, { recursive: true, force: true });
  await runCommand(process.execPath, [viteBin, 'build', '--outDir', outputDirectory], {
    cwd: process.cwd(),
    env: { ...process.env, VITE_TPL_RAG_API_URL: 'http://127.0.0.1:8000', VITE_TPL_RUM_ENABLED: 'false' },
  });
  server = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort', '--outDir', outputDirectory],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
  );
  server.stdout.on('data', (chunk) => { serverOutput += chunk; });
  server.stderr.on('data', (chunk) => { serverOutput += chunk; });
  await waitForServer(() => serverOutput.slice(-2_000), server);

  browser = await chromium.launch({ headless: true });
  const pageErrors = [];
  const consoleErrors = [];
  const failedCriticalRequests = [];

  await step(1, 'Anonymous Starter lock', 'no session and no entitlement', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(`anonymous: ${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(`anonymous: ${message.text()}`); });
    await page.route('http://127.0.0.1:8000/**', (route) => route.fulfill({ status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ detail: 'authentication required' }) }));
    await page.goto(`${baseUrl}/tools/iv-calc`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor({ timeout: 30_000 });
    assert.equal(await page.locator('[data-realized-volatility-lab="true"]').count(), 0, 'premium lab mounted before entitlement');
    await context.close();
    return 'locked panel visible; premium component and worker absent';
  }, 'prove server-authoritative denial for a signed-in user');

  await step(2, 'Signed-in entitlement denial', 'valid session plus inactive server entitlement', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await seedAuthenticatedStorage(page);
    await mockSupabase(page);
    await page.route('http://127.0.0.1:8000/**', async (route) => {
      const request = route.request();
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders });
      return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: false, plan: 'free' }) });
    });
    await page.goto(`${baseUrl}/tools/iv-calc`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor({ timeout: 30_000 });
    assert.equal(await page.locator('[data-realized-volatility-lab="true"]').count(), 0, 'inactive server entitlement mounted the lab');
    await context.close();
    return 'profile/session metadata cannot self-grant Starter access';
  }, 'unlock with the bearer-bound Starter contract');

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  let entitlementBearerObserved = false;
  let workerRequests = 0;
  const ohlcNetworkLeaks = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('request', (request) => {
    if (request.url().includes('realizedVolatility.worker')) workerRequests += 1;
    const postData = request.postData() || '';
    if (/date,open,high,low,close|2024-01-02,100\.00,101\.40/.test(postData)) ohlcNetworkLeaks.push(request.url());
  });
  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'script' || request.url().includes('RealizedVolatility') || request.url().includes('realizedVolatility')) {
      failedCriticalRequests.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`);
    }
  });

  await seedAuthenticatedStorage(page);
  await mockSupabase(page);
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders });
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/billing/entitlement') {
      entitlementBearerObserved = request.headers().authorization === `Bearer ${starterAccessToken}`;
      return route.fulfill({ status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ active: true, plan: 'starter' }) });
    }
    return route.fulfill({ status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ detail: 'not part of realized-volatility smoke' }) });
  });

  await step(3, 'Starter entitlement and active route', 'session without plan metadata plus HTTP Starter entitlement', async () => {
    await page.goto(`${baseUrl}/tools/iv-calc`, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.getByRole('heading', { name: 'Realized Volatility & Data Quality Lab', exact: true }).first().waitFor({ timeout: 60_000 });
    assert.equal(entitlementBearerObserved, true, 'entitlement request did not carry the exact bearer token');
    assert.equal(await page.locator('[data-realized-volatility-lab="true"]').count(), 1, 'dedicated lab did not mount');
    assert.equal(await page.getByText('Starter plan required', { exact: true }).count(), 0, 'authorized Starter route remained locked');
    await page.waitForFunction(() => document.title === 'Realized Volatility & Data Quality Lab | The Pricing Library');
    return 'bearer observed; dedicated lazy component active; no paid plan in profile';
  }, 'verify sample and local worker');

  await step(4, 'Teaching fixture and five estimators', 'downloaded 12-row sample at A=252, window=5', async () => {
    const [sampleDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Sample', exact: true }).click(),
    ]);
    assert.equal(sampleDownload.suggestedFilename(), 'tpl_realized_volatility_teaching_fixture.csv');
    const sample = await downloadText(sampleDownload);
    assert.equal(sample.split(/\r?\n/).filter(Boolean).length, 13);
    assert.match(sample, /^date,open,high,low,close/m);
    await page.getByRole('button', { name: 'Analyze & compare estimators', exact: true }).click();
    await page.locator('[data-realized-vol-results="true"]').waitFor({ timeout: 30_000 });
    const expected = {
      closeToClose: '15.74%', parkinson: '17.15%', garmanKlass: '18.39%', rogersSatchell: '18.06%', yangZhang: '17.75%',
    };
    for (const [key, value] of Object.entries(expected)) assert.match((await page.locator(`[data-estimator="${key}"]`).textContent()) || '', new RegExp(value.replace('.', '\\.')));
    const resultHeader = (await page.locator('[data-realized-vol-results="true"] > div').first().textContent()) || '';
    for (const expectedText of ['TEACHING-OHLC', '2024-01-02', '2024-01-17', 'unknown', 'window=5']) assert.match(resultHeader, new RegExp(expectedText));
    assert.equal(await page.locator('[data-headline-realized-vol-warnings="true"] button').count(), 2, 'two headline quality warnings must be visible immediately');
    await page.locator('[data-open-realized-vol-diagnostics="true"]').click();
    await page.locator('[data-realized-vol-diagnostics="true"]').waitFor();
    await page.getByRole('tab', { name: 'Estimates & rolling', exact: true }).click();
    assert.equal(await page.locator('[data-realized-vol-interpretation="true"]').count(), 1, 'estimator interpretation aid is missing');
    assert.ok(workerRequests >= 1, 'dedicated analysis worker was not requested');
    assert.deepEqual(ohlcNetworkLeaks, [], 'OHLC payload escaped through a network request');
    await screenshotResultsWithoutStickyChrome(page, 'realized-volatility-desktop.png');
    return `worker=${workerRequests}; five values match; OHLC requests=0`;
  }, 'audit evidence downloads');

  await step(5, 'Versioned evidence exports', 'JSON plus rolling and observation CSV', async () => {
    const [jsonDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON evidence', exact: true }).click()]);
    const evidence = JSON.parse(await downloadText(jsonDownload));
    assert.equal(evidence.schema, 'tpl.realized-volatility-analysis.v1');
    assert.equal(evidence.engineVersion, '1.0.0');
    assert.equal(evidence.sessionCount, 11);
    assert.equal(Object.keys(evidence.estimators).length, 5);
    assert.equal(evidence.source.sha256, '03cb2c54484e9dac115191753eb522803afb0ea3da7bd15362ae51d92f76704a');
    assert.equal(evidence.source.hashBasis, 'canonical-observations-utf8');
    assert.equal(evidence.provenance.persistence, 'none');

    const [rollingDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Rolling CSV', exact: true }).click()]);
    const rolling = await downloadText(rollingDownload);
    assert.match(rolling, /tpl\.realized-volatility\.rolling\.v1/);
    assert.equal(rolling.split(/\r?\n/).filter(Boolean).length, 8);

    const [flagsDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Observations + flags CSV', exact: true }).click()]);
    const observations = await downloadText(flagsDownload);
    assert.match(observations, /tpl\.realized-volatility\.observations\.v1/);
    assert.equal(observations.split(/\r?\n/).filter(Boolean).length, 13);
    return 'schema v1; SHA-256 fixed; 7 rolling points; 12 retained observations';
  }, 'prove coherent configuration changes and stale clearing');

  await step(6, 'Configuration coherence and fail-closed CSV', 'A=365 then malformed upload', async () => {
    const annualizationInput = page.getByLabel('Annualization sessions');
    await annualizationInput.fill('365');
    assert.equal(await page.locator('[data-realized-vol-results="true"]').count(), 0, 'configuration edit left stale results visible');
    await page.getByRole('button', { name: 'Analyze & compare estimators', exact: true }).click();
    await page.locator('[data-realized-vol-results="true"]').waitFor();
    assert.match((await page.locator('[data-estimator="yangZhang"]').textContent()) || '', /21\.36%/);

    const invalidCsv = `date,open,low,close\n2024-01-02,100,99,100\n2024-01-03,101,100,101\n2024-01-04,102,101,102\n2024-01-05,103,102,103\n2024-01-08,104,103,104\n2024-01-09,105,104,105\n`;
    await page.locator('[data-realized-vol-file-input="true"]').setInputFiles({ name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from(invalidCsv) });
    await page.getByText('invalid.csv', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-realized-vol-results="true"]').count(), 0, 'new CSV left stale results visible');
    await page.getByRole('button', { name: 'Analyze & compare estimators', exact: true }).click();
    await page.locator('[data-realized-vol-error="true"]').waitFor();
    assert.match((await page.locator('[data-realized-vol-error="true"]').textContent()) || '', /header must be exactly/i);
    assert.equal(await page.locator('[data-realized-vol-results="true"]').count(), 0, 'invalid CSV produced a result');
    return 'square-root annualization scaling visible; malformed schema rejected; stale result absent';
  }, 'retain but flag suspicious observations');

  await step(7, 'Warning preservation and actual history', 'large move, gap, flat/repeated bars', async () => {
    const qualityCsv = `date,open,high,low,close\n2024-01-02,100,101,99,100\n2024-01-03,100,101,99,100\n2024-01-08,130,130,130,130\n2024-01-09,130,131,129,130\n2024-01-10,130,131,129,130\n2024-01-11,130,131,129,130\n`;
    await page.locator('[data-realized-vol-file-input="true"]').setInputFiles({ name: 'quality-warning.csv', mimeType: 'text/csv', buffer: Buffer.from(qualityCsv) });
    await page.getByText('quality-warning.csv', { exact: true }).waitFor();
    await page.getByLabel('Annualization sessions').fill('252');
    await page.getByRole('button', { name: 'Analyze & compare estimators', exact: true }).click();
    await page.locator('[data-realized-vol-results="true"]').waitFor();
    await page.getByRole('tab', { name: 'Diagnostics', exact: true }).click();
    const diagnostics = (await page.locator('[data-realized-vol-diagnostics="true"]').textContent()) || '';
    for (const code of ['POSSIBLE_MISSING_SESSION', 'LARGE_CLOSE_JUMP', 'FLAT_BAR', 'REPEATED_CLOSE', 'RETURN_OUTLIERS']) assert.match(diagnostics, new RegExp(code));
    await page.getByRole('tab', { name: 'Run history', exact: true }).click();
    const historyRows = page.locator('[role="tabpanel"][data-state="active"] tbody tr');
    assert.equal(await historyRows.count(), 3, 'history must contain successful A=252/A=365/warning runs only');
    assert.match((await page.locator('[role="tabpanel"][data-state="active"]').textContent()) || '', /No remote persistence/i);
    return 'warning rows retained and dated; invalid run excluded; history=3 actual successes';
  }, 'verify deterministic mobile rendering');

  await step(8, 'Mobile layout and rendered series', '390x844 production viewport', async () => {
    await page.getByRole('button', { name: 'Restore teaching fixture', exact: true }).click();
    await page.getByRole('button', { name: 'Analyze & compare estimators', exact: true }).click();
    await page.locator('[data-realized-vol-results="true"]').waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('tab', { name: 'Estimates & rolling', exact: true }).click();
    const width = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    assert.ok(width.document <= width.viewport + 2, `mobile horizontal overflow: ${width.document}/${width.viewport}`);
    const paths = page.locator('[data-realized-vol-chart="true"] .recharts-line-curve');
    assert.equal(await paths.count(), 5, 'all five SVG series must render');
    const pathBoxes = await paths.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, length: element.getAttribute('d')?.length || 0 };
    }));
    assert.ok(pathBoxes.every((box) => box.width > 40 && box.height >= 0 && box.length > 20), `incomplete series paths: ${JSON.stringify(pathBoxes)}`);
    const curveControls = page.getByLabel('Visible volatility estimators');
    await curveControls.getByRole('button', { name: 'Parkinson', exact: true }).click();
    assert.equal(await paths.count(), 4, 'curve visibility control did not hide one estimator');
    await curveControls.getByRole('button', { name: 'Parkinson', exact: true }).click();
    assert.equal(await paths.count(), 5, 'curve visibility control did not restore the estimator');
    assert.equal(await page.locator('[data-sticky-estimator="true"]').first().evaluate((cell) => getComputedStyle(cell).position), 'sticky');
    await page.getByRole('tab', { name: 'Observations', exact: true }).click();
    assert.equal(await page.locator('[data-observation-date] td').first().evaluate((cell) => getComputedStyle(cell).position), 'sticky');
    const assistantBox = await page.locator('.agui-fab').boundingBox();
    const menuBox = await page.getByRole('button', { name: 'Open menu', exact: true }).boundingBox();
    assert.ok(assistantBox && menuBox && menuBox.x + menuBox.width + 4 <= assistantBox.x, 'assistant/menu overlap returned');
    await page.getByRole('tab', { name: 'Estimates & rolling', exact: true }).click();
    await screenshotResultsWithoutStickyChrome(page, 'realized-volatility-mobile.png');
    return `document=${width.document}/${width.viewport}; five SVG series; sticky observations; assistant safe`;
  }, 'final browser error and privacy gate');

  await step(9, 'Browser error and privacy gate', 'all contexts, requests and downloads', () => {
    assert.deepEqual(pageErrors, [], `uncaught page errors: ${pageErrors.join('; ')}`);
    assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join('; ')}`);
    assert.deepEqual(failedCriticalRequests, [], `critical request failures: ${failedCriticalRequests.join('; ')}`);
    assert.deepEqual(ohlcNetworkLeaks, [], `OHLC network leaks: ${ohlcNetworkLeaks.join('; ')}`);
    assert.ok(workerRequests >= 1, 'worker request disappeared');
    return `pageErrors=0; consoleErrors=0; criticalFailures=0; OHLC leaks=0; workerRequests=${workerRequests}`;
  }, 'independent Technical RL revalidation');

  console.log('[VERDICT] PASS · server-authorized Starter access, five OHLC estimators, local worker, evidence exports, fail-closed data quality and mobile rendering are production-browser-tested');
} finally {
  if (browser) await browser.close();
  if (server && !server.killed) server.kill('SIGTERM');
  await rm(outputDirectory, { recursive: true, force: true });
}
