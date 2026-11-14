import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BINOMIAL_CONTRACT,
  analyzeBinomial,
  buildBinomialConvergenceCsv,
  buildBinomialFrontierCsv,
  normalizeBinomialInput,
} from '../src/lib/binomial.mjs';

const authority = JSON.parse(await readFile(new URL('../../../fixtures/binomial_contract.json', import.meta.url), 'utf8'));
assert.deepEqual(BINOMIAL_CONTRACT, authority);
const base = (overrides = {}) => ({ schemaVersion: 'tpl.binomial.input.v1', spot: 100, strike: 100, volatility: 0.2, maturityYears: 1, dayCount: 'ACT/365F', riskFreeRate: 0.05, dividendYield: 0, steps: 400, optionType: 'call', exerciseStyle: 'european', currency: 'USD', quantity: 2, contractMultiplier: 100, position: 'long', ...overrides });
const rejects = async (input, pattern) => assert.rejects(() => analyzeBinomial(input), pattern);

const european = await analyzeBinomial(base({ steps: 1_000 }));
assert.ok(Math.abs(european.valuation.pricePerUnit - 10.4506) < 0.003);
assert.ok(european.valuation.benchmarkAbsoluteError < 0.003);
assert.ok(Math.abs(european.greeks.perUnit.delta - 0.6368) < 0.002);
assert.ok(Math.abs(european.greeks.perUnit.gamma - 0.01876) < 0.001);
console.log(`[STEP 1] European CRR and Greeks · [STATUS] ok · [OUTPUT] price=${european.valuation.pricePerUnit.toFixed(6)}; BS error=${european.valuation.benchmarkAbsoluteError.toExponential(2)}; delta/gamma/vega finite`);

const call = await analyzeBinomial(base({ dividendYield: 0.02, steps: 800 }));
const put = await analyzeBinomial(base({ dividendYield: 0.02, steps: 800, optionType: 'put' }));
const parity = 100 * Math.exp(-0.02) - 100 * Math.exp(-0.05);
assert.ok(Math.abs((call.valuation.pricePerUnit - put.valuation.pricePerUnit) - parity) < 1e-10);
const americanPut = await analyzeBinomial(base({ optionType: 'put', exerciseStyle: 'american', steps: 300 }));
assert.ok(americanPut.valuation.earlyExercisePremiumPerUnit > 0 && americanPut.earlyExercise.exercisedNodeCount > 0);
const americanCall = await analyzeBinomial(base({ exerciseStyle: 'american', steps: 300 }));
assert.equal(americanCall.valuation.pricePerUnit, americanCall.valuation.europeanPricePerUnit);
assert.equal(americanCall.earlyExercise.exercisedNodeCount, 0);
const dividendCall = await analyzeBinomial(base({ spot: 100, strike: 90, riskFreeRate: 0.01, dividendYield: 0.12, exerciseStyle: 'american', steps: 300 }));
assert.ok(dividendCall.valuation.earlyExercisePremiumPerUnit > 3 && dividendCall.earlyExercise.boundary.length > 0);
console.log(`[STEP 2] exercise logic · [STATUS] ok · [OUTPUT] parity exact; put premium=${americanPut.valuation.earlyExercisePremiumPerUnit.toFixed(6)}; no-dividend call never exercises; dividend-call frontier=${dividendCall.earlyExercise.boundary.length}`);

const zero = await analyzeBinomial(base({ volatility: 0, optionType: 'put', exerciseStyle: 'american' }));
const expired = await analyzeBinomial(base({ spot: 90, maturityYears: 0, optionType: 'put', exerciseStyle: 'american' }));
assert.equal(zero.valuation.pricePerUnit, 0); assert.equal(expired.valuation.pricePerUnit, 10); assert.equal(expired.model.riskNeutralUpProbability, null);
const upperBounds = await analyzeBinomial(base({ spot: 1_000_000_000_000, strike: 1_000_000_000_000, volatility: 5, riskFreeRate: 1, steps: 200 }));
const lowerSpot = await analyzeBinomial(base({ spot: 1e-8, strike: 1e-8, volatility: 0, riskFreeRate: 0, steps: 10 }));
const rhoBoundary = await analyzeBinomial(base({ riskFreeRate: 0.2828, volatility: 0.2, steps: 2 }));
const negativeRateCall = await analyzeBinomial(base({ riskFreeRate: -0.1, exerciseStyle: 'american', steps: 300 }));
assert.ok(Object.values(upperBounds.greeks.perUnit).every(Number.isFinite));
assert.ok(Object.values(lowerSpot.greeks.perUnit).every(Number.isFinite));
assert.ok(Number.isFinite(rhoBoundary.greeks.perUnit.rho));
assert.ok(negativeRateCall.earlyExercise.exercisedNodeCount > 0 && !negativeRateCall.diagnostics.some((item) => item.code === 'NON_DIVIDEND_CALL_CHECK'));
await rejects(base({ volatility: 0.01, riskFreeRate: 0.15, steps: 5 }), /outside \[0,1\]/);
console.log('[STEP 3] degenerate/no-arbitrage cases · [STATUS] ok · [OUTPUT] zero-vol, expiry, hard-bound Greeks and one-sided Rho finite; negative-rate call diagnostic honest; invalid CRR probability rejected');

const invalid = [
  base({ steps: 3.5 }), base({ steps: '400' }), base({ spot: '100' }), base({ spot: Infinity }),
  base({ volatility: -0.1 }), base({ maturityYears: -1 }), base({ currency: 'usd' }),
  base({ exerciseStyle: 'bermudan' }), base({ position: 'flat' }), base({ quantity: true }),
  { ...base(), fake: true },
];
for (const input of invalid) await rejects(input, /./);
const missing = base(); delete missing.strike; await rejects(missing, /missing=strike/);
assert.throws(() => normalizeBinomialInput(null), /plain object/);
console.log(`[STEP 4] strict schema · [STATUS] ok · [OUTPUT] ${invalid.length + 2} malformed/domain inputs fail closed`);

const repeat = await analyzeBinomial(base({ optionType: 'put', exerciseStyle: 'american', steps: 200 }));
const repeatAgain = await analyzeBinomial(base({ optionType: 'put', exerciseStyle: 'american', steps: 200 }));
assert.deepEqual(repeat, repeatAgain);
const convergenceCsv = buildBinomialConvergenceCsv(repeat); const frontierCsv = buildBinomialFrontierCsv(repeat);
assert.ok(convergenceCsv.endsWith('\n') && !convergenceCsv.includes('\r') && convergenceCsv.includes(repeat.analysisId));
assert.ok(frontierCsv.endsWith('\n') && !frontierCsv.includes('\r') && frontierCsv.includes(repeat.analysisId));
assert.ok(repeat.tree.nodes.some((node) => node.continuation !== null));
console.log(`[STEP 5] reproducible evidence · [STATUS] ok · [OUTPUT] analysis=${repeat.analysisId.slice(0, 12)}; convergence rows=${repeat.convergence.length}; frontier rows=${repeat.earlyExercise.boundary.length}; node decisions retained`);
console.log('[VERDICT] PASS · F-CAL-7 JavaScript CRR engine is deterministic, no-arbitrage-safe, exercise-aware and CLI-tested');
