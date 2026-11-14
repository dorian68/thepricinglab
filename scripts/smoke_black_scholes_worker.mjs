import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workerUrl = new URL('../src/workers/blackScholes.worker.mjs', import.meta.url);
const source = await readFile(workerUrl, 'utf8');
assert.match(source, /import \{ analyzeBlackScholes \} from '\.\.\/lib\/blackScholes\.mjs'/);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'document.', 'window.', 'Math.random', 'Date.now']) assert.equal(source.includes(forbidden), false);
console.log('[STEP 1] worker isolation · [STATUS] ok · [OUTPUT] canonical engine import; no network, DOM, clock or ambient randomness');

const messages = [];
globalThis.self = { onmessage: null, postMessage: (message) => messages.push(message) };
await import(`${workerUrl.href}?smoke=${process.pid}`);
const input = { schemaVersion: 'tpl.black-scholes.input.v1', quoteMode: 'volatility', optionType: 'call', spot: 100, strike: 100, maturityYears: 0.5, dayCount: 'ACT/365F', riskFreeRate: 0.02, dividendYield: 0, volatility: 0.2, marketPrice: null, currency: 'EUR', position: 'long', quantity: 10, multiplier: 100, shocks: { spotPct: 10, volPoints: 5, days: 30 } };
await globalThis.self.onmessage({ data: { type: 'analyze', requestId: 'bs-1', input } });
assert.equal(messages[0].type, 'result'); assert.equal(messages[0].requestId, 'bs-1'); assert.equal(messages[0].result.parity.holds, true); assert.equal(messages[0].result.scenarios.length, 6);
console.log(`[STEP 2] worker success · [STATUS] ok · [OUTPUT] request preserved; SHA=${messages[0].result.analysisId.slice(0, 12)}; price, Greeks, parity and scenarios retained`);
await globalThis.self.onmessage({ data: { type: 'analyze', requestId: 'bs-2', input: { ...input, spot: 0 } } });
assert.equal(messages[1].type, 'error'); assert.equal(messages[1].requestId, 'bs-2'); assert.match(messages[1].error, /spot/i); assert.equal('result' in messages[1], false);
console.log('[STEP 3] worker failure · [STATUS] ok · [OUTPUT] invalid spot returns scoped error and no stale result');
await globalThis.self.onmessage({ data: { type: 'noop', requestId: 'bs-3' } });
assert.deepEqual(messages[2], { type: 'error', requestId: 'bs-3', error: 'Invalid Black-Scholes worker request.' });
delete globalThis.self;
console.log('[STEP 4] protocol rejection · [STATUS] ok · [OUTPUT] unsupported message rejected deterministically');
console.log('[VERDICT] PASS · F-CAL10 worker isolates canonical pricing, IV, Greeks and scenarios from the UI');
