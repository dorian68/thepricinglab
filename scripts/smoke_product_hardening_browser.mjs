import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { signedTestContext } from './lib/signed_test_browser.mjs';

const require=createRequire(import.meta.url);
const axe=await readFile(require.resolve('axe-core/axe.min.js'),'utf8');
const base=process.env.TPL_LOCAL_TEST_URL||'http://127.0.0.1:5173';
const credentialPath=process.env.TPL_USER_TEST_CREDENTIALS||path.resolve('../../reports/whole-product-cli-audit-2026-11-14/technical/cohort/frontend-hardening/session-credentials.private.json');
const output=path.resolve(process.env.TPL_HARDENING_EVIDENCE||'../../reports/product-hardening-2026-11-14/frontend');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-gpu']});
const checks=[], accessibility=[], contexts=[];
const check=(name,condition=true)=>{assert.ok(condition,name);checks.push(name);console.log(`PASS ${name}`);};
const open=async(page,route)=>{await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.locator('main').waitFor();};
let currentPage;
try{
 const actor=await signedTestContext(browser,{credentialPath,uiBase:base});contexts.push(actor);const page=await actor.context.newPage();currentPage=page;page.setDefaultTimeout(20000);
 await open(page,'/dashboard');
 await page.getByRole('heading',{name:/^(Start your preparation path|Your saved interview work)$/}).waitFor();
 check('Cold dashboard sends a Bearer on its first request and loads without a retry',actor.evidence.api.filter(x=>x.path.startsWith('/platform/progress/')).length>0&&actor.evidence.api.filter(x=>x.path.startsWith('/platform/progress/')).every(x=>x.hadBearer&&x.status===200));
 await open(page,'/interview/call-quote');
 await page.locator('.il-answer-form,.il-feedback').first().waitFor();
 if(await page.locator('.il-feedback').count())await page.locator('.il-retry').click();
 await page.locator('.il-answer-form').waitFor();
 const fields=page.locator('.il-question input');await fields.nth(0).fill('10.4506');await fields.nth(1).fill('0.636831');
 await page.getByLabel('Your reasoning',{exact:true}).fill('I used European Black-Scholes with continuous rates. A long call has positive delta; a short stock hedge offsets its first-order exposure. Constant volatility is a limitation.');
 await page.getByRole('button',{name:/Submit.*(answer|retry)/}).click();
 await page.locator('[data-interview-feedback]').waitFor();
 await page.waitForFunction(()=>document.title.includes('Give your first European call quote'));
 check('The real saved case replaces its transient failure title with its actual task title');
 await open(page,'/dashboard');
 await page.getByRole('heading',{name:'Your saved interview work',exact:true}).waitFor();
 check('A saved Interview attempt appears in dashboard while legacy course activity remains separate',!/No activity recorded yet/.test(await page.locator('main').innerText())&&await page.getByRole('link',{name:'Resume saved case',exact:false}).count()===1);
 await page.getByRole('link',{name:'Resume saved case',exact:false}).click();await page.locator('[data-interview-feedback]').waitFor();
 check('Dashboard resumes the same saved feedback phase');
 await page.getByRole('button',{name:'Account: Audit',exact:true}).click();
 check('The account-name button opens account actions without signing the learner out',await page.getByRole('group',{name:'Account actions'}).count()===1);
 await page.getByRole('link',{name:'Account & access',exact:false}).first().click();
 await page.getByRole('heading',{name:'Account & access',exact:true}).waitFor();
 check('Account page exposes access, password, privacy and explicit Sign out',await page.getByRole('link',{name:'Change your password',exact:false}).count()===1&&await page.getByRole('button',{name:'Sign out',exact:true}).count()===1);
 await page.route('**/billing/entitlement',route=>route.fulfill({status:503,json:{detail:'Explicit recovery test'}}));
 await page.getByRole('button',{name:'Refresh access',exact:true}).click();await page.getByRole('status').filter({hasText:'Access could not be refreshed'}).waitFor();
 check('Account access refresh reports a service failure instead of confirming a successful check');
 await page.unroute('**/billing/entitlement');await page.getByRole('button',{name:'Refresh access',exact:true}).click();await page.getByRole('status').filter({hasText:'Access check finished'}).waitFor();
 check('The same account recovers its real access after a retry',await page.locator('.account-details').innerText().then(text=>text.includes('Professional')));

 for(const route of ['/','/dashboard','/account','/tools/payoff','/tools/calib','/lab/backtest','/courses/credit-derivatives','/api']){
  await open(page,route);
  if(route==='/dashboard')await page.locator('.interview-activity').waitFor();
  if(route==='/tools/payoff')await page.locator('[data-payoff-leg-table] tbody tr').first().waitFor();
  if(route==='/tools/calib')await page.getByRole('combobox',{name:'Model',exact:true}).waitFor();
  if(route==='/lab/backtest')await page.getByLabel('Backtest starting capital (USD)',{exact:true}).waitFor();
  if(route==='/courses/credit-derivatives')await page.locator('[data-cds-scenario]').first().waitFor();
  await page.waitForTimeout(300);await page.evaluate(axe);
  const findings=await page.evaluate(async()=>{const r=await window.axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,html:n.html,failureSummary:n.failureSummary}))}));});
  accessibility.push({route,width:1440,findings});
  assert.equal(findings.length,0,`${route}: ${findings.map(x=>x.id).join(', ')}`);
 }
 check('Eight key desktop surfaces have no automatically detected A/AA violation in the inspected states');
 await page.setViewportSize({width:390,height:844});
 for(const route of ['/tools/payoff','/tools/calib','/account']){
  await open(page,route);await page.waitForTimeout(650);await page.evaluate(axe);
  const findings=await page.evaluate(async()=>{const r=await window.axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,failureSummary:n.failureSummary}))}));});
  accessibility.push({route,width:390,findings});assert.equal(findings.length,0,`${route} mobile: ${findings.map(x=>x.id).join(', ')}`);
 }
 check('Payoff, calibration and account names/contrasts remain valid in the inspected 390px states');
 await open(page,'/tools/iv-calc');await page.getByRole('link',{name:'Exercise ↗',exact:true}).waitFor();
 await page.getByRole('link',{name:'Exercise ↗',exact:true}).click();
 await page.getByRole('heading',{name:'Compare Historical Volatility Estimators',exact:true}).waitFor();
 check('Realized-volatility practice opens the same historical-estimator concept, not implied-vol inversion');
 await open(page,'/challenge');await page.getByRole('link',{name:'Open notebook',exact:false}).click();
 await page.getByRole('heading',{name:'Down-and-out call: closed form and Monte Carlo',exact:true}).waitFor();
 check('Barrier challenge deep-links the actual barrier ticket and source',/lab=barrier-down-out/.test(page.url())&&/"barrier": 85/.test(await page.getByLabel('Python source',{exact:true}).inputValue()));
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Download .ipynb',exact:true}).click();const notebook=JSON.parse(await readFile(await(await downloaded).path(),'utf8'));
 assert.equal(notebook.metadata.tpl.notebookId,'barrier-down-out');assert.equal(notebook.nbformat,4);
 const python=spawnSync(process.env.TPL_PYTHON||'python',['-'],{input:notebook.cells.find(x=>x.cell_type==='code').source.join(''),encoding:'utf8',timeout:15000});assert.equal(python.status,0,python.stderr);const actual=JSON.parse(python.stdout);assert.ok(actual.ci95[0]<actual.closed_form_price&&actual.ci95[1]>actual.closed_form_price);
 check('Downloaded notebook contains executable real Python, the same ticket and an actual antithetic MC confidence interval');
 const source=page.getByLabel('Python source',{exact:true});const draft=(await source.inputValue())+'\n# Local draft retained across reload\n';await source.fill(draft);await page.reload();await source.waitFor();await page.waitForFunction(()=>document.querySelector('#notebook-python-code')?.value.includes('Local draft retained'));
 check('Notebook draft persists on this device under the signed account');
 const blockedBefore=actor.evidence.blocked.length;await page.getByRole('button',{name:'Run Python',exact:true}).click();await page.getByRole('alert').filter({hasText:'browser run did not complete'}).waitFor({timeout:65000});
 const blockedFirst=actor.evidence.blocked.length;assert.ok(blockedFirst>blockedBefore);await page.getByRole('button',{name:'Run Python',exact:true}).click();await page.getByRole('alert').filter({hasText:'browser run did not complete'}).waitFor({timeout:65000});
 check('A blocked CDN produces an honest retryable failure and a local Python fallback without losing the draft',actor.evidence.blocked.length>blockedFirst&&await source.inputValue()===draft);

 const free=await signedTestContext(browser,{credentialPath,actor:'free',uiBase:base,width:390});contexts.push(free);const freePage=await free.context.newPage();await open(freePage,'/exercises');await freePage.getByRole('link',{name:'Try available interview practice',exact:true}).waitFor();
 check('A closed paid gate offers a working practice path without weakening access rules',/not on sale yet/.test(await freePage.locator('main').innerText()));await freePage.getByRole('link',{name:'Try available interview practice',exact:true}).click();await freePage.locator('.il-path-row').first().waitFor();
 check('The alternative practice link opens the signed free English pilot');
 check('No JavaScript page error occurred',contexts.every(x=>x.evidence.errors.length===0));
 console.log(`[VERDICT] PASS ${checks.length} CLI-launched headless checks; accessibility scan is partial, external identity and purchase not certified.`);
}catch(error){
 if(currentPage)await currentPage.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
 throw error;
}finally{
 await writeFile(path.join(output,'browser-evidence.json'),JSON.stringify({at:new Date().toISOString(),scope:'CLI-only headless browser, signed fixture identity, real isolated application API; no desktop control or external payment',checks,accessibility,actors:contexts.map(x=>x.evidence)},null,2));
 for(const actor of contexts)await actor.context.close();await browser.close();
}
