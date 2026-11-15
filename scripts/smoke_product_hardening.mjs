import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { NOTEBOOK_EXAMPLES, buildNotebook } from '../src/lib/notebookExamples.mjs';
import { interviewProgressView } from '../src/lib/learnerProgress.mjs';
import { deskNumber, deskRiskLabel } from '../src/lib/deskDisplay.mjs';
import { analyzeRealizedVolatility, parseRealizedVolatilityCsv, TEACHING_CSV } from '../src/lib/realizedVolatility.mjs';

const checks = [];
const check = (name, condition = true) => { assert.ok(condition,name); checks.push(name); console.log(`PASS ${name}`); };
const runPython = code => {
  const run = spawnSync(process.env.TPL_PYTHON || 'python',['-'],{input:code,encoding:'utf8',timeout:15000,maxBuffer:1000000});
  assert.equal(run.status,0,run.stderr); return JSON.parse(run.stdout);
};
for (const example of NOTEBOOK_EXAMPLES) {
  const notebook = buildNotebook(example);
  assert.equal(notebook.nbformat,4); assert.equal(notebook.nbformat_minor,5);
  assert.equal(notebook.cells[1].source.join(''),example.code);
  assert.deepEqual(notebook.cells[1].outputs,[]);
  assert.equal(notebook.cells[1].execution_count,null);
  const result = runPython(example.code);
  if (example.id === 'barrier-down-out') {
    assert.ok(result.closed_form_price>0 && result.closed_form_price<result.vanilla_price);
    assert.ok(Math.abs(result.vanilla_price-result.down_in_price-result.closed_form_price)<1e-12);
    assert.equal(result.independent_pairs,50000);
    assert.ok(result.standard_error>0 && result.ci95[0]<result.closed_form_price && result.ci95[1]>result.closed_form_price);
    const boundary = runPython(example.code.replace('print(json.dumps(run(), indent=2))','print(json.dumps(run({**TICKET, "barrier": 1.0, "paths": 2000}), indent=2))'));
    assert.ok(Math.abs(boundary.closed_form_price-boundary.vanilla_price)<1e-12);
    const invalid = spawnSync(process.env.TPL_PYTHON || 'python',['-'],{input:example.code.replace('print(json.dumps(run(), indent=2))','print(json.dumps(run({**TICKET, "paths": 3}), indent=2))'),encoding:'utf8'});
    assert.notEqual(invalid.status,0); assert.match(invalid.stderr,/even integer/);
  } else assert.ok(Math.abs(result.price_per_unit-6.120654113455842)<1e-12 && result.scenarios[0].price_per_unit<result.scenarios[4].price_per_unit);
  check(`Original ${example.id} exports a valid source-preserving notebook and executes in real Python`);
}
const exercise = JSON.parse(await readFile(new URL('../src/data/realizedVolExercise.json',import.meta.url),'utf8'));
const solution = runPython(exercise.solution);
const js = await analyzeRealizedVolatility(parseRealizedVolatilityCsv(TEACHING_CSV),{annualization:252,window:5,sourceLabel:'Original synthetic exercise',calendarMode:'weekday_sessions',priceBasis:'unadjusted_ohlc'});
for (const [key,value] of Object.entries(solution.annualizedVolatility)) assert.ok(Math.abs(value-js.estimators[key].annualizedVolatility)<1e-12,`${key}: Python and canonical tool must agree`);
check('Realized-volatility exercise uses the same 11 sessions and all five actual tool estimators');
const progress = interviewProgressView({events:0,interview:{attempt_count:1,case_count:1,numerical_pass_count:1,independent_check_count:1,reasoning_review_count:0,event_count:2,resume:{path:'/interview/call-quote?variant=primary',phase:'feedback'}}});
check('Interview activity is visible even when the legacy course ledger has zero events',progress.hasActivity&&progress.attempts===1&&progress.reasoningReviews===0&&progress.phase==='feedback');
assert.equal(interviewProgressView({events:2}),null);
assert.equal(interviewProgressView({interview:{resume:{path:'https://outside.test'}}}).resumePath,'/interview');
assert.equal(interviewProgressView({interview:{resume:{path:'//outside.test'}}}).resumePath,'/interview');
check('Resume destinations stay inside the interview path and legacy activity is not relabelled mastery');
assert.equal(deskNumber(null),'—');assert.equal(deskNumber(undefined),'—');assert.equal(deskNumber(''),'—');assert.equal(deskNumber(false),'—');assert.equal(deskNumber(0),'0.00');
assert.match(deskRiskLabel({status:'NOT_ASSESSED',limit_usage:null}),/not assessed/);
check('Missing RFQ numeric data and unassessed limits never become a zero or green approval');

const workers = [];
globalThis.Worker = class {
  constructor() { this.terminated=false; workers.push(this); }
  postMessage(message) { this.message=message; }
  terminate() { this.terminated=true; }
};
const runtime = await import('../src/claude/pyodideRunner.js');
let pending = runtime.runPython('print(2)');
let active = workers.at(-1);active.onmessage({data:{id:active.message.id,ok:true,stdout:'2\n'}});
assert.deepEqual(await pending,{ok:true,stdout:'2\n',error:null});
pending=runtime.runPython('print(3)');active=workers.at(-1);active.onmessage({data:{id:active.message.id,ok:false,error:'CDN unavailable',runtimeFailure:true}});
assert.equal((await pending).ok,false);assert.equal(active.terminated,true);
pending=runtime.runPython('print(4)');assert.notEqual(workers.at(-1),active);runtime.cancelPython();assert.match((await pending).error,/stopped/);
check('Python worker transport retries a failed runtime and Stop terminates its active process');
pending=runtime.runPython('while True: pass',{timeoutMs:15});assert.match((await pending).error,/timed out/);assert.equal(workers.at(-1).terminated,true);
check('A non-returning browser run is bounded and leaves a retryable runtime');
console.log(`[VERDICT] PASS ${checks.length} product-hardening contracts. Worker tests exercise the transport, not a claimed CDN execution.`);
