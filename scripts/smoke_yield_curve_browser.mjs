import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4178;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const shotsDirectory = path.resolve('scripts/_shots');
const outputDirectory = path.resolve('.curve-browser-dist');
const supabaseOrigin = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const storageKey = 'sb-kjybaatgyigpqyywlmnw-auth-token';
const starterId = '00000000-0000-4000-8000-000000000018';

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
    email: 'starter.contract@example.test',
  }),
  'contract-fixture-signature',
].join('.');

const starterUser = {
  id: starterId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'starter.contract@example.test',
  email_confirmed_at: '2026-07-19T00:00:00.000Z',
  confirmed_at: '2026-07-19T00:00:00.000Z',
  last_sign_in_at: '2026-07-19T00:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { prenom: 'QA', nom: 'Starter' },
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

if (path.dirname(outputDirectory) !== process.cwd() || path.basename(outputDirectory) !== '.curve-browser-dist') {
  throw new Error('Refusing to use a curve build directory outside the frontend project');
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
        body: JSON.stringify({ id: starterId, prenom: 'QA', nom: 'Starter', role: 'user' }),
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
  const pageErrors = [];
  const consoleErrors = [];
  const failedCriticalRequests = [];

  await step(1, 'Anonymous Starter lock', 'no session and no entitlement', async () => {
    const anonymousContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const anonymousPage = await anonymousContext.newPage();
    anonymousPage.on('pageerror', (error) => pageErrors.push(`anonymous: ${error.message}`));
    anonymousPage.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(`anonymous: ${message.text()}`);
    });
    anonymousPage.on('requestfailed', (request) => {
      if (request.resourceType() === 'script' || request.url().includes('YieldCurve')) {
        failedCriticalRequests.push(`anonymous: ${request.url()}: ${request.failure()?.errorText || 'failed'}`);
      }
    });
    await anonymousPage.route('http://127.0.0.1:8000/**', async (route) => {
      if(new URL(route.request().url()).pathname==='/billing/config')return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},json:{sales_enabled:false}});
      await route.fulfill({
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ detail: 'authentication required' }),
      });
    });
    await anonymousPage.goto(`${baseUrl}/tools/curve`, { waitUntil: 'networkidle', timeout: 60_000 });
    await anonymousPage.getByRole('heading', { name: 'Starter plan required', exact: true }).waitFor({ timeout: 30_000 });
    assert.equal(await anonymousPage.locator('[data-yield-curve-builder="true"]').count(), 0, 'premium curve component mounted before entitlement');
    assert.match((await anonymousPage.locator('body').textContent()) || '', /Paid access is not on sale yet/, 'closed billing must not advertise an available checkout');
    assert.equal(await anonymousPage.getByRole('link',{name:'Try available interview practice',exact:true}).getAttribute('href'),'/interview','the locked workspace must retain an available free-practice route');
    await anonymousContext.close();
    return 'locked panel visible; premium component absent';
  }, 'prove bearer-bound Starter access');

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage();
  let entitlementBearerObserved = false;

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    if (request.resourceType() === 'script' || request.url().includes('YieldCurve')) {
      failedCriticalRequests.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`);
    }
  });

  await page.addInitScript(({ key, session, user }) => {
    window.localStorage.setItem(key, JSON.stringify(session));
    window.localStorage.setItem(`${key}-user`, JSON.stringify({ user }));
  }, { key: storageKey, session: starterSession, user: starterUser });
  await mockSupabase(page);
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/billing/entitlement') {
      entitlementBearerObserved = request.headers().authorization === `Bearer ${starterAccessToken}`;
      await route.fulfill({
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true, plan: 'starter' }),
      });
      return;
    }
    await route.fulfill({
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ detail: 'not part of yield-curve smoke' }),
    });
  });

  await step(2, 'Starter entitlement and active route', 'Supabase-shaped session without plan metadata + HTTP Starter entitlement', async () => {
    await page.goto(`${baseUrl}/tools/curve`, { waitUntil: 'networkidle', timeout: 60_000 });
    try {
      await page.getByRole('heading', { name: 'Yield Curve Builder', exact: true }).waitFor({ timeout: 60_000 });
    } catch (error) {
      const body = ((await page.locator('body').textContent()) || '').replace(/\s+/g, ' ').slice(0, 1_200);
      throw new Error(`${error instanceof Error ? error.message : String(error)}; url=${page.url()}; title=${await page.title()}; entitlementBearer=${entitlementBearerObserved}; errors=${pageErrors.join('|') || 'none'}; body=${body}; vite=${serverOutput.slice(-1_000)}`);
    }
    assert.equal(entitlementBearerObserved, true, 'billing entitlement did not receive the authenticated bearer token');
    assert.equal(await page.getByText('Starter plan required', { exact: true }).count(), 0, 'Starter entitlement remained locked');
    assert.equal(await page.locator('[data-yield-curve-builder="true"]').count(), 1, 'dedicated curve component did not mount');
    await page.waitForFunction(
      () => document.title === 'Yield Curve Builder | The Pricing Library',
      undefined,
      { timeout: 10_000 },
    );
    return 'route unlocked by server entitlement; bearer observed; profile contains no plan';
  }, 'verify downloadable input contract');

  await step(3, 'Downloadable CSV schema', 'sample button', async () => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Sample CSV', exact: true }).click(),
    ]);
    assert.equal(download.suggestedFilename(), 'tpl-yield-curve-example.csv');
    const csv = await downloadText(download);
    assert.match(csv, /quotePercent in percent; futurePrice in price points; convexityAdjustmentBp in basis points/);
    assert.match(csv, /instrument,startYears,maturityYears,quotePercent,futurePrice,convexityAdjustmentBp/);
    assert.match(csv, /future,0\.25,0\.50,,95\.70,5/);
    assert.equal(csv.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).length, 8);
    return 'schema, units, convexity convention and 7 instruments downloaded';
  }, 'build and reprice the reference curve');

  let referenceExport;
  await step(4, 'Reference curve, repricing and export', '7 instruments across deposits/future/FRA/sparse swaps', async () => {
    await page.getByRole('button', { name: 'Build & reprice curve', exact: true }).click();
    await page.getByRole('heading', { name: 'Curve converged and repriced', exact: true }).waitFor({ timeout: 20_000 });
    const resultText = (await page.locator('[data-yield-curve-results="true"]').textContent()) || '';
    assert.match(resultText, /0\.636755/);
    assert.match(resultText, /Interpolated coupons\s*5/);
    const maxResidual = Number(await page.locator('[data-max-pv-residual]').getAttribute('data-max-pv-residual'));
    assert.ok(maxResidual <= 1e-10, `reference PV residual ${maxResidual} exceeds tolerance`);

    await page.getByRole('tab', { name: 'Repricing', exact: true }).click();
    const repricingPanel = page.locator('[role="tabpanel"][data-state="active"]');
    assert.equal(await repricingPanel.locator('tbody tr').count(), 7);
    assert.equal(await repricingPanel.getByText('repriced', { exact: true }).count(), 7);
    assert.match((await repricingPanel.locator('[data-repricing-instrument="future-2"]').textContent()) || '', /95\.7000 price/);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export JSON evidence', exact: true }).click(),
    ]);
    assert.equal(download.suggestedFilename(), 'tpl-yield-curve-result.json');
    referenceExport = JSON.parse(await downloadText(download));
    assert.equal(referenceExport.schema, 'tpl.yield-curve.export.v1');
    assert.equal(referenceExport.engineVersion, '1.0.0');
    assert.equal(referenceExport.inputs.length, 7);
    assert.equal(referenceExport.curve.length, 12);
    assert.equal(referenceExport.repricing.length, 7);
    assert.equal(referenceExport.inputs[1].convexityAdjustment, 0.0005);
    assert.equal(referenceExport.conventions.interpolation, 'log-linear discount factors');
    assert.ok(referenceExport.limitations.some((value) => value.includes('mono-curve')));
    assert.ok(referenceExport.diagnostics.maxAbsPvResidual <= 1e-10);

    await page.getByRole('tab', { name: 'Curve & forwards', exact: true }).click();
    await page.waitForTimeout(1_200);
    await mkdir(shotsDirectory, { recursive: true });
    await page.locator('[data-yield-curve-results="true"]').screenshot({
      path: path.join(shotsDirectory, 'yield-curve-desktop.png'),
    });
    return `final DF=0.636755; residual=${maxResidual.toExponential(2)}; repriced=7/7; export=yes`;
  }, 'bump a market pillar and prove stale results disappear');

  await step(5, 'Quote edit and coherent rebuild', '5Y par swap 4.50% → 4.90%', async () => {
    const quote5Y = page.locator('[data-curve-quote-maturity="5.00"]');
    assert.equal(await quote5Y.count(), 1, '5Y quote input not found');
    await quote5Y.fill('4.90');
    await page.getByText('No stale result is displayed', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-yield-curve-results="true"]').count(), 0, 'stale curve remained visible after quote edit');
    await page.getByRole('button', { name: 'Build & reprice curve', exact: true }).click();
    await page.getByRole('heading', { name: 'Curve converged and repriced', exact: true }).waitFor();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export JSON evidence', exact: true }).click(),
    ]);
    const bumped = JSON.parse(await downloadText(download));
    assert.equal(bumped.inputs.find((input) => input.type === 'swap' && input.maturity === 5).quote, 0.049);
    assert.notEqual(bumped.anchors.at(-1).discountFactor, referenceExport.anchors.at(-1).discountFactor, '10Y DF did not respond to the 5Y quote change');
    assert.ok(bumped.diagnostics.maxAbsPvResidual <= 1e-10);
    return `5Y quote=${bumped.inputs.find((input) => input.maturity === 5).quote}; final DF changed; residual PASS`;
  }, 'exercise invalid and valid CSV paths');

  await step(6, 'Fail-closed and valid CSV', 'missing future convexity then flat sparse swap curve', async () => {
    const fileInput = page.locator('[data-curve-csv-input="true"]');
    const invalidCsv = [
      'instrument,startYears,maturityYears,quotePercent,futurePrice,convexityAdjustmentBp',
      'deposit,,0.5,5,,',
      'future,0.5,1.0,,94.5,',
    ].join('\n');
    await fileInput.setInputFiles({ name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from(invalidCsv) });
    await page.getByText('Curve construction stopped', { exact: true }).waitFor();
    assert.match((await page.getByRole('alert').textContent()) || '', /convexityAdjustmentBp.*required/);
    assert.equal(await page.locator('[data-yield-curve-results="true"]').count(), 0, 'invalid CSV retained an old result');

    const flatCsv = [
      'instrument,startYears,maturityYears,quotePercent,futurePrice,convexityAdjustmentBp',
      'swap,,1,5,,',
      'swap,,2,5,,',
      'swap,,3,5,,',
      'swap,,5,5,,',
      'swap,,10,5,,',
    ].join('\n');
    await fileInput.setInputFiles({ name: 'flat.csv', mimeType: 'text/csv', buffer: Buffer.from(flatCsv) });
    await page.getByText(/User CSV: flat\.csv \(5 instruments\)/).waitFor();
    assert.equal(await page.getByText('Curve construction stopped', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Build & reprice curve', exact: true }).click();
    await page.getByRole('heading', { name: 'Curve converged and repriced', exact: true }).waitFor();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export JSON evidence', exact: true }).click(),
    ]);
    const flat = JSON.parse(await downloadText(download));
    assert.equal(flat.inputs.length, 5);
    assert.equal(flat.curve.length, 10);
    assert.ok(Math.abs(flat.anchors.at(-1).discountFactor - 0.613913253540759) <= 1e-10);
    assert.ok(flat.curve.every((node) => Math.abs(node.zeroAnnual - 0.05) <= 1e-9));
    return 'invalid future rejected; flat 1/2/3/5/10Y swaps reprice with DF10=0.613913';
  }, 'inspect conventions, history and mobile layout');

  await step(7, 'Diagnostics, actual history and mobile layout', 'three successful builds at 390x844', async () => {
    await page.locator('[data-curve-open-diagnostics="true"]').click();
    assert.equal(
      await page.getByRole('tab', { name: 'Diagnostics', exact: true }).getAttribute('data-state'),
      'active',
      'visible-notices shortcut did not open diagnostics',
    );
    const diagnostics = page.locator('[role="tabpanel"][data-state="active"]');
    const diagnosticsText = (await diagnostics.textContent()) || '';
    assert.match(diagnosticsText, /log-linear discount factors/);
    assert.match(diagnosticsText, /extrapolation\s*forbidden/i);
    assert.match(diagnosticsText, /mono-curve/);
    assert.match(diagnosticsText, /No discount-factor extrapolation/);

    await page.getByRole('tab', { name: 'Run history', exact: true }).click();
    const historyPanel = page.locator('[role="tabpanel"][data-state="active"]');
    assert.equal(await historyPanel.locator('tbody tr').count(), 3, 'invalid CSV must not create a run-history entry');
    assert.match((await historyPanel.textContent()) || '', /browser session only; no remote persistence/i);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('tab', { name: 'Curve & forwards', exact: true }).click();
    assert.match((await page.textContent('body')) || '', /Maturities off that grid are rejected; no stub is inferred/i);
    assert.equal(
      await page.locator('[data-curve-node-time="1"] td').first().evaluate((cell) => getComputedStyle(cell).position),
      'sticky',
      'mobile curve table must keep the maturity column visible while scrolling',
    );
    const assistantBox = await page.locator('.agui-fab').boundingBox();
    const headerBox = await page.locator('header.nav').boundingBox();
    assert.ok(assistantBox && headerBox && assistantBox.width >= 44 && assistantBox.height >= 44 && assistantBox.y >= headerBox.y && assistantBox.y + assistantBox.height <= headerBox.y + headerBox.height, 'mobile assistant launcher must be a 44 px target contained in the current header');
    const menuBox = await page.getByRole('button', { name: 'Open menu', exact: true }).boundingBox();
    assert.ok(
      menuBox && assistantBox && menuBox.x + menuBox.width + 4 <= assistantBox.x,
      'mobile assistant launcher must not overlap the navigation menu',
    );
    const width = await page.evaluate(() => {
      const viewport = window.innerWidth;
      const documentWidth = document.documentElement.scrollWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === 'string' ? element.className.slice(0, 120) : '',
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter((item) => item.left < -2 || item.right > viewport + 2)
        .sort((left, right) => Math.max(right.right - viewport, -right.left) - Math.max(left.right - viewport, -left.left))
        .slice(0, 8);
      return { viewport, document: documentWidth, offenders };
    });
    const chartPaths = page.locator('[data-yield-curve-results="true"] .recharts-line-curve');
    assert.equal(await chartPaths.count(), 3, 'both curve series and the discount-factor series must render');
    const chartPathBoxes = await chartPaths.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, length: element.getAttribute('d')?.length || 0 };
    }));
    assert.ok(
      chartPathBoxes.every((box) => box.width > 40 && box.length > 20),
      `curve chart paths are incomplete: ${JSON.stringify(chartPathBoxes)}`,
    );
    await page.locator('[data-yield-curve-results="true"]').screenshot({
      path: path.join(shotsDirectory, 'yield-curve-mobile.png'),
    });
    assert.ok(
      width.document <= width.viewport + 2,
      `mobile horizontal overflow: document=${width.document}, viewport=${width.viewport}; offenders=${JSON.stringify(width.offenders)}`,
    );
    return `history=3 actual builds; mobile=${width.document}/${width.viewport}px; conventions/limits visible`;
  }, 'final browser error gate');

  await step(8, 'Browser error gate', 'anonymous/authenticated page, console and critical request errors', () => {
    assert.deepEqual(pageErrors, [], `uncaught page errors: ${pageErrors.join('; ')}`);
    assert.deepEqual(failedCriticalRequests, [], `critical request failures: ${failedCriticalRequests.join('; ')}`);
    assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join('; ')}`);
    return 'pageErrors=0; consoleErrors=0; criticalRequestFailures=0';
  }, 'technical revalidation');

  console.log('[VERDICT] PASS · anonymous lock, bearer-authorized Starter route, curve repricing, files, edits, diagnostics and mobile are production-browser-tested');
} finally {
  if (browser) await browser.close();
  if (server && !server.killed) server.kill('SIGTERM');
  await rm(outputDirectory, { recursive: true, force: true });
}
