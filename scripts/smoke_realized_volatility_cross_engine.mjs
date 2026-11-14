import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ESTIMATOR_KEYS,
  REALIZED_VOLATILITY_CONTRACT,
  analyzeRealizedVolatility,
  buildObservationsCsv,
  buildRollingCsv,
  parseRealizedVolatilityCsv,
} from '../src/lib/realizedVolatility.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '../../..');
const backendRoot = path.join(repositoryRoot, 'Tools', 'pricinglibrary_rag_backend');
const contract = JSON.parse(await readFile(path.join(repositoryRoot, 'fixtures', 'realized_volatility_contract.json'), 'utf8'));
const python = process.env.PYTHON || 'python';
const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'tpl-realized-vol-cross-'));

const csv = `date,open,high,low,close,volume
2024-01-02,100,101,99,100,1000
2024-01-03,100,101,99,100,1010
2024-01-08,130,140,100,130,1500
2024-01-09,130,131,129,130,900
2024-01-10,130,130,130,130,920
2024-01-11,130,131,129,130,940
2024-01-12,129,133,128,132,1200
`;
const csvPath = path.join(temporaryDirectory, 'case.csv');
await writeFile(csvPath, csv, 'utf8');

const pythonRun = (format = 'json', target = csvPath) => spawnSync(python, [
  '-m', 'pricinglibrary_rag.realized_volatility', target,
  '--window', '5', '--annualization', '252', '--calendar-mode', 'weekday_sessions',
  '--price-basis', 'unknown', '--source-label', 'Cross-engine fixture', '--symbol-label', 'XENG',
  '--format', format,
], { cwd: backendRoot, encoding: 'utf8' });

const deepApproxEqual = (left, right, location = '$') => {
  if (typeof left === 'number' || typeof right === 'number') {
    assert.equal(typeof left, 'number', `${location}: JS/Python type mismatch`);
    assert.equal(typeof right, 'number', `${location}: JS/Python type mismatch`);
    assert.ok(Number.isFinite(left) && Number.isFinite(right), `${location}: non-finite output`);
    const tolerance = 1e-13 * Math.max(1, Math.abs(left), Math.abs(right));
    assert.ok(Math.abs(left - right) <= tolerance, `${location}: ${left} != ${right} within ${tolerance}`);
    return;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    assert.ok(Array.isArray(left) && Array.isArray(right), `${location}: array mismatch`);
    assert.equal(left.length, right.length, `${location}: array length mismatch`);
    left.forEach((value, index) => deepApproxEqual(value, right[index], `${location}[${index}]`));
    return;
  }
  if (left && typeof left === 'object' || right && typeof right === 'object') {
    assert.ok(left && right && typeof left === 'object' && typeof right === 'object', `${location}: object/null mismatch`);
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    assert.deepEqual(leftKeys, rightKeys, `${location}: object keys mismatch`);
    leftKeys.forEach((key) => deepApproxEqual(left[key], right[key], `${location}.${key}`));
    return;
  }
  assert.equal(left, right, `${location}: scalar mismatch`);
};

try {
  const contractProjection = {
    csv: contract.csv,
    config: contract.config,
    diagnostics: contract.diagnostics,
    provenance: contract.provenance,
    exportNumericSignificantDigits: contract.exportNumericSignificantDigits,
    exportNumericFormat: contract.exportNumericFormat,
  };
  assert.deepEqual(REALIZED_VOLATILITY_CONTRACT, contractProjection, 'JavaScript runtime rules must equal the canonical JSON contract');
  const pythonContractRun = spawnSync(python, ['-c', 'import json; from pricinglibrary_rag.realized_volatility import realized_volatility_contract_snapshot; print(json.dumps(realized_volatility_contract_snapshot(), sort_keys=True))'], { cwd: backendRoot, encoding: 'utf8' });
  assert.equal(pythonContractRun.status, 0, pythonContractRun.stderr);
  assert.deepEqual(JSON.parse(pythonContractRun.stdout), contractProjection, 'Python runtime rules must equal the canonical JSON contract');

  const rows = parseRealizedVolatilityCsv(csv);
  const jsResult = analyzeRealizedVolatility(rows, {
    window: 5,
    annualization: 252,
    calendarMode: 'weekday_sessions',
    priceBasis: 'unknown',
    sourceLabel: 'Cross-engine fixture',
    symbolLabel: 'XENG',
    filename: 'case.csv',
  });
  const pythonJson = pythonRun('json');
  assert.equal(pythonJson.status, 0, pythonJson.stderr);
  const pythonResult = JSON.parse(pythonJson.stdout);

  assert.deepEqual(Object.keys(jsResult).sort(), [...contract.resultRequiredKeys].sort(), 'result keys must equal the canonical contract');
  assert.deepEqual(Object.keys(pythonResult).sort(), [...contract.resultRequiredKeys].sort(), 'Python result keys must equal the canonical contract');
  deepApproxEqual(jsResult, pythonResult);

  const pythonRolling = pythonRun('rolling-csv');
  const pythonObservations = pythonRun('observations-csv');
  assert.equal(pythonRolling.status, 0, pythonRolling.stderr);
  assert.equal(pythonObservations.status, 0, pythonObservations.stderr);
  assert.equal(buildRollingCsv(jsResult), pythonRolling.stdout, 'rolling CSV must be byte-identical across engines');
  assert.equal(buildObservationsCsv(jsResult), pythonObservations.stdout, 'observation CSV must be byte-identical across engines');
  assert.deepEqual(buildRollingCsv(jsResult).split('\n')[0].split(','), contract.rollingCsvHeaders);
  assert.deepEqual(buildObservationsCsv(jsResult).split('\n')[0].split(','), contract.observationsCsvHeaders);

  const alternateCsv = `\ufeff${csv.replaceAll(',', ';').replaceAll('\n', '\r\n')}`;
  const alternatePath = path.join(temporaryDirectory, 'alternate.csv');
  await writeFile(alternatePath, alternateCsv, 'utf8');
  const alternateJs = analyzeRealizedVolatility(parseRealizedVolatilityCsv(alternateCsv), {
    window: 5, annualization: 252, calendarMode: 'weekday_sessions', priceBasis: 'unknown',
    sourceLabel: 'Cross-engine fixture', symbolLabel: 'XENG', filename: 'alternate.csv',
  });
  const alternatePython = pythonRun('json', alternatePath);
  assert.equal(alternatePython.status, 0, alternatePython.stderr);
  assert.equal(alternateJs.source.sha256, jsResult.source.sha256, 'JS hash must depend on canonical observations, not upload formatting');
  assert.equal(JSON.parse(alternatePython.stdout).source.sha256, jsResult.source.sha256, 'Python hash must use the same canonical dataset');

  const reorderedPath = path.join(temporaryDirectory, 'reordered.csv');
  const reordered = csv.replace('date,open,high,low,close,volume', 'close,date,open,high,low,volume');
  await writeFile(reorderedPath, reordered, 'utf8');
  assert.throws(() => parseRealizedVolatilityCsv(reordered), /exactly date,open,high,low,close/);
  assert.equal(pythonRun('json', reorderedPath).status, 2, 'Python must reject the same reordered header');

  const numericCases = [
    ['small-scientific.csv', `date,open,high,low,close\n2024-01-02,1e-5,1.02e-5,0.99e-5,1.01e-5\n2024-01-03,1.01e-5,1.03e-5,1e-5,1.02e-5\n2024-01-04,1.02e-5,1.04e-5,1.01e-5,1.03e-5\n2024-01-05,1.03e-5,1.05e-5,1.02e-5,1.04e-5\n2024-01-08,1.04e-5,1.06e-5,1.03e-5,1.05e-5\n2024-01-09,1.05e-5,1.07e-5,1.04e-5,1.06e-5\n`],
    ['large-decimal.csv', `date,open,high,low,close\n2024-01-02,1e12,1.02e12,0.99e12,1.01e12\n2024-01-03,1.01e12,1.03e12,1e12,1.02e12\n2024-01-04,1.02e12,1.04e12,1.01e12,1.03e12\n2024-01-05,1.03e12,1.05e12,1.02e12,1.04e12\n2024-01-08,1.04e12,1.06e12,1.03e12,1.05e12\n2024-01-09,1.05e12,1.07e12,1.04e12,1.06e12\n`],
  ];
  for (const [fileName, numericCsv] of numericCases) {
    const target = path.join(temporaryDirectory, fileName);
    await writeFile(target, numericCsv, 'utf8');
    const jsNumeric = analyzeRealizedVolatility(parseRealizedVolatilityCsv(numericCsv), {
      window: 5, annualization: 252, calendarMode: 'weekday_sessions', priceBasis: 'unknown',
      sourceLabel: 'Cross-engine fixture', symbolLabel: 'XENG', filename: fileName,
    });
    const pythonNumericRun = pythonRun('json', target);
    assert.equal(pythonNumericRun.status, 0, pythonNumericRun.stderr);
    const pythonNumeric = JSON.parse(pythonNumericRun.stdout);
    assert.equal(jsNumeric.source.sha256, pythonNumeric.source.sha256, `${fileName}: canonical SHA mismatch`);
    assert.equal(jsNumeric.analysisId, pythonNumeric.analysisId, `${fileName}: analysisId mismatch`);
    deepApproxEqual(jsNumeric, pythonNumeric, `$numeric.${fileName}`);
  }

  const tooEarly = csv.replace('2024-01-02', '1899-01-01');
  const tooEarlyPath = path.join(temporaryDirectory, 'too-early.csv');
  await writeFile(tooEarlyPath, tooEarly, 'utf8');
  assert.throws(() => parseRealizedVolatilityCsv(tooEarly), /valid calendar date|1900/);
  assert.equal(pythonRun('json', tooEarlyPath).status, 2, 'Python must enforce the same 1900 date floor');
  assert.throws(() => analyzeRealizedVolatility(rows.map((row, index) => index === 0 ? { ...row, adj_close: row.close } : row), { window: 5 }), /unknown=adj_close/);
  assert.throws(() => analyzeRealizedVolatility(rows, { window: 5, calendarMode: 'calendar_days' }), /calendarMode/);

  for (const key of ESTIMATOR_KEYS) assert.equal(jsResult.estimators[key].sessionCount, jsResult.sessionCount);
  for (const code of ['POSSIBLE_MISSING_SESSION', 'LARGE_CLOSE_JUMP', 'LARGE_INTRADAY_RANGE', 'FLAT_BAR', 'REPEATED_CLOSE']) {
    assert.ok(jsResult.diagnostics.events.some((event) => event.code === code), `adversarial fixture must exercise ${code}`);
  }

  console.log('[STEP 1] canonical contract · [STATUS] ok · [OUTPUT] JSON limits, enums, thresholds, date domain, provenance and numeric formats equal both runtimes');
  console.log('[STEP 2] cross-engine result · [STATUS] ok · [OUTPUT] recursive structure/scalars exact; numeric tolerance 1e-13');
  console.log('[STEP 3] evidence exports · [STATUS] ok · [OUTPUT] rolling and observations CSV byte-identical');
  console.log('[STEP 4] provenance · [STATUS] ok · [OUTPUT] formatting plus small-scientific and large-decimal prices produce common SHA/analysis IDs');
  console.log('[STEP 5] adversarial parity · [STATUS] ok · [OUTPUT] reordered/extra fields, date floor and alias fail closed; gaps/jumps/ranges/flat/repeated diagnostics agree');
  console.log('[VERDICT] PASS · Python and JavaScript expose one canonical realized-volatility contract');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
