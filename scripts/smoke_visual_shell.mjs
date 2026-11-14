import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const fail = (step, request, error, next) => {
  console.error(`[STEP ${step}] ${request} · [STATUS] fail · [REQUEST] ${request} · [INPUT] repository source · [OUTPUT] contract not met · [ERROR] ${error} · [NEXT] ${next}`);
  process.exitCode = 1;
};
const pass = (step, request, output, next) => {
  console.log(`[STEP ${step}] ${request} · [STATUS] ok · [REQUEST] ${request} · [INPUT] repository source · [OUTPUT] ${output} · [ERROR] none · [NEXT] ${next}`);
};
const requireMarkers = (source, markers, label) => {
  const missing = markers.filter((marker) => !source.includes(marker));
  if (missing.length) throw new Error(`${label} missing: ${missing.join(', ')}`);
};
const tokenValue = (source, name) => source.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`, 'i'))?.[1]?.trim().toLowerCase();

const appSource = read('src/claude/ClaudeFrontend.jsx');
const shellCss = read('src/claude/claude.css');
const agentCss = read('src/agent/agent.css');
const agentDockSource = read('src/agent/AgentDock.jsx');
const appShellSource = read('src/App.tsx');
const baseCss = read('src/index.css');
const html = read('index.html');

try {
  requireMarkers(appSource, [
    'className="home-page"',
    'className="hero-grid home-hero"',
    'className="hero-secondary-grid"',
    'className="hero-trust-row"',
    'className="grid-4 audience-grid"',
    'className="audience-card-kicker mono"',
    'className="grid-3 curriculum-grid"',
    'className="grid-4 tools-grid"',
    'className="panel final-cta-panel"',
    'const ICONS = {',
    'const Glyph = ICONS[name];',
  ], 'semantic shell hooks');
  pass(1, 'semantic shell hooks', 'home, balanced hero, trust, typographic cards, CTA and SVG action-icon hooks present', 'validate composition balance');
} catch (error) {
  fail(1, 'semantic shell hooks', error.message, 'restore the restyle hooks in ClaudeFrontend.jsx');
}

try {
  const audienceCardStart = appSource.indexOf('className="panel audience-card"');
  const audienceCardEnd = appSource.indexOf('))}', audienceCardStart);
  const audienceCardSource = appSource.slice(audienceCardStart, audienceCardEnd);
  const heroBlockStart = appSource.indexOf('function HeroBlock()');
  const heroBlockEnd = appSource.indexOf('function BuiltForBlock()', heroBlockStart);
  const heroBlockSource = appSource.slice(heroBlockStart, heroBlockEnd);
  if (audienceCardStart < 0 || audienceCardEnd < 0 || audienceCardSource.includes('<Icon')) {
    throw new Error('audience card headers must remain typographic and icon-free');
  }
  if (heroBlockSource.includes("gridTemplateColumns:'1.4fr 1fr'")) {
    throw new Error('legacy narrow-column hero split is still present');
  }
  requireMarkers(appSource, [
    'data-hero-market-chart="true"',
    'const HERO_TARGET_SPOT = 5872.34;',
    'const raw = genWalk(120,100,',
  ], 'reproducible market chart');
  requireMarkers(shellCss, [
    '.hero-evidence-details summary{',
    '.hero-secondary-grid{',
    '.hero-path-stats{display:grid',
    '.audience-card-title{',
  ], 'balanced hero and card CSS');
  requireMarkers(agentCss, [
    'right: 24px; top: 23px; bottom: auto;',
    'width: 44px; height: 44px;',
  ], 'mobile assistant safe placement');
  requireMarkers(agentDockSource, [
    "import { Sparkles, X } from 'lucide-react';",
    '<Sparkles size={18} aria-hidden="true" />',
    '<X size={18} aria-hidden="true" />',
  ], 'assistant launcher action icon');
  requireMarkers(appShellSource, [
    "import { LoaderCircle, Sparkles } from 'lucide-react';",
    '<Sparkles size={18} aria-hidden="true" />',
    '<LoaderCircle className="agui-loader-icon" size={18} aria-hidden="true" />',
  ], 'deferred assistant launcher action icon');
  requireMarkers(appSource, ['<details className="hero-evidence-details">', '<summary>About this chart'], 'model evidence disclosure');
  pass(2, 'composition balance', 'reproducible market price paths are restored, chart context is optional, card headers are icon-free and the mobile launcher clears navigation', 'validate responsive visual layer');
} catch (error) {
  fail(2, 'composition balance', error.message, 'restore the balanced hero/card composition and safe launcher placement');
}

try {
  requireMarkers(shellCss, [
    '.home-hero{',
    '.hero-trust-row{',
    '.audience-card{',
    '.course-card{',
    '.curriculum-grid .course-card:last-child{',
    '.final-cta-panel{',
    '@media (max-width:760px)',
    '@media (max-width:480px)',
    '@media (prefers-reduced-motion:reduce)',
  ], 'responsive visual layer');
  pass(3, 'responsive visual layer', 'desktop, 760 px, 480 px and reduced-motion rules present', 'validate shared tokens');
} catch (error) {
  fail(3, 'responsive visual layer', error.message, 'restore responsive and motion-safe CSS');
}

try {
  const sharedTokens = ['bg', 'panel', 'panel-2', 'line', 'line-2', 'mute', 'text', 'text-2', 'red', 'green', 'amber', 'blue'];
  const mismatches = sharedTokens.filter((name) => {
    const synchronous = tokenValue(baseCss, name);
    const lazyShell = tokenValue(shellCss, name);
    return !synchronous || !lazyShell || synchronous !== lazyShell;
  });
  if (mismatches.length) throw new Error(`unsynchronised tokens: ${mismatches.join(', ')}`);
  pass(4, 'shared token parity', `${sharedTokens.length} synchronous/lazy tokens agree`, 'validate trust language');
} catch (error) {
  fail(4, 'shared token parity', error.message, 'align src/index.css and src/claude/claude.css');
}

try {
  requireMarkers(appSource, [
    'REFERENCE SNAPSHOT',
    'NOT LIVE MARKET DATA',
    'DETERMINISTIC DEMO',
    'Illustrative scenario · not a market feed',
    'They are not historical observations or current SPX quotes.',
  ], 'market-data honesty copy');
  pass(5, 'market-data honesty copy', 'reference snapshot, deterministic-demo and simulated market-data limits preserved', 'validate self-contained assets');
} catch (error) {
  fail(5, 'market-data honesty copy', error.message, 'restore the client-facing trust disclosures');
}

try {
  const externalFontPattern = /fonts\.(googleapis|gstatic)\.com|@import\s+url\(https?:/i;
  if (externalFontPattern.test(`${html}\n${baseCss}\n${shellCss}`)) {
    throw new Error('external font or CSS CDN introduced');
  }
  pass(6, 'self-contained visual assets', 'no external font/CSS dependency introduced', 'complete');
} catch (error) {
  fail(6, 'self-contained visual assets', error.message, 'remove the external visual dependency');
}

if (process.exitCode) {
  console.error('[VERDICT] FAIL · visual shell contract has blocking gaps');
} else {
  console.log('[VERDICT] PASS · visual shell is token-aligned, responsive, motion-safe and trust-preserving');
}
