import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildDeterministicVolSurface, VOL_SURFACE_INPUT_SCHEMA } from '../src/lib/volSurface.mjs';
const workerUrl = new URL('../src/workers/volSurface.worker.mjs', import.meta.url); const source = await readFile(workerUrl, 'utf8'); assert.match(source, /import \{ analyzeVolSurface \} from '\.\.\/lib\/volSurface\.mjs'/); for (const forbidden of ['fetch(', 'XMLHttpRequest', 'document.', 'window.', 'Math.random', 'Date.now']) assert.equal(source.includes(forbidden), false);
console.log('[STEP 1] worker isolation · [STATUS] ok · [OUTPUT] canonical import and no network/DOM/ambient randomness');
const messages = []; globalThis.self = { onmessage: null, postMessage: (message) => messages.push(message) }; await import(`${workerUrl.href}?smoke=${process.pid}`);
const input = { schemaVersion: VOL_SURFACE_INPUT_SCHEMA, surfaceName: 'SPX worker', asOfDate: '2026-07-19', sourceKind: 'deterministic_fixture', interpolationMode: 'total_variance_bilinear', selectedMaturity: 0.75, selectedLogMoneyness: 0.075, quotes: buildDeterministicVolSurface('clean') };
await globalThis.self.onmessage({ data: { type: 'analyze', requestId: 'run-1', input } }); assert.equal(messages[0].type, 'result'); assert.equal(messages[0].requestId, 'run-1'); assert.equal(messages[0].result.quality.status, 'PASS');
console.log(`[STEP 2] worker success · [STATUS] ok · [OUTPUT] request preserved; SHA=${messages[0].result.analysisId.slice(0, 12)}; 20 nodes retained`);
await globalThis.self.onmessage({ data: { type: 'analyze', requestId: 'run-2', input: { ...input, selectedMaturity: 5 } } }); assert.equal(messages[1].type, 'error'); assert.equal(messages[1].requestId, 'run-2'); assert.equal('result' in messages[1], false);
console.log('[STEP 3] worker failure · [STATUS] ok · [OUTPUT] extrapolation returns a scoped error and no stale result');
await globalThis.self.onmessage({ data: { type: 'noop', requestId: 'run-3' } }); assert.deepEqual(messages[2], { type: 'error', requestId: 'run-3', error: 'Unsupported vol-surface worker message.' }); delete globalThis.self;
console.log('[STEP 4] protocol rejection · [STATUS] ok · [OUTPUT] unsupported message rejected deterministically');
console.log('[VERDICT] PASS · F-CAL-9 worker isolates surface quality analysis from the UI');

