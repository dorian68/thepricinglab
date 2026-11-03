// This targeted browser check runs only on an isolated cloud CI runner.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Browser checks run only in GitHub Actions, never on the user computer.');
const [toolsDirectory, baselineDirectory, candidateDirectory, reportDirectory] = process.argv.slice(2);
assert.ok(toolsDirectory && baselineDirectory && candidateDirectory && reportDirectory);
const requireTool = createRequire(path.join(path.resolve(toolsDirectory), 'package.json'));
const chromeLauncher = await import(pathToFileURL(requireTool.resolve('chrome-launcher')).href);
const { default: puppeteer } = await import(pathToFileURL(requireTool.resolve('puppeteer-core')).href);
const reports = path.resolve(reportDirectory);
await mkdir(reports, { recursive: true });

async function serve(directory) {
  const root = path.resolve(directory);
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
      const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.md': 'text/markdown', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
      response.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      response.end(await readFile(target));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

const variants = { baseline: await serve(baselineDirectory), candidate: await serve(candidateDirectory) };
const diagnoseHome = process.env.PRICING_HOME_DIAGNOSTICS === 'true';
const validateHome = process.env.PRICING_HOME_VALIDATE === 'true';
const summary = {
  candidateCommit: process.env.GITHUB_SHA,
  baselineCommit: process.env.PRICING_BASELINE_SHA || 'bbd3438437084808156f2dc95346f3f5de33791c',
  scope: validateHome
    ? 'Targeted Home hero/demo and retained course/ticker checks in cloud Chrome at 320/412/768/1440 CSS pixels. No new Lighthouse or production score.'
    : diagnoseHome
    ? 'Home diagnostics only; no Home correction or acceptance claimed. Existing bounded course/ticker checks retained. Cloud Chrome at 320/412/768/1440 CSS pixels; no Lighthouse or production score.'
    : 'Targeted rendered layout/trust-label comparison in cloud Chrome at 320/412/768/1440 CSS pixels. No new Lighthouse or production score.',
  variants: {},
};
let activeVariant = '';
let activeRoute = '';
let activeWidth = 0;

async function inspect(variant) {
  const chrome = await chromeLauncher.launch({ logLevel: 'error', chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] });
  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
  const page = await browser.newPage();
  const origin = variants[variant].origin;
  const result = { rows: [], errors: [], failures: [] };
  summary.variants[variant] = result;
  page.on('pageerror', (error) => result.errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) result.failures.push({ url: response.url(), status: response.status() });
  });
  try {
    for (const width of [320, 412, 768, 1440]) {
      activeWidth = width;
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1, isMobile: width <= 412, hasTouch: width <= 412 });
      for (const route of ['/', '/courses/black-scholes']) {
        activeRoute = route;
        await page.goto(origin + route, { waitUntil: 'networkidle2', timeout: 45000 });
        await page.waitForSelector('h1', { timeout: 20000 });
        await page.waitForFunction((expected) => document.querySelector('link[rel="canonical"]')?.href === expected,
          { timeout: 20000 }, 'https://thepricinglibrary.com' + route);
        if (route !== '/') await page.waitForSelector('.course-script-markdown .katex', { timeout: 25000 });
        await page.evaluate(() => document.fonts.ready);
        const row = await page.evaluate(() => {
          const viewport = document.documentElement.clientWidth;
          const measure = (selector) => [...document.querySelectorAll(selector)].map((node) => {
            const bounds = node.getBoundingClientRect();
            const css = getComputedStyle(node);
            return { selector, text: node.textContent.trim(), left: bounds.left, right: bounds.right,
              width: bounds.width, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
              overflowX: css.overflowX, display: css.display, gridTemplateColumns: css.gridTemplateColumns,
              minWidth: css.minWidth, flexWrap: css.flexWrap, fontSize: css.fontSize };
          });
          return {
            viewport, documentWidth: document.documentElement.scrollWidth,
            headings: [...document.querySelectorAll('h1')].map((node) => node.textContent.trim()),
            title: document.title,
            canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.href),
            robots: [...document.querySelectorAll('meta[name="robots"]')].map((node) => node.content),
            anchors: [...document.querySelectorAll('a[href]')].map((node) => node.getAttribute('href')).sort(),
            courseText: document.querySelector('.container.page')?.innerText || null,
            mathCount: document.querySelectorAll('.katex').length,
            heroCopy: document.querySelector('.hero-left')?.textContent || null,
            demoLabels: measure('.hero-right .term-toolbar > .row:last-child > span'),
            topStrip: measure('.top-strip-inner > .row:first-child > span'),
            home: [
              '.hero-grid', '.hero-left', '.hero-title', '.hero-sub', '.hero-eyebrow', '.hero-ctas', '.hero-ctas .btn',
              '.kpi-row', '.kpi', '.hero-right', '.hero-right > div', '.hero-right .row', '.hero-right svg',
              '.section-head', '.grid-4', '.grid-3', '.foot-grid', '.foot-bottom', '.news-strip',
            ].flatMap(measure),
            overflowCandidates: [...document.querySelectorAll('body *')]
              .filter((node) => !node.closest('.ticker'))
              .map((node) => {
                const bounds = node.getBoundingClientRect();
                const css = getComputedStyle(node);
                return { element: node.tagName + '.' + (node.getAttribute('class') || ''),
                  parent: node.parentElement?.tagName + '.' + (node.parentElement?.getAttribute('class') || ''),
                  text: node.textContent.trim().slice(0, 100), left: bounds.left, right: bounds.right,
                  width: bounds.width, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
                  overflowX: css.overflowX, display: css.display, minWidth: css.minWidth,
                  gridTemplateColumns: css.gridTemplateColumns, flexWrap: css.flexWrap };
              }).filter((node) => node.width > 0 && (node.left < -1 || node.right > viewport + 1)),
            tabs: measure('.course-detail-layout .tabs-bar'),
            course: [
              ...measure('.course-detail-layout'), ...measure('.course-sidebar'),
              ...measure('.course-sidebar > .panel'), ...measure('.course-lesson-item'),
              ...measure('.course-lesson-item > div'),
            ],
          };
        });
        Object.assign(row, { route, width });
        result.rows.push(row);
        const id = `${variant}-${route === '/' ? 'home' : 'black-scholes'}-${width}`;
        await page.screenshot({ path: path.join(reports, id + '.png') });
        if (route === '/' && (diagnoseHome || validateHome)) {
          await page.screenshot({ path: path.join(reports, id + '-full.png'), fullPage: true });
          await (await page.$('.hero-grid')).screenshot({ path: path.join(reports, id + '-hero.png') });
        }
        if (route !== '/') await (await page.$('.course-sidebar')).screenshot({ path: path.join(reports, id + '-sidebar.png') });
        if (variant === 'candidate') {
          assert.deepEqual(row.topStrip.slice(0, 2).map((item) => item.text), ['ILLUSTRATIVE DATA', 'NOT LIVE']);
          for (const label of row.topStrip) assert.ok(label.left >= -1 && label.right <= row.viewport + 1, `${width}px: ticker label clipped`);
          for (const bar of row.tabs) assert.ok(bar.left >= -1 && bar.right <= row.viewport + 1, `${width}px: course tabs leave viewport`);
          if (route === '/' && validateHome) {
            assert.ok(row.documentWidth <= row.viewport + 1, `${width}px: Home document leaves viewport`);
            assert.deepEqual(row.demoLabels.map((label) => label.text), ['● DEMO', 'ILLUSTRATIVE']);
            for (const label of row.demoLabels) assert.ok(label.left >= -1 && label.right <= row.viewport + 1, `${width}px: demo label clipped`);
            for (const element of row.home.filter((item) => /^(\.hero|\.kpi)/.test(item.selector))) {
              assert.ok(element.left >= -1 && element.right <= row.viewport + 1, `${width}px: ${element.selector} leaves viewport`);
              assert.ok(element.scrollWidth <= element.clientWidth + 1, `${width}px: ${element.selector} clips content`);
            }
          }
          for (const element of row.course) {
            assert.ok(element.left >= -1 && element.right <= row.viewport + 1, `${width}px: ${element.selector} leaves viewport`);
            if (element.selector === '.course-detail-layout' && element.overflowX === 'visible') {
              // Existing tabs use negative margins. Their visible overhang is valid
              // only while it stays inside the viewport; panels/text may not clip.
              assert.ok(element.left + element.scrollWidth <= row.viewport + 1, `${width}px: visible course grid content leaves viewport`);
            } else assert.ok(element.scrollWidth <= element.clientWidth + 1, `${width}px: ${element.selector} clips content`);
          }
          if (route !== '/') assert.ok(row.documentWidth <= row.viewport + 1, `${width}px: course page has horizontal document overflow`);
        }
        if (route !== '/') {
          const modules = await page.$$('.course-lesson-item');
          assert.equal(modules.length, 4, 'The four baseline course modules must remain available');
          await modules[3].click();
          await page.waitForFunction(() => [...document.querySelectorAll('.course-lesson-item')][3]?.classList.contains('active'));
          row.moduleSelection = 'PASS';
        }
      }
    }
    assert.deepEqual(result.errors, [], `${variant}: uncaught browser error`);
    assert.deepEqual(result.failures, [], `${variant}: first-party HTTP failure`);
    result.status = 'PASS';
  } catch (error) {
    result.status = 'FAIL';
    await writeFile(path.join(reports, `${variant}-failure.html`), await page.content());
    await page.screenshot({ path: path.join(reports, `${variant}-failure.png`) });
    throw error;
  } finally { await browser.disconnect(); await chrome.kill(); }
}

try {
  for (const variant of ['baseline', 'candidate']) { activeVariant = variant; await inspect(variant); }
  for (const candidate of summary.variants.candidate.rows) {
    const baseline = summary.variants.baseline.rows.find((row) => row.width === candidate.width && row.route === candidate.route);
    for (const field of ['title', 'headings', 'canonical', 'robots', 'anchors', 'courseText', 'heroCopy', 'mathCount']) {
      assert.deepEqual(candidate[field], baseline[field], `${candidate.width}px ${candidate.route}: ${field} changed`);
    }
  }
  summary.status = 'PASS';
} catch (error) {
  Object.assign(summary, { status: 'FAIL', error: error.message, activeVariant, activeRoute, activeWidth });
  throw error;
} finally {
  await writeFile(path.join(reports, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ status: summary.status, error: summary.error, scope: summary.scope }));
  for (const { server } of Object.values(variants)) await new Promise((resolve) => server.close(resolve));
}
