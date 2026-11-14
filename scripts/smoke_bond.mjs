import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  BOND_CONTRACT, analyzeBond, buildBondCashflowsCsv, buildBondScenariosCsv, normalizeBondInput,
} from '../src/lib/bond.mjs';

const authority = JSON.parse(await readFile(new URL('../../../fixtures/bond_contract.json', import.meta.url), 'utf8'));
assert.deepEqual(BOND_CONTRACT, authority);
const base = (overrides = {}) => ({ schemaVersion: 'tpl.bond.input.v1', settlementDate: '2026-07-31', maturityDate: '2036-07-31', dayCount: 'ACT/ACT ICMA', couponRate: 0.05, couponFrequency: 2, quoteMode: 'yield', yieldToMaturity: 0.05, cleanPrice: null, currency: 'EUR', notional: 1_000_000, position: 'long', shockBp: 25, ...overrides });
const rejects = async (input, pattern = /./) => assert.rejects(() => analyzeBond(input), pattern);

const par = await analyzeBond(base());
assert.ok(Math.abs(par.quote.cleanPricePer100 - 100) < 1e-11); assert.ok(Math.abs(par.quote.dirtyPricePer100 - 100) < 1e-11); assert.equal(par.quote.accruedInterestPer100, 0);
console.log(`[STEP 1] par golden case · [STATUS] ok · [OUTPUT] clean=${par.quote.cleanPricePer100.toFixed(10)}; dirty=${par.quote.dirtyPricePer100.toFixed(10)}; accrued=0`);

const between = await analyzeBond(base({ settlementDate: '2026-10-17', maturityDate: '2033-01-31', couponRate: 0.0375, yieldToMaturity: 0.042 }));
assert.ok(between.quote.accruedInterestPer100 > 0); assert.ok(Math.abs(between.quote.dirtyPricePer100 - between.quote.cleanPricePer100 - between.quote.accruedInterestPer100) < 2e-12);
assert.equal(between.cashflows[0].paymentDate, between.schedule.nextCouponDate);
console.log(`[STEP 2] settlement and schedule · [STATUS] ok · [OUTPUT] ${between.schedule.previousCouponDate} < ${between.input.settlementDate} < ${between.schedule.nextCouponDate}; accrued=${between.quote.accruedInterestPer100.toFixed(6)}; ${between.cashflows.length} future cash flows`);

const priced = await analyzeBond(base({ settlementDate: '2026-09-15', yieldToMaturity: 0.037125 }));
const solved = await analyzeBond(base({ settlementDate: '2026-09-15', quoteMode: 'clean_price', yieldToMaturity: null, cleanPrice: priced.quote.cleanPricePer100 }));
assert.ok(Math.abs(solved.quote.yieldToMaturity - 0.037125) < 2e-13); assert.ok(Math.abs(solved.quote.solver.residualPer100) <= 1e-10);
console.log(`[STEP 3] price/yield inversion · [STATUS] ok · [OUTPUT] clean=${priced.quote.cleanPricePer100.toFixed(8)} -> YTM=${(solved.quote.yieldToMaturity * 100).toFixed(8)}%; residual=${solved.quote.solver.residualPer100.toExponential(2)}`);

const zero = await analyzeBond(base({ settlementDate: '2026-01-31', maturityDate: '2026-07-31', couponRate: 0, couponFrequency: 1, yieldToMaturity: 0.04 }));
assert.ok(zero.cashflows[0].exponentPeriods > 0.49 && zero.cashflows[0].exponentPeriods < 0.50);
const negative = await analyzeBond(base({ maturityDate: '2031-07-31', couponRate: 0.01, yieldToMaturity: -0.0075, shockBp: -50 }));
assert.ok(negative.quote.cleanPricePer100 > 100 && negative.diagnostics.some((item) => item.code === 'NEGATIVE_YIELD'));
const monthly = await analyzeBond(base({ settlementDate: '2026-07-19', maturityDate: '2028-02-29', couponFrequency: 12, couponRate: 0.024, yieldToMaturity: 0.031 }));
assert.equal(monthly.schedule.nextCouponDate, '2026-07-31'); assert.equal(monthly.cashflows.at(-1).paymentDate, '2028-02-29');
const febAugust30e = await analyzeBond(base({ settlementDate: '2029-08-29', maturityDate: '2033-08-31', dayCount: '30E/360', couponFrequency: 2, couponRate: 0.05, yieldToMaturity: 0.05 }));
assert.equal(febAugust30e.schedule.previousCouponDate, '2029-02-28'); assert.equal(febAugust30e.schedule.nextCouponDate, '2029-08-31');
assert.ok(Math.abs(febAugust30e.schedule.accruedPeriodFraction - (181 / 182)) < 1e-14);
assert.ok(Math.abs(febAugust30e.cashflows[0].exponentPeriods - (1 / 182)) < 1e-14);
console.log(`[STEP 4] convention edge cases · [STATUS] ok · [OUTPUT] six-month exponent=${zero.cashflows[0].exponentPeriods.toFixed(6)} (no rounding); negative yield accepted; monthly EOM and 30E/360 Feb→Aug normalization preserved`);

const risk = await analyzeBond(base({ settlementDate: '2026-10-17', yieldToMaturity: 0.042, shockBp: 100 }));
assert.ok(Math.abs(risk.analytics.dv01Per100 - (risk.analytics.priceDown1bpPer100 - risk.analytics.priceUp1bpPer100) / 2) < 1e-14);
assert.ok(Math.abs(risk.analytics.cashflowDv01ReconciliationError) < 1e-13);
assert.ok(Math.abs(risk.cashflows.reduce((sum, row) => sum + row.positionDv01, 0) - risk.position.dv01) < 1e-9);
assert.ok(risk.analytics.modifiedDuration > 0 && risk.analytics.convexity > 0); assert.ok(Math.abs(risk.selectedScenario.approximationErrorPer100) < 0.1);
const short = await analyzeBond(base({ settlementDate: '2026-10-17', yieldToMaturity: 0.042, shockBp: 100, position: 'short' }));
assert.ok(Math.abs(risk.position.dv01 + short.position.dv01) < 1e-12); assert.ok(Math.abs(risk.selectedScenario.exactPnl + short.selectedScenario.exactPnl) < 1e-9);
console.log(`[STEP 5] risk and position · [STATUS] ok · [OUTPUT] modified duration=${risk.analytics.modifiedDuration.toFixed(6)}; convexity=${risk.analytics.convexity.toFixed(6)}; exact DV01=${risk.position.dv01.toFixed(2)} ${risk.input.currency}/bp; long/short signs reconcile`);

const invalid = [base({ couponFrequency: 0 }), base({ couponFrequency: 2.5 }), base({ couponRate: '0.05' }), base({ yieldToMaturity: Infinity }), base({ currency: 'eur' }), base({ maturityDate: '2026-07-31' }), base({ yieldToMaturity: -0.95 }), base({ quoteMode: 'clean_price', cleanPrice: 99 }), { ...base(), fake: true }];
for (const input of invalid) await rejects(input);
const missing = base(); delete missing.couponRate; await rejects(missing, /missing=couponRate/); assert.throws(() => normalizeBondInput(null), /plain object/);
console.log(`[STEP 6] strict fail-closed schema · [STATUS] ok · [OUTPUT] ${invalid.length + 2} invalid/coerced/singular payloads rejected without stale numeric output`);

const repeat = await analyzeBond(base({ settlementDate: '2026-10-17', quoteMode: 'clean_price', yieldToMaturity: null, cleanPrice: 98.25, shockBp: -75 }));
const repeatAgain = await analyzeBond(base({ settlementDate: '2026-10-17', quoteMode: 'clean_price', yieldToMaturity: null, cleanPrice: 98.25, shockBp: -75 }));
assert.deepEqual(repeat, repeatAgain); const cashflows = buildBondCashflowsCsv(repeat); const scenarios = buildBondScenariosCsv(repeat);
assert.ok(cashflows.endsWith('\n') && !cashflows.includes('\r') && cashflows.includes(repeat.analysisId)); assert.ok(scenarios.endsWith('\n') && !scenarios.includes('\r') && scenarios.includes(repeat.analysisId));
console.log(`[STEP 7] reproducible evidence · [STATUS] ok · [OUTPUT] SHA=${repeat.analysisId.slice(0, 12)}; cashflows=${repeat.cashflows.length}; scenarios=${repeat.scenarios.length}; JSON and two LF CSV exports deterministic`);
console.log('[VERDICT] PASS · F-CAL-8 JavaScript engine is date-aware, quote-invertible, risk-complete and fail-closed');
