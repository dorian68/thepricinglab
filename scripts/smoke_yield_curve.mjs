import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  MAX_CURVE_CSV_CHARACTERS,
  YIELD_CURVE_EXPORT_SCHEMA,
  YIELD_CURVE_VERSION,
  buildYieldCurve,
  createYieldCurveExport,
  interpolateLogDiscountFactor,
  parseYieldCurveCsv,
} from '../src/lib/yieldCurve.mjs';

const rootFile = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url));
const fixture = JSON.parse(await readFile(rootFile('../../../fixtures/yield_curve_golden.json'), 'utf8'));

const assertClose = (actual, expected, tolerance, label) => {
  assert.ok(Number.isFinite(actual), `${label}: actual value must be finite`);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, received ${actual}`);
};

const expectFailure = (fn, pattern, label) => {
  assert.throws(fn, pattern, label);
};

const byId = new Map(fixture.cases.map((testCase) => [testCase.id, testCase]));
const results = new Map();

for (const testCase of fixture.cases) {
  const result = buildYieldCurve(testCase.instruments, fixture.conventions);
  results.set(testCase.id, result);
  assert.equal(result.engineVersion, YIELD_CURVE_VERSION, `${testCase.id}: engine version`);
  assert.equal(result.diagnostics.converged, true, `${testCase.id}: converged`);
  assert.equal(result.diagnostics.positiveDiscountFactors, true, `${testCase.id}: positive DFs`);
  assert.ok(result.diagnostics.maxAbsPvResidual <= fixture.tolerances.repricing, `${testCase.id}: PV repricing`);
  assert.ok(result.diagnostics.maxAbsQuoteResidual <= fixture.tolerances.repricing, `${testCase.id}: quote repricing`);
  testCase.expectedAnchors.forEach((expected, index) => {
    assertClose(result.anchors[index].time, expected.time, 1e-12, `${testCase.id}: anchor ${index} time`);
    assertClose(result.anchors[index].discountFactor, expected.discountFactor, fixture.tolerances.discountFactor, `${testCase.id}: anchor ${index} DF`);
  });
  assert.deepEqual(result, buildYieldCurve(testCase.instruments, fixture.conventions), `${testCase.id}: repeat must be strictly deterministic`);
}

const depositFra = results.get('deposit_fra');
byId.get('deposit_fra').expectedContinuousZeros.forEach((expected) => {
  const node = depositFra.curve.find((candidate) => Math.abs(candidate.time - expected.time) < 1e-12);
  assert.ok(node, `deposit_fra: missing ${expected.time}Y curve node`);
  assertClose(node.zeroContinuous, expected.rate, fixture.tolerances.rate, `deposit_fra: ${expected.time}Y continuous zero`);
});

const depositFuture = results.get('deposit_future_with_convexity');
assertClose(
  depositFuture.inputs[1].quote,
  byId.get('deposit_future_with_convexity').expectedFraEquivalentRate,
  1e-15,
  'future: FRA-equivalent quote',
);
assertClose(depositFuture.repricing[1].futurePriceResidual, 0, 1e-10, 'future: price repricing');

const flat = results.get('flat_sparse_swaps');
for (const node of flat.curve) {
  assertClose(node.zeroAnnual, byId.get('flat_sparse_swaps').expectedAnnualZero, fixture.tolerances.rate, `flat: ${node.time}Y annual zero`);
  assertClose(node.forwardContinuous, byId.get('flat_sparse_swaps').expectedContinuousForward, fixture.tolerances.rate, `flat: ${node.intervalLabel} forward`);
}
assert.equal(flat.diagnostics.interpolatedCouponCount, 5, 'flat sparse swaps must construct 4Y and 6Y-9Y coupons');

const current = results.get('current_sparse_swaps');
for (const expected of byId.get('current_sparse_swaps').expectedInterpolatedNodes) {
  const node = current.curve.find((candidate) => candidate.time === expected.time);
  assert.equal(node?.source, 'interpolated-cashflow', `current: ${expected.time}Y node must be interpolated`);
  assertClose(node.discountFactor, expected.discountFactor, fixture.tolerances.discountFactor, `current: ${expected.time}Y interpolated DF`);
}
for (const expected of byId.get('current_sparse_swaps').expectedSegmentContinuousForwards) {
  const startDf = expected.start === 0 ? 1 : current.curve.find((node) => node.time === expected.start)?.discountFactor;
  const endDf = current.curve.find((node) => node.time === expected.end)?.discountFactor;
  const forward = Math.log(startDf / endDf) / (expected.end - expected.start);
  assertClose(forward, expected.rate, fixture.tolerances.rate, `current: ${expected.start}Y→${expected.end}Y continuous forward`);
}
const df3 = current.curve.find((node) => node.time === 3).discountFactor;
const df4 = current.curve.find((node) => node.time === 4).discountFactor;
const df5 = current.curve.find((node) => node.time === 5).discountFactor;
assertClose(df4, Math.sqrt(df3 * df5), fixture.tolerances.interpolation, 'log-DF interpolation identity at 4Y');

const negative = results.get('negative_rates');
assertClose(negative.curve[0].zeroContinuous, byId.get('negative_rates').expectedFirstContinuousZero, fixture.tolerances.rate, 'negative-rate continuous zero');
assert.ok(negative.anchors[0].discountFactor > 1, 'negative rate may legitimately produce DF > 1');
assert.ok(negative.diagnostics.negativeForwardIntervals.length > 0, 'negative forward is a diagnostic, not a hard failure');

const inverted = buildYieldCurve([1, 2, 3, 5, 10].map((maturity, index) => ({
  type: 'swap',
  maturity,
  quote: [0.05, 0.04, 0.03, 0.02, 0.01][index],
})));
assert.equal(inverted.diagnostics.converged, true, 'inverted curve must be accepted when DFs remain positive');
assert.ok(inverted.diagnostics.negativeForwardIntervals.length > 0, 'inverted curve must surface its negative-forward intervals');

const validCsv = `# Units are explicit: rates in percent, future price in price points, convexity in bp
instrument,startYears,maturityYears,quotePercent,futurePrice,convexityAdjustmentBp
deposit,,0.25,4.20,,
future,0.25,0.50,,95.70,5
fra,0.50,1.00,4.30,,
swap,,2.00,4.35,,
swap,,3.00,4.40,,
swap,,5.00,4.50,,
swap,,10.00,4.60,,
`;
const parsedCsv = parseYieldCurveCsv(validCsv);
assert.equal(parsedCsv.length, 7, 'CSV: seven explicit instruments');
const csvResult = buildYieldCurve(parsedCsv);
assert.equal(csvResult.inputs[1].type, 'future', 'CSV: future retained');
assertClose(csvResult.inputs[1].convexityAdjustment, 0.0005, 1e-15, 'CSV: 5 bp convexity adjustment');

const semicolonCsv = `instrument;startYears;maturityYears;quotePercent;futurePrice;convexityAdjustmentBp
deposit;;0,5;5,0;;
fra;0,5;1,0;5,25;;
`;
assert.deepEqual(
  buildYieldCurve(parseYieldCurveCsv(semicolonCsv)).anchors.map((anchor) => anchor.discountFactor),
  depositFra.anchors.map((anchor) => anchor.discountFactor),
  'semicolon/decimal-comma CSV must reproduce the deposit/FRA golden case',
);

const exported = createYieldCurveExport(csvResult, 'CSV: valid.csv (7 instruments)');
assert.equal(exported.schema, YIELD_CURVE_EXPORT_SCHEMA, 'export schema');
assert.equal(exported.inputs.length, 7, 'export inputs');
assert.equal(exported.curve.length, csvResult.curve.length, 'export curve');
assert.equal(exported.repricing.length, 7, 'export repricing');
assert.equal(exported.conventions.interpolation, 'log-linear discount factors', 'export conventions');
assert.ok(exported.limitations.some((value) => value.includes('mono-curve')), 'export limitations');

expectFailure(
  () => buildYieldCurve([{ type: 'deposit', maturity: 0.5, quote: Number.NaN }, { type: 'swap', maturity: 1, quote: 0.03 }]),
  /non-finite/i,
  'NaN quote rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'deposit', maturity: 0.5, quote: 0.03 }, { type: 'swap', maturity: 0.5, quote: 0.03 }]),
  /strictly increasing/i,
  'duplicate maturity rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'swap', maturity: 2, quote: 0.03 }, { type: 'swap', maturity: 1, quote: 0.03 }]),
  /strictly increasing/i,
  'unsorted maturity rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'deposit', maturity: 5, quote: -0.2 }, { type: 'swap', maturity: 6, quote: 0.03 }]),
  /must be positive/i,
  'non-positive deposit accumulation rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'deposit', maturity: 0.25, quote: 0.03 }, { type: 'fra', start: 0.5, maturity: 1, quote: 0.03 }]),
  /not covered|extrapolation/i,
  'uncovered FRA start rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'deposit', maturity: 0.5, quote: 0.03 }, { type: 'future', start: 0.5, maturity: 1, futurePrice: 95 }]),
  /explicit convexityAdjustment/i,
  'future without explicit convexity rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'deposit', maturity: 0.5, quote: 0.03 }, { type: 'future', start: 0.5, maturity: 1, futurePrice: 200, convexityAdjustment: 0 }]),
  /future price/i,
  'future price boundary rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'deposit', maturity: 0.5, quote: 0.03 }, { type: 'swap', maturity: 1.25, quote: 0.03 }], { fixedLegFrequency: 2 }),
  /implicit stub/i,
  'implicit swap stub rejection',
);
expectFailure(
  () => buildYieldCurve([{ type: 'swap', maturity: 1, quote: 0.01 }, { type: 'swap', maturity: 50, quote: -0.25 }]),
  /not bracketed/i,
  'non-bracketed swap root rejection',
);
expectFailure(
  () => interpolateLogDiscountFactor(2, [{ time: 0, discountFactor: 1 }, { time: 1, discountFactor: 0.95 }]),
  /extrapolation/i,
  'discount-factor extrapolation rejection',
);
expectFailure(
  () => parseYieldCurveCsv(validCsv.replace('quotePercent', 'rate')),
  /unknown column|missing required/i,
  'ambiguous CSV rate column rejection',
);
expectFailure(
  () => parseYieldCurveCsv(validCsv.replace('95.70,5', '95.70,')),
  /convexityAdjustmentBp.*required/i,
  'future CSV without convexity rejection',
);
expectFailure(
  () => parseYieldCurveCsv(validCsv.replace('deposit', '=deposit')),
  /unsupported instrument/i,
  'CSV formula-like instrument rejection',
);
expectFailure(
  () => parseYieldCurveCsv(`instrument,startYears,maturityYears,quotePercent,futurePrice,convexityAdjustmentBp\n${'deposit,,0.5,5,,\n'.repeat(MAX_CURVE_CSV_CHARACTERS)}`),
  /safety limit/i,
  'oversized CSV rejection',
);

const zeroConvexity = buildYieldCurve([
  { type: 'deposit', maturity: 0.5, quote: 0.03 },
  { type: 'future', start: 0.5, maturity: 1, futurePrice: 97, convexityAdjustment: 0 },
]);
assert.ok(zeroConvexity.diagnostics.warnings.some((warning) => warning.includes('Explicit 0 bp')), 'explicit zero convexity must remain visible');

const engineSource = await readFile(rootFile('../src/lib/yieldCurve.mjs'), 'utf8');
const componentSource = await readFile(rootFile('../src/components/tools/YieldCurveBuilder.tsx'), 'utf8');
const applicationSource = await readFile(rootFile('../src/claude/ClaudeFrontend.jsx'), 'utf8');
assert.ok(!engineSource.includes('Math.random'), 'yield-curve engine must contain no random path');
assert.ok(!engineSource.includes('Date.now'), 'yield-curve engine must contain no time-dependent result path');
assert.ok(!componentSource.includes('Math.random'), 'yield-curve component must contain no random path');
assert.match(componentSource, /tpl-yield-curve-example\.csv/, 'component must ship a real sample CSV download');
assert.match(componentSource, /Export JSON evidence/, 'component must expose versioned evidence export');
assert.match(componentSource, /no remote persistence/i, 'component must disclose session-only history');
assert.match(applicationSource, /import\('\.\.\/components\/tools\/YieldCurveBuilder'\)/, 'active app must lazy-load the dedicated curve component');
assert.match(applicationSource, /curve:\s*<React\.Suspense[\s\S]*?<YieldCurveBuilderTool\/>/, 'active curve renderer must mount the dedicated component');
assert.ok(!applicationSource.includes('function bootstrapCurve'), 'legacy sparse-node bootstrap must be removed');
assert.ok(!applicationSource.includes('1y fwd'), 'misleading legacy forward label must be removed');
assert.ok(!applicationSource.includes('<YieldCurveTool/>'), 'legacy inline curve component must be removed');

console.log(`[STEP 1] shared curve fixture · [STATUS] ok · [INPUT] ${fixture.cases.length} golden cases · [OUTPUT] deposits/FRAs/futures/sparse swaps/negative rates match; max repricing <= ${fixture.tolerances.repricing}`);
console.log('[STEP 2] curve CSV/export contract · [STATUS] ok · [INPUT] comma + semicolon dialects and adversarial files · [OUTPUT] explicit units, future convexity, versioned evidence and fail-closed parsing');
console.log('[STEP 3] curve error states · [STATUS] ok · [INPUT] non-finite/duplicate/uncovered/stub/root/extrapolation cases · [OUTPUT] every invalid path failed explicitly');
console.log('[STEP 4] active source contract · [STATUS] ok · [INPUT] engine/component/router · [OUTPUT] lazy premium route, downloads/history and no legacy/random path');
console.log('[VERDICT] PASS · deterministic single-curve engine is CLI-testable and reprices every supported instrument');
