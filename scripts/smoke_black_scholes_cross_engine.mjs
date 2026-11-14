import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  BLACK_SCHOLES_CONTRACT,
  analyzeBlackScholes,
  buildBlackScholesScenarioCsv,
  buildBlackScholesSensitivityCsv,
} from '../src/lib/blackScholes.mjs';

const backend = path.resolve('../../Tools/pricinglibrary_rag_backend');
const python = process.env.PYTHON || 'python';
const runPython = (args, input) => {
  const run = spawnSync(python, ['-m', 'pricinglibrary_rag.black_scholes', ...args], { cwd: backend, input: input === undefined ? undefined : JSON.stringify(input), encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } });
  return { status: run.status, stdout: run.stdout || '', stderr: run.stderr || '' };
};
const compare = (left, right, location = 'result') => {
  if (typeof left === 'number' && typeof right === 'number') {
    const tolerance = 2e-11 * Math.max(1, Math.abs(left), Math.abs(right));
    assert.ok(Math.abs(left - right) <= tolerance, `${location}: ${left} != ${right}`); return;
  }
  assert.equal(Array.isArray(left), Array.isArray(right), `${location}: array mismatch`);
  if (Array.isArray(left)) { assert.equal(left.length, right.length, `${location}: length`); left.forEach((item, index) => compare(item, right[index], `${location}[${index}]`)); return; }
  if (left && typeof left === 'object') { assert.deepEqual(Object.keys(left).sort(), Object.keys(right).sort(), `${location}: keys`); for (const key of Object.keys(left)) compare(left[key], right[key], `${location}.${key}`); return; }
  assert.equal(left, right, location);
};
const base = (overrides = {}) => ({ schemaVersion: 'tpl.black-scholes.input.v1', quoteMode: 'volatility', optionType: 'call', spot: 100, strike: 100, maturityYears: 0.5, dayCount: 'ACT/365F', riskFreeRate: 0.02, dividendYield: 0, volatility: 0.2, marketPrice: null, currency: 'EUR', position: 'long', quantity: 10, multiplier: 100, shocks: { spotPct: 10, volPoints: 5, days: 30 }, ...overrides });

const contract = runPython(['--contract']);
assert.equal(contract.status, 0, contract.stderr); assert.deepEqual(JSON.parse(contract.stdout), BLACK_SCHOLES_CONTRACT);
console.log('[STEP 1] canonical contract · [STATUS] ok · [OUTPUT] schemas, domains, conventions, grids and CSV headers equal both runtimes');

const reference = await analyzeBlackScholes(base({ optionType: 'put', dividendYield: 0.015, riskFreeRate: -0.003 }));
const cases = [
  ['atm-call', base()],
  ['dividend-negative-rate-put-short', base({ optionType: 'put', dividendYield: 0.035, riskFreeRate: -0.005, strike: 110, position: 'short', quantity: 17, currency: 'USD' })],
  ['expiry-itm', base({ maturityYears: 0, spot: 120 })],
  ['zero-volatility-discounted-limit', base({ volatility: 0, spot: 120, maturityYears: 2, riskFreeRate: 0.04, dividendYield: 0.01 })],
  ['zero-volatility-forward-atm-kink', base({ volatility: 0, maturityYears: 1, riskFreeRate: 0.05, dividendYield: 0.05 })],
  ['market-price-implied-vol', base({ quoteMode: 'market_price', optionType: 'put', volatility: null, marketPrice: reference.selected.unitPrice, dividendYield: 0.015, riskFreeRate: -0.003 })],
  ['large-scaled-position', base({ spot: 4200, strike: 4500, maturityYears: 3, volatility: 0.75, quantity: 1000, multiplier: 50, shocks: { spotPct: 25, volPoints: 20, days: 365 } })],
];
let step = 1;
for (const [name, input] of cases) {
  step += 1; const js = await analyzeBlackScholes(input); const pyRun = runPython([], input); assert.equal(pyRun.status, 0, `${name}: ${pyRun.stderr}`); const py = JSON.parse(pyRun.stdout);
  compare(js, py, name); assert.equal(js.analysisId, py.analysisId);
  const pyScenario = runPython(['--format', 'scenario-csv'], input); const pySensitivity = runPython(['--format', 'sensitivity-csv'], input);
  assert.equal(pyScenario.status, 0, pyScenario.stderr); assert.equal(pySensitivity.status, 0, pySensitivity.stderr);
  assert.equal(buildBlackScholesScenarioCsv(js), pyScenario.stdout, `${name}: scenario CSV`); assert.equal(buildBlackScholesSensitivityCsv(js), pySensitivity.stdout, `${name}: sensitivity CSV`);
  console.log(`[STEP ${step}] ${name} · [STATUS] ok · [OUTPUT] recursive parity <=2e-11; SHA and two CSV exports byte-identical`);
}
const invalids = [base({ spot: 0 }), base({ volatility: 5.1 }), { ...base(), surprise: true }, base({ quoteMode: 'market_price', volatility: null, marketPrice: 101 })];
for (const input of invalids) { const pyRun = runPython([], input); assert.notEqual(pyRun.status, 0); await assert.rejects(() => analyzeBlackScholes(input)); }
console.log(`[STEP ${step + 1}] fail-closed parity · [STATUS] ok · [OUTPUT] ${invalids.length} invalid domain/schema/quote payloads rejected in both runtimes`);
console.log('[VERDICT] PASS · F-CAL10 values, IV, limits, Greeks, position, scenarios, hashes and exports are cross-engine reproducible');
