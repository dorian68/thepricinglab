import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PAYOFF_STRATEGY_CONTRACT,
  analyzePayoffStrategy,
  buildPayoffCurveCsv,
  buildPayoffScenarioCsv,
} from '../src/lib/payoffStrategy.mjs';

const backendDirectory = fileURLToPath(new URL('../../../Tools/pricinglibrary_rag_backend/', import.meta.url));
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'tpl-payoff-cross-engine-'));
const goldenFixture = JSON.parse(await readFile(new URL('../../../fixtures/payoff_strategy_golden.json', import.meta.url), 'utf8'));

const python = (args) => spawnSync(
  'python',
  ['-m', 'pricinglibrary_rag.payoff_strategy', ...args],
  { cwd: backendDirectory, encoding: 'utf8', windowsHide: true },
);

const assertEquivalent = (javascriptValue, pythonValue, path = 'result') => {
  if (typeof javascriptValue === 'number' && typeof pythonValue === 'number') {
    const scale = Math.max(1, Math.abs(javascriptValue), Math.abs(pythonValue));
    assert.ok(Math.abs(javascriptValue - pythonValue) <= 1e-12 * scale, `${path}: ${javascriptValue} != ${pythonValue}`);
    return;
  }
  if (Array.isArray(javascriptValue)) {
    assert.ok(Array.isArray(pythonValue), `${path} is not an array in Python`);
    assert.equal(pythonValue.length, javascriptValue.length, `${path} length`);
    javascriptValue.forEach((value, index) => assertEquivalent(value, pythonValue[index], `${path}[${index}]`));
    return;
  }
  if (javascriptValue && typeof javascriptValue === 'object') {
    assert.ok(pythonValue && typeof pythonValue === 'object' && !Array.isArray(pythonValue), `${path} is not an object in Python`);
    assert.deepEqual(Object.keys(pythonValue), Object.keys(javascriptValue), `${path} keys`);
    for (const key of Object.keys(javascriptValue)) assertEquivalent(javascriptValue[key], pythonValue[key], `${path}.${key}`);
    return;
  }
  assert.equal(pythonValue, javascriptValue, path);
};

const market = goldenFixture.market;

const manual = (id, type, side, strike, quantity, premium) => ({
  id, type, side, strike, quantity, premiumSource: 'manual', manualPremium: premium,
});
const model = (id, type, side, strike, quantity = 1) => ({
  id, type, side, strike, quantity, premiumSource: 'model', manualPremium: null,
});

const fixtures = [
  ...goldenFixture.cases.map((fixture) => ({
    name: fixture.id,
    input: { ...goldenFixture.market, ...fixture.overrides, legs: fixture.legs },
  })),
  {
    name: 'model-premiums-negative-rate',
    input: { ...market, spot: 87.25, volatility: 0.613, timeToMaturity: 0.37, riskFreeRate: -0.015, dividendYield: 0.042, currency: 'EUR', contractMultiplier: 10, gridPoints: 733, legs: [model('long-put', 'put', 'long', 92, 3), model('short-call', 'call', 'short', 105, 2)] },
  },
];

try {
  const contractRun = python(['--contract']);
  assert.equal(contractRun.status, 0, contractRun.stderr);
  assert.deepEqual(JSON.parse(contractRun.stdout), PAYOFF_STRATEGY_CONTRACT);
  console.log('[STEP 1] runtime contract parity · [STATUS] ok · [OUTPUT] Python and JavaScript expose the exact same canonical contract');

  for (const [index, fixture] of fixtures.entries()) {
    const inputPath = join(temporaryDirectory, `${index}-${fixture.name}.json`);
    await writeFile(inputPath, `${JSON.stringify(fixture.input)}\n`, 'utf8');
    const javascriptResult = await analyzePayoffStrategy(fixture.input);
    const jsonRun = python(['--input', inputPath, '--format', 'json']);
    assert.equal(jsonRun.status, 0, `${fixture.name}: ${jsonRun.stderr}`);
    const pythonResult = JSON.parse(jsonRun.stdout);
    assert.equal(pythonResult.analysisId, javascriptResult.analysisId, `${fixture.name}: analysis SHA`);
    assertEquivalent(javascriptResult, pythonResult, fixture.name);

    const curveRun = python(['--input', inputPath, '--format', 'curve-csv']);
    const scenarioRun = python(['--input', inputPath, '--format', 'scenario-csv']);
    assert.equal(curveRun.status, 0, `${fixture.name} curve: ${curveRun.stderr}`);
    assert.equal(scenarioRun.status, 0, `${fixture.name} scenarios: ${scenarioRun.stderr}`);
    assert.equal(curveRun.stdout, buildPayoffCurveCsv(javascriptResult), `${fixture.name}: curve CSV bytes`);
    assert.equal(scenarioRun.stdout, buildPayoffScenarioCsv(javascriptResult), `${fixture.name}: scenario CSV bytes`);
  }
  console.log(`[STEP 2] analysis and export parity · [STATUS] ok · [INPUT] ${fixtures.length} strategies · [OUTPUT] recursive numeric parity ≤1e-12, identical SHA-256 IDs and byte-identical CSV evidence`);

  const invalidInputs = [
    { ...market, legs: [] },
    { ...market, volatility: Number.MIN_VALUE, legs: [model('subnormal', 'call', 'long', 100)] },
    { ...market, currency: 'usd', legs: [model('x', 'call', 'long', 100)] },
    { ...market, extra: true, legs: [model('x', 'call', 'long', 100)] },
    { ...market, legs: [manual('x', 'call', 'long', 100, 1.5, 5)] },
    { ...market, legs: [model('duplicate', 'call', 'long', 100), model('duplicate', 'put', 'short', 90)] },
  ];
  for (const [index, input] of invalidInputs.entries()) {
    const inputPath = join(temporaryDirectory, `invalid-${index}.json`);
    await writeFile(inputPath, `${JSON.stringify(input)}\n`, 'utf8');
    await assert.rejects(() => analyzePayoffStrategy(input));
    const run = python(['--input', inputPath, '--format', 'json']);
    assert.equal(run.status, 2, `invalid ${index} unexpectedly accepted by Python`);
    assert.match(run.stderr, /^payoff-strategy: /);
  }
  console.log(`[STEP 3] fail-closed parity · [STATUS] ok · [INPUT] ${invalidInputs.length} malformed/domain-invalid strategies · [OUTPUT] both runtimes reject every case`);
  console.log('[VERDICT] PASS · F-CAL-5 Python/JavaScript calculations, hashes, exports and rejection boundaries are cross-engine reproducible');
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
