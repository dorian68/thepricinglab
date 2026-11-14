import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.TPL_LOCAL_TEST_URL || 'http://127.0.0.1:5173';
const output = path.resolve('../../reports/interview-lab-2026-11-14/technical-browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [], external = [];
const contexts = [];
const check = (label, value = true) => { assert.ok(value, label); checks.push(label); console.log(`PASS ${label}`); };
async function context(role, width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 }, reducedMotion: 'reduce', acceptDownloads: true });
  contexts.push(ctx);
  await ctx.addInitScript(role => localStorage.setItem('tpl.localPreview.role.v1', role), role);
  await ctx.route(/https:\/\/(?:[^/]+\.supabase\.co|tpl-api\.optiquant-ia\.com)\//, route => { external.push(route.request().url()); return route.abort(); });
  const page = await ctx.newPage(); page.on('pageerror', e => errors.push(e.message));
  return { ctx, page };
}
async function openCase(page, id, variant = 'primary') {
  await page.goto(`${base}/interview/${id}?variant=${variant}`);
  await prepareAnswerForm(page, id, variant);
}
async function prepareAnswerForm(page, id, variant = 'primary') {
  await page.locator(`.il-case-heading[data-case="${id}"][data-variant="${variant}"]`).waitFor({timeout:60000});
  await page.locator('.il-answer-form,.il-feedback').first().waitFor({ timeout: 60000 });
  if (await page.locator('.il-feedback').count()) await page.locator('.il-retry').click();
  await page.locator('.il-answer-form').waitFor();
}
async function fill(page, values) {
  const inputs = page.locator('.il-question input');
  assert.equal(await inputs.count(), values.length);
  for (let i = 0; i < values.length; i++) await inputs.nth(i).fill(String(values[i]));
  await page.getByLabel('Your reasoning', { exact: true }).fill('I used European Black-Scholes with continuous rates and dividend yield. The delta sign determines the stock hedge. Constant volatility and transaction costs limit its practical use.');
}
async function localApi(page, route, method = 'GET', body) {
  return page.evaluate(async ({ route, method, body }) => {
    const { session } = await fetch('/__dev/session?role=learner').then(r => r.json());
    const response = await fetch(`/__dev/api${route}`, { method, headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : null };
  }, { route, method, body });
}
try {
  const { page: visitor } = await context('visitor', 390);
  await openCase(visitor, 'call-quote');
  check('public case asks for answers before showing a correction', await visitor.locator('.il-feedback').count() === 0 && await visitor.locator('.il-question input').count() === 2);
  check('submission requires a numerical attempt and reasoning', await visitor.getByRole('button', { name: 'Submit & check my answer' }).isDisabled());
  await fill(visitor, [10.4506, .636831]);
  await visitor.getByRole('button', { name: 'Submit & check my answer' }).click();
  await visitor.locator('[data-interview-feedback]').waitFor();
  check('anonymous calculation checks the actual submitted numbers', (await visitor.locator('.il-feedback').innerText()).includes('Your numerical answer checks out.'));
  check('anonymous result is explicitly unsaved', (await visitor.locator('.il-feedback').innerText()).includes('not saved to an account'));
  await visitor.screenshot({ path: path.join(output, 'public-correction-390.png'), fullPage: true });
  await visitor.goto(`${base}/interview/dividend-parity`);
  await visitor.locator('.il-unavailable').waitFor();
  check('later cases require signed access with a useful free-case route', await visitor.getByRole('link', { name: 'Try the free case', exact: true }).count() === 1);
  let serviceUnavailable = true;
  await visitor.route('**/__dev/api/interview/cases/call-quote?variant=primary', route => serviceUnavailable ? route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"temporarily unavailable"}' }) : route.continue());
  await visitor.goto(`${base}/interview/call-quote`);
  await visitor.getByRole('button', { name: 'Retry practice', exact: true }).waitFor();
  check('temporary service failure is distinct from an account requirement', (await visitor.locator('.il-unavailable h1').innerText()).includes('This case could not be opened'));
  serviceUnavailable = false;
  await visitor.getByRole('button', { name: 'Retry practice', exact: true }).click();
  await visitor.locator('.il-answer-form').waitFor();
  check('temporary task failure recovers through the visible retry action');

  const { page } = await context('learner');
  await page.goto(`${base}/interview`);
  await page.locator('.il-path-row').last().waitFor({ timeout: 60000 });
  check('verified non-admin sees the complete six-case English pilot', await page.locator('.il-path-row').count() === 6);
  await page.getByLabel('Target role', { exact: true }).selectOption('structuring');
  await page.getByLabel('Time per session', { exact: true }).selectOption('45');
  await page.getByRole('button', { name: 'Save my plan', exact: true }).click();
  await page.getByText('Your plan is saved.', { exact: false }).waitFor();
  check('role and available-time plan are persisted', (await localApi(page, '/interview/state')).data.onboarding.minutes_per_session === 45);
  const initial = (await localApi(page, '/interview/state')).data;
  await openCase(page, 'call-quote');
  await fill(page, [10.4506, .636831]);
  const posted = page.waitForResponse(r => r.url().endsWith('/interview/attempts') && r.request().method() === 'POST');
  await page.getByRole('button', { name: /Submit.*(answer|retry)/ }).click();
  const response = await posted; assert.equal(response.status(), 200);
  const saved = (await response.json()).attempt;
  const requestBody = response.request().postDataJSON();
  await page.locator('[data-interview-feedback]').waitFor();
  check('signed non-admin submits a real private attempt and receives computed feedback', saved.persisted === true && saved.numerical_pass === true);
  const duplicate = await localApi(page, '/interview/attempts', 'POST', requestBody);
  check('network replay is idempotent and keeps the original attempt', duplicate.status === 200 && duplicate.data.attempt.id === saved.id);
  for (const checkbox of await page.locator('.il-review input[type="checkbox"]').all()) await checkbox.check();
  await page.locator('.il-review textarea').fill('Next time I will explain why a long call requires a short stock hedge and distinguish delta from a profit probability.');
  await page.getByRole('button', { name: 'Save self-review', exact: true }).click();
  await page.getByRole('button', { name: 'Self-review saved', exact: false }).waitFor();
  check('written reasoning has a separate self-review rather than an invented AI grade', (await localApi(page, '/interview/state')).data.metrics.reasoning_reviews >= 1);
  await page.getByRole('link', { name: 'Try the transfer case', exact: false }).click();
  await prepareAnswerForm(page, 'call-quote', 'transfer');
  check('transfer changes call to put rather than only changing numbers', (await page.locator('.il-case-heading').innerText()).includes('put'));
  await fill(page, [5.573526, -.363169]);
  await page.getByRole('button', { name: /Submit.*(answer|retry)/ }).click();
  await page.locator('[data-interview-feedback]').waitFor();
  check('transfer calculation correctly checks the negative put delta', (await page.locator('.il-feedback').innerText()).includes('Your numerical answer checks out.'));
  const beforeReload = (await localApi(page, '/interview/state')).data;
  check('attempt history grows without replacing older work', beforeReload.attempts.length === initial.attempts.length + 2);
  check('paid legacy content remains protected for the free learner', (await localApi(page, '/courses/greeks/script')).status === 403);

  await openCase(page, 'delta-hedge', 'transfer');
  const taskResponse = await localApi(page, '/interview/cases/delta-hedge?variant=transfer');
  const market = taskResponse.data.ticket;
  await page.getByRole('link', { name: 'Open the pricing tool', exact: false }).click();
  await page.getByLabel('BS spot', { exact: true }).waitFor();
  check('case-to-tool link preserves spot, position and annual volatility', Number(await page.getByLabel('BS spot', { exact: true }).inputValue()) === market.spot && await page.getByLabel('BS position', { exact: true }).inputValue() === market.position && Number(await page.getByLabel('BS volatility', { exact: true }).inputValue()) === market.volatility * 100);

  const { page: fresh } = await context('learner');
  await fresh.goto(`${base}/interview`);
  await fresh.locator('.il-metrics').waitFor({ timeout: 60000 });
  const resume = fresh.getByRole('link', { name: 'Resume my case', exact: false });
  await resume.waitFor();
  check('fresh browser restores the exact server-owned case and variant', (await resume.getAttribute('href')).includes('/delta-hedge?variant=transfer'));
  const downloaded = fresh.waitForEvent('download');
  await fresh.getByRole('button', { name: 'Export my practice report', exact: false }).click();
  const download = await downloaded;
  const report = JSON.parse(await readFile(await download.path(), 'utf8'));
  check('private export includes original reasoning, attempts and explicit limitations', report.attempts.some(a => a.id === saved.id && a.reasoning === saved.reasoning) && report.limitations.length >= 3 && report.metrics.certified_mastery === false);
  await fresh.screenshot({ path: path.join(output, 'path-1440.png'), fullPage: true });
  await fresh.goto(`${base}/interview/call-quote?variant=primary`);
  await fresh.locator('[data-interview-feedback]').waitFor();
  await fresh.getByText('Your submitted reasoning', {exact:true}).click();
  check('fresh browser restores the correction phase and original response', (await fresh.locator('.il-feedback').innerText()).includes(saved.reasoning) && await fresh.locator('.il-answer-form').count() === 0);
  check('Interview Lab has one main landmark', await fresh.locator('main').count() === 1);
  await fresh.locator('.il-retry').click();
  await fresh.locator('.il-answer-form').waitFor();
  check('retry is explicit and retains the previous response', Number(await fresh.locator('.il-question input').first().inputValue()) === saved.answers.price);
  for (const width of [1440, 390, 320]) {
    await fresh.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const id of ['call-quote', 'dividend-parity', 'delta-hedge', 'gamma-vega', 'time-rates', 'quote-memo']) {
      await openCase(fresh, id, width === 390 ? 'transfer' : 'primary');
      assert.ok(await fresh.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id} overflow ${width}`);
      assert.equal(await fresh.locator('.il-question input').count(), (await localApi(fresh, `/interview/cases/${id}?variant=${width === 390 ? 'transfer' : 'primary'}`)).data.questions.length);
    }
    await fresh.screenshot({ path: path.join(output, `final-memo-${width}.png`), fullPage: true });
    check(`all six cases render and remain operable without overflow at ${width}px`);
  }
  check('no browser runtime errors', errors.length === 0);
  check('test journeys do not call external auth or provider APIs', external.length === 0);
  await writeFile(path.join(output, 'checks.json'), JSON.stringify({ verdict: 'PASS', checks, errors, externalApiCalls: external, note: 'Local signed free learner and public preview; no real purchase or hiring validation.' }, null, 2));
  console.log(`Interview browser PASS ${checks.length}/${checks.length}`);
} finally { await Promise.all(contexts.map(c => c.close())); await browser.close(); }
