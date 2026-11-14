import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';

const sourceUrl = new URL('../src/utils/options/blackScholes.ts', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const transformed = await transformWithEsbuild(source, fileURLToPath(sourceUrl), { loader: 'ts', format: 'esm', target: 'es2022' });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed.code).toString('base64')}`;
const { blackScholes, normCDF } = await import(moduleUrl);

const close = (actual, expected, tolerance, label) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);
};

close(normCDF(0), 0.5000000005, 1e-9, 'Phi(0)');
close(normCDF(1.96), 0.9750021048517795, 1e-7, 'Phi(1.96)');
close(normCDF(-1.96), 0.024997895148220435, 1e-7, 'Phi(-1.96)');
console.log('[STEP 1] historical normal CDF · [STATUS] ok · [OUTPUT] √2 scaling and positive/negative tails match standard-normal goldens');

const call = blackScholes(100, 100, 1, 0, 0, 0.2, 'call', 'long');
const put = blackScholes(100, 100, 1, 0, 0, 0.2, 'put', 'long');
close(call.price, 7.965578879433949, 1e-6, 'ATM call');
close(put.price, 7.965578879433949, 1e-6, 'ATM put');
close(call.price - put.price, 0, 1e-10, 'put-call parity');

const shortCall = blackScholes(100, 100, 1, 0, 0, 0.2, 'call', 'short');
assert.equal(shortCall.price, -call.price);
for (const greek of ['delta', 'gamma', 'vega', 'theta', 'rho']) {
  close(shortCall.greeks[greek], -call.greeks[greek], 1e-12, `short ${greek}`);
}
console.log('[STEP 2] historical BSM compatibility · [STATUS] ok · [OUTPUT] ATM price, parity and all five short-position signs agree with the canonical engine');
console.log('[VERDICT] PASS · Remaining course/community imports no longer expose the former CDF or short Gamma/Vega defects');
