import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { readFile, rm } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const reservePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.unref();
  server.once('error', reject);
  server.listen(0, host, () => {
    const address = server.address();
    server.close((error) => error ? reject(error) : resolve(address.port));
  });
});
const configuredPort = process.env.TPL_ENTITLEMENT_BROWSER_PORT;
const port = configuredPort ? Number(configuredPort) : await reservePort();
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535, 'preview port must be valid');
const baseUrl = `http://${host}:${port}`;
const apiOrigin = 'http://127.0.0.1:8000';
const supabaseOrigin = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const storageKey = 'sb-kjybaatgyigpqyywlmnw-auth-token';
const userId = '00000000-0000-4000-8000-000000000031';
const viteBin = path.resolve('node_modules/vite/bin/vite.js');
const outputDirectory = path.resolve(`.entitlement-browser-dist-${port}`);
const backendRoot = path.resolve('..', '..', 'Tools', 'pricinglibrary_rag_backend');
const privateCourseDirectory = path.join(backendRoot, 'pricinglibrary_rag', 'course_scripts');
const courseProjector = path.join(backendRoot, 'scripts', 'project_public_course.py');
const execFileAsync = promisify(execFile);
const privateCourseFiles = {
  'black-scholes': 'vanilla-options-quote.md',
  'yield-curves': 'yield-curve-bootstrapping.md',
  greeks: 'options-book-greeks-pnl.md',
  'rates-swaps': 'rates-swaps-dv01.md',
  'fixed-income-bonds': 'fixed-income-bonds-duration.md',
  'implied-vol': 'implied-volatility-smile.md',
  'credit-derivatives': 'credit-derivatives-cds.md',
  'market-risk-var': 'market-risk-var-stress.md',
  exotics: 'barrier-options-gap-risk.md',
  'monte-carlo': 'monte-carlo-pricing.md',
  stochastic: 'stochastic-calculus-for-hedging.md',
  'structured-products': 'structured-products-autocall.md',
};
assert.equal(
  new Set(Object.values(privateCourseFiles)).size,
  Object.keys(privateCourseFiles).length,
  'every commercial course route must deliver a unique script',
);
const survivalFirst=JSON.parse(await readFile(path.join(backendRoot,'pricinglibrary_rag/learning_assets/survival_questions.json'),'utf8')).questions[0];
const privateCourseMarkdown = Object.fromEntries(await Promise.all(
  Object.entries(privateCourseFiles).map(async ([courseId, filename]) => {
    const coursePath = path.join(privateCourseDirectory, filename);
    await readFile(coursePath, 'utf8');
    const {stdout: markdown} = await execFileAsync('python', [courseProjector, coursePath], {
      cwd: backendRoot,
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });
    assert.ok(markdown.length > 40_000, `${courseId} smoke fixture must be the real private course, got ${markdown.length} bytes`);
    assert.doesNotMatch(markdown, /Source Appendix \(back-office\)|\[S\d+\].*chunk.*score/i);
    return [courseId, markdown];
  }),
));
const firstModuleTitle = Object.fromEntries(Object.entries(privateCourseMarkdown).map(([courseId, markdown]) => {
  const title = markdown.match(/^### Module 1 - (.+)$/m)?.[1]?.trim();
  assert.ok(title, `real private course ${courseId} must expose a first module title`);
  return [courseId, title];
}));
const rank = { free: 0, starter: 1, student: 2, pro: 3 };
const requiredCourse = {
  'black-scholes':'starter','yield-curves':'starter',greeks:'starter','rates-swaps':'starter','fixed-income-bonds':'starter',
  'implied-vol':'student','credit-derivatives':'student','market-risk-var':'student',
  exotics:'pro','monte-carlo':'pro',stochastic:'pro','structured-products':'pro',
};
const expectedCourseTitle = {
  'black-scholes':'Black-Scholes Model','yield-curves':'Yield Curves',greeks:'Option Greeks','rates-swaps':'Rates Swaps & DV01','fixed-income-bonds':'Fixed Income Bonds',
  'implied-vol':'Implied Volatility Analysis','credit-derivatives':'Credit Derivatives & CS01','market-risk-var':'Market Risk & VaR',
  exotics:'Exotic Options','monte-carlo':'Monte Carlo Methods',stochastic:'Stochastic Calculus','structured-products':'Structured Products Desk',
};
const expectedWidget = {
  'black-scholes':'payoff','yield-curves':'price_chart',greeks:'greeks_scenario','rates-swaps':'price_chart','fixed-income-bonds':'price_chart',
  'implied-vol':'vol_smile','credit-derivatives':'greeks_scenario','market-risk-var':'greeks_scenario',
  exotics:'payoff','monte-carlo':'monte_carlo',stochastic:'price_chart','structured-products':'payoff',
};
const expectedTool = {
  'yield-curves':['/tools/curve','Open Yield Curve Builder'],greeks:['/tools/payoff','Open Payoff & Greeks Lab'],'rates-swaps':['/tools/curve','Open Yield Curve Builder'],'fixed-income-bonds':['/tools/bond','Open Bond Pricing & Risk Lab'],
  'implied-vol':['/tools/volsurface','Open Volatility Surface Lab'],'market-risk-var':['/tools/mc','Open Monte Carlo Risk Lab'],
  'monte-carlo':['/tools/mc','Open Monte Carlo Lab'],stochastic:['/tools/mc','Open Monte Carlo Lab'],
};
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const accessToken = [encode({alg:'HS256',typ:'JWT'}), encode({aud:'authenticated',exp:now+3600,iat:now,iss:`${supabaseOrigin}/auth/v1`,role:'authenticated',sub:userId,email:'entitlement.contract@example.test'}), 'fixture-signature'].join('.');
const user = {id:userId,aud:'authenticated',role:'authenticated',email:'entitlement.contract@example.test',app_metadata:{provider:'email',providers:['email']},user_metadata:{prenom:'QA',nom:'Entitlement'},identities:[],created_at:'2026-07-20T00:00:00.000Z',updated_at:'2026-07-20T00:00:00.000Z',is_anonymous:false};
const session = {access_token:accessToken,refresh_token:'fixture-refresh',expires_at:now+3600,expires_in:3600,token_type:'bearer',user};
const corsHeaders = {'Access-Control-Allow-Origin':baseUrl,'Access-Control-Allow-Headers':'authorization, apikey, content-profile, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};

if (path.dirname(outputDirectory) !== process.cwd() || !/^\.entitlement-browser-dist-\d+$/.test(path.basename(outputDirectory))) throw new Error('Refusing unsafe entitlement build directory');
const runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {...options,stdio:['ignore','pipe','pipe']});
  let output = '';
  child.stdout.on('data', (chunk)=>{ output += chunk; });
  child.stderr.on('data', (chunk)=>{ output += chunk; });
  child.on('error', reject);
  child.on('exit', (code)=>code === 0 ? resolve(output) : reject(new Error(`Command exited with ${code}: ${output.slice(-4_000)}`)));
});
const waitForPreview = async () => {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* starting */ }
    await new Promise((resolve)=>setTimeout(resolve,150));
  }
  throw new Error('entitlement browser preview did not start');
};
const waitFor = async (predicate, message, timeoutMs = 10_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve)=>setTimeout(resolve,50));
  }
  throw new Error(message);
};
const seedAuth = (page) => page.addInitScript(({key,authSession,authUser}) => {
  localStorage.setItem(key, JSON.stringify(authSession));
  localStorage.setItem(`${key}-user`, JSON.stringify({user:authUser}));
}, {key:storageKey,authSession:session,authUser:user});
const mockSupabase = (page) => page.route(`${supabaseOrigin}/**`, async (route) => {
  const request = route.request();
  if (request.method() === 'OPTIONS') return route.fulfill({status:204,headers:corsHeaders});
  if (new URL(request.url()).pathname.startsWith('/rest/v1/profiles')) return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},body:JSON.stringify({id:userId,prenom:'QA',nom:'Entitlement',role:'user'})});
  return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},body:JSON.stringify(user)});
});

let browser;
let preview;
try {
  await rm(outputDirectory, {recursive:true,force:true});
  await runCommand(process.execPath, [viteBin, 'build', '--outDir', outputDirectory], {
    cwd:process.cwd(),
    env:{...process.env,VITE_TPL_RAG_API_URL:apiOrigin,VITE_TPL_RUM_ENABLED:'false'},
  });
  preview = spawn(process.execPath, [viteBin, 'preview', '--host', host, '--port', String(port), '--strictPort', '--outDir', outputDirectory], {cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
  await waitForPreview();
  browser = await chromium.launch({headless:true});

  async function planPage(plan, {survivalFailure = false} = {}) {
    const context = await browser.newContext({viewport:{width:1280,height:900}});
    const page = await context.newPage();
    const state = {requests:[],courseBytes:{},progressSaved:false,survivalSaved:false,survivalStartIds:[],pageErrors:[]};
    page.on('pageerror', (error)=>state.pageErrors.push(error.message));
    if (plan !== 'anonymous') { await seedAuth(page); await mockSupabase(page); }
    await page.route(`${apiOrigin}/**`, async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      if (request.method() === 'OPTIONS') return route.fulfill({status:204,headers:corsHeaders});
      state.requests.push(`${request.method()} ${pathname}`);
      if (pathname === '/billing/entitlement') return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},body:JSON.stringify({active:plan!=='free'&&plan!=='anonymous',plan:plan==='anonymous'?'free':plan})});
      if (pathname === '/learner/catalog') return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},json:{courses:Object.keys(privateCourseFiles).map(id=>({id,available_languages:['fr']}))}});
      if (pathname.startsWith('/courses/') && pathname.endsWith('/script')) {
        const courseId = pathname.split('/')[2];
        const allowed = (rank[plan] ?? -1) >= rank[requiredCourse[courseId] || 'pro'];
        const markdown = privateCourseMarkdown[courseId];
        if (allowed && !markdown) return route.fulfill({status:404,headers:{...corsHeaders,'Content-Type':'application/json'},body:JSON.stringify({detail:'course smoke fixture missing'})});
        if (allowed) state.courseBytes[courseId] = Buffer.byteLength(markdown, 'utf8');
        return route.fulfill({status:allowed?200:403,headers:{...corsHeaders,'Content-Type':allowed?'text/markdown':'application/json','Content-Language':'fr'},body:allowed?markdown:JSON.stringify({detail:'insufficient plan'})});
      }
      if (pathname === `/platform/progress/${userId}`) return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},body:JSON.stringify({events:state.progressSaved?[{kind:'lesson',ref:'yield-curves#L0'}]:[]})});
      if (pathname === '/platform/progress' && request.method() === 'POST') {
        await new Promise((resolve)=>setTimeout(resolve,350));
        state.progressSaved = true;
        return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},body:JSON.stringify({ok:true,created:true,id:'prg-browser'})});
      }
      if (pathname === '/learning/survival/runs' && request.method()==='GET') return route.fulfill({status:200,headers:corsHeaders,json:{runs:[]}});
      if (pathname.startsWith('/learning/survival/runs')) {
        if(request.method()==='POST')state.survivalStartIds.push(request.postDataJSON().client_request_id);
        if(survivalFailure)return route.fulfill({status:503,headers:corsHeaders,json:{detail:'Explicit isolated persistence failure'}});
        const {correct,explanation,...question}=survivalFirst;
        return route.fulfill({status:200,headers:corsHeaders,json:{id:'srv_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',index:0,total_questions:20,answered_count:0,lives:3,score:0,streak:0,best_streak:0,completed:false,phase:'answer',question,remaining_seconds:30,feedback:null,ranked:false,proctored:false}});
      }
      if (pathname === '/strategy/instruments') return route.fulfill({status:200,headers:{...corsHeaders,'Content-Type':'application/json'},body:JSON.stringify({instruments:[{key:'EURUSD',label:'EUR/USD',capital:5000}],available:['EURUSD'],strategies:['ensemble']})});
      return route.fulfill({status:plan==='anonymous'?401:404,headers:{...corsHeaders,'Content-Type':'application/json'},body:'{}'});
    });
    return {context,page,state};
  }

  {
    const {context,page,state} = await planPage('student', {survivalFailure:true});
    await page.goto(`${baseUrl}/survival/beginner`, {waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Retry the same action',exact:true}).waitFor();
    assert.ok(await page.getByRole('alert').innerText(),'A failed start is explicitly reported, not a locally invented run');
    await page.getByRole('button',{name:'Retry the same action',exact:true}).click();
    await waitFor(()=>state.survivalStartIds.length===2,'The same start action must be retried');
    assert.equal(state.survivalStartIds[0],state.survivalStartIds[1],'Unconfirmed start retry must preserve its request identity');
    assert.equal(await page.locator('.survival-question-panel').count(),0,'No question or score may be invented after a persistence failure');
    assert.deepEqual(state.pageErrors, []);
    await context.close();
    console.log('PASS failed Survival start remains explicit and retry preserves the same request identity');
  }

  {
    const {context,page,state} = await planPage('anonymous');
    await page.goto(`${baseUrl}/courses/yield-curves`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Starter plan required',exact:true}).waitFor();
    assert.ok(!state.requests.some((item)=>item.includes('/courses/yield-curves/script')));
    await context.close();
    console.log('PASS anonymous receives no paid course request or content');
  }

  {
    const {context,page,state} = await planPage('free');
    await page.goto(`${baseUrl}/courses/implied-vol`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Student plan required',exact:true}).waitFor();
    assert.ok(!state.requests.some((item)=>item.includes('/courses/implied-vol/script')));
    await context.close();
    console.log('PASS signed Free user receives no paid course request or content');
  }

  {
    const {context,page,state} = await planPage('starter');
    await page.goto(`${baseUrl}/courses/yield-curves`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Yield Curves',exact:true,level:1}).waitFor();
    await waitFor(()=>state.requests.includes('GET /courses/yield-curves/script'), `Starter course script request was not issued: ${JSON.stringify(state.requests)}`);
    assert.ok(state.requests.includes('GET /courses/yield-curves/script'));
    await page.getByText(firstModuleTitle['yield-curves'], {exact:true}).first().waitFor();
    assert.ok(state.courseBytes['yield-curves'] > 40_000);
    const complete = page.getByRole('button', {name:'Mark module complete',exact:false});
    await complete.click();
    await page.getByRole('button', {name:'Saving…',exact:false}).waitFor();
    assert.equal(state.progressSaved, false, 'UI must not claim completion before the delayed API response');
    await page.getByRole('button', {name:'Completion saved',exact:false}).waitFor();
    assert.equal(state.progressSaved, true);
    await page.reload({waitUntil:'networkidle'});
    // Resume may advance to the next incomplete module. Reopen the first one
    // to verify its actual saved state rather than assuming the reading index.
    await page.locator('.course-lesson-item').first().click();
    await page.getByRole('button', {name:'Completion saved',exact:false}).waitFor();
    await page.getByRole('button', {name:'Calculator',exact:true}).click();
    assert.equal(await page.getByRole('link', {name:'Open Yield Curve Builder',exact:false}).getAttribute('href'), '/tools/curve');
    await page.goto(`${baseUrl}/courses/implied-vol`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Student plan required',exact:true}).waitFor();
    assert.ok(!state.requests.includes('GET /courses/implied-vol/script'));
    assert.deepEqual(state.pageErrors, []);
    await context.close();
    console.log('PASS Starter course access and server-confirmed completion persist after refresh');
  }

  {
    const {context,page,state} = await planPage('student');
    await page.goto(`${baseUrl}/courses/implied-vol`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Implied Volatility Analysis',exact:true,level:1}).waitFor();
    await waitFor(()=>state.requests.includes('GET /courses/implied-vol/script'), 'Student course script request was not issued');
    assert.ok(state.requests.includes('GET /courses/implied-vol/script'));
    await page.getByText(firstModuleTitle['implied-vol'], {exact:true}).first().waitFor();
    assert.ok(state.courseBytes['implied-vol'] > 40_000);
    await page.getByRole('button', {name:'Calculator',exact:true}).click();
    assert.equal(await page.getByRole('link', {name:'Open Volatility Surface Lab',exact:false}).getAttribute('href'), '/tools/volsurface');
    await page.goto(`${baseUrl}/courses/monte-carlo`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Professional plan required',exact:true}).waitFor();
    assert.ok(!state.requests.includes('GET /courses/monte-carlo/script'));
    await page.goto(`${baseUrl}/lab`, {waitUntil:'networkidle'});
    assert.equal((await page.locator('a.tab-btn.on').innerText()).trim().toLowerCase(), 'trading exercises');
    const deltaExercise = page.getByRole('link', {name:/Run a Daily Delta Hedge/});
    await deltaExercise.waitFor();
    assert.equal(await deltaExercise.getAttribute('href'), '/exercises/delta-hedge');
    await deltaExercise.click();
    await page.getByRole('heading', {name:'Run a Daily Delta Hedge',exact:true,level:1}).waitFor();
    await page.getByRole('button', {name:'Solution',exact:true}).click();
    await page.getByText('Reference solution', {exact:true}).waitFor();
    assert.ok(await page.getByText('Hedge sign', {exact:true}).count() === 1, 'Trading Lab exercise opens its canonical correction and grading rubric');
    await page.goto(`${baseUrl}/exercises/options-book-greeks`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Attribute P&L on an Options Book',exact:true,level:1}).waitFor();
    await page.getByRole('button', {name:'Reference output',exact:true}).click();
    const readOutput=async()=>{await page.waitForFunction(()=>document.querySelector('pre[aria-label="Computed exercise reference output"]')?.textContent.trim().startsWith('{'));return JSON.parse(await page.getByLabel('Computed exercise reference output',{exact:true}).innerText());};
    const greekOutput=await readOutput();assert.equal(greekOutput.result.gamma_pnl,-160000);assert.equal(greekOutput.result.total_pnl,-315000);
    for(const check of [
      {id:'swap-dv01',verify:r=>Math.abs(r.pv_approximation+910000)<1e-6&&r.signed_dv01_per_bp_up===45500},
      {id:'curve-boot',verify:r=>r.nodes.map(n=>n.discount_factor.toFixed(4)).join(',')==='0.9709,0.9389,0.9057'},
      {id:'iv-newton',verify:r=>r.converged&&Math.abs(r.volatility_percent-26.73112393864625)<1e-10&&Math.abs(r.repriced_call-8)<1e-10},
      {id:'mc-asian',verify:r=>Math.abs(r.price-5.356683200676238)<1e-10&&r.seed===7&&r.paths===100000&&r.confidence_interval_95[0]<r.price&&r.confidence_interval_95[1]>r.price},
    ]){await page.goto(`${baseUrl}/exercises/${check.id}`,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Reference output',exact:true}).click();const value=await readOutput();assert.equal(value.id,check.id);assert.ok(check.verify(value.result),`${check.id} must expose the actual verified numerical output`);assert.ok(Object.values(value.checks).every(Boolean));}
    await page.goto(`${baseUrl}/lab/backtest`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Professional plan required',exact:true}).waitFor();
    assert.equal(await page.getByRole('button', {name:'Run backtest',exact:true}).count(), 0);
    assert.ok(!state.requests.some((item)=>item.startsWith('POST /strategy/')));
    await page.goto(`${baseUrl}/survival/beginner`, {waitUntil:'networkidle'});
    await page.locator('.survival-question-panel h2').waitFor();
    assert.equal(await page.locator('.survival-question-panel h2').innerText(),survivalFirst.prompt,'The question is read from the common API contract');
    assert.ok(state.requests.includes('POST /learning/survival/runs'),'An allowed plan must use the common persisted workflow');
    assert.equal(await page.getByRole('button',{name:`A ${Object.fromEntries(survivalFirst.options).A}`,exact:true}).count(),1,'Server choices retain their canonical labels');
    // Full scoring/deadline/reload journeys are exercised against the actual API
    // in smoke_product_cycle2_browser, not a second rule engine in this mock.
    await page.goto(`${baseUrl}/notebooks`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Notebooks',exact:true,level:1}).waitFor();
    const notebookText = await page.locator('body').innerText();
    assert.match(notebookText, /Drafts stay on this device; cloud saving and sharing are not included\./, 'notebooks must exclude persistence and sharing from the current release');
    assert.doesNotMatch(notebookText, /not available yet|coming soon/i, 'notebooks must not promise a future delivery state');
    await context.close();
    console.log('PASS Student receives Advanced courses, a non-mounted Pro Backtest, device-only notebook drafts and access to the common Survival workflow (permission transport fixture)');
  }

  {
    const {context,page,state} = await planPage('pro');
    await page.goto(`${baseUrl}/courses/monte-carlo`, {waitUntil:'networkidle'});
    await page.getByRole('heading', {name:'Monte Carlo Methods',exact:true,level:1}).waitFor();
    await waitFor(()=>state.requests.includes('GET /courses/monte-carlo/script'), 'Pro course script request was not issued');
    assert.ok(state.requests.includes('GET /courses/monte-carlo/script'));
    await page.getByText(firstModuleTitle['monte-carlo'], {exact:true}).first().waitFor();
    assert.ok(state.courseBytes['monte-carlo'] > 40_000);
    await page.getByRole('button', {name:'Calculator',exact:true}).click();
    assert.equal(await page.getByRole('link', {name:'Open Monte Carlo Lab',exact:false}).getAttribute('href'), '/tools/mc');

    for (const courseId of Object.keys(privateCourseFiles)) {
      console.log(`CHECK course route ${courseId}`);
      await page.goto(`${baseUrl}/courses/${courseId}`, {waitUntil:'domcontentloaded'});
      await page.getByRole('heading', {name:expectedCourseTitle[courseId],exact:true,level:1}).waitFor();
      await page.getByText(firstModuleTitle[courseId], {exact:true}).first().waitFor();
      assert.ok(state.courseBytes[courseId] > 40_000, `${courseId} public projection is unexpectedly thin`);
      await page.getByRole('button', {name:'Full script',exact:true}).click();
      await page.waitForTimeout(750);
      const renderedTypes = await page.locator('[data-ui-block-type]').evaluateAll((nodes)=>nodes.map((node)=>node.getAttribute('data-ui-block-type')));
      console.log(`WIDGETS ${courseId}: ${renderedTypes.join(',') || 'none'}`);
      assert.ok(renderedTypes.includes('scenario_table'), `${courseId} must render its calculator-backed scenario table`);
      assert.ok(renderedTypes.includes(expectedWidget[courseId]), `${courseId} must render ${expectedWidget[courseId]}`);
      assert.ok(await page.locator('[data-ui-block-type="scenario_table"] [data-scenario-table="true"]').count() > 0, `${courseId} scenario table must use explicit authenticated cells`);
      const visibleCourse = await page.locator('body').innerText();
      assert.doesNotMatch(visibleCourse, /Plan pedagogique adaptatif|Trous pedagogiques|Faits et angles extraits|Source Appendix \(back-office\)|\[(?:extrait|reformule|genere)\]|\[S(?:\d+|x)\]|\bextraits?\b|\b[ld]['’]source\b|REFERENCES AND BIBLIOGRAPHY|Journal of Finance|97\.50|-250k|-980k/i, `${courseId} leaks authoring metadata, noisy references or placeholder values`);
      if (courseId === 'exotics') await page.locator('[data-path-dependent-payoff="barrier"]').waitFor();
      if (courseId === 'structured-products') await page.locator('[data-path-dependent-payoff="autocall"]').waitFor();
      if (courseId === 'monte-carlo') await page.locator('[data-monte-carlo-course="true"]').waitFor();
      if (courseId === 'implied-vol') await page.locator('[data-vol-smile="true"]').waitFor();

      await page.getByRole('button', {name:'Calculator',exact:true}).click();
      if (expectedTool[courseId]) {
        const [href,label] = expectedTool[courseId];
        assert.equal(await page.getByRole('link', {name:label,exact:false}).getAttribute('href'), href);
      } else if (courseId === 'credit-derivatives') {
        await page.locator('[data-cds-scenario="true"]').waitFor();
      } else if (courseId === 'exotics' || courseId === 'structured-products') {
        await page.getByText('Path-dependent model boundary', {exact:true}).waitFor();
        assert.equal(await page.locator('[data-course-calculator-boundary="path-dependent"] a[href="/tools/payoff"]').count(), 0, `${courseId} must not link to the vanilla payoff lab`);
      } else if (courseId === 'black-scholes') {
        assert.ok(await page.locator('input').count() > 0, 'Black-Scholes course calculator must be interactive');
      }
    }
    await page.goto(`${baseUrl}/courses/yield-curves`, {waitUntil:'networkidle'});
    await page.getByRole('button', {name:'References',exact:true}).click();
    await page.getByText('Course references', {exact:true}).waitFor();
    assert.ok(await page.locator('.course-source-row').count() >= 1, 'clean course references must remain visible after authoring redaction');
    const referenceExcerpt = (await page.locator('.course-source-row small').first().innerText()).trim();
    assert.ok(referenceExcerpt.length >= 45 && !referenceExcerpt.includes('Reference from ThePricingLibrary'), 'Resources must expose a readable client-safe excerpt');

    await page.goto(`${baseUrl}/lab/backtest`, {waitUntil:'networkidle'});
    await page.getByRole('button', {name:'Run backtest',exact:true}).waitFor();
    assert.ok(state.requests.includes('GET /strategy/instruments'));
    assert.deepEqual(state.pageErrors, []);
    await context.close();
    console.log('PASS Pro receives all 12 unique course routes, clean references, real widgets, explicit tool mappings and the Backtest workspace');
  }

  console.log('Entitlement browser matrix complete: anonymous/free/starter/student/pro PASS.');
} finally {
  if (browser) await browser.close();
  if (preview && preview.exitCode === null) {
    preview.kill('SIGTERM');
    await new Promise((resolve)=>preview.once('exit', resolve));
  }
  await rm(outputDirectory, {recursive:true,force:true});
}
