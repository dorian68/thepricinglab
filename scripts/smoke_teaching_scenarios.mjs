import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { shortStrangleScenario } from '../src/lib/teachingScenarios.mjs';

const cases = [
  { n: 'Bullish drift', mu: 0.15, sigma: 0.12, seed: 11 },
  { n: 'Bearish drift', mu: -0.15, sigma: 0.15, seed: 22 },
  { n: 'Vol spike', mu: 0, sigma: 0.45, seed: 33 },
  { n: 'Vol crush', mu: 0, sigma: 0.08, seed: 44 },
  { n: 'Low-volatility horizon', mu: 0, sigma: 0.12, seed: 55 },
  { n: 'Negative physical drift', mu: -0.05, sigma: 0.20, seed: 66 },
  { n: 'Low volatility', mu: 0.05, sigma: 0.14, seed: 101 },
  { n: 'Moderate volatility', mu: 0.02, sigma: 0.20, seed: 202 },
  { n: 'High volatility', mu: 0, sigma: 0.42, seed: 303 },
  { n: 'Positive drift', mu: 0.08, sigma: 0.10, seed: 404 },
  { n: 'Lower drift', mu: 0.03, sigma: 0.12, seed: 505 },
];
for (const scenario of cases) {
  const result = shortStrangleScenario(scenario);
  assert.equal(result.sampleCount, 2000, 'a scenario name must never replace the sample count');
  assert.ok(Object.values(result).every(Number.isFinite));
  assert.deepEqual(shortStrangleScenario(scenario), result, 'same inputs must reproduce every result');
  assert.ok(Math.abs(result.meanPnl - result.analyticalMeanPnl) < 5 * result.standardError, 'this fixed seed must agree with the independent lognormal payoff expectation within its sampling precision');
  assert.ok(result.win >= 0 && result.win <= 100 && result.pnlSd > 0 && result.worst <= result.meanPnl);
  console.log(`PASS ${scenario.n}: paths=${result.sampleCount} mean=${result.meanPnl.toFixed(6)} analytical=${result.analyticalMeanPnl.toFixed(6)} SE=${result.standardError.toFixed(6)}`);
}
const noMove = shortStrangleScenario({ mu: 0, sigma: 0, pathCount: 10 });
assert.equal(noMove.meanPnl, noMove.premium, 'no move: both short out-of-the-money options expire worthless');
assert.ok(noMove.pnlSd < 1e-9);
assert.equal(noMove.meanOverSd, null, 'zero dispersion makes this ratio undefined, not zero');
for (const invalid of [{ pathCount: 'name' }, { pathCount: 0 }, { pathCount: 2.5 }, { sigma: NaN }, { sigma: -0.1 }, { seed: 0 }]) assert.throws(() => shortStrangleScenario({ mu: 0, sigma: 0.2, ...invalid }));
const reference = JSON.parse(await readFile(new URL('../../../fixtures/teaching_scenarios_reference.json', import.meta.url), 'utf8'));
for (const expected of reference.cases) {
  const actual = shortStrangleScenario(expected);
  assert.ok(Math.abs(actual.meanPnl - expected.meanPnl) < 1e-3, 'mean P&L must match independent Python erf/RNG reference');
  assert.ok(Math.abs(actual.pnlSd - expected.pnlSd) < 1e-6);
  assert.equal(actual.worst, Math.round(expected.worst));
  assert.equal(actual.win, expected.win);
}
console.log('TEACHING SCENARIOS PASS: 11 named cases, deterministic boundary and fail-closed input validation.');
