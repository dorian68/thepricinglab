import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const assetsDirectory = path.resolve('dist/assets');
const shellSource = await readFile(path.resolve('src/claude/ClaudeFrontend.jsx'), 'utf8');
const labSource = await readFile(path.resolve('src/components/tools/MonteCarloLab.tsx'), 'utf8');
const files = (await readdir(assetsDirectory)).filter((file) => file.endsWith('.js'));
const sources = await Promise.all(files.map(async (file) => ({ file, source: await readFile(path.join(assetsDirectory, file), 'utf8') })));
const components = sources.filter(({ file }) => file.startsWith('MonteCarloLab-'));
const workers = sources.filter(({ file }) => file.startsWith('monteCarlo.worker-'));
assert.equal(components.length, 1, `expected one dedicated Monte Carlo chunk, received ${components.map(({ file }) => file).join(', ') || 'none'}`);
assert.equal(workers.length, 1, `expected one dedicated Monte Carlo worker, received ${workers.map(({ file }) => file).join(', ') || 'none'}`);
const component = components[0];
const worker = workers[0];
for (const marker of ['Monte Carlo Pricing & Risk Lab', 'Option pricing (Q)', 'Position risk (P)', 'Terminals CSV', 'Sample paths CSV', 'Loss = −P&L']) {
  assert.ok(component.source.includes(marker), `production Monte Carlo chunk is missing '${marker}'`);
}
for (const marker of ['park_miller_16807', 'box_muller_cosine', 'risk_physical', 'pricing_risk_neutral', 'control_variate']) {
  assert.ok(worker.source.includes(marker), `production Monte Carlo worker is missing '${marker}'`);
}
const all = sources.map(({ source }) => source).join('\n');
for (const legacy of ['Coming Soon — Real-time simulation', 'Jump Diffusion (Merton)', 'Loading Pyodide', 'seed*3+1', 'Math.min(N*5,5000)']) {
  assert.ok(!all.includes(legacy), `legacy Monte Carlo path remains in production: ${legacy}`);
}
assert.ok(all.includes('validated MC engine v1'), 'catalogue does not expose the validated Monte Carlo status');
const courseBlock = shellSource.match(/function MCContent\(\)[\s\S]*?function CourseCalculator/)?.[0] ?? '';
assert.match(courseBlock, /new Worker\(new URL\('\.\.\/workers\/monteCarlo\.worker\.mjs'/);
assert.doesNotMatch(courseBlock, /Math\.random|20 of 100,000|genWalk\(|1664525|histVaR/);
assert.match(courseBlock, /same seeded run/);
assert.doesNotMatch(shellSource, /function VarMCContent|24&nbsp;737 rendements/);
const runBlock = labSource.match(/const run = \(\) => \{[\s\S]*?const pathChartData/)?.[0] ?? '';
assert.ok(runBlock.indexOf('normalizeMonteCarloInput(input)') >= 0, 'Starter lab does not validate before worker creation');
assert.ok(runBlock.indexOf('normalizeMonteCarloInput(input)') < runBlock.indexOf('new Worker('), 'invalid input can still reach the worker');
assert.match(labSource, /valueProp="One seeded distribution/);
assert.match(labSource, /trustSignals=/);
assert.doesNotMatch(labSource, /\sbadge=|\stier=|\shighlights=/);
console.log(`[STEP 1] Monte Carlo production bundle · [STATUS] ok · [INPUT] ${files.length} JavaScript assets · [OUTPUT] component=${component.file} (${component.source.length} bytes); worker=${worker.file} (${worker.source.length} bytes); P/Q contract present; Starter and course share worker; split-seed/static legacy absent`);
console.log('[VERDICT] PASS · F-CAL-6 ships as one lazy worker-backed production simulator');
