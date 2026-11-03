import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const [buildDirectory = 'dist', jsonOutput] = process.argv.slice(2);
const buildRoot = path.resolve(buildDirectory);
const manifest = JSON.parse(await readFile(path.join(buildRoot, '.vite/manifest.json'), 'utf8'));
const entry = manifest['index.html'];
assert.ok(entry?.isEntry, 'Missing Vite entry manifest');
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  const chunk = manifest[key];
  assert.ok(chunk, `Missing chunk metadata: ${key}`);
  initial.add(key);
  for (const dependency of chunk.imports || []) visit(dependency);
}
visit('index.html');
const markdownKey = Object.keys(manifest).find((key) => key.endsWith('/MarkdownMath.jsx'));
assert.ok(markdownKey && manifest[markdownKey].isDynamicEntry, 'Markdown must be a dynamic entry');
assert.equal(initial.has(markdownKey), false, 'Markdown must not be in the initial import graph');
const katexKey = Object.keys(manifest).find((key) => manifest[key].name === 'katex');
assert.ok(katexKey, 'Missing deferred KaTeX chunk');
assert.equal(initial.has(katexKey), false, 'KaTeX must not load on the homepage');

const initialChunks = [];
for (const key of initial) {
  const chunk = manifest[key];
  const data = await readFile(path.join(buildRoot, chunk.file));
  initialChunks.push({ file: chunk.file, bytes: data.length, gzipBytes: gzipSync(data).length });
  for (const css of chunk.css || []) {
    const content = await readFile(path.join(buildRoot, css), 'utf8');
    assert.doesNotMatch(content, /font-family\s*:\s*["']?KaTeX_/i, 'Course math fonts leaked into initial CSS');
  }
}
const assets = await readdir(path.join(buildRoot, 'assets'));
const scripts = [];
for (const file of assets.filter((name) => name.endsWith('.js'))) {
  const data = await readFile(path.join(buildRoot, 'assets', file));
  scripts.push({ file: `assets/${file}`, bytes: data.length });
  assert.ok(data.length <= 500000, `${file} exceeds the existing 500,000-byte production chunk budget`);
}
const initialGzipBytes = initialChunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
assert.ok(initialGzipBytes <= 256000, `Initial compressed JavaScript exceeds 250 KiB: ${initialGzipBytes}`);
const html = await readFile(path.join(buildRoot, 'index.html'), 'utf8');
assert.doesNotMatch(html, /lucide-static|unpkg\.com\/lucide/i, 'The blocking icon font must not be requested');
const summary = {
  scope: 'Static candidate artifact; not a production Lighthouse score.',
  initialChunks,
  initialJsBytes: initialChunks.reduce((sum, chunk) => sum + chunk.bytes, 0),
  initialJsGzipBytes: initialGzipBytes,
  deferredMarkdown: manifest[markdownKey].file,
  deferredKatex: manifest[katexKey].file,
  largestChunkBytes: Math.max(...scripts.map((item) => item.bytes)),
  scripts,
};
if (jsonOutput) {
  await mkdir(path.dirname(path.resolve(jsonOutput)), { recursive: true });
  await writeFile(jsonOutput, JSON.stringify(summary, null, 2));
}
console.log(JSON.stringify(summary, null, 2));
