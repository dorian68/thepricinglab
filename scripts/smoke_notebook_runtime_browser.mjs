import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { signedTestContext } from './lib/signed_test_browser.mjs';
const uiBase=process.env.TPL_LOCAL_TEST_URL||'http://127.0.0.1:5173';
const credentialPath=process.env.TPL_USER_TEST_CREDENTIALS||path.resolve('../../reports/whole-product-cli-audit-2026-11-14/technical/cohort/frontend-hardening/session-credentials.private.json');
const output=path.resolve(process.env.TPL_HARDENING_EVIDENCE||'../../reports/product-hardening-2026-11-14/frontend');await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});const started=Date.now();
const evidence={scope:'Real Pyodide 0.26.2 execution in headless dedicated Worker; only pinned CDN GETs allowed, isolated signed application API; no desktop control',status:'RUNNING',cdnRequests:[]};
try{
 const actor=await signedTestContext(browser,{credentialPath,uiBase,allowPyodide:true});
 actor.context.on('request',request=>{const url=new URL(request.url());if(url.hostname==='cdn.jsdelivr.net')evidence.cdnRequests.push({path:url.pathname,method:request.method()});});
 const page=await actor.context.newPage();await page.goto(uiBase+'/notebooks?lab=black-scholes-intro');await page.getByLabel('Python source',{exact:true}).waitFor({timeout:30000});
 await page.getByRole('button',{name:'Run Python',exact:true}).click();
 await page.waitForFunction(()=>{const out=document.querySelector('pre[aria-label="Python output"]')?.innerText||'';return out.includes('price_per_unit')||document.querySelector('.notebook-workspace [role="alert"]');},{},{timeout:70000});
 const text=await page.locator('pre[aria-label="Python output"]').innerText();
 if(!text.includes('price_per_unit'))throw new Error(text);
 const result=JSON.parse(text);assert.ok(Math.abs(result.price_per_unit-6.120654113455842)<1e-10);assert.equal(actor.evidence.errors.length,0);
 evidence.status='PASS';evidence.result=result;evidence.pageErrors=actor.evidence.errors;evidence.api=actor.evidence.api;
 await actor.context.close();console.log('PASS real browser Worker loaded the pinned CDN and computed the actual original vanilla ticket.');
}catch(error){evidence.status='FAIL';evidence.error=error.message;throw error;}
finally{evidence.elapsedMs=Date.now()-started;await browser.close();await writeFile(path.join(output,'notebook-browser-runtime.json'),JSON.stringify(evidence,null,2));}
