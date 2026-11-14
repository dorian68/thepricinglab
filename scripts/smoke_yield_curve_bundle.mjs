import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const distRoot = path.resolve('dist');
const assetsRoot = path.join(distRoot, 'assets');
const files = await readdir(assetsRoot);
const javascriptFiles = files.filter((file) => file.endsWith('.js'));
assert.ok(javascriptFiles.length > 0, 'production bundle must contain JavaScript assets');

const sources = new Map();
for (const file of javascriptFiles) {
  sources.set(file, await readFile(path.join(assetsRoot, file), 'utf8'));
}

const curveChunks = javascriptFiles.filter((file) => /^YieldCurveBuilder-.*\.js$/.test(file));
assert.equal(curveChunks.length, 1, `expected one lazy YieldCurveBuilder chunk, found ${curveChunks.join(', ') || 'none'}`);
const curveChunk = curveChunks[0];
const curveSource = sources.get(curveChunk);

const applicationChunks = javascriptFiles.filter((file) => /^ClaudeFrontend-.*\.js$/.test(file));
assert.equal(applicationChunks.length, 1, 'expected one active ClaudeFrontend application chunk');
const applicationSource = sources.get(applicationChunks[0]);
assert.ok(applicationSource.includes(curveChunk.replace(/\.js$/, '')), 'active application must reference the lazy curve chunk');

assert.ok(curveSource.includes('tpl.yield-curve.result.v1'), 'curve chunk must contain the result schema');
assert.ok(curveSource.includes('tpl.yield-curve.export.v1'), 'curve chunk must contain the export schema');
assert.ok(curveSource.includes('log-linear discount factors'), 'curve chunk must contain the interpolation convention');
assert.ok(curveSource.includes('explicit convexity'), 'curve chunk must require explicit future convexity');
assert.ok(curveSource.includes('No stale result is displayed'), 'curve chunk must fail closed after edits/errors');
assert.ok(curveSource.includes('Exact instrument repricing'), 'curve chunk must expose its trust contract');
assert.ok(!curveSource.includes('Math.random'), 'curve chunk must contain no random computation');

const allProductionSource = [...sources.values()].join('\n');
assert.ok(!allProductionSource.includes('function bootstrapCurve'), 'legacy sparse-node function must be absent from production');
assert.ok(!allProductionSource.includes('1y fwd'), 'misleading legacy forward label must be absent from production');
assert.ok(!allProductionSource.includes('YieldCurveTool'), 'legacy inline component must be absent from production');

console.log(`[STEP 1] curve production bundle · [STATUS] ok · [REQUEST] active lazy route · [INPUT] ${javascriptFiles.length} JavaScript assets · [OUTPUT] component=${curveChunk}; legacy=absent; schemas/conventions/repricing=present · [ERROR] none · [NEXT] browser journey`);
console.log('[VERDICT] PASS · deterministic yield-curve builder is shipped by the active production application');
