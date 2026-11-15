import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {signedTestContext} from './lib/signed_test_browser.mjs';

// One fresh public QA cohort and one headless context at a time. No corpus,
// private course, provider, desktop control or user store is involved.
const backend=path.resolve('../../Tools/pricinglibrary_rag_backend');
const folder=path.join(backend,'.learner-fixtures',`frontend-continuity-${Date.now()}`);
const credentialPath=path.join(folder,'session-credentials.private.json');
const output=path.resolve('../../reports/product-hardening-2026-11-14/frontend/cycle2');
const base=process.env.TPL_LOCAL_TEST_URL||'http://127.0.0.1:5173';
const axe=await readFile(createRequire(import.meta.url).resolve('axe-core/axe.min.js'),'utf8');
const checks=[],scans=[],transports=[];let browser,context;
const server=spawn(process.env.TPL_PYTHON||'python',['scripts/serve_learner_fixture.py','--port','0','--data-dir',folder],{cwd:backend,windowsHide:true,stdio:['ignore','pipe','pipe']});
let started=false,startup='';server.stdout.on('data',chunk=>{startup=(startup+String(chunk)).slice(-5000);if(startup.includes('"fixture": true'))started=true;});server.stderr.on('data',()=>{});
const ready=new Promise((resolve,reject)=>{server.once('error',()=>reject(new Error('The isolated QA API could not be started.')));const timer=setInterval(()=>{if(started){clearInterval(timer);clearTimeout(deadline);resolve();}},100);const deadline=setTimeout(()=>{clearInterval(timer);reject(new Error('The isolated QA API did not become ready.'));},60000);});
const check=(label,value=true)=>{assert.ok(value,label);checks.push(label);console.log(`PASS ${label}`);};
const scan=async(page,label)=>{await page.evaluate(axe);let timeout;const violations=await Promise.race([page.evaluate(async()=>{const result=await window.axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('The accessibility scan timed out.')),45000);})]).finally(()=>clearTimeout(timeout));scans.push({label,violations});assert.equal(violations.length,0,label);};
const close=async()=>{if(context){await context.unrouteAll({behavior:'ignoreErrors'});await context.close();context=null;}};
try{
 await ready;const credentials=JSON.parse(await readFile(credentialPath,'utf8'));
 let healthy=false;for(let index=0;index<100&&!healthy;index++){try{healthy=(await fetch(credentials.base_url+'/health',{headers:{Authorization:`Bearer ${credentials.identities.pro.access_token}`}})).ok;}catch{}if(!healthy)await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(healthy,'The fresh local QA API must be listening before testing');
 const api=async(route,{actor='pro',body}={})=>{const response=await fetch(credentials.base_url+route,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${credentials.identities[actor].access_token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};};
 const generated=await api('/agent/exercise',{body:{topic:'European call pricing',product:'European call option',concept:'Black Scholes pricing',difficulty:'intermediate',exercise_format:'quantitative_problem',number_of_questions:3,require_calculations:true,language:'en',client_request_id:crypto.randomUUID()}});assert.equal(generated.status,200);const exerciseId=generated.data.metadata.library_id;
 const task=(await api(`/learning/exercises/${exerciseId}/task`)).data;
 const save=async marker=>(await api(`/learning/exercises/${exerciseId}/attempts`,{body:{client_request_id:crypto.randomUUID(),answers:Object.fromEntries(task.questions.map(q=>[q.number,`${marker}: original private answer ${q.number}. I retain the ticket, units and independent control.`])),reasoning:`${marker}: private reasoning, never a dashboard payload.`}})).data;
 const first=await save('OLDER'),second=await save('NEWER');assert.notEqual(first.id,second.id);
 await api(`/learning/exercise-attempts/${first.id}/review`,{body:{client_request_id:crypto.randomUUID(),criteria:Object.fromEntries(task.questions.map(q=>[q.number,true])),notes:'The older attempt was reviewed most recently.'}});
 const progress=(await api(`/platform/progress/${credentials.identities.pro.id}`)).data;
 check('A real private exercise and later review project read-only activity with no legacy events',progress.events===0&&progress.learning.exercise_attempt_count===2&&progress.learning.exercise_review_count===1&&progress.learning.exercise_resume.attempt_id===first.id&&!JSON.stringify(progress.learning).includes('private reasoning'));
 browser=await chromium.launch({headless:true,args:['--disable-gpu']});
 const actor=await signedTestContext(browser,{credentialPath,uiBase:base});context=actor.context;transports.push(actor.evidence);const page=await context.newPage();page.setDefaultTimeout(30000);
 await page.goto(base+'/dashboard');await page.getByRole('heading',{name:'Your saved practice',exact:true}).waitFor();
 check('Submitted written work removes the false empty dashboard and links the exact older reviewed attempt',!await page.getByText('No submitted learning activity yet.',{exact:false}).count()&&await page.getByRole('link',{name:'Resume written attempt',exact:false}).getAttribute('href')===progress.learning.exercise_resume.path);
 await page.getByRole('link',{name:'Resume written attempt',exact:false}).click();await page.locator(`[data-exercise-attempt="${first.id}"]`).waitFor();
 check('The resume query loads the owner-bound attempt rather than the newest submission',await page.getByLabel('Written self-review notes',{exact:true}).inputValue()==='The older attempt was reviewed most recently.'&&/OLDER: original private answer/.test(await page.locator('.written-attempt').innerText()));
 await page.reload();await page.locator(`[data-exercise-attempt="${first.id}"]`).waitFor();check('Reload preserves the exact attempt query and does not create a new submission',(await api(`/platform/progress/${credentials.identities.pro.id}`)).data.learning.exercise_attempt_count===2);
 await page.goto(base+'/dashboard');await page.locator('.learning-activity').waitFor();await scan(page,'Written-only dashboard1440');await page.setViewportSize({width:390,height:844});await scan(page,'Written-only dashboard390');check('Dashboard practice records fit a390px viewport',await page.evaluate(()=>document.documentElement.scrollWidth===390));
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/agent-room');const request=async query=>{await page.getByLabel('Votre question au desk',{exact:true}).fill(query);await page.getByRole('button',{name:'Envoyer la requête au desk',exact:true}).click();};
 const valid='BTC put quantity 3 S=20000 K=21000 r=3% sigma=70% T=0.25 years';await request(valid);await page.locator('[data-desk-contract]').waitFor();
 const unsupported='Price a worst-of barrier autocall on Euro Stoxx 50 and Nikkei 225, 3 years';await request(unsupported);await page.getByRole('alert').filter({hasText:'The request could not be priced.'}).first().waitFor();
 check('Worst-of rejection retains its422 contract explanation, editable form and3-year interpretation',actor.evidence.api.some(r=>r.path==='/agent/desk/run'&&r.status===422)&&await page.getByLabel('Votre question au desk',{exact:true}).inputValue()===unsupported&&/3 Years/.test(await page.locator('main').innerText())&&!/Backend requis/.test(await page.locator('main').innerText()));
 check('A rejected RFQ displays neither a previous contract nor local alternative prices',await page.locator('[data-desk-contract]').count()===0&&await page.getByText('Long Put',{exact:true}).count()===0);await scan(page,'Unsupported RFQ recovery');
 const requests=actor.evidence.api.filter(r=>r.path==='/agent/desk/run').length;await request('Price a BTC call over 40 years');await page.getByRole('alert').filter({hasText:'supports a positive horizon up to 30 years'}).first().waitFor();
 check('An explicit40-year horizon is refused without clamping or replacing it with a five-month quote',actor.evidence.api.filter(r=>r.path==='/agent/desk/run').length===requests&&await page.locator('[data-desk-contract]').count()===0);
 await request(valid);await page.locator('[data-desk-contract]').waitFor();check('A corrected valid RFQ recovers in the same form without a page reload',await page.getByLabel('Votre question au desk',{exact:true}).inputValue()===valid&&/European Put/.test(await page.locator('[data-desk-contract]').innerText()));await close();
 const startedRun=(await api('/learning/survival/runs',{actor:'student',body:{client_request_id:crypto.randomUUID(),wave:'core'}})).data;
 const student=await signedTestContext(browser,{credentialPath,actor:'student',uiBase:base,width:390});context=student.context;transports.push(student.evidence);const game=await context.newPage();await game.goto(base+'/dashboard');await game.getByRole('link',{name:'Resume saved Survival run',exact:false}).waitFor();
 check('An opened zero-answer run is resumable but is not presented as submitted activity',await game.getByText('No answers submitted yet.',{exact:false}).count()===1&&(await api(`/platform/progress/${credentials.identities.student.id}`,{actor:'student'})).data.learning.survival_answer_count===0);
 await api(`/learning/survival/runs/${startedRun.id}/answers`,{actor:'student',body:{client_request_id:crypto.randomUUID(),question_id:startedRun.question.id,answer:'A'}});await game.reload();await game.getByRole('heading',{name:'Your saved practice',exact:true}).waitFor();
 const survivalProgress=(await api(`/platform/progress/${credentials.identities.student.id}`,{actor:'student'})).data;
 check('A submitted Survival answer removes the false empty state without a course completion',survivalProgress.events===0&&survivalProgress.learning.survival_answer_count===1&&await game.getByText('No submitted learning activity yet.',{exact:false}).count()===0&&await game.getByText('No answers submitted yet.',{exact:false}).count()===0);
 assert.equal(await game.getByRole('link',{name:'Resume saved Survival run',exact:false}).getAttribute('href'),survivalProgress.learning.survival_resume.path);await scan(game,'Survival-only dashboard390');await game.getByRole('link',{name:'Resume saved Survival run',exact:false}).click();await game.getByRole('button',{name:'Next',exact:true}).waitFor();check('Dashboard resumes the same private run and its saved feedback',await game.locator('[data-survival-run]').getAttribute('data-survival-run')===startedRun.id);await close();
 check('All regression contexts completed with no uncaught page error',transports.every(value=>value.errors.length===0));
 console.log(`[VERDICT] PASS ${checks.length} continuity/recovery checks; one headless context at a time; no licensed course fixture.`);
}finally{
 await mkdir(output,{recursive:true});await writeFile(path.join(output,'continuity-recovery-evidence.json'),JSON.stringify({at:new Date().toISOString(),checks,scans,transports,scope:'Fresh public isolated API; real writes; one context at a time; CLI only; no private course/corpus/provider.'},null,2));await close();if(browser)await browser.close();server.kill();
}
