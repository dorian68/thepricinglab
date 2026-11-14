import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workerUrl = new URL('../src/workers/monteCarlo.worker.mjs', import.meta.url);
const workerSource = await readFile(workerUrl, 'utf8');

assert.match(workerSource, /import \{ analyzeMonteCarlo \} from '\.\.\/lib\/monteCarlo\.mjs'/);
assert.match(workerSource, /request\.type !== 'analyze'/);
assert.match(workerSource, /type: 'result'/);
assert.match(workerSource, /type: 'error'/);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'document.', 'window.', 'Math.random', 'Date.now']) {
  assert.equal(workerSource.includes(forbidden), false, `worker must not use ${forbidden}`);
}
console.log('[STEP 1] Worker isolation contract · [STATUS] ok · [OUTPUT] canonical engine import, typed protocol and no network/DOM/ambient randomness');

const messages = [];
globalThis.self = {
  onmessage: null,
  postMessage(message) {
    messages.push(message);
  },
};
await import(`${workerUrl.href}?smoke=${process.pid}`);
assert.equal(typeof globalThis.self.onmessage, 'function');

const input = {
  schemaVersion: 'tpl.monte-carlo.input.v1',
  mode: 'pricing_risk_neutral',
  spot: 100,
  volatility: 0.2,
  maturityYears: 1,
  dayCount: 'ACT/365F',
  paths: 1000,
  timeSteps: 12,
  seed: 7,
  method: 'antithetic',
  samplePaths: 4,
  histogramBins: 20,
  currency: 'USD',
  quantity: 1,
  contractMultiplier: 100,
  position: 'long',
  riskFreeRate: 0.05,
  dividendYield: 0,
  strike: 100,
  optionType: 'call',
  payoffType: 'european',
};

await globalThis.self.onmessage({ data: { type: 'analyze', requestId: 'run-1', input } });
assert.equal(messages.length, 1);
assert.equal(messages[0].type, 'result');
assert.equal(messages[0].requestId, 'run-1');
assert.equal(messages[0].result.measure, 'Q');
assert.equal(messages[0].result.run.simulatedPaths, 1000);
assert.equal(messages[0].result.samplePaths.length, 4);
console.log(`[STEP 2] Worker success response · [STATUS] ok · [OUTPUT] requestId preserved; Q result=${messages[0].result.analysisId.slice(0, 12)}; paths=1000`);

await globalThis.self.onmessage({ data: { type: 'analyze', requestId: 'run-2', input: { ...input, paths: 101 } } });
assert.equal(messages.length, 2);
assert.equal(messages[1].type, 'error');
assert.equal(messages[1].requestId, 'run-2');
assert.match(messages[1].error, /even/i);
assert.equal('result' in messages[1], false);
console.log('[STEP 3] Worker fail-closed response · [STATUS] ok · [OUTPUT] invalid antithetic N returns a scoped error and no stale result');

await globalThis.self.onmessage({ data: { type: 'noop', requestId: 'run-3' } });
assert.equal(messages.length, 3);
assert.deepEqual(messages[2], { type: 'error', requestId: 'run-3', error: 'Invalid Monte Carlo worker request.' });
delete globalThis.self;
console.log('[STEP 4] Worker protocol rejection · [STATUS] ok · [OUTPUT] unsupported message type rejected deterministically');
console.log('[VERDICT] PASS · F-CAL-6 worker keeps heavy simulation off the UI contract with deterministic success and fail-closed messages');
