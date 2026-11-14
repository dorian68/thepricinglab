import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4176;
const baseUrl = `http://${host}:${port}`;
const telemetryUrl = 'https://rum.test/telemetry/rum';
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const outputDirectory = path.resolve('.rum-dist');

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with ${code}: ${output.slice(-4000)}`));
    });
  });
}

async function waitFor(checkReady, label, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await checkReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

if (path.dirname(outputDirectory) !== process.cwd()) {
  throw new Error('Refusing to use a temporary build directory outside the frontend project');
}

let preview;
let browser;
try {
  fs.rmSync(outputDirectory, { recursive: true, force: true });
  await run(process.execPath, [viteBin, 'build', '--outDir', outputDirectory], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_TPL_RUM_ENABLED: 'true',
      VITE_TPL_RAG_API_URL: 'https://rum.test',
    },
  });

  preview = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort', '--outDir', outputDirectory],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
  );
  await waitFor(async () => {
    try {
      return (await fetch(baseUrl)).ok;
    } catch {
      return false;
    }
  }, `Vite preview at ${baseUrl}`);

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  const measurements = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route(telemetryUrl, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': baseUrl,
          'Access-Control-Allow-Headers': 'content-type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      });
      return;
    }
    measurements.push(request.postDataJSON());
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': baseUrl },
      body: JSON.stringify({ accepted: true }),
    });
  });

  await page.goto(`${baseUrl}/courses/black-scholes?email=private@example.test&token=secret`, {
    waitUntil: 'networkidle',
  });
  await waitFor(
    () => measurements.some(({ metric }) => metric === 'TTFB')
      && measurements.some(({ metric }) => metric === 'FCP'),
    'TTFB and FCP telemetry',
  );
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await waitFor(() => measurements.some(({ metric }) => metric === 'CLS'), 'pagehide telemetry flush');

  const serialized = JSON.stringify(measurements);
  const allowedMetrics = new Set(['FCP', 'LCP', 'CLS', 'TTFB', 'INTERACTION']);
  const allowedKeys = new Set(['metric', 'value', 'route', 'navigation_type']);
  check(measurements.length >= 3, 'production browser emits multiple RUM measurements');
  check(measurements.every(({ metric }) => allowedMetrics.has(metric)), 'browser emits only allow-listed metric names');
  check(measurements.every(({ route }) => route === '/courses/:slug'), 'browser normalizes the course route before transmission');
  check(
    measurements.every((measurement) => Object.keys(measurement).every((key) => allowedKeys.has(key))),
    'browser payload contains only the four approved fields',
  );
  check(
    measurements.every(({ value }) => Number.isFinite(value) && value >= 0),
    'browser sends finite non-negative measurements',
  );
  check(!serialized.includes('black-scholes'), 'browser does not transmit the raw course slug');
  check(!serialized.includes('private@example.test'), 'browser does not transmit query-string email data');
  check(!serialized.includes('secret'), 'browser does not transmit query-string token data');
  check(pageErrors.length === 0, `browser journey has no uncaught page errors${pageErrors.length ? `: ${pageErrors.join('; ')}` : ''}`);
  console.log('Production RUM browser smoke complete.');
} finally {
  if (browser) await browser.close();
  if (preview) preview.kill('SIGTERM');
  fs.rmSync(outputDirectory, { recursive: true, force: true });
}
