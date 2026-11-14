import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const frontend = fs.readFileSync(path.join(root, 'src/claude/ClaudeFrontend.jsx'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'src/contexts/AuthContext.tsx'), 'utf8');
const kit = fs.readFileSync(path.join(root, 'public/market-finance-starter-kit/index.html'), 'utf8');
const localeText = ['en.json', 'fr.json']
  .map((file) => fs.readFileSync(path.join(root, 'src/i18n/locales', file), 'utf8'))
  .join('\n');

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS ${message}`);
}

const suite = process.argv[2] || 'all';

if (suite === 'all' || suite === 'pricing') {
  check(frontend.includes("tier:'starter'") && frontend.includes("tier:'student'"), 'paid tool tiers are explicit');
  check(frontend.includes("FREE_COURSE_IDS = new Set(['black-scholes'])"), 'free course preview is explicit');
  check(frontend.includes("id:'yield-curves'") && frontend.match(/id:'yield-curves'[^\n]*badge:'starter'/), 'Yield Curves catalogue badge matches Starter access');
  check(frontend.includes("id:'greeks'") && frontend.match(/id:'greeks'[^\n]*badge:'starter'/), 'Option Greeks catalogue badge matches Starter access');
  check(!frontend.includes("id:'vol-products'") && !frontend.includes("id:'hedging'"), 'catalogue does not sell duplicate course identities');
  check(frontend.includes("'vol-products': 'implied-vol'") && frontend.includes("hedging: 'greeks'"), 'legacy duplicate course URLs redirect to canonical courses');
  check(frontend.includes('Sales disabled') && frontend.includes('!LEGAL_READY'), 'checkout UI fails closed without legal identity');
}

if (suite === 'all' || suite === 'activation') {
  check(frontend.includes("path==='/billing/success'") && frontend.includes("path==='/billing/cancel'"), 'checkout return routes exist');
  check(frontend.includes('session?.access_token') && frontend.includes('getEntitlement(token)'), 'billing synchronisation uses the signed session token');
  check(!frontend.includes('startCheckout(planKey, authEmail)'), 'checkout does not send a browser-supplied identity');
}

if (suite === 'all' || suite === 'entitlements') {
  const gates = [
    ['starter', 'The exercise workspace'],
    ['student', 'Trading Lab'],
    ['student', 'Survival Mode'],
    ['student', 'Browser notebooks'],
    ['pro', 'The private API preview'],
    ['pro', 'The agentic desk'],
  ];
  for (const [plan, feature] of gates) {
    check(frontend.includes(`required=\"${plan}\" what=\"${feature}\"`), `${feature} requires ${plan}`);
  }
  check(!auth.includes('user_metadata.plan'), 'signup metadata cannot grant a paid plan');
  check(auth.includes("const plan = (entitlementPlan || 'free')"), 'billing entitlement is the paid-plan source');
  check(frontend.includes("const plan = (auth?.plan || 'free').toUpperCase()"), 'dashboard displays the authoritative entitlement plan');
}

if (suite === 'all' || suite === 'legal') {
  for (const route of ['terms', 'privacy', 'refund', 'legal', 'contact', 'cancel']) {
    check(frontend.includes(`path==='/${route}'`) || frontend.includes(`path===\"/${route}\"`), `${route} route exists`);
  }
  check(frontend.includes('VITE_TPL_LEGAL_NAME') && frontend.includes('VITE_TPL_LEGAL_REGISTRATION'), 'operator identity is environment-configured');
}

if (suite === 'all' || suite === 'starter-kit') {
  check(kit.includes('noindex,nofollow'), 'unfinished Starter Kit is not indexed');
  check(kit.includes("PAS EN VENTE") && !kit.includes('data-cta='), 'unfinished Starter Kit cannot start checkout');
  check((kit.match(/data-deliverable=/g) || []).length === 7, 'Starter Kit publishes exactly seven numbered deliverables');
  check(kit.includes('7 / 7 livrables préparés') && kit.includes('La vente publique est désactivée'), 'Starter Kit exposes its verified release state and commercial gate');
  check(kit.includes('6.120654') && kit.includes('0.556231'), 'Starter Kit golden case is published correctly');
  check(frontend.includes("path==='/starter-kit'") && frontend.includes('StarterKitPage'), 'authenticated Starter Kit workspace route exists');
  check(frontend.includes('STARTER_KIT_SALES_ENABLED') && frontend.includes('LEGAL_READY') && frontend.includes('SOURCE_RIGHTS_CLEARED'), 'Starter Kit checkout requires explicit commercial, legal and source-rights gates');
  check(frontend.includes('salesGuard={STARTER_KIT_SALES_GUARD}'), 'Starter Kit workspace receives the fail-closed sales guard');
  const N = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  const erf = (x) => {
    const sign = x < 0 ? -1 : 1; x = Math.abs(x);
    const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;
    const t=1/(1+p*x);
    return sign*(1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x));
  };
  const d1 = (0.02 + 0.5 * 0.2 ** 2) * 0.5 / (0.2 * Math.sqrt(0.5));
  const d2 = d1 - 0.2 * Math.sqrt(0.5);
  const price = 100 * N(d1) - 100 * Math.exp(-0.02 * 0.5) * N(d2);
  check(Math.abs(price - 6.120654) < 2e-5, 'Black-Scholes golden calculation is reproducible');
}

if (suite === 'all' || suite === 'trust') {
  const forbidden = ['MKT · OPEN', "['Submissions','156']", "value=\"312\"", "value=\"78.4%\"", 'Answer C is closest'];
  for (const value of forbidden) check(!frontend.includes(value), `trust marker absent: ${value}`);
  check(!frontend.includes("author:'L. Martin'") && !frontend.includes("author:'S. Okafor'"), 'synthetic blog personas are absent');
  check(!frontend.includes('submitStub(`Mentoring booking') && !frontend.includes('mentoring package`'), 'mentoring has no simulated booking or purchase CTA');
  const legacyClaims = [
    'TRADING TERMINAL ACTIVATED',
    'What Our Users Say',
    'Curriculum designed in partnership with quantitative analysts from top investment banks',
    'Monthly live workshops',
    'Course completion certificates',
    '1-on-1 expert sessions',
    'Join thousands of professionals',
    'LinkedIn Integration',
    'Performance Reports'
  ];
  for (const value of legacyClaims) check(!localeText.includes(value), `obsolete or unsupported marketing claim absent: ${value}`);
}

console.log(`Business audit suite '${suite}' complete.`);
