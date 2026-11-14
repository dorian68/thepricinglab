import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const assetsDirectory = path.resolve('dist/assets');
const files = (await readdir(assetsDirectory)).filter((file) => file.endsWith('.js'));
const sources = await Promise.all(files.map(async (file) => ({ file, source: await readFile(path.join(assetsDirectory, file), 'utf8') })));
const payoffAssets = sources.filter(({ file }) => file.startsWith('PayoffStrategyLab-'));
assert.equal(payoffAssets.length, 1, `expected one dedicated payoff chunk, received ${payoffAssets.map(({ file }) => file).join(', ') || 'none'}`);
const payoff = payoffAssets[0];
for (const marker of ['JSON evidence', 'Curve CSV', 'Scenarios CSV', 'Naked short call', 'Net terminal P&L', 'Manual entry']) {
  assert.ok(payoff.source.includes(marker), `production payoff chunk is missing '${marker}'`);
}
const all = sources.map(({ source }) => source).join('\n');
assert.ok(!all.includes('S=100, σ=20%, T=30d'), 'hard-coded legacy Greek assumptions remain in production');
assert.ok(!all.includes('Save strategy'), 'fake legacy save action remains in production');
assert.ok(!all.includes('P&L at expiry') && !all.includes('Strategy Metrics'), 'grid-bound legacy payoff implementation remains in production');
assert.ok(all.includes('validated engine v1'), 'catalogue does not expose the validated payoff status');
console.log(`[STEP 1] payoff production bundle · [STATUS] ok · [INPUT] ${files.length} JavaScript assets · [OUTPUT] component=${payoff.file} (${payoff.source.length} bytes); exact engine/exports present; grid-bound duplicate and fake save absent`);
console.log('[VERDICT] PASS · F-CAL-5 ships as one isolated production calculator');
