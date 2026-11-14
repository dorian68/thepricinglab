import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const maxJavaScriptBytes = 500_000;
const assetsDirectory = path.resolve('dist/assets');

const names = await readdir(assetsDirectory);
const javascriptFiles = names.filter((name) => name.endsWith('.js'));

if (javascriptFiles.length === 0) {
  throw new Error(`No production JavaScript assets found in ${assetsDirectory}. Run the build first.`);
}

const assets = await Promise.all(javascriptFiles.map(async (name) => ({
  name,
  bytes: (await stat(path.join(assetsDirectory, name))).size,
})));
const oversized = assets.filter(({ bytes }) => bytes > maxJavaScriptBytes);
const largest = [...assets].sort((left, right) => right.bytes - left.bytes)[0];

console.log(`[STEP 1] production bundle budget · [STATUS] ${oversized.length ? 'fail' : 'ok'} · [INPUT] ${assets.length} minified JavaScript assets · [OUTPUT] largest=${largest.name}; bytes=${largest.bytes}; limit=${maxJavaScriptBytes}`);

if (oversized.length) {
  for (const asset of oversized) console.error(`[ERROR] ${asset.name} is ${asset.bytes} bytes`);
  process.exitCode = 1;
} else {
  console.log('[VERDICT] PASS · no production JavaScript chunk exceeds 500 kB');
}
