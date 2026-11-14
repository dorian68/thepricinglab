import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isUnsafeNavigationTarget } from '../src/security/navigationGuard.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(scriptDirectory, '../src/security/NavigationSecurityBoundary.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const navigateSource = fs.readFileSync(
  path.resolve(scriptDirectory, '../src/security/useSafeNavigate.ts'),
  'utf8',
);

const unsafeTargets = [
  '//evil.example/account',
  '\\\\evil.example\\account',
  '/courses%5C%5Cevil',
  'javascript:alert(1)',
  'JaVaScRiPt%3Aalert(1)',
  'data:text/html,<svg/onload=alert(1)>',
  'file:///etc/passwd',
];
const safeTargets = [
  '/',
  '/courses?level=beginner#fundamentals',
  '?tab=overview',
  '#pricing',
  'https://thepricinglibrary.com/legal',
  'mailto:contact@thepricinglibrary.com',
];

for (const target of unsafeTargets) assert.equal(isUnsafeNavigationTarget(target), true, target);
for (const target of safeTargets) assert.equal(isUnsafeNavigationTarget(target), false, target);

assert.match(source, /document\.addEventListener\('click'/);
assert.match(source, /stopImmediatePropagation\(\)/);
assert.match(source, /blocked unsafe navigation target/);
assert.doesNotMatch(source, /console\.warn\([^\n]*href/);
assert.match(navigateSource, /isUnsafeNavigationTarget/);
assert.match(navigateSource, /blocked unsafe programmatic navigation target/);
assert.doesNotMatch(navigateSource, /console\.warn\([^)]*,\s*(?:target|to)/);

console.log(`NAVIGATION SECURITY PASS: ${unsafeTargets.length} unsafe targets blocked; ${safeTargets.length} safe targets accepted; click and programmatic guards installed`);
