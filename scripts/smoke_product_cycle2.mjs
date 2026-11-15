import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {loadPracticeReference} from '../src/lib/practiceReferenceCatalog.mjs';
import {parseDeskRequest,safeDeskIllustrations} from '../src/lib/deskRequest.mjs';
import {blackScholesOption} from '../src/lib/blackScholes.mjs';
import {learningProgressView} from '../src/lib/learnerProgress.mjs';

const front=JSON.parse(await readFile(new URL('../src/data/practiceReferences.json',import.meta.url),'utf8'));
const server=JSON.parse(await readFile(new URL('../../../Tools/pricinglibrary_rag_backend/pricinglibrary_rag/learning_assets/practice_references.json',import.meta.url),'utf8'));
assert.deepEqual(front,server,'the browser references and server task/feedback/export must use the same authored assets');
assert.equal(front.references.length,14);
assert.equal(new Set(front.references.map(reference=>reference.id)).size,14);
function equivalent(actual,expected,label){
  if(typeof expected==='number'){
    assert.ok(Number.isFinite(actual),`${label}: finite calculated number required`);
    if(Number.isInteger(expected)&&Number.isInteger(actual))assert.equal(actual,expected,label);
    else assert.ok(Math.abs(actual-expected)<=1e-11*Math.max(1,Math.abs(expected)),`${label}: calculation differs beyond portable floating-point tolerance`);
  }else if(Array.isArray(expected)){
    assert.ok(Array.isArray(actual),label);assert.equal(actual.length,expected.length,label);
    expected.forEach((value,index)=>equivalent(actual[index],value,`${label}[${index}]`));
  }else if(expected&&typeof expected==='object'){
    assert.ok(actual&&typeof actual==='object',label);assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),`${label}: schema`);
    for(const [key,value]of Object.entries(expected))equivalent(actual[key],value,`${label}.${key}`);
  }else assert.equal(actual,expected,label);
}
for(const reference of front.references){
  const executed=spawnSync('python',['-'],{input:reference.solution,encoding:'utf8',timeout:30000,maxBuffer:2000000});
  assert.equal(executed.status,0,`${reference.id}: standalone Python must execute`);
  const result=JSON.parse(executed.stdout);
  assert.equal(result.id??result.reference_id,reference.id);
  equivalent(result.result,reference.result,`${reference.id}: displayed result must equal executed source`);
  assert.deepEqual(result.checks,reference.checks,`${reference.id}: displayed controls must equal actual controls`);
  assert.ok(Object.values(result.checks).every(value=>value===true),`${reference.id}: independent controls pass`);
  equivalent(result,JSON.parse(reference.output),`${reference.id}: displayed output must be actual executable output`);
  console.log(`PASS ${reference.id}: actual standalone Python, displayed result and controls agree`);
}
// Browser lazy loading is checked by Vite build and the headless route journey.
// The module is not invoked here: Node's JSON import contract differs from Vite.
assert.equal(typeof loadPracticeReference,'function');
assert.equal(parseDeskRequest('Price a worst-of barrier autocall on Euro Stoxx 50 and Nikkei 225, 3 years').months,36);
assert.equal(parseDeskRequest('Euro Stoxx 50 and Nikkei 225').months,5);
assert.equal(parseDeskRequest('pétrole dans 5 mois').months,5);
assert.equal(parseDeskRequest('BTC put over 3 months').months,3);
assert.ok(parseDeskRequest('Price an option over 40 years').durationError);
assert.ok(parseDeskRequest('Price an option over -2 years').durationError);
console.log('PASS RFQ horizons use complete duration words; index names cannot become years and unsupported durations are not clamped');
const build=input=>{const result=blackScholesOption({spot:input.spot,strike:100,maturityYears:input.T,riskFreeRate:.02,dividendYield:0,volatility:.2,optionType:'call'});return [{price:result.price,pay:s=>Math.max(s-100,0)}];};
assert.equal(safeDeskIllustrations(build,{spot:100,T:1}).items.length,1);
assert.deepEqual(safeDeskIllustrations(build,{spot:100,T:40}).items,[]);
assert.deepEqual(safeDeskIllustrations(build,{spot:NaN,T:1}).items,[]);
console.log('PASS strict local pricing domain errors become a recoverable empty illustration instead of escaping into React render');
const attemptId=`exa_${'a'.repeat(32)}`,runId=`srv_${'b'.repeat(32)}`;
const projection=learningProgressView({events:0,learning:{exercise_attempt_count:2,exercise_review_count:1,survival_run_count:1,survival_answer_count:4,survival_completed_count:0,exercise_resume:{exercise_id:'exo_123456abcdef',attempt_id:attemptId,path:`/exercises/exo_123456abcdef?attempt=${attemptId}`},survival_resume:{run_id:runId,wave:'core',phase:'feedback',path:`/survival/core?run=${runId}`}}});
assert.equal(projection.hasActivity,true);assert.equal(projection.exerciseAttempts,2);assert.equal(projection.survivalAnswers,4);assert.equal(projection.exerciseResume.attempt_id,attemptId);assert.equal(projection.survivalResume.run_id,runId);
assert.equal(learningProgressView({learning:{survival_run_count:1,survival_answer_count:0}}).hasActivity,false);
assert.equal(learningProgressView({learning:{exercise_resume:{exercise_id:'case',attempt_id:attemptId,path:'https://outside.example/'},survival_resume:{run_id:runId,wave:'core',phase:'answer',path:'//outside.example/'}}}).exerciseResume,null);
assert.equal(learningProgressView({learning:{survival_resume:{run_id:runId,wave:'core',phase:'answer',path:'//outside.example/'}}}).survivalResume,null);
console.log('PASS dashboard separates written submissions from timed answers, rejects external resume paths, and does not count a zero-answer run as submitted activity');
console.log('[VERDICT] PASS · 14 authored references match the shared server assets and their actual calculations');
