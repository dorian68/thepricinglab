import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const retiredDirectory = path.join(root, 'dist', 'agent-room-kit');
const publicDist = path.join(root, 'dist');
const leakedBackupDirectories = fs.existsSync(publicDist)
  ? fs.readdirSync(publicDist).filter((entry) => entry.startsWith('course-scripts_backup'))
  : [];

assert.equal(
  fs.existsSync(retiredDirectory),
  false,
  'retired public Agent Room design kit must not be present in the production build',
);
assert.deepEqual(
  leakedBackupDirectories,
  [],
  'paid course backup directories must not be present in the production build',
);

const retiredPath = '/agent-room-kit/ui_kits/trading_room/index.html';
const backupPath = '/course-scripts_backup_20260628-164708/vanilla-options-quote.md';

const devServer = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 4174 },
});
await devServer.listen();
try {
  const response = await fetch(`http://127.0.0.1:4174${retiredPath}`);
  assert.equal(response.status, 404, 'dev server must deny the retired Agent Room kit');
  const backupResponse = await fetch(`http://127.0.0.1:4174${backupPath}`);
  assert.equal(backupResponse.status, 404, 'dev server must deny paid course backup paths');
} finally {
  await devServer.close();
}

const previewServer = await preview({
  configFile: path.join(root, 'vite.config.ts'),
  preview: { host: '127.0.0.1', port: 4175 },
});
try {
  const response = await fetch(`http://127.0.0.1:4175${retiredPath}`);
  assert.equal(response.status, 404, 'preview server must deny the retired Agent Room kit');
  const backupResponse = await fetch(`http://127.0.0.1:4175${backupPath}`);
  assert.equal(backupResponse.status, 404, 'preview server must deny paid course backup paths');
} finally {
  await previewServer.httpServer.close();
}

console.log('RETIRED SURFACE FIREWALL PASS: legacy Agent Room and paid-course backup surfaces are absent from dist and denied by dev/preview');
