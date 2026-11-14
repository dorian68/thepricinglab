import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { preview } from 'vite';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}
const forbidden = ['__TPL_LOCAL_PREVIEW', '/__dev/', 'admin@local.tpl.test', 'Admin local · test', 'tpl-preview-toolbar', 'localPreview.role'];
const built = await files(path.resolve('dist'));
for (const file of built.filter((file) => /\.(?:js|css|html)$/.test(file))) {
  const contents = await readFile(file, 'utf8');
  for (const marker of forbidden) assert.equal(contents.includes(marker), false, `Production leak ${marker} in ${path.basename(file)}`);
}
assert.equal(built.some((file) => /LocalPreview|local_preview_api|\.sqlite3/.test(file)), false);
console.log('PASS production artifact has no local admin code, identity, endpoint or data');

const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true }, logLevel: 'silent' });
try {
  const address = server.httpServer.address();
  const base = `http://127.0.0.1:${address.port}`;
  for (const endpoint of ['/__dev/session', '/__dev/api/platform/admin/counts']) {
    const response = await fetch(`${base}${endpoint}`);
    assert.equal(response.status, 404, endpoint);
  }
  const html = await fetch(base).then((response) => response.text());
  assert.equal(html.includes('__TPL_LOCAL_PREVIEW'), false);
  console.log('PASS production preview exposes no bootstrap or test API');
} finally { await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve())); }
