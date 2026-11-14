import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  MONTE_CARLO_CONTRACT,
  MONTE_CARLO_INPUT_SCHEMA,
  analyzeMonteCarlo,
  buildMonteCarloJson,
  buildMonteCarloPathsCsv,
  buildMonteCarloTerminalCsv,
  normalizeMonteCarloInput,
} from '../src/lib/monteCarlo.mjs';

const root = new URL('../../../', import.meta.url);
const authority = JSON.parse(await readFile(new URL('fixtures/monte_carlo_contract.json', root), 'utf8'));
const step = (number, name, output) => console.log(`[STEP ${number}] ${name} · [STATUS] ok · [OUTPUT] ${output}`);

const common = {
  schemaVersion: MONTE_CARLO_INPUT_SCHEMA,
  spot: 100,
  volatility: 0.2,
  maturityYears: 1,
  dayCount: 'ACT/365F',
  paths: 10_000,
  timeSteps: 12,
  seed: 7,
  method: 'antithetic',
  samplePaths: 8,
  histogramBins: 24,
  currency: 'USD',
  quantity: 2,
  contractMultiplier: 100,
  position: 'long',
};
const pricing = {
  ...common,
  mode: 'pricing_risk_neutral',
  riskFreeRate: 0.05,
  dividendYield: 0,
  strike: 100,
  optionType: 'call',
  payoffType: 'european',
};
const risk = {
  ...common,
  mode: 'risk_physical',
  physicalDrift: 0.06,
  confidence: 0.99,
};

assert.equal(authority.engineVersion, MONTE_CARLO_CONTRACT.engineVersion);
assert.deepEqual(authority.rng, MONTE_CARLO_CONTRACT.rng);
assert.deepEqual(authority.limits, MONTE_CARLO_CONTRACT.limits);
assert.deepEqual(authority.modes, MONTE_CARLO_CONTRACT.enums.modes);
assert.deepEqual(authority.methods, MONTE_CARLO_CONTRACT.enums.methods);
assert.deepEqual(authority.exports.terminalCsvHeaders, MONTE_CARLO_CONTRACT.exports.terminalCsvHeaders);
assert.deepEqual(authority.exports.pathsCsvHeaders, MONTE_CARLO_CONTRACT.exports.pathsCsvHeaders);
step(1, 'canonical Monte Carlo contract', 'version, RNG, domains, modes and export headers equal JSON authority');

const firstRisk = await analyzeMonteCarlo(risk);
const repeatedRisk = await analyzeMonteCarlo(risk);
assert.deepEqual(firstRisk, repeatedRisk);
assert.equal(firstRisk.measure, 'P');
assert.equal(firstRisk.run.requestedPaths, risk.paths);
assert.equal(firstRisk.run.simulatedPaths, risk.paths);
assert.equal(firstRisk.samplePaths.length, risk.samplePaths);
for (const path of firstRisk.samplePaths) {
  assert.equal(path.points.at(-1).spot, firstRisk.observations[path.pathIndex].terminalSpot);
}
assert.ok(firstRisk.risk.valueAtRisk >= 0);
assert.ok(firstRisk.risk.expectedShortfall >= firstRisk.risk.valueAtRisk);
assert.equal(firstRisk.risk.tailCount, 100);
assert.match(firstRisk.risk.convention, /Loss = -P&L/);
assert.ok(Math.abs(firstRisk.distribution.meanRelativeError) < 0.01);
step(2, 'physical-risk run coherence', `one P distribution; paths=${firstRisk.run.simulatedPaths}; VaR99=${firstRisk.risk.valueAtRisk.toFixed(2)}; ES99=${firstRisk.risk.expectedShortfall.toFixed(2)}`);

const positiveDriftRisk = await analyzeMonteCarlo({ ...risk, physicalDrift: 0.25, volatility: 0.001, maturityYears: 5 / 365, paths: 1_000, timeSteps: 5, method: 'none', samplePaths: 2 });
assert.ok(positiveDriftRisk.risk.rawLossQuantile < 0, 'counterexample must have a gain even at the loss quantile');
assert.equal(positiveDriftRisk.risk.valueAtRisk, 0);
assert.equal(positiveDriftRisk.risk.expectedShortfall, 0);
step(3, 'VaR and ES sign convention', 'former positive-P&L counterexample reports zero loss VaR/ES and retains the raw signed loss quantile');

const antithetic = await analyzeMonteCarlo(pricing);
assert.equal(antithetic.measure, 'Q');
assert.equal(antithetic.pricing.effectiveSamples, pricing.paths / 2);
assert.equal(antithetic.pricing.convergence.length, 3);
assert.equal(antithetic.pricing.benchmarkInsideCi95, true);
assert.ok(Math.abs(antithetic.pricing.zScore) < 1.96);
assert.equal(antithetic.pricing.portfolioValue, antithetic.pricing.price * 200);
const control = await analyzeMonteCarlo({ ...pricing, method: 'control_variate' });
assert.equal(control.pricing.effectiveSamples, pricing.paths);
assert.ok(control.pricing.varianceReductionRatio > 1);
assert.equal(control.pricing.benchmarkInsideCi95, true);
step(4, 'risk-neutral pricing controls', `BS=${antithetic.pricing.blackScholesBenchmark.toFixed(6)}; antithetic=${antithetic.pricing.price.toFixed(6)}; control=${control.pricing.price.toFixed(6)}; VR=${control.pricing.varianceReductionRatio.toFixed(2)}x`);

const deterministic = await analyzeMonteCarlo({ ...pricing, volatility: 0, method: 'none', paths: 100, timeSteps: 1, samplePaths: 1, histogramBins: 10 });
assert.equal(deterministic.distribution.terminalStdDev, 0);
assert.equal(deterministic.distribution.histogram.length, 1);
assert.ok(Math.abs(deterministic.pricing.price - deterministic.pricing.blackScholesBenchmark) < 1e-12);
assert.equal(deterministic.pricing.standardError, 0);
const asian = await analyzeMonteCarlo({ ...pricing, payoffType: 'arithmetic_asian', method: 'control_variate', paths: 2_000 });
assert.equal(asian.pricing.blackScholesBenchmark, null);
assert.equal(asian.pricing.benchmarkInsideCi95, null);
assert.ok(asian.pricing.price > 0 && asian.pricing.price < antithetic.pricing.price);
step(5, 'degenerate and path-dependent cases', 'zero-volatility run is exact; arithmetic Asian is monitored on the canonical paths without a fake closed-form benchmark');

const terminalCsv = buildMonteCarloTerminalCsv(antithetic);
const pathsCsv = buildMonteCarloPathsCsv(antithetic);
assert.equal(terminalCsv, buildMonteCarloTerminalCsv(antithetic));
assert.equal(pathsCsv, buildMonteCarloPathsCsv(antithetic));
assert.match(terminalCsv, /^schemaVersion,engineVersion,analysisId,mode,pathIndex,terminalSpot,discountedPayoff,pnl,loss\n/);
assert.equal(terminalCsv.trimEnd().split('\n').length, pricing.paths + 1);
assert.equal(pathsCsv.trimEnd().split('\n').length, pricing.samplePaths * (pricing.timeSteps + 1) + 1);
assert.equal(JSON.parse(buildMonteCarloJson(antithetic)).analysisId, antithetic.analysisId);
step(6, 'deterministic evidence exports', `analysis=${antithetic.analysisId.slice(0, 12)}; terminal rows=${pricing.paths}; sampled path rows=${pricing.samplePaths * (pricing.timeSteps + 1)}`);

const invalid = [
  { ...risk, paths: 0 },
  { ...risk, paths: 101 },
  { ...risk, method: 'control_variate' },
  { ...risk, confidence: 0.975 },
  { ...risk, volatility: Number.MIN_VALUE * -1 },
  { ...pricing, seed: 0 },
  { ...pricing, samplePaths: 25 },
  { ...pricing, currency: 'usd' },
  { ...pricing, extra: true },
  { ...pricing, spot: Infinity },
  { ...pricing, maturityYears: 0 },
];
for (const candidate of invalid) await assert.rejects(() => analyzeMonteCarlo(candidate));
assert.throws(() => normalizeMonteCarloInput([]));
step(7, 'fail-closed adversaries', `${invalid.length + 1} schema/domain/method/non-finite cases rejected without clamping`);

console.log('[VERDICT] PASS · F-CAL-6 JavaScript engine separates P risk from Q pricing, keeps one seeded run, quantifies uncertainty and emits reproducible evidence');
