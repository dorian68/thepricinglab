import { spawnSync } from 'node:child_process';
import path from 'node:path';

const backend = path.resolve('../../Tools/pricinglibrary_rag_backend');
const python = process.env.PYTHON || 'python';
const run = spawnSync(python, ['-m', 'pytest', '-q', 'tests/test_bond.py'], { cwd: backend, encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1' } });
process.stdout.write(run.stdout || ''); process.stderr.write(run.stderr || '');
if (run.status !== 0) process.exit(run.status ?? 1);
console.log('[VERDICT] PASS · F-CAL-8 Python authority passed schedule, price/yield, risk, export and strict-schema tests');
