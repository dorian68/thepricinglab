import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.resolve(website, '..', '..', 'Tools', 'pricinglibrary_rag_backend');
const completed = spawnSync(process.env.PYTHON || 'python', ['-m', 'pytest', '-q', '--basetemp=.pytest_binomial_backend', 'tests/test_binomial.py'], { cwd: backend, encoding: 'utf8', windowsHide: true });
assert.equal(completed.error, undefined, completed.error?.message); assert.equal(completed.status, 0, `${completed.stdout}\n${completed.stderr}`); assert.match(completed.stdout, /29 passed/);
console.log('[STEP 1] canonical Python and AG-UI adapter · [STATUS] ok · [OUTPUT] 29 cases pass; steps preserved; coercion, invalid probability, expiry, zero-vol and admissible Greek boundaries fail closed');
console.log('[VERDICT] PASS · F-CAL-7 backend adapter delegates to the versioned Python authority');
