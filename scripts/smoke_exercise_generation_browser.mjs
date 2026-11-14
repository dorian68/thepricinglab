import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base=process.env.TPL_LOCAL_TEST_URL || 'http://127.0.0.1:5173';
const output=path.resolve('../../reports/visual-qa-2026-11-11-exercise-fixes/technical/browser');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[], remote=[], steps=[];
async function newContext() {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',acceptDownloads:true});
  await context.route(/https:\/\/(?:[^/]+\.supabase\.co|tpl-api\.optiquant-ia\.com)\//,route=>{remote.push(route.request().url());return route.abort();});
  context.on('page',page=>{page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(30000);});
  return context;
}
function check(label,condition=true){assert.ok(condition,label);steps.push({label,status:'PASS'});console.log(`PASS ${label}`);}
const context=await newContext();const page=await context.newPage();
async function form(prompt,product='European call option'){
  await page.goto(`${base}/exercises`,{waitUntil:'domcontentloaded'});
  await page.getByLabel('Exercise prompt and constraints').waitFor({timeout:60000});
  await page.getByLabel('Exercise topic',{exact:true}).fill(product==='European call option'?'European call pricing':'Swap DV01');
  await page.getByLabel('Exercise product',{exact:true}).fill(product);
  await page.getByLabel('Exercise concept',{exact:true}).fill(product==='European call option'?'Black Scholes':'PV par rate DV01');
  await page.getByLabel('Exercise difficulty').selectOption('advanced');
  await page.getByLabel('Exercise format').selectOption('quantitative_problem');
  await page.getByLabel('Number of questions').fill('5');
  await page.getByLabel('Exercise prompt and constraints').fill(prompt);
}
async function download(name,file){const promise=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();const d=await promise;await d.saveAs(path.join(output,file));return readFile(path.join(output,file),'utf8');}
const prompt='European call spot125 strike110 volatility30% maturity0.75 risk-free rate3% dividend yield1%';
try {
  await form(prompt);
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/__dev/api/agent/exercise')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Generate exercise',exact:true}).click();
  const response=await responsePromise;const data=await response.json();
  assert.equal(response.status(),200);const id=data.metadata.library_id;
  await page.waitForURL(`**/exercises/${id}`);
  await page.getByText('Enregistré dans votre bibliothèque de compte.',{exact:true}).waitFor();
  check('real UI creation with account save',data.sources.length>0&&data.metadata.generation_mode==='template');
  await page.locator('.exercise-rich-markdown').waitFor();
  check('brief hides answer and internal instructions',!(await page.locator('.exercise-rich-markdown').innerText()).includes('21.9775')&&!(await page.locator('main').innerText()).includes('Mission produit'));
  await page.getByRole('button',{name:'Correction',exact:true}).click();
  await page.locator('.exercise-rich-markdown').getByText(/21\.9775/).first().waitFor();
  check('correct dividend and five rendered answers',(await page.locator('.exercise-rich-markdown h3').allTextContents()).filter(text=>/^Réponse \d+/.test(text)).length===5);
  check('real math and Markdown rendering',await page.locator('.exercise-rich-markdown .katex').count()>=2&&!(await page.locator('.exercise-rich-markdown').innerText()).includes('**'));
  const rubric=page.locator('.exercise-rich-markdown table');
  await rubric.waitFor();
  const renderedPoints=await rubric.locator('tbody tr td:last-child').allTextContents();
  check('rubric renders as a real table with five rows and100 points',renderedPoints.length===5&&renderedPoints.reduce((sum,text)=>sum+Number(text),0)===100);
  await page.screenshot({path:path.join(output,'correction-390.png')});
  check('mobile fits, rubric header stays on one line and no OCR controls render',await page.evaluate(()=>{
    const range=document.createRange();range.selectNodeContents(document.querySelector('.exercise-rich-markdown table th'));
    return document.documentElement.scrollWidth<=innerWidth&&range.getClientRects().length===1&&!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(document.querySelector('.exercise-rich-markdown').innerText);
  }));
  const json=JSON.parse(await download('Download JSON','custom-case.json'));
  const md=await download('Download Markdown','custom-case.md');
  check('exports preserve saved content, questions and ID',json.exercise.id===id&&json.exercise.content===data.content&&md===data.content&&json.exercise.metadata.assessment.total_points===100&&!Object.hasOwn(json.exercise,'done'));
  const fresh=await newContext();const second=await fresh.newPage();
  await second.goto(`${base}/exercises/${id}`);
  await second.getByText('Enregistré dans votre bibliothèque de compte.',{exact:true}).waitFor({timeout:60000});
  check('new browser retrieves direct account link without old cache');
  await second.goto(`${base}/exercises`);
  await second.locator(`a[href="/exercises/${id}"]`).waitFor();
  check('new browser lists saved case');
  await fresh.close();
  for(const status of [401,403,422]){
    await form(prompt);
    await page.route('**/__dev/api/agent/exercise',route=>route.fulfill({status,json:{detail:'Paramètre de test invalide.'}}));
    await page.getByRole('button',{name:'Generate exercise',exact:true}).click();
    await page.locator('.exercise-generator-error').waitFor();
    check(`HTTP${status} preserves input and never opens fallback`,new URL(page.url()).pathname==='/exercises'&&await page.getByLabel('Exercise prompt and constraints').inputValue()===prompt&&await page.locator('.exercise-offline-notice').count()===0);
    await page.unroute('**/__dev/api/agent/exercise');
  }
  const swapPrompt='Payer swap EUR5Y notionnel200m fixed coupon3.20% par swap rate3.00% annuity4.55 shock10bp';
  await form(swapPrompt,'EUR interest rate swap');
  await page.route('**/__dev/api/agent/exercise',route=>route.fulfill({status:503,json:{detail:'Explicit outage test.'}}));
  await page.getByRole('button',{name:'Generate exercise',exact:true}).click();
  await page.locator('.exercise-offline-notice').waitFor();
  check('HTTP503 opens an honest fixed offline example',(await page.locator('.exercise-offline-notice').innerText()).includes('paramètres personnalisés ne sont pas appliqués'));
  await page.getByRole('button',{name:'Correction',exact:true}).click();
  await page.locator('.exercise-rich-markdown').getByText(/-910,000/).first().waitFor();
  const offline=JSON.parse(await download('Download JSON','offline-swap.json'));
  check('offline calculation has correct sign, own inputs and original request',offline.exercise.metadata.reference_calculation.steps[0].value< -909999.99&&offline.exercise.request.free_prompt===swapPrompt&&offline.exercise.sources.length===0);
  await page.screenshot({path:path.join(output,'offline-swap-390.png')});
  await page.unroute('**/__dev/api/agent/exercise');
  await page.getByRole('link',{name:'Reprendre ma demande',exact:true}).click();
  check('original custom request restored',await page.getByLabel('Exercise prompt and constraints').inputValue()===swapPrompt);
  const recoveryPromise=page.waitForResponse(r=>r.url().endsWith('/__dev/api/agent/exercise')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Generate exercise',exact:true}).click();
  const recovery=await (await recoveryPromise).json();
  await page.waitForURL(`**/exercises/${recovery.metadata.library_id}`);
  check('recovery uses actual custom notional',recovery.metadata.calculation_pack.steps.some(s=>s.label==='PV payer approx'&&s.result==='-1,820,000 EUR'));
  check('zero browser errors and external API calls',errors.length===0&&remote.length===0);
  await writeFile(path.join(output,'results.json'),JSON.stringify({verdict:'PASS',steps,errors,remote,caseId:id},null,2));
  console.log(`PASS ${steps.length} exercise browser checks`);
} catch(error) {
  await writeFile(path.join(output,'results.json'),JSON.stringify({verdict:'FAIL',steps,errors,remote,error:error.message},null,2));
  await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
  throw error;
} finally {await browser.close();}
