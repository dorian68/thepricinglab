import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  BINOMIAL_CONTRACT,
  analyzeBinomial,
  buildBinomialConvergenceCsv,
  buildBinomialFrontierCsv,
} from '../src/lib/binomial.mjs';

const backend = path.resolve('../../Tools/pricinglibrary_rag_backend');
const python = process.env.PYTHON || 'python';
const temp = await mkdtemp(path.join(tmpdir(), 'tpl-binomial-'));
const runPython = (args) => {
  const run = spawnSync(python, ['-m', 'pricinglibrary_rag.binomial', ...args], { cwd: backend, encoding: null, env: { ...process.env, PYTHONUTF8: '1' } });
  return { status: run.status, stdout: run.stdout?.toString('utf8') ?? '', stderr: run.stderr?.toString('utf8') ?? '' };
};
const compare = (left, right, location = 'result') => {
  if (typeof left === 'number' && typeof right === 'number') {
    const tolerance = 2e-10 * Math.max(1, Math.abs(left), Math.abs(right));
    assert.ok(Math.abs(left - right) <= tolerance, `${location}: ${left} != ${right}`); return;
  }
  assert.equal(Array.isArray(left), Array.isArray(right), `${location}: array mismatch`);
  if (Array.isArray(left)) { assert.equal(left.length, right.length, `${location}: length`); left.forEach((item, index) => compare(item, right[index], `${location}[${index}]`)); return; }
  if (left && typeof left === 'object') {
    assert.deepEqual(Object.keys(left).sort(), Object.keys(right).sort(), `${location}: keys`);
    for (const key of Object.keys(left)) compare(left[key], right[key], `${location}.${key}`);
    return;
  }
  assert.equal(left, right, location);
};
const base = (overrides = {}) => ({ schemaVersion: 'tpl.binomial.input.v1', spot: 100, strike: 100, volatility: 0.2, maturityYears: 1, dayCount: 'ACT/365F', riskFreeRate: 0.05, dividendYield: 0, steps: 200, optionType: 'call', exerciseStyle: 'european', currency: 'USD', quantity: 2, contractMultiplier: 100, position: 'long', ...overrides });
const cases = [
  ['european-call', base()],
  ['european-put-dividend', base({ optionType: 'put', dividendYield: 0.02, steps: 251 })],
  ['american-put', base({ optionType: 'put', exerciseStyle: 'american', steps: 300 })],
  ['american-dividend-call', base({ strike: 90, riskFreeRate: 0.01, dividendYield: 0.12, exerciseStyle: 'american', steps: 300 })],
  ['zero-volatility', base({ volatility: 0, optionType: 'put', exerciseStyle: 'american' })],
  ['at-expiry-short', base({ spot: 90, maturityYears: 0, optionType: 'put', exerciseStyle: 'american', position: 'short' })],
  ['rho-probability-edge', base({ riskFreeRate: 0.2828, volatility: 0.2, steps: 2 })],
  ['negative-rate-american-call', base({ riskFreeRate: -0.1, exerciseStyle: 'american', steps: 300 })],
];

try {
  const contract = runPython(['--contract']);
  assert.equal(contract.status, 0, contract.stderr); assert.deepEqual(JSON.parse(contract.stdout), BINOMIAL_CONTRACT);
  console.log('[STEP 1] canonical contract · [STATUS] ok · [OUTPUT] JSON limits, enums, units and evidence headers equal both runtimes');
  let index = 0;
  for (const [name, input] of cases) {
    index += 1;
    const inputPath = path.join(temp, `${name}.json`); await writeFile(inputPath, JSON.stringify(input), 'utf8');
    const js = await analyzeBinomial(input);
    const pyRun = runPython(['--input', inputPath]); assert.equal(pyRun.status, 0, pyRun.stderr);
    const py = JSON.parse(pyRun.stdout); compare(js, py, name); assert.equal(js.analysisId, py.analysisId);
    const pyConvergence = runPython(['--input', inputPath, '--convergence-csv']); assert.equal(pyConvergence.status, 0, pyConvergence.stderr);
    const pyFrontier = runPython(['--input', inputPath, '--frontier-csv']); assert.equal(pyFrontier.status, 0, pyFrontier.stderr);
    assert.equal(buildBinomialConvergenceCsv(js), pyConvergence.stdout, `${name}: convergence CSV`);
    assert.equal(buildBinomialFrontierCsv(js), pyFrontier.stdout, `${name}: frontier CSV`);
    console.log(`[STEP ${index + 1}] ${name} · [STATUS] ok · [OUTPUT] recursive parity <=2e-10; ID and two CSV exports identical`);
  }
  const badPath = path.join(temp, 'invalid.json'); await writeFile(badPath, JSON.stringify(base({ volatility: 0.01, riskFreeRate: 0.15, steps: 5 })), 'utf8');
  const badPython = runPython(['--input', badPath]); assert.notEqual(badPython.status, 0); assert.match(badPython.stderr, /outside \[0,1\]/);
  await assert.rejects(() => analyzeBinomial(base({ volatility: 0.01, riskFreeRate: 0.15, steps: 5 })), /outside \[0,1\]/);
  console.log(`[STEP ${cases.length + 2}] fail-closed parity · [STATUS] ok · [OUTPUT] both runtimes reject an invalid no-arbitrage probability without clamping`);
  console.log('[VERDICT] PASS · F-CAL-7 Python/JavaScript prices, Greeks, exercise decisions, hashes and exports are cross-engine reproducible');
} finally {
  await rm(temp, { recursive: true, force: true });
}
