import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontend = fs.readFileSync(path.join(root, 'src/claude/ClaudeFrontend.jsx'), 'utf8');
const practice = fs.readFileSync(path.join(root, 'src/claude/practiceEngine.js'), 'utf8');
const authContext = fs.readFileSync(path.join(root, 'src/contexts/AuthContext.tsx'), 'utf8');
const adminGuard = fs.readFileSync(path.join(root, 'src/components/admin/AdminRouteGuard.tsx'), 'utf8');
const navbar = fs.readFileSync(path.join(root, 'src/components/Navbar.tsx'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'public/course-scripts/vanilla-options-quote.md'), 'utf8');
const publicBuild = path.join(root, 'dist/course-scripts');
const publicSource = path.join(root, 'public/course-scripts');
const publicAssets = path.join(root, 'dist/assets');

assert.ok(fs.existsSync(publicBuild), 'production build must exist before entitlement smoke');
assert.deepEqual(
  fs.readdirSync(publicBuild).sort(),
  ['vanilla-options-quote.md'],
  'the production web build must contain only the free preview asset',
);
assert.deepEqual(
  fs.readdirSync(publicSource).sort(),
  ['vanilla-options-quote.md'],
  'the frontend source tree must not contain paid course scripts or manifests',
);
assert.match(preview, /access: free-preview/);
assert.match(preview, /Full course access: Starter plan/);
assert.ok(preview.length < 8_000, 'the free preview must not silently become the full paid script');
const publicJsNames = fs.readdirSync(publicAssets).filter((name)=>name.endsWith('.js'));
const publicJs = publicJsNames.map((name)=>fs.readFileSync(path.join(publicAssets, name), 'utf8')).join('\n');
assert.ok(!publicJsNames.some((name)=>/^(lessonProse|derivations)-/.test(name)), 'paid enrichment must not be emitted as a public JavaScript chunk');
assert.ok(!publicJs.includes("Le desk vous donne un set d'instruments cotes"), 'paid yield-curve narrative leaked into the public bundle');
assert.ok(!publicJs.includes('La recursion construit la courbe pas a pas'), 'paid mathematical derivation leaked into the public bundle');
for (const marker of [
  'Bootstrapping without hand waving',
  'Bad quotes and no-arbitrage checks',
  'Asian and lookback intuition',
  'Scenario P&L attribution',
  'Delta-Gamma-Vega-Theta',
  'Variance payoff in P&L terms',
  'Barrier option payoff',
  'deskPromise',
  'relatedExerciseIds',
]) assert.ok(!publicJs.includes(marker), `paid course blueprint/widget leaked into public JavaScript: ${marker}`);

assert.match(frontend, /useCourseScript\(c\.id, locked, previewOnly\)/);
assert.match(frontend, /platformApi\.courseScript\(courseId\)/);
assert.match(frontend, /previewOnly \? <LockPanel required="starter" what="The full Black-Scholes script"/);
assert.ok(!frontend.includes("recordProgressOnce(auth, 'lesson', `${c.id}#L0`, 5"), 'loading a course must not complete it');
assert.ok(!frontend.includes("recordProgressOnce(auth, 'lesson', `${c.id}#L${index}`, 5"), 'opening a module must not complete it');
assert.match(frontend, /await recordProgressOnce\(auth, 'lesson'/, 'completion must await server confirmation');
assert.match(frontend, /if \(!result\?\.ok\) throw new Error/, 'unconfirmed completion must fail closed');
assert.match(frontend, /platformApi\.getProgress\(userId\)/, 'saved completion must be restored after refresh');
assert.match(frontend, /`\$\{uid\}:\$\{kind\}:\$\{ref\}`/, 'completion cache must be scoped to the authenticated user');

assert.match(authContext, /user\?\.app_metadata\?\.role === 'admin'/, 'admin authority must use the signed JWT claim');
assert.ok(!adminGuard.includes("profile.role === 'admin'"), 'admin route guard must not trust the editable profile');
assert.ok(!navbar.includes("user?.user_metadata?.role === 'admin'"), 'navigation must not trust editable user metadata');
assert.match(practice, /if \(!response\.ok\) throw new Error\(`Admin counts denied/, 'admin API denial must remain visible to the caller');
assert.match(frontend, /setCountsError\(error\.message/, 'admin API denial must be rendered instead of hidden');
assert.ok(!frontend.includes("import('./lessonProse')"), 'paid prose must be delivered with the authenticated course script');
assert.ok(!frontend.includes("import('./derivations')"), 'paid derivations must be delivered with the authenticated course script');
assert.ok(!frontend.includes('getCourseBlueprint('), 'paid course blueprints must not be linked into the public application graph');
for (const component of ['YCContent', 'GreeksContent', 'IVContent', 'ExoticsContent', 'MCContent']) {
  assert.ok(!frontend.includes(`<${component}`), `${component} must not be mounted from the public course shell`);
}
assert.match(frontend, /const result = await platformApi\.recordSurvival/, 'Survival save must wait for server confirmation');
assert.match(frontend, /Practice run was not saved/, 'Survival save failure must be visible');

for (const id of ['rates-swaps', 'fixed-income-bonds']) {
  const block = practice.slice(practice.indexOf(`id: '${id}'`), practice.indexOf(`id: '${id}'`) + 500);
  assert.match(block, /badge: 'starter'/, `${id} must be advertised as Starter`);
}

assert.match(frontend, /const sub = route\.parts\[1\] \|\| 'exercises'/);
assert.match(frontend, /sub==='backtest' && <GatedPage required="pro"/);

console.log('PASS entitlement contract: paid course assets private, catalog aligned, Backtest Pro-gated');
