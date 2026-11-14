import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { buildOfflineReference } from '../src/claude/exerciseFallback.mjs';
import { readExerciseCache, writeExerciseCache, clearExerciseMemory } from '../src/claude/exerciseCache.mjs';

const base = process.env.TPL_LOCAL_TEST_URL || 'http://127.0.0.1:5173';
const output = process.env.TPL_EXERCISE_EVIDENCE_DIR || '../../reports/interview-lab-2026-11-14/exercise-generator/technical';
await mkdir(output, { recursive:true });
const bootstrap = await fetch(`${base}/__dev/session`).then(r=>r.json());
assert.ok(bootstrap.session?.access_token);
const headers = { Authorization:`Bearer ${bootstrap.session.access_token}`, 'Content-Type':'application/json' };
const rows = [];
const request = { topic:'European call pricing', product:'European call option', concept:'Black Scholes pricing',
  free_prompt:'European call spot125 strike110 volatility30% maturity0.75 risk-free rate3% dividend yield1%',
  difficulty:'advanced',exercise_format:'quantitative_problem',number_of_questions:5,require_calculations:true,top_k:8,language:'en',
  client_request_id:crypto.randomUUID() };
async function create(body) { const start=Date.now();const r=await fetch(`${base}/__dev/api/agent/exercise`,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});return {status:r.status,data:await r.json(),elapsedMs:Date.now()-start}; }
function check(label,condition=true) { assert.ok(condition,label);rows.push({label,status:'PASS'});console.log(`PASS ${label}`); }
const first=await create(request);
check('real RAG generation and dividend q1%',first.status===200 && first.data.sources.length>0 && first.data.metadata.calculation_pack.steps.some(s=>s.label==='Prix call'&&s.result==='21.9775'));
check('English output, five questions, five answers, rubric100',first.data.metadata.language==='en' && first.data.metadata.assessment.language==='en' && first.data.metadata.assessment.questions.length===5 && first.data.metadata.assessment.questions.reduce((n,q)=>n+q.points,0)===100 && (first.data.content.match(/^### Answer \d+/gm)||[]).length===5 && first.data.content.includes('## Verified solution') && !first.data.content.includes('## Corrige'));
const referenceLines=first.data.content.split('## References')[1]?.match(/^- \*[^\n]+$/gm)||[];
const referenceTitles=referenceLines.map(line=>line.match(/^- \*([^*]+)\*/)?.[1]?.toLowerCase());
check('reference excerpts are readable, deduplicated books or explicitly absent',referenceLines.length<=4 && new Set(referenceTitles).size===referenceLines.length && referenceLines.every(line=>!line.includes('PDFDrive')&&!/[«“]\s*\d+(?:\.\d+)*\)/.test(line)) && (referenceLines.length>0||first.data.content.includes('No readable source excerpt')));
check('honest template mode and no internal drafting prompt',first.data.metadata.generation_mode==='template'&&!first.data.content.includes('Mission produit'));
const repeat=await create(request);
check('retry returns the same saved case',repeat.status===200 && repeat.data.metadata.library_id===first.data.metadata.library_id);
const conflict=await create({...request,difficulty:'expert'});
check('changed input cannot reuse an attempt',conflict.status===409);
const languageConflict=await create({...request,language:'fr'});
check('language change cannot overwrite a saved attempt',languageConflict.status===409);
const french=await create({...request,client_request_id:crypto.randomUUID(),language:'fr',number_of_questions:3});
check('explicit French preserves the French document contract',french.status===200 && french.data.metadata.language==='fr' && french.data.content.includes('## Corrige verifie') && (french.data.content.match(/^### Réponse \d+/gm)||[]).length===3 && french.data.metadata.calculation_pack.steps.some(s=>s.label==='Prix call'&&s.result==='21.9775'));
const invalid=await create({...request,client_request_id:crypto.randomUUID(),free_prompt:request.free_prompt.replace('yield1%','yield1')});
check('bad dividend unit rejected',invalid.status===422);
const badRate=await create({...request,client_request_id:crypto.randomUUID(),free_prompt:request.free_prompt.replace('rate3%','rate3')});
check('bad rate unit rejected without zero substitution',badRate.status===422);
const count=await create({...request,client_request_id:crypto.randomUUID(),number_of_questions:0});
check('invalid question count rejected',count.status===422);
const record=await fetch(`${base}/__dev/api/platform/exercises/${first.data.metadata.library_id}`,{headers}).then(r=>r.json());
check('owner library returns the same case and requested language',record.response.content===first.data.content && record.owner_id===bootstrap.session.user.id && record.request.language==='en');
const anonymous=await fetch(`${base}/__dev/api/platform/exercises`);
check('anonymous library refused',anonymous.status===401);
const swapRequest={...request,client_request_id:crypto.randomUUID(),topic:'Swap DV01',product:'EUR interest rate swap',concept:'PV par rate DV01',free_prompt:'Payer swap EUR5Y notionnel100m fixed coupon3.20% par swap rate3.00% annuity4.55 shock10bp'};
const swap=await create(swapRequest);
check('online payer PV negative',swap.status===200&&swap.data.metadata.calculation_pack.steps.some(s=>s.label==='PV payer approx'&&s.result==='-910,000 EUR'));
const firstPage=await fetch(`${base}/__dev/api/platform/exercises?limit=1&offset=0`,{headers}).then(r=>r.json());
const nextPage=await fetch(`${base}/__dev/api/platform/exercises?limit=1&offset=1`,{headers}).then(r=>r.json());
check('account library pagination returns distinct saved cases',firstPage.exercises.length===1&&nextPage.exercises.length===1&&firstPage.has_more&&firstPage.exercises[0].id!==nextPage.exercises[0].id);
const offline=buildOfflineReference(swapRequest,'Explicit failure exercise');
check('offline payer uses computed reference inputs',offline.metadata.reference_calculation.steps[0].value < -909999.99 && offline.metadata.reference_calculation.steps[1].value===45500 && offline.metadata.reference_calculation.steps[2].value===455000);
check('English offline custom-input warning and no source/mastery claim',offline.metadata.source_grounded===false&&offline.metadata.progress_recorded===false&&offline.content.includes('Your custom parameters are not applied')&&offline.content.includes('does not record skill mastery')&&offline.content.includes('## Verified solution'));
const store=new Map([['legacy',JSON.stringify([{id:'unowned'}])]]);const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
writeExerciseCache('legacy','alice',[{id:'alice-case'}],storage);clearExerciseMemory();
check('cache scoped by subject, no legacy auto-claim',readExerciseCache('legacy','bob',storage).length===0&&readExerciseCache('legacy','alice',storage)[0].id==='alice-case');
const blocked={getItem:()=>null,setItem:()=>{throw Error('Storage unavailable')}};
check('blocked storage retains the current example in memory',writeExerciseCache('legacy','private',[{id:'memory'}],blocked)===false&&readExerciseCache('legacy','private',blocked)[0].id==='memory');
await writeFile(`${output}/real-api.json`,JSON.stringify({first,french,swap,offline,checks:rows},null,2));
console.log(JSON.stringify({verdict:'PASS',checks:rows.length,firstGenerationMs:first.elapsedMs,swapGenerationMs:swap.elapsedMs,caseId:first.data.metadata.library_id}));
