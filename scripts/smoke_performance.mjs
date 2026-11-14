import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { chromium, devices } from 'playwright';

const host = '127.0.0.1';
const port = 4175;
const baseUrl = `http://${host}:${port}`;
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const budgets = {
  firstContentfulPaintMs: 2_500,
  largestContentfulPaintMs: 4_000,
  cumulativeLayoutShift: 0.1,
  interactionLatencyMs: 300,
  maxInteractionLatencyMs: 400,
};
const failures = [];

function check(condition, message, details) {
  console.log(`[STATUS] ${condition ? 'ok' : 'fail'} · ${message}${details ? ` · ${details}` : ''}`);
  if (!condition) failures.push(`${message}${details ? `: ${details}` : ''}`);
}

const formatMetric = (value, digits = 1) => Number.isFinite(value) ? value.toFixed(digits) : 'missing';

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
  const context = await browser.newContext({ ...devices['Pixel 5'] });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    connectionType: 'cellular4g',
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.addInitScript(() => {
    globalThis.__tplPerf = { lcp: null, cls: 0, shifts: [], interactions: {} };
    if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const latest = entries[entries.length - 1];
        if (latest) globalThis.__tplPerf.lcp = latest.renderTime || latest.loadTime || latest.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) continue;
          globalThis.__tplPerf.cls += entry.value;
          globalThis.__tplPerf.shifts.push({
            value: entry.value,
            startTime: entry.startTime,
            sources: (entry.sources || []).map((source) => {
              const node = source.node;
              if (!node) return 'unknown';
              if (node.id) return `#${node.id}`;
              const classes = typeof node.className === 'string' ? node.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
              return `${node.tagName?.toLowerCase() || 'node'}${classes ? `.${classes}` : ''}`;
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes('event')) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.interactionId) continue;
          const previous = globalThis.__tplPerf.interactions[entry.interactionId] || 0;
          globalThis.__tplPerf.interactions[entry.interactionId] = Math.max(previous, entry.duration || 0);
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    }
  });

  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  console.log('[STEP 1] constrained mobile load · [INPUT] Pixel 5; 1.6 Mbps down; 750 kbps up; 150 ms RTT; 4x CPU');
  await page.goto(`${baseUrl}/starter-kit`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Du modèle au livrable défendable.', exact: true }).waitFor();
  await page.waitForTimeout(500);

  const loadMetrics = await page.evaluate(() => {
    const paint = performance.getEntriesByName('first-contentful-paint')[0];
    const navigation = performance.getEntriesByType('navigation')[0];
    const scripts = performance.getEntriesByType('resource').filter((entry) => entry.initiatorType === 'script');
    return {
      firstContentfulPaintMs: paint?.startTime ?? null,
      largestContentfulPaintMs: globalThis.__tplPerf.lcp,
      cumulativeLayoutShift: globalThis.__tplPerf.cls,
      layoutShifts: globalThis.__tplPerf.shifts,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
      loadEventMs: navigation?.loadEventEnd ?? null,
      scriptTransferBytes: scripts.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
      scriptCount: scripts.length,
    };
  });

  check(Number.isFinite(loadMetrics.firstContentfulPaintMs), 'FCP was observed', JSON.stringify(loadMetrics));
  check(Number.isFinite(loadMetrics.largestContentfulPaintMs), 'LCP was observed', JSON.stringify(loadMetrics));
  check(loadMetrics.firstContentfulPaintMs <= budgets.firstContentfulPaintMs, 'FCP meets the product budget', `${formatMetric(loadMetrics.firstContentfulPaintMs)} <= ${budgets.firstContentfulPaintMs} ms`);
  check(loadMetrics.largestContentfulPaintMs <= budgets.largestContentfulPaintMs, 'LCP meets the product budget', `${formatMetric(loadMetrics.largestContentfulPaintMs)} <= ${budgets.largestContentfulPaintMs} ms`);
  check(loadMetrics.cumulativeLayoutShift <= budgets.cumulativeLayoutShift, 'CLS meets the product budget', `${formatMetric(loadMetrics.cumulativeLayoutShift, 4)} <= ${budgets.cumulativeLayoutShift}`);

  console.log('[STEP 2] constrained interaction · [REQUEST] open the Starter Kit account path three times');
  await page.evaluate(() => {
    globalThis.__tplPerf.interactions = {};
  });
  for (let sample = 1; sample <= 3; sample += 1) {
    await page.getByRole('link', { name: 'Créer un compte', exact: true }).click();
    await page.waitForURL(/\/auth\/signup\?next=starter-kit/);
    await page.waitForTimeout(300);
    if (sample < 3) {
      await page.goBack();
      await page.waitForURL(/\/starter-kit$/);
      await page.getByRole('heading', { name: 'Du modèle au livrable défendable.', exact: true }).waitFor();
      await page.waitForTimeout(150);
    }
  }

  const interactionMetrics = await page.evaluate(() => {
    const durations = Object.values(globalThis.__tplPerf.interactions).sort((left, right) => left - right);
    const medianIndex = durations.length ? Math.floor(durations.length / 2) : -1;
    return {
      interactionCount: durations.length,
      interactionLatencyMs: medianIndex >= 0 ? durations[medianIndex] : null,
      maxInteractionLatencyMs: durations.length ? durations[durations.length - 1] : null,
      samplesMs: durations,
    };
  });

  check(interactionMetrics.interactionCount >= 3, 'three interaction samples were observed', `interactions=${interactionMetrics.interactionCount}`);
  check(interactionMetrics.interactionLatencyMs <= budgets.interactionLatencyMs, 'median lab interaction latency meets the product budget', `${formatMetric(interactionMetrics.interactionLatencyMs)} <= ${budgets.interactionLatencyMs} ms`);
  check(interactionMetrics.maxInteractionLatencyMs <= budgets.maxInteractionLatencyMs, 'worst lab interaction latency meets the product budget', `${formatMetric(interactionMetrics.maxInteractionLatencyMs)} <= ${budgets.maxInteractionLatencyMs} ms`);
  check(pageErrors.length === 0, 'performance journey has no uncaught page error', pageErrors.join('; '));

  console.log(`[OUTPUT] ${JSON.stringify({ profile: 'mobile-constrained-v1', budgets, loadMetrics, interactionMetrics })}`);
  if (failures.length) throw new Error(`Performance budget failures: ${failures.join(' | ')}`);
  console.log('[VERDICT] PASS · constrained mobile performance budgets are reproducible from the CLI');
} finally {
  if (browser) await browser.close();
  preview.kill('SIGTERM');
}
