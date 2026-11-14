import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'dist', 'assets');
const names = await readdir(assets);
const calibrationChunks = names.filter((name) => /^ModelCalibration-.*\.js$/.test(name));
const workerChunks = names.filter((name) => /^modelCalibration\.worker-.*\.js$/.test(name));
assert.equal(calibrationChunks.length, 1, `expected one ModelCalibration chunk, found ${calibrationChunks.length}`);
assert.equal(workerChunks.length, 1, `expected one calibration worker, found ${workerChunks.length}`);

const appChunkName = names.find((name) => /^ClaudeFrontend-.*\.js$/.test(name));
assert.ok(appChunkName, 'active application chunk is missing');
const calibration = await readFile(path.join(assets, calibrationChunks[0]), 'utf8');
const application = await readFile(path.join(assets, appChunkName), 'utf8');
const sampleCsv = await readFile(path.join(root, 'public', 'examples', 'tpl-volatility-surface-example.csv'), 'utf8');
const allJavaScript = (await Promise.all(names.filter((name) => name.endsWith('.js')).map((name) => readFile(path.join(assets, name), 'utf8')))).join('\n');

assert.match(calibration, /Volatility Model Calibration/, 'new calibration heading is absent from the production chunk');
assert.match(calibration, /Heston Feller margin/, 'Feller diagnostic is absent from the production chunk');
assert.match(calibration, /Calibration accepts at most/, 'surface point cap is absent from the production chunk');
assert.match(calibration, /tpl-volatility-surface-example\.csv/, 'downloadable CSV example is absent from the production chunk');
assert.match(sampleCsv, /maturity=years; impliedVol=decimal/, 'versioned CSV example is missing its unit contract');
assert.equal(sampleCsv.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).length, 11, 'versioned CSV example must contain ten data rows');
assert.match(calibration, /tpl\.model-calibration\.export\.v1/, 'calibration JSON export contract is absent from the production chunk');
assert.match(calibration, /Session comparison/, 'run-history comparison is absent from the production chunk');
assert.ok(application.includes(calibrationChunks[0]), 'active application does not reference the calibration chunk');
assert.ok(!allJavaScript.includes('Smile Calibration (least-squares)'), 'legacy quadratic calibration remains in production');
assert.ok(!allJavaScript.includes('Enhanced Heston Model'), 'fake contributive model remains in production');
assert.ok(!allJavaScript.includes('Cette fonctionnalité est en cours de développement'), 'non-functional model action remains in production');

console.log(`[STEP 1] calibration production bundle · [STATUS] ok · [REQUEST] active lazy route · [INPUT] ${names.filter((name) => name.endsWith('.js')).length} JavaScript assets · [OUTPUT] component=${calibrationChunks[0]}; worker=${workerChunks[0]}; legacy/fake=absent · [ERROR] none · [NEXT] browser journey`);
console.log('[VERDICT] PASS · deterministic calibration is shipped by the active production application');
