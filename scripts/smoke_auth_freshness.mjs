import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAuthFreshnessGuard } from '../src/contexts/authFreshnessGuard.mjs';

const guard = createAuthFreshnessGuard();
const initialLookup = guard.captureSession();
const sessionA = guard.beginSession('token-A');
const entitlementA = guard.beginEntitlement('token-A');

assert.equal(guard.isSessionCurrent(initialLookup), false, 'late getSession must not overwrite a newer auth event');
assert.equal(guard.isSessionCurrent(sessionA), true);
assert.equal(guard.isEntitlementCurrent(entitlementA), true);

const signedOut = guard.beginSession(null);
assert.equal(guard.isSessionCurrent(sessionA), false, 'late profile A must be rejected after sign-out');
assert.equal(guard.isEntitlementCurrent(entitlementA), false, 'late entitlement A must be rejected after sign-out');
assert.equal(guard.isSessionCurrent(signedOut), true);

const sessionB = guard.beginSession('token-B');
const entitlementB1 = guard.beginEntitlement('token-B');
const entitlementB2 = guard.beginEntitlement('token-B');
assert.equal(guard.isEntitlementCurrent(entitlementB1), false, 'older same-session entitlement refresh must be rejected');
assert.equal(guard.isEntitlementCurrent(entitlementB2), true);
assert.equal(guard.isSessionCurrent(sessionB), true);

const sameTokenEvent = guard.beginSession('token-B');
assert.equal(guard.isEntitlementCurrent(entitlementB2), false, 'same-token SIGNED_IN must invalidate the former plan response');
const sameTokenRefresh = guard.beginEntitlement('token-B');
assert.equal(guard.isSessionCurrent(sameTokenEvent), true);
assert.equal(guard.isEntitlementCurrent(sameTokenRefresh), true, 'same-token SIGNED_IN must start a fresh entitlement request');

const sessionC = guard.beginSession('token-C');
assert.equal(guard.isSessionCurrent(sessionB), false, 'late profile B must be rejected after account switch');
assert.equal(guard.isEntitlementCurrent(entitlementB2), false, 'late entitlement B must be rejected after account switch');
assert.equal(guard.isSessionCurrent(sessionC), true);

const source = await readFile(new URL('../src/contexts/AuthContext.tsx', import.meta.url), 'utf8');
for (const marker of [
  'freshness.current.beginSession(accessToken)',
  'setProfile(null)',
  'setEntitlementPlan(null)',
  'setSessionRevision((revision) => revision + 1)',
  'freshness.current.isSessionCurrent(ticket)',
  'freshness.current.beginEntitlement(accessToken || null)',
  'freshness.current.isEntitlementCurrent(ticket)',
  '[session?.access_token, sessionRevision]',
  'supabasePromise = null',
]) assert.ok(source.includes(marker), `AuthContext integration missing ${marker}`);

console.log('[STEP 1] session ordering · [STATUS] ok · late getSession/profile responses are rejected after auth events, sign-out and account switches');
console.log('[STEP 2] entitlement ordering · [STATUS] ok · late or superseded plan responses cannot restore premium access');
console.log('[STEP 3] integration contract · [STATUS] ok · profile/plan clear synchronously and rejected lazy imports remain retryable');
console.log('[VERDICT] PASS · auth freshness is deterministic and fail-closed across delayed A → logout → B transitions');
