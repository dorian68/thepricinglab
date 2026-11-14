import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  ESTIMATOR_KEYS,
  MAX_REALIZED_VOLATILITY_CSV_CHARACTERS,
  REALIZED_VOLATILITY_OBSERVATIONS_CSV_SCHEMA,
  REALIZED_VOLATILITY_RESULT_SCHEMA,
  REALIZED_VOLATILITY_ROLLING_CSV_SCHEMA,
  REALIZED_VOLATILITY_VERSION,
  TEACHING_CSV,
  analyzeRealizedVolatility,
  buildObservationsCsv,
  buildRollingCsv,
  parseRealizedVolatilityCsv,
} from '../src/lib/realizedVolatility.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(scriptDirectory, '../../../fixtures/realized_volatility_golden.json');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

const close = (actual, expected, tolerance, label) => {
  assert.ok(Number.isFinite(actual), `${label}: actual is not finite`);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} != ${expected} within ${tolerance}`);
};

const varianceTolerance = fixture.tolerances?.variance ?? 1e-14;
const volatilityTolerance = fixture.tolerances?.volatility
  ?? fixture.tolerances?.annualizedVolatility
  ?? fixture.tolerances?.annualizedVol
  ?? 1e-12;
const fixtureCases = fixture.cases ?? fixture.testCases ?? [];
assert.ok(fixtureCases.length > 0, 'golden fixture must define cases[]');

const expectedEstimator = (testCase, key) => (
  testCase.expected?.estimators?.[key]
  ?? testCase.expected?.full?.[key]
  ?? testCase.expected?.[key]
  ?? (testCase.expected?.dailyVariance?.[key] === undefined ? undefined : {
    variance: testCase.expected.dailyVariance[key],
    annualizedVolatility: testCase.expected.annualizedVol?.[key],
  })
  ?? testCase.estimators?.[key]
);

const caseCsv = (testCase) => {
  if (typeof testCase.csv === 'string') return testCase.csv;
  if (Array.isArray(testCase.rows)) {
    return `date,open,high,low,close\n${testCase.rows.map((row) => [row.date, row.open, row.high, row.low, row.close].join(',')).join('\n')}\n`;
  }
  throw new Error(`${testCase.id ?? 'fixture case'} must define csv or rows`);
};

const goldenResults = new Map();
for (const testCase of fixtureCases) {
  const csv = caseCsv(testCase);
  const rows = parseRealizedVolatilityCsv(csv);
  const requestedWindow = testCase.config?.rollingWindow
    ?? testCase.config?.window
    ?? fixture.baseConfig?.rollingWindow
    ?? fixture.baseConfig?.window
    ?? 3;
  const config = {
    annualization: testCase.config?.annualization ?? fixture.baseConfig?.annualization ?? 252,
    rollingWindow: Math.min(requestedWindow, rows.length - 1),
    calendarMode: testCase.config?.calendarMode ?? fixture.baseConfig?.calendarMode ?? 'weekday_sessions',
    priceBasis: testCase.config?.priceBasis ?? fixture.baseConfig?.priceBasis ?? 'split_adjusted_ohlc',
  };
  const result = analyzeRealizedVolatility(rows, config, {
    filename: `${testCase.id}.csv`, sourceText: csv, adjustmentBasis: testCase.adjustmentBasis ?? 'adjusted',
  });
  assert.equal(result.schema, REALIZED_VOLATILITY_RESULT_SCHEMA);
  assert.equal(result.engineVersion, REALIZED_VOLATILITY_VERSION);
  assert.equal(result.observationCount, testCase.expected?.observationCount ?? ((testCase.expected?.n ?? rows.length - 1) + 1));
  assert.equal(result.sessionCount, testCase.expected?.sessionCount ?? testCase.expected?.n ?? rows.length - 1);
  if (testCase.expected?.yangZhangK !== undefined) {
    close(result.yangZhangK, testCase.expected.yangZhangK, fixture.tolerances?.yangZhangK ?? 1e-15, `${testCase.id}/Yang-Zhang k`);
  }
  for (const key of ESTIMATOR_KEYS) {
    const expected = expectedEstimator(testCase, key);
    assert.ok(expected, `${testCase.id}: missing expected ${key}`);
    const expectedVariance = expected.variance ?? expected.rawVariance;
    const expectedVolatility = expected.annualizedVolatility ?? expected.volatility;
    close(result.estimators[key].variance, expectedVariance, varianceTolerance, `${testCase.id}/${key} variance`);
    close(result.estimators[key].annualizedVolatility, expectedVolatility, volatilityTolerance, `${testCase.id}/${key} volatility`);
    assert.equal(result.estimators[key].sessionCount, result.sessionCount, `${testCase.id}/${key} identical sessions`);
  }
  const repeated = analyzeRealizedVolatility(rows, config, {
    filename: `${testCase.id}.csv`, sourceText: csv, adjustmentBasis: testCase.adjustmentBasis ?? 'adjusted',
  });
  assert.deepEqual(repeated, result, `${testCase.id}: deterministic repeat`);
  if (testCase.expected?.rollingLast) {
    const expectedRolling = testCase.expected.rollingLast;
    const actualRolling = result.rolling.at(-1);
    assert.equal(actualRolling.endDate, expectedRolling.date);
    assert.equal(actualRolling.sessionCount, expectedRolling.n);
    close(actualRolling.yangZhangK, expectedRolling.yangZhangK, fixture.tolerances?.yangZhangK ?? 1e-15, `${testCase.id}/rollingLast/Yang-Zhang k`);
    for (const key of ESTIMATOR_KEYS) {
      close(actualRolling.estimators[key].annualizedVolatility, expectedRolling[key], volatilityTolerance, `${testCase.id}/rollingLast/${key}`);
    }
  }
  for (const warningCode of testCase.expected?.warningCodes ?? []) {
    assert.ok(result.warnings.some((warning) => warning.code === warningCode), `${testCase.id}: expected warning ${warningCode}`);
  }
  if (testCase.expected?.annualizedVol365) {
    const annualized365 = analyzeRealizedVolatility(rows, { ...config, annualization: 365 }, {
      filename: `${testCase.id}.csv`, sourceText: csv, adjustmentBasis: testCase.adjustmentBasis ?? 'adjusted',
    });
    for (const key of ESTIMATOR_KEYS) {
      close(annualized365.estimators[key].annualizedVolatility, testCase.expected.annualizedVol365[key], volatilityTolerance, `${testCase.id}/365/${key}`);
    }
  }
  goldenResults.set(testCase.id, result);
}

const teachingRows = parseRealizedVolatilityCsv(TEACHING_CSV);
assert.equal(
  parseRealizedVolatilityCsv(TEACHING_CSV.replaceAll(',', ';')).length,
  teachingRows.length,
  'semicolon CSV must preserve observations',
);
const business252 = analyzeRealizedVolatility(teachingRows, { annualization: 252, rollingWindow: 5 }, {
  filename: 'teaching.csv', sourceText: TEACHING_CSV, adjustmentBasis: 'adjusted',
});
const calendar365 = analyzeRealizedVolatility(teachingRows, { annualization: 365, rollingWindow: 5 }, {
  filename: 'teaching.csv', sourceText: TEACHING_CSV, adjustmentBasis: 'adjusted',
});
for (const key of ESTIMATOR_KEYS) {
  close(calendar365.estimators[key].variance, business252.estimators[key].variance, varianceTolerance, `${key}: annualization preserves variance`);
  close(
    calendar365.estimators[key].annualizedVolatility / business252.estimators[key].annualizedVolatility,
    Math.sqrt(365 / 252),
    volatilityTolerance,
    `${key}: 365/252 scaling`,
  );
}
assert.equal(business252.rolling.length, business252.sessionCount - 5 + 1);
assert.ok(business252.rolling.every((item) => item.sessionCount === 5));

const flatCsv = `date,open,high,low,close
2024-01-02,100,100,100,100
2024-01-03,100,100,100,100
2024-01-04,100,100,100,100
2024-01-05,100,100,100,100
2024-01-08,100,100,100,100
2024-01-09,100,100,100,100
`;
const flat = analyzeRealizedVolatility(parseRealizedVolatilityCsv(flatCsv), { annualization: 252, rollingWindow: 5 }, {
  sourceText: flatCsv, adjustmentBasis: 'adjusted',
});
for (const key of ESTIMATOR_KEYS) {
  assert.equal(flat.estimators[key].variance, 0, `flat/${key} variance`);
  assert.equal(flat.estimators[key].annualizedVolatility, 0, `flat/${key} volatility`);
}
assert.equal(flat.warnings.filter((warning) => warning.code === 'FLAT_BAR').length, 5, 'the seed row is not an aligned estimator session');
assert.equal(flat.warnings.filter((warning) => warning.code === 'REPEATED_CLOSE').length, 5);

const overnightCsv = `date,open,high,low,close
2024-01-02,100,100,100,100
2024-01-03,102,102,102,102
2024-01-04,99,99,99,99
2024-01-05,103,103,103,103
2024-01-08,100,100,100,100
2024-01-09,102,102,102,102
`;
const overnight = analyzeRealizedVolatility(parseRealizedVolatilityCsv(overnightCsv), { annualization: 252, rollingWindow: 5 }, {
  sourceText: overnightCsv, adjustmentBasis: 'adjusted',
});
assert.ok(overnight.estimators.closeToClose.variance > 0);
assert.equal(overnight.estimators.parkinson.variance, 0);
assert.equal(overnight.estimators.garmanKlass.variance, 0);
assert.equal(overnight.estimators.rogersSatchell.variance, 0);
close(overnight.estimators.yangZhang.variance, overnight.estimators.closeToClose.variance, varianceTolerance, 'overnight-only Yang-Zhang');

const qualityCsv = `date,open,high,low,close
2024-01-02,100,101,99,100
2024-01-03,100,101,99,100
2024-01-08,130,130,130,130
2024-01-09,130,131,129,130
2024-01-10,130,131,129,130
2024-01-11,130,131,129,130
`;
const quality = analyzeRealizedVolatility(parseRealizedVolatilityCsv(qualityCsv), { annualization: 252, rollingWindow: 5 }, {
  filename: 'raw.csv', sourceText: qualityCsv,
});
for (const code of ['UNKNOWN_PRICE_BASIS', 'POSSIBLE_MISSING_SESSION', 'LARGE_CLOSE_JUMP', 'FLAT_BAR', 'REPEATED_CLOSE', 'RETURN_OUTLIERS']) {
  assert.ok(quality.warnings.some((warning) => warning.code === code), `quality warning ${code}`);
}
assert.equal(quality.observationCount, 6, 'warning rows must remain in the calculation');
assert.ok(quality.warnings.every((warning) => warning.includedInCalculation === true));
assert.ok(quality.warnings.filter((warning) => warning.date).every((warning) => /^\d{4}-\d{2}-\d{2}$/.test(warning.date)));
assert.ok(quality.warnings.every((warning) => warning.date || (warning.startDate && warning.endDate)), 'every quality warning must be dated');

const failures = [
  ['', /empty/],
  ['date|open|high|low|close\n2024-01-01|1|1|1|1', /delimiter/],
  ['date,open;high,low;close\n2024-01-01,1;1,1;1\n2024-01-02,1;1,1;1\n2024-01-03,1;1,1;1', /unambiguously/],
  ['date,open,high,low\n2024-01-01,1,1,1', /header|exactly/],
  ['date,open,high,low,close\n2024-01-01,1,1,1,1\n2024-01-01,1,1,1,1\n2024-01-03,1,1,1,1', /duplicate/],
  ['date,open,high,low,close\n2024-01-02,1,1,1,1\n2024-01-01,1,1,1,1\n2024-01-03,1,1,1,1', /chronological/],
  ['date,open,high,low,close\n2024-02-30,1,1,1,1\n2024-03-01,1,1,1,1\n2024-03-02,1,1,1,1', /valid calendar date/],
  ['date,open,high,low,close\n2024-01-01,0,1,1,1\n2024-01-02,1,1,1,1\n2024-01-03,1,1,1,1', /strictly positive/],
  ['date,open,high,low,close\n2024-01-01,2,1,1,1\n2024-01-02,1,1,1,1\n2024-01-03,1,1,1,1', /OHLC consistency/],
  ['date,open,high,low,close\n2024-01-01,1,1,1,1\n\n2024-01-03,1,1,1,1', /blank rows/],
  ['date,open,high,low,close\n2024-01-01,=1,1,1,1\n2024-01-02,1,1,1,1\n2024-01-03,1,1,1,1', /formula/],
  ['date,open,high,low,close\n2024-01-01,Infinity,1,1,1\n2024-01-02,1,1,1,1\n2024-01-03,1,1,1,1', /finite number/],
  ['date,open,high,low,close\n2024-01-01,"1,1,1,1\n2024-01-02,1,1,1,1\n2024-01-03,1,1,1,1', /unterminated quoted field/],
];
for (const [csv, pattern] of failures) assert.throws(() => parseRealizedVolatilityCsv(csv), pattern);
assert.throws(
  () => parseRealizedVolatilityCsv(TEACHING_CSV.replace('date,open,high,low,close', 'close,date,open,high,low')),
  /exactly date,open,high,low,close/,
  'reordered columns must fail identically in both engines',
);
assert.throws(
  () => parseRealizedVolatilityCsv(`date,open,high,low,close\n${'2024-01-01,1,1,1,1\n'.repeat(MAX_REALIZED_VOLATILITY_CSV_CHARACTERS)}`),
  /byte limit/,
);
const volumeCsv = TEACHING_CSV.replace('date,open,high,low,close', 'date,open,high,low,close,volume')
  .split('\n').map((line, index) => index === 0 || !line ? line : `${line},${1_000 + index}`).join('\n');
assert.ok(parseRealizedVolatilityCsv(volumeCsv).every((row) => Number.isFinite(row.volume)), 'optional trailing volume must be preserved');
assert.throws(() => analyzeRealizedVolatility(teachingRows, { annualization: 0, rollingWindow: 5 }), /annualization/);
assert.throws(() => analyzeRealizedVolatility(teachingRows, { annualization: 367, rollingWindow: 5 }), /annualization/);
assert.throws(() => analyzeRealizedVolatility(teachingRows, { annualization: 252, rollingWindow: 1 }), /rollingWindow/);
assert.throws(() => analyzeRealizedVolatility(teachingRows, { annualization: 252, rollingWindow: 5, calendarMode: 'exchange_magic' }), /calendarMode/);
assert.throws(() => analyzeRealizedVolatility(teachingRows, { annualization: 252, rollingWindow: 5, priceBasis: 'guessed' }), /priceBasis/);
assert.throws(() => parseRealizedVolatilityCsv(TEACHING_CSV, { maxRows: teachingRows.length - 1 }), /observation limit/);

assert.match(business252.source.sha256, /^[a-f0-9]{64}$/);
const rollingCsv = buildRollingCsv(business252);
const observationsCsv = buildObservationsCsv(quality);
assert.match(rollingCsv, new RegExp(REALIZED_VOLATILITY_ROLLING_CSV_SCHEMA.replaceAll('.', '\\.')));
assert.match(observationsCsv, new RegExp(REALIZED_VOLATILITY_OBSERVATIONS_CSV_SCHEMA.replaceAll('.', '\\.')));
assert.match(rollingCsv, new RegExp(business252.source.sha256));
assert.match(observationsCsv, new RegExp(quality.source.sha256));
assert.equal(rollingCsv.split('\n').filter(Boolean).length, business252.rolling.length + 1);
assert.equal(observationsCsv.split('\n').filter(Boolean).length, quality.observationCount + 1);
assert.equal(JSON.parse(JSON.stringify(business252)).schema, REALIZED_VOLATILITY_RESULT_SCHEMA);
assert.throws(() => buildRollingCsv({ ...business252, schema: 'tampered' }), /not exportable/);
assert.throws(() => buildObservationsCsv({ ...quality, source: { ...quality.source, sha256: 'bad' } }), /SHA-256/);
const formulaSafeResult = {
  ...quality,
  observations: quality.observations.map((observation, index) => ({
    ...observation,
    flags: index === 0 ? ['=HYPERLINK("bad")'] : observation.flags,
  })),
};
assert.match(buildObservationsCsv(formulaSafeResult), /'=HYPERLINK/);

const workerSource = await readFile(path.resolve(scriptDirectory, '../src/workers/realizedVolatility.worker.mjs'), 'utf8');
assert.match(workerSource, /message\.type !== 'analyze'/);
assert.match(workerSource, /\{ type: 'result', runId, result \}/);
assert.match(workerSource, /type: 'error'/);
assert.ok(!/fetch\(|XMLHttpRequest|Date\.now|Math\.random|document\.|window\./.test(workerSource));
const engineSource = await readFile(path.resolve(scriptDirectory, '../src/lib/realizedVolatility.mjs'), 'utf8');
assert.ok(!/fetch\(|XMLHttpRequest|Date\.now|Math\.random|document\.|window\./.test(engineSource));
const workerMessages = [];
globalThis.postMessage = (message) => workerMessages.push(message);
await import(`../src/workers/realizedVolatility.worker.mjs?smoke=${REALIZED_VOLATILITY_VERSION}`);
globalThis.onmessage({ data: {
  type: 'analyze', runId: 'valid-run', csvText: TEACHING_CSV, filename: 'teaching.csv',
  config: { annualization: 252, window: 5, calendarMode: 'weekday_sessions', priceBasis: 'split_adjusted_ohlc' },
} });
globalThis.onmessage({ data: {
  type: 'analyze', runId: 'invalid-run', csvText: 'bad', filename: 'bad.csv', config: {},
} });
assert.equal(workerMessages[0]?.type, 'result');
assert.equal(workerMessages[0]?.runId, 'valid-run');
assert.equal(workerMessages[0]?.result?.sessionCount, teachingRows.length - 1);
assert.equal(workerMessages[1]?.type, 'error');
assert.equal(workerMessages[1]?.runId, 'invalid-run');
assert.match(workerMessages[1]?.error ?? '', /delimiter|header|observations/);
delete globalThis.onmessage;
delete globalThis.postMessage;

console.log(`[STEP 1] shared realized-volatility fixture · [STATUS] ok · [REQUEST] five deterministic OHLC estimators · [INPUT] ${fixtureCases.length} golden cases · [OUTPUT] C2C/Parkinson/GK/RS/YZ agree within variance=${varianceTolerance}, vol=${volatilityTolerance} · [ERROR] none · [NEXT] validate conventions`);
console.log('[STEP 2] conventions and rolling · [STATUS] ok · [REQUEST] 252/365 annualization and rolling windows · [INPUT] deterministic teaching OHLC · [OUTPUT] shared sessions, exact square-root scaling and rolling cardinality · [ERROR] none · [NEXT] validate edge cases');
console.log('[STEP 3] edge cases and quality · [STATUS] ok · [REQUEST] flat/overnight/warning preservation · [INPUT] deterministic adversarial OHLC · [OUTPUT] zero-vol flat bars, overnight-only decomposition and dated warnings retained · [ERROR] none · [NEXT] validate fail-closed parser');
console.log(`[STEP 4] strict parser and exports · [STATUS] ok · [REQUEST] CSV/JSON evidence contract · [INPUT] schema/date/price/OHLC/formula/size adversaries · [OUTPUT] fail-closed parsing plus ${business252.rolling.length} rolling and ${quality.observationCount} observation rows with SHA-256 · [ERROR] none · [NEXT] validate worker purity`);
console.log('[STEP 5] worker and purity contract · [STATUS] ok · [REQUEST] browser/CLI shared engine · [INPUT] source audit · [OUTPUT] analyze/result/error protocol; no DOM, network, clock or random dependency · [ERROR] none · [NEXT] frontend integration');
console.log('[VERDICT] PASS · F-CAL-4 frontend engine is deterministic, strict, versioned, worker-ready and CLI-tested');
