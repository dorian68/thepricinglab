import { readFile } from 'node:fs/promises';

// Identity transport fixture only. Financial and persisted application responses
// are fetched from the actual isolated API. Never inject an absent app Bearer.
export async function signedTestContext(browser, { credentialPath, actor = 'pro', uiBase = 'http://127.0.0.1:5173', width = 1440, allowPyodide = false }) {
  const fixture = JSON.parse(await readFile(credentialPath, 'utf8'));
  if(!['127.0.0.1','localhost','[::1]'].includes(new URL(fixture.base_url).hostname))throw new Error('Signed browser fixtures must use a loopback API.');
  const identity = actor === 'visitor' ? null : fixture.identities[actor];
  if (actor !== 'visitor' && !identity) throw new Error('Unknown signed test actor.');
  const claims = identity ? JSON.parse(Buffer.from(identity.access_token.split('.')[1], 'base64url').toString()) : {};
  const now = new Date().toISOString();
  const sbHost = 'kjybaatgyigpqyywlmnw.supabase.co';
  const user = identity ? { id: identity.id, email: identity.email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: now, created_at: now, updated_at: now, app_metadata: { provider: 'email', providers: ['email'], ...claims.app_metadata }, user_metadata: { prenom: 'Audit', nom: actor }, identities: [] } : null;
  const session = identity ? { access_token: identity.access_token, refresh_token: 'isolated-test-fixture', expires_at: claims.exp, expires_in: claims.exp - Math.floor(Date.now()/1000), token_type: 'bearer', user } : null;
  const profile = user ? { id: user.id, prenom: 'Audit', nom: actor, role: user.app_metadata.role || 'member' } : null;
  const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 }, reducedMotion: 'reduce', acceptDownloads: true, serviceWorkers: 'block' });
  await context.addInitScript(({session}) => {
    if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    localStorage.setItem('tpl.localPreview.role.v1', 'real');
    if (session) {
      localStorage.setItem('sb-kjybaatgyigpqyywlmnw-auth-token', JSON.stringify(session));
      localStorage.setItem('sb-kjybaatgyigpqyywlmnw-auth-token-user', JSON.stringify({user:session.user}));
    }
  }, {session});
  const evidence = { api: [], blocked: [], errors: [] };
  const cors = { 'Access-Control-Allow-Origin': new URL(uiBase).origin, 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,content-profile,x-client-info', 'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS' };
  await context.route('**/*', async route => {
    try {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname === sbHost) {
      if (request.method() === 'OPTIONS') return await route.fulfill({status:204,headers:cors});
      if (url.pathname.startsWith('/rest/v1/profiles')) return await route.fulfill({status:200,headers:cors,json:request.headers().accept?.includes('object') ? profile : [profile].filter(Boolean)});
      if (url.pathname === '/auth/v1/user') return await route.fulfill({status:user?200:401,headers:cors,json:user||{message:'No test identity'}});
      if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') return await route.fulfill({status:session?200:401,headers:cors,json:session||{message:'No test session'}});
      if (url.pathname === '/auth/v1/logout') return await route.fulfill({status:204,headers:cors});
      return await route.fulfill({status:400,headers:cors,json:{message:'External authentication is outside this local fixture.'}});
    }
    const devApi = url.pathname.startsWith('/__dev/api/');
    if (devApi || url.hostname === 'tpl-api.optiquant-ia.com' || (url.hostname === '127.0.0.1' && ['8000',new URL(fixture.base_url).port].includes(url.port))) {
      const pathname = devApi ? url.pathname.replace(/^\/__dev\/api/,'') : url.pathname;
      const headers = {...request.headers()}; delete headers.host;
      const response = await route.fetch({url:fixture.base_url+pathname+url.search,headers,maxRedirects:0,timeout:30000});
      evidence.api.push({path:pathname+url.search,method:request.method(),status:response.status(),hadBearer:!!request.headers().authorization});
      return await route.fulfill({response,headers:{...response.headers(),...cors}});
    }
    if (['http:','https:'].includes(url.protocol) && !['127.0.0.1','localhost','[::1]'].includes(url.hostname)) {
      if(allowPyodide && request.method()==='GET' && url.hostname==='cdn.jsdelivr.net' && url.pathname.startsWith('/pyodide/v0.26.2/full/'))return await route.continue();
      evidence.blocked.push({origin:url.origin,path:url.pathname}); return await route.abort();
    }
    return await route.continue();
    } catch {
      // Context shutdown can interrupt route.fetch. Never print its exception:
      // Playwright may include request headers containing the fixture Bearer.
      if (!context.isClosed?.()) evidence.blocked.push({origin:'local-test-transport',path:'request interrupted'});
      try { await route.abort('failed'); } catch { /* The target already closed. */ }
    }
  });
  context.on('page',page=>page.on('pageerror',error=>evidence.errors.push(error.message)));
  return {context,evidence,apiBase:fixture.base_url};
}
