import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const base = process.env.TPL_LOCAL_TEST_URL || 'http://127.0.0.1:5173';
const checks = [];
async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    signal: AbortSignal.timeout(60000),
  });
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = raw; }
  return { status: response.status, data, headers: response.headers };
}
function check(label, condition) { assert.ok(condition, label); checks.push(label); console.log(`PASS ${label}`); }

const bootstrap = await request('/__dev/session');
check('local bootstrap', bootstrap.status === 200);
const { session, entitlement } = bootstrap.data;
const token = session.access_token;
check('signed admin + server Pro grant', session.user.app_metadata.role === 'admin' && entitlement.plan === 'pro' && entitlement.status === 'active');
const health = await request('/__dev/api/health');
check('isolated offline backend', health.data.db_path?.includes('.local-preview') && health.data.openai_configured === false && health.data.llm === 'template');
const billing = await request('/__dev/api/billing/config');
check('real checkout disabled', billing.data.configured === false);
const course = await request('/__dev/api/courses/monte-carlo/script', { token });
check('full paid course served by API', course.status === 200 && course.data.length > 15000);
const anonymous = await request('/__dev/api/courses/monte-carlo/script');
check('visitor cannot fetch paid script', [401, 403].includes(anonymous.status));
const corrupt = await request('/__dev/api/courses/monte-carlo/script', { token: `${token.slice(0, -4)}xxxx` });
check('forged session rejected', [401, 403].includes(corrupt.status));
const counts = await request('/__dev/api/platform/admin/counts', { token });
check('actual admin endpoint available', counts.status === 200 && counts.data.counts);
const nonce = `local-smoke-${Date.now()}`;
const progress = await request('/__dev/api/platform/progress', { token, method: 'POST', body: JSON.stringify({ kind: 'lesson', ref: nonce, user_id: 'forged-subject', username: 'forged-name' }) });
check('progress write', progress.status === 200);
const history = await request(`/__dev/api/platform/progress/${session.user.id}`, { token });
check('progress binds to signed identity', history.status === 200 && JSON.stringify(history.data).includes(nonce));
const other = await request('/__dev/api/platform/progress/forged-subject', { token });
check('other identity progress rejected', other.status === 403);
const thread = await request('/__dev/api/platform/community/threads', { token, method: 'POST', body: JSON.stringify({ title: `Test local ${nonce}`, body: 'Message de vérification dans la base de test.', author_id: 'forged-subject', channel: 'forum' }) });
const expectedAuthor = `member-${createHash('sha256').update(session.user.id).digest('hex').slice(0, 10)}`;
check('forum binds to signed identity', thread.status === 200 && thread.data.author === expectedAuthor);
const comment = await request(`/__dev/api/platform/community/threads/${thread.data.id}/comments`, { token, method: 'POST', body: JSON.stringify({ body: 'Réponse de test persistée.' }) });
const comments = await request(`/__dev/api/platform/community/threads/${thread.data.id}/comments`, { token });
check('forum response persisted', comment.status === 200 && JSON.stringify(comments.data).includes('Réponse de test persistée.'));
const badOrigin = await request('/__dev/session', { headers: { Origin: 'https://example.org' } });
check('cross-origin bootstrap denied', badOrigin.status === 403);
const fresh = await request('/__dev/session');
const persistent = await request(`/__dev/api/platform/progress/${session.user.id}`, { token: fresh.data.session.access_token });
check('new session preserves test activity', persistent.status === 200 && JSON.stringify(persistent.data).includes(nonce));
console.log(JSON.stringify({ verdict: 'PASS', count: checks.length, checks }, null, 2));
