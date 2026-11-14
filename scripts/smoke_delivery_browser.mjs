import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.TPL_AUDIT_BASE_URL || 'http://127.0.0.1:4192';
const output = path.resolve('../../reports/visual-qa-2026-11-09-delivery/journeys');
await mkdir(output, { recursive: true });
const steps = [];
const browser = await chromium.launch({ headless: true });
const supabase = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const now = Math.floor(Date.now() / 1000);
const user = { id: '00000000-0000-4000-8000-000000000031', aud: 'authenticated', role: 'authenticated', email: 'delivery.audit@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { prenom: 'Local', nom: 'Audit' }, identities: [], created_at: '2026-11-09T00:00:00Z' };
const encode = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: now + 3600, aud: 'authenticated', iss: `${supabase}/auth/v1`, role: 'authenticated', email: user.email })}.local-fixture`;
const session = { access_token: token, refresh_token: 'local-fixture', expires_at: now + 3600, expires_in: 3600, token_type: 'bearer', user };
const cors = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, content-profile, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS' };
let pageErrors = [];
const state = { threads: [], comments: [], blogDown: false, replyDown: false, recoverRequests: 0, passwordUpdates: 0, signedPosts: 0 };
async function contextFor(signedIn) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', acceptDownloads: true });
  if (signedIn) await context.addInitScript(({ session }) => {
    const key = 'sb-kjybaatgyigpqyywlmnw-auth-token';
    localStorage.setItem(key, JSON.stringify(session));
    localStorage.setItem(`${key}-user`, JSON.stringify({ user: session.user }));
  }, { session });
  await context.route(`${supabase}/**`, async (route) => {
    const request = route.request(); const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (url.pathname.endsWith('/recover')) { state.recoverRequests++; return route.fulfill({ status: 200, headers: cors, json: {} }); }
    if (url.pathname.endsWith('/signup')) return route.fulfill({ status: 200, headers: cors, json: { ...user, confirmation_sent_at: new Date().toISOString() } });
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204, headers: cors });
    if (url.pathname.endsWith('/user') && request.method() === 'PUT') state.passwordUpdates++;
    return route.fulfill({ status: 200, headers: cors, json: url.pathname.startsWith('/rest/v1/profiles') ? { id: user.id, prenom: 'Local', role: 'user' } : user });
  });
  await context.route(/^(?:http:\/\/127\.0\.0\.1:8000|https:\/\/tpl-api\.optiquant-ia\.com)\//, async (route) => {
    const request = route.request(); const url = new URL(request.url()); const p = url.pathname; const method = request.method();
    const answer = (json, status = 200) => route.fulfill({ status, headers: cors, json });
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (p === '/billing/entitlement') return answer({ active: signedIn, plan: signedIn ? 'pro' : 'free' });
    if (p === '/platform/blog') return state.blogDown ? answer({ detail: 'Local fixture unavailable' }, 503) : answer({ posts: [{ slug: 'local-pricing-example', title: 'Local pricing example', excerpt: 'An explicit local browser test fixture.', tags: ['Pricing'], author: 'Local fixture', published_at: now, read_minutes: 2 }] });
    if (p.startsWith('/platform/blog/')) return answer({ detail: 'Not found' }, 404);
    if (p === '/platform/community/threads') {
      if (method === 'POST') {
        assert.equal(request.headers().authorization, `Bearer ${token}`);
        state.signedPosts++;
        const body = request.postDataJSON(); assert.equal(body.author_id, undefined);
        const thread = { ...body, id: 'local-thread-1', author: 'server-assigned', created_at: now, votes: 0, comment_count: 0 };
        state.threads.push(thread); return answer(thread);
      }
      return answer({ threads: state.threads });
    }
    if (p.endsWith('/comments')) {
      if (method === 'POST') {
        assert.equal(request.headers().authorization, `Bearer ${token}`);
        if (state.replyDown) return answer({ detail: 'Local fixture unavailable' }, 503);
        const comment = { ...request.postDataJSON(), id: 'local-comment-1', thread_id: 'local-thread-1', author: 'server-assigned', created_at: now };
        state.comments.push(comment); state.threads[0].comment_count++;
        return answer(comment);
      }
      return answer({ comments: state.comments });
    }
    if (p.endsWith('/vote')) { state.threads[0].votes = 1; return answer({ votes: 1 }); }
    return answer({ detail: 'Local fixture unavailable' }, 503);
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  return { context, page };
}
async function step(name, run) {
  try { const detail = await run(); steps.push({ name, status: 'PASS', detail }); console.log(`PASS ${name}`); }
  catch (error) { steps.push({ name, status: 'FAIL', error: error.message }); throw error; }
}
try {
  const guest = await contextFor(false); const page = guest.page;
  await step('Free signup waits for email confirmation without a false login', async () => {
    await page.goto(`${base}/auth/signup`);
    await page.getByLabel('Name', { exact: true }).fill('Local Audit');
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill('local-fixture-password-2026');
    await page.getByRole('button', { name: 'Create free account', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Check your email to confirm' }).waitFor();
    assert.match(page.url(), /auth\/signup$/);
    assert.equal(await page.getByRole('button', { name: 'Create free account', exact: true }).count(), 0);
    await page.screenshot({ path: path.join(output, 'signup-confirmation-390.png') });
    return 'No session is created by this fixture. Confirmation stays on screen; no paid entitlement is granted.';
  });
  await step('Password recovery sends a real SDK request and handles an expired link', async () => {
    await page.goto(`${base}/auth/login`); await page.getByRole('link', { name: 'Forgot password?' }).click();
    await page.getByRole('heading', { name: 'Reset your password.', exact: true }).waitFor();
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByRole('button', { name: 'Send recovery link' }).click();
    await page.getByRole('status').filter({ hasText: 'If this address has an account' }).waitFor();
    assert.equal(state.recoverRequests, 1);
    await page.goto(`${base}/auth/reset-password`);
    await page.getByText('This recovery link is missing or has expired.', { exact: false }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Update password' }).count(), 0);
    return 'SDK /recover request intercepted locally; anonymous reset cannot change a password. No email was sent.';
  });
  await step('Blog distinguishes API outage, empty search and missing article', async () => {
    state.blogDown = true; await page.goto(`${base}/blog`);
    await page.getByRole('heading', { name: 'Articles could not be loaded' }).waitFor();
    state.blogDown = false; await page.getByRole('button', { name: 'Try again' }).click();
    await page.getByRole('heading', { name: 'Local pricing example', exact: true }).waitFor();
    await page.getByLabel('Search articles', { exact: true }).fill('no-such-fixture');
    await page.getByRole('heading', { name: 'No articles match this search' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Local pricing example', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.getByRole('heading', { name: 'Local pricing example', exact: true }).waitFor();
    await page.goto(`${base}/blog/does-not-exist`); await page.getByRole('heading', { name: 'Article not found', exact: true }).waitFor();
    return 'An unavailable service and a confirmed 404 produce different states. No irrelevant article is shown as a search result.';
  });
  await step('Unknown routes and unavailable product readiness remain honest', async () => {
    await page.goto(`${base}/courses/not-a-course`); await page.getByRole('heading', { name: 'Page not found' }).waitFor();
    await page.goto(`${base}/starter-kit`); await page.getByText('Disponibilité à vérifier', { exact: true }).first().waitFor();
    const text = await page.locator('main').innerText(); assert.doesNotMatch(text, /6\/7|PRÉPARÉ/);
    assert.equal(await page.locator('[data-deliverable]').count(), 7);
    return 'Unavailable API is not represented as six completed deliverables.';
  });
  await guest.context.close();
  const member = await contextFor(true); const pro = member.page;
  await step('Forum publishes, opens, reloads and replies with signed server identity', async () => {
    await pro.goto(`${base}/community/forum`);
    await pro.getByRole('button', { name: 'New post', exact: true }).waitFor();
    await pro.getByRole('button', { name: 'New post', exact: true }).click();
    await pro.getByLabel('Title', { exact: true }).fill('A local pricing question');
    await pro.getByLabel('Your question', { exact: true }).fill('Which discounting convention applies to this local test case?');
    await pro.getByRole('button', { name: 'Publish discussion', exact: true }).click();
    await pro.locator('[data-forum-thread]').waitFor();
    await pro.getByText('Which discounting convention applies to this local test case?', { exact: true }).waitFor();
    await pro.reload(); await pro.locator('[data-forum-thread]').waitFor();
    state.replyDown = true;
    await pro.getByLabel('Your reply', { exact: true }).fill('State the instrument conventions before discounting.');
    await pro.getByRole('button', { name: 'Publish reply', exact: true }).click();
    await pro.getByText('Your reply was not published.', { exact: false }).waitFor();
    assert.equal(await pro.getByLabel('Your reply', { exact: true }).inputValue(), 'State the instrument conventions before discounting.');
    state.replyDown = false; await pro.getByRole('button', { name: 'Publish reply', exact: true }).click();
    await pro.locator('.forum-reply').getByText('State the instrument conventions before discounting.', { exact: true }).waitFor();
    assert.equal(state.signedPosts, 1);
    await pro.screenshot({ path: path.join(output, 'forum-thread-390.png'), fullPage: true });
    return 'GET/POST fixture round trip, refresh, actual body and comment rendering, bearer forwarding, failure draft retention. Server persistence is verified separately by Python smoke_platform.';
  });
  await step('Exercise download produces a real reusable JSON artifact', async () => {
    await pro.goto(`${base}/exercises`);
    await pro.locator('a.exercise-card').first().waitFor();
    assert.equal(await pro.locator('main').getByText('Completed', { exact: true }).count(), 0, 'seed exercises cannot claim personal completion');
    await pro.locator('a.exercise-card').first().click();
    const downloading = pro.waitForEvent('download');
    await pro.getByRole('button', { name: 'Download JSON', exact: true }).click();
    const download = await downloading; const file = path.join(output, download.suggestedFilename()); await download.saveAs(file);
    const data = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(data.schema, 'tpl.exercise-export.v1'); assert.ok(data.exercise.id && data.exercise.title);
    assert.equal(Object.hasOwn(data.exercise, 'done'), false, 'content exports cannot assert personal completion');
    return `Downloaded ${download.suggestedFilename()}, with an exercise ID, title and full exercise payload.`;
  });
  await step('Lab comparisons disclose simulation and export the displayed values', async () => {
    await pro.goto(`${base}/lab/performance`);
    await pro.locator('[data-simulation-comparison]').waitFor();
    assert.doesNotMatch(await pro.locator('main').innerText(), /Q2 2026|Max DD|Short Strangle SPX/);
    assert.doesNotMatch(await pro.locator('main').innerText(), /\bNaN\b|Infinity/);
    const values = await pro.locator('table tbody').innerText(); await pro.reload(); await pro.locator('[data-simulation-comparison]').waitFor(); assert.equal(await pro.locator('table tbody').innerText(), values);
    const downloading = pro.waitForEvent('download'); await pro.getByRole('button', { name: 'Download CSV', exact: true }).click();
    const download = await downloading; const file = path.join(output, download.suggestedFilename()); await download.saveAs(file);
    const csv = await readFile(file, 'utf8'); assert.equal(csv.trim().split('\n').length, 6); assert.match(csv, /physicalDrift,physicalVol,seed,paths/);
    const csvRows = csv.trim().split('\n').slice(1).map((line) => line.split(','));
    for (const [index, row] of csvRows.entries()) {
      assert.equal(row.length, 12);
      assert.ok(row.slice(1).every((value) => value.trim() && Number.isFinite(Number(value))), 'every exported statistic must be a finite number');
      assert.equal(Number(row[4]), 2000);
      assert.ok(Math.abs(Number(row[5]) - Number(row[10])) < 5 * Number(row[11]), 'fixed-seed estimate must agree with the analytical lognormal payoff expectation at its sampling precision');
      const cells = await pro.locator('table tbody tr').nth(index).locator('td').allTextContents();
      assert.equal(Number(cells[4]), Math.round(Number(row[5])), 'UI and CSV must use the same actual P&L calculation');
      assert.equal(Number(cells[5]), Math.round(Number(row[6])));
      assert.equal(Number(cells[6]), Number(Number(row[7]).toFixed(3)));
    }
    await pro.goto(`${base}/lab/scenarios`);
    await pro.getByRole('heading', { name: 'Trading Lab', exact: true }).waitFor();
    assert.equal(await pro.locator('table tbody tr').count(), 6);
    assert.doesNotMatch(await pro.locator('main').innerText(), /\bNaN\b|Infinity/);
    await pro.goto(`${base}/lab/strategies`);
    for (const strategy of ['Iron Condor', 'Short Strangle']) {
      const d = await pro.locator(`[data-strategy-payoff="${strategy}"] path`).getAttribute('d');
      const points = [...d.matchAll(/[ML] ([\d.-]+),([\d.-]+)/g)].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
      assert.equal(points.length, 81);
      assert.ok(points[40].y < points[0].y && points[40].y < points[80].y, 'short-volatility gross payoff must be higher in the centre than in either wing');
    }
    return 'Five exported and six displayed fixed-seed cases with finite statistics, analytical expectation and UI/CSV parity. Condor/short-strangle payoff orientation verified.';
  });
  await step('A signed recovery session updates password through the SDK', async () => {
    await pro.goto(`${base}/auth/reset-password`); await pro.getByLabel('New password', { exact: true }).fill('new-local-fixture-password-2026');
    await pro.getByRole('button', { name: 'Update password', exact: true }).click();
    await pro.getByText('Your password has been updated.', { exact: false }).waitFor(); assert.equal(state.passwordUpdates, 1);
    return 'SDK user update and sign-out intercepted locally. No real account password changed.';
  });
  await member.context.close();
  await step('No uncaught browser errors', () => { assert.deepEqual(pageErrors, []); return 'Zero page errors across these journeys.'; });
} finally {
  if (steps.some((item) => item.status === 'FAIL')) {
    const diagnostics = [];
    for (const context of browser.contexts()) for (const page of context.pages()) {
      diagnostics.push({ url: page.url(), text: await page.locator('main').innerText().catch(() => ''), recoverRequests: state.recoverRequests, passwordUpdates: state.passwordUpdates, pageErrors });
      await page.screenshot({ path: path.join(output, `failure-${diagnostics.length}.png`) }).catch(() => {});
    }
    await writeFile(path.join(output, 'failure-diagnostics.json'), JSON.stringify(diagnostics, null, 2));
  }
  await browser.close();
  await writeFile(path.join(output, 'journey-results.json'), JSON.stringify({ checkedAt: new Date().toISOString(), scope: 'Production frontend with local HTTP/auth fixtures. Does not prove Supabase SMTP, real Stripe or deployed persistence.', steps }, null, 2));
}
