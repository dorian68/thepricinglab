import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BLACK_SCHOLES_CONTRACT,
  BLACK_SCHOLES_INPUT_SCHEMA,
  analyzeBlackScholes,
  blackScholesOption,
  buildBlackScholesJson,
  buildBlackScholesScenarioCsv,
  buildBlackScholesSensitivityCsv,
  normalizeBlackScholesInput,
} from '../src/lib/blackScholes.mjs';

const authority = JSON.parse(await readFile(new URL('../../../fixtures/black_scholes_contract.json', import.meta.url), 'utf8'));
assert.deepEqual(BLACK_SCHOLES_CONTRACT, authority);
const base = (overrides = {}) => ({
  schemaVersion: BLACK_SCHOLES_INPUT_SCHEMA,
  quoteMode: 'volatility', optionType: 'call', spot: 100, strike: 100,
  maturityYears: 0.5, dayCount: 'ACT/365F', riskFreeRate: 0.02,
  dividendYield: 0, volatility: 0.2, marketPrice: null, currency: 'EUR',
  position: 'long', quantity: 10, multiplier: 100,
  shocks: { spotPct: 10, volPoints: 5, days: 30 },
  ...overrides,
});
const close = (left, right, tolerance, label) => assert.ok(Math.abs(left - right) <= tolerance, `${label}: ${left} != ${right}`);

const golden = await analyzeBlackScholes(base());
close(golden.call.unitPrice, 6.120656643153858, 2e-12, 'ATM call');
close(golden.put.unitPrice, 5.125640018070676, 2e-12, 'ATM put');
assert.equal(golden.parity.holds, true); close(golden.parity.residual, 0, 2e-12, 'parity');
console.log(`[STEP 1] ATM golden and parity · [STATUS] ok · [OUTPUT] call=${golden.call.unitPrice.toFixed(10)}; put=${golden.put.unitPrice.toFixed(10)}; residual=${golden.parity.residual.toExponential(2)}`);

const dividend = await analyzeBlackScholes(base({ dividendYield: 0.035, riskFreeRate: -0.005, strike: 110, optionType: 'put' }));
assert.equal(dividend.selected.type, 'put'); assert.equal(dividend.parity.holds, true); assert.ok(dividend.call.unitPrice >= 0 && dividend.put.unitPrice >= 0);
console.log(`[STEP 2] dividend and negative-rate case · [STATUS] ok · [OUTPUT] selected put=${dividend.selected.unitPrice.toFixed(8)}; q=3.5%; r=-0.5%; parity holds`);

const expiryItm = await analyzeBlackScholes(base({ maturityYears: 0, spot: 120 }));
const expiryAtm = await analyzeBlackScholes(base({ maturityYears: 0 }));
const zeroVol = await analyzeBlackScholes(base({ volatility: 0, spot: 120, strike: 100, maturityYears: 2, riskFreeRate: 0.04, dividendYield: 0.01 }));
const zeroVolKink = await analyzeBlackScholes(base({ volatility: 0, riskFreeRate: 0.05, dividendYield: 0.05, maturityYears: 1 }));
assert.equal(expiryItm.call.unitPrice, 20); assert.equal(expiryItm.call.greeks.delta, 1);
assert.equal(expiryAtm.call.greeks.delta, 0.5); assert.equal(expiryAtm.put.greeks.delta, -0.5);
const deterministic = Math.max(120 * Math.exp(-0.01 * 2) - 100 * Math.exp(-0.04 * 2), 0);
close(zeroVol.call.unitPrice, deterministic, 2e-12, 'zero-vol discounted payoff'); assert.equal(zeroVol.call.limit, 'zero_volatility');
close(zeroVolKink.call.greeks.rho, 0.5 * Math.exp(-0.05), 2e-12, 'zero-vol kink call rho'); close(zeroVolKink.put.greeks.rho, -0.5 * Math.exp(-0.05), 2e-12, 'zero-vol kink put rho');
assert.match(zeroVolKink.conventions.zeroVolatilityKinkLimit, /not_classically_differentiable/);
console.log(`[STEP 3] exact limiting cases · [STATUS] ok · [OUTPUT] expiry intrinsic/delta correct; sigma=0 discounted payoff and declared forward-ATM symmetric kink Greeks agree`);

const unit = blackScholesOption({ spot: 103, strike: 100, maturityYears: 0.75, riskFreeRate: 0.025, dividendYield: 0.01, volatility: 0.24 }, 'call');
const hS = 1e-3; const hV = 1e-5; const hR = 1e-5; const hT = 1 / 365;
const price = (changes) => blackScholesOption({ spot: 103, strike: 100, maturityYears: 0.75, riskFreeRate: 0.025, dividendYield: 0.01, volatility: 0.24, ...changes }, 'call').price;
close(unit.greeks.delta, (price({ spot: 103 + hS }) - price({ spot: 103 - hS })) / (2 * hS), 5e-6, 'delta FD');
close(unit.greeks.gamma, (price({ spot: 103 + hS }) - 2 * unit.price + price({ spot: 103 - hS })) / (hS ** 2), 1e-5, 'gamma FD');
close(unit.greeks.vega, (price({ volatility: 0.24 + hV }) - price({ volatility: 0.24 - hV })) / (2 * hV) / 100, 2e-6, 'vega FD');
close(unit.greeks.rho, (price({ riskFreeRate: 0.025 + hR }) - price({ riskFreeRate: 0.025 - hR })) / (2 * hR) / 100, 3e-6, 'rho FD');
close(unit.greeks.theta, price({ maturityYears: 0.75 - hT }) - unit.price, 2e-5, 'theta one-day');
console.log('[STEP 4] Greek units · [STATUS] ok · [OUTPUT] delta/gamma/vega-per-vol-point/theta-per-day/rho-per-rate-point reconcile with finite differences');

const market = await analyzeBlackScholes(base({ optionType: 'put' }));
const inverted = await analyzeBlackScholes(base({ quoteMode: 'market_price', optionType: 'put', volatility: null, marketPrice: market.put.unitPrice }));
close(inverted.quote.impliedVolatility, 0.2, 2e-11, 'IV round trip'); assert.equal(inverted.quote.solver.converged, true); assert.ok(Math.abs(inverted.quote.solver.residual) <= 1e-10);
await assert.rejects(() => analyzeBlackScholes(base({ quoteMode: 'market_price', volatility: null, marketPrice: 101 })), /bound|price/i);
console.log(`[STEP 5] implied-volatility inversion · [STATUS] ok · [OUTPUT] 20% round-trip; iterations=${inverted.quote.solver.iterations}; residual=${inverted.quote.solver.residual.toExponential(2)}; out-of-bounds quote rejected`);

const short = await analyzeBlackScholes(base({ position: 'short' }));
close(short.selected.portfolioValue, -golden.selected.portfolioValue, 1e-10, 'short value');
for (const key of Object.keys(golden.selected.portfolioGreeks)) close(short.selected.portfolioGreeks[key], -golden.selected.portfolioGreeks[key], 1e-9, `short ${key}`);
assert.equal(golden.scenarios.length, 6); assert.equal(golden.scenarios[0].pnl, 0);
assert.ok(Object.values(golden.sensitivities).every((rows) => rows.length === authority.limits.sensitivityPoints));
console.log(`[STEP 6] signed position and exact repricing · [STATUS] ok · [OUTPUT] long/short values and five Greeks reconcile; ${golden.scenarios.length} scenarios; ${authority.limits.sensitivityPoints} points per sensitivity axis`);

const invalid = [
  base({ spot: 0 }), base({ strike: -1 }), base({ maturityYears: -1 }), base({ volatility: 5.1 }),
  base({ riskFreeRate: '0.02' }), base({ quantity: true }), base({ currency: 'eur' }),
  base({ quoteMode: 'market_price', volatility: 0.2, marketPrice: 5 }),
  base({ shocks: { spotPct: 100, volPoints: 5, days: 30 } }), { ...base(), surprise: true },
];
for (const input of invalid) await assert.rejects(() => analyzeBlackScholes(input));
const missing = base(); delete missing.strike; await assert.rejects(() => analyzeBlackScholes(missing), /missing=strike/);
assert.throws(() => normalizeBlackScholesInput(null), /plain object/);
console.log(`[STEP 7] strict fail-closed schema · [STATUS] ok · [OUTPUT] ${invalid.length + 2} coerced, unknown, exclusive or out-of-domain payloads rejected`);

const repeat = await analyzeBlackScholes(base({ dividendYield: 0.015, optionType: 'put', position: 'short', quantity: 17 }));
assert.deepEqual(repeat, await analyzeBlackScholes(base({ dividendYield: 0.015, optionType: 'put', position: 'short', quantity: 17 })));
const json = buildBlackScholesJson(repeat); const scenarios = buildBlackScholesScenarioCsv(repeat); const sensitivities = buildBlackScholesSensitivityCsv(repeat);
for (const evidence of [json, scenarios, sensitivities]) assert.ok(evidence.includes(repeat.analysisId));
for (const csv of [scenarios, sensitivities]) assert.ok(csv.endsWith('\n') && !csv.includes('\r'));
console.log(`[STEP 8] reproducible evidence · [STATUS] ok · [OUTPUT] SHA=${repeat.analysisId.slice(0, 12)}; JSON and two LF CSV exports deterministic`);
console.log('[VERDICT] PASS · F-CAL10 Black-Scholes value, IV, limits, Greeks, position, scenarios and evidence are deterministic and fail-closed');
