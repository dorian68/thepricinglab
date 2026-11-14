import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

assert.equal(fs.existsSync(dist), true, 'production dist must exist; run the build first');

const retiredPublicAssets = [
  path.join(root, 'public', 'lovable-uploads', '3dce3f83-e875-47e1-8a3d-1c81196b0ed4.png'),
];
for (const asset of retiredPublicAssets) {
  assert.equal(fs.existsSync(asset), false, `retired public asset must remain private: ${path.relative(root, asset)}`);
  assert.equal(fs.existsSync(path.join(dist, path.relative(path.join(root, 'public'), asset))), false, `retired asset must not ship: ${path.relative(root, asset)}`);
}

const forbiddenMarkers = [
  'TRADING TERMINAL ACTIVATED',
  'What Our Users Say',
  'Curriculum designed in partnership with quantitative analysts from top investment banks',
  'Monthly live workshops',
  'Course completion certificates',
  '1-on-1 expert sessions',
  'Join thousands of professionals',
  'LinkedIn Integration',
  'Performance Reports',
  'Live Market Snapshot',
  'real backtests',
  'live market context',
];

const textFiles = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (/\.(?:html|js|css|json|txt|md|map)$/i.test(entry.name)) textFiles.push(full);
  }
}
collect(dist);

for (const file of textFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const marker of forbiddenMarkers) {
    assert.equal(content.includes(marker), false, `unsupported or retired trust marker leaked into ${path.relative(root, file)}: ${marker}`);
  }
}

const courseScripts = path.join(dist, 'course-scripts');
assert.equal(fs.existsSync(courseScripts), true, 'the free course preview must remain available');
assert.deepEqual(
  fs.readdirSync(courseScripts).sort(),
  ['vanilla-options-quote.md'],
  'only the free course preview may be shipped as a static course script',
);

assert.equal(fs.existsSync(path.join(dist, 'agent-room-kit')), false, 'retired Agent Room kit must not ship');
assert.deepEqual(
  fs.readdirSync(dist).filter((entry) => entry.startsWith('course-scripts_backup')),
  [],
  'paid course backup directories must not ship',
);

console.log(`FRONTEND TRUST ARTIFACT PASS: scanned ${textFiles.length} text assets; no unsupported claims or retired paid surfaces found`);
