import { spawnSync } from 'node:child_process';
import path from 'node:path';

const backend = path.resolve('../../Tools/pricinglibrary_rag_backend');
const python = process.env.PYTHON || 'python';
const run = spawnSync(python, ['-m', 'pytest', '-q', '--basetemp', '.pytest-tmp-black-scholes', 'tests/test_black_scholes.py'], { cwd: backend, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } });
process.stdout.write(run.stdout || ''); process.stderr.write(run.stderr || '');
if (run.status !== 0) process.exit(run.status ?? 1);
console.log('[VERDICT] PASS · F-CAL10 Python authority passed value, IV, limits, Greeks, evidence and strict-schema tests');
