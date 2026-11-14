import { spawn, type ChildProcess } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import net from 'node:net';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

const ID = '00000000-0000-4000-8000-000000000001';
const EMAIL = 'admin@local.tpl.test';
const isLoopback = (host: string) => ['localhost', '127.0.0.1', '::1', '[::1]', '::ffff:127.0.0.1'].includes(host);
const reply = (res: ServerResponse, status: number, data: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
};

export function localPreviewPlugin(): Plugin {
  let config: ResolvedConfig;
  let enabled = false;
  let preview = false;
  let child: ChildProcess | undefined;
  let starting: Promise<number> | undefined;
  let backendPort = 0;
  let stopping = false;
  const secret = randomBytes(48).toString('base64url');

  async function startApi() {
    if (backendPort && child && child.exitCode === null && !child.killed) return backendPort;
    if (starting) return starting;
    starting = (async () => {
      const port = await new Promise<number>((resolve, reject) => {
        const socket = net.createServer();
        socket.on('error', reject);
        socket.listen(0, '127.0.0.1', () => {
          const address = socket.address() as net.AddressInfo;
          socket.close(() => resolve(address.port));
        });
      });
      const backend = path.resolve(config.root, '../../Tools/pricinglibrary_rag_backend');
      const allow = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'COMSPEC', 'PATHEXT', 'LANG', 'LC_ALL']);
      const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => allow.has(key.toUpperCase())));
      const processApi = spawn(process.env.TPL_LOCAL_PYTHON || 'python', [path.join(backend, 'scripts/local_preview_api.py'), '--port', String(port)], {
        cwd: backend, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...env, TPL_LOCAL_PREVIEW: '1', TPL_LOCAL_PREVIEW_SECRET: secret, PYTHONIOENCODING: 'utf-8' },
      });
      child = processApi;
      let failure = '';
      processApi.on('error', (error) => { failure = error.message; });
      processApi.stderr?.on('data', (data) => { failure = String(data).slice(-2000); });
      processApi.stdout?.on('data', (data) => config.logger.info(String(data).trim()));
      processApi.on('exit', () => { if (child === processApi) backendPort = 0; });
      for (let attempt = 0; attempt < 300 && !stopping; attempt++) {
        if (processApi.exitCode !== null || failure.startsWith('spawn ')) break;
        try {
          const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(800) });
          if (response.ok) { backendPort = port; return port; }
        } catch { /* Python is still starting. */ }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      processApi.kill();
      config.logger.error(`[local-preview] API unavailable. ${failure || 'Startup timed out.'}`);
      throw new Error('API locale indisponible. Vérifie Python et les dépendances du backend, puis réessaie.');
    })().finally(() => { starting = undefined; });
    return starting;
  }

  function authorized(req: IncomingMessage) {
    try {
      const host = new URL(`http://${req.headers.host}`).hostname;
      if (!isLoopback(host) || !isLoopback(req.socket.remoteAddress || '')) return false;
      if (req.headers['sec-fetch-site'] === 'cross-site') return false;
      if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return false;
      return true;
    } catch { return false; }
  }

  async function handle(req: IncomingMessage, res: ServerResponse) {
    if (!enabled || !authorized(req)) { reply(res, 403, { detail: 'Local preview is restricted to loopback development.' }); return; }
    const endpoint = (req.url || '').split('?')[0];
    if (endpoint === '/__dev/session') {
      if (req.method !== 'GET') { reply(res, 405, { detail: 'GET required.' }); return; }
      try {
        const port = await startApi();
        const learner = new URL(req.url || '/', 'http://localhost').searchParams.get('role') === 'learner';
        const previewId = learner ? '00000000-0000-4000-8000-000000000002' : ID;
        const previewEmail = learner ? 'learner@local.tpl.test' : EMAIL;
        const expires = Math.floor(Date.now() / 1000) + 3600;
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ sub: previewId, email: previewEmail, role: learner ? 'member' : 'operator', exp: expires })).toString('base64url');
        const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
        const token = `${header}.${payload}.${signature}`;
        const entitlement = await fetch(`http://127.0.0.1:${port}/billing/entitlement`, { headers: { Authorization: `Bearer ${token}` } });
        if (!entitlement.ok) throw new Error('Local entitlement unavailable.');
        const access = await entitlement.json() as { plan: string; status: string };
        if (!learner && (access.plan !== 'pro' || access.status !== 'active')) throw new Error('Local Pro entitlement missing.');
        const previewName = learner ? 'Learner' : 'Admin';
        const user = { id: previewId, email: previewEmail, aud: 'authenticated', role: 'authenticated', app_metadata: { role: learner ? 'user' : 'admin', provider: 'local-preview' }, user_metadata: { prenom: previewName, nom: 'local' }, created_at: '2026-11-10T00:00:00Z' };
        reply(res, 200, {
          session: { access_token: token, token_type: 'bearer', expires_in: 3600, expires_at: expires, refresh_token: '', user },
          profile: { id: previewId, email: previewEmail, prenom: previewName, nom: 'local', plan: access.plan, role: learner ? 'user' : 'admin', date_inscription: user.created_at },
          entitlement: access,
        });
      } catch (error) { reply(res, 503, { detail: error instanceof Error ? error.message : 'Local API unavailable.' }); }
      return;
    }
    if (!endpoint.startsWith('/__dev/api/')) { reply(res, 404, { detail: 'Not found.' }); return; }
    try {
      const port = await startApi();
      const headers = { ...req.headers, host: `127.0.0.1:${port}` };
      delete headers.origin;
      delete headers.referer;
      const upstream = http.request({ hostname: '127.0.0.1', port, path: (req.url || '').slice('/__dev/api'.length), method: req.method, headers }, (response) => {
        res.writeHead(response.statusCode || 502, { ...response.headers, 'cache-control': 'no-store' });
        response.pipe(res);
      });
      upstream.on('error', () => { if (!res.headersSent) reply(res, 503, { detail: 'API locale indisponible. Réessaie.' }); else res.destroy(); });
      req.on('aborted', () => upstream.destroy());
      res.on('close', () => upstream.destroy());
      req.pipe(upstream);
    } catch { reply(res, 503, { detail: 'API locale indisponible. Réessaie.' }); }
  }

  return {
    name: 'tpl-local-admin-preview',
    config(_config, environment) { preview = Boolean(environment.isPreview); },
    configResolved(resolved) {
      config = resolved;
      const host = resolved.server.host;
      enabled = resolved.command === 'serve' && !preview && resolved.mode !== 'production'
        && process.env.TPL_LOCAL_ADMIN !== 'false' && typeof host === 'string' && isLoopback(host);
    },
    transformIndexHtml() {
      if (!enabled) return;
      return [{ tag: 'script', injectTo: 'head-prepend', children: `window.__TPL_LOCAL_PREVIEW_ENABLED__=true;try{window.__TPL_LOCAL_PREVIEW_MODE__=localStorage.getItem('tpl.localPreview.role.v1')||'admin'}catch{window.__TPL_LOCAL_PREVIEW_MODE__='admin'}` }];
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url || '').startsWith('/__dev/')) void handle(req, res);
        else next();
      });
      server.httpServer?.on('close', () => { stopping = true; child?.stdin?.end(); child?.kill(); });
      if (enabled) config.logger.info('[local-preview] Admin local par défaut · données de test isolées.');
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url || '').startsWith('/__dev/')) reply(res, 404, { detail: 'Not found.' });
        else next();
      });
    },
  };
}
