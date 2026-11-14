import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendRoot = path.resolve(websiteRoot, '..', '..', 'Tools', 'pricinglibrary_rag_backend');
const completed = spawnSync(
  process.env.PYTHON || 'python',
  ['-m', 'pytest', '-q', '--basetemp=.pytest_mc_backend', 'tests/test_monte_carlo.py', 'tests/test_monte_carlo_compat.py'],
  { cwd: backendRoot, encoding: 'utf8', windowsHide: true },
);

assert.equal(completed.error, undefined, completed.error?.message);
assert.equal(completed.status, 0, `${completed.stdout}\n${completed.stderr}`);
assert.match(completed.stdout, /52 passed/);
console.log('[STEP 1] Canonical Python and backend adapters · [STATUS] ok · [OUTPUT] 52 pytest cases pass; canonical overflow and AG-UI/practice coercion, RNG, clamping and domain errors fail closed');
console.log('[VERDICT] PASS · F-CAL-6 backend consumers delegate to the versioned Python authority');
