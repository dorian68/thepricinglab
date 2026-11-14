import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const assetsDirectory = path.resolve('dist/assets');
const assetNames = await readdir(assetsDirectory);
const javascriptAssets = assetNames.filter((name) => name.endsWith('.js'));
const components = javascriptAssets.filter((name) => /^RealizedVolatilityLab-.*\.js$/.test(name));
const workers = javascriptAssets.filter((name) => /^realizedVolatility\.worker-.*\.js$/.test(name));

assert.equal(components.length, 1, `expected one realized-volatility component chunk, received ${components.join(', ') || 'none'}`);
assert.equal(workers.length, 1, `expected one realized-volatility worker chunk, received ${workers.join(', ') || 'none'}`);

const componentSource = await readFile(path.join(assetsDirectory, components[0]), 'utf8');
const workerSource = await readFile(path.join(assetsDirectory, workers[0]), 'utf8');
const applicationSources = await Promise.all(javascriptAssets.map((name) => readFile(path.join(assetsDirectory, name), 'utf8')));
const allSource = applicationSources.join('\n');

for (const contract of [
  'Realized Volatility & Data Quality Lab',
  'Local processing only',
  'JSON evidence',
  'Rolling CSV',
  'Observations + flags CSV',
  'tpl.realized-volatility.rolling.v1',
  'tpl.realized-volatility.observations.v1',
]) assert.ok(componentSource.includes(contract), `component bundle is missing '${contract}'`);

for (const contract of [
  'Close-to-close',
  'Parkinson',
  'Garman-Klass',
  'Rogers-Satchell',
  'Yang-Zhang',
  'tpl.realized-volatility-analysis.v1',
  'row 0 is the previous-close seed; all estimators use rows 1..N-1',
  'no sorting, dropping, winsorization, resampling, interpolation or imputation',
]) assert.ok(workerSource.includes(contract), `worker bundle is missing '${contract}'`);

assert.doesNotMatch(componentSource, /Math\.random|genWalk|SPX|NDX|TSLA|NVDA|EURUSD|Compare estimators across assets|252 trading days, synthetic/);
assert.doesNotMatch(workerSource, /Math\.random|fetch\(|XMLHttpRequest|Date\.now|document\.|window\./);
assert.doesNotMatch(allSource, /function IVCalcTool\(|252 trading days, synthetic|Compare estimators across assets/);
assert.ok(Buffer.byteLength(componentSource) <= 500_000, `component chunk exceeds budget: ${Buffer.byteLength(componentSource)}`);
assert.ok(Buffer.byteLength(workerSource) <= 500_000, `worker chunk exceeds budget: ${Buffer.byteLength(workerSource)}`);

console.log(`[STEP 1] realized-volatility production bundle · [STATUS] ok · [REQUEST] active lazy route · [INPUT] ${javascriptAssets.length} JavaScript assets · [OUTPUT] component=${components[0]} (${Buffer.byteLength(componentSource)} bytes); worker=${workers[0]} (${Buffer.byteLength(workerSource)} bytes); legacy synthetic walk absent · [ERROR] none · [NEXT] browser journey`);
console.log('[VERDICT] PASS · five-estimator realized-volatility lab and its deterministic worker ship in isolated production chunks');
