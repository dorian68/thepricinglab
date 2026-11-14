import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MONTE_CARLO_INPUT_SCHEMA,
  analyzeMonteCarlo,
  buildMonteCarloPathsCsv,
  buildMonteCarloTerminalCsv,
} from '../src/lib/monteCarlo.mjs';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const backend = path.join(repositoryRoot, 'Tools', 'pricinglibrary_rag_backend');
const temporary = await mkdtemp(path.join(tmpdir(), 'tpl-mc-cross-'));
const common = {
  schemaVersion: MONTE_CARLO_INPUT_SCHEMA,
  spot: 100,
  volatility: 0.2,
  maturityYears: 1,
  dayCount: 'ACT/365F',
  paths: 400,
  timeSteps: 12,
  seed: 7,
  method: 'none',
  samplePaths: 3,
  histogramBins: 12,
  currency: 'USD',
  quantity: 2,
  contractMultiplier: 100,
  position: 'long',
};
const cases = [
  { name: 'risk-none-95', input: { ...common, mode: 'risk_physical', physicalDrift: 0.06, confidence: 0.95 } },
  { name: 'risk-antithetic-short-99', input: { ...common, mode: 'risk_physical', method: 'antithetic', position: 'short', physicalDrift: -0.03, confidence: 0.99 } },
  { name: 'pricing-european-none', input: { ...common, mode: 'pricing_risk_neutral', riskFreeRate: 0.05, dividendYield: 0.01, strike: 105, optionType: 'call', payoffType: 'european' } },
  { name: 'pricing-european-antithetic', input: { ...common, mode: 'pricing_risk_neutral', method: 'antithetic', riskFreeRate: -0.01, dividendYield: 0.02, strike: 95, optionType: 'put', payoffType: 'european' } },
  { name: 'pricing-asian-control', input: { ...common, mode: 'pricing_risk_neutral', method: 'control_variate', volatility: 0.35, riskFreeRate: 0.03, dividendYield: 0, strike: 100, optionType: 'call', payoffType: 'arithmetic_asian' } },
  { name: 'pricing-degenerate', input: { ...common, mode: 'pricing_risk_neutral', paths: 100, timeSteps: 1, samplePaths: 1, histogramBins: 10, volatility: 0, riskFreeRate: 0.05, dividendYield: 0, strike: 100, optionType: 'call', payoffType: 'european' } },
];

const python = (file, format) => {
  const result = spawnSync('python', ['-m', 'pricinglibrary_rag.monte_carlo', '--input', file, '--format', format], { cwd: backend, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Python ${format} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
};
const compare = (left, right, location = 'result') => {
  if (typeof left === 'number' || typeof right === 'number') {
    assert.equal(typeof left, 'number', `${location}: JS value is not numeric`);
    assert.equal(typeof right, 'number', `${location}: Python value is not numeric`);
    const tolerance = 1e-11 * Math.max(1, Math.abs(left), Math.abs(right));
    assert.ok(Math.abs(left - right) <= tolerance, `${location}: |${left}-${right}| exceeds ${tolerance}`);
    return;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    assert.ok(Array.isArray(left) && Array.isArray(right), `${location}: array shape mismatch`);
    assert.equal(left.length, right.length, `${location}: array length mismatch`);
    left.forEach((item, index) => compare(item, right[index], `${location}[${index}]`));
    return;
  }
  if (left && typeof left === 'object' || right && typeof right === 'object') {
    assert.ok(left && right && typeof left === 'object' && typeof right === 'object', `${location}: object shape mismatch`);
    assert.deepEqual(Object.keys(left), Object.keys(right), `${location}: object key/order mismatch`);
    Object.keys(left).forEach((key) => compare(left[key], right[key], `${location}.${key}`));
    return;
  }
  assert.equal(left, right, `${location}: scalar mismatch`);
};

try {
  for (const [index, entry] of cases.entries()) {
    const inputFile = path.join(temporary, `${entry.name}.json`);
    await writeFile(inputFile, JSON.stringify(entry.input), 'utf8');
    const js = await analyzeMonteCarlo(entry.input);
    const py = JSON.parse(python(inputFile, 'json'));
    compare(js, py);
    assert.equal(js.analysisId, py.analysisId, `${entry.name}: analysisId differs`);
    assert.equal(buildMonteCarloTerminalCsv(js), python(inputFile, 'terminal-csv'), `${entry.name}: terminal CSV differs`);
    assert.equal(buildMonteCarloPathsCsv(js), python(inputFile, 'paths-csv'), `${entry.name}: paths CSV differs`);
    console.log(`[STEP ${index + 1}] ${entry.name} · [STATUS] ok · [OUTPUT] recursive parity <=1e-11; ID and two CSV exports identical`);
  }
  console.log(`[VERDICT] PASS · F-CAL-6 Python/JavaScript parity holds across ${cases.length} P/Q, variance-reduction, Asian and degenerate scenarios`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
