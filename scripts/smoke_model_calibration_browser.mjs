import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4177;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const shotsDirectory = path.resolve('scripts/_shots');
const outputDirectory = path.resolve('.calibration-browser-dist');
const supabaseOrigin = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const storageKey = 'sb-kjybaatgyigpqyywlmnw-auth-token';
const studentId = '00000000-0000-4000-8000-000000000019';

const encodeTokenPart = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const nowSeconds = Math.floor(Date.now() / 1_000);
const studentAccessToken = [
  encodeTokenPart({ alg: 'HS256', typ: 'JWT' }),
  encodeTokenPart({
    aud: 'authenticated',
    exp: nowSeconds + 3_600,
    iat: nowSeconds,
    iss: `${supabaseOrigin}/auth/v1`,
    role: 'authenticated',
    sub: studentId,
    email: 'student.contract@example.test',
  }),
  'contract-fixture-signature',
].join('.');

const studentUser = {
  id: studentId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'student.contract@example.test',
  email_confirmed_at: '2026-07-19T00:00:00.000Z',
  confirmed_at: '2026-07-19T00:00:00.000Z',
  last_sign_in_at: '2026-07-19T00:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { prenom: 'QA', nom: 'Student' },
  identities: [],
  created_at: '2026-07-19T00:00:00.000Z',
  updated_at: '2026-07-19T00:00:00.000Z',
  is_anonymous: false,
};

const studentSession = {
  access_token: studentAccessToken,
  refresh_token: 'contract-fixture-refresh-token',
  expires_at: nowSeconds + 3_600,
  expires_in: 3_600,
  token_type: 'bearer',
  user: studentUser,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': baseUrl,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-profile, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

if (path.dirname(outputDirectory) !== process.cwd() || path.basename(outputDirectory) !== '.calibration-browser-dist') {
  throw new Error('Refusing to use a calibration build directory outside the frontend project');
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
    if (serverProcess.exitCode !== null) {
      throw new Error(`Vite exited before becoming ready (code ${serverProcess.exitCode}). ${serverOutput()}`);
    }
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Vite did not become ready at ${baseUrl}. ${serverOutput()}`);
};

const step = async (number, name, input, action, next) => {
  try {
    const output = await action();
    console.log(`[STEP ${number}] ${name} · [STATUS] ok · [REQUEST] authenticated browser journey · [INPUT] ${input} · [OUTPUT] ${output} · [ERROR] none · [NEXT] ${next}`);
  } catch (error) {
    console.error(`[STEP ${number}] ${name} · [STATUS] fail · [REQUEST] authenticated browser journey · [INPUT] ${input} · [OUTPUT] none · [ERROR] ${error instanceof Error ? error.message : String(error)} · [PAGE] ${page?.url?.() || 'unknown'} · [PAGE_ERRORS] ${pageErrors?.join('|') || 'none'} · [CONSOLE_ERRORS] ${consoleErrors?.join('|') || 'none'} · [NEXT] release blocked`);
    throw error;
  }
};

const downloadText = async (download) => {
  const filePath = await download.path();
  assert.ok(filePath, `download '${download.suggestedFilename()}' has no local path`);
  return readFile(filePath, 'utf8');
};

let server;
let browser;
let serverOutput = '';
let page;
let pageErrors = [];
let consoleErrors = [];
try {
  await rm(outputDirectory, { recursive: true, force: true });
  await runCommand(process.execPath, [viteBin, 'build', '--outDir', outputDirectory], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_TPL_RAG_API_URL: 'http://127.0.0.1:8000',
      VITE_TPL_RUM_ENABLED: 'false',
    },
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
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  page = await context.newPage();
  pageErrors = [];
  consoleErrors = [];
  const failedCriticalRequests = [];
  const workerRequests = [];
  let entitlementBearerObserved = false;

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('request', (request) => {
    if (request.url().includes('modelCalibration.worker')) workerRequests.push(request.url());
  });
  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'script' || request.url().includes('modelCalibration')) {
      failedCriticalRequests.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`);
    }
  });

  await page.addInitScript(({ key, session, user }) => {
    window.localStorage.setItem(key, JSON.stringify(session));
    window.localStorage.setItem(`${key}-user`, JSON.stringify({ user }));
  }, { key: storageKey, session: studentSession, user: studentUser });

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
        body: JSON.stringify({ id: studentId, prenom: 'QA', nom: 'Student', role: 'user' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(studentUser),
    });
  });

  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/billing/entitlement') {
      entitlementBearerObserved = request.headers().authorization === `Bearer ${studentAccessToken}`;
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true, plan: 'student' }),
      });
      return;
    }
    await route.fulfill({
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ detail: 'not part of calibration smoke' }),
    });
  });

  await step(1, 'Student entitlement and active route', 'Supabase-shaped session without plan metadata + HTTP Student entitlement', async () => {
    await page.goto(`${baseUrl}/tools/calib`, { waitUntil: 'networkidle', timeout: 60_000 });
    try {
      await page.getByRole('heading', { name: 'Volatility Model Calibration', exact: true }).waitFor({ timeout: 60_000 });
    } catch (error) {
      const body = ((await page.locator('body').textContent()) || '').replace(/\s+/g, ' ').slice(0, 1_000);
      throw new Error(`${error instanceof Error ? error.message : String(error)}; url=${page.url()}; title=${await page.title()}; entitlementBearer=${entitlementBearerObserved}; pageErrors=${pageErrors.join('|') || 'none'}; consoleErrors=${consoleErrors.join('|') || 'none'}; body=${body}; vite=${serverOutput.slice(-1_000)}`);
    }
    assert.equal(entitlementBearerObserved, true, 'billing entitlement did not receive the authenticated bearer token');
    assert.equal(await page.getByText('Student plan required', { exact: true }).count(), 0, 'Student entitlement remained locked');
    await page.waitForFunction(
      () => document.title === 'Volatility Model Calibration | The Pricing Library',
      undefined,
      { timeout: 10_000 },
    );
    assert.equal(await page.title(), 'Volatility Model Calibration | The Pricing Library', 'Helmet title did not render through the application provider');
    return 'route unlocked by server entitlement; bearer observed; Helmet active';
  }, 'verify downloadable input contract');

  await step(2, 'Downloadable CSV schema', 'sample button', async () => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Sample CSV', exact: true }).click(),
    ]);
    assert.equal(download.suggestedFilename(), 'tpl-volatility-surface-example.csv');
    const csv = await downloadText(download);
    assert.match(csv, /maturity=years; impliedVol=decimal/);
    assert.match(csv, /strike,maturity,impliedVol,forward,weight/);
    assert.equal(csv.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).length, 11);
    return 'schema, units and 10 valid rows downloaded';
  }, 'run Black and audit the export');

  await step(3, 'Reference surface, Black fit and JSON export', '45-point reference surface', async () => {
    await page.getByRole('button', { name: 'Reference surface', exact: true }).click();
    await page.getByText('45 points', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Calibrate model', exact: true }).click();
    await page.getByRole('heading', { name: 'BLACK bounded solution', exact: true }).waitFor({ timeout: 20_000 });
    const resultText = await page.locator('[data-calibration-results="true"]').textContent();
    assert.match(resultText || '', /130\.36 vol bp/);
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 }).catch(() => null);
    await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
    await page.waitForTimeout(500);
    const download = await downloadPromise;
    assert.ok(download, 'Export JSON did not trigger a browser download');
    const report = JSON.parse(await downloadText(download));
    assert.equal(report.schema, 'tpl.model-calibration.export.v1');
    assert.equal(report.model, 'black');
    assert.equal(report.objective, 'volatility');
    assert.equal(report.inputs.length, 45);
    assert.equal(report.calibratedSurface.length, 45);
    assert.ok(report.parameterBounds.sigma);
    assert.equal(report.conventions.discountFactor, 1);
    assert.ok(workerRequests.length >= 1, 'dedicated calibration worker was not requested');
    return `Black=130.36 vol bp; export=${report.inputs.length} inputs; worker=yes`;
  }, 'compare SABR and Heston');

  const chooseModel = async (name) => {
    const trigger = page.getByRole('combobox').first();
    await trigger.click();
    await page.getByRole('option', { name }).click();
    await trigger.getByText(name).waitFor({ timeout: 10_000 });
  };

  const chooseObjective = async (name) => {
    const trigger = page.getByRole('combobox').nth(1);
    await trigger.click();
    await page.getByRole('option', { name }).click();
    await trigger.getByText(name).waitFor({ timeout: 10_000 });
  };

  await step(4, 'SABR/Heston comparison and session history', 'same surface, volatility objective', async () => {
    await chooseModel(/SABR/);
    await page.getByRole('button', { name: 'Calibrate model', exact: true }).click();
    await page.getByRole('heading', { name: 'SABR bounded solution', exact: true }).waitFor({ timeout: 30_000 });
    assert.match((await page.locator('[data-calibration-results="true"]').textContent()) || '', /4\.62 vol bp/);

    await chooseModel(/Heston/);
    await page.getByRole('button', { name: 'Calibrate model', exact: true }).click();
    await page.getByRole('heading', { name: 'HESTON bounded solution', exact: true }).waitFor({ timeout: 60_000 });
    assert.match((await page.locator('[data-calibration-results="true"]').textContent()) || '', /35\.41 vol bp/);

    await page.getByRole('tab', { name: 'Diagnostics', exact: true }).click();
    const diagnostics = page.locator('[role="tabpanel"][data-state="active"]');
    assert.match((await diagnostics.textContent()) || '', /Converged\s*Yes/);
    assert.match((await diagnostics.textContent()) || '', /Heston Feller margin/);

    await page.getByRole('combobox').nth(2).click();
    await page.getByRole('option', { name: '1y', exact: true }).click();
    await page.getByRole('tab', { name: 'Fit & residuals', exact: true }).click();
    await page.waitForTimeout(1_800);
    await page.mouse.move(5, 5);
    await mkdir(shotsDirectory, { recursive: true });
    await page.locator('[data-calibration-results="true"]').screenshot({
      path: path.join(shotsDirectory, 'model-calibration-heston.png'),
    });

    await page.getByRole('tab', { name: 'Run history', exact: true }).click();
    const historyPanel = page.locator('[role="tabpanel"][data-state="active"]');
    assert.equal(await historyPanel.locator('tbody tr').count(), 3);
    const historyText = (await historyPanel.textContent()) || '';
    assert.match(historyText, /black/i);
    assert.match(historyText, /sabr/i);
    assert.match(historyText, /heston/i);
    return 'Black/SABR/Heston actual runs compared; convergence and Feller visible; history=3';
  }, 'exercise objective guidance and CSV failures');

  await step(5, 'Objective guidance and fail-closed CSV', 'price objective + invalid and valid local files', async () => {
    await chooseObjective(/Normalized-price RMSE/);
    await page.getByText(/Use normalized-price RMSE when monetary fit matters/).waitFor();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('strike,maturity,impliedVol\n80,1,0.20\n90,1,-0.10\n100,1,0.20\n110,1,0.21\n120,1,0.22'),
    });
    await page.getByText('Calibration input rejected', { exact: true }).waitFor();
    assert.match((await page.getByRole('alert').textContent()) || '', /implied volatility/);

    const validCsv = [
      'strike,maturity,impliedVol,forward,weight',
      '90,0.5,0.220,100,1',
      '100,0.5,0.200,100,2',
      '110,0.5,0.205,100,1',
      '90,1.0,0.225,100,1',
      '100,1.0,0.205,100,2',
    ].join('\n');
    await fileInput.setInputFiles({ name: 'valid.csv', mimeType: 'text/csv', buffer: Buffer.from(validCsv) });
    await page.getByText('CSV: valid.csv (5 points)', { exact: true }).waitFor();
    assert.equal(await page.getByText('Calibration input rejected', { exact: true }).count(), 0);
    return 'price guidance visible; invalid file rejected; valid 5-point CSV loaded';
  }, 'calibrate the uploaded surface and inspect mobile');

  await step(6, 'Uploaded CSV worker fit and mobile layout', '5-point CSV at 390x844', async () => {
    await chooseModel(/Black/);
    await chooseObjective(/Implied-volatility RMSE/);
    await page.getByRole('button', { name: 'Calibrate model', exact: true }).click();
    try {
      await page.getByRole('heading', { name: 'BLACK bounded solution', exact: true }).waitFor({ timeout: 60_000 });
    } catch (error) {
      const state = await page.evaluate(() => ({
        body: (document.body.textContent || '').replace(/\s+/g, ' ').slice(0, 1_500),
        comboValues: Array.from(document.querySelectorAll('[role="combobox"]')).map((node) => node.textContent),
        alerts: Array.from(document.querySelectorAll('[role="alert"]')).map((node) => node.textContent),
      }));
      throw new Error(`${error instanceof Error ? error.message : String(error)}; state=${JSON.stringify(state)}`);
    }
    await page.getByRole('tab', { name: 'Diagnostics', exact: true }).click();
    const diagnosticsText = (await page.locator('[role="tabpanel"][data-state="active"]').textContent()) || '';
    assert.match(diagnosticsText, /Points\s*5/);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export JSON', exact: true }).click(),
    ]);
    const report = JSON.parse(await downloadText(download));
    assert.equal(report.inputs.length, 5);
    assert.equal(report.dataSource.kind, 'csv');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('tab', { name: 'Parameters', exact: true }).click();
    const width = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    assert.ok(width.document <= width.viewport + 2, `mobile horizontal overflow: document=${width.document}, viewport=${width.viewport}`);
    await page.locator('[data-calibration-results="true"]').screenshot({
      path: path.join(shotsDirectory, 'model-calibration-mobile.png'),
    });
    return `CSV inputs=${report.inputs.length}; mobile=${width.document}/${width.viewport}px; export source=csv`;
  }, 'final browser error gate');

  await step(7, 'Browser error gate', 'page, console and critical request errors', () => {
    assert.deepEqual(pageErrors, [], `uncaught page errors: ${pageErrors.join('; ')}`);
    assert.deepEqual(failedCriticalRequests, [], `critical request failures: ${failedCriticalRequests.join('; ')}`);
    assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join('; ')}`);
    return `pageErrors=0; consoleErrors=0; workerRequests=${workerRequests.length}`;
  }, 'technical revalidation');

  console.log('[VERDICT] PASS · contract-authenticated Student route, calibration worker, files, comparison, errors and mobile are browser-tested');
} finally {
  if (browser) await browser.close();
  if (server && !server.killed) server.kill('SIGTERM');
  await rm(outputDirectory, { recursive: true, force: true });
}
