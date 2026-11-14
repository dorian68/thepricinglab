import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  PAYOFF_STRATEGY_CONTRACT,
  analyzePayoffStrategy,
  blackScholesLeg,
  buildPayoffCurveCsv,
  buildPayoffJson,
  buildPayoffScenarioCsv,
} from '../src/lib/payoffStrategy.mjs';

const close = (actual, expected, tolerance = 1e-10, label = 'value') => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);
};

const rawContract = JSON.parse(await readFile(new URL('../../../fixtures/payoff_strategy_contract.json', import.meta.url), 'utf8'));
const goldenFixture = JSON.parse(await readFile(new URL('../../../fixtures/payoff_strategy_golden.json', import.meta.url), 'utf8'));
assert.deepEqual(PAYOFF_STRATEGY_CONTRACT, rawContract);
console.log('[STEP 1] canonical payoff contract · [STATUS] ok · [OUTPUT] runtime limits, enums, units, numeric and export rules equal JSON authority');

const market = {
  spot: 100, volatility: 0.2, timeToMaturity: 1, riskFreeRate: 0,
  dividendYield: 0, currency: 'USD', contractMultiplier: 100, gridPoints: 401,
};
const leg = (id, type, side, strike, quantity = 1, manualPremium = null) => ({
  id, type, side, strike, quantity,
  premiumSource: manualPremium === null ? 'model' : 'manual', manualPremium,
});
const analyze = (legs, overrides = {}) => analyzePayoffStrategy({ ...market, ...overrides, legs });

const call = blackScholesLeg({ ...market, strike: 100, type: 'call' });
const put = blackScholesLeg({ ...market, strike: 100, type: 'put' });
close(call.price, 7.965578879433949, 1e-12, 'ATM call');
close(call.price - put.price, 0, 1e-12, 'zero-rate parity');
const longModel = await analyze([leg('call', 'call', 'long', 100)]);
const shortModel = await analyze([leg('call', 'call', 'short', 100)]);
for (const greek of ['delta', 'gamma', 'vega', 'theta', 'rho']) close(shortModel.greeks[greek], -longModel.greeks[greek], 1e-12, `short ${greek}`);
close(longModel.summary.netEntryPremium, call.price * 100, 1e-10, 'model premium scaling');
console.log('[STEP 2] Black-Scholes and signed Greeks · [STATUS] ok · [OUTPUT] ATM golden, parity, model premium and all five short signs pass');

const longCall = await analyze([leg('call', 'call', 'long', 200, 1, 5)], { contractMultiplier: 1 });
assert.deepEqual(longCall.bounds, { maxProfit: { kind: 'unlimited', amount: null }, maxLoss: { kind: 'finite', amount: 5 } });
assert.deepEqual(longCall.breakevens, [205]);
const shortCall = await analyze([leg('call', 'call', 'short', 100, 1, 5)], { contractMultiplier: 1 });
assert.deepEqual(shortCall.bounds, { maxProfit: { kind: 'finite', amount: 5 }, maxLoss: { kind: 'unlimited', amount: null } });
const longPut = await analyze([leg('put', 'put', 'long', 200, 1, 5)], { contractMultiplier: 1 });
assert.deepEqual(longPut.bounds, { maxProfit: { kind: 'finite', amount: 195 }, maxLoss: { kind: 'finite', amount: 5 } });
assert.deepEqual(longPut.breakevens, [195]);
console.log('[STEP 3] analytical tails and off-window roots · [STATUS] ok · [OUTPUT] long/short calls plus K=200 put report exact unlimited/finite bounds and 195/205 roots');

const bull = await analyze([leg('lower', 'call', 'long', 100, 1, 6), leg('upper', 'call', 'short', 110, 1, 2.5)]);
assert.deepEqual(bull.bounds, { maxProfit: { kind: 'finite', amount: 650 }, maxLoss: { kind: 'finite', amount: 350 } });
assert.deepEqual(bull.breakevens, [103.5]);
close(bull.summary.netEntryPremium, 350, 1e-12, 'bull spread debit');
const straddle = await analyze([leg('call', 'call', 'long', 100, 1, 5), leg('put', 'put', 'long', 100, 1, 5)]);
assert.deepEqual(straddle.breakevens, [90, 110]);
assert.equal(straddle.bounds.maxProfit.kind, 'unlimited');
close(straddle.bounds.maxLoss.amount, 1000, 1e-12, 'straddle max loss');
const butterfly = await analyze([leg('c95', 'call', 'long', 95, 1, 7), leg('c100', 'call', 'short', 100, 2, 4), leg('c105', 'call', 'long', 105, 1, 2)]);
assert.deepEqual(butterfly.breakevens, [96, 104]);
assert.deepEqual(butterfly.bounds, { maxProfit: { kind: 'finite', amount: 400 }, maxLoss: { kind: 'finite', amount: 100 } });
const condor = await analyze([leg('p85', 'put', 'long', 85, 1, 1), leg('p95', 'put', 'short', 95, 1, 2.5), leg('c105', 'call', 'short', 105, 1, 2.5), leg('c115', 'call', 'long', 115, 1, 1)]);
assert.deepEqual(condor.breakevens, [92, 108]);
assert.deepEqual(condor.bounds, { maxProfit: { kind: 'finite', amount: 300 }, maxLoss: { kind: 'finite', amount: 700 } });
assert.equal(goldenFixture.schemaVersion, 'tpl.payoff-strategy.golden.v1');
for (const fixture of goldenFixture.cases) {
  const result = await analyzePayoffStrategy({ ...goldenFixture.market, ...fixture.overrides, legs: fixture.legs });
  assert.deepEqual(result.breakevens, fixture.expected.breakevens, fixture.id);
  assert.deepEqual(result.bounds, fixture.expected.bounds, fixture.id);
  close(result.summary.netEntryPremium, fixture.expected.netEntryPremium, 1e-12, `${fixture.id} net premium`);
  if (fixture.expected.analysisId) assert.equal(result.analysisId, fixture.expected.analysisId);
}
console.log(`[STEP 4] shared strategy golden cases · [STATUS] ok · [INPUT] ${goldenFixture.cases.length} canonical fixtures · [OUTPUT] long/short call, bull spread, straddle, butterfly, iron condor and terminal put use exact premiums, multipliers, roots and bounds`);

const repeat = await analyze([leg('lower', 'call', 'long', 100, 1, 6), leg('upper', 'call', 'short', 110, 1, 2.5)]);
assert.deepEqual(repeat, bull);
assert.match(bull.analysisId, /^[a-f0-9]{64}$/);
const json = buildPayoffJson(bull);
const curveCsv = buildPayoffCurveCsv(bull);
const scenarioCsv = buildPayoffScenarioCsv(bull);
assert.equal(JSON.parse(json).analysisId, bull.analysisId);
assert.match(curveCsv, /^schemaVersion,engineVersion,analysisId,terminalSpot,grossPayoff,terminalPnl\n/);
assert.match(scenarioCsv, /^schemaVersion,engineVersion,analysisId,terminalSpot,grossPayoff,terminalPnl,legContributions\n/);
assert.ok(bull.curve.some((point) => point.terminalSpot === 103.5));
console.log('[STEP 5] deterministic evidence · [STATUS] ok · [OUTPUT] repeat result, SHA-256, JSON and two versioned CSV exports are stable; exact breakeven retained in chart');

const valid = { ...market, legs: [leg('x', 'call', 'long', 100, 1, 5)] };
const rejects = [
  { ...valid, extra: true },
  { ...valid, spot: Number.NaN },
  { ...valid, spot: Number.MIN_VALUE },
  { ...valid, volatility: Number.MIN_VALUE },
  { ...valid, timeToMaturity: Number.MIN_VALUE },
  { ...valid, contractMultiplier: Number.MIN_VALUE },
  { ...valid, contractMultiplier: 0 },
  { ...valid, gridPoints: 100 },
  { ...valid, legs: [] },
  { ...valid, legs: [{ ...valid.legs[0], strike: -1 }] },
  { ...valid, legs: [{ ...valid.legs[0], quantity: 1.5 }] },
  { ...valid, legs: [valid.legs[0], { ...valid.legs[0] }] },
  { ...valid, legs: [{ ...valid.legs[0], premiumSource: 'model', manualPremium: 5 }] },
  { ...valid, currency: 'usd' },
];
for (const candidate of rejects) await assert.rejects(() => analyzePayoffStrategy(candidate));
const corruptedResult = structuredClone(longModel);
corruptedResult.greeks.gamma = Number.POSITIVE_INFINITY;
assert.throws(() => buildPayoffJson(corruptedResult), /non-finite/);
console.log(`[STEP 6] fail-closed adversaries · [STATUS] ok · [OUTPUT] ${rejects.length} schema/domain/duplicate/non-finite cases rejected`);

const activeShell = await readFile(new URL('../src/claude/ClaudeFrontend.jsx', import.meta.url), 'utf8');
assert.match(activeShell, /PayoffStrategyLabTool = React\.lazy/);
assert.doesNotMatch(activeShell, /function PayoffVisualizerTool|P&L at expiry|S=100, σ=20%, T=30d|Save strategy/);
for (const retiredPath of [
  '../src/pages/tools/PayoffVisualizer.tsx',
  '../src/hooks/usePayoffCalculator.ts',
  '../src/components/strategies/StrategyBuilder.tsx',
  '../src/components/strategies/StrategyResults.tsx',
  '../src/components/strategies/OptionLegForm.tsx',
]) await assert.rejects(() => readFile(new URL(retiredPath, import.meta.url), 'utf8'));
console.log('[STEP 7] active source uniqueness · [STATUS] ok · [OUTPUT] one lazy F-CAL-5 route; both grid-bound payoff implementations and fake-save path are absent');
console.log('[VERDICT] PASS · F-CAL-5 JavaScript engine is deterministic, analytically bounded, premium-aware, unit-explicit and CLI-tested');
