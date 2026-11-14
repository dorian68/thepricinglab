import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

const [script, ...args] = process.argv.slice(2);
assert.ok(['audit_site_browser.mjs', 'smoke_delivery_browser.mjs'].includes(script), 'Use one of the delivery audit scripts');
await access(path.resolve('dist/index.html'));
const port = await new Promise((resolve, reject) => {
  const server = net.createServer(); server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => error ? reject(error) : resolve(port)); });
});
const base = `http://127.0.0.1:${port}`;
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
try {
  const deadline = Date.now() + 20000;
  let ready = false;
  while (Date.now() < deadline) {
    try { ready = (await fetch(base)).ok; } catch { /* Starting the owned preview. */ }
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.ok(ready, 'Production preview must start');
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join('scripts', script), ...args], { windowsHide: true, stdio: 'inherit', env: { ...process.env, TPL_AUDIT_BASE_URL: base } });
    child.once('error', reject); child.once('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = code;
} finally { preview.kill(); }
