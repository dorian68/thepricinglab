import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { COURSE_MANIFEST } from '../src/claude/courseManifest.js';

// Evaluate only the repository-owned literal preset block and pure link builder.
// No application bootstrap, browser credentials or external service is involved.
const engine = await readFile(new URL('../src/claude/practiceEngine.js',import.meta.url),'utf8');
const presetBlock = engine.match(/export const GENERATOR_PRESETS = (\[[\s\S]*?\n\]);/);
assert.ok(presetBlock,'Active generator preset literal exists');
const presets = vm.runInNewContext(`(${presetBlock[1]})`,{}, {timeout:1000});
assert.equal(presets.length,5);
const frontend = await readFile(new URL('../src/claude/ClaudeFrontend.jsx',import.meta.url),'utf8');
const builder = frontend.match(/function courseGeneratorLink\(c\) \{[\s\S]*?\n\}/);
assert.ok(builder,'Pure course generator link builder exists');
const courseGeneratorLink = vm.runInNewContext(`(${builder[0]})`,{GENERATOR_PRESETS:presets,URLSearchParams},{timeout:1000});
const frenchInstruction = /\b(?:notionnel|barriere|portefeuille|volatilite|confiance|jour|calculer|construire|couverture|actuel|evaluer|sans|passe)\b/i;
for (const preset of presets) assert.ok(!frenchInstruction.test(preset.free_prompt),`${preset.id}: English starter ticket`);
for (const course of COURSE_MANIFEST) {
  const route = new URL(courseGeneratorLink(course),'http://local.test');
  assert.equal(route.pathname,'/exercises');
  assert.equal(route.searchParams.get('course'),course.id);
  assert.equal(route.searchParams.get('language'),'en');
  assert.equal(route.searchParams.get('topic'),course.title);
  assert.ok(!frenchInstruction.test(route.searchParams.get('free_prompt')),`${course.id}: English seeded context`);
}
const rates = new URL(courseGeneratorLink(COURSE_MANIFEST.find(course=>course.id==='rates-swaps')),'http://local.test');
assert.equal(rates.searchParams.get('product'),'EUR interest rate swap');
assert.ok(rates.searchParams.get('free_prompt').includes('notional 100m'));
assert.ok(rates.searchParams.get('free_prompt').includes('annuity 4.55'));

const python = String.raw`
import json,sys
from pricinglibrary_rag.calculators import PracticeCalculator
families=['options_book_greeks','rates_swap_dv01','fx_barrier_option','cds_cs01','parametric_var']
packs=[PracticeCalculator().build_pack(p['free_prompt'],family_hint=family).model_dump() for p,family in zip(json.load(sys.stdin),families)]
assert all(p['steps'] for p in packs)
assert [p['family'] for p in packs] == families
assert packs[0]['steps'][-1]['result'] == '-315,000 EUR'
assert packs[1]['steps'][1]['result'] == '-910,000 EUR'
assert packs[1]['steps'][0]['result'] == '45,500 EUR/bp'
assert packs[2]['steps'][-1]['result'] == '1,000,000 USD'
assert len(packs[2]['steps']) == 3
assert packs[3]['steps'][0]['result'] == '21,000 EUR/bp'
assert packs[3]['steps'][-1]['result'] == '525,000 EUR'
assert packs[4]['steps'][0]['result'] == '657,941'
assert 'DEPASSEMENT' in packs[4]['steps'][-1]['result']
print(json.dumps({'families':[p['family'] for p in packs],'verified_cases':len(packs)}))
`;
const checked = spawnSync(process.env.TPL_LOCAL_PYTHON || 'python',['-c',python],{
  cwd:new URL('../../../Tools/pricinglibrary_rag_backend/',import.meta.url),
  input:JSON.stringify(presets),encoding:'utf8',windowsHide:true,
});
assert.equal(checked.status,0,checked.stderr);
console.log(JSON.stringify({verdict:'PASS',english_presets:presets.length,english_course_links:COURSE_MANIFEST.length,
  numeric_contracts:JSON.parse(checked.stdout)}));
