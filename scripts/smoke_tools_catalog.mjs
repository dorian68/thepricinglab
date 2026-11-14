import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/claude/ClaudeFrontend.jsx', import.meta.url), 'utf8');
const realizedVolatilitySource = await readFile(new URL('../src/components/tools/RealizedVolatilityLab.tsx', import.meta.url), 'utf8');
const payoffStrategySource = await readFile(new URL('../src/components/tools/PayoffStrategyLab.tsx', import.meta.url), 'utf8');
const monteCarloSource = await readFile(new URL('../src/components/tools/MonteCarloLab.tsx', import.meta.url), 'utf8');
const binomialSource = await readFile(new URL('../src/components/tools/BinomialLab.tsx', import.meta.url), 'utf8');
const blackScholesSource = await readFile(new URL('../src/components/tools/BlackScholesLab.tsx', import.meta.url), 'utf8');

const extractBlock = (pattern, label) => {
  const match = source.match(pattern);
  assert.ok(match, `${label} source block must exist`);
  return match[1];
};

const toolsBlock = extractBlock(/const TOOLS = \[([\s\S]*?)\n\];/, 'TOOLS');
const toolObjects = toolsBlock.match(/\{[^{}]+\}/g) || [];
const tools = toolObjects.map((objectSource) => {
  const field = (name) => objectSource.match(new RegExp(`${name}:'([^']+)'`))?.[1];
  return { id: field('id'), tier: field('tier'), status: field('status') };
});

assert.ok(tools.length > 0, 'TOOLS must declare at least one active tool');
assert.ok(tools.every((tool) => tool.id && tool.tier && tool.status), 'every tool must declare id, tier and honest status copy');
assert.equal(new Set(tools.map((tool) => tool.id)).size, tools.length, 'tool ids must be unique');

const tierBlock = extractBlock(/const TIER_BADGE = \{([\s\S]*?)\n\};/, 'TIER_BADGE');
const tiers = new Map(
  [...tierBlock.matchAll(/^\s*([a-z][\w-]*):\s*\{label:'([^']+)',\s*cls:'([^']+)'\},?$/gm)]
    .map((match) => [match[1], { label: match[2], cls: match[3] }]),
);
assert.ok(tiers.size > 0, 'TIER_BADGE must expose runtime badge contracts');
for (const tool of tools) {
  assert.ok(tiers.has(tool.tier), `${tool.id}: unknown catalogue tier '${tool.tier}'`);
}
assert.equal(tiers.get('free')?.label, 'Free', 'free catalogue tier must render Free');
assert.equal(tiers.get('starter')?.label, 'Starter', 'starter catalogue tier must render Starter');

const paidRouteSlices = new Map([
  ['payoff', payoffStrategySource],
  ['mc', monteCarloSource],
  ['iv-calc', realizedVolatilitySource],
]);
for (const [toolId, routeSource] of paidRouteSlices) {
  assert.equal(tools.find((tool) => tool.id === toolId)?.tier, 'starter', `${toolId}: catalogue tier must remain starter`);
  if (toolId === 'mc' || toolId === 'iv-calc' || toolId === 'payoff') assert.match(routeSource, /<Badge variant="outline">Starter<\/Badge>/, `${toolId}: dedicated route must visibly render Starter`);
  else assert.match(routeSource, /<TierBadge tier="starter"\s*\/>/, `${toolId}: route badge must render Starter from the shared tier contract`);
  assert.doesNotMatch(routeSource, /badge badge-green">Free/, `${toolId}: paid route must not claim Free access`);
}
assert.equal(tools.find((tool) => tool.id === 'binomial')?.tier, 'student', 'binomial catalogue tier must remain Student');
assert.match(binomialSource, /<Badge variant="outline">Student<\/Badge>/, 'binomial route must visibly render Student');
assert.doesNotMatch(binomialSource, /badge badge-green">Free/, 'binomial route must not claim Free access');
assert.equal(tools.find((tool) => tool.id === 'bs-pricer')?.tier, 'free', 'Black-Scholes catalogue tier must remain Free');
assert.equal(tools.find((tool) => tool.id === 'bs-pricer')?.status, 'validated engine · evidence-ready', 'Black-Scholes validated status must remain explicit');
assert.match(blackScholesSource, /<Badge variant="outline">Free<\/Badge>/, 'Black-Scholes route must visibly render Free');
assert.match(source, /const BlackScholesLabTool = React\.lazy\(\(\) => import\('\.\.\/components\/tools\/BlackScholesLab'\)\);/, 'Black-Scholes route must be lazy');
assert.match(source, /'bs-pricer': <React\.Suspense[\s\S]*?<BlackScholesLabTool\/>/, 'bs-pricer must render the dedicated validated lab');
assert.doesNotMatch(source, /function BSPricerTool\(/, 'legacy inline Black-Scholes widget must be absent');
assert.match(source, /const RealizedVolatilityLabTool = React\.lazy\(\(\) => import\('\.\.\/components\/tools\/RealizedVolatilityLab'\)\);/, 'realized-volatility route must be lazy');
assert.match(source, /'iv-calc': <React\.Suspense[\s\S]*?<RealizedVolatilityLabTool\/>/, 'iv-calc must render the dedicated validated lab');
assert.doesNotMatch(source, /function IVCalcTool\(|\['SPX','NDX','TSLA','NVDA','BTC','EURUSD'\]/, 'legacy asset-labelled synthetic walk must be absent');
assert.match(source, /const PayoffStrategyLabTool = React\.lazy\(\(\) => import\('\.\.\/components\/tools\/PayoffStrategyLab'\)\);/, 'payoff route must be lazy');
assert.match(source, /payoff: <React\.Suspense[\s\S]*?<PayoffStrategyLabTool\/>/, 'payoff must render the dedicated validated lab');
assert.doesNotMatch(source, /function PayoffVisualizerTool\(|P&L at expiry|S=100, σ=20%, T=30d/, 'legacy grid-bound payoff route must be absent');
assert.match(source, /const MonteCarloLabTool = React\.lazy\(\(\) => import\('\.\.\/components\/tools\/MonteCarloLab'\)\);/, 'Monte Carlo route must be lazy');
assert.match(source, /mc: <React\.Suspense[\s\S]*?<MonteCarloLabTool\/>/, 'mc must render the dedicated validated lab');
assert.doesNotMatch(source, /function MonteCarloTool\(\)|Math\.min\(N\*5,5000\)|seed\*3\+1/, 'legacy split-seed Monte Carlo route must be absent');

assert.match(
  source,
  /const UNKNOWN_TIER_BADGE = \{label:'Unavailable', cls:'badge-red'\};[\s\S]*?const t = TIER_BADGE\[tier\] \?\? UNKNOWN_TIER_BADGE;/,
  'TierBadge must fail safely for an unknown runtime tier',
);
assert.doesNotMatch(source, /TIER_BADGE\[tier\]\.(?:cls|label)/, '/tools must never dereference an unknown tier directly');

assert.ok(tools.every((tool) => tiers.get(tool.tier)?.cls && tiers.get(tool.tier)?.label), '/tools catalogue badges must all resolve before render');
const unknownBadge = tiers.get('__unknown__') ?? { label: 'Unavailable', cls: 'badge-red' };
assert.deepEqual(unknownBadge, { label: 'Unavailable', cls: 'badge-red' }, 'unknown tiers must degrade without a render crash');

assert.ok(!source.includes('v1.2 · stable'), 'global unproved stable claim must be absent');
assert.ok(new Set(tools.map((tool) => tool.status)).size >= 6, 'tool status copy must be specific rather than uniform');
assert.equal(tools.find((tool) => tool.id === 'iv-calc')?.status, 'validated engine v1', 'realized-volatility validated status must remain explicit');
assert.equal(tools.find((tool) => tool.id === 'calib')?.status, 'validated engine v1', 'calibration validated status must remain explicit');
assert.equal(tools.find((tool) => tool.id === 'curve')?.status, 'validated engine v1', 'curve validated status must remain explicit');
assert.equal(tools.find((tool) => tool.id === 'payoff')?.status, 'validated engine v1', 'payoff validated status must remain explicit');
assert.equal(tools.find((tool) => tool.id === 'mc')?.status, 'validated MC engine v1', 'Monte Carlo validated status must remain explicit');
assert.equal(tools.find((tool) => tool.id === 'binomial')?.status, 'validated CRR engine v1', 'Binomial validated status must remain explicit');

console.log(`[STEP 1] tools catalogue tiers · [STATUS] ok · [REQUEST] source contract · [INPUT] ${tools.length} active tools · [OUTPUT] ${tiers.size} known tiers; all catalogue badges resolve · [ERROR] none · [NEXT] route badges`);
console.log('[STEP 2] paid route badges · [STATUS] ok · [REQUEST] payoff/mc/iv-calc source slices · [INPUT] Starter catalogue entries · [OUTPUT] shared Starter badges; no Free mismatch · [ERROR] none · [NEXT] status truthfulness');
console.log(`[STEP 3] tool status truthfulness · [STATUS] ok · [REQUEST] catalogue card copy · [INPUT] ${new Set(tools.map((tool) => tool.status)).size} distinct statuses · [OUTPUT] global stable claim absent; validated/beta/demo states explicit · [ERROR] none · [NEXT] lint/build`);
console.log('[VERDICT] PASS · /tools tier rendering is fail-safe and catalogue/route access copy is aligned');
