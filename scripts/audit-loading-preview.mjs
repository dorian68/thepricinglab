// Browser work is deliberately restricted to an isolated GitHub Actions runner.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Chrome audits run only in GitHub Actions, never on the user computer.');
const [toolsDirectory, baselineDirectory, candidateDirectory, reportDirectory] = process.argv.slice(2);
assert.ok(toolsDirectory && baselineDirectory && candidateDirectory && reportDirectory);
const requireTool = createRequire(path.join(path.resolve(toolsDirectory), 'package.json'));
const { default: lighthouse } = await import(pathToFileURL(requireTool.resolve('lighthouse')).href);
const chromeLauncher = await import(pathToFileURL(requireTool.resolve('chrome-launcher')).href);
const { default: puppeteer } = await import(pathToFileURL(requireTool.resolve('puppeteer-core')).href);
const reports = path.resolve(reportDirectory);
await mkdir(reports, { recursive: true });

const mime = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.md': 'text/markdown', '.xml': 'application/xml',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

async function serve(directory) {
  const root = path.resolve(directory);
  const cache = new Map();
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let target = path.resolve(root, '.' + pathname);
      assert.ok(target === root || target.startsWith(root + path.sep));
      const metadata = await stat(target).catch(() => null);
      if (!metadata?.isFile()) {
        if (path.extname(pathname)) { response.writeHead(404).end(); return; }
        target = path.join(root, 'index.html');
      }
      if (!cache.has(target)) {
        const raw = await readFile(target);
        const compressible = /\.(html|js|css|json|md|xml|svg)$/.test(target);
        cache.set(target, { raw, gzip: compressible ? gzipSync(raw) : null });
      }
      const asset = cache.get(target);
      const compressed = asset.gzip && /\bgzip\b/.test(request.headers['accept-encoding'] || '');
      const body = compressed ? asset.gzip : asset.raw;
      response.writeHead(200, {
        'content-type': mime[path.extname(target)] || 'application/octet-stream',
        'content-length': body.length,
        'cache-control': 'no-cache',
        'vary': 'Accept-Encoding',
        ...(compressed ? { 'content-encoding': 'gzip' } : {}),
      });
      response.end(body);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

const variants = {
  baseline: await serve(baselineDirectory),
  candidate: await serve(candidateDirectory),
};
const summary = {
  candidateCommit: process.env.GITHUB_SHA,
  baselineCommit: 'afba39d327f39f7058ba7bdc489d3b70059c0c1b',
  scope: 'Gzipped builds on CI loopback, identical mobile Lighthouse settings and fresh headless Chrome per sample. These are preview comparisons, not production scores or sitelink probabilities.',
  samples: [], journeys: {},
};
const flags = ['--headless', '--no-sandbox', '--disable-dev-shm-usage'];
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function measure(variant, iteration) {
  const chrome = await chromeLauncher.launch({ chromeFlags: flags });
  try {
    const result = await lighthouse(variants[variant].origin + '/', {
      port: chrome.port, logLevel: 'error', output: ['json', 'html'],
      onlyCategories: ['performance', 'seo', 'accessibility'], maxWaitForLoad: 45000,
    });
    assert.ok(result && !result.lhr.runtimeError, `${variant}: Lighthouse runtime failed`);
    const id = `${variant}-mobile-${iteration + 1}`;
    await writeFile(path.join(reports, id + '.json'), JSON.stringify(result.lhr, null, 2));
    await writeFile(path.join(reports, id + '.html'), result.report[1]);
    const row = {
      variant, iteration: iteration + 1,
      scores: Object.fromEntries(Object.entries(result.lhr.categories).map(([key, value]) => [key, value.score])),
      fcpMs: result.lhr.audits['first-contentful-paint'].numericValue,
      lcpMs: result.lhr.audits['largest-contentful-paint'].numericValue,
      tbtMs: result.lhr.audits['total-blocking-time'].numericValue,
      cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
      unusedJavaScriptBytes: (result.lhr.audits['unused-javascript'].details?.items || []).reduce((sum, item) => sum + (item.wastedBytes || 0), 0),
      firstPartyScriptTransferBytes: result.lhr.audits['network-requests'].details.items
        .filter((item) => item.url.startsWith(variants[variant].origin) && item.resourceType === 'Script')
        .reduce((sum, item) => sum + (item.transferSize || 0), 0),
    };
    summary.samples.push(row);
    console.log(JSON.stringify(row));
  } finally { await chrome.kill(); }
}

async function journeys(variant) {
  const chrome = await chromeLauncher.launch({ chromeFlags: flags });
  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
  const page = await browser.newPage();
  const failures = [];
  const errors = [];
  const origin = variants[variant].origin;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      failures.push({ path: new URL(response.url()).pathname, status: response.status() });
    }
  });
  await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const rows = [];
  try {
    for (const [id, route, noindex] of [
      ['home', '/', false], ['courses', '/courses', false],
      ['black-scholes', '/courses/black-scholes', false],
      ['article', '/blog/bs-from-scratch', false], ['pricing', '/pricing', false],
      ['login', '/auth/login', true], ['missing-course', '/courses/not-a-course', true],
    ]) {
      await page.goto(origin + route, { waitUntil: 'networkidle2', timeout: 45000 });
      await page.waitForSelector('h1', { timeout: 20000 });
      await page.waitForFunction((expected) => document.querySelector('link[rel="canonical"]')?.href === expected,
        { timeout: 20000 }, `https://thepricinglibrary.com${route}`);
      if (id === 'black-scholes') {
        await page.waitForSelector('.course-script-markdown .katex', { timeout: 25000 });
        await page.waitForFunction(() => !document.querySelector('.course-script-markdown [role="status"]'), { timeout: 15000 });
      }
      await page.evaluate(() => document.fonts.ready);
      const row = await page.evaluate(() => ({
        title: document.title,
        headings: [...document.querySelectorAll('h1')].map((node) => node.textContent.trim()),
        canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.href),
        robots: [...document.querySelectorAll('meta[name="robots"]')].map((node) => node.content),
        anchors: [...document.querySelectorAll('a[href]')].map((node) => node.getAttribute('href')).sort(),
        mathCount: document.querySelectorAll('.katex').length,
        svgIcons: document.querySelectorAll('svg.lucide').length,
        resources: performance.getEntriesByType('resource').map((entry) => entry.name),
      }));
      row.id = id;
      assert.equal(row.robots.some((value) => value.includes('noindex')), noindex, `${variant} ${id}: incorrect robots policy`);
      assert.equal(row.canonical.length, 1, `${variant} ${id}: duplicate canonical`);
      if (variant === 'candidate' && id === 'home') {
        assert.equal(row.resources.some((url) => /MarkdownMath-|\/katex-[^/]+\.(js|css)|lucide-static/.test(url)), false, 'Deferred math or icon font loaded on the homepage');
        assert.ok(row.svgIcons > 0, 'SVG icons did not render');
      }
      await page.screenshot({ path: path.join(reports, `${variant}-${id}-mobile.png`) });
      rows.push(row);
    }

    // Exercise an actual client-side navigation with the mobile drawer.
    await page.goto(origin + '/', { waitUntil: 'networkidle2', timeout: 45000 });
    await page.click('.mobile-menu-btn');
    await page.click('.mobile-drawer-link[href="/courses"]');
    await page.waitForFunction(() => location.pathname === '/courses' && document.title === 'Quantitative Finance Courses | The Pricing Library');
    assert.equal(await page.$('.mobile-drawer'), null, 'Mobile menu did not close');
    assert.equal(errors.length, 0, `${variant}: uncaught browser errors: ${errors.join('; ')}`);
    assert.deepEqual(failures, [], `${variant}: first-party HTTP failures`);
    return { rows, mobileNavigation: 'PASS', errors, failures };
  } finally { await browser.disconnect(); await chrome.kill(); }
}

try {
  for (let iteration = 0; iteration < 3; iteration += 1) {
    for (const variant of iteration % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) await measure(variant, iteration);
  }
  for (const variant of ['baseline', 'candidate']) summary.journeys[variant] = await journeys(variant);
  for (const candidate of summary.journeys.candidate.rows) {
    const baseline = summary.journeys.baseline.rows.find((row) => row.id === candidate.id);
    for (const field of ['title', 'headings', 'canonical', 'robots', 'anchors']) {
      assert.deepEqual(candidate[field], baseline[field], `${candidate.id}: ${field} changed`);
    }
    if (candidate.id === 'black-scholes') assert.equal(candidate.mathCount, baseline.mathCount, 'Course mathematics changed');
  }
  summary.medians = Object.fromEntries(['baseline', 'candidate'].map((variant) => {
    const rows = summary.samples.filter((row) => row.variant === variant);
    return [variant, Object.fromEntries(['fcpMs', 'lcpMs', 'tbtMs', 'cls', 'unusedJavaScriptBytes', 'firstPartyScriptTransferBytes']
      .map((key) => [key, median(rows.map((row) => row[key]))]))];
  }));
  const candidate = summary.medians.candidate;
  const baseline = summary.medians.baseline;
  assert.ok(candidate.lcpMs <= baseline.lcpMs * 1.15, 'Median LCP regressed beyond the 15% measurement tolerance');
  assert.ok(candidate.tbtMs <= baseline.tbtMs + 100, 'Median TBT regressed beyond the 100 ms tolerance');
  assert.ok(candidate.firstPartyScriptTransferBytes < baseline.firstPartyScriptTransferBytes * 0.7, 'Initial first-party script transfer did not fall by at least 30%');
  assert.ok(candidate.cls <= 0.1, 'Candidate CLS exceeds the existing 0.1 budget');
  summary.status = 'PASS';
} catch (error) {
  summary.status = 'FAIL';
  summary.error = error.message;
  throw error;
} finally {
  await writeFile(path.join(reports, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ status: summary.status, medians: summary.medians, scope: summary.scope }));
  for (const { server } of Object.values(variants)) await new Promise((resolve) => server.close(resolve));
}
