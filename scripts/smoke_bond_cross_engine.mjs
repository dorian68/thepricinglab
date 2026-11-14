import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  BOND_CONTRACT, analyzeBond, buildBondCashflowsCsv, buildBondScenariosCsv,
} from '../src/lib/bond.mjs';

const backend = path.resolve('../../Tools/pricinglibrary_rag_backend');
const python = process.env.PYTHON || 'python';
const temp = await mkdtemp(path.join(tmpdir(), 'tpl-bond-'));
const runPython = (args) => {
  const run = spawnSync(python, ['-m', 'pricinglibrary_rag.bond', ...args], { cwd: backend, encoding: null, env: { ...process.env, PYTHONUTF8: '1' } });
  return { status: run.status, stdout: run.stdout?.toString('utf8') ?? '', stderr: run.stderr?.toString('utf8') ?? '' };
};
const compare = (left, right, location = 'result') => {
  if (typeof left === 'number' && typeof right === 'number') {
    const tolerance = 2e-11 * Math.max(1, Math.abs(left), Math.abs(right));
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
const base = (overrides = {}) => ({ schemaVersion: 'tpl.bond.input.v1', settlementDate: '2026-07-31', maturityDate: '2036-07-31', dayCount: 'ACT/ACT ICMA', couponRate: 0.05, couponFrequency: 2, quoteMode: 'yield', yieldToMaturity: 0.05, cleanPrice: null, currency: 'EUR', notional: 1_000_000, position: 'long', shockBp: 25, ...overrides });
const cases = [
  ['par-on-coupon-date', base()],
  ['between-coupons-act-act', base({ settlementDate: '2026-10-17', maturityDate: '2033-01-31', couponRate: 0.0375, yieldToMaturity: 0.042 })],
  ['clean-price-to-yield', base({ settlementDate: '2026-09-15', quoteMode: 'clean_price', yieldToMaturity: null, cleanPrice: 98.25, shockBp: -75 })],
  ['zero-coupon-six-month', base({ settlementDate: '2026-01-31', maturityDate: '2026-07-31', couponRate: 0, couponFrequency: 1, yieldToMaturity: 0.04 })],
  ['negative-yield', base({ maturityDate: '2031-07-31', couponRate: 0.01, yieldToMaturity: -0.0075, shockBp: -50 })],
  ['thirty-e-360-quarterly-short', base({ settlementDate: '2026-08-30', maturityDate: '2041-02-28', dayCount: '30E/360', couponRate: 0.0675, couponFrequency: 4, yieldToMaturity: 0.0725, currency: 'USD', notional: 2_500_000, position: 'short', shockBp: 100 })],
  ['thirty-e-360-feb-aug-eom', base({ settlementDate: '2029-08-29', maturityDate: '2033-08-31', dayCount: '30E/360', couponRate: 0.05, couponFrequency: 2, yieldToMaturity: 0.05 })],
  ['monthly-eom', base({ settlementDate: '2026-07-19', maturityDate: '2028-02-29', couponFrequency: 12, couponRate: 0.024, yieldToMaturity: 0.031 })],
];

try {
  const contract = runPython(['--contract']);
  assert.equal(contract.status, 0, contract.stderr); assert.deepEqual(JSON.parse(contract.stdout), BOND_CONTRACT);
  console.log('[STEP 1] canonical contract · [STATUS] ok · [OUTPUT] schemas, domains, conventions, limitations and CSV headers equal both runtimes');
  let index = 0;
  for (const [name, input] of cases) {
    index += 1; const inputPath = path.join(temp, `${name}.json`); await writeFile(inputPath, JSON.stringify(input), 'utf8');
    const js = await analyzeBond(input); const pyRun = runPython(['--input', inputPath]); assert.equal(pyRun.status, 0, pyRun.stderr);
    const py = JSON.parse(pyRun.stdout); compare(js, py, name); assert.equal(js.analysisId, py.analysisId);
    const pyCashflows = runPython(['--input', inputPath, '--cashflows-csv']); assert.equal(pyCashflows.status, 0, pyCashflows.stderr);
    const pyScenarios = runPython(['--input', inputPath, '--scenarios-csv']); assert.equal(pyScenarios.status, 0, pyScenarios.stderr);
    assert.equal(buildBondCashflowsCsv(js), pyCashflows.stdout, `${name}: cashflows CSV`);
    assert.equal(buildBondScenariosCsv(js), pyScenarios.stdout, `${name}: scenarios CSV`);
    assert.ok(Math.abs(js.quote.dirtyPricePer100 - js.quote.cleanPricePer100 - js.quote.accruedInterestPer100) <= 2e-12);
    console.log(`[STEP ${index + 1}] ${name} · [STATUS] ok · [OUTPUT] recursive parity <=2e-11; SHA and two CSV exports byte-identical`);
  }
  const par = await analyzeBond(cases[0][1]); assert.ok(Math.abs(par.quote.cleanPricePer100 - 100) < 1e-11); assert.equal(par.quote.accruedInterestPer100, 0);
  console.log(`[STEP ${cases.length + 2}] golden identities · [STATUS] ok · [OUTPUT] par clean=dirty=100, accrued=0; every case dirty=clean+accrued`);
  const invalids = [base({ couponFrequency: 0 }), base({ maturityDate: '2026-07-31' }), base({ yieldToMaturity: -0.95 }), { ...base(), surprise: true }, base({ quoteMode: 'clean_price', cleanPrice: 99, yieldToMaturity: 0.04 })];
  for (let invalidIndex = 0; invalidIndex < invalids.length; invalidIndex += 1) {
    const inputPath = path.join(temp, `invalid-${invalidIndex}.json`); await writeFile(inputPath, JSON.stringify(invalids[invalidIndex]), 'utf8');
    const pyRun = runPython(['--input', inputPath]); assert.notEqual(pyRun.status, 0);
    await assert.rejects(() => analyzeBond(invalids[invalidIndex]));
  }
  console.log(`[STEP ${cases.length + 3}] fail-closed parity · [STATUS] ok · [OUTPUT] invalid frequency/date/bump/schema/quote payloads rejected in both runtimes`);
  console.log('[VERDICT] PASS · F-CAL-8 schedules, clean/dirty pricing, YTM, risk, scenarios, hashes and exports are cross-engine reproducible');
} finally {
  await rm(temp, { recursive: true, force: true });
}
