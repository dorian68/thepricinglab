import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.resolve(frontend, '../..');
const backend = path.join(workspace, 'Tools/pricinglibrary_rag_backend');
const snapshot = path.join(frontend, 'fixtures');
const restored = path.join(workspace, 'fixtures');
const args = new Set(process.argv.slice(2));
for (const arg of args) assert.ok(['--prepare-fixtures', '--check-build', '--check'].includes(arg), `Unknown option ${arg}`);
assert.equal(path.basename(frontend), 'thepricinglab', 'Use the documented WEBSITE/thepricinglab checkout path.');
assert.equal(path.basename(path.dirname(frontend)), 'WEBSITE', 'Use the documented two-repository workspace; fixtures are restored only inside that workspace.');

const expected = [
  'binomial_contract.json', 'black_scholes_contract.json', 'bond_contract.json',
  'monte_carlo_contract.json', 'payoff_strategy_contract.json', 'payoff_strategy_golden.json',
  'realized_volatility_contract.json', 'realized_volatility_golden.json',
  'teaching_scenarios_reference.json', 'vol_surface_contract.json', 'yield_curve_golden.json',
];
const sha = data=>createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(await readFile(path.join(snapshot,'manifest.json'),'utf8'));
assert.equal(manifest.schemaVersion,'tpl.public-fixtures.v1');
assert.equal(manifest.algorithm,'sha256');
assert.deepEqual(manifest.files.map(file=>file.name).sort(),expected.toSorted());
assert.deepEqual((await readdir(snapshot)).filter(name=>name.endsWith('.json') && name!=='manifest.json').sort(),expected.toSorted());
if (args.has('--prepare-fixtures')) await mkdir(restored,{recursive:true});
for (const entry of manifest.files) {
  assert.match(entry.name,/^[a-z0-9_]+\.json$/);
  const source = path.join(snapshot,entry.name);
  const content = await readFile(source);
  assert.equal(content.length,entry.bytes,`${entry.name}: snapshot byte count`);
  assert.equal(sha(content),entry.sha256,`${entry.name}: snapshot SHA-256`);
  assert.equal(typeof JSON.parse(content),'object',`${entry.name}: numerical JSON contract`);
  const destination = path.join(restored,entry.name);
  if (args.has('--prepare-fixtures')) {
    try { await copyFile(source,destination,constants.COPYFILE_EXCL); }
    catch (error) { if (error.code!=='EEXIST') throw error; }
  }
  let actual;
  try { actual = await readFile(destination); }
  catch (error) {
    if (error.code==='ENOENT') throw new Error(`Missing workspace fixture ${entry.name}. Run node scripts/smoke_public_checkout.mjs --prepare-fixtures after cloning both repositories.`);
    throw error;
  }
  assert.equal(sha(actual),entry.sha256,`${entry.name}: workspace fixture differs; restore explicitly or update the reviewed snapshot, never overwrite it silently.`);
}
for (const relative of [
  'pricinglibrary_rag/api.py', 'pricinglibrary_rag/interview_lab.py',
  'pricinglibrary_rag/security.py', 'pricinglibrary_rag/black_scholes.py',
  'pricinglibrary_rag/payoff_strategy.py', 'tests/test_interview_lab.py',
  'scripts/audit_secrets.py',
]) {
  try { await access(path.join(backend,relative)); }
  catch { throw new Error(`Missing matching backend source ${relative}. Follow docs/WORKSPACE_CHECKOUT.md and select the matching backend ref.`); }
}
console.log(`PASS public workspace layout and ${manifest.files.length} SHA-256-verified numerical fixtures`);

async function files(root) {
  const entries = await readdir(root,{withFileTypes:true});
  return (await Promise.all(entries.map(entry=>entry.isDirectory()?files(path.join(root,entry.name)):path.join(root,entry.name)))).flat();
}
if (args.has('--check-build')) {
  const build = path.join(frontend,'dist');
  const built = await files(build);
  assert.deepEqual((await readdir(path.join(build,'course-scripts'))).sort(),['vanilla-options-quote.md'],'Only the bounded public preview may be shipped as a course asset.');
  const preview = await readFile(path.join(build,'course-scripts/vanilla-options-quote.md'),'utf8');
  assert.match(preview,/access: free-preview/);
  assert.ok(preview.length<8000,'The public preview must remain bounded.');
  const forbidden = [
    '__TPL_LOCAL_PREVIEW', '/__dev/', 'admin@local.tpl.test', 'tpl-preview-toolbar',
    'localPreview.role', 'Le desk vous donne un set d\'instruments cotes',
    'La recursion construit la courbe pas a pas', 'Bootstrapping without hand waving',
    'Bad quotes and no-arbitrage checks', 'Asian and lookback intuition',
    'Delta-Gamma-Vega-Theta',
  ];
  for (const file of built) {
    const relative = path.relative(build,file);
    assert.ok(!/(?:^|[/\\])\.env|\.sqlite3?$|\.db$|LocalPreview|local_preview_api|(?:^|[/\\])(?:lessonProse|derivations)-/i.test(relative),`Private/test artifact in build: ${relative}`);
    if (!/\.(?:js|css|html|json|map)$/.test(file)) continue;
    const contents = await readFile(file,'utf8');
    for (const marker of forbidden) assert.equal(contents.includes(marker),false,`Forbidden public-build marker in ${relative}: ${marker}`);
  }
  console.log(`PASS built public artifact: ${built.length} files checked; no paid course package or local testing mechanism`);
}
console.log('PUBLIC CHECKOUT PASS: source, deterministic fixtures and optional public-build boundary only. Private-course delivery, source rights, real payments and public deployment are separate acceptance gates.');
