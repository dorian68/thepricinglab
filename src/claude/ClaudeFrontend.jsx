import React from 'react';
import AuthenticationPage from './AuthenticationPage';
import InterviewPilotMetrics from './InterviewPilotMetrics';
import ForumWorkspace from './ForumWorkspace';
import { StrategyPayoffFigure, SimulationComparison } from './LabIllustrations';
import { shortStrangleScenario } from '../lib/teachingScenarios.mjs';
import { interviewProgressView,learningProgressView } from '../lib/learnerProgress.mjs';
import LearningActivity from './LearningActivity';
import { loadPracticeReference } from '../lib/practiceReferenceCatalog.mjs';
import { AboutPage, ServiceUnavailable, RouteMetadata, downloadExercise, downloadExerciseMarkdown } from './DeliverySupport';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Bookmark,
  Braces,
  Briefcase,
  Building2,
  Calculator,
  Check,
  ChevronRight,
  Circle,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  Code2,
  Copy,
  CreditCard,
  Crown,
  Database,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Handshake,
  HelpCircle,
  LayoutDashboard,
  Library,
  Lightbulb,
  Linkedin,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  Medal,
  Menu,
  MessageSquareText,
  Paperclip,
  Play,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sigma,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Terminal,
  TriangleAlert,
  Trophy,
  Twitter,
  User,
  Users,
  Video,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToolRegister } from '../agent/toolControl';
import { runPython, cancelPython } from './pyodideRunner';
import { loadDeskSeries, pickCourseSeries, SYMBOL_ALIAS } from './marketSeries';
import { getCourseLayout, showMarketOnLesson } from './courseLayouts';
import { COURSE_MANIFEST, COURSE_SCRIPT_SLUGS, CHAPTER_COUNTS } from './courseManifest';
import { blackScholesOption, normCdf as canonicalNormCdf, normPdf as canonicalNormPdf } from '../lib/blackScholes.mjs';
import {
  GENERATOR_PRESETS,
  PRACTICE_EXERCISES,
  SURVIVAL_QUESTIONS,
  exerciseDescription,
  generateAiDeskExercise,
  getExerciseById,
  getEntitlement,
  getPracticeApiBase,
  loadGeneratedExercises,
  platformApi,
  saveGeneratedExercise,
  cacheGeneratedExercises,
  exerciseFromRecord,
  exerciseModeLabel,
  startCheckout,
  strategyApi,
} from './practiceEngine';

const AgentRoomReal = React.lazy(() => import('../agent/AgentRoomReal'));
const InterviewLab = React.lazy(() => import('./InterviewLab'));
const NotebookWorkspace = React.lazy(() => import('./NotebookWorkspace'));
const ServerSurvival = React.lazy(() => import('./ServerSurvival'));
const ExerciseAttemptPanel = React.lazy(() => import('./ExerciseAttempt'));
const PracticeReferencePanel = React.lazy(() => import('./PracticeReference'));
const StarterKitPage = React.lazy(() => import('./StarterKitPage'));
const CourseMarkdown = React.lazy(() => import('./CourseMarkdown'));
const ModelCalibrationTool = React.lazy(() => import('../components/tools/ModelCalibration'));
const YieldCurveBuilderTool = React.lazy(() => import('../components/tools/YieldCurveBuilder'));
const RealizedVolatilityLabTool = React.lazy(() => import('../components/tools/RealizedVolatilityLab'));
const PayoffStrategyLabTool = React.lazy(() => import('../components/tools/PayoffStrategyLab'));
const MonteCarloLabTool = React.lazy(() => import('../components/tools/MonteCarloLab'));
const BinomialLabTool = React.lazy(() => import('../components/tools/BinomialLab'));
const BondLabTool = React.lazy(() => import('../components/tools/BondLab'));
const VolSurfaceLabTool = React.lazy(() => import('../components/tools/VolSurfaceLab'));
const BlackScholesLabTool = React.lazy(() => import('../components/tools/BlackScholesLab'));
import './claude.css';


// ===== src\lib.jsx =====
// Shared utilities, mock data, and small UI atoms
const { useState, useEffect, useMemo, useRef, useCallback } = React;

function notify(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('tpl:notify', { detail: { message, type } }));
}

function ToastStack() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onNotify = (event) => {
      const id = Date.now() + Math.random();
      const item = { id, type: event.detail?.type || 'success', message: event.detail?.message || 'Action completed.' };
      setItems((current) => [...current.slice(-3), item]);
      window.setTimeout(() => setItems((current) => current.filter((x) => x.id !== id)), 3200);
    };

    window.addEventListener('tpl:notify', onNotify);
    return () => window.removeEventListener('tpl:notify', onNotify);
  }, []);

  if (!items.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast ${item.type}`}>
          <Icon name={item.type === 'error' ? 'circle-alert' : item.type === 'warning' ? 'triangle-alert' : 'check'} size={14}/>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  );
}

function FormNotice({type = 'success', children}) {
  if (!children) return null;
  return (
    <div className={`form-notice ${type}`} role={type==='error'?'alert':'status'}>
      <Icon name={type === 'error' ? 'circle-alert' : 'check'} size={14}/>
      <span>{children}</span>
    </div>
  );
}

async function copyText(value, success = 'Copied to clipboard.') {
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(value);
    notify(success);
  } catch {
    notify('Clipboard access is unavailable in this browser.', 'warning');
  }
}

function handleSave(label) {
  notify(`${label}: this action is unavailable. Nothing was saved.`, 'warning');
}

function handleShare(label) {
  copyText(window.location.href, `${label} link copied.`);
}

function submitStub(label) {
  notify(`${label} queued for backend processing.`);
}

const LEGAL_IDENTITY = {
  name: import.meta.env.VITE_TPL_LEGAL_NAME || '',
  formCapital: import.meta.env.VITE_TPL_LEGAL_FORM_CAPITAL || '',
  address: import.meta.env.VITE_TPL_LEGAL_ADDRESS || '',
  registration: import.meta.env.VITE_TPL_LEGAL_REGISTRATION || '',
  vat: import.meta.env.VITE_TPL_LEGAL_VAT || '',
  phone: import.meta.env.VITE_TPL_LEGAL_PHONE || '',
  publisher: import.meta.env.VITE_TPL_PUBLICATION_DIRECTOR || '',
  host: import.meta.env.VITE_TPL_HOST_NOTICE || '',
  mediator: import.meta.env.VITE_TPL_CONSUMER_MEDIATOR || '',
  email: import.meta.env.VITE_TPL_SUPPORT_EMAIL || '',
};
const LEGAL_READY = Boolean(LEGAL_IDENTITY.name && LEGAL_IDENTITY.formCapital && LEGAL_IDENTITY.address && LEGAL_IDENTITY.registration && LEGAL_IDENTITY.vat && LEGAL_IDENTITY.phone && LEGAL_IDENTITY.publisher && LEGAL_IDENTITY.host && LEGAL_IDENTITY.mediator && LEGAL_IDENTITY.email);
const LEGAL_SUPPORT_CONTACT = LEGAL_IDENTITY.email || 'the support contact published in the legal notice before sales open';
const STARTER_KIT_PRICE_EUR = Number(import.meta.env.VITE_TPL_STARTER_KIT_PRICE_EUR || 0);
const STARTER_KIT_SALES_ENABLED = import.meta.env.VITE_TPL_STARTER_KIT_SALES_ENABLED === 'true';
const SOURCE_RIGHTS_CLEARED = import.meta.env.VITE_TPL_SOURCE_RIGHTS_CLEARED === 'true';
const STARTER_KIT_SALES_GUARD = {
  legalReady: LEGAL_READY,
  salesEnabled: STARTER_KIT_SALES_ENABLED,
  sourceRightsCleared: SOURCE_RIGHTS_CLEARED,
  priceEur: Number.isFinite(STARTER_KIT_PRICE_EUR) && STARTER_KIT_PRICE_EUR > 0 ? STARTER_KIT_PRICE_EUR : null,
};

function SupportLink({subject = '', children, className = 'btn btn-outline btn-sm'}) {
  if (!LEGAL_IDENTITY.email) return <span className="badge badge-amber">Support contact not configured</span>;
  return <a className={className} href={`mailto:${LEGAL_IDENTITY.email}?subject=${encodeURIComponent(subject)}`}>{children}</a>;
}

// ---------- Routing ----------
const COURSE_ROUTE_ALIASES = {
  'black-scholes': 'black-scholes',
  'yield-curves': 'yield-curves',
  greeks: 'greeks',
  'implied-vol': 'implied-vol',
  'vol-products': 'implied-vol',
  'exotic-options': 'exotics',
  exotics: 'exotics',
  'monte-carlo': 'monte-carlo',
  'stochastic-calculus': 'stochastic',
  stochastic: 'stochastic',
  'hedging-strategies': 'greeks',
  hedging: 'greeks',
};

const TOOL_ROUTE_ALIASES = {
  'black-scholes': 'bs-pricer',
  'bs-pricer': 'bs-pricer',
  'payoff-visualizer': 'payoff',
  payoff: 'payoff',
  'monte-carlo': 'mc',
  mc: 'mc',
  'model-calibration': 'calib',
  calib: 'calib',
  'volatility-calculator': 'iv-calc',
  'iv-calc': 'iv-calc',
  'vol-surface': 'volsurface',
  volsurface: 'volsurface',
};

function normalizePath(rawPath) {
  if (!rawPath || rawPath === '') return '/';
  const path = rawPath.replace(/\/+$/, '');
  return path || '/';
}

function mapLegacyPath(rawPath) {
  const path = normalizePath(rawPath);
  const parts = path.split('/').filter(Boolean);

  if (path === '/login') return '/auth/login';
  if (path === '/signup') return '/auth/signup';
  if (path === '/bug-report') return '/bug';
  if (path === '/api-docs') return '/api';
  if (path === '/admin-login' || path === '/admin-dashboard') return '/admin';
  if (path === '/exercices') return '/exercises';
  if (path === '/survival-mode') return '/survival';
  if (path.startsWith('/survival-mode/wave/')) return `/survival/${parts[2] || 'advanced'}`;
  if (path.startsWith('/survival-mode/')) return `/survival/${parts[1] || 'advanced'}`;
  if (path === '/labo-trading') return '/lab';
  if (path === '/quant-pro-tools') return '/tools';
  if (path === '/rapports') return '/dashboard';
  if (path === '/vol-surface' || path === '/VolSurface') return '/tools/volsurface';
  if (path === '/courses/fundamentals' || path === '/courses/advanced' || path === '/courses/complex') return '/courses';
  if (path === '/quizzes') return '/courses';
  if (path === '/projects') return '/community/projects';
  if (path === '/community/notebook-workspace') return '/notebooks';
  if (path.startsWith('/community/article/')) return '/community/publications';
  if (path.startsWith('/community/strategy/')) return '/community/projects';

  if (parts[0] === 'courses' && parts.length > 1) {
    const slug = COURSE_ROUTE_ALIASES[parts[parts.length - 1]];
    if (slug) return `/courses/${slug}`;
  }

  if (parts[0] === 'tools' && parts.length > 1) {
    const slug = TOOL_ROUTE_ALIASES[parts[parts.length - 1]];
    if (slug) return `/tools/${slug}`;
  }

  if (parts[0] === 'trading') {
    const sub = parts[1] === 'exercises' ? 'exercises' : (parts[1] || 'backtest');
    return `/lab/${sub}`;
  }

  if (parts[0] === 'community') {
    const communityAliases = {
      chat: 'forum',
      forum: 'forum',
      contribute: 'publications',
      explore: 'publications',
      playground: 'projects',
      'strategy-builder': 'projects',
      'pair-programming': 'forum',
      'weekly-challenge': 'forum',
    };
    if (parts[1] && communityAliases[parts[1]]) return `/community/${communityAliases[parts[1]]}`;
  }

  return path;
}

function useHashRoute() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  return useMemo(() => {
    const path = mapLegacyPath(location.pathname);
    const query = (location.search || '').replace(/^\?/, '');
    const parts = path.split('/').filter(Boolean);
    return { path, parts, query, originalPath: location.pathname };
  }, [location.pathname, location.search]);
}
function nav(path) {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
// Bridge the app router to the AG-UI agent: the `navigate` tool, the "Ouvrir le
// pricer/visualizer" buttons, and cross-page set_tool_params all read window.nav.
// Without this assignment they were silent no-ops (and the agent painted a fake
// "Navigation done"). Same pushState+popstate the app already uses internally.
if (typeof window !== 'undefined') window.nav = nav;
function Link({to, children, className, style, onClick, ...props}) {
  return <RouterLink {...props} to={to} className={className} style={style} onClick={onClick}>{children}</RouterLink>;
}

// ---------- Lucide icon ----------
const ICONS = {
  activity: Activity,
  'arrow-right': ArrowRight,
  award: Award,
  bell: Bell,
  'book-open': BookOpen,
  bookmark: Bookmark,
  braces: Braces,
  briefcase: Briefcase,
  'building-2': Building2,
  calculator: Calculator,
  check: Check,
  'check-circle': CircleCheck,
  'chevron-right': ChevronRight,
  circle: Circle,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'clipboard-check': ClipboardCheck,
  code: Code2,
  copy: Copy,
  'credit-card': CreditCard,
  crown: Crown,
  database: Database,
  'external-link': ExternalLink,
  'file-text': FileText,
  github: Github,
  'graduation-cap': GraduationCap,
  'help-circle': HelpCircle,
  library: Library,
  lightbulb: Lightbulb,
  linkedin: Linkedin,
  'layout-dashboard': LayoutDashboard,
  'loader-circle': LoaderCircle,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  medal: Medal,
  menu: Menu,
  'message-square-text': MessageSquareText,
  paperclip: Paperclip,
  play: Play,
  plus: Plus,
  quote: Quote,
  risk: ShieldCheck,
  'rotate-ccw': RotateCcw,
  sales: Handshake,
  search: Search,
  send: Send,
  'shield-check': ShieldCheck,
  sigma: Sigma,
  sliders: SlidersHorizontal,
  'sliders-horizontal': SlidersHorizontal,
  sparkles: Sparkles,
  star: Star,
  target: Target,
  terminal: Terminal,
  trader: Briefcase,
  'triangle-alert': TriangleAlert,
  trophy: Trophy,
  twitter: Twitter,
  user: User,
  users: Users,
  video: Video,
  x: X,
  youtube: Youtube,
  zap: Zap,
};

function Icon({name, size=14, style, className}) {
  const Glyph = ICONS[name];
  const classes = `icon icon-${name} ${className || ''}`;
  if (!Glyph) {
    return <span className={classes} aria-hidden="true" style={{display:'inline-block',width:size,height:size,flexShrink:0,...style}} />;
  }
  return <Glyph className={classes} aria-hidden="true" focusable="false" size={size} strokeWidth={1.8} style={{flexShrink:0,...style}}/>;
}

// ---------- Math: Black-Scholes ----------
const normCdf = canonicalNormCdf;
const normPdf = canonicalNormPdf;

function bsPrice({S,K,r,q=0,sigma,T,type='call'}){
  const option = blackScholesOption({spot:S, strike:K, maturityYears:T, riskFreeRate:r, dividendYield:q, volatility:sigma, optionType:type});
  return {price:option.price, ...option.greeks, d1:option.d1 ?? 0, d2:option.d2 ?? 0};
}

// ---------- Pretty number ----------
const fmt = (n, d=2) => {
  if (!isFinite(n)) return '—';
  return n.toLocaleString('en-US',{minimumFractionDigits:d, maximumFractionDigits:d});
};
const fmtPct = (n,d=2) => (n>=0?'+':'') + (n*100).toFixed(d) + '%';
const fmtBp = (n) => (n>=0?'+':'') + Math.round(n*10000) + 'bp';

// ---------- Mock data: ticker ----------
const TICKER = [
  {sym:'SPX',  px:5872.34, chg: 0.31},
  {sym:'NDX',  px:20431.71, chg: 0.58},
  {sym:'VIX',  px:14.21, chg: -2.41},
  {sym:'DXY',  px:104.62, chg: -0.12},
  {sym:'UST10Y', px:4.281, chg: 0.022, isYield:true},
  {sym:'BUND10Y', px:2.412, chg: -0.018, isYield:true},
  {sym:'JGB10Y', px:1.052, chg: 0.005, isYield:true},
  {sym:'EURUSD', px:1.0832, chg: -0.21},
  {sym:'USDJPY', px:154.21, chg: 0.18},
  {sym:'GBPUSD', px:1.2682, chg: 0.07},
  {sym:'WTI',  px:71.42, chg: 1.21},
  {sym:'BRENT', px:75.18, chg: 1.05},
  {sym:'GOLD', px:2641.30, chg: -0.42},
  {sym:'SILVER', px:30.81, chg: 0.18},
  {sym:'BTC',  px:97231.50, chg: 2.18},
  {sym:'ETH',  px:3412.20, chg: 1.71},
  {sym:'TSLA', px:328.61, chg: -1.42},
  {sym:'NVDA', px:142.18, chg: 0.92},
  {sym:'AAPL', px:228.41, chg: 0.21},
];

// Legacy catalogue removed from the active path; the manifest below is the
// only catalogue used by the application.
/* legacy course snapshot retained only for migration reference; active UI uses COURSE_MANIFEST
const LEGACY_COURSES = [
  // FUNDAMENTALS
  {id:'black-scholes', title:'Black-Scholes Model', tier:'Fundamentals', level:'L1', duration:'3h', modules:8, badge:'free-preview',
   tagline:'Closed-form pricing for European options, from PDE to code.',
   topics:['PDE derivation','d1/d2','Risk-neutral measure','Implementation','Limitations'],
   accent:'#19C37D'},
  {id:'yield-curves', title:'Yield Curves', tier:'Fundamentals', level:'L1', duration:'3h 40m', modules:9, badge:'starter',
   tagline:'Bootstrapping, zero rates, forward curves, bond pricing.',
   topics:['Bootstrapping','Zero-coupon','Forward rates','Discount factors'],
   accent:'#3E8BFF'},
  {id:'greeks', title:'Option Greeks', tier:'Fundamentals', level:'L2', duration:'3h 30m', modules:9, badge:'starter',
   tagline:'Delta, Gamma, Vega, Theta, Rho — measure & manage risk.',
   topics:['Delta hedging','Gamma scalping','Vega risk','Theta decay'],
   accent:'#FFB020'},
  // ADVANCED
  {id:'implied-vol', title:'Implied Volatility Analysis', tier:'Advanced', level:'L3', duration:'3h 40m', modules:9, badge:'student',
   tagline:'Smile, skew, term structure & surface construction.',
   topics:['Smile/skew','Term structure','SVI','Arbitrage-free surfaces'],
   accent:'#FF2E45'},
  // COMPLEX
  {id:'exotics', title:'Exotic Options', tier:'Complex', level:'L4', duration:'3h 50m', modules:9, badge:'pro',
   tagline:'Barriers, Asians, lookbacks, autocallables. Path matters.',
   topics:['Barriers','Asians','Lookbacks','Autocallables'],
   accent:'#3E8BFF'},
  {id:'monte-carlo', title:'Monte Carlo Methods', tier:'Complex', level:'L4', duration:'4h', modules:10, badge:'pro',
   tagline:'GBM paths, variance reduction, convergence, VaR/ES.',
   topics:['GBM','Antithetic','Control variates','VaR/ES'],
   accent:'#FFB020'},
  {id:'stochastic', title:'Stochastic Calculus', tier:'Complex', level:'L5', duration:'4h 20m', modules:10, badge:'pro',
   tagline:"Itô's lemma, SDEs, measure changes — the math behind it all.",
   topics:["Itô's lemma","SDE","Girsanov","Martingales"],
   accent:'#FF2E45'},
];

const COURSES = COURSE_MANIFEST;

const LEGACY_COURSE_SCRIPT_SLUGS = {
  'black-scholes': 'vanilla-options-quote',
  'greeks': 'options-book-greeks-pnl',
  'rates-swaps': 'rates-swaps-dv01',
  'yield-curves': 'yield-curve-bootstrapping',
  'implied-vol': 'implied-volatility-smile',
  'monte-carlo': 'monte-carlo-pricing',
  'exotics': 'barrier-options-gap-risk',
  'structured-products': 'structured-products-autocall',
  'credit-derivatives': 'credit-derivatives-cds',
  'market-risk-var': 'market-risk-var-stress',
  'fixed-income-bonds': 'fixed-income-bonds-duration',
  'stochastic': 'stochastic-calculus-for-hedging',
};

// Real teaching-chapter count per course (counted from the Hull-level scripts —
// the 0-Hook → 8-Source-map structure, minus meta sections). Drives the catalog
// card so the displayed module count is truthful, not a hardcoded guess.
const LEGACY_CHAPTER_COUNTS = {
  'black-scholes': 8, 'yield-curves': 9, 'greeks': 9, 'implied-vol': 9,
  'exotics': 9, 'monte-carlo': 10, 'stochastic': 10,
}; */

// The canonical manifest is the only active catalogue source. Keep this alias
// outside the archived migration snapshot so every active page resolves it at
// runtime, including the home page and course routes.
const COURSES = COURSE_MANIFEST;

const TOOLS = [
  {id:'bs-pricer', name:'Black-Scholes Pricing & IV Lab', cat:'Calculators', tier:'free', status:'validated engine · evidence-ready', desc:'European call/put pricing, strict implied volatility, signed Greeks, exact scenarios and SHA-bound exports.', engine:'Canonical Black-Scholes v1', inputs:'spot, strike, maturity, rates, dividend, volatility/market price, position', conventions:'continuous rates; USD-style quote; signed position and multiplier', assumptions:'European exercise; continuous carry; risk-neutral pricing', limits:'European vanilla only; no executable market quote', diagnostics:'parity, intrinsic value, monotonicity and IV convergence', evidence:'JSON/CSV export plus local run history', courseId:'black-scholes', exerciseId:'bs-eur-call'},
  {id:'payoff', name:'Payoff Strategy Lab', cat:'Visualizers', tier:'starter', status:'validated engine v1', desc:'Exact premium-aware terminal P&L, analytical tails, breakevens and signed Greeks.', engine:'Canonical payoff v1.0.1', inputs:'strategy legs, strikes, premiums, spot grid, multiplier', conventions:'terminal P&L; premium-inclusive; long/short signed', assumptions:'path-independent terminal payoff; stated multiplier and currency', limits:'unsupported path-dependent exotics fail closed', diagnostics:'tails, bounds, roots, breakevens and signed Greeks', evidence:'JSON/two-CSV exports plus immutable run history', courseId:'greeks', exerciseId:'options-book-greeks'},
  {id:'mc', name:'Monte Carlo Pricing & Risk Lab', cat:'Simulators', tier:'starter', status:'validated MC engine v1', desc:'Explicit P/Q GBM, loss VaR/ES, option pricing uncertainty and reproducible evidence.', engine:'Seeded Monte Carlo v1.0.0', inputs:'spot, strike, maturity, rates, volatility, paths, seed, measure', conventions:'P/Q explicit; loss is non-negative; confidence/error shown', assumptions:'GBM dynamics; declared timestep, seed and payoff', limits:'GBM/Asian scope; model risk and discretisation remain', diagnostics:'CI, standard error, convergence and benchmark comparison', evidence:'JSON/CSV path evidence plus local run history', courseId:'monte-carlo', exerciseId:'mc-asian'},
  {id:'iv-calc', name:'Realized Volatility Lab', cat:'Calculators', tier:'starter', status:'validated engine v1', desc:'Five OHLC estimators, local data-quality diagnostics and evidence exports.', engine:'OHLC realized-vol v1', inputs:'dated OHLC rows, estimator, annualisation, rolling window', conventions:'price units; 252/365 annualisation explicit', assumptions:'historical OHLC observations; no forecast or implied quote', limits:'historical estimate, not implied volatility or forecast', diagnostics:'missing dates, OHLC consistency, warnings and estimator comparison', evidence:'deterministic JSON/CSV export plus run history', courseId:'implied-vol', exerciseId:'realized-vol-estimators'},
  {id:'calib', name:'Model Calibration', cat:'Calculators', tier:'student', status:'validated engine v1', desc:'Fit Black, SABR, Heston to market smiles.', engine:'Black-76 / SABR / Fourier Heston v1', inputs:'dated smile CSV, forward, rates, model and bounds', conventions:'market smile snapshot; residuals and fit diagnostics retained', assumptions:'input smile is a dated snapshot; bounded model family', limits:'calibration is not a price forecast; data quality/model risk apply', diagnostics:'residuals, fit improvement, parameter bounds and arbitrage checks', evidence:'CSV/JSON export plus actual run history', courseId:'implied-vol', exerciseId:'smile-fit'},
  {id:'binomial', name:'American Option & CRR Lattice Lab', cat:'Calculators', tier:'student', status:'validated CRR engine v1', desc:'Fail-closed CRR pricing, exercise frontier, convergence, Greeks and reproducible evidence.', engine:'CRR lattice v1.0.0', inputs:'spot, strike, maturity, rate, dividend, volatility, steps, position', conventions:'European/American; discrete exercise; signed Greeks', assumptions:'recombining CRR tree; declared exercise and dividend conventions', limits:'CRR domain and requested step limits are enforced', diagnostics:'probability bounds, convergence, frontier and Greeks', evidence:'JSON/CSV evidence plus SHA-bound run history', courseId:'exotics', exerciseId:'barrier-knock-in'},
  {id:'volsurface', name:'Volatility Surface Quality & Interpolation Lab', cat:'Visualizers', tier:'student', status:'validated surface engine v1', desc:'Total variance, in-grid interpolation, smile metrics and discrete static-arbitrage diagnostics.', engine:'Total-variance surface v1.0.0', inputs:'dated strike/expiry/volatility grid, forward, interpolation point', conventions:'k=ln(K/F); w=sigma²T; no silent repair', assumptions:'rectangular dated snapshot; no hidden filling or smoothing', limits:'in-grid interpolation only; diagnostics are discrete checks', diagnostics:'vertical, butterfly, calendar and missing-grid flags', evidence:'points/diagnostics CSV plus JSON and run history', courseId:'implied-vol', exerciseId:'smile-fit'},
  {id:'bond', name:'Fixed-Rate Bond Pricing & Risk Lab', cat:'Calculators', tier:'starter', status:'validated bond engine v1', desc:'Clean/dirty pricing, accrued interest, YTM inversion, cash flows, DV01 and exact scenarios.', engine:'Fixed-rate bond v1.0.0', inputs:'coupon, maturity, settlement, yield, frequency, day count, position', conventions:'clean/dirty identity; ACT/ACT ICMA or 30E/360; signed DV01', assumptions:'fixed coupon; declared day-count and settlement convention', limits:'fixed-rate bonds; calendars and credit/liquidity risk excluded', diagnostics:'cash-flow identity, YTM inversion, DV01 and shock residuals', evidence:'cash-flow/scenario CSV plus JSON and run history', courseId:'fixed-income-bonds', exerciseId:'bond-duration'},
  {id:'curve', name:'Yield Curve Builder', cat:'Calculators', tier:'starter', status:'validated engine v1', desc:'Bootstrap deposits, FRAs, adjusted futures and sparse par swaps with exact repricing.', engine:'Mono-curve bootstrap v1', inputs:'dated instruments, quotes, calendars/conventions, interpolation', conventions:'discount factors/log-DF; exact repricing residuals', assumptions:'educational mono-curve and declared interpolation', limits:'no OIS/projection multi-curve or extrapolation', diagnostics:'repricing residuals, DF positivity and forward stability', evidence:'curve JSON/CSV export plus local run history', courseId:'yield-curves', exerciseId:'curve-boot'},
];

const TIER_BADGE = {
  free:    {label:'Free', cls:'badge-green'},
  'free-preview': {label:'Free preview', cls:'badge-green'},
  starter: {label:'Starter', cls:'badge-green'},
  student: {label:'Student', cls:'badge-blue'},
  pro:     {label:'Pro', cls:'badge-red'},
};
const UNKNOWN_TIER_BADGE = {label:'Unavailable', cls:'badge-red'};

// Blog posts are loaded from the persisted platform API; no synthetic authors or dates.
const POSTS = [];

// ---------- Mock: exercises ----------
const EXERCISES = PRACTICE_EXERCISES;

Object.assign(window, {
  useHashRoute, nav, Link, Icon, normCdf, normPdf, bsPrice, fmt, fmtPct, fmtBp,
  TICKER, COURSES, TOOLS, TIER_BADGE, POSTS, EXERCISES,
  useState, useEffect, useMemo, useRef, useCallback,
});


// ===== src\shell.jsx =====
// Shell: Top strip / ticker / header / footer / chat
function TopStrip() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('en-US',{hour12:false, timeZone:'UTC'}) + ' UTC';
  return (
    <div className="top-strip">
      <div className="top-strip-inner">
        <div className="row" style={{gap:14, flexShrink:0}}>
          <span><span className="dot" style={{marginRight:6}}></span>REFERENCE SNAPSHOT</span>
          <span className="mute">NOT LIVE MARKET DATA</span>
          <span>{time}</span>
        </div>
        <Ticker />
        <div className="row" style={{gap:14, flexShrink:0}}>
          <span>v.2026.05.23</span>
          <span className="mute">build 0x4F71</span>
        </div>
      </div>
    </div>
  );
}

function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.map((t,i)=>(
          <div className="ticker-item" key={i}>
            <span className="sym">{t.sym}</span>
            <span className="px">{t.isYield ? t.px.toFixed(3) : fmt(t.px, t.px>1000?0:2)}</span>
            <span className={t.chg>=0?'green':'red'}>{t.isYield ? fmtBp(t.chg/100) : fmtPct(t.chg/100,2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  {to:'/courses', label:'Courses'},
  {to:'/tools', label:'Tools'},
  {to:'/interview', label:'Interview Lab'},
  {to:'/lab', label:'Trading Lab'},
  {to:'/agent-room', label:'Agent Room'},
  {to:'/community', label:'Community'},
  {to:'/blog', label:'Blog'},
];

function BrandSignature({horizontal=false}) {
  return <img className={"brand-signature"+(horizontal?' brand-signature-horizontal':'')} src={horizontal?'/brand/thepricinglibrary-horizontal.svg':'/brand/thepricinglibrary.svg'} alt="The Pricing Library" width={horizontal?1422.69:841} height={horizontal?180:401} decoding="async" data-brand-logo="true"/>;
}

function Header({route}) {
  const [drawer, setDrawer] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const exploreRef = useRef(null);
  const exploreTrigger = useRef(null);
  const accountRef = useRef(null);
  const accountTrigger = useRef(null);
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const isActive = (to) => route.path === to || route.path.startsWith(to+'/');
  const displayName = profile?.prenom || user?.email?.split('@')[0] || 'Desk';
  const closeDrawer = () => setDrawer(false);
  const primaryItems = NAV_ITEMS.slice(0, 3);
  const exploreItems = [...NAV_ITEMS.slice(3), {to:'/pricing', label:'Plans & pricing'}];
  useEffect(() => {
    setAccountOpen(false); setExploreOpen(false);
  }, [route.path]);
  useEffect(() => {
    if (!accountOpen) return;
    const outside = (event) => { if (!accountRef.current?.contains(event.target)) setAccountOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { setAccountOpen(false); accountTrigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [accountOpen]);
  useEffect(() => {
    if (!exploreOpen) return;
    const onPointerDown = (event) => {
      if (!exploreRef.current?.contains(event.target)) setExploreOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setExploreOpen(false);
        exploreTrigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [exploreOpen]);
  useEffect(() => {
    if (!drawer) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.getElementById('mobile-navigation');
    dialog?.querySelector('button[aria-label="Close menu"]')?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDrawer(false);
      if (event.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll('a[href], button:not([disabled])'));
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [drawer]);
  const handleSignOut = async () => {
    await signOut();
    notify('Signed out.');
    closeDrawer();
    nav('/');
  };
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand" aria-label="The Pricing Library home">
            <BrandSignature horizontal/>
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            {primaryItems.map(n => (
              <Link key={n.to} to={n.to} aria-current={isActive(n.to)?'page':undefined} className={"nav-link " + (isActive(n.to)?'active':'')}>{n.label}</Link>
            ))}
            <div className="nav-explore" ref={exploreRef} onBlur={(event)=>{if (!event.currentTarget.contains(event.relatedTarget)) setExploreOpen(false);}}>
              <button ref={exploreTrigger} className={"nav-link nav-explore-trigger " + (exploreItems.some(n=>isActive(n.to))?'active':'')} aria-expanded={exploreOpen} aria-controls="explore-navigation" onClick={()=>setExploreOpen(value=>!value)}>Explore <Icon name="chevron-right" size={12}/></button>
              {exploreOpen && <div id="explore-navigation" className="nav-explore-panel">
                <span className="micro">Keep exploring</span>
                {exploreItems.map(n=><Link key={n.to} to={n.to} onClick={()=>setExploreOpen(false)} aria-current={isActive(n.to)?'page':undefined}><span>{n.label}</span><Icon name="arrow-right" size={13}/></Link>)}
              </div>}
            </div>
          </nav>
          <div className="nav-right">
            {isAuthenticated && <Link to="/dashboard" className="btn btn-ghost btn-sm nav-dashboard" style={{padding:'6px 10px'}}>
              <Icon name="layout-dashboard" size={13}/> Dashboard
            </Link>}
            {isAuthenticated ? (
              <div className="nav-explore nav-account" ref={accountRef} onBlur={(event)=>{if (!event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false);}}>
                <button ref={accountTrigger} className="btn btn-outline btn-sm nav-login" aria-label={`Account: ${displayName}`} aria-expanded={accountOpen} aria-controls="account-navigation" onClick={()=>setAccountOpen(value=>!value)}>
                  <Icon name="user" size={13}/> {displayName}
                </button>
                {accountOpen && <div id="account-navigation" className="nav-explore-panel" role="group" aria-label="Account actions">
                  <Link to="/account">Account & access <Icon name="user" size={13}/></Link>
                  <Link to="/dashboard">Learning activity <Icon name="layout-dashboard" size={13}/></Link>
                  <Link to="/contact">Contact & support <Icon name="mail" size={13}/></Link>
                  <button className="btn btn-ghost" onClick={handleSignOut}><Icon name="log-out" size={13}/> Sign out</button>
                </div>}
              </div>
            ) : (
              <>
                <Link to="/auth/login" className="btn btn-outline btn-sm nav-login">Log in</Link>
                <Link to="/tools/bs-pricer" className="btn btn-primary btn-sm nav-signup">Start free<span className="nav-cta-arrow"><Icon name="arrow-right" size={13}/></span></Link>
              </>
            )}
            <button className="btn btn-ghost btn-sm mobile-menu-btn" onClick={()=>setDrawer(true)} aria-label="Open menu" aria-expanded={drawer} aria-controls="mobile-navigation">
              <Icon name="menu" size={16}/>
            </button>
          </div>
        </div>
      </header>
      {drawer && (
        <div className="mobile-drawer-backdrop" onClick={closeDrawer}>
          <aside id="mobile-navigation" className="mobile-drawer" role="dialog" aria-modal="true" onClick={(event)=>event.stopPropagation()} aria-label="Mobile navigation">
            <div className="row between" style={{padding:'16px 18px',borderBottom:'1px solid var(--line)'}}>
              <Link to="/" className="brand" onClick={closeDrawer}>
                <BrandSignature horizontal/>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={closeDrawer} aria-label="Close menu"><Icon name="x" size={16}/></button>
            </div>
            <div className="mobile-drawer-body">
              {NAV_ITEMS.map((n) => (
                <Link key={n.to} to={n.to} onClick={closeDrawer} aria-current={isActive(n.to)?'page':undefined} className={"mobile-drawer-link " + (isActive(n.to)?'active':'')}>
                  <span>{n.label}</span>
                  <Icon name="arrow-right" size={13}/>
                </Link>
              ))}
              <div className="hairline" style={{margin:'12px 0'}}></div>
              <Link to="/dashboard" onClick={closeDrawer} className="mobile-drawer-link"><span>Dashboard</span><Icon name="layout-dashboard" size={13}/></Link>
              <Link to="/pricing" onClick={closeDrawer} className="mobile-drawer-link"><span>Pricing</span><Icon name="credit-card" size={13}/></Link>
              <Link to="/api" onClick={closeDrawer} className="mobile-drawer-link"><span>API Docs</span><Icon name="braces" size={13}/></Link>
              {isAuthenticated ? (
                <><Link to="/account" onClick={closeDrawer} className="mobile-drawer-link"><span>Account & access</span><Icon name="user" size={13}/></Link><button onClick={handleSignOut} className="mobile-drawer-link">
                  <span>Sign out · {displayName}</span>
                  <Icon name="log-out" size={13}/>
                </button></>
              ) : (
                <div className="row" style={{gap:8,marginTop:14}}>
                  <Link to="/auth/login" onClick={closeDrawer} className="btn btn-outline" style={{flex:1,justifyContent:'center'}}>Log in</Link>
                  <Link to="/auth/signup" onClick={closeDrawer} className="btn btn-primary" style={{flex:1,justifyContent:'center'}}>Sign up</Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function NewsletterStrip() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('Enter a valid email address.');
      notify('Enter a valid email address.', 'warning');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await platformApi.subscribe(email, 'home-newsletter');
      setStatus('You are on the list.');
      notify('Subscription confirmed.');
      setEmail('');
    } catch (error) {
      setStatus('Subscription is temporarily unavailable.');
      notify(`Could not subscribe (${error.message}).`, 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="news-strip home-news-strip" aria-label="The Pricing Letter" onSubmit={submit}>
      <span className="micro" style={{color:'var(--red)'}}>The Pricing Letter</span>
      <span className="mute" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11.5}}>
        Pricing, risk and quant interview practice. Free subscription.
      </span>
      <div style={{flex:1}}></div>
      {status && <span role="status" className="mono text-2" style={{fontSize:11}}>{status}</span>}
      <input type="email" aria-label="Email for The Pricing Letter" autoComplete="email" required value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@desk.com" style={{background:'#06080B',border:'1px solid var(--line-2)',color:'var(--text)',padding:'5px 10px',borderRadius:3,fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,width:200}}/>
      <button className="btn btn-outline btn-sm" type="submit" disabled={busy}>{busy?'Subscribing…':'Subscribe'}</button>
    </form>
  );
}

function Footer() {
  return (
    <footer className="site">
      <div className="foot-grid">
        <div>
          <Link to="/" className="brand" style={{marginBottom:14}}>
            <BrandSignature/>
          </Link>
          <p className="text-2" style={{maxWidth:'34ch',marginTop:14,fontSize:12.5,lineHeight:1.6}}>
            An applied platform for option pricing & quantitative finance — courses, calculators, simulators and a community of practitioners.
          </p>
          <div className="row" style={{marginTop:16,gap:12}}>
            <a className="mute" href="https://github.com/thepricinglibrary" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon name="github" size={14}/></a>
            <a className="mute" href="https://www.linkedin.com/company/thepricinglibrary" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Icon name="linkedin" size={14}/></a>
            <a className="mute" href="https://x.com/thepricinglib" target="_blank" rel="noreferrer" aria-label="X"><Icon name="twitter" size={14}/></a>
            <a className="mute" href="https://www.youtube.com/@thepricinglibrary" target="_blank" rel="noreferrer" aria-label="YouTube"><Icon name="youtube" size={14}/></a>
          </div>
        </div>
        <div>
          <h5>Platform</h5>
          <ul>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/lab">Trading Lab</Link></li>
            <li><Link to="/exercises">Exercises</Link></li>
            <li><Link to="/survival">Survival Mode</Link></li>
            <li><Link to="/leaderboard">Leaderboard</Link></li>
          </ul>
        </div>
        <div>
          <h5>Tools</h5>
          <ul>
            <li><Link to="/tools/bs-pricer">Black-Scholes Pricer</Link></li>
            <li><Link to="/tools/payoff">Payoff Visualizer</Link></li>
            <li><Link to="/tools/mc">Monte Carlo</Link></li>
            <li><Link to="/tools/calib">Calibration</Link></li>
            <li><Link to="/tools">All Tools</Link></li>
          </ul>
        </div>
        <div>
          <h5>Resources</h5>
          <ul>
            <li><Link to="/blog">Blog</Link></li>
            <li><Link to="/notebooks">Notebooks</Link></li>
            <li><Link to="/jobs">Quant Jobs</Link></li>
            <li><Link to="/mentoring">Mentoring</Link></li>
            <li><Link to="/api">API Docs</Link></li>
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/community">Community</Link></li>
            <li><Link to="/bug">Report a bug</Link></li>
            <li><Link to="/contact">Contact & support</Link></li>
            <li><Link to="/legal">Legal notice</Link></li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <div>© 2026 The Pricing Library · All rights reserved</div>
        <div className="row" style={{gap:18}}>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/refund">Refund policy</Link>
          <Link to="/cancel">Cancel contract</Link>
          <span>Educational platform · Not investment advice</span>
        </div>
      </div>
    </footer>
  );
}

function ChatFab() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const send = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    notify('TA request queued. A sandbox response has been prepared.');
    setMessage('');
  };
  return (
    <>
      <button className="chat-fab" title="Ask a TA" onClick={()=>setOpen((value)=>!value)} aria-expanded={open}>
        <Icon name={open ? 'x' : 'message-square-text'} size={18}/>
        {!open && <span className="dot dot-red" style={{position:'absolute',top:6,right:6}}></span>}
      </button>
      {open && (
        <div className="chat-panel panel">
          <div className="row between" style={{padding:'12px 14px',borderBottom:'1px solid var(--line)'}}>
            <div>
              <div className="label">Quant TA</div>
              <div className="mono mute" style={{fontSize:10.5,marginTop:2}}>frontend sandbox</div>
            </div>
            <span className="badge badge-green"><span className="dot dot-green"></span>online</span>
          </div>
          <div style={{padding:14}}>
            <div className="panel-2" style={{padding:12,marginBottom:10}}>
              <div className="mono" style={{fontSize:12,fontWeight:600}}>Ask about a formula, exercise, or tool.</div>
              <div className="mute" style={{fontSize:12,marginTop:6,lineHeight:1.5}}>
                This frontend queues the request visually. Backend chat can be wired later.
              </div>
            </div>
            <form onSubmit={send} className="col" style={{gap:8}}>
              <textarea
                rows={3}
                value={message}
                onChange={(event)=>setMessage(event.target.value)}
                placeholder="Why does vega peak near ATM?"
                style={{background:'#06080B',border:'1px solid var(--line-2)',color:'var(--text)',padding:'8px 10px',borderRadius:3,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:'none',resize:'vertical'}}
              />
              <button className="btn btn-primary btn-sm" type="submit" style={{justifyContent:'center'}}>Send question <Icon name="send" size={13}/></button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- small atoms ----------
function PageHead({title, sub, right, crumb}) {
  return (
    <div className="page-head">
      <div>
        {crumb && <div className="crumb">{crumb}</div>}
        <h1 className="page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {right && <div className="row" style={{gap:10}}>{right}</div>}
    </div>
  );
}

function Stat({label, value, sub, accent}) {
  return (
    <div className="panel" style={{padding:'14px 16px'}}>
      <div className="label" style={{marginBottom:6}}>{label}</div>
      <div className="mono tnum" style={{fontSize:22,fontWeight:700,color:accent||'var(--text)'}}>{value}</div>
      {sub && <div className="mute mono" style={{fontSize:10.5,marginTop:4,letterSpacing:'.05em'}}>{sub}</div>}
    </div>
  );
}

function TierBadge({tier}) {
  const t = TIER_BADGE[tier] ?? UNKNOWN_TIER_BADGE;
  return <span className={"badge "+t.cls}>{t.label}</span>;
}

function CourseBadge({badge}) {
  return <TierBadge tier={badge}/>;
}

Object.assign(window, {TopStrip, Ticker, Header, NewsletterStrip, Footer, ChatFab, PageHead, Stat, TierBadge, CourseBadge, NAV_ITEMS});


// ===== src\charts.jsx =====
// SVG chart primitives — terminal aesthetic
// All charts: dark bg, mono labels, sharp lines, red accent for the active series

function ChartFrame({title, subtitle, right, children, h=240, padded=true}) {
  return (
    <div className="panel" style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {(title || right) && (
        <div className="row between" style={{padding:'10px 12px',borderBottom:'1px solid var(--line)'}}>
          <div>
            <div className="label" style={{marginBottom:2}}>{title}</div>
            {subtitle && <div className="mono mute" style={{fontSize:10.5}}>{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{padding: padded?'10px 12px':0, flex:1, minHeight:h}}>
        {children}
      </div>
    </div>
  );
}

// ----- Line chart -----
function LineChart({series, width=420, height=200, yAxis=true, xAxis=true, grid=true, axes=true, preserveAspectRatio='xMidYMid meet', fill=true, padX=8, smooth=false}) {
  // series: [{name, color, data:[{x,y}]}]
  const all = series.flatMap(s=>s.data);
  if (!all.length) return null;
  const xs = all.map(d=>d.x), ys = all.map(d=>d.y);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const yPad = (ymax-ymin)*0.08 || 1;
  const yLo = ymin-yPad, yHi = ymax+yPad;
  const ML=44, MR=12, MT=10, MB=24;
  const W = width-ML-MR, H = height-MT-MB;
  const X = x => ML + ( (x-xmin)/((xmax-xmin)||1) )*W;
  const Y = y => MT + (1 - (y-yLo)/((yHi-yLo)||1))*H;
  const ticksY = 5, ticksX = 6;
  const yticks = Array.from({length:ticksY+1},(_,i)=>yLo + (yHi-yLo)*i/ticksY);
  const xticks = Array.from({length:ticksX+1},(_,i)=>xmin + (xmax-xmin)*i/ticksX);

  const path = (data) => {
    if (!data.length) return '';
    let d = `M ${X(data[0].x)} ${Y(data[0].y)}`;
    for (let i=1;i<data.length;i++) d += ` L ${X(data[i].x)} ${Y(data[i].y)}`;
    return d;
  };
  const area = (data) => {
    if (!data.length) return '';
    let d = `M ${X(data[0].x)} ${Y(yLo)}`;
    for (let i=0;i<data.length;i++) d += ` L ${X(data[i].x)} ${Y(data[i].y)}`;
    d += ` L ${X(data[data.length-1].x)} ${Y(yLo)} Z`;
    return d;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio={preserveAspectRatio} style={{display:'block',fontFamily:"'JetBrains Mono',monospace"}}>
      {grid && yticks.map((t,i)=>(
        <line key={'gy'+i} x1={ML} y1={Y(t)} x2={width-MR} y2={Y(t)} stroke="#1A1F28" strokeWidth="1" strokeDasharray={i%2?"2 4":"0"}/>
      ))}
      {yAxis && yticks.map((t,i)=>(
        <text key={'yt'+i} x={ML-6} y={Y(t)+3} textAnchor="end" fill="#7C8493" fontSize="9.5">{t.toFixed( (yHi-yLo)<2?2:0 )}</text>
      ))}
      {xAxis && xticks.map((t,i)=>(
        <text key={'xt'+i} x={X(t)} y={height-8} textAnchor="middle" fill="#7C8493" fontSize="9.5">{Number.isInteger(t)?t:t.toFixed(1)}</text>
      ))}
      {/* axes */}
      {axes && <line x1={ML} y1={MT} x2={ML} y2={height-MB} stroke="#2C3340"/>}
      {axes && <line x1={ML} y1={height-MB} x2={width-MR} y2={height-MB} stroke="#2C3340"/>}

      {series.map((s,i)=>(
        <g key={i}>
          {fill && s.fill !== false && (
            <path d={area(s.data)} fill={s.color || 'var(--red)'} opacity={s.fillOpacity ?? 0.08}/>
          )}
          <path d={path(s.data)} fill="none" stroke={s.color || 'var(--red)'} strokeWidth={s.strokeWidth || 1.5} strokeDasharray={s.dashed?"3 3":""}/>
        </g>
      ))}
    </svg>
  );
}

// ----- Volatility surface heatmap -----
function HeatmapChart({width=420, height=220, rows=10, cols=14, gen}) {
  const ML=44, MR=12, MT=10, MB=24;
  const W=width-ML-MR, H=height-MT-MB;
  const cw = W/cols, rh = H/rows;
  const data = [];
  for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
    data.push({r,c, v: gen ? gen(r,c,rows,cols) : 0.15 + 0.08*Math.cos((c-cols/2)/cols*Math.PI*2) + 0.04*(r/rows) + 0.02*Math.sin((r+1)*(c+2))});
  }
  const vs = data.map(d=>d.v);
  const vmin = Math.min(...vs), vmax = Math.max(...vs);
  const colorFor = v => {
    const t = (v-vmin)/((vmax-vmin)||1);
    // dark -> red ramp
    const r = Math.round(20 + 235*t);
    const g = Math.round(20 + 30*(1-t));
    const b = Math.round(35 + 30*(1-t));
    return `rgb(${r},${g},${b})`;
  };
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:'block',fontFamily:"'JetBrains Mono',monospace"}}>
      {data.map((d,i)=>(
        <rect key={i} x={ML + d.c*cw} y={MT + d.r*rh} width={cw-1} height={rh-1} fill={colorFor(d.v)}/>
      ))}
      {/* y labels */}
      {[0,Math.floor(rows/2),rows-1].map(r=>(
        <text key={'yr'+r} x={ML-6} y={MT + r*rh + rh/2 + 3} textAnchor="end" fill="#7C8493" fontSize="9.5">
          { r===0?'30d': r===rows-1?'2y':'180d' }
        </text>
      ))}
      {[0,Math.floor(cols/2),cols-1].map(c=>(
        <text key={'xc'+c} x={ML + c*cw + cw/2} y={height-8} textAnchor="middle" fill="#7C8493" fontSize="9.5">
          { c===0?'80%': c===cols-1?'120%':'ATM' }
        </text>
      ))}
    </svg>
  );
}

function VolHeatmap({matrix = [], rowLabels = [], colLabels = [], cell = 24}) {
  const rows = matrix.length || 1;
  const cols = Math.max(...matrix.map((row) => row.length), 1);
  const flat = matrix.flat().map((value) => Number(value) || 0);
  const min = Math.min(...flat), max = Math.max(...flat);
  const colorFor = (value) => {
    const t = (Number(value) - min) / ((max - min) || 1);
    const r = Math.round(45 + 205 * t);
    const g = Math.round(70 + 80 * (1 - t));
    const b = Math.round(105 + 20 * (1 - t));
    return `rgb(${r},${g},${b})`;
  };
  return (
    <div className="vol-heatmap-widget">
      <div className="vol-heatmap-grid" style={{gridTemplateColumns:`76px repeat(${cols}, minmax(${cell}px, 1fr))`}}>
        <div></div>
        {Array.from({length: cols}).map((_, idx) => (
          <div key={`col-${idx}`} className="vol-heatmap-label">{colLabels[idx] || `T${idx + 1}`}</div>
        ))}
        {Array.from({length: rows}).map((_, r) => (
          <React.Fragment key={`row-${r}`}>
            <div className="vol-heatmap-label row">{rowLabels[r] || `K${r + 1}`}</div>
            {Array.from({length: cols}).map((_, cIdx) => {
              const value = Number(matrix[r]?.[cIdx] ?? 0);
              return (
                <div key={`${r}-${cIdx}`} className="vol-heatmap-cell" style={{background:colorFor(value)}}>
                  {(value * 100).toFixed(1)}%
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mono mute" style={{fontSize:11,marginTop:8}}>Smile/surface slice: darker red = higher implied volatility.</div>
    </div>
  );
}

// ----- Sparkline -----
function Spark({data, width=80, height=22, color='#FF2E45', stroke=1.4, fill=true}) {
  if (!data || !data.length) return null;
  const ys = data, xs = data.map((_,i)=>i);
  const xmin=0, xmax=data.length-1;
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const X = i => (i-xmin)/(xmax||1) * width;
  const Y = v => height - (v-ymin)/((ymax-ymin)||1) * height;
  let d = `M ${X(0)} ${Y(ys[0])}`;
  for (let i=1;i<ys.length;i++) d += ` L ${X(i)} ${Y(ys[i])}`;
  const dF = d + ` L ${X(xs.length-1)} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:'block'}}>
      {fill && <path d={dF} fill={color} opacity={0.12}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={stroke}/>
    </svg>
  );
}

// ----- Bar chart -----
function BarChart({data, width=420, height=180, color='var(--red)', labels=true}) {
  // data: [{x,y}]
  const ML=44, MR=12, MT=10, MB=24;
  const W=width-ML-MR, H=height-MT-MB;
  const ys = data.map(d=>d.y);
  const ymin = Math.min(0, ...ys), ymax = Math.max(...ys, 0);
  const bw = W/data.length*0.7;
  const X = i => ML + (i+0.5)*(W/data.length);
  const Y = v => MT + (1 - (v-ymin)/((ymax-ymin)||1))*H;
  const yticks = [ymin, (ymin+ymax)/2, ymax];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:'block',fontFamily:"'JetBrains Mono',monospace"}}>
      {yticks.map((t,i)=>(
        <g key={i}>
          <line x1={ML} y1={Y(t)} x2={width-MR} y2={Y(t)} stroke="#1A1F28"/>
          <text x={ML-6} y={Y(t)+3} textAnchor="end" fill="#7C8493" fontSize="9.5">{t.toFixed(2)}</text>
        </g>
      ))}
      {data.map((d,i)=>{
        const y0 = Y(0), y1 = Y(d.y);
        return (
          <g key={i}>
            <rect x={X(i)-bw/2} y={Math.min(y0,y1)} width={bw} height={Math.abs(y1-y0)} fill={d.y>=0 ? color : '#2C3340'}/>
            {labels && <text x={X(i)} y={height-8} textAnchor="middle" fill="#7C8493" fontSize="9.5">{d.x}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ----- Order book (mini) -----
function OrderBook({width=300, levels=10}) {
  const mid = 100.0;
  const bids = [], asks = [];
  let pBid = mid - 0.02, pAsk = mid + 0.02;
  for (let i=0;i<levels;i++) {
    const bidSize = 80 + ((i * 137) % 371);
    const askSize = 95 + (((i + 3) * 113) % 359);
    bids.push({px:pBid, sz: bidSize});
    asks.push({px:pAsk, sz: askSize});
    pBid -= 0.01 + (((i * 7) % 9) / 1000);
    pAsk += 0.01 + ((((i + 4) * 5) % 9) / 1000);
  }
  const maxSz = Math.max(...bids.map(b=>b.sz), ...asks.map(a=>a.sz));
  return (
    <div className="mono" style={{fontSize:10.5, color:'var(--text-2)'}}>
      <div className="row" style={{padding:'4px 8px', color:'var(--mute)', borderBottom:'1px solid var(--line)', letterSpacing:'.08em'}}>
        <span style={{width:55}}>BID</span>
        <span style={{flex:1}}>SIZE</span>
        <span style={{width:55,textAlign:'right'}}>ASK</span>
      </div>
      {asks.slice().reverse().map((a,i)=>(
        <div key={'a'+i} className="row" style={{padding:'2px 8px', position:'relative'}}>
          <div style={{position:'absolute',left:0,top:0,bottom:0,width: (a.sz/maxSz*100)+'%', background:'rgba(255,46,69,.08)'}}></div>
          <span style={{width:55, position:'relative'}}></span>
          <span style={{flex:1, position:'relative', color:'var(--text-2)'}}>{a.sz}</span>
          <span style={{width:55, position:'relative', textAlign:'right', color:'var(--red)'}}>{a.px.toFixed(2)}</span>
        </div>
      ))}
      <div className="row between" style={{padding:'4px 8px', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)'}}>
        <span style={{color:'var(--mute)'}}>MID</span>
        <span style={{color:'var(--text)',fontWeight:600}}>100.00</span>
        <span style={{color:'var(--mute)'}}>· spread 0.04</span>
      </div>
      {bids.map((b,i)=>(
        <div key={'b'+i} className="row" style={{padding:'2px 8px', position:'relative'}}>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width: (b.sz/maxSz*100)+'%', background:'rgba(25,195,125,.06)'}}></div>
          <span style={{width:55, position:'relative', color:'var(--green)'}}>{b.px.toFixed(2)}</span>
          <span style={{flex:1, position:'relative', color:'var(--text-2)'}}>{b.sz}</span>
          <span style={{width:55, position:'relative', textAlign:'right'}}></span>
        </div>
      ))}
    </div>
  );
}

// ----- Generate mock series -----
function genWalk(n, start=100, vol=0.012, drift=0.0002, seed=1) {
  let s = start, out = [];
  // simple LCG
  let x = seed;
  const rnd = () => { x = (x*1664525+1013904223) % 4294967296; return (x/4294967296 - 0.5); };
  for (let i=0;i<n;i++) {
    s = s * Math.exp(drift + vol*rnd()*2);
    out.push({x:i, y: +s.toFixed(4)});
  }
  return out;
}
function genCurve(n, fn) {
  return Array.from({length:n},(_,i)=>({x:i, y: fn(i,n)}));
}

Object.assign(window, {ChartFrame, LineChart, HeatmapChart, Spark, BarChart, OrderBook, genWalk, genCurve});


// ===== src\pages-main.jsx =====
// Main pages: Home, Courses, Course Detail

// ============== HOME ==============
function HomePage() {
  return (
    <div className="home-page">
      <div className="container">
        <HeroBlock/>
        <div className="home-market-context"><TopStrip/></div>
        <CurriculumPreview/>
        <ToolsPreview/>
        <BuiltForBlock/>
        <CommunityPreview/>
        <FinalCTA/>
      </div>
      <NewsletterStrip/>
    </div>
  );
}

const HERO_TARGET_SPOT = 5872.34;

function HeroBlock() {
  const fillId = `hero-signature-${React.useId().replace(/:/g,'')}`;
  const paths = useMemo(()=>[7,19].map((seed,index)=>{
    const raw = genWalk(120,100,index?0.011:0.014,index?0.0002:0.0006,seed);
    const scale = HERO_TARGET_SPOT * (index?0.985:1) / raw[raw.length-1].y;
    return raw.map(point=>({...point,y:Number((point.y*scale).toFixed(2))}));
  }),[]);
  const prices = paths[0].map(point=>point.y);
  const pathStats = [['Open',prices[0]],['High',Math.max(...prices)],['Low',Math.min(...prices)]];
  const formatIndex = value=>value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const graph = useMemo(()=>{
    const values = paths.flatMap(series=>series.map(point=>point.y));
    const low = Math.min(...values), high = Math.max(...values);
    const y = value=>260-(value-low)/(high-low)*210;
    const path = series=>series.map((point,index)=>`${index?'L':'M'} ${(index/(series.length-1)*1000).toFixed(2)} ${y(point.y).toFixed(2)}`).join(' ');
    return {scenario:path(paths[0]),reference:path(paths[1]),endY:y(paths[0][paths[0].length-1].y)};
  },[paths]);
  return (
    <section className="hero-grid home-hero" data-hero-layout="signature">
      <div className="hero-left">
        <div className="hero-eyebrow"><span>The quant finance workspace</span></div>
        <h1 className="hero-title">Build your<br/><em className="accent">quant intuition.</em></h1>
        <p className="hero-sub">Go from a formula to a pricing decision. Learn the models, explore the numbers and make sense of risk — in one workspace.</p>
        <div className="hero-ctas">
          <Link to="/tools/bs-pricer" className="btn btn-primary">Try Black-Scholes<span className="hero-cta-arrow"><Icon name="arrow-right" size={15}/></span></Link>
          <Link to="/courses" className="btn btn-ghost">Browse courses<Icon name="arrow-right" size={14}/></Link>
        </div>
        <p className="hero-start-note">Free calculator · no account required</p>
      </div>
      <div className="hero-demo-stage">
        <div className="hero-right hero-terminal" aria-label="Illustrative stock market overview" data-hero-market-chart="true">
          <div className="hero-terminal-grid">
            <div className="hero-chart-wrap" style={{'--hero-point-y':`${graph.endY/300*100}%`,'--hero-point-x':'83.333333%'}}>
              <svg viewBox="0 0 1200 300" preserveAspectRatio="none" role="img" aria-label="Illustrative SPX scenario and reference path; 120 simulated observations, not live market prices">
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF3654" stopOpacity=".14"/>
                    <stop offset="100%" stopColor="#FF3654" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d={`${graph.scenario} L 1000 300 L 0 300 Z`} fill={`url(#${fillId})`} aria-hidden="true"/>
                <path data-hero-reference-path="true" d={graph.reference} fill="none" stroke="#8C96A6" strokeWidth="1" opacity=".26" vectorEffect="non-scaling-stroke"/>
                <path data-hero-scenario-path="true" d={graph.scenario} fill="none" stroke="#FF3654" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
                <circle data-hero-endpoint="true" cx="1000" cy={graph.endY} r="4" fill="#FF3654"/>
              </svg>
              <div className="hero-quote-head" data-hero-quote="true">
                <span className="micro">SPX · simulated scenario</span>
                <div className="hero-market-value" data-hero-spot={prices[prices.length-1]}>{formatIndex(prices[prices.length-1])}</div>
                <span className="hero-market-unit">Index points</span>
              </div>
            </div>
            <div className="hero-signature-footer">
              <div className="hero-trust-row" aria-label="Platform trust principles">
                <span><i className="trust-mark" aria-hidden="true"></i> Source-grounded</span>
                <span><i className="trust-mark" aria-hidden="true"></i> Engine-verified</span>
                <span><i className="trust-mark" aria-hidden="true"></i> Limits disclosed</span>
              </div>
              <div className="hero-signature-status"><span className="badge badge-amber">DETERMINISTIC DEMO</span><p className="hero-demo-note">Illustrative scenario · not a market feed</p></div>
            </div>
            <details className="hero-evidence-details">
              <summary>About this chart <Icon name="plus" size={14}/></summary>
              <div className="hero-secondary-grid">
                <div><strong>Illustrative price paths</strong><p>Two reproducible, simulated paths of 120 observations show how an index can move. They are not historical observations or current SPX quotes.</p></div>
                <div><strong>Reading the chart</strong><p>The attached price and Open, High and Low values come from the same red scenario. The quiet grey line is a separate reference path, not a forecast.</p></div>
                <div className="row hero-path-stats" aria-label="Illustrative price path statistics">
                  {pathStats.map(([label,value])=><span key={label} data-hero-stat={label}><span>{label}</span><strong>{formatIndex(value)}</strong></span>)}
                </div>
                <div className="hero-market-legend"><span>Scenario</span><span>Reference path</span></div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

function BuiltForBlock() {
  const items = [
    {t:'Aspiring Quants', d:'Targeting desks at top funds, market-makers, and prop shops.'},
    {t:'Career Switchers', d:'From engineering or pure math into pricing & risk.'},
    {t:'Practitioners', d:'Active traders who want to read between the screens.'},
    {t:'Curious Minds', d:'Researchers and students sharpening their applied skills.'},
  ];
  return (
    <section className="section audience-section">
      <div className="section-eyebrow">03 · Built for you</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Built for aspiring quants.</h2>
          <p className="text-2" style={{marginTop:8, maxWidth:'52ch'}}>Build intuition you can use at a desk — with clear explanations, practical tools and reproducible calculations.</p>
        </div>
        <Link to="/about" className="btn btn-ghost btn-sm">About the platform <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-4 audience-grid">
        {items.map((it,index)=>(
          <div key={it.t} className="panel audience-card" style={{padding:18}}>
            <span className="audience-card-index mono">0{index + 1}</span>
            <div className="audience-card-kicker mono">Profile</div>
            <div className="audience-card-title mono">{it.t}</div>
            <div className="mute" style={{fontSize:12.5,lineHeight:1.55}}>{it.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CurriculumPreview() {
  const featured = COURSES.slice(0,6);
  return (
    <section className="section curriculum-section">
      <div className="section-eyebrow">01 · Learn the foundations</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">A clear path into quant finance.</h2>
          <p className="text-2" style={{marginTop:8}}>Three tiers · Fundamentals, Advanced, Complex.</p>
        </div>
        <Link to="/courses" className="btn btn-outline btn-sm">All courses <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-3 curriculum-grid">
        {featured.map(c => <CourseCard key={c.id} c={c}/>)}
      </div>
    </section>
  );
}

function ToolsPreview() {
  const ts = TOOLS.slice(0,4);
  return (
    <section className="section tools-section">
      <div className="section-eyebrow">02 · Put it to work</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Change an input. Understand the impact.</h2>
          <p className="text-2" style={{marginTop:8}}>Explore prices, payoffs and risk with interactive calculators.</p>
        </div>
        <Link to="/tools" className="btn btn-outline btn-sm">All tools <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-4 tools-grid">
        {ts.map(t=>(
          <Link to={"/tools/"+t.id} key={t.id} className="course-card tool-preview-card" style={{textDecoration:'none'}}>
            <div className="thumb" style={{display:'grid',placeItems:'center',background:'#06080B'}}>
              <ToolThumb id={t.id}/>
            </div>
            <div className="body">
              <div className="meta">
                <span>{t.cat}</span>
                <span>·</span>
                <TierBadge tier={t.tier}/>
              </div>
              <h3>{t.name}</h3>
              <div className="desc">{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ToolThumb({id}) {
  const data = useMemo(()=>genWalk(40, 100, 0.02, 0.0005, id.charCodeAt(0)+id.length), [id]);
  if (id==='payoff') {
    return (
      <svg viewBox="0 0 180 90" width="100%" height="100%" style={{padding:10}}>
        <line x1="0" y1="65" x2="180" y2="65" stroke="#2C3340"/>
        <line x1="60" y1="10" x2="60" y2="80" stroke="#2C3340" strokeDasharray="2 3"/>
        <polyline points="0,65 60,65 180,15" fill="none" stroke="#FF2E45" strokeWidth="1.6"/>
      </svg>
    );
  }
  if (id==='mc') {
    return (
      <svg viewBox="0 0 180 90" width="100%" height="100%" style={{padding:10}}>
        {Array.from({length:8}).map((_,i)=>{
          const d = genWalk(30, 45, 0.04, 0.0006, i+11);
          const path = d.map((p,j)=>`${j===0?'M':'L'} ${j*6} ${90-p.y*1.2}`).join(' ');
          return <path key={i} d={path} fill="none" stroke="#FF2E45" strokeWidth="0.7" opacity="0.55"/>;
        })}
      </svg>
    );
  }
  if (id==='iv-calc') {
    return (
      <svg viewBox="0 0 180 90" width="100%" height="100%" style={{padding:10}}>
        <path d="M 0,70 Q 90,10 180,55" fill="none" stroke="#FFB020" strokeWidth="1.6"/>
        <path d="M 0,40 Q 90,75 180,38" fill="none" stroke="#FF2E45" strokeWidth="1.4"/>
      </svg>
    );
  }
  // bs-pricer default: line
  const dpath = data.map((p,i)=>`${i===0?'M':'L'} ${i*4.5} ${90-(p.y-Math.min(...data.map(d=>d.y)))*2}`).join(' ');
  return (
    <svg viewBox="0 0 180 90" width="100%" height="100%" style={{padding:10}}>
      <path d={dpath} fill="none" stroke="#FF2E45" strokeWidth="1.4"/>
      <path d={dpath+` L ${(data.length-1)*4.5} 90 L 0 90 Z`} fill="#FF2E45" opacity="0.1"/>
    </svg>
  );
}

function CommunityPreview() {
  return (
    <section className="section community-section">
      <div className="section-eyebrow">04 · Go further together</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">A practitioner forum.</h2>
          <p className="text-2" style={{marginTop:8}}>Persistent pricing and risk questions, with no fabricated activity or member counts.</p>
        </div>
        <Link to="/community/forum" className="btn btn-outline btn-sm">Enter forum <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-3 community-grid">
        <div className="panel community-card" style={{padding:18}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="label">Community forum</div>
            <span className="badge">PERSISTED</span>
          </div>
          <div className="mono" style={{fontSize:15,fontWeight:700}}>Ask, reproduce, challenge.</div>
          <p className="text-2" style={{fontSize:12.5,lineHeight:1.6}}>Post a pricing or risk question with inputs and assumptions. Topics and votes are shown only after they are persisted—no synthetic member counts.</p>
          <Link to="/community/forum" className="btn btn-outline btn-sm">Open the forum <Icon name="arrow-right" size={13}/></Link>
        </div>
        <div className="panel community-card" style={{padding:18}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="label">Verified progress</div>
            <span className="badge">OPT-IN</span>
          </div>
          <p className="text-2" style={{fontSize:12.5,lineHeight:1.6}}>Scores are created only by completed exercises and Survival runs. Empty state stays empty until real learners opt in.</p>
          <Link to="/leaderboard" className="btn btn-outline btn-sm">View recorded scores <Icon name="arrow-right" size={13}/></Link>
        </div>
        <div className="panel community-card" style={{padding:18}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="label">Practice challenge</div>
            <span className="badge badge-amber">PRACTICE PREVIEW</span>
          </div>
          <div className="mono" style={{fontSize:16, fontWeight:700, marginBottom:8}}>Price a Down-and-Out Call</div>
          <p className="text-2" style={{fontSize:12.5,lineHeight:1.5}}>S=100, K=100, H=85, σ=20%, r=2%, T=6m. Use a closed form and verify with 100k antithetic Monte Carlo paths. No ranking is claimed while submissions are not enabled.</p>
          <div className="row between" style={{marginTop:16}}>
            <span className="mono mute" style={{fontSize:11}}>Worked learning challenge</span>
            <Link to="/challenge" className="btn btn-outline btn-sm">Enter <Icon name="arrow-right" size={13}/></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section final-cta-section">
      <div className="panel final-cta-panel" style={{padding:'48px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:30, position:'relative', overflow:'hidden'}}>
        <div aria-hidden="true" style={{position:'absolute', right:-40, top:-40, opacity:0.06, fontFamily:"'JetBrains Mono',monospace", fontSize:280, fontWeight:700, color:'#FF2E45'}}>σ</div>
        <div style={{position:'relative', maxWidth:'60ch'}}>
          <div className="section-eyebrow" style={{margin:0}}>Your next step</div>
          <h2 className="section-title" style={{fontSize:32, marginTop:8}}>See what you can explain in an interview.</h2>
          <p className="text-2" style={{marginTop:10, fontSize:14}}>
            Try a pricing case, write your reasoning and check the result. Build evidence of your own progress before choosing a paid library plan.
          </p>
        </div>
        <div className="row" style={{gap:10, position:'relative', flexShrink:0}}>
          <Link to="/interview" className="btn btn-primary">Try the Interview Lab <Icon name="arrow-right" size={14}/></Link>
          <Link to="/courses/black-scholes" className="btn btn-ghost">Read the free preview</Link>
        </div>
      </div>
    </section>
  );
}

// ============== COURSES ==============
function CoursesPage() {
  const [tab, setTab] = useState('All');
  const [query, setQuery] = useState('');
  const tiers = ['All','Fundamentals','Advanced','Complex'];
  const normalizedQuery = query.trim().toLowerCase();
  const list = COURSES.filter(c => {
    const inTier = tab==='All' || c.tier===tab;
    const haystack = `${c.title} ${c.tagline} ${c.topics.join(' ')} ${c.level}`.toLowerCase();
    return inTier && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  return (
    <div className="container page catalogue-page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ courses</span></>}
        title="Course Catalogue"
        sub="A structured curriculum across three tiers. Start from Fundamentals or jump to Complex if you have the prerequisites."
        right={
          <>
            <input type="search" aria-label="Search courses" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search modules…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:9,color:'var(--text)',fontFamily:'var(--font-sans)',fontSize:13,width:220,minHeight:44}}/>
            <button className="btn btn-outline btn-sm" onClick={()=>{setTab('All'); setQuery('');}}><Icon name="sliders-horizontal" size={13}/> Reset</button>
          </>
        }
      />
      <div className="catalogue-start">
        <div><span className="micro">English · guided interview practice</span><h2>Start with a ticket you can defend.</h2><p>Choose a short session, submit your answer and reasoning, then test the idea on a new variant. The legacy course library is in French.</p></div>
        <Link to="/interview" className="btn btn-outline">Open Interview Lab <Icon name="arrow-right" size={14}/></Link>
      </div>
      <div className="tabs-bar" role="group" aria-label="Filter courses by tier">
        {tiers.map(t=>(
          <button key={t} aria-pressed={tab===t} className={"tab-btn "+(tab===t?'on':'')} onClick={()=>setTab(t)}>
            {t} <span className="mute" style={{marginLeft:6}}>{t==='All' ? COURSES.length : COURSES.filter(c=>c.tier===t).length}</span>
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid-3 catalogue-grid">
          {list.map(c => <CourseCard key={c.id} c={c}/>)}
        </div>
      ) : (
        <div className="panel" style={{padding:28,textAlign:'center'}}><span className="mono mute">No course matches this search.</span></div>
      )}
    </div>
  );
}

function CourseCard({c}) {
  return (
    <Link to={"/courses/"+c.id} className="course-card">
      <div className="thumb">
        <CourseThumb c={c}/>
        <div style={{position:'absolute',top:10,left:10}}><CourseBadge badge={c.badge}/></div>
        <div className="mono mute" style={{position:'absolute',top:10,right:10,fontSize:10,color:'var(--mute)',background:'rgba(6,8,11,.6)',padding:'2px 6px',borderRadius:2}}>{c.level}</div>
      </div>
      <div className="body">
        <div className="meta">
          <span>{c.tier}</span>
          <span>·</span>
          <span>{c.duration}</span>
          <span>·</span>
          <span>{CHAPTER_COUNTS[c.id] ?? c.modules} modules</span>
        </div>
        <h3>{c.title}</h3>
        <div className="desc">{c.tagline}</div>
        <div className="foot">
          <div className="row" style={{gap:6, flexWrap:'wrap'}}>
            {c.topics.slice(0,2).map(t=><span key={t} className="badge">{t}</span>)}
          </div>
          <span className="mono" style={{fontSize:11,color:'var(--red)'}}>open ›</span>
        </div>
      </div>
    </Link>
  );
}

function CourseThumb({c}) {
  // Generate a thumbnail per course based on id
  const acc = c.accent;
  const id = c.id;
  if (id==='black-scholes') {
    const d = useMemo(()=>genCurve(60, (i,n)=>{
      const S = 60 + i*1.4;
      const K=90, r=.02, sigma=.25, T=.5;
      const d1 = (Math.log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
      const d2 = d1 - sigma*Math.sqrt(T);
      return S*normCdf(d1) - K*Math.exp(-r*T)*normCdf(d2);
    }), []);
    return <ChartThumb data={d} color={acc}/>;
  }
  if (id==='yield-curves') {
    const d = useMemo(()=>genCurve(60,(i,n)=>{
      const t = i/n*30;
      return 1.5 + 2.6*(1-Math.exp(-t/8)) - 0.3*Math.exp(-t/3);
    }),[]);
    return <ChartThumb data={d} color={acc}/>;
  }
  if (id==='greeks') {
    return (
      <svg viewBox="0 0 200 100" width="100%" height="100%" style={{padding:10}}>
        <path d="M 0,80 Q 100,80 100,20 T 200,20" fill="none" stroke={acc} strokeWidth="1.5"/>
        <path d="M 0,20 Q 100,20 100,80 T 200,80" fill="none" stroke="#FF2E45" strokeWidth="1.5" strokeDasharray="3 3"/>
        <text x="6" y="14" fill="#7C8493" fontSize="8" fontFamily="JetBrains Mono">Δ Γ Θ ν ρ</text>
      </svg>
    );
  }
  if (id==='implied-vol') {
    return <div style={{height:'100%',padding:6}}><HeatmapChart width={280} height={140} rows={5} cols={8}/></div>;
  }
  if (id==='exotics') {
    return (
      <svg viewBox="0 0 200 100" width="100%" height="100%" style={{padding:10}}>
        <line x1="0" y1="70" x2="200" y2="70" stroke="#2C3340"/>
        <line x1="40" y1="70" x2="160" y2="70" stroke={acc} strokeWidth="2"/>
        <line x1="40" y1="70" x2="40" y2="30" stroke={acc} strokeDasharray="2 2"/>
        <line x1="160" y1="70" x2="160" y2="30" stroke={acc} strokeDasharray="2 2"/>
        <polyline points="0,70 160,70 200,20" fill="none" stroke="#FF2E45" strokeWidth="1.4"/>
        <text x="6" y="14" fill="#7C8493" fontSize="8" fontFamily="JetBrains Mono">DOI · Barrier</text>
      </svg>
    );
  }
  if (id==='monte-carlo') {
    return (
      <svg viewBox="0 0 200 100" width="100%" height="100%" style={{padding:10}}>
        {Array.from({length:12}).map((_,i)=>{
          const d = genWalk(40, 50, 0.04, 0.0008, i+5);
          const path = d.map((p,j)=>`${j===0?'M':'L'} ${j*5} ${100-p.y*1.6}`).join(' ');
          return <path key={i} d={path} fill="none" stroke={acc} strokeWidth="0.7" opacity="0.55"/>;
        })}
      </svg>
    );
  }
  if (id==='stochastic') {
    return (
      <div style={{height:'100%',padding:'18px 20px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div className="mono" style={{fontSize:14, color:acc, marginBottom:8}}>dS_t = μS_t dt + σS_t dW_t</div>
        <div className="mono mute" style={{fontSize:11}}>Itô · Girsanov · Martingales</div>
      </div>
    );
  }
  return (
    <svg viewBox="0 0 200 100" width="100%" height="100%" style={{padding:10}}>
      <line x1="0" y1="76" x2="200" y2="76" stroke="#2C3340"/>
      <line x1="20" y1="16" x2="20" y2="88" stroke="#2C3340"/>
      <path d="M 12,76 L 46,70 L 82,58 L 116,42 L 150,28 L 190,20" fill="none" stroke={acc} strokeWidth="1.5"/>
      <path d="M 12,76 L 54,76 L 88,62 L 124,62 L 158,40 L 190,40" fill="none" stroke="#FF2E45" strokeWidth="1.2" strokeDasharray="3 3"/>
      <text x="28" y="18" fill="#7C8493" fontSize="8" fontFamily="JetBrains Mono">desk workflow</text>
    </svg>
  );
}

function ChartThumb({data, color}) {
  if (!data || !data.length) return null;
  const ys = data.map(d=>d.y);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const path = data.map((p,i)=>`${i===0?'M':'L'} ${i/(data.length-1)*200} ${100-((p.y-ymin)/((ymax-ymin)||1))*80-6}`).join(' ');
  const last = data.length-1;
  const lastX = 200, lastY = 100-((data[last].y-ymin)/((ymax-ymin)||1))*80-6;
  return (
    <svg viewBox="0 0 200 100" width="100%" height="100%" style={{padding:0}}>
      <path d={path+` L 200 100 L 0 100 Z`} fill={color} opacity="0.08"/>
      <path d={path} fill="none" stroke={color} strokeWidth="1.4"/>
      <circle cx={lastX} cy={lastY} r="2" fill={color}/>
    </svg>
  );
}

// ============== ENTITLEMENT GATING ==============
const COURSE_TIER_PLAN = { Fundamentals:'starter', Foundation:'starter', Core:'starter', Advanced:'student', Complex:'pro' };
const FREE_COURSE_IDS = new Set(['black-scholes']);
const PLAN_LABEL = { free:'Free', starter:'Starter', student:'Student', pro:'Professional' };
function useEntitlement() {
  let auth=null; try { auth=useAuth(); } catch { auth=null; }
  return {
    plan: auth?.plan || 'free',
    isAuthed: !!auth?.isAuthenticated,
    isLoading: Boolean(auth?.isLoading),
    has: (required)=> required==='free' ? true : (auth?.hasPlan ? auth.hasPlan(required) : false),
  };
}
function LockPanel({required, what='This content', headingLevel=2}) {
  const entitlement = useEntitlement();
  const salesReady = LEGAL_READY && SOURCE_RIGHTS_CLEARED;
  const target = entitlement.isAuthed ? '/pricing' : '/auth/signup?next=interview';
  const Heading = `h${headingLevel}`;
  return (
    <div className="panel" style={{padding:48, textAlign:'center'}}>
      <Icon name="lock" size={30} style={{color:'var(--red)'}}/>
      <Heading className="mono" style={{fontSize:20,fontWeight:700,marginTop:16}}>{PLAN_LABEL[required]||required} plan required</Heading>
      <p className="text-2" style={{maxWidth:'46ch',margin:'10px auto 22px',fontSize:13.5}}>{what} is part of the {PLAN_LABEL[required]||required} tier. {salesReady ? (entitlement.isAuthed ? 'Review the access requirements before choosing a plan.' : 'Create an account, then review the plan requirements.') : 'Paid access is not on sale yet. The English interview pilot remains available.'}</p>
      <Link to={target} className="btn btn-primary">{entitlement.isAuthed?'See plans':'Create account'} <Icon name="arrow-right" size={13}/></Link>
      <Link to="/interview" className="btn btn-outline" style={{marginLeft:10}}>Try available interview practice</Link>
    </div>
  );
}

function GatedPage({required, what, children, embedded=false}) {
  const entitlement = useEntitlement();
  if (entitlement.isLoading) return <div className="container page"><h1 className="page-title">Loading your workspace</h1><p role="status">Checking your account access…</p></div>;
  return entitlement.has(required) ? children : <div className="container page"><LockPanel required={required} what={what} headingLevel={embedded?2:1}/></div>;
}

// ============== COURSE DETAIL ==============
const _progressSent = new Set();
export async function recordProgressOnce(auth, kind, ref, score, meta) {
  const uid = auth?.user?.id || auth?.user?.email;
  if (!uid) throw new Error('Sign in to save progress.');
  const key = `${uid}:${kind}:${ref}`;
  if (_progressSent.has(key)) return {ok:true, created:false, cached:true};
  const result = await platformApi.recordProgress({ kind, ref, score: score ?? null, meta: meta || {} });
  if (!result?.ok) throw new Error('The progress service did not confirm the completion.');
  _progressSent.add(key);
  return result;
}
function CourseDetailPage({route}) {
  return route.parts.length===2 && COURSES.some((course)=>course.id===route.parts[1]) ? <CourseDetailContent route={route}/> : <NotFoundPage/>;
}
function CourseDetailContent({route}) {
  const courseLocation = useLocation();
  const id = route.parts[1] || 'black-scholes';
  const c = COURSES.find(x=>x.id===id) || COURSES[0];
  let auth=null; try { auth = useAuth(); } catch { auth=null; }
  const ent = useEntitlement();
  const requiredPlan = FREE_COURSE_IDS.has(c.id) ? 'free' : (COURSE_TIER_PLAN[c.tier] || 'starter');
  const locked = requiredPlan!=='free' && !ent.has(requiredPlan);
  const previewOnly = c.id==='black-scholes' && !ent.has('starter');
  const [tab, setTab] = useState('content');
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState(()=>new Set());
  const [completionBusy, setCompletionBusy] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const restoredPosition = useRef(null);
  const loadedProgressKey = useRef(null);
  const savedCoursePosition = useRef(null);
  const contentTopRef = useRef(null);
  const [courseLanguages,setCourseLanguages] = useState(null);
  const [languageError,setLanguageError] = useState('');
  const [languageRetry,setLanguageRetry] = useState(0);
  useEffect(()=>{let active=true;setCourseLanguages(null);setLanguageError('');if(previewOnly||locked){setCourseLanguages([]);return()=>{active=false;};}platformApi.learnerCatalog().then(data=>{if(active)setCourseLanguages((data.courses||[]).find(item=>item.id===c.id)?.available_languages||[]);}).catch(()=>{if(active)setLanguageError('Course language availability could not be loaded. Retry to choose a published version.');});return()=>{active=false;};},[c.id,languageRetry,previewOnly,locked]);
  const requestedLanguage = new URLSearchParams(courseLocation.search).get('language');
  const selectedLanguage = previewOnly ? 'en' : ['en','fr'].includes(requestedLanguage) ? requestedLanguage : courseLanguages?.includes('en') ? 'en' : courseLanguages?.includes('fr') ? 'fr' : null;
  const changeLanguage = language => {const params=new URLSearchParams(courseLocation.search);params.set('language',language);nav(`${courseLocation.pathname}?${params}`);};
  const scriptState = useCourseScript(c.id, locked, previewOnly, selectedLanguage);
  const scriptModel = useMemo(
    () => scriptState.status === 'ready' ? parseCourseScript(scriptState.content) : null,
    [scriptState.status, scriptState.content]
  );

  useEffect(() => {
    setSelectedModuleIndex(0);
    setTab('content');
  }, [c.id]);

  const userId = auth?.user?.id || auth?.user?.email || null;
  useEffect(() => {
    setCompletedModules(new Set());
    setProgressReady(false);
    restoredPosition.current = null;
    loadedProgressKey.current = null;
    savedCoursePosition.current = null;
    if (!userId || locked) { loadedProgressKey.current = `${userId || 'visitor'}:${c.id}`; setProgressReady(true); return undefined; }
    let active = true;
    platformApi.getProgress(userId).then((progress) => {
      if (!active || !progress) return;
      const prefix = `${c.id}#L`;
      const lessonRefs = Array.isArray(progress.completed_lessons) ? progress.completed_lessons
        : Array.isArray(progress.events) ? progress.events.filter((event)=>event.kind==='lesson').map((event)=>event.ref) : [];
      const restored = new Set(
        lessonRefs
          .filter((ref)=>String(ref || '').startsWith(prefix))
          .map((ref)=>Number(String(ref).slice(prefix.length)))
          .filter(Number.isInteger)
      );
      setCompletedModules(restored);
      savedCoursePosition.current = progress.course_positions?.find(position=>position.course===c.id)?.module_index;
      loadedProgressKey.current = `${userId}:${c.id}`;
      setProgressReady(true);
    }).catch(()=>{ if (active) { loadedProgressKey.current = `${userId}:${c.id}`; setProgressReady(true); } });
    return () => { active = false; };
  }, [c.id, locked, previewOnly, userId]);

  useEffect(() => {
    const count = scriptModel?.modules?.length || 0;
    const key = `${userId || 'visitor'}:${c.id}`;
    if (!progressReady || loadedProgressKey.current !== key || !count || restoredPosition.current === key) return;
    let visited = -1;
    try { visited = Number(window.localStorage.getItem(`tpl:course-position:v1:${key}`) ?? -1); } catch { /* storage is optional */ }
    const nextIncomplete = Array.from({length:count}, (_,index)=>index).find(index=>!completedModules.has(index));
    const serverPosition = savedCoursePosition.current;
    const target = Number.isInteger(serverPosition) && serverPosition >= 0 && serverPosition < count ? serverPosition
      : Number.isInteger(visited) && visited >= 0 && visited < count ? visited : (nextIncomplete ?? count - 1);
    setSelectedModuleIndex(target);
    restoredPosition.current = key;
  }, [c.id, completedModules, progressReady, scriptModel, userId]);

  const openModule = useCallback((index) => {
    setSelectedModuleIndex(index);
    try { window.localStorage.setItem(`tpl:course-position:v1:${userId || 'visitor'}:${c.id}`, String(index)); } catch { /* storage is optional */ }
    if (userId) void platformApi.coursePosition(c.id,index).catch(()=>notify('Your reading position could not be saved. Completed modules are still recorded separately.', 'warning'));
    setTab('content');
    // Scroll the lesson content back to the top of the viewport: selecting a
    // module only swaps state (not a route change), so without this the page
    // keeps the previous scroll position and lands the reader mid/bottom-page.
    requestAnimationFrame(() => {
      contentTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [c.id, userId]);

  const completeModule = useCallback(async () => {
    setCompletionBusy(true);
    try {
      await recordProgressOnce(auth, 'lesson', `${c.id}#L${selectedModuleIndex}`, null, { course: c.id });
      setCompletedModules((current)=>new Set([...current, selectedModuleIndex]));
      notify(`${c.title} module ${selectedModuleIndex + 1} completion saved.`);
    } catch (error) {
      notify(`Completion was not saved (${error.message}).`, 'error');
    } finally {
      setCompletionBusy(false);
    }
  }, [auth, c.id, c.title, selectedModuleIndex]);

  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><Link to="/courses">courses</Link><i>›</i><span>{c.title.toLowerCase()}</span></>}
        title={c.title}
        sub={c.tagline}
        right={<>
          <CourseBadge badge={c.badge}/>
          <span className="badge">{c.tier}</span>
          <span className="badge">{c.level}</span>
          <span className="badge">{c.duration}</span>
          {!locked && <button className="btn btn-primary btn-sm" disabled={!progressReady || scriptState.status!=='ready' || !scriptModel?.modules?.length} onClick={()=>openModule(selectedModuleIndex)}>{progressReady ? 'Resume' : 'Restoring…'} <Icon name="play" size={13}/></button>}
        </>}
      />

      {!locked && !previewOnly && <aside className="course-language-note" style={{alignItems:'center',flexWrap:'wrap',gap:16}}><label className="field" style={{minWidth:190}}>Course language<select aria-label="Course language" value={selectedLanguage||''} onChange={event=>changeLanguage(event.target.value)} disabled={!courseLanguages}><option value="" disabled>Checking published versions…</option>{[['en','English'],['fr','Français']].map(([value,label])=><option key={value} value={value} disabled={!courseLanguages?.includes(value)}>{label}{courseLanguages&&!courseLanguages.includes(value)?' · not published':''}</option>)}</select></label><span>{scriptState.status==='ready'?`Reading ${scriptState.language==='en'?'English':'French'} · published course version`:courseLanguages?.length===0?'No full language variant is published here.':'The content language is checked when the version loads.'}</span>{languageError&&<div role="alert">{languageError}<button className="btn btn-outline btn-sm" onClick={()=>setLanguageRetry(value=>value+1)}>Retry versions</button></div>}{selectedLanguage==='fr'&&<Link to="/interview">English interview practice <Icon name="arrow-right" size={13}/></Link>}</aside>}
      {locked ? <LockPanel required={requiredPlan} what={`The ${c.title} course`}/> : <div className="course-detail-layout">
        <CourseSidebar
          c={c}
          scriptModel={scriptModel}
          language={scriptState.language || selectedLanguage || 'en'}
          selectedModuleIndex={selectedModuleIndex}
          completedModules={completedModules}
          onSelectModule={openModule}
          onOpenScript={()=>setTab('script')}
          onOpenResources={()=>setTab('resources')}
        />
        <div ref={contentTopRef} style={{scrollMarginTop:16}}>
          <div className="tabs-bar">
            {[
              ['content','Lesson'],
              ['calc','Calculator'],
              ['exercises','Exercises'],
              ['resources','References'],
              ['script','Full script'],
            ].map(([k,l])=>(
              <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
          {tab==='content' && <><div lang={scriptState.language || selectedLanguage || 'en'}><CourseContent c={c} scriptState={scriptState} scriptModel={scriptModel} selectedModuleIndex={selectedModuleIndex} onSelectModule={openModule} onOpenScript={()=>setTab('script')}/></div>{previewOnly ? <div className="panel" style={{padding:16,marginTop:16}}><LockPanel required="starter" what="Module completion and the full Black-Scholes course"/></div> : <div className="panel" style={{padding:16,marginTop:16,textAlign:'right'}}><button type="button" className="btn btn-primary" disabled={completionBusy || scriptState.status!=='ready' || !scriptModel?.modules?.length || completedModules.has(selectedModuleIndex)} onClick={completeModule}>{completionBusy ? 'Saving…' : completedModules.has(selectedModuleIndex) ? 'Completion saved' : 'Mark module complete'} <Icon name="check" size={13}/></button></div>}</>}
          {tab==='script' && (previewOnly ? <LockPanel required="starter" what="The full Black-Scholes script"/> : <div lang={scriptState.language || 'fr'}><CourseScript c={c} scriptState={scriptState} scriptModel={scriptModel}/></div>)}
          {tab==='calc' && <CourseCalculator c={c}/>}
          {tab==='exercises' && (previewOnly ? <LockPanel required="starter" what="The graded Black-Scholes exercises"/> : <CourseExercises c={c}/>)}
          {tab==='resources' && <CourseResources c={c} scriptModel={scriptModel}/>}
        </div>
      </div>}
    </div>
  );
}

function useCourseScript(courseId, locked = false, previewOnly = false, language = null) {
  const scriptSlug = COURSE_SCRIPT_SLUGS[courseId];
  const [script, setScript] = useState({status:'loading', content:'', error:''});

  useEffect(() => {
    if (locked) {
      setScript({status:'locked', content:'', error:''});
      return undefined;
    }
    if (!scriptSlug) {
      setScript({status:'missing', content:'', error:''});
      return undefined;
    }
    if (!previewOnly && !language) { setScript({status:'loading',content:'',error:''}); return undefined; }

    setScript({status:'loading', content:'', error:''});
    const request = previewOnly
      ? fetch(`/course-scripts/${scriptSlug}.md`).then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text().then(content => ({ content, language: 'en' }));
        })
      : platformApi.courseScript(courseId, { withMetadata: true, language });
    let active = true;
    request
      .then((document) => { if (active) setScript({status:'ready', content:String(document.content).replace(/<!--[\s\S]*?-->/g, ''), language:document.language === 'en' ? 'en' : 'fr', error:''}); })
      .catch((error) => {
        if (active) {
          setScript({status:'error', content:'', error:error.message || 'Course script unavailable'});
        }
      });

    return () => { active = false; };
  }, [courseId, locked, previewOnly, scriptSlug, language]);

  return {...script, slug: scriptSlug};
}

function parseCourseScript(markdown = '') {
  const clean = stripFrontmatter(markdown);
  const title = clean.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Generated course';
  return {
    title,
    modules: parseScriptModules(clean),
    writtenLessons: parseWrittenLessons(clean),
    formulas: parseScriptFormulas(clean),
    uiBlocks: parseCourseUiBlocks(clean),
    labs: parseNumberedSection(clean, 'Labs pratiques a inclure').concat(parseNumberedSection(clean, 'Practical labs')),
    exerciseBank: parseBulletSection(clean, "Banque d'exercices rattaches"),
    teacherScript: parseNumberedSection(clean, 'Script enseignant'),
    supports: parseBulletSection(clean, 'Supports a produire'),
    facts: parseBulletSection(clean, 'Faits et angles extraits de la base'),
    sources: parseSourceAppendix(clean),
  };
}

// New Hull-structure courses use top-level "## Chapter" headings (0 Hook, 1
// Intuition, 2 Theory…) instead of the old "### Module N" scaffold. Split on
// H2 so the sidebar + Content reader reflect the SAME enriched curriculum as
// the Script tab. Meta/front-matter sections are skipped.
const _SKIP_H2 = /^(promesse|niveau cible|public|prerequis|objectifs|positionnement|legende|provenance|source\s*map|sources?\b|table des|sommaire|course promise|prerequisites|learning objectives|module plan|source coverage|references|instructor notes)/i;
function parseH2Chapters(markdown = '') {
  return splitMarkdownHeadingBlocks(markdown, /^##\s+(.+?)\s*\r?\n/gm).reduce((out, block) => {
    const title = block.title.replace(/^\d+\s*[·.)\-:]*\s*/, '').trim();
    const body = block.body.trim();
    if (_SKIP_H2.test(title) || body.length < 40) return out;
    out.push({ number: out.length + 1, title, body });
    return out;
  }, []);
}

function parseWrittenLessons(markdown) {
  const section = markdownSection(markdown, 'Written course') || markdownSection(markdown, 'Cours redige');
  const blocks = splitMarkdownHeadingBlocks(section, /^### (?:Le[cç]on|Lesson)\s+(\d+)\s+[-—–]\s+(.+?)\s*\r?\n/gim);
  if (blocks.length) {
    return blocks.map((block)=>({ number: Number(block.number), title: block.title.trim(), body: block.body.trim() }));
  }
  return parseH2Chapters(markdown);  // Hull-structure fallback
}

function parseScriptModules(markdown) {
  const section = markdownSection(markdown, 'Module plan') || markdownSection(markdown, 'Deroule pratique');
  const blocks = splitMarkdownHeadingBlocks(section, /^### Module\s+(\d+)\s+-\s+(.+?)\s*\r?\n/gm);
  if (blocks.length) {
    return blocks.map((block) => {
      const fields = parseDeskBullets(block.body);
      return {
        number: Number(block.number), title: block.title.trim(), fields,
        objective: fields['Practical objective'] || fields.Objective || fields['Objectif pratique'] || '', situation: fields['Desk situation'] || fields.Situation || fields['Situation de desk'] || '',
        notion: fields['Core concept'] || fields.Concept || fields['Notion utile'] || '', activity: fields.Activity || fields.Activite || '',
        deliverable: fields['Learner deliverable'] || fields.Deliverable || fields['Livrable apprenant'] || '', raw: block.body.trim(),
      };
    });
  }
  const lessons = parseWrittenLessons(markdown);
  if (lessons.length && (markdownSection(markdown, 'Written course') || markdownSection(markdown, 'Cours redige'))) {
    return lessons.map((lesson) => ({
      number: lesson.number, title: lesson.title, fields: {}, objective: '', situation: '',
      notion: '', activity: '', deliverable: '', raw: lesson.body,
    }));
  }
  // Hull-structure fallback: each chapter is a module; the rich body renders in
  // the Content reader (markdown + LaTeX + UIBLOCKs), keeping the layout intact.
  return parseH2Chapters(markdown).map((ch)=>({
    number: ch.number, title: ch.title, fields: {}, objective: '', situation: '',
    notion: '', activity: '', deliverable: '', raw: ch.body,
  }));
}

function parseScriptFormulas(markdown) {
  const section = markdownSection(markdown, 'Formules de desk');
  const formulaBlocks = splitMarkdownHeadingBlocks(section, /^### F(\d+)\s+-\s+(.+?)\s*\r?\n/gm);
  if (formulaBlocks.length) {
    return formulaBlocks.map((block) => {
      const expression = block.body.match(/\$\$\s*([\s\S]*?)\s*\$\$/)?.[1]?.trim() || '';
      const rest = block.body.replace(/\$\$\s*[\s\S]*?\s*\$\$/, '').trim();
      return {
        number: Number(block.number), title: block.title.trim(), expression,
        usage: (rest.match(/Usage desk:\s*(.+)/i)?.[1] || rest.replace(/^-\s*/, '')).trim(),
      };
    }).filter((formula) => formula.expression);
  }
  // Hull-structure fallback: harvest the display equations ($$…$$) directly.
  const blocks = [...markdown.matchAll(/\$\$\s*([\s\S]*?)\s*\$\$/g)].map(b=>b[1].trim()).filter(e=>e.length>2);
  const seen = new Set();
  return blocks.filter(e=>{ if(seen.has(e)) return false; seen.add(e); return true; })
    .slice(0, 8).map((expression, i)=>({ number: i+1, title: `Key equation ${i+1}`, expression, usage: '' }));
}

function splitMarkdownHeadingBlocks(markdown = '', headingRegex) {
  const matches = [...markdown.matchAll(headingRegex)];
  return matches.map((match, index) => {
    const next = matches[index + 1];
    return {
      number: match.length > 2 ? Number(match[1]) : index + 1,
      title: (match.length > 2 ? match[2] : match[1] || '').trim(),
      body: markdown.slice((match.index || 0) + match[0].length, next?.index ?? markdown.length).trim(),
    };
  });
}

function parseCourseUiBlocks(markdown = '') {
  return [...markdown.matchAll(/```uiblock\s*([\s\S]*?)```/g)]
    .map((match, index) => ({...parseUiBlock(match[1]), number: index + 1, raw: match[1]}))
    .filter((block) => block.type);
}

function parseDeskBullets(block = '') {
  return block.split(/\r?\n/).reduce((acc, line) => {
    const match = line.match(/^(?:-\s*)?([^:]+):\s*(.+)$/);
    if (match) acc[match[1].trim()] = match[2].trim();
    return acc;
  }, {});
}

function parseBulletSection(markdown, heading) {
  return markdownSection(markdown, heading)
    .split(/\r?\n/)
    .map((line) => line.match(/^-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function parseNumberedSection(markdown, heading) {
  return markdownSection(markdown, heading)
    .split(/\r?\n/)
    .map((line) => line.match(/^\d+\.\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function parseSourceAppendix(markdown) {
  // Client rendering is fail-closed: authoring appendices, retrieval scores and
  // raw chunk metadata are never accepted as a fallback reference surface.
  const section = markdownSection(markdown, 'References') || markdownSection(markdown, 'References du cours');
  if (!section) return [];
  const cleanReferences = [...section.matchAll(/^-\s+\*([^*\r\n]+)\*\s+—\s+«([\s\S]*?)»\s*(?=^-\s+\*|(?![\s\S]))/gm)]
    .map((match, index)=>({id:`R${index+1}`,title:match[1].trim(),chunk:'',score:'',snippet:match[2].replace(/\s+/g,' ').trim(),withheld:false}));
  return cleanReferences;
}

// Robust to both the current backend format
//   - [S1] Title, chunk 58, score 0.65: clean excerpt
//   - [S2] Title, chunk 9, score 0.4 (extrait non cite: source bruitee)
// and the legacy parenthesised format
//   - [S1] Title (chunk 58, score 0.65)
// Never folds the excerpt (or noise) into the title.
export function parseSourceLine(line, index = 0) {
  if (!line) return null;
  const cleanReference = line.match(/^-\s+\*?([^*—]+?)\*?\s+—\s+«([\s\S]*)»\s*$/);
  if (cleanReference) {
    return {
      id: `R${index + 1}`,
      title: cleanReference[1].trim(),
      chunk: '',
      score: '',
      snippet: cleanReference[2].trim(),
      withheld: false,
    };
  }
  let m = line.match(
    /^-\s+\[(S\d+)\]\s+(.+?),\s*chunk\s+([^,]+),\s+score\s+([\d.]+)\s*(?::\s*(.*)|\((extrait[^)]*)\))?\s*$/i,
  );
  if (m) {
    const withheld = Boolean(m[6]);
    return {
      id: m[1],
      title: m[2].trim(),
      chunk: (m[3] || '').trim(),
      score: m[4] || '',
      snippet: withheld ? '' : (m[5] || '').trim(),
      withheld,
    };
  }
  m = line.match(/^-\s+\[(S\d+)\]\s+(.+?)(?:\s+\(chunk\s+([^,]+),\s+score\s+([^)]+)\))?\s*$/);
  if (m) {
    return {
      id: m[1],
      title: m[2].trim(),
      chunk: (m[3] || '').trim(),
      score: (m[4] || '').trim(),
      snippet: '',
      withheld: false,
    };
  }
  return null;
}

function markdownSection(markdown, heading) {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  if (start === -1) return '';
  const firstLineBreak = markdown.indexOf('\n', start);
  if (firstLineBreak === -1) return '';
  const rest = markdown.slice(firstLineBreak + 1);
  const next = rest.search(/\n##\s+/);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function CourseSidebar({c, scriptModel, language='en', selectedModuleIndex = 0, completedModules = new Set(), onSelectModule, onOpenScript, onOpenResources}) {
  const [modulesOpen, setModulesOpen] = useState(()=>window.matchMedia('(min-width: 900px)').matches);
  useEffect(()=>{
    const media = window.matchMedia('(min-width: 900px)');
    const update = ()=>setModulesOpen(media.matches);
    media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  const lessons = scriptModel?.modules?.length
    ? scriptModel.modules.map((module,idx)=>({
        n: String(idx + 1).padStart(2, '0'),
        t: module.title,
        d: normalizeCourseMicrocopy(module.deliverable || module.objective || (language==='en'?'Desk deliverable':'Livrable de desk'), language),
      }))
    : [];
  const unlockedCount = lessons.length;
  const completedCount = [...completedModules].filter(index=>index>=0 && index<unlockedCount).length;
  return (
    <div className="course-sidebar">
      <div className="panel" style={{padding:16, marginBottom:16}}>
        <div className="label" style={{marginBottom:10}}>Modules completed</div>
        <div className="row between" style={{marginBottom:6}}>
          <span className="mono" style={{fontSize:18,fontWeight:700}}>{completedCount}</span>
          <span className="mono mute" style={{fontSize:11}}>of {unlockedCount}</span>
        </div>
        <div style={{height:3,background:'var(--line)',borderRadius:0}}>
          <div data-course-completion="true" style={{height:'100%',width:`${unlockedCount?Math.round(completedCount/unlockedCount*100):0}%`,background:'var(--red)'}}></div>
        </div>
      </div>
      <details className="panel course-module-list" open={modulesOpen} onToggle={event=>setModulesOpen(event.currentTarget.open)}>
        <summary className="label" style={{padding:'14px'}}>Lesson {Math.min(selectedModuleIndex+1,unlockedCount)} of {unlockedCount} · browse modules</summary>
        {lessons.map((l,idx) => {
          const active = idx === selectedModuleIndex;
          return (
          <button key={`${l.n}-${l.t}`} type="button" className={`course-lesson-item ${active ? 'active' : ''}`} onClick={()=>onSelectModule?.(idx)}>
            <span className="mono mute" style={{fontSize:11, minWidth:22}}>{l.n}</span>
            <div style={{flex:1}}>
              <div className="course-lesson-title">{l.t}</div>
              <div className="mono mute" style={{fontSize:10.5,marginTop:2}}>{l.d}</div>
            </div>
            <Icon name={completedModules.has(idx)?'check':active?'play':'circle'} size={12} style={{color: completedModules.has(idx)?'var(--green)':active?'var(--red)':'var(--steel)', marginTop:2}}/>
          </button>
        )})}
      </details>
    </div>
  );
}

function HedgingContent(props = {}) {
  // Real delta-gamma-vega-theta scenario P&L attribution — a genuine desk tool.
  // Units: delta = € per +1% spot; gamma = € per (1%)^2; vega = € per +1 vol pt; theta = € per day.
  // A course block may supply engine-priced book Greeks via params {delta,gamma,vega,theta,
  // dSpotPct,dVolPts,dDays}; otherwise fall back to the §2.6 stoch-calc calendar defaults
  // (short 1000 ATM 1m / long 1000 ATM 1y, x100, delta-hedged): short-gamma, long-vega, positive-theta.
  const num0 = (v, d) => (Number.isFinite(+v) ? +v : d);
  const [g, setG] = useState({
    delta: num0(props.delta, 0), gamma: num0(props.gamma, -4998.5),
    vega: num0(props.vega, 26066.2), theta: num0(props.theta, 2715.3),
  });
  const [sc, setSc] = useState({
    dS: num0(props.dSpotPct, -2), dVol: num0(props.dVolPts, 3), days: num0(props.dDays, 1),
  });
  const num = (e) => parseFloat(e.target.value) || 0;
  const pnl = {
    Delta: g.delta * sc.dS,
    Gamma: 0.5 * g.gamma * sc.dS * sc.dS,
    Vega: g.vega * sc.dVol,
    Theta: g.theta * sc.days,
  };
  const total = pnl.Delta + pnl.Gamma + pnl.Vega + pnl.Theta;
  const parts = Object.entries(pnl);
  const maxAbs = Math.max(1, ...parts.map(([, v]) => Math.abs(v)));
  const dom = parts.slice().sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0][0];
  const eur = (x) => (x >= 0 ? '+' : '−') + '€' + Math.abs(Math.round(x)).toLocaleString();
  const field = (obj, set, k, label, suffix) => (
    <div>
      <div className="mono mute" style={{ fontSize: 11, marginBottom: 4 }}>{label}</div>
      <input aria-label={label} type="number" value={obj[k]} onChange={(e) => set((p) => ({ ...p, [k]: num(e) }))}
        style={{ width: '100%', background: '#0A0C10', border: '1px solid var(--line-2)', padding: '7px 9px', borderRadius: 3, color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
    </div>
  );
  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="panel" style={{ padding: 24 }}>
        <div className="section-eyebrow" style={{ margin: 0 }}>// Lesson 3.1 · Delta-Gamma-Vega-Theta</div>
        <h2 className="mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 10 }}>Scenario P&L attribution.</h2>
        <p className="text-2" style={{ fontSize: 13.5, lineHeight: 1.7 }}>A second-order Taylor expansion of the book P&L. Enter your aggregate Greeks and a market scenario; the desk reads the dominant exposure before deciding the hedge.</p>
        <div className="panel-2 mono" style={{ padding: 16, margin: '12px 0', fontSize: 13, textAlign: 'center' }}>ΔP&L ≈ Δ·dS + ½·Γ·dS² + ν·dσ + Θ·dt</div>
      </div>
      <div className="grid-2">
        <div className="panel" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Book Greeks</div>
          <div className="grid-2" style={{ gap: 12 }}>
            {field(g, setG, 'delta', 'Delta (€ / +1% spot)')}
            {field(g, setG, 'gamma', 'Gamma (€ / 1%²)')}
            {field(g, setG, 'vega', 'Vega (€ / vol pt)')}
            {field(g, setG, 'theta', 'Theta (€ / day)')}
          </div>
          <div className="label" style={{ margin: '18px 0 12px' }}>Market scenario</div>
          <div className="grid-3" style={{ gap: 12 }}>
            {field(sc, setSc, 'dS', 'Spot move (%)')}
            {field(sc, setSc, 'dVol', 'Vol move (pts)')}
            {field(sc, setSc, 'days', 'Days elapsed')}
          </div>
        </div>
        <div className="panel" style={{ padding: 20 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <div className="label">P&L attribution</div>
            <span className="badge" style={{ background: 'rgba(255,46,69,.08)', color: 'var(--red)' }}>Dominant: {dom}</span>
          </div>
          {parts.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
              <span className="mono" style={{ fontSize: 12, width: 56, color: 'var(--mute)' }}>{k}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(100, Math.abs(v) / maxAbs * 100) + '%', background: v >= 0 ? 'var(--green)' : 'var(--red)' }} />
              </div>
              <span className="mono" style={{ fontSize: 12, width: 96, textAlign: 'right', color: v >= 0 ? 'var(--green)' : 'var(--red)' }}>{eur(v)}</span>
            </div>
          ))}
          <div className="row between" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <span className="mono" style={{ fontWeight: 700 }}>Total P&L</span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 18, color: total >= 0 ? 'var(--green)' : 'var(--red)' }}>{eur(total)}</span>
          </div>
          <div className="mono mute" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>
            Hedge read: neutralise <b>{dom}</b> first. To flatten delta, trade {Math.round(-g.delta).toLocaleString()} € of the underlying per 1%; gamma/vega need options, not spot.
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseContent({c, scriptState, scriptModel, selectedModuleIndex, onSelectModule, onOpenScript}) {
  return (
    <PracticeCourseContent
      c={c}
      scriptState={scriptState}
      scriptModel={scriptModel}
      selectedModuleIndex={selectedModuleIndex}
      onSelectModule={onSelectModule}
      onOpenScript={onOpenScript}
    />
  );
}

function CourseScript({c, scriptState, scriptModel}) {
  const scriptSlug = COURSE_SCRIPT_SLUGS[c.id];

  if (scriptState.status === 'loading') {
    return (
      <div className="panel course-script-state">
        <Icon name="loader-circle" size={16} style={{color:'var(--red)'}}/>
        <span className="mono mute">Loading generated course script...</span>
      </div>
    );
  }

  if (scriptState.status === 'missing' || scriptState.status === 'error') {
    return (
      <div className="panel course-script-state">
        <Icon name="circle-alert" size={16} style={{color:'var(--red)'}}/>
        <span className="mono mute">{scriptState.error || 'No generated script is mapped to this course yet.'}</span>
      </div>
    );
  }

  const formulaCount = scriptModel?.formulas?.length || 0;
  const sourceCount = scriptModel?.sources?.length || 0;
  const personaScript = String(scriptState.content || '')
    .replace(/\[S(?:\d+|x)\]/gi, '')
    .replace(/^.*(?:chunk[_ -]?id|retrieval score|similarity score|source family slug).*$/gim, '')
    .replace(/\n{3,}/g, '\n\n');

  return (
    <div className="col course-script-shell" style={{gap:14}}>
      <div className="panel course-script-hero">
        <div>
          <div className="section-eyebrow" style={{margin:0}}>// Generated desk course</div>
          <h2 className="mono">{c.title} · course script</h2>
          <p className="text-2">
            Notes de cours avec hypothèses explicites, démonstrations, cas corrigés et références consultables.
          </p>
          <div className="row" style={{gap:8,flexWrap:'wrap',marginTop:14}}>
            <span className="badge">{formulaCount} formulas</span>
            <span className="badge">{sourceCount} sources</span>
            <span className="badge">{c.level} · {c.duration}</span>
          </div>
        </div>
        <span className="badge">Learner view</span>
      </div>
      <CourseProvenancePanel sourceCount={sourceCount}/>
      <div className="panel course-script-panel">
        <LatexMarkdown content={personaScript}/>
      </div>
    </div>
  );
}

function CourseProvenancePanel({sourceCount = 0}) {
  return (
    <div className="panel" data-course-provenance="true" style={{padding:16}}>
      <div className="row between" style={{gap:12,alignItems:'flex-start'}}>
        <div>
          <div className="label">Content provenance</div>
          <p className="text-2" style={{margin:'6px 0 0',fontSize:12.5,lineHeight:1.55}}>
            The course separates what comes from the reviewed library from what is
            authored for practice. {sourceCount} readable source excerpts are attached below.
          </p>
        </div>
        <span className="badge">Traceable content</span>
      </div>
      <div className="grid-3" style={{marginTop:14,gap:10}}>
        <div><span className="badge">Source excerpt</span><div className="mute" style={{fontSize:11,marginTop:6}}>Readable extract from the reviewed corpus.</div></div>
        <div><span className="badge">Pedagogical rewrite</span><div className="mute" style={{fontSize:11,marginTop:6}}>Original explanation structured for the learner.</div></div>
        <div><span className="badge">Verified generation</span><div className="mute" style={{fontSize:11,marginTop:6}}>Examples, exercises and quizzes; numbers recomputed by the deterministic engine.</div></div>
      </div>
    </div>
  );
}

// Parse a ```uiblock fenced spec (type: / title: / params: {…}) into an object.
function parseUiBlock(text='') {
  const out = { type:'', title:'', params:{} };
  const mt = text.match(/type:\s*([a-z_]+)/i); if (mt) out.type = mt[1].trim();
  const ti = text.match(/title:\s*(.+)/i); if (ti) out.title = ti[1].trim();
  const mp = text.match(/params:\s*(\{[\s\S]*\})/i);
  if (mp) {
    try {
      // Course generation emits strict JSON. Parse it untouched so ordinary
      // apostrophes inside French/English strings cannot corrupt the payload.
      out.params = JSON.parse(mp[1]);
    } catch {
      try {
        // Bounded compatibility path for old authoring blocks that used
        // unquoted keys / single-quoted values. New content must not rely on it.
        out.params = JSON.parse(mp[1].replace(/([{,]\s*)([a-zA-Z_][\w]*)\s*:/g,'$1"$2":').replace(/'([^']*)'/g,'"$1"'));
      } catch { out.params = {}; }
    }
  }
  return out;
}

const RAG_API = getPracticeApiBase();

const TONE_COLOR = { blue:'var(--blue)', amber:'var(--amber)', green:'var(--green)', red:'var(--red)' };

// Reference price history. Tries the backend historical API first; when no
// backend is reachable, falls back to the bundled dated snapshot. Neither path
// is an executable quote, and the rendered provenance states that explicitly.
function UIPriceChart({ symbol='AAPL', points=140 }) {
  const [data,setData] = useState(null);
  useEffect(()=>{
    let ok=true;
    fetch(`${RAG_API}/market/history/${encodeURIComponent(symbol)}?points=${points}`)
      .then(r=>r.ok?r.json():null)
      .then(j=>{
        if(!ok) return;
        if(j&&Array.isArray(j.series)&&j.series.length){
          const closes=j.series.map(s=>s.close);
          setData({
            label:symbol,
            closes,
            src:`${(j.rows||closes.length).toLocaleString()} daily bars`,
            range:[j.series[0].date, j.series[j.series.length-1].date],
            provenance:j.provenance || null,
          });
        } else throw new Error('no-backend');
      })
      .catch(()=>{ loadDeskSeries().then(b=>{
        if(!ok) return;
        const key=SYMBOL_ALIAS[symbol]||'SPX';
        const s=b.series?.[key];
        if(s&&s.points?.length) setData({
          label:s.label,
          closes:s.points.map(p=>p.c),
          src:s.source,
          range:[s.points[0].d, s.points[s.points.length-1].d],
          provenance:{source:s.source, status:'offline_snapshot', as_of_date:s.points[s.points.length-1].d, unit:s.unit || 'native', limitations:'historical reference only; not an executable quote'},
        });
      }); });
    return ()=>{ok=false;};
  },[symbol,points]);
  if(!data) return <div className="mute mono" style={{fontSize:12,padding:14}}>Chargement de l'historique de référence…</div>;
  const series=[{name:data.label,color:'var(--blue)',data:data.closes.map((y,i)=>({x:i,y}))}];
  const last=data.closes[data.closes.length-1];
  const provenance = data.provenance;
  const limitations = Array.isArray(provenance?.limitations)
    ? provenance.limitations.join(' · ')
    : (provenance?.limitations || 'historique quotidien, pas un prix exécutable.');
  return (<div><LineChart series={series} xAxis={false} height={160}/><div className="mono mute" style={{fontSize:11,marginTop:6}}>{data.label} · {data.src}{data.range?` · ${data.range[0]} → ${data.range[1]}`:''} · dernier {fmt(last)}</div>{provenance&&<div data-price-provenance="true" className="mono mute" style={{fontSize:10.5,marginTop:6}}>Source: {provenance.source} · statut: {provenance.status} · as-of: {provenance.as_of_date} · unité: {provenance.unit} · limites: {limitations}</div>}</div>);
}

// A genuine real-market anchor for each course: the live-history line of the most
// relevant asset (price / implied vol / yield / credit spread) plus a secondary
// sparkline and a stat strip — all from the bundled farmed cache, no backend.
function CourseMarketWidget({ slug }) {
  const [bundle,setBundle] = useState(null);
  useEffect(()=>{ let ok=true; loadDeskSeries().then(b=>{ if(ok) setBundle(b); }); return ()=>{ok=false;}; },[]);
  const pick = pickCourseSeries(slug);
  if(!pick) return null;
  const color = TONE_COLOR[pick.tone] || 'var(--blue)';
  if(!bundle) return <div className="panel" style={{padding:16,margin:'14px 0'}}><div className="mute mono" style={{fontSize:12}}>Chargement de l’historique de référence…</div></div>;
  const prim = bundle.series?.[pick.primary];
  if(!prim || !prim.points?.length) return null;
  const sec = pick.secondary ? bundle.series?.[pick.secondary] : null;
  const closes = prim.points.map(p=>p.c);
  const first=closes[0], last=closes[closes.length-1];
  const lo=Math.min(...closes), hi=Math.max(...closes);
  const chgPct=((last-first)/(Math.abs(first)||1))*100;
  const isRate = prim.unit==='%';
  const chgLabel = isRate ? `${(last-first>=0?'+':'')}${((last-first)*100).toFixed(0)} bp` : `${chgPct>=0?'+':''}${chgPct.toFixed(1)}%`;
  const series=[{name:prim.label,color,data:closes.map((y,i)=>({x:i,y}))}];
  const d0=prim.points[0].d, d1=prim.points[prim.points.length-1].d;
  return (
    <div className="panel course-market-widget" style={{padding:16,margin:'14px 0'}}>
      <div className="row between" style={{marginBottom:10,alignItems:'flex-start',gap:12}}>
        <div>
          <div className="label">Historique de référence</div>
          <h4 className="mono" style={{margin:'4px 0 0',fontSize:14}}>{prim.label}</h4>
        </div>
        <span className="badge" style={{background:'rgba(25,195,125,.08)',color:'var(--green)'}}>snapshot offline · {prim.source}</span>
      </div>
      <LineChart series={series} xAxis={false} height={160}/>
      <div className="course-market-stats">
        <div><div className="label">Periode</div><p className="mono">{d0} → {d1}</p></div>
        <div><div className="label">Dernier</div><p className="mono">{fmt(last)}{isRate?'%':''}</p></div>
        <div><div className="label">Variation</div><p className="mono" style={{color:(last-first)>=0?'var(--green)':'var(--red)'}}>{chgLabel}</p></div>
        <div><div className="label">Min / Max</div><p className="mono">{fmt(lo)} / {fmt(hi)}</p></div>
      </div>
      {sec && sec.points?.length>0 && (
        <div className="row between course-market-sec" style={{marginTop:10,alignItems:'center',gap:12}}>
          <div><div className="label">{sec.label}</div><p className="mono mute" style={{margin:'2px 0 0',fontSize:11}}>dernier {fmt(sec.points[sec.points.length-1].c)}{sec.unit==='%'?'%':''}</p></div>
          <Spark data={sec.points.map(p=>p.c)} width={140} height={30} color={(TONE_COLOR[pick.tone==='green'?'amber':'green'])} fill/>
        </div>
      )}
      <p className="mute" style={{fontSize:12,lineHeight:1.5,marginTop:10}}>{pick.read}</p>
      <p className="mono mute" style={{fontSize:10.5,lineHeight:1.5,marginTop:8}}>Statut: snapshot historique local · source: {prim.source} · unité: {prim.unit || 'unité native'} · dernière observation: {d1} · pas de quote live ni de signal d’investissement.</p>
    </div>
  );
}

function UIScenarioTable(props) {
  const { rows, cols, cells, rowLabel, sourceStatus } = props;
  // Generic engine-fed grid: a course supplies explicit rows/cols/cells (real
  // rate-shock / VaR / KRD01 numbers) instead of the Black-Scholes option grid.
  if (Array.isArray(rows) && Array.isArray(cols) && Array.isArray(cells)) {
    return (<div data-scenario-table="true"><table className="data"><thead><tr><th>{rowLabel||''}</th>{cols.map((c,i)=><th key={i} className="num">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i}><td className="symbol">{r}</td>{(cells[i]||[]).map((v,j)=>{ const neg=String(v).trim().startsWith('-'); return <td key={j} className="num" style={neg?{color:'var(--red)'}:undefined}>{String(v)}</td>; })}</tr>)}</tbody></table>{sourceStatus&&<div className="mono mute" style={{fontSize:10.5,marginTop:8}}>{sourceStatus}</div>}</div>);
  }
  const { spot=100, strike=100, vol=0.2, T=0.25, kind='call' } = props;
  const ss=[-0.2,-0.1,0,0.1,0.2], vs=[-0.05,0,0.05];
  const px=(s,v)=>bsPrice({S:spot*(1+s),K:strike,r:0.02,sigma:Math.max(0.01,vol+v),T,type:kind}).price;
  return (<table className="data"><thead><tr><th>vol \ spot</th>{ss.map(s=><th key={s} className="num">{(s>=0?'+':'')+(s*100)}%</th>)}</tr></thead>
    <tbody>{vs.map(v=><tr key={v}><td className="symbol">{(v>=0?'+':'')+(v*100)} pts</td>{ss.map(s=><td key={s} className="num">{fmt(px(s,v))}</td>)}</tr>)}</tbody></table>);
}

// --- Credit (CDS) interactive blocks -------------------------------------
// A genuine single-name CDS risk panel: CS01, carry, PV of premium leg and
// jump-to-default, all from the same closed forms the deterministic engine
// (family cds_cs01) uses. Sign is shown from the protection BUYER's view.
function CDSScenario({ notional=50000000, spread_bp=120, riskyAnnuity=4.2, recovery=40, shock_bp=25, side='buyer' }) {
  const [g, setG] = useState({ notional, spread_bp, riskyAnnuity, recovery });
  const [sc, setSc] = useState({ shock_bp });
  const num = (e) => parseFloat(e.target.value) || 0;
  const N = g.notional, R = g.recovery/100;
  const cs01 = g.riskyAnnuity * N * 1e-4;          // EUR / bp
  const coupon = g.spread_bp * 1e-4 * N;           // EUR / year
  const pvPrem = coupon * g.riskyAnnuity;          // EUR
  const jtd = (1 - R) * N;                          // EUR (loss to seller / gain to buyer)
  const mtm = cs01 * sc.shock_bp;                  // protection BUYER gains when spread widens
  const sgn = side === 'seller' ? -1 : 1;
  const rows = [
    ['CS01 (EUR / bp)', cs01, false],
    ['MtM du choc (CS01 x ' + sc.shock_bp + ' bp)', sgn * mtm, true],
    ['Carry annuel (coupon)', sgn * -coupon, true],   // buyer PAYS the coupon
    ['PV jambe de prime', pvPrem, false],
    ['Jump-to-default', sgn * jtd, true],
  ];
  const maxAbs = Math.max(1, ...rows.map(([, v]) => Math.abs(v)));
  const eur = (x) => (x >= 0 ? '+' : '−') + '€' + Math.abs(Math.round(x)).toLocaleString();
  const field = (obj, set, k, label) => (
    <div>
      <div className="mono mute" style={{ fontSize: 11, marginBottom: 4 }}>{label}</div>
      <input aria-label={label} type="number" value={obj[k]} onChange={(e) => set((p) => ({ ...p, [k]: num(e) }))}
        style={{ width: '100%', background: '#0A0C10', border: '1px solid var(--line-2)', padding: '7px 9px', borderRadius: 3, color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
    </div>
  );
  return (
    <div className="grid-2" data-cds-scenario="true">
      <div className="panel" style={{ padding: 20 }}>
        <div className="label" style={{ marginBottom: 12 }}>Ticket CDS ({side === 'seller' ? 'vendeur' : 'acheteur'} de protection)</div>
        <div className="grid-2" style={{ gap: 12 }}>
          {field(g, setG, 'notional', 'Notionnel (EUR)')}
          {field(g, setG, 'spread_bp', 'Spread (bp)')}
          {field(g, setG, 'riskyAnnuity', 'Risky annuity (RPV01)')}
          {field(g, setG, 'recovery', 'Recovery (%)')}
        </div>
        <div className="label" style={{ margin: '18px 0 12px' }}>Scenario marche</div>
        <div className="grid-2" style={{ gap: 12 }}>
          {field(sc, setSc, 'shock_bp', 'Ecartement de spread (bp)')}
        </div>
      </div>
      <div className="panel" style={{ padding: 20 }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="label">Risque & P&L</div>
          <span className="badge" style={{ background: 'rgba(255,46,69,.08)', color: 'var(--red)' }}>JtD: {eur(sgn * jtd)}</span>
        </div>
        {rows.map(([k, v, signed]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
            <span className="mono" style={{ fontSize: 11, width: 150, color: 'var(--mute)' }}>{k}</span>
            <div style={{ flex: 1, height: 8, background: 'var(--line)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: Math.min(100, Math.abs(v) / maxAbs * 100) + '%', background: (signed ? v >= 0 : true) ? 'var(--green)' : 'var(--red)' }} />
            </div>
            <span className="mono" style={{ fontSize: 12, width: 120, textAlign: 'right', color: signed ? (v >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text)' }}>{signed ? eur(v) : '€' + Math.round(v).toLocaleString()}</span>
          </div>
        ))}
        <div className="mono mute" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>CS01 = RPV01 × notionnel × 1bp · JtD = (1−R) × notionnel · signe = {side === 'seller' ? 'vendeur' : 'acheteur'} de protection.</div>
      </div>
    </div>
  );
}

function CDSScenarioTable({ notional=50000000, spread_bp=120, riskyAnnuity=4.2, recovery=40, shocks_bp=[-50,-25,0,25,50,100,200], side='buyer' }) {
  const N = notional, R = recovery/100, sgn = side === 'seller' ? -1 : 1;
  const cs01 = riskyAnnuity * N * 1e-4;
  const coupon = spread_bp * 1e-4 * N;
  const jtd = (1 - R) * N;
  const eur = (x) => (x >= 0 ? '+' : '−') + '€' + Math.abs(Math.round(x)).toLocaleString();
  return (
    <div>
      <table className="data"><thead><tr>
        <th>Choc spread</th><th className="num">ΔMtM (CS01×Δs)</th><th className="num">Carry annuel</th><th className="num">Net 1 an</th>
      </tr></thead>
      <tbody>{shocks_bp.map((s) => {
        const mtm = sgn * cs01 * s;
        const carry = sgn * -coupon;       // buyer pays carry
        return (<tr key={s}><td className="symbol">{(s>=0?'+':'')+s} bp</td>
          <td className="num" style={{color: mtm>=0?'var(--green)':'var(--red)'}}>{eur(mtm)}</td>
          <td className="num" style={{color: carry>=0?'var(--green)':'var(--red)'}}>{eur(carry)}</td>
          <td className="num" style={{color: (mtm+carry)>=0?'var(--green)':'var(--red)'}}>{eur(mtm+carry)}</td></tr>);
      })}</tbody></table>
      <div className="mono mute" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>CS01 = €{Math.round(cs01).toLocaleString()}/bp · jump-to-default = {eur(sgn*jtd)} (domine tout choc de spread) · vue {side === 'seller' ? 'vendeur' : 'acheteur'} de protection.</div>
    </div>
  );
}

function UICorrMatrix({ labels = [], matrix = [], sourceStatus = 'Hypothetical teaching assumptions — not observed market data.' }) {
  const col = (v) => { const x = Math.max(-1, Math.min(1, Number(v) || 0)), a = Math.abs(x);
    return x >= 0 ? `rgba(46,204,113,${0.10 + 0.55 * a})` : `rgba(255,46,69,${0.10 + 0.55 * a})`; };
  return (<div data-correlation-matrix="true"><table className="data" style={{ fontSize: 11 }}><thead><tr><th></th>{labels.map((l, i) => <th key={i} className="num">{l}</th>)}</tr></thead>
    <tbody>{matrix.map((row, i) => <tr key={i}><td className="symbol">{labels[i]}</td>{row.map((v, j) => <td key={j} className="num" style={{ background: col(v), color: 'var(--text)' }}>{Number(v).toFixed(2)}</td>)}</tr>)}</tbody></table><div className="mono mute" style={{fontSize:10.5,marginTop:8}}>{sourceStatus}</div></div>);
}

function UIGreeksScenario({ delta=0, gamma=0, vega=0, theta=0, spotMove=-2, volMove=3 }) {
  const [moves, setMoves] = useState({ spot: Number(spotMove), vol: Number(volMove) });
  const parts = [
    ['Delta', Number(delta) * moves.spot, 'Delta × Δspot (%)'],
    ['Gamma', 0.5 * Number(gamma) * moves.spot ** 2, '½ × Gamma × Δspot²'],
    ['Vega', Number(vega) * moves.vol, 'Vega × Δvol (pts)'],
    ['Theta', Number(theta), 'Theta × 1 jour'],
  ];
  const total = parts.reduce((sum, [,value]) => sum + value, 0);
  const maxAbs = Math.max(1, ...parts.map(([,value]) => Math.abs(value)));
  const eur = (value) => `${value >= 0 ? '+' : '−'}€${Math.abs(Math.round(value)).toLocaleString()}`;
  return (
    <div data-greeks-scenario="true">
      <div className="grid-2" style={{gap:16,marginBottom:16}}>
        <label className="mono" style={{fontSize:11}}>Choc spot: {moves.spot >= 0 ? '+' : ''}{moves.spot}%<input aria-label="Course spot shock" type="range" min="-10" max="10" step="0.5" value={moves.spot} onChange={(event)=>setMoves((current)=>({...current,spot:Number(event.target.value)}))} style={{width:'100%',marginTop:8}}/></label>
        <label className="mono" style={{fontSize:11}}>Choc vol: {moves.vol >= 0 ? '+' : ''}{moves.vol} pts<input aria-label="Course volatility shock" type="range" min="-10" max="10" step="0.5" value={moves.vol} onChange={(event)=>setMoves((current)=>({...current,vol:Number(event.target.value)}))} style={{width:'100%',marginTop:8}}/></label>
      </div>
      {parts.map(([label,value,formula])=><div key={label} style={{display:'grid',gridTemplateColumns:'70px minmax(120px,1fr) 125px',gap:10,alignItems:'center',padding:'6px 0'}}><span className="mono mute" style={{fontSize:11}}>{label}</span><div style={{height:8,background:'var(--line)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.abs(value)/maxAbs*100}%`,background:value>=0?'var(--green)':'var(--red)'}}/></div><span className="mono" style={{fontSize:11,textAlign:'right',color:value>=0?'var(--green)':'var(--red)'}} title={formula}>{eur(value)}</span></div>)}
      <div className="row between" style={{borderTop:'1px solid var(--line)',marginTop:10,paddingTop:10}}><span className="label">P&amp;L local total</span><strong className="mono" style={{color:total>=0?'var(--green)':'var(--red)'}}>{eur(total)}</strong></div>
      <div className="mono mute" style={{fontSize:10.5,marginTop:8}}>Approximation locale avec unités opérationnelles : delta par 1% spot, gamma par (1%)², vega par point de vol, theta par jour.</div>
    </div>
  );
}

function UIVolSmile({ matrix=[], strikes=[], maturities=[] }) {
  const values = matrix.flat().map(Number).filter(Number.isFinite);
  if (!values.length) return <div className="mono mute">Aucun noeud de volatilité authentifié.</div>;
  const lo = Math.min(...values), hi = Math.max(...values);
  const strikeLabels = strikes.length === matrix[0]?.length ? strikes : matrix[0].map((_,index)=>`K${index+1}`);
  const maturityLabels = maturities.length === matrix.length ? maturities : matrix.map((_,index)=>`T${index+1}`);
  const fill = (value) => {
    const weight = (Number(value)-lo)/Math.max(hi-lo,1e-12);
    return `rgba(255,46,69,${0.10+0.60*weight})`;
  };
  return <div data-vol-smile="true"><table className="data"><thead><tr><th>Échéance / strike</th>{strikeLabels.map((strike)=><th key={strike} className="num">{strike}</th>)}</tr></thead><tbody>{matrix.map((row,rowIndex)=><tr key={maturityLabels[rowIndex]}><td className="symbol">{maturityLabels[rowIndex]}</td>{row.map((value,colIndex)=><td key={colIndex} className="num" style={{background:fill(value)}}>{(Number(value)*100).toFixed(1)}%</td>)}</tr>)}</tbody></table><div className="mono mute" style={{fontSize:10.5,marginTop:8}}>Volatilités annuelles en décimal dans le script authentifié ; rendu en pourcentage sans extrapolation.</div></div>;
}

function UIPathDependentPayoff({kind, spot=100, strike=100, barrier=80, rebate=0, notional=1000, autocallBarrier=1, couponBarrier=0.7, protectionBarrier=0.6, couponRate=0.08}) {
  const initial = Number(spot);
  const [barrierPath,setBarrierPath] = useState({minimum:Math.min(initial,Number(barrier)+5),terminal:initial});
  const [observations,setObservations] = useState([95,105,75].map((level)=>level/100*initial));
  const money = (value)=>`€${Number(value).toLocaleString(undefined,{maximumFractionDigits:2})}`;
  if (kind==='barrier') {
    const knocked = barrierPath.minimum <= Number(barrier);
    const terminalPayoff = knocked ? Number(rebate) : Math.max(barrierPath.terminal-Number(strike),0);
    return <div data-path-dependent-payoff="barrier"><div className="grid-2" style={{gap:16}}><label className="mono" style={{fontSize:11}}>Minimum observé: {fmt(barrierPath.minimum,1)}<input aria-label="Course barrier minimum" type="range" min="0" max={initial*1.2} step="1" value={barrierPath.minimum} onChange={(event)=>setBarrierPath((current)=>({...current,minimum:Number(event.target.value)}))} style={{width:'100%',marginTop:8}}/></label><label className="mono" style={{fontSize:11}}>Spot terminal: {fmt(barrierPath.terminal,1)}<input aria-label="Course barrier terminal spot" type="range" min="0" max={initial*1.8} step="1" value={barrierPath.terminal} onChange={(event)=>setBarrierPath((current)=>({...current,terminal:Number(event.target.value)}))} style={{width:'100%',marginTop:8}}/></label></div><div className="grid-3" style={{marginTop:14}}><Stat label="État" value={knocked?'Knocked out':'Alive'} accent={knocked?'var(--red)':'var(--green)'}/><Stat label="Payoff terminal" value={money(terminalPayoff)}/><Stat label="Barrière" value={fmt(Number(barrier),1)}/></div><div className="mono mute" style={{fontSize:10.5,marginTop:10}}>Down-and-out call pédagogique: max(Sₜ−K,0) si le minimum reste strictement au-dessus de la barrière, sinon rebate. Payoff non actualisé — ce widget ne prétend pas fournir un prix.</div></div>;
  }
  const setObservation=(index,value)=>setObservations((current)=>current.map((item,itemIndex)=>itemIndex===index?value:item));
  const autocallLevel=Number(autocallBarrier)*initial, couponLevel=Number(couponBarrier)*initial, protectionLevel=Number(protectionBarrier)*initial;
  const callIndex=observations.findIndex((level,index)=>index<2&&level>=autocallLevel);
  let redemption, outcome;
  if(callIndex>=0){redemption=Number(notional)*(1+Number(couponRate)*(callIndex+1));outcome=`Autocall observation ${callIndex+1}`;}
  else {const terminal=observations[2];const coupon=terminal>=couponLevel?Number(couponRate)*3:0;redemption=terminal>=protectionLevel?Number(notional)*(1+coupon):Number(notional)*terminal/initial;outcome=terminal>=protectionLevel?'Remboursement à maturité':'Protection cassée';}
  return <div data-path-dependent-payoff="autocall"><div className="grid-3" style={{gap:12}}>{observations.map((level,index)=><label key={index} className="mono" style={{fontSize:11}}>Observation {index+1}: {(level/initial*100).toFixed(0)}%<input aria-label={`Course autocall observation ${index+1}`} type="range" min="30" max="130" step="1" value={level/initial*100} onChange={(event)=>setObservation(index,Number(event.target.value)/100*initial)} style={{width:'100%',marginTop:8}}/></label>)}</div><div className="grid-3" style={{marginTop:14}}><Stat label="Issue" value={outcome}/><Stat label="Remboursement" value={money(redemption)}/><Stat label="P&L capital" value={money(redemption-Number(notional))} accent={redemption>=Number(notional)?'var(--green)':'var(--red)'}/></div><div className="mono mute" style={{fontSize:10.5,marginTop:10}}>Term sheet pédagogique explicite: autocall {autocallBarrier*100}%, coupon {couponRate*100}% par observation, barrière coupon {couponBarrier*100}%, protection {protectionBarrier*100}%. Payoff déterministe non actualisé — aucune valorisation autocall n'est revendiquée.</div></div>;
}

function UIMonteCarlo({ paths=20000, spot=100, strike=100, vol=0.2, T=1 }) {
  const [pathCount,setPathCount] = useState(Math.min(50000,Math.max(100,Number(paths))));
  const [state,setState] = useState({status:'loading',result:null,error:''});
  useEffect(()=>{
    let active=true;
    setState({status:'loading',result:null,error:''});
    import('../lib/monteCarlo.mjs').then(({analyzeMonteCarlo,MONTE_CARLO_INPUT_SCHEMA})=>analyzeMonteCarlo({
      schemaVersion:MONTE_CARLO_INPUT_SCHEMA,mode:'pricing_risk_neutral',spot:Number(spot),volatility:Number(vol),maturityYears:Number(T),dayCount:'ACT/365F',paths:pathCount,timeSteps:12,seed:7,method:'antithetic',samplePaths:Math.min(8,pathCount),histogramBins:20,currency:'EUR',quantity:1,contractMultiplier:1,position:'long',riskFreeRate:0.05,dividendYield:0,strike:Number(strike),optionType:'call',payoffType:'european',
    })).then((result)=>{if(active)setState({status:'ready',result,error:''});}).catch((error)=>{if(active)setState({status:'error',result:null,error:error.message||'Monte Carlo indisponible'});});
    return ()=>{active=false;};
  },[pathCount,spot,strike,vol,T]);
  const pricing=state.result?.pricing;
  return <div data-monte-carlo-course="true"><label className="mono" style={{fontSize:11}}>Trajectoires: {pathCount.toLocaleString()}<input aria-label="Course Monte Carlo paths" type="range" min="1000" max="50000" step="1000" value={pathCount} onChange={(event)=>setPathCount(Number(event.target.value))} style={{width:'100%',margin:'8px 0 14px'}}/></label>{state.status==='loading'&&<div className="mono mute">Simulation déterministe seed 7…</div>}{state.status==='error'&&<div className="form-notice error">{state.error}</div>}{pricing&&<><div className="grid-4"><Stat label="Prix MC" value={fmt(pricing.price,4)}/><Stat label="Erreur standard" value={fmt(pricing.standardError,4)}/><Stat label="IC 95%" value={`[${fmt(pricing.ci95.lower,4)} ; ${fmt(pricing.ci95.upper,4)}]`}/><Stat label="Black-Scholes" value={fmt(pricing.blackScholesBenchmark,4)}/></div><div className="mono mute" style={{fontSize:10.5,marginTop:10}}>Moteur canonique v{state.result.engineVersion} · antithétiques · {pricing.effectiveSamples.toLocaleString()} échantillons effectifs · benchmark {pricing.benchmarkInsideCi95?'dans':'hors'} IC.</div></>}</div>;
}

function UIPayoffChart({ spot=100, strike=100, kind='call', premium=0, qty=1, title='' }) {
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    let active = true;
    setAnalysis(null);
    setAnalysisError('');
    const S0 = Number(spot), K = Number(strike), rawQuantity = Number(qty), entryPremium = Number(premium);
    const kindText = String(kind || '').toLowerCase();
    const quantity = Math.abs(rawQuantity);
    if (!Number.isFinite(S0) || !Number.isFinite(K) || !Number.isSafeInteger(quantity) || quantity < 1 || !Number.isFinite(entryPremium) || entryPremium < 0) {
      setAnalysisError('Paramètres payoff invalides : spot/strike positifs, prime positive ou nulle et quantité entière requise.');
      return () => { active = false; };
    }
    import('../lib/payoffStrategy.mjs')
      .then(({ analyzePayoffStrategy }) => analyzePayoffStrategy({
        spot: S0,
        volatility: 0.2,
        timeToMaturity: 1,
        riskFreeRate: 0,
        dividendYield: 0,
        currency: 'EUR',
        contractMultiplier: 1,
        gridPoints: 201,
        legs: [{
          id: 'course-payoff',
          type: kindText.includes('put') ? 'put' : 'call',
          side: kindText.includes('short') || rawQuantity < 0 ? 'short' : 'long',
          strike: K,
          quantity,
          premiumSource: 'manual',
          manualPremium: entryPremium,
        }],
      }))
      .then((result) => { if (active) setAnalysis(result); })
      .catch((error) => { if (active) setAnalysisError(error instanceof Error ? error.message : 'Analyse payoff impossible.'); });
    return () => { active = false; };
  }, [spot, strike, kind, premium, qty]);

  if (analysisError) return <div className="form-notice error">{analysisError}</div>;
  if (!analysis) return <div className="mono mute" style={{padding:18}}>Analyse exacte du payoff…</div>;

  const W=820, H=260, ML=52, MR=18, MT=18, MB=30;
  const xs = analysis.curve.map((point) => point.terminalSpot);
  const ys = analysis.curve.map((point) => point.terminalPnl);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const rawMin = Math.min(0, ...ys), rawMax = Math.max(0, ...ys);
  const padding = Math.max((rawMax - rawMin) * 0.1, 1);
  const yMin = rawMin - padding, yMax = rawMax + padding;
  const X = (value) => ML + (value - xMin) / Math.max(xMax - xMin, 1) * (W - ML - MR);
  const Y = (value) => MT + (1 - (value - yMin) / Math.max(yMax - yMin, 1)) * (H - MT - MB);
  const line = analysis.curve.map((point, index) => `${index ? 'L' : 'M'} ${X(point.terminalSpot)} ${Y(point.terminalPnl)}`).join(' ');
  const leg = analysis.legs[0];
  const maxProfit = analysis.bounds.maxProfit.kind === 'unlimited' ? '∞' : fmt(analysis.bounds.maxProfit.amount, 2);
  const maxLoss = analysis.bounds.maxLoss.kind === 'unlimited' ? '−∞' : fmt(-analysis.bounds.maxLoss.amount, 2);

  return (
    <div className="ui-payoff-widget">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Exact terminal payoff over non-negative spot prices" style={{display:'block',fontFamily:"'JetBrains Mono',monospace"}}>
        {[yMin, 0, yMax].map((value) => <g key={value}><line x1={ML} y1={Y(value)} x2={W-MR} y2={Y(value)} stroke={value === 0 ? '#596273' : '#1A1F28'} /><text x={ML-7} y={Y(value)+3} textAnchor="end" fill="#7C8493" fontSize="10">{fmt(value, 0)}</text></g>)}
        {[xMin, (xMin+xMax)/2, xMax].map((value) => <text key={value} x={X(value)} y={H-9} textAnchor="middle" fill="#7C8493" fontSize="10">{fmt(value, 0)}</text>)}
        <line x1={X(leg.strike)} y1={MT} x2={X(leg.strike)} y2={H-MB} stroke="#3E8BFF" strokeDasharray="3 3" />
        {analysis.breakevens.map((value) => <g key={value}><line x1={X(value)} y1={MT} x2={X(value)} y2={H-MB} stroke="#FFB020" strokeDasharray="3 3" /><text x={X(value)+4} y={MT+10} fill="#FFB020" fontSize="9">BE {fmt(value, 2)}</text></g>)}
        <path d={line} fill="none" stroke="#FF2E45" strokeWidth="2.2" />
      </svg>
      <div className="payoff-widget-stats">
        <div><span>Produit</span><strong>{title.toLowerCase().includes('barrier') ? 'Payoff terminal vanilla uniquement' : `${leg.side.toUpperCase()} ${leg.type.toUpperCase()}`}</strong></div>
        <div><span>Domaine exact</span><strong>Sₜ ≥ 0</strong></div>
        <div><span>Profit max</span><strong>{maxProfit}</strong></div>
        <div><span>Perte max</span><strong>{maxLoss}</strong></div>
      </div>
      <div className="mono mute" style={{fontSize:10.5,marginTop:8}}>Prime manuelle · multiplicateur 1 · aucun cours de marché live · bornes indépendantes de la fenêtre tracée.</div>
    </div>
  );
}

function UIBlock({ spec }) {
  const { type, title, params = {} } = spec;
  const body = type === 'equation' ? <LatexMarkdown content={`$$\n${params.latex||params.expression||''}\n$$`}/>
    : type === 'scenario_table' ? <UIScenarioTable {...params}/>
    : type === 'greeks_scenario' ? (params.kind==='cds' ? <CDSScenario {...params}/> : <UIGreeksScenario {...params}/>)
    : type === 'corr_matrix' ? <UICorrMatrix {...params}/>
    : type === 'price_chart' ? <UIPriceChart {...params}/>
    : type === 'payoff' ? (params.kind==='barrier'||params.kind==='autocall' ? <UIPathDependentPayoff {...params}/> : <UIPayoffChart {...params} title={title}/>)
    : type === 'vol_smile' ? <UIVolSmile {...params}/>
    : type === 'monte_carlo' ? <UIMonteCarlo {...params}/>
    : <div className="course-lab-list">{Object.entries(params).map(([key,value])=><div className="course-lab-item" key={key}><span className="mono">{key}</span><p>{typeof value === 'string' ? value : JSON.stringify(value)}</p></div>)}{Object.keys(params).length===0 && <div className="mono mute" style={{fontSize:12}}>No authenticated widget inputs were published for this block.</div>}</div>;
  return (
    <div className="panel" data-ui-block-type={type||'unknown'} style={{padding:18, margin:'18px 0'}}>
      {title && <div className="row between" style={{marginBottom:12}}><div className="label">{title}</div><span className="badge" style={{background:'rgba(62,139,255,.08)',color:'var(--blue)'}}>interactive</span></div>}
      {body}
    </div>
  );
}
const TR_VOLHEAT = [[0.18,0.30,0.45,0.58,0.66],[0.28,0.46,0.66,0.82,0.74],[0.40,0.66,0.95,0.78,0.55],[0.30,0.50,0.70,0.60,0.42],[0.22,0.36,0.50,0.44,0.30]];

function LatexMarkdown({content}) {
  const md = stripNoiseCitations(stripFrontmatter(content || ''));
  const parts = [];
  const re = /```uiblock\s*([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = re.exec(md))) {
    if (m.index > last) parts.push({ t:'md', v: md.slice(last, m.index) });
    parts.push({ t:'block', v: m[1] });
    last = re.lastIndex;
  }
  if (last < md.length) parts.push({ t:'md', v: md.slice(last) });
  if (!parts.length) parts.push({ t:'md', v: md });
  return (
    <div className="course-script-markdown">
      <React.Suspense fallback={<div className="mono mute" data-markdown-loading="true">Rendu du contenu vérifié…</div>}>
        {parts.map((p,i)=> p.t==='block'
          ? <UIBlock key={i} spec={parseUiBlock(p.v)}/>
          : <CourseMarkdown key={i}>{p.v}</CourseMarkdown>
        )}
      </React.Suspense>
    </div>
  );
}

function stripFrontmatter(markdown = '') {
  return String(markdown).replace(/<!--[\s\S]*?-->/g, '').replace(/^---\s*[\s\S]*?\s*---\s*/, '');
}

// Both demanding personas flagged the same #1 trust-killer: inline
// "Les sources le confirment _[extrait]_ : « … » [Sx]" clauses that quote
// unrelated, low-relevance corpus chunks (book index pages, off-topic textbooks)
// as if they substantiated the lesson. The verified derivations + engine numbers
// carry the trust instead. We excise ONLY that specific noise pattern at render
// time (the markdown files — and the backend quality gate — are untouched).
function stripNoiseCitations(text = '') {
  return String(text)
    .replace(/\s*Les sources?\s+(?:le|la|les)\s+confir?ment[\s\S]*?\[S\d+\]\s*\.?/gi, '')
    .replace(/\s*_?\[extrait\]_?\s*:\s*«[\s\S]*?»\s*\[S\d+\]\s*\.?/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

// Generic, byte-identical "philosophy wall" paragraphs both personas flagged as
// "a text wall wearing a costume" — they recur in 21-96 of the 96 lessons with
// only the concept noun swapped. We drop them at render so each lesson keeps its
// bespoke lead + the concept/ticket-specific paragraphs (the rigorous proof and
// real-market widget below carry the substance). Concept-bearing frames
// ("En pratique, la lecon consiste a…", "Concretement, l'exercice consiste a…",
// "L'objectif de cette lecon…", "La notion de … sert…") are deliberately KEPT.
const _LESSON_BOILERPLATE = new RegExp('^(?:' + [
  '\\*\\*(?:Micro-cas a traiter|Checkpoint de maitrise)\\.\\*\\*',
  'Un etudiant tres forme doit voir',
  "Sur le desk, la question n'est jamais",
  'Decision attendue\\s*:\\s*produire le livrable',
  'Le niveau Hull consiste a ne pas accepter',
  'Le jeune professionnel doit aussi savoir parler',
  'La bonne analyse commence par la decomposition',
  'Le controle minimal tient en une phrase',
  'Le cours doit vous amener a un reflexe',
  'Avant de passer a la lecon suivante',
  'Un apprenant doit savoir quelle source croire',
  'Le desk refuse un chiffre qui ne peut pas etre',
  'Un entretien quant demande la derivation',
].join('|') + ')', 'i');

function PracticeCourseContent({c, scriptState, scriptModel, selectedModuleIndex = 0, onSelectModule, onOpenScript}) {
  const modules = scriptModel?.modules || [];
  const safeIndex = Math.min(Math.max(selectedModuleIndex, 0), Math.max(modules.length - 1, 0));
  const formulas = scriptModel?.formulas || [];
  if (scriptState?.status==='loading') return <div className="panel course-script-state"><Icon name="loader-circle" size={16}/><span role="status">Loading your lesson…</span></div>;
  if (scriptState?.status!=='ready') return <div className="panel course-script-state" role="alert"><Icon name="circle-alert" size={16}/><div><h2 style={{fontSize:18}}>Course version unavailable</h2><p>{scriptState?.error || 'No full course version is published here.'}</p><p>Choose a published language above, or retry this version.</p><button className="btn btn-outline btn-sm" onClick={()=>window.location.reload()}>Retry course version</button></div></div>;
  return <div className="col" style={{gap:18}}>
    <CourseModuleReader c={c} language={scriptState.language || 'en'} module={modules[safeIndex]} writtenLesson={scriptModel?.writtenLessons?.[safeIndex]} formula={formulas[safeIndex % Math.max(formulas.length,1)]} uiBlocks={selectModuleUiBlocks(scriptModel?.uiBlocks || [],safeIndex,modules[safeIndex],scriptModel?.writtenLessons?.[safeIndex])} moduleCount={modules.length} selectedModuleIndex={safeIndex} onOpenScript={onOpenScript}/>
    <div className="lesson-next-action">
      <div><div className="label">Put the lesson into practice</div><p>Use a worked case for this topic. For submitted answers and transfer checks, choose the English Interview Lab.</p></div>
      <div className="row" style={{gap:8,flexWrap:'wrap'}}><Link to={courseGeneratorLink(c)} className="btn btn-outline btn-sm">Topic practice <Icon name="arrow-right" size={13}/></Link><Link to="/interview" className="btn btn-primary btn-sm">Interview Lab</Link>{safeIndex<modules.length-1 && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>onSelectModule?.(safeIndex+1)}>Next lesson <Icon name="arrow-right" size={13}/></button>}</div>
    </div>
  </div>;
}

function selectModuleUiBlocks(uiBlocks = [], selectedModuleIndex = 0, module = {}, writtenLesson = {}) {
  const primary = `${module.title || ''} ${module.objective || ''}`;
  const context = `${primary} ${module.notion || ''} ${writtenLesson.title || ''} ${writtenLesson.body || ''}`;
  const concept = {
    payoff:/payoff|expiration|exercice|terminal/i,
    scenario_table:/sc[eé]nario|choc|stress|tableau/i,
    greeks_scenario:/greeks|delta|gamma|vega|theta|hedg|couverture/i,
    corr_matrix:/corr[eé]lation|covariance|co[- ]?mouvement/i,
    price_chart:/historique|s[eé]rie de prix|price history/i,
    vol_smile:/smile|surface de vol|volatilit[eé] implicite/i,
    monte_carlo:/monte.?carlo|simulation|convergence|erreur standard/i,
  };
  return uiBlocks.filter(block=>{
    const declared = block.lesson_number ?? block.params?.lesson_number;
    if (Number.isInteger(Number(declared)) && declared != null) return Number(declared)===selectedModuleIndex+1;
    // Flat course widgets are not a rotating lesson schedule. The lesson's own
    // formula is rendered separately; parity must not inherit a generic BSM proof.
    if (/parit/i.test(primary)) return /parit/i.test(block.title || '');
    return Boolean(concept[block.type]?.test(context));
  }).filter(block=>block.type!=='equation').slice(0,1);
}

function normalizeCourseMicrocopy(value = '', language='fr') {
  const text = String(value || '').trim();
  if (language==='en') return text;
  if (/^Risk snapshot\.?$/i.test(text)) return 'Note de risque: facteur dominant, unite, controle, action.';
  if (text === 'Desk note') return 'Note de desk: resultat, controle, limite, decision.';
  if (text === 'Desk deliverable') return 'Livrable de desk verifiable.';
  return text;
}

function courseWordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function CourseModuleReader({c, language='en', module, writtenLesson, formula, uiBlocks = [], moduleCount, selectedModuleIndex, onOpenScript}) {
  if (!module) {
    return (
      <div className="panel course-script-state">
        <Icon name="circle-alert" size={16} style={{color:'var(--red)'}}/>
        <span className="mono mute">No module content available yet.</span>
      </div>
    );
  }

  const fields = [
    ['Situation de desk', normalizeCourseMicrocopy(module.situation || "Partir d'une tache de marche concrete et isoler les donnees manquantes."), 'activity'],
    ['Objectif pratique', normalizeCourseMicrocopy(module.objective || 'Produire un calcul exploitable par trader, risk ou structuring.'), 'target'],
    ['Notion utile', normalizeCourseMicrocopy(module.notion || c.topics.join(', ')), 'sigma'],
    ['Activite', normalizeCourseMicrocopy(module.activity || "Calculer, verifier les signes et rediger l'action de desk."), 'calculator'],
    ['Livrable', normalizeCourseMicrocopy(module.deliverable || 'Note de quote/risque avec decision'), 'clipboard-check'],
  ];
  const lessonWords = courseWordCount(writtenLesson?.body || '');

  return (
    <div className="panel course-module-reader">
      <div className="course-module-reader-head">
        <div>
          <div className="section-eyebrow" style={{margin:0}}>// Module {selectedModuleIndex + 1} of {moduleCount}</div>
          <h2 className="mono">{module.title}</h2>
          <p className="text-2">{module.objective || module.situation || (language==='en'?'Read the authored lesson, reproduce its calculation and state the assumptions.':'Lire la leçon, reproduire le calcul et expliciter ses hypothèses.')}</p>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}>
          {lessonWords > 0 && <span className="badge">About {Math.max(3, Math.ceil(lessonWords / 160))} min to read</span>}
          <Link to={courseGeneratorLink(c)} className="btn btn-outline btn-sm">Practise this topic <Icon name="arrow-right" size={13}/></Link>
        </div>
      </div>
      {!writtenLesson?.body && <div className="course-desk-fields">{fields.map(([label,value,icon])=><DeskField key={label} label={label} value={value} icon={icon}/>)}</div>}
      {writtenLesson?.body && (
        <CourseWrittenLessonExperience
          c={c}
          language={language}
          module={module}
          writtenLesson={writtenLesson}
          formula={formula}
          uiBlocks={uiBlocks}
          lessonWords={lessonWords}
          onOpenScript={onOpenScript}
        />
      )}
      {formula && (
        <div className="course-module-formula">
          <div className="label" style={{marginBottom:10}}>Formula used on desk</div>
          <LatexMarkdown content={`### ${formula.title}\n$$\n${formula.expression}\n$$\n${formula.usage}`}/>
        </div>
      )}
    </div>
  );
}

function CourseWrittenLessonExperience({c, language='en', module, writtenLesson, formula, uiBlocks = [], lessonWords = 0, onOpenScript}) {
  const courseSlug = COURSE_SCRIPT_SLUGS[c.id] || c.id;
  const sections = buildLessonSections(writtenLesson.body, language);
  const equationDemo = buildEquationDemo(c, module, formula);
  const actionText = normalizeCourseMicrocopy(module.deliverable || module.activity || (language==='en'?'A written result, its units, an independent control, a limitation and a conditional desk action.':'Note de quote/risque avec decision'), language);
  const layout = getCourseLayout(courseSlug);
  const tone = layout?.tone || 'blue';
  const showMarket = showMarketOnLesson(courseSlug, writtenLesson.number);
  return (
    <div className={`course-written-lesson course-written-lesson-cockpit tone-${tone}`}>
      <div className="lesson-task-brief">
        <div className="label">The desk question</div>
        <p>{normalizeCourseMicrocopy(module.situation || module.objective || "Use the inputs to explain a price, its risks and the hedge.")}</p>
        <details><summary>What you will produce</summary><p>{actionText}</p></details>
      </div>

      {sections.length > 0 && (
        <div className="lesson-section-grid">
          {sections.map((section) => (
            <div key={section.title} className="lesson-concept-card">
              <div className="lesson-card-head">
                <Icon name={section.icon} size={14}/>
                <span>{section.title}</span>
              </div>
              <LatexMarkdown content={section.content}/>
            </div>
          ))}
        </div>
      )}

      {equationDemo && <EquationDemo demo={equationDemo}/>}

      {showMarket && <CourseMarketWidget slug={courseSlug}/>}

      {uiBlocks.length > 0 && (
        <div className="course-module-uiblocks lesson-widget-lab">
          <div className="row between" style={{marginBottom:12}}>
            <div>
              <div className="label">Try the calculation</div>
              <p className="mute">Change an input, inspect the result and explain what moved.</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenScript}>Full reference <Icon name="arrow-right" size={13}/></button>
          </div>
          <div className="course-module-uiblock-grid">
            {uiBlocks.map((block) => <UIBlock key={`${block.number}-${block.type}`} spec={block}/>)}
          </div>
        </div>
      )}

      <div className="lesson-action-card">
        <div>
          <div className="label">{language==='en'?'Decision checkpoint':'Decision attendue'}</div>
          <p>{language==='en'?'Conclude with a result, its units, a control, a limitation and an action: quote, hedge, monitor, reduce, reject or escalate.':'Conclure par un resultat, une unite, un controle, une limite et une action: quote, hedge, monitor, reduce, reject ou escalate.'}</p>
        </div>
        <Icon name="clipboard-check" size={18}/>
      </div>
    </div>
  );
}

function buildLessonSections(body = '', language='fr') {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((item) => stripNoiseCitations(item).trim())
    .filter(Boolean)
    .filter((p) => !_LESSON_BOILERPLATE.test(p));
  const buckets = [
    { title: language==='en'?'Market intuition':'Intuition marche', icon: 'activity', items: paragraphs.slice(0, 2) },
    { title: language==='en'?'Quantitative mechanism':'Mecanisme quantitatif', icon: 'sigma', items: paragraphs.slice(2, 4) },
    { title: language==='en'?'Practice and controls':'Mise en pratique et controle', icon: 'target', items: paragraphs.slice(4) },
  ];
  return buckets
    .filter((bucket) => bucket.items.length)
    .map((bucket) => ({...bucket, content: bucket.items.join('\n\n')}));
}

// Bespoke per-lesson sections (lessonProse.js) — three concept-specific cards
// that replace the templated body when authored, same shape as buildLessonSections.
function buildBespokeSections(prose) {
  return [
    { title: 'Intuition marche', icon: 'activity', content: prose.intuition },
    { title: 'Mecanisme quantitatif', icon: 'sigma', content: prose.mechanism },
    { title: 'Mise en pratique et controle', icon: 'target', content: prose.practice },
  ].filter((s) => s.content);
}

function buildEquationDemo(c, module, formula, resolveDerivation) {
  if (!formula?.expression) return null;
  const real = resolveDerivation?.(COURSE_SCRIPT_SLUGS[c.id] || c.id, formula);
  // A family checklist is not a mathematical derivation of this exact formula.
  // Only an explicitly authored, formula-specific proof may use that scaffold.
  if (!real || !Array.isArray(real.steps) || !real.steps.length) return null;
  return {title:formula.title, expression:real.expression, assumption:real.assumption,
    steps:real.steps, result:real.result, desk:real.desk, limit:real.limit, proof:true};
}

function EquationDemo({demo}) {
  const steps = Array.isArray(demo.steps) ? demo.steps : [];
  const isProof = steps.length > 0 && typeof steps[0] === 'object';
  return (
    <div className="course-equation-demo">
      <div className="row between" style={{gap:12,alignItems:'flex-start'}}>
        <div>
          <div className="label">Demonstration mathematique</div>
          <h4 className="mono">{demo.title}</h4>
        </div>
        <span className="badge badge-blue">{isProof ? 'Authored derivation' : 'Reasoning notes'}</span>
      </div>
      <div className="equation-demo-grid">
        <div className="equation-demo-formula">
          <div className="label">Equation a etablir</div>
          <LatexMarkdown content={`$$\n${demo.expression}\n$$`}/>
        </div>
        <div className="equation-demo-assumption">
          <div className="label">Hypotheses</div>
          <p>{demo.assumption}</p>
        </div>
      </div>
      <div className={`derivation-steps${isProof ? ' derivation-steps--proof' : ''}`}>
        {steps.map((step, idx) => isProof ? (
          <div key={idx} className="derivation-proof-step">
            <span className="step-no mono">{String(idx + 1).padStart(2, '0')}</span>
            <div className="step-main">
              {step.label && <div className="step-label">{step.label}</div>}
              {step.math && <LatexMarkdown content={`$$\n${step.math}\n$$`}/>}
              {step.note && <p className="step-note">{step.note}</p>}
            </div>
          </div>
        ) : (
          <div key={idx} className="course-derivation-step">
            <span className="mono">{String(idx + 1).padStart(2, '0')}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>
      {demo.result && (
        <div className="equation-demo-result">
          <div className="row between" style={{alignItems:'center',marginBottom:4}}>
            <div className="label" style={{margin:0}}>Resultat — formule etablie</div>
            <span className="mono" style={{color:'var(--green)',fontSize:12}}>QED</span>
          </div>
          <LatexMarkdown content={`$$\n${demo.result}\n$$`}/>
        </div>
      )}
      <div className="equation-demo-bottom">
        <div>
          <div className="label">Lecture desk</div>
          <p>{demo.desk}</p>
        </div>
        <div>
          <div className="label">Limite</div>
          <p>{demo.limit}</p>
        </div>
      </div>
    </div>
  );
}

function DeskField({label, value, icon}) {
  return (
    <div className="desk-field">
      <Icon name={icon} size={15} style={{color:'var(--red)',marginTop:2,flexShrink:0}}/>
      <div>
        <div className="label">{label}</div>
        <p>{value}</p>
      </div>
    </div>
  );
}

function GenericContent({c}) {
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <h2 className="mono" style={{fontSize:22,fontWeight:700,marginTop:0}}>{c.title}</h2>
        <p className="text-2" style={{fontSize:13.5, lineHeight:1.7}}>{c.tagline} Materials include theory, code, exercises and a calculator built into this page.</p>
        <div className="grid-2" style={{marginTop:18}}>
          {c.topics.map(t=>(
            <div key={t} className="panel-2" style={{padding:14}}>
              <div className="mono" style={{fontWeight:700,marginBottom:6}}>{t}</div>
              <div className="mute" style={{fontSize:12}}>Module covers theory, intuition, and applied examples in code.</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BSContent() {
  const [S,setS]=useState(100),[K,setK]=useState(100),[r,setR]=useState(2),[sigma,setSigma]=useState(20),[T,setT]=useState(180);
  const params = {S, K, r:r/100, sigma:sigma/100, T:T/365};
  const call = bsPrice({...params, type:'call'});
  const put  = bsPrice({...params, type:'put'});
  // Real Cox-Ross-Rubinstein binomial — converges to BS as steps grow. Computed
  // live from the same inputs (no fabricated numbers).
  const binom = useMemo(()=>{
    const rr=r/100, sg=sigma/100, TT=Math.max(T/365,1e-6);
    const crr=(N)=>{
      const dt=TT/N, u=Math.exp(sg*Math.sqrt(dt)), d=1/u, p=(Math.exp(rr*dt)-d)/(u-d), disc=Math.exp(-rr*dt);
      const v=[]; for(let i=0;i<=N;i++) v[i]=Math.max(S*Math.pow(u,N-i)*Math.pow(d,i)-K,0);
      for(let st=N;st>0;st--) for(let i=0;i<st;i++) v[i]=disc*(p*v[i]+(1-p)*v[i+1]);
      return v[0];
    };
    return [10,50,250].map(N=>({N, price: crr(N)}));
  },[S,K,r,sigma,T]);
  const sweep = useMemo(()=>{
    const arr = [];
    for (let s=S*0.4; s<=S*1.6; s += (S*1.2)/40) {
      arr.push({x: +s.toFixed(2), y: bsPrice({...params, S:s, type:'call'}).price});
    }
    return arr;
  },[S,K,r,sigma,T]);
  const intrinsic = useMemo(()=>{
    const arr = [];
    for (let s=S*0.4; s<=S*1.6; s += (S*1.2)/40) {
      arr.push({x:+s.toFixed(2), y: Math.max(s-K,0)});
    }
    return arr;
  },[S,K]);

  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Lesson 2.2 · Vega, Theta, Rho</div>
        <h2 className="mono" style={{fontSize:24, fontWeight:700, marginTop:10, marginBottom:14}}>The Black-Scholes Formula</h2>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.75}}>For a non-dividend European call, the Black-Scholes price is:</p>
        <div className="panel-2" style={{padding:20, margin:'14px 0', textAlign:'center'}}>
          <div className="mono" style={{fontSize:18,color:'var(--text)'}}>C(S, t) = S · N(d₁) − K · e<sup>−r(T−t)</sup> · N(d₂)</div>
          <div className="mono mute" style={{fontSize:12, marginTop:10}}>
            d₁ = [ln(S/K) + (r + σ²/2)(T−t)] / (σ √(T−t)) &nbsp;·&nbsp; d₂ = d₁ − σ √(T−t)
          </div>
        </div>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.75}}>
          Below: live calculator. Slide the parameters and watch the price react, the Greeks update, and the payoff diagram converge toward intrinsic value as T → 0.
        </p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:14}}>
        <div className="panel" style={{padding:18}}>
          <div className="label" style={{marginBottom:14}}>Parameters</div>
          {[
            ['Spot S', S, 20, 200, 1, setS, '$'],
            ['Strike K', K, 20, 200, 1, setK, '$'],
            ['Rate r', r, 0, 12, 0.05, setR, '%'],
            ['Vol σ', sigma, 1, 100, 0.5, setSigma, '%'],
            ['Maturity T', T, 1, 730, 1, setT, 'd'],
          ].map(([lbl,val,min,max,step,setter,unit])=>(
            <div key={lbl} className="field" style={{marginBottom:14}}>
              <div className="row between">
                <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>{lbl}</span>
                <span className="mono" style={{fontSize:12.5,fontWeight:600}}>{typeof val==='number'?val.toFixed(step<1?2:0):val} {unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(+e.target.value)}/>
            </div>
          ))}
        </div>

        <div className="col" style={{gap:14}}>
          <div className="grid-2" style={{gap:14}}>
            <div className="panel" style={{padding:18}}>
              <div className="label">Call Price</div>
              <div className="mono" style={{fontSize:28,fontWeight:700,color:'var(--red)',marginTop:4}}>{fmt(call.price)}</div>
              <div className="row" style={{gap:14, marginTop:12, flexWrap:'wrap'}}>
                {[['Δ',call.delta,4],['Γ',call.gamma,4],['ν',call.vega,3],['Θ',call.theta,4],['ρ',call.rho,3]].map(([l,v,d])=>(
                  <div key={l}>
                    <div className="mono mute" style={{fontSize:10}}>{l}</div>
                    <div className="mono tnum" style={{fontSize:13}}>{fmt(v,d)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel" style={{padding:18}}>
              <div className="label">Put Price</div>
              <div className="mono" style={{fontSize:28,fontWeight:700,color:'var(--text)',marginTop:4}}>{fmt(put.price)}</div>
              <div className="row" style={{gap:14, marginTop:12, flexWrap:'wrap'}}>
                {[['Δ',put.delta,4],['Γ',put.gamma,4],['ν',put.vega,3],['Θ',put.theta,4],['ρ',put.rho,3]].map(([l,v,d])=>(
                  <div key={l}>
                    <div className="mono mute" style={{fontSize:10}}>{l}</div>
                    <div className="mono tnum" style={{fontSize:13}}>{fmt(v,d)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ChartFrame title="Price vs Spot" subtitle="Black-Scholes (solid) vs Intrinsic (dashed)" right={<span className="mono mute" style={{fontSize:10.5}}>K={K} · σ={sigma}% · T={T}d</span>}>
            <LineChart width={620} height={250} series={[
              {name:'BS', color:'#FF2E45', data:sweep, fillOpacity:0.1},
              {name:'Intrinsic', color:'#7C8493', data:intrinsic, dashed:true, fill:false},
            ]}/>
          </ChartFrame>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel" style={{padding:0}}>
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Numerical comparison</div>
            <span className="badge">Binomial vs BS</span>
          </div>
          <table className="data">
            <thead><tr><th>Method</th><th>Steps</th><th className="num">Price</th><th className="num">Δ vs BS</th></tr></thead>
            <tbody>
              <tr><td className="symbol">Black-Scholes</td><td>closed form</td><td className="num">{fmt(call.price)}</td><td className="num">0.0000</td></tr>
              {binom.map((b)=>{ const d=b.price-call.price; return (
                <tr key={b.N}><td className="symbol">CRR Binomial</td><td>{b.N}</td><td className="num">{fmt(b.price)}</td>
                  <td className={"num "+(Math.abs(d)<5e-4?'':(d>=0?'green':'red'))}>{(d>=0?'+':'')+d.toFixed(4)}</td></tr>
              );})}
            </tbody>
          </table>
          <div className="mono mute" style={{fontSize:11,marginTop:8}}>Live CRR binomial → converges to Black-Scholes as steps grow.</div>
        </div>
        <div className="panel" style={{padding:20}}>
          <div className="label" style={{marginBottom:10}}>Python · Implementation</div>
          <pre className="code"><code>{`from math import log, sqrt, exp
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqrt(T))
    d2 = d1 - sigma*sqrt(T)
    return S*norm.cdf(d1) - K*exp(-r*T)*norm.cdf(d2)

# Sanity check vs put-call parity
def bs_put(S, K, r, sigma, T):
    return bs_call(S,K,r,sigma,T) - S + K*exp(-r*T)

print(bs_call(100, 100, 0.02, 0.20, 0.5))  # ≈ 6.0`}</code></pre>
        </div>
      </div>
    </div>
  );
}

function GreeksContent() {
  const [S,setS]=useState(100), sigma=0.20, r=0.02, T=0.5;
  // Build Greek curves vs spot
  const Ks = useMemo(()=> Array.from({length:60},(_,i)=>40+i*2),[]);
  const delta = Ks.map(k=>({x:k, y:bsPrice({S, K:k, r, sigma, T, type:'call'}).delta}));
  const gamma = Ks.map(k=>({x:k, y:bsPrice({S, K:k, r, sigma, T, type:'call'}).gamma*100}));
  const vega = Ks.map(k=>({x:k, y:bsPrice({S, K:k, r, sigma, T, type:'call'}).vega}));
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Lesson 1.1 · The Greeks</div>
        <h2 className="mono" style={{fontSize:22, fontWeight:700, marginTop:10}}>Sensitivities of the option price</h2>
        <div className="grid-3" style={{marginTop:14, gap:14}}>
          {[
            {l:'Delta Δ', f:'∂C/∂S', d:'Hedge ratio: shares per option'},
            {l:'Gamma Γ', f:'∂²C/∂S²', d:'Convexity: change in delta'},
            {l:'Vega ν', f:'∂C/∂σ', d:'Volatility sensitivity'},
            {l:'Theta Θ', f:'∂C/∂t', d:'Time decay'},
            {l:'Rho ρ', f:'∂C/∂r', d:'Rate sensitivity'},
            {l:'Vanna', f:'∂²C/∂S∂σ', d:'Cross Δ-σ'},
          ].map(g=>(
            <div key={g.l} className="panel-2" style={{padding:16}}>
              <div className="mono" style={{fontWeight:700, fontSize:14}}>{g.l}</div>
              <div className="mono" style={{color:'var(--red)',fontSize:13,marginTop:6}}>{g.f}</div>
              <div className="mute" style={{fontSize:12,marginTop:8}}>{g.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid-3">
        <ChartFrame title="Delta · vs Strike" subtitle={"S="+S+" σ=20% T=6m"}>
          <LineChart width={360} height={200} series={[{name:'Δ', color:'#FF2E45', data:delta, fillOpacity:0.1}]}/>
        </ChartFrame>
        <ChartFrame title="Gamma · vs Strike" subtitle="× 100">
          <LineChart width={360} height={200} series={[{name:'Γ', color:'#FFB020', data:gamma, fillOpacity:0.08}]}/>
        </ChartFrame>
        <ChartFrame title="Vega · vs Strike">
          <LineChart width={360} height={200} series={[{name:'ν', color:'#3E8BFF', data:vega, fillOpacity:0.08}]}/>
        </ChartFrame>
      </div>
      <div className="panel" style={{padding:24}}>
        <div className="row between">
          <div className="label">Lesson video</div>
          <span className="badge">Live tool</span>
        </div>
        <div style={{aspectRatio:'16/7', background:'#06080B', border:'1px solid var(--line)', marginTop:14, display:'grid', placeItems:'center', position:'relative'}}>
          <div style={{textAlign:'center'}}>
            <div style={{width:60,height:60,borderRadius:30,border:'1px solid var(--red)',display:'grid',placeItems:'center',margin:'0 auto'}}>
              <Icon name="sliders" size={22} style={{color:'var(--red)'}}/>
            </div>
            <div className="mono mute" style={{fontSize:11,marginTop:14,letterSpacing:'.08em'}}>GREEKS RISK PANEL</div>
            <Link to="/tools" className="btn btn-outline btn-sm" style={{marginTop:12}}>Open the deterministic pricing tools ›</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function YCContent() {
  // Zero curve & forward curve
  const zero = useMemo(()=>genCurve(80,(i,n)=>{
    const t = i/n*30; return 2.0 + 2.4*(1-Math.exp(-t/8)) - 0.4*Math.exp(-t/2);
  }),[]);
  const fwd = useMemo(()=>genCurve(80,(i,n)=>{
    const t = i/n*30; return 2.0 + 3.2*(1-Math.exp(-t/6)) - 0.1*Math.cos(t/3);
  }),[]);
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Lesson 1.3 · Bootstrapping</div>
        <h2 className="mono" style={{fontSize:22, fontWeight:700, marginTop:10}}>From par rates to zero coupons.</h2>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.7}}>Given quoted par yields y(τ), we recover the discount factor curve P(0,τ) by recursion:</p>
        <div className="panel-2 mono" style={{padding:18, fontSize:13.5, marginTop:10}}>P(0, τₙ) = (1 − y(τₙ) · Σ P(0, τᵢ)) / (1 + y(τₙ))</div>
      </div>
      <div className="grid-2">
        <ChartFrame title="Zero-coupon curve" subtitle="illustrative shape (synthetic)">
          <LineChart width={500} height={240} series={[{name:'Z', color:'#3E8BFF', data:zero, fillOpacity:0.08}]}/>
        </ChartFrame>
        <ChartFrame title="Instantaneous forwards" subtitle="dF / dτ">
          <LineChart width={500} height={240} series={[{name:'F', color:'#FF2E45', data:fwd, fillOpacity:0.08}]}/>
        </ChartFrame>
      </div>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Quoted instruments</div>
          <span className="badge">illustrative</span>
        </div>
        <table className="data">
          <thead><tr><th>Tenor</th><th>Type</th><th className="num">Quote</th><th className="num">DF</th><th className="num">Z-rate</th><th className="num">Fwd 3M</th></tr></thead>
          <tbody>
            {[
              ['1M','Deposit','5.32',0.9956,5.32,5.31],
              ['3M','Deposit','5.28',0.9869,5.28,5.18],
              ['6M','Future','4.91',0.9759,4.85,4.62],
              ['1Y','Swap','4.41',0.9568,4.42,4.10],
              ['2Y','Swap','4.05',0.9216,4.08,3.82],
              ['5Y','Swap','3.92',0.8211,3.94,3.81],
              ['10Y','Swap','4.16',0.6608,4.17,4.32],
              ['30Y','Swap','4.31',0.2871,4.18,4.05],
            ].map(r=><tr key={r[0]}><td className="symbol">{r[0]}</td><td>{r[1]}</td><td className="num">{r[2]}</td><td className="num">{r[3].toFixed(4)}</td><td className="num">{r[4].toFixed(2)}</td><td className="num">{r[5].toFixed(2)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IVContent() {
  // smile curves at different tenors
  const smile = (atm,skew, ten) => Array.from({length:40},(_,i)=>{
    const m = -0.4+i*0.025;
    return {x:+m.toFixed(3), y: atm + skew*m + 0.6*m*m + ten*0.02};
  });
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Lesson 2.1 · The Smile</div>
        <h2 className="mono" style={{fontSize:22, fontWeight:700, marginTop:10}}>Implied volatility is not flat.</h2>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.7}}>Equity-index options exhibit a persistent negative skew. Below: the smile across maturities for a typical equity index (illustrative shape).</p>
      </div>
      <div className="grid-2">
        <ChartFrame title="Volatility smile · SPX" subtitle="By tenor">
          <LineChart width={500} height={260} series={[
            {name:'30d', color:'#FF2E45', data:smile(0.18, -0.12, 0), fill:false},
            {name:'90d', color:'#FFB020', data:smile(0.17, -0.09, 1), fill:false},
            {name:'1y',  color:'#3E8BFF', data:smile(0.16, -0.06, 2), fill:false},
          ]}/>
        </ChartFrame>
        <ChartFrame title="Vol surface · K × T" subtitle="Heatmap">
          <HeatmapChart width={500} height={260} rows={12} cols={16}/>
        </ChartFrame>
      </div>
      <div className="panel" style={{padding:24}}>
        <div className="label" style={{marginBottom:12}}>SVI parameterisation</div>
        <pre className="code"><code>{`w(k) = a + b * (rho * (k - m) + sqrt((k - m)**2 + sigma**2))
# a: vertical level   b: angle of asymptotes
# rho: skew  m: shift  sigma: curvature near ATM`}</code></pre>
      </div>
    </div>
  );
}

function ExoticsContent() {
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Lesson 1.2 · Path-dependence</div>
        <h2 className="mono" style={{fontSize:22, fontWeight:700, marginTop:10}}>Beyond vanilla.</h2>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.7}}>
          Exotic payoffs depend on the entire path of the underlying, not just its terminal value. Below are the four canonical families covered in this module.
        </p>
      </div>
      <div className="grid-2">
        {[
          {n:'Barrier · Down-and-Out Call', d:'Payoff vanishes if S hits H from above.'},
          {n:'Asian · Arithmetic Average Call', d:'Strike is the path average.'},
          {n:'Lookback · Floating Strike Call', d:'Strike is the path minimum.'},
          {n:'Autocallable · Phoenix', d:'Periodic coupons + early redemption.'},
        ].map(p=>(
          <div key={p.n} className="panel" style={{padding:18}}>
            <div className="row between" style={{marginBottom:14}}>
              <div className="mono" style={{fontWeight:700}}>{p.n}</div>
              <span className="badge badge-red">Exotic</span>
            </div>
            <PayoffSketch type={p.n}/>
            <div className="mute" style={{fontSize:12.5,marginTop:10}}>{p.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function PayoffSketch({type}) {
  if (type.includes('Barrier')) return (
    <svg viewBox="0 0 280 100" width="100%" height="120">
      <line x1="0" y1="70" x2="280" y2="70" stroke="#2C3340"/>
      <line x1="40" y1="0" x2="40" y2="100" stroke="#FF2E45" strokeDasharray="3 3"/>
      <polyline points="0,70 140,70 260,15" fill="none" stroke="#FFB020" strokeWidth="1.6"/>
      <text x="46" y="14" fill="#FF2E45" fontSize="10" fontFamily="JetBrains Mono">H</text>
    </svg>
  );
  if (type.includes('Asian')) return (
    <svg viewBox="0 0 280 100" width="100%" height="120">
      <line x1="0" y1="70" x2="280" y2="70" stroke="#2C3340"/>
      <polyline points="0,70 120,70 260,30" fill="none" stroke="#FFB020" strokeWidth="1.6"/>
      <text x="6" y="14" fill="#7C8493" fontSize="10" fontFamily="JetBrains Mono">avg(S)</text>
    </svg>
  );
  if (type.includes('Lookback')) return (
    <svg viewBox="0 0 280 100" width="100%" height="120">
      <line x1="0" y1="80" x2="280" y2="80" stroke="#2C3340"/>
      <polyline points="0,80 0,80 280,20" fill="none" stroke="#FFB020" strokeWidth="1.6"/>
      <text x="6" y="14" fill="#7C8493" fontSize="10" fontFamily="JetBrains Mono">S − min(S)</text>
    </svg>
  );
  return (
    <svg viewBox="0 0 280 100" width="100%" height="120">
      <line x1="0" y1="80" x2="280" y2="80" stroke="#2C3340"/>
      {[40,90,140,190,240].map((x,i)=>(
        <g key={x}><line x1={x} y1="80" x2={x} y2={20+i*4} stroke="#FFB020" strokeWidth="1.4"/><circle cx={x} cy={20+i*4} r="2" fill="#FF2E45"/></g>
      ))}
    </svg>
  );
}

function MCContent() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  useEffect(()=>{
    const worker = new Worker(new URL('../workers/monteCarlo.worker.mjs', import.meta.url), { type:'module' });
    const requestId = 'course-monte-carlo-v1';
    worker.onmessage = (event) => {
      if (event.data?.requestId !== requestId) return;
      if (event.data.type === 'result') setResult(event.data.result);
      else setError(event.data?.error || 'Monte Carlo course calculation failed.');
    };
    worker.onerror = (event) => setError(event.message || 'Monte Carlo course worker failed.');
    worker.postMessage({
      type:'analyze', requestId,
      input:{
        schemaVersion:'tpl.monte-carlo.input.v1', mode:'pricing_risk_neutral',
        spot:100, volatility:0.20, maturityYears:1, dayCount:'ACT/365F',
        paths:20000, timeSteps:100, seed:20240617, method:'antithetic',
        samplePaths:20, histogramBins:20, currency:'EUR', quantity:1,
        contractMultiplier:1, position:'long', riskFreeRate:0.02,
        dividendYield:0, strike:100, optionType:'call', payoffType:'european',
      },
    });
    return () => worker.terminate();
  },[]);
  if (error) return <div className="panel mono red" role="alert" style={{padding:18}}>Canonical Monte Carlo unavailable: {error}</div>;
  if (!result) return <div className="panel mono mute" style={{padding:18}}>Running the seeded F-CAL-6 worker…</div>;
  const paths = result.samplePaths.map(path=>path.points.map(point=>({y:point.spot})));
  const histo = result.distribution.histogram.map(row=>({x:row.midpoint, y:row.count}));
  const pricing = result.pricing;
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Lesson 1.1 · GBM</div>
        <h2 className="mono" style={{fontSize:22, fontWeight:700, marginTop:10}}>Simulate. Average. Discount.</h2>
        <div className="panel-2 mono" style={{padding:18,fontSize:13.5,marginTop:10}}>S(t+Δt) = S(t) · exp((r − σ²/2)Δt + σ √Δt · Z),  Z ~ N(0,1)</div>
      </div>
      <div className="grid-2">
        <ChartFrame title="GBM paths" subtitle={`${result.run.samplePathCount} of ${result.run.simulatedPaths.toLocaleString()} · same seeded run`}>
          <svg viewBox="0 0 500 260" width="100%" height={260} style={{display:'block'}}>
            <line x1="40" y1="240" x2="490" y2="240" stroke="#2C3340"/>
            <line x1="40" y1="20" x2="40" y2="240" stroke="#2C3340"/>
            {paths.map((p,i)=>{
              const ys = p.map(d=>d.y);
              const ymin = 70, ymax=140;
              const path = p.map((d,j)=>`${j===0?'M':'L'} ${40+j/(p.length-1)*450} ${240-(d.y-ymin)/(ymax-ymin)*220}`).join(' ');
              return <path key={i} d={path} fill="none" stroke="#FF2E45" strokeWidth="0.7" opacity="0.45"/>;
            })}
          </svg>
        </ChartFrame>
        <ChartFrame title="Terminal distribution" subtitle="S(T) histogram">
          <BarChart data={histo} width={500} height={260} color="#3E8BFF"/>
        </ChartFrame>
      </div>
      <div className="grid-3">
        <Stat label="MC Mean Price" value={fmt(pricing.price,3)} sub={`${(result.run.simulatedPaths/1000)}k paths · Q`}/>
        <Stat label="Std Error" value={`±${fmt(pricing.standardError,3)}`} sub={`${pricing.effectiveSamples.toLocaleString()} pair means`}/>
        <Stat label="95% CI" value={`[${fmt(pricing.ci95.lower,3)}, ${fmt(pricing.ci95.upper,3)}]`}/>
        <Stat label="Black-Scholes ref" value={fmt(pricing.blackScholesBenchmark,3)} accent="var(--blue)"/>
        <Stat label="MC − BS" value={fmt(pricing.bias,3)} sub={pricing.benchmarkInsideCi95?'benchmark inside CI':'benchmark outside CI'}/>
        <Stat label="Evidence" value={`v${result.engineVersion}`} sub={`seed ${result.run.seed} · ${result.analysisId.slice(0,8)}`}/>
      </div>
    </div>
  );
}

function CourseCalculator({c}) {
  if (c.id==='black-scholes') return <BSContent/>;
  if (c.id==='credit-derivatives') return <div className="panel" style={{padding:24}}><div className="label">Validated CDS risk workspace</div><p className="text-2">Reprice the signed carry, CS01 shock and jump-to-default of the same teaching ticket. Values are deterministic and explicitly hypothetical.</p><CDSScenario notional={50000000} spread_bp={120} riskyAnnuity={4.2} recovery={40} shock_bp={25} side="buyer"/></div>;
  if (c.id==='exotics' || c.id==='structured-products') return <div className="panel" data-course-calculator-boundary="path-dependent" style={{padding:24}}><div className="label">Path-dependent model boundary</div><p className="text-2">The published vanilla payoff lab cannot value barriers or autocalls. Use the authenticated course scenarios for learning; no production-grade path-dependent pricer is claimed here.</p><Link to="/tools" className="btn btn-secondary btn-sm">Review validated tools <Icon name="arrow-right" size={13}/></Link></div>;
  const tool = {
    'yield-curves': ['/tools/curve', 'Open Yield Curve Builder'],
    greeks: ['/tools/payoff', 'Open Payoff & Greeks Lab'],
    'rates-swaps': ['/tools/curve', 'Open Yield Curve Builder'],
    'fixed-income-bonds': ['/tools/bond', 'Open Bond Pricing & Risk Lab'],
    'implied-vol': ['/tools/volsurface', 'Open Volatility Surface Lab'],
    'market-risk-var': ['/tools/mc', 'Open Monte Carlo Risk Lab'],
    'monte-carlo': ['/tools/mc', 'Open Monte Carlo Lab'],
    stochastic: ['/tools/mc', 'Open Monte Carlo Lab'],
  }[c.id] || ['/tools', 'Browse validated tools'];
  return <div className="panel" style={{padding:24}}><div className="label">Validated calculator workspace</div><p className="text-2">The calculator for this topic is delivered as a separately validated tool under the same plan.</p><Link to={tool[0]} className="btn btn-primary btn-sm">{tool[1]} <Icon name="arrow-right" size={13}/></Link></div>;
}

function courseGeneratorLink(c) {
  const presetId = ({'rates-swaps':'rates-swap','yield-curves':'rates-swap','credit-derivatives':'credit-cds','market-risk-var':'risk-var',exotics:'barrier-fx','structured-products':'barrier-fx'})[c.id] || 'options-book';
  const preset = GENERATOR_PRESETS.find(item=>item.id===presetId) || GENERATOR_PRESETS[0];
  const courseConcept = Array.isArray(c.topics) && c.topics.length ? c.topics.join(', ') : preset.concept;
  const request = c.id==='black-scholes' ? {
    topic:c.title, product:'European vanilla option', concept:'Black-Scholes price and Greeks', difficulty:'beginner', exercise_format:'quantitative_problem', language:'en',
    free_prompt:'European call: spot 100, strike 100, rate 5%, dividend yield 0%, volatility 20%, maturity 1 year. Price the option, interpret delta and state the model assumptions.',
  } : {...preset, topic:c.title, concept:courseConcept, difficulty:c.tier==='Complex'?'advanced':'intermediate', language:'en'};
  // Only newly seeded course tickets use these English defaults. Saved custom
  // requests are restored by the retry flow without rewriting their wording.
  return `/exercises?${new URLSearchParams({course:c.id, ...Object.fromEntries(Object.entries(request).filter(([key])=>['topic','product','concept','difficulty','exercise_format','free_prompt','language'].includes(key)))}).toString()}`;
}
function CourseExercises({c}) {
  const related = EXERCISES
    .filter((exercise)=>exercise.courseIds?.includes(c.id) || exercise.cat === c.title)
    .slice(0, 6);
  const items = related.length ? related : EXERCISES.slice(0, 6);
  return (
    <div className="col" style={{gap:12}}>
      {items.map(e=>(
        <Link to={"/exercises/"+e.id} key={e.id} className="panel" style={{padding:16, display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className="row" style={{gap:14}}>
            <span className="mono mute" style={{fontSize:11, width:30}}>#{e.id.slice(0,3).toUpperCase()}</span>
            <div>
              <div style={{fontWeight:600}}>{e.title}</div>
              <div className="mono mute" style={{fontSize:11,marginTop:4}}>{e.cat} · {e.level} · {e.time}</div>
              <div className="mute" style={{fontSize:12,marginTop:5}}>{exerciseDescription(e)}</div>
            </div>
          </div>
          <div className="row" style={{gap:10}}>
            <Icon name="arrow-right" size={14} style={{color:'var(--mute)'}}/>
          </div>
        </Link>
      ))}
      <div className="panel" style={{padding:18}}>
        <div className="row between" style={{gap:14}}>
          <div>
            <div className="label" style={{marginBottom:6}}>Generate from this course</div>
            <div className="mute" style={{fontSize:12.5,lineHeight:1.5}}>Start with this course topic and level already filled in. Review the scenario and inputs before generating a new worked case.</div>
          </div>
          <Link to={courseGeneratorLink(c)} className="btn btn-primary btn-sm" style={{flexShrink:0}}>Open generator <Icon name="arrow-right" size={13}/></Link>
        </div>
      </div>
    </div>
  );
}
function CourseResources({scriptModel}) {
  const blueprintResources = (scriptModel?.supports || []).map((item,idx)=>({
    t: item,
    d: idx === 0 ? 'Primary reference used for this lesson.' : 'Reference used for labs, exercises and desk cases.',
    ic: idx % 3 === 0 ? 'book-open' : idx % 3 === 1 ? 'file-text' : 'database',
  }));
  const resources = blueprintResources;
  const sources = scriptModel?.sources || [];
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" data-course-provenance="true" style={{padding:16}}>
        <div className="label">Reference policy</div>
        <p className="text-2" style={{margin:'6px 0 0',fontSize:12.5,lineHeight:1.55}}>
          References below are reviewed, readable excerpts from the source corpus.
          The lesson prose is a pedagogical rewrite; calculations, examples,
          exercises and quizzes are generated for practice and checked by the
          deterministic engine. No excerpt is presented as original authorship.
        </p>
      </div>
      <div className="grid-2">
        {resources.length===0 && <div className="panel course-resource-card"><div className="mono" style={{fontWeight:700}}>No downloadable resource is published for this course yet.</div><div className="mute" style={{fontSize:12.5,marginTop:10}}>Only verified, rights-cleared artefacts will appear here.</div></div>}
        {resources.map(r=>{
          const body = (
            <>
              <div className="row between">
                <div className="row" style={{gap:10}}>
                  <Icon name={r.ic} size={16} style={{color:'var(--red)'}}/>
                  <span style={{fontWeight:700}}>{r.t}</span>
                </div>
                <Icon name={r.href ? 'external-link' : 'database'} size={14} style={{color:'var(--mute)'}}/>
              </div>
              <div className="mute" style={{fontSize:12.5,marginTop:10,lineHeight:1.55}}>{r.d}</div>
            </>
          );
          return r.href ? (
            <a key={r.t} className="panel course-resource-card" href={r.href} target="_blank" rel="noreferrer">
              {body}
            </a>
          ) : (
            <div key={r.t} className="panel course-resource-card">
              {body}
            </div>
          );
        })}
      </div>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Course references</div>
          <span className="badge">{sources.length} sources</span>
        </div>
        <div className="course-source-table">
          {(sources.length ? sources : [{id:'empty', title:'No client-safe excerpt is available.', snippet:'No noisy or off-topic corpus extract is displayed.'}]).map((source)=>(
            <div key={`${source.id}-${source.title}`} className="course-source-row">
              <Icon name="book-open" size={14} style={{color:'var(--red)'}}/>
              <div>
                <strong>{source.title}</strong>
                <small><span className="badge" style={{marginRight:6}}>Source excerpt</span>{source.snippet ? `“${source.snippet}”` : 'Reference from ThePricingLibrary source corpus'}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {HomePage, CoursesPage, CourseDetailPage, CourseCard});


// ===== src\pages-tools.jsx =====
// Tools: Index, Black-Scholes Pricer, Payoff Visualizer, Monte Carlo, Calibration, IV Calc

function ToolsPage({route}) {
  const sub = route.parts[1];
  if (sub) return <ToolDetailPage id={sub}/>;
  return <ToolsIndex/>;
}

function ToolsIndex() {
  const cats = ['All Tools','Calculators','Visualizers','Simulators'];
  const [cat, setCat] = useState('All Tools');
  const ent = useEntitlement();
  const filtered = TOOLS.filter(t => cat==='All Tools' || t.cat===cat);
  return (
    <div className="container page catalogue-page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ tools</span></>}
        title="Quantitative Tools"
        sub="Deterministic calculators with editable inputs, formulas, controls and desk interpretation."
      />
      <div className="catalogue-start">
        <div><span className="micro">Start here · no account required</span><h2>Start with a price. Explore what changes it.</h2><p>Use the free Black-Scholes calculator to explore a price, its Greeks and simple scenarios.</p></div>
        <Link to="/tools/bs-pricer" className="btn btn-outline">Open Black-Scholes <Icon name="arrow-right" size={14}/></Link>
      </div>
      <div className="tabs-bar" role="group" aria-label="Filter tools by category">
        {cats.map(c=>(
          <button key={c} aria-pressed={cat===c} className={"tab-btn "+(cat===c?'on':'')} onClick={()=>setCat(c)}>
            {c} <span className="mute" style={{marginLeft:6}}>{c==='All Tools'?TOOLS.length:TOOLS.filter(t=>t.cat===c).length}</span>
          </button>
        ))}
      </div>
      <div className="grid-3 catalogue-grid">
        {filtered.map(t=>(
          <Link to={"/tools/"+t.id} key={t.id} className="course-card">
            <div className="thumb" style={{position:'relative'}}>
              <ToolThumb id={t.id}/>
              <div style={{position:'absolute',top:10,left:10}}><TierBadge tier={t.tier}/></div>
              {t.tier!=='free' && !ent.has(t.tier) && <div style={{position:'absolute',inset:0,background:'rgba(10,12,16,.3)',display:'grid',placeItems:'center'}}>
                <div className="tool-access-note">
                  <Icon name="lock" size={13} style={{color:'var(--red)'}}/>
                  <span className="mono" style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase'}}>{PLAN_LABEL[t.tier]||t.tier} required</span>
                </div>
              </div>}
            </div>
            <div className="body">
              <div className="meta">
                <span>{t.cat}</span>
                <span>·</span>
                <span>{t.tier==='free'||ent.has(t.tier)?'Available':'Locked'}</span>
              </div>
              <h3>{t.name}</h3>
              <div className="desc">{t.desc}</div>
              <div className="foot">
                <span className="mono mute" style={{fontSize:10.5}}>{t.status}</span>
                <span className="mono" style={{fontSize:11,color: t.tier!=='free'&&!ent.has(t.tier)?'var(--mute)':'var(--red)'}}>{t.tier!=='free'&&!ent.has(t.tier)?'upgrade':'launch ›'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ToolInputs({title='Inputs', fields, children}) {
  return (
    <div className="panel" style={{padding:18, alignSelf:'start'}}>
      <div className="label" style={{marginBottom:14}}>{title}</div>
      {fields.map(([lbl,val,min,max,step,setter,unit])=>(
        <div key={lbl} className="field" style={{marginBottom:16}}>
          <div className="row between">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>{lbl}</span>
            <div className="row" style={{gap:6}}>
              <input value={val} onChange={e=>{const v=parseFloat(e.target.value); if(!isNaN(v))setter(v);}} style={{width:74,padding:'4px 8px',background:'#0A0C10',border:'1px solid var(--line-2)',color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,borderRadius:3,outline:'none',textAlign:'right'}}/>
              <span className="mono mute" style={{fontSize:11,width:16}}>{unit}</span>
            </div>
          </div>
          {min!=null && <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(+e.target.value)}/>}
        </div>
      ))}
      {children}
    </div>
  );
}
function ResultRow({k,v,accent}) {
  return <div className="row between" style={{padding:'7px 0',borderTop:'1px solid var(--line)'}}>
    <span className="mono mute" style={{fontSize:11.5}}>{k}</span>
    <span className="mono" style={{fontSize:13,fontWeight:600,color:accent||'var(--text)'}}>{v}</span>
  </div>;
}
function ToolHead({slug,name,sub}) {
  return <PageHead crumb={<><Link to="/tools">tools</Link><i>›</i><span>{slug}</span></>} title={name} sub={sub} right={<span className="badge badge-green">Deterministic compute</span>}/>;
}

function ToolContractPanel({tool}) {
  return (
    <div className="panel" data-tool-contract={tool.id} style={{padding:16,marginBottom:14}}>
      <div className="row between" style={{gap:12,alignItems:'flex-start'}}>
        <div>
          <div className="label">Tool contract</div>
          <p className="text-2" style={{margin:'6px 0 0',fontSize:12.5,lineHeight:1.55}}>
            This workspace computes from the inputs shown below. It is not a live market quote and does not constitute investment advice.
          </p>
        </div>
        <span className="badge badge-green">{tool.status}</span>
      </div>
      <div className="grid-3" style={{marginTop:14,gap:10}}>
        <div><span className="badge">Engine</span><div className="mute" style={{fontSize:11,marginTop:6}}>{tool.engine}</div></div>
        <div><span className="badge">Inputs</span><div className="mute" style={{fontSize:11,marginTop:6}}>{tool.inputs}</div></div>
        <div><span className="badge">Conventions</span><div className="mute" style={{fontSize:11,marginTop:6}}>{tool.conventions}</div></div>
        <div><span className="badge">Assumptions</span><div className="mute" style={{fontSize:11,marginTop:6}}>{tool.assumptions}</div></div>
        <div><span className="badge">Limits</span><div className="mute" style={{fontSize:11,marginTop:6}}>{tool.limits}</div></div>
        <div><span className="badge">Diagnostics</span><div className="mute" style={{fontSize:11,marginTop:6}}>{tool.diagnostics}</div></div>
        <div><span className="badge">Provenance</span><div className="mute" style={{fontSize:11,marginTop:6}}>Source: user inputs or documented offline fixtures · status: deterministic run · as-of: input-defined, not a market observation · units: declared per field/result · no executable live price.</div></div>
        <div><span className="badge">Exports / history</span><div className="mute" style={{fontSize:11,marginTop:6}}>{tool.evidence}</div></div>
        <div><span className="badge">Learning path</span><div className="row" style={{gap:8,marginTop:6,fontSize:11}}><Link to={`/courses/${tool.courseId}`}>Course ↗</Link><Link to={`/exercises/${tool.exerciseId}`}>Exercise ↗</Link></div></div>
      </div>
    </div>
  );
}

// Real Python execution (Pyodide). First run downloads the runtime (~10MB) then caches.
function PyCodeCell({initial='', label='exercise.py', minHeight=260}) {
  const [code,setCode] = useState(initial);
  const [out,setOut] = useState('');
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState(false);
  useEffect(()=>{ setCode(initial); }, [initial]);
  const run = async () => {
    setBusy(true); setErr(false);
    setOut('Loading Python runtime (first run downloads Pyodide, ~10MB)…');
    const r = await runPython(code);
    setOut((r.stdout || '') + (r.error ? ('\n' + r.error) : '') || '(no output)');
    setErr(!r.ok); setBusy(false);
  };
  return (
    <div className="panel" style={{padding:0}}>
      <div className="row between" style={{padding:'10px 14px',borderBottom:'1px solid var(--line)'}}>
        <div className="row" style={{gap:12}}>
          <span className="badge">Python · Pyodide</span>
          <span className="mono mute" style={{fontSize:11}}>{label}</span>
        </div>
        <div className="row" style={{gap:6}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setCode(initial)}><Icon name="rotate-ccw" size={12}/> Reset</button>
          {busy && <button className="btn btn-outline btn-sm" onClick={()=>cancelPython()}>Stop runtime</button>}
          <button className="btn btn-primary btn-sm" onClick={run} disabled={busy}><Icon name="play" size={12}/> {busy?'Running…':'Run'}</button>
        </div>
      </div>
      <textarea aria-label={`${label} Python code`} value={code} onChange={(e)=>setCode(e.target.value)} spellCheck={false}
        style={{width:'100%',minHeight,background:'#0A0C10',color:'var(--text)',border:'none',borderBottom:'1px solid var(--line)',fontFamily:"'JetBrains Mono',monospace",fontSize:12.5,lineHeight:1.6,padding:14,resize:'vertical',outline:'none'}}/>
      <div style={{padding:'10px 14px'}}>
        <div className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em',marginBottom:6}}>OUTPUT</div>
        <pre className="code" style={{margin:0,maxHeight:240,overflow:'auto',color:err?'var(--red)':'var(--text-2)',whiteSpace:'pre-wrap'}}><code>{out || '— run the code to see output —'}</code></pre>
      </div>
    </div>
  );
}

function GatedTool({required, name, children}) {
  const ent = useEntitlement();
  if (ent.isLoading) return <div className="container page"><h1 className="page-title">Loading your tool</h1><p role="status">Checking your account access…</p></div>;
  if (ent.has(required)) return children;
  return <div className="container page"><ToolHead slug={name.toLowerCase()} name={name} sub="Premium tool."/><LockPanel required={required} what={`The ${name}`}/></div>;
}
function ToolDetailPage({id}) {
  const tool = TOOLS.find(t=>t.id===id);
  if (!tool) return <ToolNotFound/>;
  const renderers = {
    'bs-pricer': <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading canonical Black-Scholes engine…</span></div></div>}><BlackScholesLabTool key={window.location.search}/></React.Suspense>,
    payoff: <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic payoff engine…</span></div></div>}><PayoffStrategyLabTool key={window.location.search} initialPreset={new URLSearchParams(window.location.search).get('preset') || undefined}/></React.Suspense>,
    mc: <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic Monte Carlo engine…</span></div></div>}><MonteCarloLabTool/></React.Suspense>,
    'iv-calc': <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic realized-volatility engine…</span></div></div>}><RealizedVolatilityLabTool/></React.Suspense>,
    calib: <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic calibration engine…</span></div></div>}><ModelCalibrationTool/></React.Suspense>,
    binomial: <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic CRR engine…</span></div></div>}><BinomialLabTool/></React.Suspense>,
    bond: <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic bond engine…</span></div></div>}><BondLabTool/></React.Suspense>,
    curve: <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic curve engine…</span></div></div>}><YieldCurveBuilderTool/></React.Suspense>,
    volsurface: <React.Suspense fallback={<div className="container page"><div className="panel" style={{padding:28}}><span className="mono mute">Loading deterministic volatility-surface engine…</span></div></div>}><VolSurfaceLabTool/></React.Suspense>,
  };
  const content = renderers[id] || renderers['bs-pricer'];
  const contract = <div className="container page tool-contract-wrap" style={{paddingBottom:0}}>{id==='bs-pricer' ? <details className="tool-contract-disclosure"><summary>Conventions &amp; engine details</summary><ToolContractPanel tool={tool}/></details> : <ToolContractPanel tool={tool}/>}</div>;
  if (tool.tier !== 'free') {
    return <><>{contract}</><GatedTool required={tool.tier} name={tool.name}>{content}</GatedTool></>;
  }
  return <><>{contract}</>{content}</>;
}

function ToolNotFound() {
  return <div className="container page"><PageHead title="Tool not found"/></div>;
}

// ============= MONTE CARLO =============


// ===== src\pages-lab.jsx =====
// Trading Lab, Exercises, Survival Mode

// ============= TRADING LAB =============
function TradingLabPage({route}) {
  const sub = route.parts[1] || 'exercises';
  const tabs = [
    ['exercises','Trading Exercises'],
    ['backtest','Backtest · Pro'],
    ['scenarios','Scenarios'],
    ['strategies','Strategies'],
    ['performance','Simulation comparison'],
  ];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ trading lab</span></>}
        title="Trading Lab"
        sub="Student includes guided trading exercises and pedagogical scenarios. The real-engine Backtest workspace is reserved for Pro."
        right={<>
          <span className="badge badge-blue">STUDENT LAB</span>
        </>}
      />
      <div className="tabs-bar">
        {tabs.map(([k,l])=>(
          <Link key={k} to={"/lab/"+k} className={"tab-btn "+(sub===k?'on':'')}>{l}</Link>
        ))}
      </div>
      {sub==='backtest' && <GatedPage required="pro" what="The real-engine Backtest workspace" embedded><BacktestPanel/></GatedPage>}
      {sub==='scenarios' && <ScenariosPanel/>}
      {sub==='strategies' && <StrategiesPanel/>}
      {sub==='performance' && <PerformancePanel/>}
      {sub==='exercises' && <TradingExercisesPanel/>}
    </div>
  );
}

// Strategy choices for the OOS walk-forward. The plain in-sample backtest runs
// the engine's full ensemble/router; the picker isolates one strategy OOS.
const STRATEGY_CHOICES = [
  ['ensemble', 'Ensemble (routeur moteur)', 'Combine toutes les sous-stratégies — réglage par défaut du moteur.'],
  ['trend_following', 'Trend following', 'Suivi de tendance (croisement EMA + filtre ATR).'],
  ['volatility_breakout', 'Volatility breakout', 'Cassures sur expansion de volatilité.'],
  ['mean_reversion', 'Mean reversion', 'Retour à la moyenne intrabar.'],
  ['regime_router', 'Regime router', "Routeur de régime — vise la RÉDUCTION DE DRAWDOWN, pas un surcroît d'alpha."],
];
const STRATEGY_HORIZONS = [['6000', 'Court (~6k barres 15m)'], ['15000', 'Moyen (~15k barres)'], ['40000', 'Long (~40k barres)']];
const stratPct = (v) => (v == null || Number.isNaN(Number(v))) ? '—' : `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
const stratNum = (v, d = 2) => (v == null || Number.isNaN(Number(v))) ? '—' : Number(v).toFixed(d);

function BacktestPanel() {
  // REAL backtest: drives the live trading engine through the FastAPI bridge
  // (/strategy/instruments, /strategy/backtest, /strategy/walkforward). No
  // numbers are synthesised on the client; if the backend is down we show an
  // honest "backend requis" state.
  const [meta, setMeta] = useState(null);     // { instruments, available, strategies }
  const [metaErr, setMetaErr] = useState(false);
  const [metaRevision, setMetaRevision] = useState(0);
  const [instrument, setInstrument] = useState('EURUSD');
  const [strategy, setStrategy] = useState('ensemble');
  const [capital, setCapital] = useState(5000);
  const [maxBars, setMaxBars] = useState(15000);
  const [res, setRes] = useState(null);
  const [bh, setBh] = useState(null);         // real buy&hold return % or null
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [wf, setWf] = useState(null);
  const [wfLoading, setWfLoading] = useState(false);
  const [wfErr, setWfErr] = useState('');

  useEffect(() => {
    let alive = true;
    setMeta(null); setMetaErr(false);
    strategyApi.instruments().then((d) => {
      if (!alive) return;
      if (!d || !Array.isArray(d.instruments)) { setMetaErr(true); return; }
      setMeta(d);
    });
    return () => { alive = false; };
  }, [metaRevision]);

  useEffect(() => {
    const info = meta?.instruments?.find((i) => i.key === instrument);
    if (info && info.capital) setCapital(info.capital);
  }, [instrument, meta]);

  const runBacktest = async () => {
    setLoading(true); setErr(''); setWf(null); setWfErr(''); setBh(null);
    try {
      const data = await strategyApi.backtest({ instrument, maxBars, capital });
      setRes(data);
      const eq = data.equity || [];
      if (eq.length > 1) {
        const b = await strategyApi.buyHoldReturnPct(instrument, eq[0].t, eq[eq.length - 1].t);
        setBh(b);
      }
    } catch (e) { setErr(e.message || String(e)); setRes(null); }
    finally { setLoading(false); }
  };

  const runWalkforward = async () => {
    setWfLoading(true); setWfErr('');
    try {
      const data = await strategyApi.walkforward({ instrument, strategy, maxBars });
      setWf(data);
    } catch (e) { setWfErr(e.message || String(e)); setWf(null); }
    finally { setWfLoading(false); }
  };

  const instruments = meta?.instruments || [];
  const engineReady = Boolean(meta?.available && instruments.length);
  const m = res?.metrics || {};
  // Real equity curve + underwater drawdown derived from the engine equity.
  const eqSeries = useMemo(() => (res?.equity || []).map((p, i) => ({ x: i, y: p.v })), [res]);
  const ddSeries = useMemo(() => {
    const eq = res?.equity || []; let peak = -Infinity; const out = [];
    eq.forEach((p, i) => { if (p.v > peak) peak = p.v; out.push({ x: i, y: peak > 0 ? +(((p.v / peak) - 1) * 100).toFixed(2) : 0 }); });
    return out;
  }, [res]);
  const trades = res?.trades || [];
  const cand = wf?.candidates?.[0] || null;
  const dsr = cand?.test_deflated_sharpe;
  const eqDates = res?.equity?.length ? `${res.equity[0].t} → ${res.equity[res.equity.length - 1].t}` : '';

  // Honest verdict assembly (only from real returned numbers).
  const verdicts = [];
  if (res) {
    if (bh != null) {
      const beat = (m.return_pct ?? 0) > bh;
      verdicts.push({
        tone: beat ? 'ok' : 'bad',
        text: beat
          ? `Bat le buy&hold sur la fenêtre (${stratPct(m.return_pct)} vs ${stratPct(bh)}) — in-sample, hors frictions résiduelles.`
          : `Ne bat pas le buy&hold sur la fenêtre (${stratPct(m.return_pct)} vs ${stratPct(bh)}).`,
      });
    } else {
      verdicts.push({ tone: 'neutral', text: 'Benchmark buy&hold indisponible pour cette fenêtre (pas de comparaison affichée plutôt qu’un chiffre inventé).' });
    }
  }
  if (wf) {
    if (dsr != null) {
      const sig = Number(dsr) >= 0.5;
      verdicts.push({
        tone: sig ? 'ok' : 'bad',
        text: sig
          ? `Edge OOS plausible : Sharpe déflaté ${stratNum(dsr, 3)} ≥ 0.5 (test out-of-sample).`
          : `Edge non significatif (Sharpe déflaté ${stratNum(dsr, 3)} < 0.5, test OOS).`,
      });
    } else {
      verdicts.push({ tone: 'bad', text: `Pas de verdict OOS exploitable — moteur : ${wf.decision || '?'}${wf.reason ? ` (${wf.reason})` : ''}.` });
    }
  }
  const toneColor = (t) => t === 'ok' ? '#19C37D' : t === 'bad' ? '#FF2E45' : '#7C8493';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14 }}>
      {/* config */}
      <div className="col" style={{ gap: 14, alignSelf: 'start' }}>
        <div className="panel" style={{ padding: 18 }}>
          <div className="row between" style={{ marginBottom: 14 }}>
            <div className="label">Configuration</div>
            <span className={'badge ' + (metaErr ? 'badge-red' : (meta?.available ? 'badge-green' : ''))}>
              <span className={'dot ' + (metaErr ? 'dot-red' : 'dot-green')}></span>
              {metaErr ? 'SERVICE UNAVAILABLE' : meta ? engineReady ? 'ENGINE READY' : 'ENGINE UNAVAILABLE' : 'CHECKING SERVICE…'}
            </span>
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Instrument</span>
            <select aria-label="Backtest instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)} disabled={!instruments.length}>
              {instruments.length
                ? instruments.map((i) => <option key={i.key} value={i.key}>{i.label} · {i.asset_class}</option>)
                : <option value="EURUSD">EUR/USD</option>}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 6 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Stratégie (walk-forward OOS)</span>
            <select aria-label="Backtest strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              {STRATEGY_CHOICES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="mute" style={{ fontSize: 11, marginBottom: 12 }}>
            {STRATEGY_CHOICES.find((s) => s[0] === strategy)?.[2]}
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Capital</span>
            <input aria-label="Backtest starting capital (USD)" type="number" min="1" value={capital} onChange={(e) => setCapital(Number(e.target.value) || 0)} />
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Horizon</span>
            <select aria-label="Backtest history horizon" value={maxBars} onChange={(e) => setMaxBars(Number(e.target.value))}>
              {STRATEGY_HORIZONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>

          <button className="btn btn-primary btn-sm" disabled={loading || !engineReady} onClick={runBacktest} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            <Icon name="play" size={13} /> {loading ? 'Backtest en cours…' : 'Run backtest'}
          </button>
          <button className="btn btn-outline btn-sm" disabled={wfLoading || !engineReady} onClick={runWalkforward} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            <Icon name="activity" size={13} /> {wfLoading ? 'Walk-forward…' : 'Walk-forward (out-of-sample)'}
          </button>
          {strategy !== 'ensemble' && (
            <div className="mute" style={{ fontSize: 11, marginTop: 8 }}>
              Le backtest in-sample exécute le routeur/ensemble complet du moteur. La stratégie « {STRATEGY_CHOICES.find((s) => s[0] === strategy)?.[1]} » est isolée dans le walk-forward OOS.
            </div>
          )}
        </div>

        {/* metrics panel */}
        <div className="panel" style={{ padding: 14 }}>
          <div className="label" style={{ marginBottom: 10 }}>Métriques {res ? '(réelles)' : ''}</div>
          {res ? (
            <table className="data" style={{ border: 'none' }}>
              <tbody>
                <tr><td className="symbol">Return</td><td className={'num ' + ((m.return_pct ?? 0) >= 0 ? 'green' : 'red')}>{stratPct(m.return_pct)}</td></tr>
                <tr><td className="symbol">Sharpe</td><td className="num">{stratNum(m.sharpe)}</td></tr>
                <tr><td className="symbol">Sortino</td><td className="num">{stratNum(m.sortino)}</td></tr>
                <tr><td className="symbol">Max DD</td><td className="num red">{stratPct(m.max_drawdown_pct != null ? -Math.abs(m.max_drawdown_pct) : null)}</td></tr>
                <tr><td className="symbol">Profit factor</td><td className="num">{stratNum(m.profit_factor)}</td></tr>
                <tr><td className="symbol">Hit ratio</td><td className="num">{m.hit_ratio != null ? `${(m.hit_ratio * 100).toFixed(1)}%` : '—'}</td></tr>
                <tr><td className="symbol">Calmar</td><td className="num">{stratNum(m.calmar)}</td></tr>
                <tr><td className="symbol">PSR</td><td className="num">{stratNum(m.psr, 3)}</td></tr>
                <tr><td className="symbol"># Trades</td><td className="num">{stratNum(m.trades, 0)}</td></tr>
              </tbody>
            </table>
          ) : (
            <div className="mute" style={{ fontSize: 12 }}>
              {loading ? 'Computing the historical backtest…' : !engineReady ? 'No new run is available. Metrics appear only after a completed calculation.' : 'Run a backtest to see the computed metrics.'}
            </div>
          )}
        </div>
      </div>

      {/* charts + verdict + trades */}
      <div className="col" style={{ gap: 14 }}>
        {(metaErr || (meta && !engineReady)) && (
          <div className="panel" role="status" style={{padding:18}}>
            <h2 className="mono" style={{fontSize:17,margin:'0 0 10px'}}>Historical research is unavailable</h2>
            <p className="text-2" style={{fontSize:13,lineHeight:1.7}}>The service cannot provide a new backtest right now. Retry the connection, or continue with a pricing case that uses declared teaching inputs.</p>
            <div className="row" style={{gap:10,flexWrap:'wrap'}}><button type="button" className="btn btn-outline btn-sm" onClick={()=>setMetaRevision(value=>value+1)}>Retry service</button><Link to="/interview" className="btn btn-primary btn-sm">Continue interview practice</Link></div>
          </div>
        )}

        {err && <div className="panel" style={{ padding: 14, borderColor: '#FF2E45' }}><span className="mono" style={{ color: '#FF2E45', fontSize: 12 }}>Backtest échoué : {err}</span></div>}

        <ChartFrame
          title="Equity curve (réelle)"
          subtitle={res ? `${instrument} · moteur ensemble · ${eqDates} · capital ${capital.toLocaleString()}` : 'Lance un backtest pour générer la courbe d’equity à partir du moteur.'}
          right={res ? <span className={'badge ' + ((m.net_pnl ?? 0) >= 0 ? 'badge-green' : 'badge-red')}>{(m.net_pnl ?? 0) >= 0 ? '+' : ''}{Number(m.net_pnl ?? 0).toLocaleString()} {instrument.endsWith('USD') ? 'USD' : ''}</span> : null}
        >
          {eqSeries.length > 1
            ? <LineChart width={820} height={260} series={[{ name: 'eq', color: '#FF2E45', data: eqSeries, fillOpacity: 0.1 }]} xAxis={false} />
            : <div className="mute" style={{ padding: 40, textAlign: 'center', fontSize: 12 }}>{loading ? 'Calcul…' : 'Aucune courbe — exécute un backtest.'}</div>}
        </ChartFrame>

        {eqSeries.length > 1 && (
          <ChartFrame title="Drawdown" subtitle="Underwater curve · % (calculé sur l’equity réelle)">
            <LineChart width={820} height={150} series={[{ name: 'dd', color: '#FFB020', data: ddSeries, fillOpacity: 0.15 }]} xAxis={false} />
          </ChartFrame>
        )}

        {/* walk-forward OOS */}
        {(wf || wfErr || wfLoading) && (
          <div className="panel" style={{ padding: 16 }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <div className="label">Walk-forward — fenêtre TEST (out-of-sample)</div>
              {wf && <span className={'badge ' + (wf.decision === 'deploy' || wf.decision === 'accept' ? 'badge-green' : 'badge-red')}>{wf.decision || '?'}{wf.reason ? ` · ${wf.reason}` : ''}</span>}
            </div>
            {wfLoading && <div className="mute" style={{ fontSize: 12 }}>Walk-forward sur données réelles (train / validation / test)…</div>}
            {wfErr && <span className="mono" style={{ color: '#FF2E45', fontSize: 12 }}>Walk-forward échoué : {wfErr}</span>}
            {wf && cand && (
              <div className="grid-3" style={{ gap: 8 }}>
                {[
                  ['Test return', stratPct(cand.test_return_pct)],
                  ['Sharpe déflaté', stratNum(cand.test_deflated_sharpe, 3)],
                  ['Test max DD', stratPct(cand.test_max_drawdown_pct != null ? -Math.abs(cand.test_max_drawdown_pct) : null)],
                  ['Test profit factor', stratNum(cand.test_profit_factor)],
                  ['Test expectancy', stratNum(cand.test_expectancy)],
                  ['Test trades', stratNum(cand.test_trades, 0)],
                ].map(([k, v]) => (
                  <div key={k} className="panel-2" style={{ padding: '8px 10px' }}>
                    <div className="mono mute" style={{ fontSize: 10 }}>{k}</div>
                    <div className="mono tnum" style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {wf && <div className="mute" style={{ fontSize: 11, marginTop: 8 }}>Stratégie testée : {wf.strategy} · params sélectionnés sur le train uniquement.</div>}
          </div>
        )}

        {/* honest verdict strip */}
        {verdicts.length > 0 && (
          <div className="panel" style={{ padding: 16 }}>
            <div className="label" style={{ marginBottom: 10 }}>Verdict honnête</div>
            <div className="col" style={{ gap: 8 }}>
              {verdicts.map((v, i) => (
                <div key={i} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                  <span className="dot" style={{ background: toneColor(v.tone), marginTop: 6 }}></span>
                  <span style={{ fontSize: 13, color: toneColor(v.tone) }}>{v.text}</span>
                </div>
              ))}
            </div>
            <div className="mute" style={{ fontSize: 11, marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
              Backtest éducatif, net de coûts — la performance passée ne garantit rien ; la plupart des stratégies ne battent pas un indice passif. Le walk-forward (test OOS) et le Sharpe déflaté sont les seuls juges crédibles d’un edge.
            </div>
          </div>
        )}

        {/* real trade log */}
        {trades.length > 0 && (
          <div className="panel">
            <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}>
              <div className="label">Trade log (réel · {trades.length})</div>
              <button className="btn btn-ghost btn-sm" onClick={() => copyText(trades.map((t) => `${t.opened_at},${t.symbol},${t.strategy},${t.direction},${t.pnl}`).join('\n'), 'Trade log copié en CSV.')}>Export CSV</button>
            </div>
            <table className="data">
              <thead><tr><th>Ouverture</th><th>Stratégie</th><th>Sens</th><th className="num">P&L</th><th className="num">P&L %</th><th>Sortie</th><th>Résultat</th></tr></thead>
              <tbody>
                {trades.slice(0, 60).map((t, i) => (
                  <tr key={i}>
                    <td className="symbol">{String(t.opened_at).slice(0, 16)}</td>
                    <td>{t.strategy}</td>
                    <td>{t.direction === 1 ? 'Long' : t.direction === -1 ? 'Short' : t.direction}</td>
                    <td className={'num ' + ((t.pnl ?? 0) >= 0 ? 'green' : 'red')}>{(t.pnl ?? 0) >= 0 ? '+' : ''}{Number(t.pnl ?? 0).toFixed(2)}</td>
                    <td className={'num ' + ((t.pnl_pct ?? 0) >= 0 ? 'green' : 'red')}>{stratPct(t.pnl_pct)}</td>
                    <td className="mute" style={{ fontSize: 11 }}>{t.exit_reason}</td>
                    <td><span className={'badge ' + ((t.pnl ?? 0) >= 0 ? 'badge-green' : 'badge-red')}>{(t.pnl ?? 0) >= 0 ? 'WIN' : 'LOSS'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Deterministic Monte Carlo of a short-strangle over a 30d horizon. Premium is
// priced with Black-Scholes at entry IV; P&L = premium - terminal option payoffs.
// Physical terminal distribution; nominal entry premium, no financing, costs or hedge.
const scenarioMC = shortStrangleScenario;
function ScenariosPanel() {
  const presets=[
    {n:'Bullish drift', d:'Slow grind higher · σ=12%', mu:0.15, sigma:0.12, seed:11},
    {n:'Bearish drift', d:'Trend reversal · σ=15%', mu:-0.15, sigma:0.15, seed:22},
    {n:'Vol spike', d:'Assumed annual volatility 45%', mu:0, sigma:0.45, seed:33},
    {n:'Vol crush', d:'Assumed annual volatility 8%', mu:0, sigma:0.08, seed:44},
    {n:'Low-volatility horizon', d:'Zero drift · σ=12%', mu:0, sigma:0.12, seed:55},
    {n:'Negative physical drift', d:'Drift -5% · σ=20%', mu:-0.05, sigma:0.20, seed:66},
  ];
  const rows=useMemo(()=>presets.map(p=>({...p, ...scenarioMC(p)})),[]);
  return (
    <div className="col" style={{gap:14}}>
      <div className="grid-3">
        {rows.map(p=>(
          <div key={p.n} className="panel" style={{padding:18}}>
            <div className="row between">
              <div className="mono" style={{fontWeight:700, fontSize:14}}>{p.n}</div>
              <span className={"badge "+(p.pnl>=0?'badge-green':'badge-red')}>{p.pnl>=0?'+':''}{p.pnl.toLocaleString()}</span>
            </div>
            <div className="mute" style={{fontSize:12,marginTop:6}}>{p.d}</div><div className="mono mute" style={{fontSize:10,marginTop:8}}>μ {(p.mu*100).toFixed(0)}% · σ {(p.sigma*100).toFixed(0)}% · seed {p.seed} · N {p.sampleCount}</div>
            <div className="grid-2" style={{gap:8,marginTop:14}}>
              {[['Mean / SD',(p.meanOverSd==null?'—':p.meanOverSd.toFixed(2))],['Worst','$'+p.worst.toLocaleString()],['Win',p.win.toFixed(1)+'%'],['E[P&L]',p.pnl.toLocaleString()]].map(([k,v])=>(
                <div key={k} className="panel-2" style={{padding:'8px 10px'}}>
                  <div className="mono mute" style={{fontSize:10}}>{k}</div>
                  <div className="mono tnum" style={{fontSize:13,fontWeight:600,marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Scenario comparison · Short Strangle (Kc 105 / Kp 95)</div>
          <span className="badge">6 synthetic scenarios · 2000 deterministic paths each</span>
        </div>
        <div className="mute" style={{fontSize:11,padding:'10px 16px 14px',borderBottom:'1px solid var(--line)'}}>Synthetic teaching scenarios under P · 30/252-year horizon · spot 100, short put 95 / short call 105, multiplier 400. Entry premiums use BSM with r=2%, q=0 and IV=18%. Mean/SD is a non-annualised sample ratio, not a historical Sharpe. No transaction costs, hedging or observed market data. Cash amounts in USD; no premium financing.</div>
        <table className="data">
          <thead><tr><th>Scenario</th><th className="num">E[P&L]</th><th className="num">Annual drift</th><th className="num">Vol of P&L</th><th className="num">Mean / SD</th><th className="num">Worst sample</th></tr></thead>
          <tbody>
            {rows.map(p=>(
              <tr key={p.n}>
                <td className="symbol">{p.n}</td>
                <td className={"num "+(p.pnl>=0?'green':'red')}>{p.pnl>=0?'+':''}{p.pnl.toLocaleString()}</td>
                <td className="num">{(p.mu*100).toFixed(0)}%</td>
                <td className="num">{p.volPnl.toLocaleString()}</td>
                <td className="num">{(p.meanOverSd==null?'—':p.meanOverSd.toFixed(2))}</td>
                <td className="num red">{p.worst.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StrategiesPanel() {
  const templates = [
    {n:'Bull Call Spread', vol:'Moderate', view:'Bullish', max:'Capped', cost:'Debit'},
    {n:'Iron Condor', vol:'Low', view:'Neutral', max:'Capped', cost:'Credit'},
    {n:'Butterfly', vol:'Low', view:'Neutral', max:'Capped', cost:'Debit'},
    {n:'Long Call', vol:'High', view:'Strong Bull', max:'Unlimited', cost:'Debit'},
    {n:'Bear Put Spread', vol:'Moderate', view:'Bearish', max:'Capped', cost:'Debit'},
    {n:'Long Straddle', vol:'High', view:'Big move', max:'Unlimited', cost:'Debit'},
    {n:'Short Strangle', vol:'High', view:'Neutral', max:'Unlimited risk', cost:'Credit'},
  ];
  return (
    <div className="grid-3">
      {templates.map(t=>(
        <div key={t.n} className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:12}}>
            <div className="mono" style={{fontWeight:700,fontSize:14}}>{t.n}</div>
            <span className={"badge "+(t.cost==='Credit'?'badge-green':'badge')}>{t.cost}</span>
          </div>
          <StrategySketch name={t.n}/>
          <div className="grid-2" style={{marginTop:14, gap:8}}>
            <div className="panel-2" style={{padding:'8px 10px'}}>
              <div className="mono mute" style={{fontSize:10}}>View</div>
              <div className="mono" style={{fontSize:12,fontWeight:600,marginTop:2}}>{t.view}</div>
            </div>
            <div className="panel-2" style={{padding:'8px 10px'}}>
              <div className="mono mute" style={{fontSize:10}}>Entry</div>
              <div className="mono" style={{fontSize:12,fontWeight:600,marginTop:2}}>{t.cost}</div>
            </div>
          </div>
          <Link to={`/tools/payoff?preset=${encodeURIComponent(t.n)}`} className="btn btn-outline btn-sm" style={{width:'100%',justifyContent:'center',marginTop:14}}>Open payoff builder <Icon name="arrow-right" size={13}/></Link>
        </div>
      ))}
    </div>
  );
}
function StrategySketch({name}) { return <StrategyPayoffFigure name={name}/>; }

function PerformancePanel() {
  const rows = useMemo(()=>[
    {n:'Low volatility',mu:0.05,sigma:0.14,seed:101},
    {n:'Moderate volatility',mu:0.02,sigma:0.20,seed:202},
    {n:'High volatility',mu:0,sigma:0.42,seed:303},
    {n:'Positive drift',mu:0.08,sigma:0.10,seed:404},
    {n:'Lower drift',mu:0.03,sigma:0.12,seed:505},
  ].map(parameters=>({...parameters,...scenarioMC(parameters)})),[]);
  return <SimulationComparison rows={rows}/>;
}

function TradingExercisesPanel() {
  // Keep the Trading Lab entry point on the same canonical exercise records
  // as /exercises. The former cards only fired a toast and claimed simulated
  // grading without opening a real exercise or correction.
  const exerciseIds = ['delta-hedge', 'options-book-greeks', 'swap-dv01', 'smile-fit', 'mc-asian', 'curve-boot'];
  const exs = exerciseIds
    .map((id) => EXERCISES.find((exercise) => exercise.id === id))
    .filter(Boolean);
  return (
    <div className="grid-3">
      {exs.map(e=>(
        <Link key={e.id} to={`/exercises/${e.id}`} className="panel" style={{padding:18,display:'block',textDecoration:'none'}}>
          <div className="row between" style={{marginBottom:12}}>
            <span className="badge">{e.level}</span>
            <span className="mono mute" style={{fontSize:11}}>{e.time}</span>
          </div>
          <div className="mono" style={{fontWeight:700, marginBottom:8}}>{e.title}</div>
          <div className="mute" style={{fontSize:12.5,lineHeight:1.5}}>{e.description}</div>
          <div className="mute" style={{fontSize:11.5,lineHeight:1.5,marginTop:8}}>Inputs, étapes, correction et grille de points disponibles dans l’exercice canonique.</div>
          <span className="btn btn-outline btn-sm" style={{marginTop:14,width:'100%',justifyContent:'center'}}>Ouvrir l’exercice <Icon name="arrow-right" size={13}/></span>
        </Link>
      ))}
    </div>
  );
}

// ============= EXERCISES =============
function ExercisesPage({route}) {
  const sub = route.parts[1];
  if (sub) return <ExerciseDetail id={sub}/>;
  return <ExercisesIndex route={route}/>;
}

function ExercisesIndex({route}) {
  const auth = useAuth();
  const owner = auth.user?.id || null;
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  const [cat,setCat] = useState('All');
  const [query,setQuery] = useState('');
  const [generated,setGenerated] = useState(()=>loadGeneratedExercises(owner));
  const [libraryError,setLibraryError] = useState(false);
  const [libraryRevision,setLibraryRevision] = useState(0);
  const [libraryOffset,setLibraryOffset] = useState(0);
  const [hasMore,setHasMore] = useState(false);
  const [loadingMore,setLoadingMore] = useState(false);
  const retryId = new URLSearchParams(window.location.search).get('retry');
  const params = new URLSearchParams(route.query);
  const contextCourse = COURSES.find(course=>course.id===params.get('course'));
  const courseRequest = contextCourse ? Object.fromEntries(['topic','product','concept','difficulty','exercise_format','free_prompt','language'].map(key=>[key, (params.get(key) || '').slice(0,key==='free_prompt'?4000:300)]).filter(([,value])=>value)) : null;
  const retryRequest = retryId ? getExerciseById(retryId, owner)?.request : courseRequest;
  useEffect(()=>{
    let active = true;
    setGenerated(loadGeneratedExercises(owner));
    setLibraryError(false);
    setLibraryOffset(0); setHasMore(false);
    if (owner) platformApi.listExercises(owner).then(({records,hasMore})=>{
      if (!active) return;
      const saved = records.map(exerciseFromRecord);
      const localOnly = loadGeneratedExercises(owner).filter(item=>item.engine==='fallback');
      const items = [...saved, ...localOnly];
      cacheGeneratedExercises(items, owner);
      setGenerated(items);
      setLibraryOffset(records.length); setHasMore(hasMore);
    }).catch(()=>{ if (active) setLibraryError(true); });
    return ()=>{ active=false; };
  },[owner,libraryRevision]);
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const {records,hasMore} = await platformApi.listExercises(owner,libraryOffset);
      if (ownerRef.current !== owner) return;
      setGenerated(current=>{
        if (ownerRef.current !== owner) return current;
        const items=[...current.filter(item=>item.engine!=='fallback'),...records.map(exerciseFromRecord),...current.filter(item=>item.engine==='fallback')];
        cacheGeneratedExercises(items,owner); return items;
      });
      setLibraryOffset(value=>value+records.length); setHasMore(hasMore); setLibraryError(false);
    } catch { setLibraryError(true); }
    finally { setLoadingMore(false); }
  };
  const cats = ['All','Generated','Black-Scholes','Greeks','Volatility','Monte Carlo','Barrier','Yield Curves','Rates','Credit','Risk','Exotic'];
  const normalizedQuery = query.trim().toLowerCase();
  const allExercises = useMemo(()=>[...generated, ...EXERCISES], [generated]);
  const filtered = allExercises.filter(e => {
    const inCat = cat==='All' || (cat==='Generated' ? e.generated : e.cat===cat);
    const haystack = `${e.title} ${e.cat} ${e.level} ${e.product || ''} ${e.concept || ''}`.toLowerCase();
    return inCat && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const onGenerated = (exercise) => {
    if (ownerRef.current !== owner) return;
    const next = saveGeneratedExercise(exercise, owner);
    setGenerated(next);
    notify(exercise.metadata?.persistence === 'account' ? 'Exercise created and saved to your account library.' : 'Offline reference example opened on this device.');
    nav(`/exercises/${exercise.id}`);
  };
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ exercises</span></>}
        title="Exercises"
        sub="Desk-first practice. Generate, solve and review exercises grounded in the local finance knowledge base."
        right={<>
          <input aria-label="Search exercises" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search exercises…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
          <Link to="/practice" className="btn btn-outline btn-sm">Practice Hub <Icon name="arrow-right" size={13}/></Link>
        </>}
      />
      {contextCourse && <div className="course-language-note"><span>Practice context: {contextCourse.title} · {retryRequest?.difficulty || 'intermediate'}</span><Link to={`/courses/${contextCourse.id}`}>Back to course</Link></div>}
      <ExerciseGeneratorPanel key={retryId || route.query || 'new'} initialRequest={retryRequest} onGenerated={onGenerated}/>
      {libraryError && <ServiceUnavailable title="Your account library is temporarily unavailable. Cached cases remain accessible." onRetry={()=>setLibraryRevision(value=>value+1)}/>}
      <ExerciseLibraryStats exercises={allExercises} generatedCount={generated.length}/>
      {hasMore && <button className="btn btn-outline" disabled={loadingMore} onClick={loadMore}>{loadingMore?'Loading…':'Load more saved exercises'}</button>}
      <div className="tabs-bar">
        {cats.map(c=>(
          <button key={c} className={"tab-btn "+(cat===c?'on':'')} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>
      {filtered.length ? (
        <div className="grid-3">
          {filtered.map(e=><ExerciseCard key={e.id} e={e}/>)}
        </div>
      ) : (
        <div className="panel" style={{padding:28,textAlign:'center'}}><span className="mono mute">No exercise found.</span></div>
      )}
    </div>
  );
}

function ExerciseLibraryStats({exercises, generatedCount}) {
  const uniqueCats = new Set(exercises.map((exercise)=>exercise.cat)).size;
  const ragCount = exercises.filter((exercise)=>exercise.generated && exercise.engine === 'rag').length;
  return (
    <div className="exercise-stats-row">
      {[
        ['Cases', exercises.length],
        ['Tracks', uniqueCats],
        ['Generated', generatedCount],
        ['RAG sourced', ragCount],
      ].map(([label,value])=>(
        <div key={label} className="panel exercise-stat">
          <div className="label">{label}</div>
          <div className="mono">{value}</div>
        </div>
      ))}
    </div>
  );
}

function ExerciseGeneratorPanel({onGenerated,initialRequest}) {
  const [form,setForm] = useState(()=>({...GENERATOR_PRESETS[0],language:'en',number_of_questions:5,...initialRequest}));
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState(null);
  const [status,setStatus] = useState({checked:false, ok:false, detail:'Checking engine'});

  useEffect(()=>{
    let alive = true;
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),8000);
    fetch(`${getPracticeApiBase()}/health`,{signal:controller.signal})
      .then((response)=>response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((data)=>{
        if (!alive) return;
        const canGenerate = !String(data.llm || '').startsWith('openai:') || data.openai_configured;
        setStatus({
          checked:true,
          ok:canGenerate,
          detail:canGenerate ? (String(data.llm).startsWith('template') ? 'Structured writing · no external AI API' : 'AI writing configured') : 'Writing service unavailable',
          sources:Boolean(data.rag_available),
        });
      })
      .catch(()=>{ if (alive) setStatus({checked:true, ok:false, detail:'Practice service unavailable. A fixed offline reference remains available.'}); })
      .finally(()=>clearTimeout(timeout));
    return ()=>{ alive = false; clearTimeout(timeout); controller.abort(); };
  },[]);

  const update = (key,value) => setForm((current)=>({...current, [key]: value}));
  const applyPreset = (preset) => { setForm({...preset,language:form.language || 'en',number_of_questions:form.number_of_questions || 5}); setError(null); };
  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const exercise = await generateAiDeskExercise(form);
      onGenerated(exercise);
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel generator-panel">
      <div className="row between generator-head">
        <div>
          <div className="section-eyebrow" style={{margin:0}}>// Practice Engine</div>
          <h2 className="mono" style={{fontSize:20,fontWeight:700,margin:'8px 0 0'}}>Generate a desk case</h2>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
          <span className={"badge "+(status.ok && status.sources?'badge-green':'badge-amber')}>
            <span className={"dot "+(status.ok?'dot-green':'dot-red')}></span>{!status.checked ? 'CHECKING SERVICE' : status.ok ? status.sources ? 'REFERENCES AVAILABLE' : 'NO REFERENCES AVAILABLE' : 'OFFLINE REFERENCE MODE'}
          </span>
          <span className="mono mute" style={{fontSize:10.5}}>{status.detail}</span>
        </div>
      </div>
      <div className="generator-body">
        <div className="col" style={{gap:12}}>
          <div className="label">Desk presets</div>
          <div className="row" style={{gap:8,flexWrap:'wrap'}}>
            {GENERATOR_PRESETS.map((preset)=>(
              <button key={preset.id} className="btn btn-ghost btn-sm" onClick={()=>applyPreset(preset)}>{preset.label}</button>
            ))}
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Free prompt / constraints</span>
            <textarea aria-label="Exercise prompt and constraints" value={form.free_prompt} onChange={(event)=>update('free_prompt', event.target.value)} rows={6} placeholder="Describe the market case, product, numbers and expected action."/>
          </div>
        </div>
        <div className="generator-form">
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Topic</span>
            <input aria-label="Exercise topic" value={form.topic} onChange={(event)=>update('topic', event.target.value)}/>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Product</span>
            <input aria-label="Exercise product" value={form.product} onChange={(event)=>update('product', event.target.value)}/>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Concept</span>
            <input aria-label="Exercise concept" value={form.concept} onChange={(event)=>update('concept', event.target.value)}/>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Difficulty</span>
            <select aria-label="Exercise difficulty" value={form.difficulty} onChange={(event)=>update('difficulty', event.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Format</span>
            <select aria-label="Exercise format" value={form.exercise_format} onChange={(event)=>update('exercise_format', event.target.value)}>
              <option value="mixed">Mixed</option>
              <option value="case_study">Case study</option>
              <option value="quantitative_problem">Quantitative problem</option>
              <option value="trading_decision">Trading decision</option>
              <option value="risk_management">Risk management</option>
            </select>
          </div>
          <label className="field"><span className="mono mute" style={{fontSize:11}}>Exercise language</span><select aria-label="Exercise language" value={form.language || 'en'} onChange={event=>update('language',event.target.value)}><option value="en">English</option><option value="fr">Français</option></select></label>
          <label className="field"><span className="mono mute" style={{fontSize:11}}>Number of questions</span><input aria-label="Number of questions" type="number" min="1" max="12" value={form.number_of_questions} onChange={event=>update('number_of_questions',event.target.value)}/></label>
          <button className="btn btn-primary" onClick={generate} disabled={busy} style={{alignSelf:'end',justifyContent:'center'}}>
            {busy ? <><Icon name="terminal" size={13}/> Generating</> : <><Icon name="play" size={13}/> Generate exercise</>}
          </button>
        </div>
      </div>
      {busy && <p role="status" className="text-2">Retrieving references and preparing the worked solution…</p>}
      {error && <div role="alert" className="exercise-generator-error"><p>{error.message || 'Creation failed. Your request is preserved.'}</p>{error.status===401 && <Link className="btn btn-outline" to="/auth/login">Sign in again</Link>}{error.status===403 && <Link className="btn btn-outline" to="/pricing">Review my access</Link>}<p className="text-2">Your request is preserved. Adjust the parameters or try again.</p></div>}
    </div>
  );
}

function ExerciseCard({e}) {
  return (
    <Link to={"/exercises/"+e.id} className="panel exercise-card" style={{display:'block', textDecoration:'none'}}>
      <div className="row between exercise-card-top">
        <span className="row" style={{gap:6,flexWrap:'wrap'}}>
          <span className="badge">{e.cat}</span>
          {e.generated && <span className={"badge "+(e.engine==='rag'?'badge-green':'badge-amber')}>{exerciseModeLabel(e)}</span>}
        </span>
        <span className="row" style={{gap:8}}>
          <span className="badge">{e.level}</span>
          <span className="mono mute" style={{fontSize:11}}>{e.time}</span>
        </span>
      </div>
      <div className="exercise-card-body">
        <div className="mono exercise-card-title">{e.title}</div>
        <div className="mute exercise-card-desc">
        {exerciseDescription(e)}
        </div>
        <div className="row wrap" style={{gap:6,marginTop:12}}>
          {[
            e.product,
            e.concept,
          ].filter(Boolean).slice(0,2).map((tag)=><span key={tag} className="badge exercise-mini-badge">{tag}</span>)}
        </div>
      </div>
      <div className="row between exercise-card-foot">
        <span className="badge">Practice case</span>
        <span className="mono" style={{fontSize:11,color:'var(--red)'}}>start ›</span>
      </div>
    </Link>
  );
}

function ExerciseDetail({id}) {
  const auth = useAuth();
  const owner = auth.user?.id || null;
  const cached = getExerciseById(id, owner);
  const [state,setState] = useState({id:null,owner:null,exercise:null,error:null});
  const [retry,setRetry] = useState(0);
  useEffect(()=>{
    if (cached || !id.startsWith('exo_') || !owner) return;
    let active=true;
    setState({id,owner,exercise:null,error:null});
    platformApi.getExercise(id,owner).then(record=>{
      if (!active) return;
      const exercise=exerciseFromRecord(record);
      saveGeneratedExercise(exercise,owner);
      setState({id,owner,exercise,error:null});
    }).catch(error=>{if(active)setState({id,owner,exercise:null,error});});
    return ()=>{active=false;};
  },[id,owner,retry,Boolean(cached)]);
  const current = state.id===id && state.owner===owner ? state : null;
  const ex = cached || current?.exercise;
  if (!ex && id.startsWith('exo_') && owner && !current?.error) return <div className="container page" role="status">Chargement de votre exercice…</div>;
  if (!ex && current?.error && current.error.status!==404) return <div className="container page"><ServiceUnavailable title="Cet exercice n’a pas pu être chargé." onRetry={()=>setRetry(value=>value+1)}/></div>;
  if (!ex) return <NotFoundPage/>;
  if (ex.generated) return <GeneratedExerciseDetail ex={ex}/>;
  return <StaticExerciseDetail ex={ex}/>;
}

function StaticExerciseDetail({ex:original}) {
  const [tab,setTab] = useState('attempt');
  const [reference,setReference] = useState(null);
  const [referenceError,setReferenceError] = useState('');
  useEffect(()=>{let active=true;setTab('attempt');setReference(null);setReferenceError('');loadPracticeReference(original.id).then(value=>{if(active)setReference(value);}).catch(()=>{if(active)setReferenceError('The executable reference could not be loaded. Reload this exercise to retry.');});return()=>{active=false;};},[original.id]);
  const currentReference=reference?.id===original.id?reference:null;
  const ex={...original,solution:currentReference?.solution||'The current executable reference is loading. Your saved exercise remains unchanged.',output:currentReference?.output||'The current computed reference is loading. No new result is claimed.'};
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/exercises">exercises</Link><i>›</i><span>{ex.title.toLowerCase()}</span></>}
        title={ex.title}
        sub={`${ex.cat} · ${ex.level} · est. ${ex.time} · ${ex.product || 'market finance'}`}
        right={<>
          <button className="btn btn-outline btn-sm" onClick={()=>downloadExercise(ex)}><Icon name="download" size={13}/> Download JSON</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setTab('code')}><Icon name="play" size={13}/> Open Python editor</button>
        </>}
      />
      <div className="tabs-bar">
        {[['attempt','My attempt'],['problem','Problem'],['code','Code'],['output','Reference output'],['solution','Solution']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {referenceError&&<p className="form-notice error" role="alert">{referenceError}</p>}
      <div className="exercise-detail-grid">
        <div className="col" style={{gap:14}}>
          {tab==='attempt'&&<React.Suspense fallback={<p role="status">Loading written practice…</p>}><ExerciseAttemptPanel key={ex.id} exerciseId={ex.id} onReference={()=>setTab('solution')}/></React.Suspense>}
          {tab!=='attempt'&&currentReference&&<React.Suspense fallback={<p role="status">Loading computed reference…</p>}><PracticeReferencePanel reference={currentReference}/></React.Suspense>}
          {tab==='problem' && (
            <>
              <div className="panel exercise-readable-panel">
                <div className="label" style={{marginBottom:8}}>Objective</div>
                <p className="exercise-lead">{ex.objective}</p>
                <div className="label" style={{marginBottom:8,marginTop:20}}>Case inputs · hypothetical teaching data</div>
                <table className="data">
                  <tbody>
                    {(ex.marketData || []).map(([k,v])=>(
                      <tr key={k}><td className="symbol">{k}</td><td>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="label" style={{marginBottom:10,marginTop:22}}>Desk tasks</div>
                <div className="exercise-task-list">
                  {(ex.steps || []).map((step,idx)=>(
                    <div key={step} className="exercise-task">
                      <span className="mono">{String(idx + 1).padStart(2,'0')}</span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel exercise-readable-panel">
                <div className="label" style={{marginBottom:14}}>Reference output</div>
                <details><summary>Original teaching illustration</summary><p className="mute">This conceptual illustration is separate from the executable reference above.</p><ExerciseReferenceChart ex={ex}/></details>
              </div>
            </>
          )}
          {tab==='code' && (
            <PyCodeCell initial={ex.starterCode || '# Write your solution here\nprint("hello desk")'} label="exercise.py"/>
          )}
          {tab==='output' && (
            <div className="panel exercise-readable-panel">
              <div className="label" style={{marginBottom:10}}>Reference output · hypothetical teaching case</div><p className="text-2">This is the worked reference, not the result of your current code. Run your code in the editor to see its output.</p>
              <pre className="code" style={{marginBottom:14}} tabIndex={0} aria-label="Computed exercise reference output"><code>{ex.output}</code></pre>
              <details><summary>Original teaching illustration</summary><p className="mute">Separate from the reference result calculated above.</p><ChartFrame title="Teaching illustration"><ExerciseReferenceChart ex={ex} compact/></ChartFrame></details>
            </div>
          )}
          {tab==='solution' && (
            <div className="panel exercise-readable-panel">
              <div className="row between" style={{marginBottom:14}}>
                <div className="label">Reference solution</div>
                <span className="badge badge-amber">Spoiler</span>
              </div>
              <pre className="code" tabIndex={0} aria-label="Executable exercise reference source"><code>{ex.solution}</code></pre>
            </div>
          )}
        </div>

        <div className="col exercise-side-stack">
          <div className="panel exercise-side-panel">
            <div className="label" style={{marginBottom:10}}>Self-review rubric</div>
            <div className="col" style={{gap:8}}>
              {[
                ...(ex.grading || []),
                ['Runtime','browser / notebook','mute'],
              ].map(([k,v,c='mute'])=>(
                <div key={k} className="row between" style={{padding:'4px 0'}}>
                  <span className="mono mute" style={{fontSize:11}}>{k}</span>
                  <span className={"mono "+c} style={{fontSize:12,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
            <p className="mute" style={{fontSize:12,marginTop:14}}>Indicative points for your own review. No automatic score or expert assessment is assigned.</p>
          </div>
          <div className="panel exercise-side-panel">
            <div className="label" style={{marginBottom:10}}>Hints</div>
            <div className="col" style={{gap:10}}>
              {(ex.hints || []).map((h,i)=>(
                <div key={i} className="row" style={{gap:8,alignItems:'flex-start'}}>
                  <Icon name="lightbulb" size={12} style={{color:'var(--amber)',marginTop:2}}/>
                  <span className="mute" style={{fontSize:12}}>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseReferenceChart({ex, compact=false}) {
  const seed = (ex.id || 'exercise').split('').reduce((sum,ch)=>sum + ch.charCodeAt(0), 0);
  const data = useMemo(()=>genCurve(60,(i,n)=>{
    const x = i / Math.max(n - 1, 1);
    if (ex.cat === 'Rates' || ex.cat === 'Yield Curves') return 3 + 1.2 * (1 - Math.exp(-x * 4)) - 0.2 * Math.cos(x * 8);
    if (ex.cat === 'Risk' || ex.cat === 'Credit') return Math.max(0, 8 - 9 * x + 1.5 * Math.sin(x * 9));
    if (ex.cat === 'Monte Carlo') return 100 + 18 * Math.sin(x * 5) + 10 * Math.cos(x * 17 + seed);
    if (ex.cat === 'Exotic' || ex.cat === 'Barrier') return x < 0.35 ? 0 : x < 0.72 ? 20 : 20 + (x - 0.72) * 180;
    const S = 50 + x * 100, K=100, r=.02, sigma=.2, T=.5;
    const d1=(Math.log(S/K)+(r+.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
    const d2=d1-sigma*Math.sqrt(T);
    return S*normCdf(d1)-K*Math.exp(-r*T)*normCdf(d2);
  }),[ex.id, ex.cat]);
  return (
    <div data-exercise-reference-chart="true">
      <div className="mono mute" style={{fontSize:10.5,marginBottom:7}}>Illustrative deterministic reference curve — synthetic teaching output, not observed market data.</div>
      <LineChart width={620} height={compact ? 180 : 220} series={[{name:ex.cat,color:'#FF2E45',data,fillOpacity:0.08}]}/>
    </div>
  );
}

function GeneratedExerciseDetail({ex}) {
  const canSaveAttempt=ex.id.startsWith('exo_')&&ex.engine!=='fallback';
  const [tab,setTab] = useState(canSaveAttempt?'attempt':'brief');
  const sources = ex.sources || [];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/exercises">exercises</Link><i>›</i><span>generated</span></>}
        title={ex.title}
        sub={`${ex.cat} · ${ex.level} · ${exerciseModeLabel(ex)} · ${ex.time}`}
        right={<>
          <span className={"badge "+(ex.engine==='rag'?'badge-green':'badge-amber')}>{exerciseModeLabel(ex)}</span>
          <button className="btn btn-outline btn-sm" onClick={()=>copyText(ex.content, 'Exercise copied as Markdown.')}><Icon name="copy" size={13}/> Copy Markdown</button>
          <button className="btn btn-outline btn-sm" onClick={()=>downloadExerciseMarkdown(ex)}><Icon name="download" size={13}/> Download Markdown</button>
          <button className="btn btn-primary btn-sm" onClick={()=>downloadExercise(ex)}><Icon name="download" size={13}/> Download JSON</button>
        </>}
      />
      {ex.engine==='fallback' && <aside className="panel exercise-offline-notice"><strong>Fixed offline reference: your custom parameters have not been applied.</strong><p>No library reference is attached. Your original request is preserved so you can retry.</p><details><summary>Review my request</summary><p>{ex.request?.free_prompt}</p></details><Link className="btn btn-outline" to={`/exercises?retry=${encodeURIComponent(ex.id)}`}>Retry my request</Link></aside>}
      <p className="text-2" role="status">{ex.metadata?.persistence==='account' ? 'Saved to your account library.' : ex.metadata?.cache_warning ? 'Device cache unavailable. Download this example to keep it.' : 'Kept only on this device.'}</p>
      <p className="text-2" style={{fontSize:11}}>Readable references are available in Sources. Markdown and JSON downloads preserve the original saved text, including historical references.</p>
      <div className="tabs-bar">
        {[...(canSaveAttempt?[['attempt','My attempt']]:[]),['brief','Brief'],['solution','Worked solution'],['sources','Sources'],['export','Export']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="exercise-detail-grid">
        <div className="panel generated-markdown">
          {tab==='attempt'&&<React.Suspense fallback={<p role="status">Loading written practice…</p>}><ExerciseAttemptPanel key={ex.id} exerciseId={ex.id} onReference={()=>setTab('solution')}/></React.Suspense>}
          {tab==='brief' && <MarkdownBlock content={pickGeneratedContent(ex.content, 'brief')}/>}
          {tab==='solution' && <MarkdownBlock content={pickGeneratedContent(ex.content, 'solution')}/>}
          {tab==='sources' && <GeneratedSources sources={sources}/>}
          {tab==='export' && (
            <div>
              <div className="label" style={{marginBottom:12}}>Markdown export</div>
              <pre className="code"><code>{ex.content}</code></pre>
            </div>
          )}
        </div>
        <div className="col exercise-side-stack">
          <div className="panel exercise-side-panel">
            <div className="label" style={{marginBottom:10}}>About this case</div>
            <div className="col" style={{gap:8}}>
              {[
                ['Writing mode', exerciseModeLabel(ex)],
                ['Product', ex.product || '-'],
                ['Concept', ex.concept || '-'],
                ['Sources', String(sources.length)],
                ['Created', ex.createdAt ? new Date(ex.createdAt).toLocaleString() : '-'],
              ].map(([k,v])=>(
                <div key={k} className="row between" style={{padding:'4px 0'}}>
                  <span className="mono mute" style={{fontSize:11}}>{k}</span>
                  <span className="mono" style={{fontSize:11.5,fontWeight:600,textAlign:'right',maxWidth:190}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel exercise-side-panel">
            <div className="label" style={{marginBottom:10}}>Next action</div>
            <div className="mute" style={{fontSize:12.5,lineHeight:1.55}}>
              Save a written attempt and compare it with the worked reference in My attempt. Your reasoning self-review is separate from numerical checks in the Interview Lab. No automatic prose grade or expert feedback is included. If this is an offline reference, retry online to create an account-owned case.
            </div>
            <Link className="btn btn-primary btn-sm" to="/interview" style={{marginTop:14}}>Practise with a submitted answer</Link><button className="btn btn-outline btn-sm" onClick={()=>nav('/exercises')} style={{width:'100%',justifyContent:'center',marginTop:10}}>Back to generator</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneratedSources({sources}) {
  if (!sources.length) {
    return (
      <div>
        <div className="label" style={{marginBottom:12}}>Sources</div>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.7}}>No course reference was attached to this generated exercise. Treat it as an unsourced practice prompt.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="label" style={{marginBottom:12}}>Course references</div>
      <table className="data">
        <thead><tr><th>Reference</th><th>Relevant excerpt</th></tr></thead>
        <tbody>
          {sources.map((src,idx)=>(
            <tr key={src.chunk_id || idx}>
              <td className="symbol">{src.title || src.source || 'Course reference'}</td>
              <td className="mute" style={{fontSize:11,lineHeight:1.45}}>{readableExerciseText(src.snippet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function readableExerciseText(value) {
  return String(value || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,' ');
}
function MarkdownBlock({content}) {
  return <div className="exercise-rich-markdown"><React.Suspense fallback={<p role="status">Loading document…</p>}><CourseMarkdown tables>{readableExerciseText(content).replace(/^# /gm,'## ')}</CourseMarkdown></React.Suspense></div>;
}

function pickGeneratedContent(content, mode) {
  // Saved documents stay immutable. The reader uses the checked Sources tab,
  // rather than replaying historical OCR from an embedded references footer.
  const readerContent = String(content || '').split(/^##\s+R[eé]f[eé]rences[^\n]*$/im)[0].trim();
  if (mode === 'solution') {
    const match = readerContent.match(/^## (?:Corrig[^\n]*|Verified solution)\s*$[\s\S]*/im);
    return match ? match[0] : readerContent;
  }
  if (mode === 'brief') {
    return readerContent.split(/^## (?:Corrig[^\n]*|Verified solution)\s*$/im)[0].trim() || readerContent;
  }
  return readerContent;
}

// ============= SURVIVAL MODE =============
function SurvivalPage({route}) {
  const sub = route.parts[1];
  if (!sub) return <SurvivalIndex/>;
  if (route.parts.length===2 && ['core','beginner'].includes(sub)) return <SurvivalWave wave="core"/>;
  return <div className="container page"><PageHead title="This wave is not available" sub="The released timed practice is one mixed Core wave. Separate difficulty levels are not published yet."/><div className="panel service-state"><h2>Try the Core practice wave</h2><p>20 questions · 30 seconds per question · 3 lives. Your feedback stays on the answered question until you choose Next.</p><Link to="/survival/core" className="btn btn-primary">Open Core practice <Icon name="arrow-right" size={13}/></Link></div></div>;
}

function SurvivalIndex() {
  const [board,setBoard] = useState(null);
  useEffect(()=>{ platformApi.survivalLeaderboard(10).then(setBoard).catch(()=>setBoard([])); },[]);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ survival</span></>}
        title="Survival Mode"
        sub="One released mixed-topic practice wave. Separate difficulty levels are not available. Practice scores are unranked unless independently verified by the server."
        right={<span className="badge">Timed practice</span>}
      />
      <div className="grid-3" style={{marginBottom:20}}>
        <Stat label="Questions" value={String(SURVIVAL_QUESTIONS.length)}/>
        <Stat label="Time per question" value="30s"/>
        <Stat label="Lives" value="3"/>
      </div>
      <div className="panel survival-core-card" style={{padding:28,maxWidth:820}}>
        <div className="section-eyebrow">Core practice · mixed topics</div>
        <h2 className="section-title">Explain the number under pressure.</h2>
        <p className="text-2" style={{lineHeight:1.7}}>Practise Black-Scholes, Greeks, volatility and hedging. A timeout costs one life; the timer pauses while you review the explanation. Completing a run records practice activity, not a verified skill certification.</p>
        <div className="row" style={{gap:10,marginTop:20,flexWrap:'wrap'}}>
          <Link to="/survival/core" className="btn btn-primary">Start Core practice <Icon name="play" size={13}/></Link>
          <Link to="/interview" className="btn btn-outline">Prefer an untimed interview case?</Link>
        </div>
      </div>
      <section className="section" style={{marginTop:32}}>
        <div className="section-eyebrow">Verified leaderboard</div>
        <h2 className="section-title">All-time top 10</h2>
        <div className="panel">
          {board===null && <div className="mute" style={{padding:18}}>Loading leaderboard…</div>}
          {board!==null && board.length===0 && <div className="mute" style={{padding:18}}>No verified runs yet. Saved practice runs do not publish a client-declared score.</div>}
          {board && board.length>0 && <table className="data"><thead><tr><th>#</th><th>Player</th><th className="num">Best score</th><th className="num">Streak</th></tr></thead><tbody>{board.map(r=><tr key={r.username}><td className="symbol">#{r.rank}</td><td>@{r.username}</td><td className="num">{Number(r.score).toLocaleString()}</td><td className="num">{r.streak||0}</td></tr>)}</tbody></table>}
        </div>
      </section>
    </div>
  );
}

function SurvivalWave({wave}) {
  return <React.Suspense fallback={<div className="container page"><h1 className="page-title">Survival · Core wave</h1><p role="status">Restoring your timed practice…</p></div>}><ServerSurvival/></React.Suspense>;
}

// ============= COMMUNITY =============
function CommunityPage({route}) {
  const requestedSub = route.parts[1] || 'forum';
  const sub = requestedSub === 'forum' ? 'forum' : 'unpublished';
  const tabs = [['forum','Forum']];
  const [composing,setComposing] = useState(false);
  const [reloadKey,setReloadKey] = useState(0);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ community</span></>}
        title="Community forum"
        sub="A persisted forum for pricing and risk questions. Project publishing and publications are not included in this release."
        right={sub==='forum' ? <button className="btn btn-primary btn-sm" onClick={()=>setComposing(c=>!c)}><Icon name="plus" size={13}/> New post</button> : null}
      />
      <div className="tabs-bar">
        {tabs.map(([k,l])=><Link key={k} to={"/community/"+k} className={"tab-btn "+(sub===k?'on':'')}>{l}</Link>)}
      </div>
      {sub==='forum' && <ForumPanel composing={composing} setComposing={setComposing} reloadKey={reloadKey} onPosted={()=>setReloadKey(k=>k+1)}/>}
      {sub==='unpublished' && <div className="panel" style={{padding:24,marginTop:14}}><div className="label">Not published in this release</div><p className="text-2" style={{fontSize:13,lineHeight:1.6}}>Project publishing and peer-reviewed publications are not active and are not part of any paid-plan promise. The delivered community surface is the persisted forum.</p><Link to="/community/forum" className="btn btn-outline btn-sm">Back to forum <Icon name="arrow-right" size={13}/></Link></div>}
    </div>
  );
}

function ForumPanel(props) { return <ForumWorkspace {...props}/>; }

function ProjectsPanel() {
  const myp = [];
  const com = [];
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">My projects</div>
          <span className="badge">NOT PUBLISHED</span>
        </div>
        {myp.length===0 && <div className="mute" style={{padding:18}}>Project publishing is not part of this release.</div>}
        {myp.map((p,i)=>(
          <div key={p.n} style={{padding:16, borderTop:i?'1px solid var(--line)':'none'}}>
            <div className="row between" style={{marginBottom:6}}>
              <span className="mono" style={{fontWeight:700,fontSize:13.5}}>{p.n}</span>
              <div className="row" style={{gap:14}}>
                <span className="mono mute" style={{fontSize:11}}><Icon name="star" size={11}/> {p.stars}</span>
                <span className="badge">{p.lang}</span>
              </div>
            </div>
            <div className="mute" style={{fontSize:12.5}}>{p.desc}</div>
            <div className="mono mute" style={{fontSize:10.5,marginTop:8}}>updated {p.updated} ago</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Published projects</div>
        </div>
        {com.length===0 && <div className="mute" style={{padding:18}}>No verified public projects yet.</div>}
        {com.map((p,i)=>(
          <div key={p.n} style={{padding:16, borderTop:i?'1px solid var(--line)':'none'}}>
            <div className="row between" style={{marginBottom:6}}>
              <span className="mono" style={{fontWeight:700,fontSize:13.5}}>{p.n}</span>
              <div className="row" style={{gap:14}}>
                <span className="mono mute" style={{fontSize:11}}><Icon name="star" size={11} style={{color:'var(--amber)'}}/> {p.stars}</span>
                <span className="badge">{p.lang}</span>
              </div>
            </div>
            <div className="mute" style={{fontSize:12.5}}>{p.desc}</div>
            <div className="row between" style={{marginTop:8}}>
              <span className="mono mute" style={{fontSize:10.5}}>updated {p.updated} ago</span>
              <button className="btn btn-ghost btn-sm" onClick={()=>handleSave(`${p.n} fork`)} style={{padding:'2px 8px',fontSize:10.5}}>Fork</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicationsPanel() {
  const pubs = [];
  return (
    <div className="grid-3">
      {pubs.length===0 && <div className="panel" style={{padding:24}}><div className="mono" style={{fontWeight:700}}>No verified publications yet.</div><p className="text-2" style={{fontSize:13,marginBottom:0}}>Publication and citation counts will only appear after editorial review and persistence.</p></div>}
      {pubs.map(p=>(
        <div key={p.t} className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:12}}>
            <span className="badge">{p.kind}</span>
            <span className="mono mute" style={{fontSize:11}}>{p.d}</span>
          </div>
          <div className="mono" style={{fontWeight:700,fontSize:14,marginBottom:10,lineHeight:1.4}}>{p.t}</div>
          <div className="row between" style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--line)'}}>
            <span className="mono red" style={{fontSize:12}}>{p.a}</span>
            <span className="mono mute" style={{fontSize:11}}>{p.cite} citations</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============= BLOG =============
function BlogPage({route}) {
  const slug = route.parts[1];
  if (slug) return <PostDetail slug={slug}/>;
  return <BlogIndex/>;
}
function blogDate(ts){ try { return new Date((ts||0)*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}); } catch { return ''; } }
function mapBlog(p){ return { id:p.slug, title:p.title, excerpt:p.excerpt||'', author:p.author||'The Pricing Library', tag:(p.tags&&p.tags[0])||'Quant', date:blogDate(p.published_at), readTime:p.read_minutes?`${p.read_minutes} min`:'5 min' }; }
function BlogIndex() {
  const [tag,setTag] = useState('All');
  const [query,setQuery] = useState('');
  const [posts,setPosts] = useState(null);
  const [loadError,setLoadError] = useState(false);
  const loadPosts = useCallback(()=>{
    setLoadError(false);
    platformApi.listBlog().then((data)=>setPosts(data.map(mapBlog))).catch(()=>setLoadError(true));
  },[]);
  useEffect(()=>{ loadPosts(); },[loadPosts]);
  const all = posts || [];
  const categories = ['All', ...Array.from(new Set(all.map(p=>p.tag)))];
  const normalizedQuery = query.trim().toLowerCase();
  const matches = all.filter((post) => {
    const inTag = tag === 'All' || post.tag === tag;
    const haystack = `${post.title} ${post.excerpt} ${post.tag} ${post.author}`.toLowerCase();
    return inTag && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  if (loadError) return <div className="container page"><PageHead title="The Pricing Letter" sub="Essays on pricing, risk and quantitative finance."/><ServiceUnavailable title="Articles could not be loaded" onRetry={loadPosts}/></div>;
  if (posts===null) return <div className="container page"><PageHead title="The Pricing Letter"/><p role="status">Loading articles…</p></div>;
  if (all.length===0) return <div className="container page"><PageHead title="The Pricing Letter" sub="Essays on pricing, risk and quantitative finance."/><div className="panel service-state"><h2>No articles published yet</h2><p>Work on a pricing interview case while the editorial library is being prepared.</p><Link className="btn btn-outline" to="/interview">Start interview practice</Link></div></div>;
  if (!matches.length) return <div className="container page"><PageHead title="The Pricing Letter"/><label className="field">Search articles<input type="search" value={query} onChange={(event)=>setQuery(event.target.value)}/></label><div className="panel service-state"><h2>No articles match this search</h2><button type="button" className="btn btn-outline" onClick={()=>{setQuery('');setTag('All');}}>Clear filters</button></div></div>;
  const featured = matches[0];
  const cards = matches.filter((post) => post.id !== featured.id);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ blog</span></>}
        title="The Pricing Letter"
        sub="Essays, worked explanations and quantitative finance interview practice."
        right={<>
          <input aria-label="Search articles" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search posts…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
          <button className="btn btn-primary btn-sm" onClick={async()=>{const e=window.prompt('Your email for The Pricing Letter:'); if(e&&/^\S+@\S+\.\S+$/.test(e)){try{await platformApi.subscribe(e,'blog-index');notify('Subscribed. Welcome aboard.');}catch(err){notify('Could not subscribe ('+err.message+').','error');}} else if(e){notify('Please enter a valid email.','warning');}}}>Subscribe</button>
        </>}
      />
      <div className="row" style={{gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {categories.map((t)=>(
          <button key={t} className="badge" onClick={()=>setTag(t)} style={tag===t?{color:'var(--red)',borderColor:'var(--red)'}:{}}>{t}</button>
        ))}
      </div>
      {!matches.length && <div className="panel" style={{padding:18,marginBottom:18}}><span className="mono mute">No post matches this search. Showing the latest issue.</span></div>}
      <Link to={"/blog/"+featured.id} className="panel" style={{padding:0, display:'grid', gridTemplateColumns:'1.4fr 1fr',marginBottom:24}}>
        <div style={{padding:'36px 36px'}}>
          <div className="row" style={{gap:10,marginBottom:14}}>
            <span className="badge badge-red">FEATURED</span>
            <span className="badge">{featured.tag}</span>
            <span className="mono mute" style={{fontSize:11}}>{featured.date} · {featured.readTime}</span>
          </div>
          <h2 className="mono" style={{fontSize:32,fontWeight:700,lineHeight:1.15,margin:'0 0 16px'}}>{featured.title}</h2>
          <p className="text-2" style={{fontSize:14,lineHeight:1.6, maxWidth:'52ch'}}>{featured.excerpt}</p>
          <div className="row between" style={{marginTop:24}}>
            <span className="mono red" style={{fontSize:12}}>{featured.author}</span>
            <span className="mono mute" style={{fontSize:11}}>read full article ›</span>
          </div>
        </div>
        <div style={{background:'#06080B',borderLeft:'1px solid var(--line)',display:'grid',placeItems:'center', minHeight:280}}>
          <svg viewBox="0 0 280 200" width="80%" height="80%">
            <path d="M 10,150 Q 90,30 170,90 T 270,40" fill="none" stroke="#FF2E45" strokeWidth="2"/>
            <path d="M 10,150 Q 90,30 170,90 T 270,40 L 270 180 L 10 180 Z" fill="#FF2E45" opacity="0.08"/>
            {[0.2,0.4,0.6,0.8].map((p,i)=><line key={i} x1="10" y1={40+p*140} x2="270" y2={40+p*140} stroke="#1A1F28"/>)}
            <text x="14" y="20" fill="#7C8493" fontSize="9" fontFamily="JetBrains Mono">σ vs K</text>
          </svg>
        </div>
      </Link>
      <div className="grid-3">
        {cards.map(p=>(
          <Link to={"/blog/"+p.id} key={p.id} className="panel" style={{padding:0}}>
            <div style={{aspectRatio:'16/9', borderBottom:'1px solid var(--line)', background:'#06080B', display:'grid', placeItems:'center'}}>
              <BlogThumb tag={p.tag}/>
            </div>
            <div style={{padding:18}}>
              <div className="row" style={{gap:10,marginBottom:10}}>
                <span className="badge">{p.tag}</span>
                <span className="mono mute" style={{fontSize:10.5}}>{p.readTime}</span>
              </div>
              <div className="mono" style={{fontWeight:700,fontSize:14.5,marginBottom:8,lineHeight:1.35}}>{p.title}</div>
              <div className="mute" style={{fontSize:12.5,lineHeight:1.55}}>{p.excerpt}</div>
              <div className="row between" style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--line)'}}>
                <span className="mono red" style={{fontSize:11.5}}>{p.author}</span>
                <span className="mono mute" style={{fontSize:11}}>{p.date}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
function BlogThumb({tag}) {
  if (tag==='Monte Carlo') return (
    <svg viewBox="0 0 200 100" width="80%" height="80%">
      {Array.from({length:10}).map((_,i)=>{
        const d = genWalk(30, 50, 0.045, 0.0006, i+13);
        const path = d.map((p,j)=>`${j===0?'M':'L'} ${j*7} ${100-p.y*1.2}`).join(' ');
        return <path key={i} d={path} fill="none" stroke="#FF2E45" strokeWidth="0.6" opacity="0.5"/>;
      })}
    </svg>
  );
  if (tag==='Volatility') return <svg viewBox="0 0 200 100" width="80%" height="80%"><path d="M 0,70 Q 100,10 200,55" fill="none" stroke="#FFB020" strokeWidth="2"/></svg>;
  if (tag==='Python') return <div className="mono" style={{color:'#FF2E45',fontSize:42, fontWeight:700}}>{'>'}_</div>;
  if (tag==='Black-Scholes') return <div className="mono" style={{color:'#FF2E45',fontSize:24, fontWeight:600}}>d₁ · d₂</div>;
  if (tag==='Options') return (
    <svg viewBox="0 0 200 100" width="80%" height="80%">
      <line x1="0" y1="70" x2="200" y2="70" stroke="#2C3340"/>
      <polyline points="0,70 100,70 200,15" fill="none" stroke="#FF2E45" strokeWidth="1.8"/>
    </svg>
  );
  return <div className="mono red" style={{fontSize:48}}>σ</div>;
}

function NewsletterSignup({source}) {
  const [email,setEmail] = useState('');
  const [subscribed,setSubscribed] = useState(false);
  const [busy,setBusy] = useState(false);
  const subscribe = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { notify('Enter a valid email address.', 'warning'); return; }
    setBusy(true);
    try { await platformApi.subscribe(email, source||'blog'); setSubscribed(true); setEmail(''); notify('Subscribed. Welcome aboard.'); }
    catch (e) { notify(`Could not subscribe (${e.message}).`, 'error'); }
    finally { setBusy(false); }
  };
  return (
    <div className="panel" style={{padding:24,marginTop:32}}>
      <div className="row between" style={{marginBottom:14}}>
        <div className="label">The Pricing Letter</div>
        <span className="mono mute" style={{fontSize:11}}>1 / week</span>
      </div>
      <p className="text-2" style={{fontSize:13.5,marginTop:0}}>Long-form quant essays in your inbox. No spam, no upsells.</p>
      {subscribed && <FormNotice>You are on the next issue list.</FormNotice>}
      <form className="row" onSubmit={subscribe} style={{gap:8,marginTop:10}}>
        <input aria-label="Newsletter email" value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@desk.com" style={{flex:1, background:'#0A0C10',border:'1px solid var(--line-2)',color:'var(--text)',padding:'8px 10px',borderRadius:3,fontFamily:"'JetBrains Mono',monospace",fontSize:12.5,outline:'none'}}/>
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>{busy?'…':'Subscribe'}</button>
      </form>
    </div>
  );
}
function PostDetail({slug}) {
  const [p,setP] = useState(undefined); // undefined=loading, null=not found
  const [loadError,setLoadError] = useState(false);
  const [reload,setReload] = useState(0);
  const [related,setRelated] = useState([]);
  useEffect(()=>{
    let alive=true;
    setLoadError(false); setP(undefined);
    platformApi.getBlog(slug).then((d)=>{ if(alive) setP(d||null); }).catch((error)=>{ if(alive) { if(error.status===404) setP(null); else setLoadError(true); } });
    platformApi.listBlog().then((d)=>{ if(alive) setRelated((d||[]).map(mapBlog).filter(x=>x.id!==slug).slice(0,3)); }).catch(()=>{});
    return ()=>{ alive=false; };
  },[slug,reload]);
  if (loadError) return <div className="container page"><PageHead title="Article unavailable"/><ServiceUnavailable title="This article could not be loaded" onRetry={()=>setReload(value=>value+1)}/></div>;
  if (p===undefined) return <div className="container page"><PageHead title="Article"/><p role="status">Loading article…</p></div>;
  if (p===null) return <div className="container page"><PageHead title="Article not found"/><Link to="/blog" className="btn btn-outline">Back to blog</Link></div>;
  const tag = (p.tags&&p.tags[0])||'Quant';
  return (
    <div className="container page" style={{maxWidth:880}}>
      <div className="crumb" style={{marginTop:24}}><Link to="/blog">/ blog</Link><i>›</i><span>{tag.toLowerCase()}</span></div>
      <div className="row" style={{gap:10,marginTop:14,marginBottom:18}}>
        <span className="badge">{tag}</span>
        <span className="mono mute" style={{fontSize:11}}>{blogDate(p.published_at)} · {p.read_minutes?`${p.read_minutes} min`:'5 min'} · {p.author||'The Pricing Library'}</span>
      </div>
      <h1 className="mono" style={{fontSize:38,fontWeight:700,lineHeight:1.15,margin:'0 0 18px'}}>{p.title}</h1>
      {p.excerpt && <p className="text-2" style={{fontSize:15,lineHeight:1.7,maxWidth:'62ch'}}>{p.excerpt}</p>}
      <div className="course-md" style={{margin:'32px 0', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'32px 0', maxWidth:'72ch'}}>
        <LatexMarkdown content={p.body || '_No content._'}/>
      </div>
      <NewsletterSignup source={`blog:${slug}`}/>
      {related.length>0 && <div style={{marginTop:32}}>
        <div className="label" style={{marginBottom:14}}>Related posts</div>
        <div className="grid-3">
          {related.map(rp=>(
            <Link to={"/blog/"+rp.id} key={rp.id} className="panel" style={{padding:14,display:'block'}}>
              <span className="badge">{rp.tag}</span>
              <div className="mono" style={{fontWeight:700,marginTop:10}}>{rp.title}</div>
              <div className="mono mute" style={{fontSize:10.5,marginTop:6}}>{rp.date}</div>
            </Link>
          ))}
        </div>
      </div>}
    </div>
  );
}

// ============= DASHBOARD =============
function AccountPage() {
  const auth = useAuth();
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const refresh = async () => {
    setBusy(true); setMessage('');
    try { if (await auth.refreshEntitlement() === false) throw new Error('Access check unavailable'); setMessage('Access check finished. The plan below reflects your current account state.'); }
    catch { setMessage('Access could not be refreshed. Retry without changing your account.'); }
    finally { setBusy(false); }
  };
  if (auth.isLoading) return <div className="container page"><h1 className="page-title">Account & access</h1><p role="status">Loading your account…</p></div>;
  if (!auth.isAuthenticated) return <div className="container page"><h1 className="page-title">Account & access</h1><p className="page-sub">Sign in to view your account and saved learning activity.</p><Link className="btn btn-primary" to="/auth/login">Sign in</Link></div>;
  return <div className="container page">
    <PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ account</span></>} title="Account & access" sub="Your identity, current access and routes to your saved work."/>
    <div className="grid-2"><section className="panel" style={{padding:24}}><h2 style={{fontSize:20}}>Account</h2><dl className="account-details"><dt>Email</dt><dd>{auth.user?.email || 'Not supplied'}</dd><dt>Access tier</dt><dd>{PLAN_LABEL[auth.plan] || auth.plan || 'Free'}</dd><dt>Role</dt><dd>{auth.isAdmin() ? 'Administrator' : 'Learner'}</dd></dl><button className="btn btn-outline btn-sm" onClick={refresh} disabled={busy}>{busy ? 'Checking access…' : 'Refresh access'}</button>{message && <p role="status" className="mute" style={{fontSize:12}}>{message}</p>}<p className="mute" style={{fontSize:12,lineHeight:1.6}}>Access is checked against the service. A test or pilot entitlement is not evidence of a purchase.</p></section>
    <section className="panel" style={{padding:24}}><h2 style={{fontSize:20}}>Your work and support</h2><div className="col" style={{gap:12}}><Link to="/interview">Resume interview preparation →</Link><Link to="/dashboard">View saved learning activity →</Link><Link to="/exercises">Open your exercise library →</Link><Link to="/auth/reset-password">Change your password →</Link><Link to="/pricing">Plans and current availability →</Link><Link to="/contact">Contact & support →</Link><Link to="/privacy">Privacy and data requests →</Link></div></section></div>
    <button className="btn btn-ghost" style={{marginTop:20}} onClick={async()=>{await auth.signOut();nav('/');}}>Sign out</button>
  </div>;
}
function courseModules(courseId){ const c = COURSES.find(x=>x.id===courseId); return (c && c.modules) || 8; }
function coursePct(courseId, lessonsDone){ return Math.min(100, Math.round((lessonsDone / courseModules(courseId)) * 100)); }
function DashboardPage() {
  let auth=null; try { auth = useAuth(); } catch { auth=null; }
  const userId = auth?.user?.id || auth?.user?.email || null;
  const accessToken = auth?.session?.access_token || null;
  const plan = (auth?.plan || 'free').toUpperCase();
  const [tab,setTab] = useState('overview');
  const [prog,setProg] = useState(null); // null=loading
  const [loadError,setLoadError] = useState(false);
  const [reload,setReload] = useState(0);
  useEffect(()=>{
    let active=true;
    setLoadError(false); setProg(null);
    if (!userId || !accessToken || auth?.isLoading) return ()=>{active=false;};
    platformApi.getProgress(userId, accessToken).then((d)=>{if(active) setProg(d||{});}).catch(()=>{if(active) setLoadError(true);});
    return ()=>{active=false;};
  },[userId,accessToken,auth?.isLoading,reload]);
  if (auth?.isLoading) return <div className="container page"><h1 className="page-title">Dashboard</h1><p role="status">Loading your account…</p></div>;
  if (!userId) return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ dashboard</span></>} title="Dashboard" sub="Your learning desk."/>
      <div className="panel" style={{padding:28,textAlign:'center'}}><div className="mono" style={{fontWeight:600}}>Log in to see your dashboard.</div><Link to="/auth/login" className="btn btn-primary" style={{marginTop:16}}>Log in</Link></div></div>
  );
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ dashboard</span></>}
        title="Dashboard"
        sub="Your learning desk · progress, achievements, recent activity."
        right={<>
          <span className="badge"><span className="dot dot-green"></span>{plan}</span>
          <Link to="/interview" className="btn btn-primary btn-sm">Continue interview practice <Icon name="arrow-right" size={13}/></Link>
        </>}
      />
      <div className="tabs-bar">
        {[['overview','Overview'],['progress','Progress'],['quizzes','Quizzes'],['achievements','Achievements']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {loadError && <ServiceUnavailable title="Your progress could not be loaded" onRetry={()=>setReload(value=>value+1)}/>}
      {prog===null && !loadError && <div className="panel mute" style={{padding:24}} role="status">Loading your activity…</div>}
      {prog!==null && tab==='overview' && <DashOverview prog={prog}/>}
      {prog!==null && tab==='progress' && <DashProgress prog={prog}/>}
      {prog!==null && tab==='quizzes' && <DashQuizzes prog={prog}/>}
      {prog!==null && tab==='achievements' && <DashAchievements prog={prog}/>}
    </div>
  );
}
function EmptyDash({what}) {
  return <div className="panel" style={{padding:28,textAlign:'center'}}>
    <div className="mono" style={{fontWeight:600}}>Nothing here yet.</div>
    <div className="mute" style={{fontSize:13,marginTop:8}}>{what} Saved completions and submitted activities appear here. Viewing a lesson alone does not count as completion.</div>
  </div>;
}
function DashOverview({prog}) {
  const interview = interviewProgressView(prog);
  const learning = learningProgressView(prog);
  const courses = prog.courses || [];
  const quizzes = prog.quizzes || [];
  const exercises = prog.exercises || [];
  const lessonsDone = courses.reduce((s,c)=>s+c.lessons_done,0);
  const quizzesPassed = quizzes.filter(q=>(q.score||0)>=50).length;
  if (!(prog.events>0) && !interview?.hasActivity && !learning?.hasActivity) return <><InterviewActivity interview={interview}/><LearningActivity learning={learning}/><EmptyDash what={learning?.hasStarted?'No answers submitted yet. Your started practice can be resumed above.':'No submitted learning activity yet.'}/></>;
  return (
    <>
      <InterviewActivity interview={interview}/>
      <LearningActivity learning={learning}/>
      <h2 style={{fontSize:18,margin:'24px 0 8px'}}>Courses & practice</h2>
      <p className="mute" style={{fontSize:12,lineHeight:1.6,marginBottom:14}}>These counts cover the course and practice event record. Your Interview Lab checks, written attempts and timed-question records remain separate above.</p>
      <div className="grid-4">
        <Stat label="Lessons done" value={String(lessonsDone)} sub={`${courses.length} courses`}/>
        <Stat label="Course & practice activity" value={String(prog.events||0)} sub={`${prog.active_days||0} days in this record`}/>
        <Stat label="Quizzes passed" value={`${quizzesPassed} / ${quizzes.length}`} sub={quizzes.length?`${Math.round(100*quizzesPassed/quizzes.length)}%`:'—'}/>
        <Stat label="Recorded average" value={prog.avg_score!=null?String(prog.avg_score):'—'} sub="scored practice entries"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,marginTop:18}}>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Continue learning</div>
            <Link to="/courses" className="btn btn-ghost btn-sm">All courses ›</Link>
          </div>
          {(courses.length?courses:[]).slice(0,5).map((c,i)=>{
            const meta = COURSES.find(x=>x.id===c.course); const pct = coursePct(c.course, c.lessons_done);
            return (
            <Link to={"/courses/"+c.course} key={c.course} style={{display:'flex',padding:14, borderTop:i?'1px solid var(--line)':'none',gap:14,alignItems:'center'}}>
              <div style={{width:48,height:48, border:'1px solid var(--line)', background:'#06080B',display:'grid',placeItems:'center'}}>
                <Icon name="book-open" size={18} style={{color:'var(--red)'}}/>
              </div>
              <div style={{flex:1}}>
                <div className="mono" style={{fontWeight:600}}>{meta?meta.title:c.course}</div>
                <div className="row" style={{gap:14,marginTop:4}}>
                  <span className="mono mute" style={{fontSize:11}}>{c.lessons_done} lessons</span>
                  <span className="mono mute" style={{fontSize:11}}>{pct}% complete</span>
                </div>
                <div style={{height:2,marginTop:6,background:'var(--line)'}}><div style={{height:'100%',width:pct+'%',background:'var(--red)'}}></div></div>
              </div>
              <Icon name="play" size={14} style={{color:'var(--red)'}}/>
            </Link>
            );
          })}
          {!courses.length && <div className="mute" style={{padding:16}}>Open a course lesson to start tracking progress.</div>}
        </div>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Course & practice activity · 90d</div>
          </div>
          <div style={{padding:14}}>
            <ActivityHeatmap heat={prog.heatmap||[]} today={prog.today}/>
            <div className="row between" style={{marginTop:14}}>
              <span className="mono mute" style={{fontSize:10.5}}>{prog.active_days||0} active days</span>
            </div>
          </div>
        </div>
      </div>
      <div className="panel" style={{padding:0,marginTop:14}}>
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Recent exercises</div>
          <Link to="/exercises" className="btn btn-ghost btn-sm">All exercises ›</Link>
        </div>
        {exercises.length? <table className="data">
          <thead><tr><th>Exercise</th><th>When</th><th className="num">Score</th><th>Status</th></tr></thead>
          <tbody>
            {exercises.slice(0,8).map((e,i)=>(
              <tr key={i}>
                <td className="symbol">{e.ref||e.meta?.title||'Desk exercise'}</td>
                <td>{new Date((e.created_at||0)*1000).toLocaleDateString()}</td>
                <td className={"num "+((e.score||0)>=50?'green':'mute')}>{e.score!=null?`${e.score}`:'-'}</td>
                <td>{(e.score||0)>=50?<span className="badge badge-green">PASS</span>:<span className="badge">TRIED</span>}</td>
              </tr>
            ))}
          </tbody>
        </table> : <div className="mute" style={{padding:16}}>Generate or solve an exercise to populate this list.</div>}
      </div>
    </>
  );
}
function InterviewActivity({interview}) {
  if (!interview) return null;
  return <section className="panel interview-activity" aria-labelledby="dashboard-interview-heading" style={{padding:24,marginBottom:18}}>
    <div className="row between" style={{gap:16,flexWrap:'wrap'}}><div><div className="label">Interview preparation</div><h2 id="dashboard-interview-heading" style={{fontSize:20,margin:'8px 0'}}>{interview.hasActivity ? 'Your saved interview work' : 'Start your preparation path'}</h2></div><Link className="btn btn-primary btn-sm" to={interview.resumePath}>{interview.hasResume ? 'Resume saved case' : 'Open Interview Lab'} <Icon name="arrow-right" size={13}/></Link></div>
    <div className="grid-4" style={{marginTop:16}}><Stat label="Saved attempts" value={String(interview.attempts)} sub={`${interview.cases} cases worked`}/><Stat label="Numerical passes" value={String(interview.numericalPasses)} sub="distinct case tasks"/><Stat label="Independent checks" value={String(interview.independentChecks)} sub="recorded before correction"/><Stat label="Reasoning self-reviews" value={String(interview.reasoningReviews)} sub="self-assessed, not expert grades"/></div>
    <p className="mute" style={{fontSize:12,margin:'14px 0 0'}}>These records describe your practice. Course completion, numerical accuracy and reasoning reviews remain separate; they are not a certified mastery score.</p>
  </section>;
}
function ActivityHeatmap({heat=[], today}) {
  const W = 14, H = 7;
  const day = 86400;
  const end = today || (Math.floor(Date.now()/1000/day)*day);
  const counts = {}; heat.forEach(h=>{ counts[h.day]=h.count; });
  const cells = Array.from({length:W*H}).map((_,i)=>{ const d = end - (W*H-1-i)*day; return counts[d]||0; });
  const col = (v)=> v>=4?'#FF2E45':v>=2?'#7B1B26':v>=1?'#3A0E15':'#11141A';
  return (
    <svg viewBox={`0 0 ${W*14} ${H*14}`} width="100%" style={{display:'block'}}>
      {cells.map((v,i)=><rect key={i} x={(i%W)*14} y={Math.floor(i/W)*14} width="11" height="11" fill={col(v)}/>)}
    </svg>
  );
}
function DashProgress({prog}) {
  const map = {}; (prog.courses||[]).forEach(c=>{ map[c.course]=c.lessons_done; });
  if (!(prog.events>0)) return <><InterviewActivity interview={interviewProgressView(prog)}/><LearningActivity learning={learningProgressView(prog)}/><EmptyDash what="No course completions recorded yet."/></>;
  return (
    <><InterviewActivity interview={interviewProgressView(prog)}/><LearningActivity learning={learningProgressView(prog)}/>
    <div className="grid-3">
      {COURSES.map(c=>{
        const done = map[c.id]||0; const pct = coursePct(c.id, done);
        return (
          <div key={c.id} className="panel" style={{padding:16}}>
            <div className="row between" style={{marginBottom:12}}>
              <span className="badge">{c.tier}</span>
              <span className="mono mute" style={{fontSize:11}}>{c.modules} mod</span>
            </div>
            <div className="mono" style={{fontWeight:700,fontSize:14}}>{c.title}</div>
            <div className="row between" style={{marginTop:16,marginBottom:6}}>
              <span className="mono mute" style={{fontSize:11}}>Progress</span>
              <span className="mono" style={{fontSize:12,fontWeight:600}}>{pct}%</span>
            </div>
            <div style={{height:3,background:'var(--line)'}}><div style={{height:'100%',width:pct+'%',background:'var(--red)'}}></div></div>
          </div>
        );
      })}
    </div>
    </>
  );
}
function DashQuizzes({prog}) {
  const quizzes = prog.quizzes || [];
  if (!quizzes.length) return <EmptyDash what="No quizzes taken yet."/>;
  return (
    <div className="grid-3">
      {quizzes.map((q,i)=>{
        const passed = (q.score||0)>=50;
        return (
        <div key={i} className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:12}}>
            <span className="badge">Quiz</span>
            <span className="mono mute" style={{fontSize:11}}>{new Date((q.created_at||0)*1000).toLocaleDateString()}</span>
          </div>
          <div className="mono" style={{fontWeight:700,fontSize:14,marginBottom:10}}>{q.ref||'Quiz'}</div>
          <div className="row between" style={{marginTop:14}}>
            <span className="mono" style={{fontSize:12,color: passed?'var(--green)':'var(--amber)'}}>{passed?`PASSED · ${q.score}`:`SCORE ${q.score||0}`}</span>
          </div>
        </div>
        );
      })}
    </div>
  );
}
function DashAchievements({prog}) {
  const courses = prog.courses || [];
  const lessonsDone = courses.reduce((s,c)=>s+c.lessons_done,0);
  const quizzesPassed = (prog.quizzes||[]).filter(q=>(q.score||0)>=50).length;
  const exercises = (prog.exercises||[]).length;
  const ach = [
    {n:'First lesson',d:'Opened your first lesson',u:lessonsDone>=1,r:'common'},
    {n:'Getting serious',d:'10 lessons completed',u:lessonsDone>=10,r:'rare'},
    {n:'Quiz taker',d:'Passed your first quiz',u:quizzesPassed>=1,r:'common'},
    {n:'Quiz master',d:'Passed 5 quizzes',u:quizzesPassed>=5,r:'rare'},
    {n:'Practitioner',d:'Solved your first exercise',u:exercises>=1,r:'common'},
    {n:'Hot streak',d:'10 exercises',u:exercises>=10,r:'epic'},
    {n:'Consistent',d:'5 active days',u:(prog.active_days||0)>=5,r:'epic'},
    {n:'Marathon',d:'30 active days',u:(prog.active_days||0)>=30,r:'legendary'},
  ];
  const rcol = {common:'var(--text-2)', rare:'var(--blue)', epic:'var(--magenta)', legendary:'var(--amber)'};
  return (
    <div className="grid-4">
      {ach.map(a=>(
        <div key={a.n} className="panel" style={{padding:18,textAlign:'center', opacity:a.u?1:0.45}}>
          <div style={{width:60,height:60,border:'1px solid '+rcol[a.r],borderRadius:30,display:'grid',placeItems:'center',margin:'0 auto 12px', color:rcol[a.r]}}>
            <Icon name={a.u?'award':'lock'} size={22}/>
          </div>
          <div className="mono" style={{fontWeight:700, fontSize:13}}>{a.n}</div>
          <div className="mute" style={{fontSize:11.5,marginTop:6, lineHeight:1.4}}>{a.d}</div>
          <div className="mono" style={{fontSize:9.5,marginTop:10,letterSpacing:'.14em',textTransform:'uppercase',color:rcol[a.r]}}>{a.r}</div>
        </div>
      ))}
    </div>
  );
}

// ============= PRICING =============
function PricingPage() {
  const [busy,setBusy] = useState(null);
  const [notice,setNotice] = useState(null);
  let auth = null;
  try { auth = useAuth(); } catch { auth = null; }
  const authEmail = auth?.user?.email || null;
  const accessToken = auth?.session?.access_token || null;
  const plans = [
    {name:'Starter', key:'starter', price:9, desc:'Build a vanilla option quote and explain its inputs, Greeks and limits.',
     features:['All Fundamentals courses','Payoff, Monte Carlo, volatility, bond and curve tools','Exercise workspace','Course scripts with LaTeX formulas','Recorded progress + forum access'],
     cta:'Start Starter', highlight:false},
    {name:'Student', key:'student', price:19, desc:'Compare hedges and explain how volatility and rate scenarios change risk.', popular:false,
     features:['Everything in Starter','All Advanced courses','Calibration, binomial and vol-surface tools','Trading Lab + Survival Mode','Browser Python notebook','Verified course references'],
     cta:'Go Student', highlight:true},
    {name:'Professional', key:'pro', price:49, desc:'Explore more complex model assumptions and research workflows.',
     features:['Everything in Student','All Complex courses','Agentic RFQ desk cockpit','Backtest research workspace','Advanced model and risk notes'],
     cta:'Go Pro', highlight:false},
  ];
  async function handleCheckout(planKey, planName){
    setNotice(null); setBusy(planKey);
    try {
      if (!LEGAL_READY || !SOURCE_RIGHTS_CLEARED) {
        setNotice({type:'error', msg:'Sales are disabled until the complete legal notice and written source-rights clearance are configured.'});
        return;
      }
      if (!authEmail) {
        nav(`/auth/signup?plan=${encodeURIComponent(planKey)}&next=checkout`);
        return;
      }
      const s = await startCheckout(planKey, accessToken);
      if (s.mode === 'live' && s.url) { window.location.href = s.url; return; }
      // Backend reachable but Stripe not configured (mock) — be honest.
      setNotice({type:'info', msg:`Checkout is not available for ${planName}. Your account has not been charged.`});
    } catch(e){
      setNotice({type:'error', msg:'Checkout is temporarily unavailable. Your account has not been charged. Please try again later.'});
    } finally { setBusy(null); }
  }
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ pricing</span></>}
        title="Plans"
        sub="Preview the library plans and their learning outcomes. Start with a demonstrable English interview case; purchases remain disabled until the public sale requirements are met."
        right={<span className="badge">{LEGAL_READY && SOURCE_RIGHTS_CLEARED?'Monthly · cancel through support':'PREVIEW · SALES DISABLED'}</span>}
      />
      {notice && (
        <div className="panel" style={{padding:'12px 16px',marginBottom:16,borderColor:notice.type==='error'?'var(--red)':'var(--line-2)',fontSize:13}}>
          <span className="mono" style={{color:notice.type==='error'?'var(--red)':'var(--text)'}}>{notice.type==='error'?'⚠ ':'ℹ '}</span>{notice.msg}
        </div>
      )}
      <div className="catalogue-start"><div><span className="micro">Try the outcome before choosing a plan</span><h2>Pricing &amp; Greeks Interview Lab</h2><p>English cases with a saved attempt, a computed correction, a reasoning self-review and a concept transfer check. Prerequisites: basic option payoffs and percentages. No hiring certification or human feedback is included.</p></div><Link to="/interview" className="btn btn-primary">Try a case <Icon name="arrow-right" size={13}/></Link></div>
      <Link to="/starter-kit" className="panel" style={{display:'flex',alignItems:'center',gap:18,padding:'18px 22px',marginBottom:18,borderColor:'rgba(255,46,69,.35)',background:'linear-gradient(100deg, rgba(255,46,69,.07), transparent 60%)',textDecoration:'none'}}>
        <span className="badge">PREVIEW · NOT YET ON SALE</span>
        <div style={{flex:1}}>
          <div className="mono" style={{fontWeight:700,fontSize:14}}>Market Finance Starter Kit</div>
          <div className="mute" style={{fontSize:12.5,marginTop:3}}>French-language downloadable project with Python and Excel materials. Review the included deliverables and access limits before choosing it.</div>
        </div>
        <span className="btn btn-primary btn-sm" style={{flexShrink:0}}>Review the kit<Icon name="arrow-right" size={13}/></span>
      </Link>
      <div className="grid-3">
        {plans.map(p=>(
          <div key={p.name} className="panel" style={{padding:30, position:'relative', borderColor: p.highlight?'var(--red)':'var(--line)'}}>
            {p.popular && <div style={{position:'absolute',top:-1,right:14,background:'var(--red)',color:'#fff',padding:'4px 10px',fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:'.14em',fontWeight:600}}>GUIDED PRACTICE</div>}
            <div className="mono" style={{fontWeight:700,fontSize:18, color: p.highlight?'var(--red)':'var(--text)'}}>{p.name}</div>
            <div className="mute" style={{fontSize:12.5,marginTop:8,minHeight:36}}>{p.desc}</div>
            <div className="row" style={{gap:6,alignItems:'baseline',marginTop:18}}>
              <span className="mono" style={{fontSize:48,fontWeight:700,lineHeight:1}}>{p.price+'€'}</span>
              <span className="mono mute" style={{fontSize:12}}>/mo</span>
            </div>
            <button type="button" onClick={()=>handleCheckout(p.key, p.name)} disabled={busy===p.key || !LEGAL_READY || !SOURCE_RIGHTS_CLEARED} className={"btn "+(p.highlight?'btn-primary':'btn-outline')} style={{width:'100%',justifyContent:'center',marginTop:24,cursor:busy===p.key?'wait':'pointer',opacity:LEGAL_READY && SOURCE_RIGHTS_CLEARED?1:0.55}}>{busy===p.key?'Redirecting…':LEGAL_READY && SOURCE_RIGHTS_CLEARED?p.cta:'Sales disabled'}</button>
            <ul style={{listStyle:'none',padding:0,marginTop:28}}>
              {p.features.map(f=>(
                <li key={f} className="row" style={{gap:10,padding:'8px 0',borderTop:'1px solid var(--line)'}}>
                  <Icon name="check" size={13} style={{color:'var(--red)'}}/>
                  <span style={{fontSize:13}}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <section className="section">
        <div className="section-eyebrow">// Comparison</div>
        <h2 className="section-title">Feature comparison</h2>
        <div className="panel" style={{marginTop:16,overflowX:'auto'}}>
          <table className="data">
            <thead><tr><th>Feature</th><th className="num">Starter</th><th className="num">Student</th><th className="num">Professional</th></tr></thead>
            <tbody>
              {[
                ['CONTENT ACCESS',null,null,null,true],
                ['Fundamentals courses','All','All','All'],
                ['Advanced courses','—','All','All'],
                ['Complex courses','—','—','All'],
                ['Learner course scripts','✓','✓','✓'],
                ['LaTeX formula rendering','✓','✓','✓'],
                ['LEARNING TOOLS',null,null,null,true],
                ['Black-Scholes Pricer','✓','✓','✓'],
                ['Payoff Visualizer','✓','✓','✓'],
                ['Monte Carlo','✓','✓','✓'],
                ['Exercise workspace','✓','✓','✓'],
                ['Calibration','—','✓','✓'],
                ['Vol Surface','—','✓','✓'],
                ['Binomial Tree','—','✓','✓'],
                ['TRADING TOOLS',null,null,null,true],
                ['Trading Lab','—','✓','✓'],
                ['Backtest engine','—','—','✓'],
                ['Survival Mode','—','✓','✓'],
                ['PROFESSIONAL',null,null,null,true],
                ['Agentic RFQ desk cockpit','—','—','✓'],
                ['Advanced model/risk notes','—','—','✓'],
              ].map((row,i)=>{
                if (row[4]) return <tr key={i} style={{background:'var(--panel-2)'}}><td colSpan="4" className="label" style={{padding:'8px 10px',fontSize:10}}>{row[0]}</td></tr>;
                return <tr key={i}>
                  <td className="symbol">{row[0]}</td>
                  {row.slice(1,4).map((c,j)=><td key={j} className={"num "+(c==='—'?'mute':'')}>{c}</td>)}
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">FAQ</h2>
        <div className="grid-2" style={{marginTop:16}}>
          {[
            ['Can I try the platform first?','Yes. The Black-Scholes calculator and a short Black-Scholes course preview are free, without an account.'],
            ['How do I cancel?','Subscriptions are not enabled in this preview. When checkout is activated, cancellation and refund terms will be shown before payment.'],
            ['Are student discounts available?','No discount is configured in this preview. The displayed prices are indicative until the legal and billing gates are complete.'],
            ['What about teams?','School and training pilots are handled directly through the contact page with a written scope and invoice.'],
          ].map(([q,a])=>(
            <div key={q} className="panel" style={{padding:20}}>
              <div className="mono" style={{fontWeight:700,fontSize:13.5}}>{q}</div>
              <div className="text-2" style={{fontSize:13,marginTop:8,lineHeight:1.6}}>{a}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============= AUTH =============
function AuthPage({route}) {
  const mode = route.parts[1] || 'login';
  if (!['login', 'signup', 'forgot-password', 'reset-password'].includes(mode)) return <NotFoundPage/>;
  return <AuthenticationPage key={mode} mode={mode} brand={<BrandSignature/>}/>;
}

// ============= MISC PAGES =============
function tierFor(rank){ return rank<=3?'Legendary':rank<=8?'Master':rank<=14?'Expert':'Advanced'; }
function LeaderboardPage() {
  const [rows,setRows] = useState(null); // null = loading
  const [err,setErr] = useState(false);
  useEffect(()=>{
    let alive = true;
    platformApi.leaderboard(50).then((data)=>{ if(alive){ setRows(data); } }).catch(()=>{ if(alive){ setErr(true); setRows([]); } });
    return ()=>{ alive=false; };
  },[]);
  const visibleRows = rows || [];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ leaderboard</span></>}
        title="Leaderboard"
        sub="Identity-bound activity board · fixed points per distinct learning event, not a skill or performance ranking."
      />
      {rows===null && <div className="panel mute" style={{padding:24}}>Loading leaderboard…</div>}
      {rows!==null && visibleRows.length===0 && (
        <div className="panel" style={{padding:28, textAlign:'center'}}>
          <div className="mono" style={{fontWeight:600,fontSize:15}}>No scores yet.</div>
          <div className="mute" style={{fontSize:13,marginTop:8}}>
            {err ? 'The activity board could not be loaded. Please try again later; your progress has not been changed.'
                 : 'This board contains eligible public activity records. Your written exercise attempts and unranked Survival practice stay in your private dashboard; they do not automatically publish a leaderboard score.'}
          </div>
        </div>
      )}
      {visibleRows.length>0 && <>
      <div className="grid-3" style={{marginBottom:18}}>
        {visibleRows.slice(0,3).map((r,i)=>(
          <div key={r.user_id||r.username} className="panel" style={{padding:24, textAlign:'center', borderColor: i===0?'var(--amber)':'var(--line)'}}>
            <div className="mono mute" style={{fontSize:11,letterSpacing:'.14em'}}>#{r.rank}</div>
            <div style={{width:60,height:60,border:'1px solid '+(i===0?'var(--amber)':'var(--line-2)'),borderRadius:30,display:'grid',placeItems:'center',margin:'14px auto',color:i===0?'var(--amber)':'var(--text-2)'}}>
              <Icon name={i===0?'crown':'medal'} size={24}/>
            </div>
            <div className="mono" style={{fontWeight:700,fontSize:16}}>@{r.username}</div>
            <div className="mono mute" style={{fontSize:11,marginTop:4}}>{tierFor(r.rank)} · {r.events} activities</div>
            <div className="mono red" style={{fontSize:24,fontWeight:700,marginTop:14}}>{Number(r.points).toLocaleString()}</div>
            <div className="mono mute" style={{fontSize:10.5,marginTop:4}}>points</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <table className="data">
          <thead><tr><th>#</th><th>Player</th><th>Tier</th><th className="num">Activities</th><th className="num">Points</th></tr></thead>
          <tbody>
            {visibleRows.map((r)=>(
              <tr key={r.user_id||r.username}>
                <td className="symbol">#{r.rank}</td>
                <td>@{r.username}</td>
                <td>{tierFor(r.rank)}</td>
                <td className="num">{r.events}</td>
                <td className="num">{Number(r.points).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
    </div>
  );
}

function NotebooksPage() {
  return <React.Suspense fallback={<div className="container page"><h1 className="page-title">Notebooks</h1><p role="status">Loading Python labs…</p></div>}><NotebookWorkspace/></React.Suspense>;
}

function MentoringPage() {
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ mentoring</span></>}
        title="Mentoring"
        sub="A supervised mentoring pilot for pricing, code review and quant-career questions."
        right={<span className="badge">Pilot · not on sale</span>}
      />
      <div className="grid-4">
        {[
          {t:'Apply', d:'Describe the pricing or career problem you want to solve.', ic:'users'},
          {t:'Qualification', d:'We confirm whether a suitable reviewer is available.', ic:'circle-check'},
          {t:'Safe brief', d:'Share only material you are authorised to disclose.', ic:'paperclip'},
          {t:'Pilot session', d:'Scope, price and deliverables are confirmed in writing first.', ic:'video'},
        ].map(s=>(
          <div key={s.t} className="panel" style={{padding:18}}>
            <Icon name={s.ic} size={18} style={{color:'var(--red)'}}/>
            <div className="mono" style={{fontWeight:700,marginTop:14}}>{s.t}</div>
            <div className="mute" style={{fontSize:12,marginTop:8}}>{s.d}</div>
          </div>
        ))}
      </div>
      <section className="section">
        <h2 className="section-title">Available mentors</h2>
        <div className="grid-2" style={{marginTop:14}}>
          <div className="panel" style={{padding:24}}><div className="mono" style={{fontWeight:700}}>No mentor is publicly listed yet.</div><p className="text-2" style={{fontSize:13}}>Profiles will only be shown after identity, experience and availability have been verified. The pilot is not bookable or payable online.</p><SupportLink subject="Mentoring pilot application" className="btn btn-outline btn-sm">Ask about the pilot</SupportLink><Link to="/interview" className="btn btn-primary btn-sm" style={{marginLeft:8}}>Practise without a mentor</Link></div>
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">Commercial status</h2>
        <div className="grid-3" style={{marginTop:14}}>
          <div className="panel" style={{padding:24}}><div className="mono" style={{fontWeight:700}}>Packages are not on sale.</div><p className="text-2" style={{fontSize:13,marginBottom:0}}>Prices, cancellation terms and mentor identities will be published together when the service passes its pilot gate.</p></div>
        </div>
      </section>
    </div>
  );
}

function JobsPage() {
  let authEmail = null; try { authEmail = useAuth()?.user?.email || null; } catch { authEmail = null; }
  const [tab,setTab] = useState('all');
  const [query,setQuery] = useState('');
  const [jobs,setJobs] = useState(null);
  const [loadError,setLoadError] = useState(false);
  const [applied,setApplied] = useState({});
  const refetch = useCallback(()=>{ setLoadError(false); platformApi.listJobs().then(setJobs).catch(()=>setLoadError(true)); },[]);
  useEffect(()=>{ refetch(); },[refetch]);
  const apply = async (j) => {
    if (!authEmail) { nav('/auth/login?next=jobs'); return; }
    try {
      await platformApi.applyJob(j.id, { note:'Applied via platform' });
      setApplied((p)=>({...p,[j.id]:true}));
      notify(`Application sent for ${j.title}.`);
    } catch (e) { notify(`Could not apply (${e.message}).`, 'error'); }
  };
  const list = jobs || [];
  const filtered = list.filter(j => {
    const inTab = tab==='all' || (tab==='remote' && /remote/i.test(j.location||'')) || (tab==='intern' && /intern/i.test(j.kind||''));
    const haystack = `${j.company} ${j.title} ${j.location} ${j.kind} ${(j.tags||[]).join(' ')}`.toLowerCase();
    return inTab && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  });
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ jobs</span></>}
        title="Quant Jobs"
        sub="Verified links imported from configured sources or reviewed by the operator. Always confirm details on the employer site."
        right={<>
          <input aria-label="Search job openings" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Role or keyword…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
          <SupportLink subject="Verified job submission"><Icon name="mail" size={13}/> Submit a role</SupportLink>
        </>}
      />
      <div className="tabs-bar">
        {[['all','All'],['remote','Remote'],['intern','Internship']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l} <span className="mute" style={{marginLeft:6}}>{k==='all'?list.length:list.filter(j=>(k==='remote'&&/remote/i.test(j.location||''))||(k==='intern'&&/intern/i.test(j.kind||''))).length}</span></button>
        ))}
      </div>
      <div className="panel">
        {loadError && <ServiceUnavailable title="Openings could not be loaded" onRetry={refetch}/>}
        {jobs===null && !loadError && <div className="mute" style={{padding:20}} role="status">Loading jobs…</div>}
        {jobs!==null && list.length===0 && <div className="service-state"><h2>No verified openings are currently published</h2><p>Keep preparing your option quote, hedge explanation and risk memo.</p><Link to="/interview" className="btn btn-outline">Practise an interview case</Link></div>}
        {!loadError && list.length>0 && filtered.length===0 && <div className="service-state"><h2>No openings match your search</h2><button className="btn btn-outline" onClick={()=>{setQuery('');setTab('all');}}>Clear filters</button></div>}
        {list.length>0 && <table className="data">
          <thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Type</th><th></th></tr></thead>
          <tbody>
            {filtered.map((j)=>(
              <tr key={j.id}>
                <td className="symbol">{j.company}{j.source && <span className="mute" style={{marginLeft:8,fontSize:10,textTransform:'uppercase',letterSpacing:'.08em'}}>· {j.source==='apify_linkedin'?'linkedin':j.source}</span>}</td>
                <td>{j.title} {(j.tags||[]).slice(0,1).map(t=><span key={t} className="badge" style={{marginLeft:8}}>{t}</span>)}</td>
                <td>{j.location||(j.remote?'Remote':'—')}</td>
                <td>{j.kind||'—'}</td>
                <td>{j.url
                  ? <a className="btn btn-outline btn-sm" href={j.url} target="_blank" rel="noopener noreferrer">View role ↗</a>
                  : <button className="btn btn-outline btn-sm" disabled={applied[j.id]} onClick={()=>apply(j)}>{applied[j.id]?'Applied ✓':'Apply'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  );
}

function BugReportPage() {
  let reporter = null; try { reporter = useAuth()?.user?.email || null; } catch { reporter = null; }
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [f, setF] = useState({ kind:'Calculator', severity:'Low', summary:'', steps:'', expected:'', actual:'' });
  const set = (k)=>(e)=>setF((prev)=>({...prev,[k]:e.target.value}));
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!f.summary.trim()) { setError('Please give the bug a short title.'); return; }
    setBusy(true);
    try {
      const detail = [
        f.steps && `Steps to reproduce:\n${f.steps}`,
        f.expected && `Expected:\n${f.expected}`,
        f.actual && `Actual:\n${f.actual}`,
      ].filter(Boolean).join('\n\n');
      await platformApi.reportBug({ summary:f.summary.trim(), kind:f.kind, severity:f.severity, detail, reporter });
      setSent(true);
      notify('Bug report submitted. Thank you.');
    } catch (e) {
      setError(`Could not submit (${e.message}). Is the platform backend running?`);
    } finally { setBusy(false); }
  };
  if (sent) return (
    <div className="container page" style={{maxWidth:680}}>
      <PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ report a bug</span></>} title="Report a bug" sub="Help us harden the platform."/>
      <div className="panel" style={{padding:32, textAlign:'center'}}>
        <Icon name="check-circle" size={28}/>
        <div className="mono" style={{fontWeight:700,fontSize:16,marginTop:10}}>Report received.</div>
        <div className="mute" style={{fontSize:13,marginTop:8}}>It is stored in the platform database. Thank you for making the desk sharper.</div>
        <button className="btn btn-outline" style={{marginTop:18}} onClick={()=>{ setSent(false); setF({kind:'Calculator',severity:'Low',summary:'',steps:'',expected:'',actual:''}); }}>Report another</button>
      </div>
    </div>
  );
  return (
    <div className="container page" style={{maxWidth:680}}>
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ report a bug</span></>}
        title="Report a bug"
        sub="Help us harden the platform."
      />
      <div className="panel" style={{padding:32}}>
        <form className="col" style={{gap:16}} onSubmit={submit}>
          {error && <FormNotice type="error">{error}</FormNotice>}
          <div className="field">
            <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Category</span>
            <select aria-label="Bug category" value={f.kind} onChange={set('kind')}>{['Calculator','Lesson','UI','Account','Other'].map(o=><option key={o}>{o}</option>)}</select>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Priority</span>
            <select aria-label="Bug severity" value={f.severity} onChange={set('severity')}>{['Low','Medium','High','Critical'].map(o=><option key={o}>{o}</option>)}</select>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Title</span>
            <input aria-label="Bug summary" value={f.summary} onChange={set('summary')} placeholder="Short summary of the bug"/>
          </div>
          {[['Steps to reproduce','steps'],['Expected behaviour','expected'],['Actual behaviour','actual']].map(([l,k])=>(
            <div key={k} className="field">
              <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>{l}</span>
              <textarea aria-label={l} rows={3} value={f[k]} onChange={set(k)}></textarea>
            </div>
          ))}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{width:'100%',justifyContent:'center',marginTop:8,opacity:busy?0.7:1}}>{busy?'Submitting…':'Submit report'} <Icon name="send" size={13}/></button>
        </form>
      </div>
    </div>
  );
}

function ApiDocsPage() {
  const [endpoint, setEndpoint] = useState('/calculate/practice');
  const endpoints = [
    {p:'POST',u:'/calculate/practice',d:'Build a deterministic calculation pack from an explicit prompt'},
    {p:'GET',u:'/health',d:'Service health and configured runtime mode'},
    {p:'GET',u:'/ready',d:'Production readiness probe'},
  ];
  const activeEndpoint = endpoints.find((item)=>item.u===endpoint) || endpoints[0];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ api</span></>}
        title="Backend API · private preview"
        sub="Implemented endpoints only. This preview is not included in paid plans; public API keys are not on sale."
        right={<SupportLink subject="Private API preview">Request private preview</SupportLink>}
      />
      <div className="workspace-sidebar-left">
        <div className="panel">
          <div className="label" style={{padding:'14px 14px 10px'}}>Endpoints</div>
          {endpoints.map((e)=>(
            <button key={e.u} onClick={()=>setEndpoint(e.u)} style={{display:'block',width:'100%',textAlign:'left',padding:'10px 14px',borderTop:'1px solid var(--line)', cursor:'pointer',background:e.u===endpoint?'rgba(255,46,69,.06)':'transparent',borderLeft:e.u===endpoint?'2px solid var(--red)':'2px solid transparent'}}>
              <div className="row" style={{gap:8}}>
                <span className={"badge "+(e.p==='GET'?'badge-blue':'badge-green')} style={{fontSize:9}}>{e.p}</span>
                <span className="mono" style={{fontSize:11.5,fontWeight:600}}>{e.u.split('/').slice(-2).join('/')}</span>
              </div>
              <div className="mute" style={{fontSize:11,marginTop:4}}>{e.d}</div>
            </button>
          ))}
        </div>
        <div className="col" style={{gap:14}}>
          <div className="panel" style={{padding:24}}>
            <div className="row" style={{gap:10,marginBottom:14}}>
              <span className={"badge "+(activeEndpoint.p==='GET'?'badge-blue':'badge-green')}>{activeEndpoint.p}</span>
              <span className="mono" style={{fontWeight:700,fontSize:16}}>{activeEndpoint.u}</span>
            </div>
            <p className="text-2" style={{fontSize:13,marginTop:0}}>{activeEndpoint.d}. Production generation endpoints require server-authorised access.</p>
            <div className="label" style={{margin:'18px 0 8px'}}>{activeEndpoint.p === 'GET' ? 'Query parameters' : 'Request body'}</div>
            <table className="data">
              <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
              <tbody>
                {(activeEndpoint.p==='POST' ? [
                  ['prompt','string','yes','Explicit calculation request with inputs and units'],
                  ['family_hint','string','no','auto, options, rates, credit, risk or portfolio'],
                ] : []).map(r=><tr key={r[0]}><td className="symbol">{r[0]}</td><td>{r[1]}</td><td className={r[2]==='yes'?'red':'mute'}>{r[2]}</td><td>{r[3]}</td></tr>)}
                {activeEndpoint.p==='GET' && <tr><td colSpan="4" className="mute">No request body.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="grid-2">
            <div className="panel" style={{padding:18}}>
              <div className="label" style={{marginBottom:10}}>cURL</div>
              <pre className="code" tabIndex={0} aria-label="API request example"><code>{activeEndpoint.p==='POST' ? `curl "$VITE_TPL_RAG_API_URL/calculate/practice" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TPL_TOKEN" \\
  --data '{"prompt":"Price a call with S=100 K=100 r=2% sigma=20% T=0.5y","family_hint":"options"}'` : `curl "$VITE_TPL_RAG_API_URL${activeEndpoint.u}"`}</code></pre>
            </div>
            <div className="panel" style={{padding:18}}>
              <div className="label" style={{marginBottom:10}}>Response shape</div>
              <pre className="code" tabIndex={0} aria-label="API response example"><code>{activeEndpoint.p==='POST' ? `{
  "family": "options",
  "title": "...",
  "markdown": "...",
  "pack": { "inputs": {}, "steps": [], "checks": [] }
}` : `{ "status": "ok" }`}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  let auth=null; try { auth=useAuth(); } catch { auth=null; }
  const isAdmin = (()=>{ try { return typeof auth?.isAdmin==='function' ? auth.isAdmin() : false; } catch { return false; } })();
  const [counts,setCounts] = useState(null);
  const [countsError,setCountsError] = useState('');
  useEffect(()=>{ if(isAdmin) { setCountsError(''); platformApi.adminCounts().then((d)=>setCounts(d?.counts||{})).catch((error)=>{setCounts(null);setCountsError(error.message||'Admin counts unavailable.');}); } },[isAdmin]);
  if (!auth?.isAuthenticated) return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ admin</span></>} title="Admin" sub="Restricted area."/>
      <div className="panel" style={{padding:28,textAlign:'center'}}><Icon name="lock" size={24}/><div className="mono" style={{fontWeight:600,marginTop:10}}>Sign in required.</div><Link to="/auth/login" className="btn btn-primary" style={{marginTop:16}}>Log in</Link></div></div>
  );
  if (!isAdmin) return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ admin</span></>} title="Admin" sub="Restricted area."/>
      <div className="panel" style={{padding:28,textAlign:'center'}}><Icon name="lock" size={24}/><div className="mono" style={{fontWeight:600,marginTop:10}}>Access denied.</div><div className="mute" style={{fontSize:13,marginTop:8}}>This area requires a signed admin role in the authenticated session.</div></div></div>
  );
  const c = counts || {};
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ admin</span></>}
        title={<>Admin Dashboard <span className="badge badge-red" style={{marginLeft:12,fontSize:9}}>RESTRICTED</span></>}
        sub="Platform operations · live counts from the platform database."
      />
      <InterviewPilotMetrics/>
      {countsError && <div className="panel" role="alert" style={{padding:14,marginBottom:16,borderColor:'var(--red)',color:'var(--red)'}}>{countsError}</div>}
      <div className="grid-4">
        {[
          {l:'Forum threads',v:c.threads},
          {l:'Comments',v:c.comments},
          {l:'Jobs',v:c.jobs},
          {l:'Applications',v:c.applications},
          {l:'Bug reports',v:c.bug_reports, c:'var(--amber)'},
          {l:'Subscribers',v:c.subscribers, c:'var(--green)'},
          {l:'Blog posts',v:c.blog_posts},
          {l:'Progress events',v:c.progress_events},
        ].map(s=><Stat key={s.l} label={s.l} value={counts===null?'…':String(s.v ?? 0)} accent={s.c||''}/>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:18}}>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Recent signups</div>
          </div>
          <table className="data">
            <thead><tr><th>User</th><th>Plan</th><th>Country</th><th>Joined</th></tr></thead>
            <tbody>
              {[].map(r=>{
                const [n,p,c,t] = r.split('|');
                return <tr key={n}><td className="symbol">{n}</td><td><TierBadge tier={p.toLowerCase()}/></td><td>{c}</td><td>{t} ago</td></tr>;
              })}
              <tr><td colSpan="4" className="mute">No signup feed is connected to this dashboard.</td></tr>
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Content moderation queue</div>
            <span className="badge">Not connected</span>
          </div>
          <table className="data">
            <thead><tr><th>Item</th><th>Type</th><th>Reporter</th><th></th></tr></thead>
            <tbody>
              <tr><td colSpan="4" className="mute">No moderation queue is connected to this dashboard.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BillingResultPage({status}) {
  const auth = useAuth();
  const [sync,setSync] = useState(status==='success'?'syncing':'cancelled');
  const [plan,setPlan] = useState(null);
  useEffect(()=>{
    if (status!=='success') return undefined;
    let active=true;
    const token=auth?.session?.access_token;
    const poll=async()=>{
      if(!token){ if(active)setSync('signin'); return; }
      for(let attempt=0;attempt<4 && active;attempt+=1){
        const entitlement=await getEntitlement(token);
        if(entitlement?.active && entitlement?.plan){
          setPlan(String(entitlement.plan)); setSync('active');
          await auth.refreshEntitlement(); return;
        }
        await new Promise((resolve)=>window.setTimeout(resolve,1500));
      }
      if(active)setSync('pending');
    };
    void poll();
    return()=>{active=false;};
  },[status,auth?.session?.access_token,auth?.refreshEntitlement]);
  const message = status==='cancel'
    ? 'Checkout was cancelled. No paid access was granted.'
    : sync==='active'
      ? `${PLAN_LABEL[plan]||plan} access is active.`
      : sync==='pending'
        ? 'Payment returned successfully, but the signed webhook has not activated access yet. Refresh shortly or contact support with the Stripe receipt.'
        : sync==='signin'
          ? 'Sign in to synchronise the subscription attached to your account.'
          : 'Confirming the signed Stripe webhook and synchronising access…';
  return (
    <div className="container page"><PageHead crumb={<><Link to="/pricing">/ pricing</Link><i>›</i><span>/ billing</span></>} title={status==='cancel'?'Checkout cancelled':'Subscription status'} sub="Access is granted only from a server-verified billing event."/>
      <div className="panel" style={{padding:32,maxWidth:760}}><FormNotice type={sync==='active'?'success':status==='cancel'||sync==='pending'?'error':'info'}>{message}</FormNotice><div className="row" style={{gap:10,marginTop:20}}><Link className="btn btn-primary" to={sync==='active'?'/dashboard':'/pricing'}>{sync==='active'?'Open dashboard':'Back to plans'}</Link><Link className="btn btn-outline" to="/contact">Contact support</Link></div></div>
    </div>
  );
}

const LEGAL_COPY = {
  terms: {
    title:'Terms of service',
    intro:'Rules for using The Pricing Library courses, calculators, simulations and community.',
    sections:[
      ['Educational scope','The platform provides education and research tooling. It does not provide investment, legal or tax advice, execution services, or any promise of performance.'],
      ['Accounts and access','You must provide accurate account details, keep credentials confidential and use only the access level confirmed by our billing system. Paid access begins only after payment confirmation.'],
      ['Subscriptions','When subscriptions are activated, Stripe presents the monthly price, taxes, renewal, cancellation and effective end date before payment. Checkout is disabled until the required legal and billing configuration is complete.'],
      ['Contract formation and payment','The order summary and Stripe checkout identify the selected plan, total price, billing interval and payment method before confirmation. The contract is formed only when payment is accepted and the signed billing event activates access.'],
      ['Cancellation and withdrawal','Use the “Cancel contract” page for electronic cancellation. The separate refund policy states our 14-day first-purchase refund promise; mandatory consumer rights remain unaffected.'],
      ['Acceptable use','Do not upload confidential or unlawfully obtained data, bypass access controls, scrape protected content, disrupt the service, or publish deceptive performance claims.'],
      ['Intellectual property','The platform and its original course material are licensed for personal learning. Source books and papers remain the property of their respective rights holders.'],
      ['Availability and liability','Preview features may change. We use reasonable care but do not guarantee uninterrupted availability or fitness for trading decisions. Nothing excludes rights that cannot legally be excluded.'],
      ['Complaints and disputes',`Contact ${LEGAL_SUPPORT_CONTACT} first. If the complaint is unresolved, eligible consumers may contact the mediator identified in the legal notice. Mandatory consumer protections and competent-law rules remain unaffected.`],
    ],
  },
  privacy: {
    title:'Privacy policy',
    intro:'How account, billing, learning and support data are handled.',
    sections:[
      ['Data collected','Account identity, authentication identifiers, subscription status, learning progress, community contributions, support messages and necessary technical logs. Card details are handled by Stripe and are not stored by this frontend.'],
      ['Purposes','Provide and secure the service, confirm entitlements, persist requested progress, answer support, prevent abuse and meet accounting obligations.'],
      ['Legal bases','Account and subscription processing is necessary to perform the contract; security and abuse prevention rely on legitimate interests; accounting retention follows legal obligations; optional newsletters rely on consent.'],
      ['Processors and transfers','Supabase is used for authentication and application data; Stripe is used for payment. Their applicable processing locations and safeguards are described in their own notices.'],
      ['Retention','Data is kept only as long as needed for the stated purposes, security, disputes and legal obligations. Newsletter consent can be withdrawn at any time.'],
      ['Your choices','Request access, correction, deletion or export by emailing support. Some billing records may have to be retained by law.'],
      ['Cookies','The application uses essential authentication and security storage. Non-essential analytics or advertising cookies must not be enabled without a separate consent choice.'],
    ],
  },
  refund: {
    title:'Cancellation and refund policy',
    intro:'Cancellation and refund terms for digital subscriptions.',
    sections:[
      ['Cancel','Ask support to cancel at any time. Access continues until the end of the paid billing period unless a refund is granted.'],
      ['14-day refund promise','For a first subscription purchase, we offer a refund when the request reaches support within 14 calendar days of payment. Refunds return to the original payment method.'],
      ['Service incidents','If a material paid feature is unavailable for an extended period, contact support with the account email and incident details so we can assess a refund or credit.'],
      ['How to request','Email support from the account address with the Stripe receipt reference. We acknowledge requests and communicate the outcome in writing.'],
    ],
  },
};

function LegalPage({kind='legal'}) {
  if (kind==='cancel') return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ cancel</span></>} title="Cancel your contract" sub="Electronic subscription cancellation for an active plan."/>
      <div className="panel" style={{padding:28,maxWidth:760}}><p className="text-2" style={{fontSize:13.5,lineHeight:1.7}}>Send the request from the email attached to your account. State “Cancel my contract” and the subscription plan. We confirm the effective end date in writing; paid access normally continues until the end of the billing period.</p>{LEGAL_IDENTITY.email ? <a className="btn btn-primary" href={`mailto:${LEGAL_IDENTITY.email}?subject=Cancel%20my%20contract`}>Cancel my contract</a> : <FormNotice type="error">Cancellation contact is not configured yet; paid checkout remains disabled.</FormNotice>}</div>
    </div>
  );
  if (kind==='contact') return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ contact</span></>} title="Contact & support" sub="Account, billing, privacy and product support."/>
      <div className="panel" style={{padding:28,maxWidth:760}}>{LEGAL_IDENTITY.email ? <><div className="label">Support email</div><a className="mono red" href={`mailto:${LEGAL_IDENTITY.email}`} style={{display:'inline-block',marginTop:10}}>{LEGAL_IDENTITY.email}</a><p className="text-2" style={{fontSize:13,lineHeight:1.7}}>Include the email attached to your account and a concise description. Never send passwords, API secrets, card details or confidential market data.</p><div className="mute" style={{fontSize:12}}>Support target: acknowledgement within two business days. This is a service target, not a guaranteed response time.</div></> : <FormNotice type="error">Support contact is not configured. Paid checkout remains disabled until the legal and support identity is complete.</FormNotice>}</div>
    </div>
  );
  if (kind==='legal') return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ legal</span></>} title="Legal notice" sub="Operator and publication information."/>
      <div className="panel" style={{padding:28,maxWidth:820}}>{LEGAL_READY ? <div className="col" style={{gap:12}}><div><span className="label">Operator</span><div className="mono" style={{marginTop:6}}>{LEGAL_IDENTITY.name} · {LEGAL_IDENTITY.formCapital}</div></div><div><span className="label">Registered address</span><div style={{marginTop:6}}>{LEGAL_IDENTITY.address}</div></div><div><span className="label">Registration and VAT</span><div style={{marginTop:6}}>{LEGAL_IDENTITY.registration} · {LEGAL_IDENTITY.vat}</div></div><div><span className="label">Publication director</span><div style={{marginTop:6}}>{LEGAL_IDENTITY.publisher}</div></div><div><span className="label">Hosting provider</span><div style={{marginTop:6}}>{LEGAL_IDENTITY.host}</div></div><div><span className="label">Consumer mediator</span><div style={{marginTop:6}}>{LEGAL_IDENTITY.mediator}</div></div><div><span className="label">Contact</span><div style={{marginTop:6}}>{LEGAL_IDENTITY.email} · {LEGAL_IDENTITY.phone}</div></div></div> : <FormNotice type="error">Paid checkout is intentionally disabled: the complete operator, hosting, publication and consumer-mediation notice is not configured.</FormNotice>}</div>
    </div>
  );
  const page = LEGAL_COPY[kind] || LEGAL_COPY.terms;
  return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ {kind}</span></>} title={page.title} sub={page.intro}/>
      <div className="col" style={{gap:14,maxWidth:900}}>{page.sections.map(([title,body])=><section className="panel" style={{padding:24}} key={title}><h2 className="mono" style={{fontSize:16,marginTop:0}}>{title}</h2><p className="text-2" style={{fontSize:13.5,lineHeight:1.75,marginBottom:0}}>{body}</p></section>)}<div className="mute" style={{fontSize:11}}>Version: 19 July 2026 · Contact {LEGAL_IDENTITY.email || 'to be published before sales open'}</div></div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="container page">
      <div className="panel" style={{padding:60,textAlign:'center',marginTop:24}}>
        <div className="mono" style={{fontSize:120,fontWeight:700,color:'var(--red)',lineHeight:1}}>404</div>
        <h1 className="mono mute" style={{fontSize:20,letterSpacing:'.1em',marginTop:14,textTransform:'uppercase'}}>Page not found</h1>
        <p className="text-2" style={{maxWidth:'48ch',margin:'24px auto',fontSize:13.5}}>
          The page you are looking for has expired, moved, or never existed.
          If you arrived here from a link inside the platform, please report it.
        </p>
        <div className="row" style={{gap:10,justifyContent:'center'}}>
          <Link to="/" className="btn btn-primary">Back to Home <Icon name="arrow-right" size={13}/></Link>
          <Link to="/bug" className="btn btn-outline">Report broken link</Link>
        </div>
      </div>
    </div>
  );
}

function PracticePage() {
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ practice</span></>}
        title="Practice Hub"
        sub="Start with the guided English interview path, then use the library and calculators for targeted practice."
      />
      <div className="grid-3">
        {[
          {t:'Pricing & Greeks Interview Lab',d:'Submit a numerical answer and reasoning, review the correction and test a new concept variant.',ic:'target',to:'/interview',n:'English · guided practice'},
          {t:'Exercises',d:'Source-backed worked cases with calculated solutions. These library cases use self-review.',ic:'code',to:'/exercises',n:'Practice generator'},
          {t:'Course review',d:'Review the questions and worked corrections in your course.',ic:'help-circle',to:'/courses',n:'inside each course'},
          {t:'Survival Mode',d:'Pressure-tested questions. Timer running.',ic:'zap',to:'/survival',n:'1 Core wave · 20 questions'},
          {t:'Practice Challenge',d:'A worked desk problem to practise on.',ic:'trophy',to:'/challenge',n:'preview'},
          {t:'Activity board',d:'Recorded learning activity from platform accounts.',ic:'crown',to:'/leaderboard',n:'recorded activity'},
          {t:'Community discussion',d:'Discuss pricing and risk questions with other learners.',ic:'users',to:'/community',n:'via community'},
        ].map(s=>(
          <Link to={s.to} key={s.t} className="panel" style={{padding:24, display:'block'}}>
            <Icon name={s.ic} size={22} style={{color:'var(--red)'}}/>
            <div className="mono" style={{fontWeight:700,fontSize:16,marginTop:18}}>{s.t}</div>
            <div className="mute" style={{fontSize:12.5,marginTop:8,lineHeight:1.55}}>{s.d}</div>
            <div className="row between" style={{marginTop:20, paddingTop:14, borderTop:'1px solid var(--line)'}}>
              <span className="mono mute" style={{fontSize:11}}>{s.n}</span>
              <span className="mono" style={{fontSize:11,color:'var(--red)'}}>open ›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ChallengePage() {
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/practice">practice</Link><i>›</i><span>weekly challenge</span></>}
        title="Practice Challenge"
        sub="A worked desk problem to practise on. Ranked submissions are not enabled in this preview."
        right={<><span className="badge">Preview</span></>}
      />
      <div className="workspace-with-aside">
        <div className="panel" style={{padding:32}}>
          <div className="mono" style={{fontSize:11, color:'var(--mute)', letterSpacing:'.14em',marginBottom:18}}>SELF-STUDY CASE · HYPOTHETICAL INPUTS</div>
          <h2 className="mono" style={{fontSize:24,fontWeight:700, margin:'0 0 14px'}}>Price a Down-and-Out Call</h2>
          <p className="text-2" style={{fontSize:14,lineHeight:1.7}}>
            Compute the closed-form value of a down-and-out call on a non-dividend underlying under continuous monitoring with zero rebate,
            then verify with 100,000 conditional Monte Carlo draws using antithetic normals and Brownian-bridge survival probabilities.
          </p>
          <div className="label" style={{margin:'24px 0 10px'}}>Parameters</div>
          <table className="data">
            <tbody>
              <tr><td className="symbol">Spot S</td><td className="num">100</td></tr>
              <tr><td className="symbol">Strike K</td><td className="num">100</td></tr>
              <tr><td className="symbol">Barrier H</td><td className="num">85</td></tr>
              <tr><td className="symbol">Rate r</td><td className="num">2%</td></tr>
              <tr><td className="symbol">Vol σ</td><td className="num">20%</td></tr>
              <tr><td className="symbol">Maturity T</td><td className="num">6m</td></tr>
            </tbody>
          </table>
          <div className="label" style={{margin:'24px 0 10px'}}>Deliverables</div>
          <ul style={{fontSize:13.5,lineHeight:1.8, color:'var(--text-2)', paddingLeft:18,margin:0}}>
            <li>Notebook with closed-form value</li>
            <li>MC verification (100k terminal draws, antithetic Brownian-bridge conditioning)</li>
            <li>Standard error and 95% CI</li>
            <li>One-paragraph commentary on convergence</li>
          </ul>
        </div>
        <div className="col" style={{gap:14, alignSelf:'start'}}>
          <div className="panel" style={{padding:18}}>
            <div className="label" style={{marginBottom:14}}>Preview status</div>
            <div className="col" style={{gap:8}}>
              {[['Submissions','Not open'],['Ranking','Not published']].map(([k,v])=>(
                <div key={k} className="row between" style={{padding:'4px 0'}}>
                  <span className="mono mute" style={{fontSize:11}}>{k}</span>
                  <span className="mono" style={{fontSize:12.5,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/notebooks?lab=barrier-down-out" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>Open notebook <Icon name="arrow-right" size={13}/></Link>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CommunityPage, BlogPage, DashboardPage, PricingPage, AuthPage, LeaderboardPage,
  NotebooksPage, MentoringPage, JobsPage, BugReportPage, ApiDocsPage, AdminPage, NotFoundPage,
  PracticePage, ChallengePage, LegalPage,
  BillingResultPage,
});


// ===== src\app.jsx =====
// ======================= AGENTIC TRADING ROOM (app shell) ===================
// Standalone full-screen "desk cockpit" (intended for app.tradinglibrary.com).
// Faithful to the product mockup; numbers come from real pricers, not the LLM.
const AGR = {
  bg:'#070A0F', panel:'#0C1118', panel2:'#0A0F15', line:'#171F2B', line2:'#222C3A',
  red:'#F23645', redDim:'#7d1f29', green:'#2FBF71', greenDim:'#165236',
  text:'#E6EAF1', mute:'#6F7B8C', dim:'#47525f', amber:'#E8B339', blue:'#4C7DFF',
};
const agrMono = "'JetBrains Mono','SF Mono',monospace";

function AgentSVG({type, color}) {
  const s = { width:26, height:26, fill:'none', stroke:color, strokeWidth:1.6, strokeLinecap:'round', strokeLinejoin:'round' };
  const p = {
    sales:<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></>,
    structurer:<><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="9" y="14" width="6" height="6" rx="1"/><path d="M7 10v2h10v-2M12 12v2"/></>,
    data:<><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/></>,
    quant:<><path d="M17 5H7l5 7-5 7h10"/></>,
    pricing:<><path d="M4 19V5M4 19h16"/><path d="M7 16l3-4 3 2 4-7"/></>,
    trader:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></>,
    risk:<><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9.5 12l1.8 1.8 3.2-3.6"/></>,
    report:<><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 15h6M9.5 9h3"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{p[type]}</svg>;
}

function AgentRoomTopNav() {
  const items = ['DASHBOARD','MARKETS','PRODUCTS','LEARNING','TOOLS','AGENT ROOM'];
  const [active] = useState('DASHBOARD');
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:64,padding:'0 26px',borderBottom:`1px solid ${AGR.line}`,background:AGR.bg}}>
      <div style={{display:'flex',alignItems:'center',gap:48}}>
        <Link to="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <span style={{width:10,height:10,background:AGR.red,display:'inline-block'}}></span>
          <span style={{fontFamily:agrMono,fontWeight:800,fontSize:13,letterSpacing:'.04em',color:AGR.text,lineHeight:1.05}}>THE PRICING<br/>LIBRARY</span>
        </Link>
        <div style={{display:'flex',gap:30}}>
          {items.map(it=>(
            <span key={it} style={{fontFamily:agrMono,fontSize:12,letterSpacing:'.06em',fontWeight:600,color:it===active?AGR.red:AGR.mute,cursor:'pointer',position:'relative',paddingBottom:22,paddingTop:22}}>
              {it}{it===active && <span style={{position:'absolute',left:0,right:0,bottom:0,height:2,background:AGR.red}}></span>}
            </span>
          ))}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:20}}>
        <Icon name="search" size={16} style={{color:AGR.mute}}/>
        <span style={{position:'relative'}}><Icon name="bell" size={16} style={{color:AGR.mute}}/><span style={{position:'absolute',top:-2,right:-2,width:6,height:6,borderRadius:3,background:AGR.red}}></span></span>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{width:30,height:30,borderRadius:4,border:`1px solid ${AGR.line2}`,display:'grid',placeItems:'center',color:AGR.mute}}><Icon name="user" size={15}/></span>
          <div style={{lineHeight:1.2}}><div style={{fontFamily:agrMono,fontSize:12,fontWeight:600,color:AGR.text}}>Alexandre D.</div><div style={{fontSize:10.5,color:AGR.mute}}>Student Plan</div></div>
          <span style={{color:AGR.mute,fontSize:10}}>▾</span>
        </div>
      </div>
    </div>
  );
}

function AgrPanel({children, style}) {
  return <div style={{background:AGR.panel,border:`1px solid ${AGR.line}`,borderRadius:4,...style}}>{children}</div>;
}

function SpxPanel({live}) {
  const spxPx = live?.spx!=null ? Number(live.spx).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '5,872.34';
  const clock = live?.clock || '15:42:18';
  // deterministic upward SPX series + theoretical mid (slightly below)
  const data = useMemo(()=>{
    let v=5630; const spx=[],th=[]; let s=12345;
    const rnd=()=>{ s=(1103515245*s+12345)>>>0; return s/4294967296; };
    for(let i=0;i<70;i++){ v += 4.2 + (rnd()-0.42)*42; spx.push({x:i,y:Math.round(v)}); th.push({x:i,y:Math.round(v-95-rnd()*40)}); }
    return {spx,th};
  },[]);
  return (
    <AgrPanel style={{padding:0,flex:1,display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'14px 18px 6px'}}>
        <div>
          <div style={{fontFamily:agrMono,fontSize:11,color:AGR.mute,letterSpacing:'.06em',marginBottom:8}}>SPX · S&amp;P 500 INDEX</div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontFamily:agrMono,fontSize:26,fontWeight:700,color:AGR.text}}>{spxPx}</span>
            <span style={{fontFamily:agrMono,fontSize:11,fontWeight:600,color:AGR.green,background:'rgba(47,191,113,.12)',padding:'2px 6px',borderRadius:3}}>+0.31%</span>
          </div>
        </div>
        <div style={{display:'flex',gap:18,alignItems:'flex-start'}}>
          <div style={{display:'flex',gap:14,fontFamily:agrMono,fontSize:10.5,color:AGR.mute,marginTop:4}}>
            <span>O <span style={{color:AGR.text}}>5,814.2</span></span><span>H <span style={{color:AGR.text}}>5,879.3</span></span><span>L <span style={{color:AGR.text}}>5,782.1</span></span>
          </div>
          <span style={{fontFamily:agrMono,fontSize:10,color:AGR.green,letterSpacing:'.08em',display:'flex',alignItems:'center',gap:6}}><span style={{width:6,height:6,borderRadius:3,background:AGR.green}}></span>MARKET DATA LIVE {clock}</span>
        </div>
      </div>
      <div style={{padding:'0 8px',flex:1}}>
        <LineChart width={560} height={208} fill={false} series={[
          {name:'SPX', color:AGR.red, data:data.spx, strokeWidth:1.8},
          {name:'TH', color:AGR.blue, data:data.th, dashed:true},
        ]}/>
      </div>
      <div style={{display:'flex',gap:20,padding:'4px 18px 12px',fontFamily:agrMono,fontSize:10.5}}>
        <span style={{color:AGR.text}}><span style={{color:AGR.red}}>—</span> SPX</span>
        <span style={{color:AGR.mute}}><span style={{color:AGR.blue}}>--</span> THEORETICAL (MID)</span>
      </div>
    </AgrPanel>
  );
}

function VolSurfacePanel() {
  const rows=['80%','100%','120%'], cols=['1M','6M','1Y','2Y'];
  const heat=[[0.55,0.7,0.9,0.45],[0.85,1,0.95,0.6],[0.95,0.9,0.7,0.4]];
  const cell=(v)=> v>=0.95?'#FF2733':v>=0.8?'#C42230':v>=0.6?'#7d1f29':v>=0.45?'#3a4a5a':'#26405a';
  return (
    <AgrPanel style={{padding:'14px 16px'}}>
      <div style={{fontFamily:agrMono,fontSize:11,color:AGR.text,letterSpacing:'.05em',marginBottom:3}}>VOL SURFACE · SPX</div>
      <div style={{fontFamily:agrMono,fontSize:10,color:AGR.mute,marginBottom:10}}>Strike × Tenor ◇</div>
      <div style={{display:'flex',gap:8}}>
        <div style={{display:'flex',flexDirection:'column',justifyContent:'space-around',fontFamily:agrMono,fontSize:9.5,color:AGR.mute,paddingTop:2,paddingBottom:14}}>
          {rows.map(r=><span key={r}>{r}</span>)}
        </div>
        <div style={{flex:1}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3}}>
            {heat.flatMap((row,ri)=>row.map((v,ci)=><div key={ri+'-'+ci} style={{height:26,background:cell(v),borderRadius:2}}/>))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontFamily:agrMono,fontSize:9.5,color:AGR.mute,marginTop:5}}>{cols.map(c=><span key={c}>{c}</span>)}</div>
        </div>
      </div>
    </AgrPanel>
  );
}

function OrderBookPanel() {
  const asks=[[386,'5,872.80'],[212,'5,872.60'],[171,'5,872.40'],[157,'5,872.20'],[293,'5,872.00']];
  const bids=[['5,872.18',221],['5,872.00',497],['5,871.80',245],['5,871.60',445],['5,871.40',202]];
  const maxA=Math.max(...asks.map(a=>a[0])), maxB=Math.max(...bids.map(b=>b[1]));
  return (
    <AgrPanel style={{padding:'14px 16px'}}>
      <div style={{fontFamily:agrMono,fontSize:11,color:AGR.text,letterSpacing:'.05em',marginBottom:10}}>ORDER BOOK · SPX</div>
      <div style={{display:'flex',justifyContent:'space-between',fontFamily:agrMono,fontSize:9.5,color:AGR.mute,marginBottom:6}}><span>BID</span><span>SIZE</span><span>ASK</span></div>
      {asks.map((a,i)=>(
        <div key={i} style={{position:'relative',display:'flex',justifyContent:'space-between',fontFamily:agrMono,fontSize:11,padding:'3px 4px'}}>
          <span style={{position:'absolute',left:0,top:0,bottom:0,width:`${a[0]/maxA*55}%`,background:'rgba(242,54,69,.16)'}}></span>
          <span></span><span style={{color:AGR.mute,zIndex:1}}>{a[0]}</span><span style={{color:AGR.red,zIndex:1}}>{a[1]}</span>
        </div>
      ))}
      <div style={{display:'flex',justifyContent:'space-between',fontFamily:agrMono,fontSize:10.5,color:AGR.text,padding:'7px 4px',borderTop:`1px solid ${AGR.line}`,borderBottom:`1px solid ${AGR.line}`,margin:'5px 0'}}>
        <span style={{color:AGR.mute}}>MID</span><span style={{fontWeight:700}}>5,872.34</span><span style={{color:AGR.mute}}>SPREAD 0.16</span>
      </div>
      {bids.map((b,i)=>(
        <div key={i} style={{position:'relative',display:'flex',justifyContent:'space-between',fontFamily:agrMono,fontSize:11,padding:'3px 4px'}}>
          <span style={{position:'absolute',right:0,top:0,bottom:0,width:`${b[1]/maxB*55}%`,background:'rgba(47,191,113,.13)'}}></span>
          <span style={{color:AGR.green,zIndex:1}}>{b[0]}</span><span style={{color:AGR.mute,zIndex:1}}>{b[1]}</span><span></span>
        </div>
      ))}
    </AgrPanel>
  );
}

const AGENTS = [
  {type:'sales', name:'Sales Agent', status:'Understanding', state:'active'},
  {type:'structurer', name:'Structurer', status:'Proposing ideas', state:'done'},
  {type:'data', name:'Market Data', status:'Loading data', state:'done'},
  {type:'quant', name:'Quant Agent', status:'Modeling', state:'done'},
  {type:'pricing', name:'Pricing Agent', status:'Pricing', state:'done'},
  {type:'trader', name:'Trader Agent', status:'Quoting', state:'live'},
  {type:'risk', name:'Risk Manager', status:'Validating', state:'idle'},
  {type:'report', name:'Report Agent', status:'Preparing', state:'idle'},
];
// Deterministic desk parser: natural language -> structured request (the agents
// orchestrate a workflow, they do NOT invent prices). Offline, no LLM needed.
function parseMarketRequest(text){
  const t=(text||'').toLowerCase();
  let underlying='Crude Oil (WTI)', factor='oil';
  if (/p[ée]trole|oil|wti|brent|crude|baril/.test(t)) {underlying='Crude Oil (WTI)';factor='oil';}
  else if (/inflation|cpi|prix.*augment.*g[ée]n[ée]ral/.test(t)) {underlying='Inflation (CPI)';factor='inflation';}
  else if (/credit|spread|cds|d[ée]faut|default/.test(t)) {underlying='Credit Spreads';factor='credit';}
  else if (/taux|rate|rates|bond|obligation|swap|coupon|callable/.test(t)) {underlying='EUR Rates';factor='rates';}
  else if (/\bgold\b|\bor\b|once/.test(t)) {underlying='Gold';factor='gold';}
  else if (/eur|usd|fx|change|devise|dollar/.test(t)) {underlying='EUR/USD';factor='fx';}
  const mM=t.match(/(\d+)\s*(mois|month)/), mY=t.match(/(\d+)\s*(ans?|years?|y\b)/);
  const horizon=mM?`${mM[1]} Months`:mY?`${mY[1]} Years`:'5 Months';
  let view='Price increase';
  if (/baiss|fall|down|drop|decreas|chut|recul/.test(t)) view='Price decrease';
  else if (/stable|sideways|range|flat|inchang|stagn/.test(t)) view='Range / stable';
  else if (/augment|rise|monte|hauss|\bup\b|increas|widen|[ée]carte/.test(t)) view='Price increase';
  let intention='Hedge / Express a view';
  if (/explain|comprendre|understand|what is|c'est quoi|apprendre|how does|fonctionne/.test(t)) intention='Learn a concept';
  else if (/price|pricer|quote|cote|combien|valoris/.test(t)) intention='Price a product';
  else if (/hedge|couvr|prot[ée]g|peur|afraid|worried|inqui[eè]t/.test(t)) intention='Hedge / Express a view';
  return {underlying, factor, horizon, view, intention, objective:'Protection / Opportunity'};
}
function ideasFor(parsed){
  const f=parsed.factor, up=parsed.view==='Price increase';
  const oil=[
    {ic:'sales',n:'WTI Call Option ('+parsed.horizon.split(' ')[0]+'M)',d:'Long call option to benefit from rising oil prices.',cost:3.45,unit:'/ bbl',conf:'High',confC:AGR.green,tag:'PROTECTION',kind:'call',K:80},
    {ic:'trader',n:'Bull Call Spread',d:'Call spread to reduce cost while keeping upside.',cost:1.85,unit:'/ bbl',conf:'High',confC:AGR.green,tag:'BALANCED',kind:'spread',K:80},
    {ic:'risk',n:'Collar Strategy',d:'Call + protective put for downside protection.',cost:0.95,unit:'/ bbl',conf:'Medium',confC:AGR.amber,tag:'HEDGE',kind:'collar',K:80},
  ];
  const rates=[
    {ic:'sales',n:'Payer Swap',d:'Pay fixed / receive float to gain if rates rise.',cost:0.00,unit:'/ par',conf:'High',confC:AGR.green,tag:'HEDGE',kind:'swap'},
    {ic:'trader',n:'Interest-Rate Cap',d:'Cap option that pays when rates exceed the strike.',cost:1.20,unit:'%',conf:'High',confC:AGR.green,tag:'PROTECTION',kind:'cap'},
    {ic:'risk',n:'Payer Swaption',d:'Option to enter a payer swap — convex rate protection.',cost:0.85,unit:'%',conf:'Medium',confC:AGR.amber,tag:'BALANCED',kind:'swaption'},
  ];
  const credit=[
    {ic:'sales',n:'Buy CDS Protection',d:'Pays out if the reference credit widens / defaults.',cost:1.20,unit:'%',conf:'High',confC:AGR.green,tag:'PROTECTION',kind:'cds'},
    {ic:'trader',n:'Short Credit-Linked Note',d:'Reduce spread exposure on the book.',cost:0.00,unit:'/ par',conf:'Medium',confC:AGR.amber,tag:'HEDGE',kind:'cln'},
    {ic:'risk',n:'Index CDS Hedge',d:'Macro hedge via a liquid CDS index.',cost:0.65,unit:'%',conf:'High',confC:AGR.green,tag:'BALANCED',kind:'cds'},
  ];
  const generic=[
    {ic:'sales',n:'Vanilla Option',d:'Directional option matching your view.',cost:3.45,unit:'',conf:'High',confC:AGR.green,tag:'VIEW',kind:'call',K:80},
    {ic:'trader',n:'Option Spread',d:'Cheaper, capped-payoff alternative.',cost:1.85,unit:'',conf:'High',confC:AGR.green,tag:'BALANCED',kind:'spread',K:80},
    {ic:'risk',n:'Structured Note',d:'Capital-protected exposure to the factor.',cost:0.95,unit:'',conf:'Medium',confC:AGR.amber,tag:'HEDGE',kind:'note'},
  ];
  if (f==='oil') return oil;
  if (f==='rates') return rates;
  if (f==='credit') return credit;
  return generic;
}

function AgentPipeline({running, stage, desk}) {
  const outputs = desk?.agents || [];
  return (
    <AgrPanel style={{padding:'16px 18px',marginTop:14}}>
      <div style={{fontFamily:agrMono,fontSize:11,color:AGR.red,letterSpacing:'.08em',marginBottom:14}}>AGENT ROOM · {running?'TASK IN PROGRESS':(desk?'COMPLETE':'READY')}</div>
      <div style={{display:'flex',alignItems:'stretch',gap:0}}>
        {AGENTS.map((tpl,i)=>{
          const a = running ? {...tpl, state:(i<stage?'done':i===stage?'live':'idle')} : tpl;
          const out = outputs[i]?.output;
          const col = a.state==='active'?AGR.text : a.state==='live'?AGR.red : a.state==='done'?AGR.text : AGR.dim;
          const dot = a.state==='live'?AGR.red : a.state==='idle'?AGR.dim : AGR.green;
          return (
            <React.Fragment key={a.name}>
              <div title={out||''} style={{flex:1,border:`1px solid ${a.state==='live'?'rgba(242,54,69,.4)':AGR.line}`,borderRadius:4,padding:'14px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:9,background:a.state==='live'?'rgba(242,54,69,.04)':'transparent',minWidth:0,cursor:out?'help':'default'}}>
                <AgentSVG type={a.type} color={a.state==='idle'?AGR.dim:(a.state==='live'?AGR.red:AGR.text)}/>
                <div style={{fontFamily:agrMono,fontSize:11,fontWeight:600,color:col,textAlign:'center'}}>{a.name}</div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  {a.state==='done'? <span style={{color:AGR.green,fontSize:10}}>✓</span> : <span style={{width:6,height:6,borderRadius:3,background:dot}}></span>}
                  <span style={{fontFamily:agrMono,fontSize:9.5,color:AGR.mute}}>{a.status}</span>
                </div>
              </div>
              {i<AGENTS.length-1 && <div style={{alignSelf:'center',width:14,height:1,background:AGR.line2}}></div>}
            </React.Fragment>
          );
        })}
      </div>
      {desk && outputs.length>0 && (
        <div style={{marginTop:12,borderTop:`1px solid ${AGR.line}`,paddingTop:10,display:'flex',flexDirection:'column',gap:4}}>
          {outputs.map((o)=>(
            <div key={o.key} style={{display:'flex',gap:8,fontSize:11,lineHeight:1.4}}>
              <span style={{fontFamily:agrMono,color:AGR.red,minWidth:96,flexShrink:0}}>{o.name}</span>
              <span style={{color:AGR.mute}}>{o.output}</span>
            </div>
          ))}
        </div>
      )}
    </AgrPanel>
  );
}

function PayoffMini({K=80,prem=3.45,kind='call'}){
  const data=useMemo(()=>{const a=[];for(let x=58;x<=112;x+=1){
    let y;
    if(kind==='spread'){ const K2=K+10; y=Math.min(Math.max(x-K,0),K2-K)-prem; }
    else if(kind==='collar'){ const Kp=K-8; y=Math.max(x-K,0)-Math.max(Kp-x,0)-prem; }
    else if(kind==='swap'||kind==='cds'||kind==='cln'){ y=(x-K)*0.6; }
    else { y=Math.max(x-K,0)-prem; }
    a.push({x,y:+y.toFixed(3)});
  } return a;},[K,prem,kind]);
  return <LineChart width={360} height={150} fill={false} series={[{name:'payoff',color:AGR.red,data,strokeWidth:2}]} />;
}

function RfqCockpit({parsed, query, desk, live}) {
  // REAL pricing: prefer the backend desk's pricer output; else compute locally
  // with Black-Scholes. Agents orchestrate; the deterministic pricer computes.
  const months = parseInt(parsed.horizon,10) || 5;
  const T=months/12, S0=80, K=80, r=0.04, vol=0.1341;
  const ideas = ideasFor(parsed);
  const best = ideas[0];
  const dp = desk?.pricing;
  const isCall = dp ? dp.kind==='call' : best.kind==='call';
  const prem = dp ? dp.est_price : (isCall ? bsPrice({S:S0,K,r,sigma:vol,T,type:'call'}).price : best.cost);
  const breakeven = dp ? dp.break_even : (isCall ? K + prem : null);
  const maxLoss = dp ? dp.max_loss : (isCall ? prem*100 : null);
  const key=[['Underlying',parsed.underlying],['Horizon',parsed.horizon],['View',parsed.view],['Objective',parsed.objective]];
  const label=(t)=> <div style={{fontFamily:agrMono,fontSize:11,color:AGR.mute}}>{t}</div>;
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1.15fr 1.1fr 0.85fr',gap:14,marginTop:14}}>
      {/* 1. YOUR REQUEST */}
      <AgrPanel style={{padding:18}}>
        <div style={{fontFamily:agrMono,fontSize:12,fontWeight:700,color:AGR.text,marginBottom:14}}>1. YOUR REQUEST</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>{label('Natural Language')}<span style={{fontFamily:agrMono,fontSize:9.5,color:AGR.red,border:`1px solid ${AGR.redDim}`,borderRadius:3,padding:'1px 6px'}}>✎ Edit</span></div>
        <p style={{fontSize:12.5,color:AGR.text,lineHeight:1.5,margin:'8px 0 18px'}}>{query}</p>
        {label('Detected Intention')}
        <div style={{fontFamily:agrMono,fontSize:13,fontWeight:600,color:AGR.red,margin:'6px 0 18px'}}>{parsed.intention}</div>
        {label('Key Elements')}
        <div style={{marginTop:8}}>
          {key.map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderTop:`1px solid ${AGR.line}`}}>
              <span style={{fontFamily:agrMono,fontSize:11,color:AGR.mute}}>{k}</span>
              <span style={{fontFamily:agrMono,fontSize:11.5,color:AGR.text,fontWeight:500}}>{v}</span>
            </div>
          ))}
        </div>
      </AgrPanel>
      {/* 2. AGENT PROPOSALS */}
      <AgrPanel style={{padding:18,display:'flex',flexDirection:'column'}}>
        <div style={{fontFamily:agrMono,fontSize:12,fontWeight:700,color:AGR.text,marginBottom:4}}>2. AGENT PROPOSALS</div>
        <div style={{fontSize:11.5,color:AGR.mute,marginBottom:12}}>Best Ideas for Your Scenario</div>
        <div style={{display:'flex',flexDirection:'column',gap:10,flex:1}}>
          {ideas.map((it,idx)=>(
            <div key={it.n} style={{border:`1px solid ${idx===0?'rgba(242,54,69,.35)':AGR.line}`,borderRadius:4,padding:12,display:'flex',gap:12}}>
              <span style={{width:34,height:34,borderRadius:4,border:`1px solid ${AGR.line2}`,display:'grid',placeItems:'center',flexShrink:0,color:AGR.mute}}><AgentSVG type={it.ic} color={AGR.mute}/></span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:agrMono,fontSize:12.5,fontWeight:600,color:AGR.text}}>{it.n}</div>
                <div style={{fontSize:11,color:AGR.mute,lineHeight:1.4,margin:'4px 0 8px'}}>{it.d}</div>
                <span style={{fontFamily:agrMono,fontSize:8.5,letterSpacing:'.08em',color:AGR.mute,border:`1px solid ${AGR.line2}`,borderRadius:2,padding:'2px 6px'}}>{it.tag}</span>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:10,color:AGR.mute}}>Est. Cost</div>
                <div style={{fontFamily:agrMono,fontSize:13,fontWeight:700,color:AGR.text,margin:'2px 0 8px'}}>${it.cost.toFixed(2)} <span style={{fontSize:9,color:AGR.mute}}>{it.unit}</span></div>
                <div style={{fontSize:10,color:AGR.mute}}>Confidence</div>
                <div style={{fontFamily:agrMono,fontSize:11.5,fontWeight:600,color:it.confC}}>{it.conf}</div>
              </div>
            </div>
          ))}
        </div>
        <button style={{marginTop:12,width:'100%',background:AGR.panel2,border:`1px solid ${AGR.line2}`,borderRadius:4,color:AGR.text,fontFamily:agrMono,fontSize:11.5,padding:'10px',cursor:'pointer'}}>See all 6 ideas →</button>
      </AgrPanel>
      {/* 3. QUICK VIEW */}
      <AgrPanel style={{padding:18}}>
        <div style={{fontFamily:agrMono,fontSize:12,fontWeight:700,color:AGR.text,marginBottom:2}}>3. QUICK VIEW <span style={{color:AGR.red}}>(BEST IDEA)</span></div>
        <div style={{fontSize:11.5,color:AGR.mute,marginBottom:6}}>{best.n}</div>
        <div style={{display:'flex',gap:14,fontFamily:agrMono,fontSize:9.5,color:AGR.mute,marginBottom:4}}><span><span style={{color:AGR.red}}>—</span> Payoff at Maturity</span><span><span style={{color:AGR.mute}}>--</span> Break-even</span></div>
        <PayoffMini K={K} prem={prem} kind={best.kind}/>
        <div style={{fontFamily:agrMono,fontSize:9,color:AGR.mute,textAlign:'center',marginTop:2}}>WTI Price (USD/bbl)</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,marginTop:12,background:AGR.line,border:`1px solid ${AGR.line}`,borderRadius:4,overflow:'hidden'}}>
          {[['Est. Price',`$${Number(prem).toFixed(2)} ${(dp?dp.unit:best.unit)||''}`],['Break-even',isCall?`$${Number(breakeven).toFixed(2)}`:'—'],['Max Loss',isCall?`$${Math.round(maxLoss)}`:'Limited'],['Max Profit','Unlimited']].map(([k,v],i)=>(
            <div key={k} style={{background:AGR.panel,padding:'10px 12px'}}>
              <div style={{fontSize:10,color:i===3?AGR.red:AGR.mute}}>{k}</div>
              <div style={{fontFamily:agrMono,fontSize:13,fontWeight:700,color:i===3?AGR.red:AGR.text,marginTop:3}}>{v}</div>
            </div>
          ))}
        </div>
        {desk?.quote && (
          <div style={{display:'flex',justifyContent:'space-between',marginTop:10,padding:'8px 10px',border:`1px solid ${AGR.line}`,borderRadius:4,fontFamily:agrMono,fontSize:11}}>
            <span style={{color:AGR.green}}>BID {desk.quote.bid}</span>
            <span style={{color:AGR.mute}}>MID {desk.quote.mid}</span>
            <span style={{color:AGR.red}}>ASK {desk.quote.ask}</span>
          </div>
        )}
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <button style={{flex:1,background:AGR.panel2,border:`1px solid ${AGR.line2}`,borderRadius:4,color:AGR.text,fontFamily:agrMono,fontSize:11,padding:'10px',cursor:'pointer'}}>View Full Analysis</button>
          <button style={{flex:1,background:AGR.red,border:'none',borderRadius:4,color:'#fff',fontFamily:agrMono,fontSize:11,fontWeight:600,padding:'10px',cursor:'pointer'}}>Price This Idea →</button>
        </div>
      </AgrPanel>
      {/* 4. DESK SNAPSHOT */}
      <AgrPanel style={{padding:18}}>
        {(()=>{ const ld=live?.desk;
        const pnl = ld? ld.pnl_today : 24580;
        const pnlPos = pnl>=0;
        const pnlClr = pnlPos?AGR.green:AGR.red;
        const curve = ld?.pnl_curve && ld.pnl_curve.length>1 ? ld.pnl_curve : null;
        let spark = "M0,28 L25,24 L50,26 L75,18 L100,20 L125,12 L150,15 L175,7 L200,4";
        if (curve){ const lo=Math.min(...curve), hi=Math.max(...curve), rng=(hi-lo)||1; spark = curve.map((y,i)=>`${i===0?'M':'L'}${(i/(curve.length-1)*200).toFixed(1)},${(32-((y-lo)/rng)*30).toFixed(1)}`).join(' '); }
        const rows = ld? [
          ['DV01 (Total)', `${(ld.dv01/1e6).toFixed(2)}M`, AGR.text],
          ['CS01 (Total)', `${Math.round(ld.cs01).toLocaleString()}`, AGR.text],
          ['Risk Status', '● '+ld.risk_status, ld.risk_status==='GREEN'?AGR.green:(ld.risk_status==='AMBER'?AGR.amber:AGR.red)],
          ['Active Positions', String(ld.positions), AGR.text],
          ['Orders in Flight', String(ld.orders_in_flight), AGR.text],
          ['Limit usage', `${Math.round(ld.limit_usage*100)}%`, AGR.text],
        ] : [['DV01 (Total)','2.45M',AGR.text],['Risk Status','● GREEN',AGR.green],['Active Positions','12',AGR.text],['Orders in Flight','5',AGR.text]];
        return (<>
        <div style={{fontFamily:agrMono,fontSize:12,fontWeight:700,color:AGR.text,marginBottom:16}}>DESK SNAPSHOT {ld && <span style={{color:AGR.green,fontSize:9}}>● LIVE</span>}</div>
        <div style={{fontSize:10.5,color:AGR.mute}}>PnL Today</div>
        <div style={{fontFamily:agrMono,fontSize:22,fontWeight:700,color:pnlClr,margin:'4px 0 0'}}>{pnlPos?'+':'−'}${Math.abs(pnl).toLocaleString()}</div>
        <div style={{fontFamily:agrMono,fontSize:11,color:pnlClr,marginBottom:4}}>{pnlPos?'+':''}{ld? `${((pnl/24580)*0.68).toFixed(2)}%` : '0.68%'}</div>
        <svg viewBox="0 0 200 36" width="100%" height="32" style={{marginBottom:14}}><path d={spark} fill="none" stroke={pnlClr} strokeWidth="1.4"/></svg>
        {rows.map(([k,v,c])=>(
          <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderTop:`1px solid ${AGR.line}`}}>
            <span style={{fontFamily:agrMono,fontSize:11,color:AGR.mute}}>{k}</span>
            <span style={{fontFamily:agrMono,fontSize:12,fontWeight:600,color:c}}>{v}</span>
          </div>
        ))}
        <button style={{marginTop:14,width:'100%',background:AGR.panel2,border:`1px solid ${AGR.line2}`,borderRadius:4,color:AGR.text,fontFamily:agrMono,fontSize:11.5,padding:'10px',cursor:'pointer'}}>Go to PnL &amp; Risk →</button>
        </>); })()}
      </AgrPanel>
    </div>
  );
}

function MarketWatch({live}) {
  const lw = live?.market_watch || {};
  const v=(n,def)=> lw[n]?.v ?? def;
  const items=[['US 10Y',v('US 10Y','4.28%'),'-1.2bp',false],['US 2Y',v('US 2Y','3.89%'),'-0.8bp',false],['WTI',v('WTI','78.42'),'+1.32%',true],['BRENT',v('BRENT','82.15'),'+1.08%',true],['GOLD',v('GOLD','2,337.25'),'+0.45%',true],['EUR/USD',v('EUR/USD','1.0712'),'-0.12%',false],['SPX',v('SPX','5,872.34'),'+0.31%',true]];
  return (
    <div style={{display:'flex',alignItems:'center',gap:26,padding:'10px 26px',borderTop:`1px solid ${AGR.line}`,background:AGR.bg,overflowX:'auto'}}>
      <span style={{fontFamily:agrMono,fontSize:10.5,color:AGR.red,letterSpacing:'.08em',flexShrink:0}}>MARKET WATCH</span>
      {items.map(([n,v,c,up])=>(
        <span key={n} style={{display:'flex',gap:7,fontFamily:agrMono,fontSize:11,flexShrink:0}}>
          <span style={{color:AGR.mute}}>{n}</span><span style={{color:AGR.text}}>{v}</span><span style={{color:up?AGR.green:AGR.red}}>{c}</span>
        </span>
      ))}
      <span style={{marginLeft:'auto',color:AGR.mute,flexShrink:0}}><Icon name="sliders-horizontal" size={13}/></span>
    </div>
  );
}

const AGR_EXAMPLES = ['Price a 5Y EUR Callable Note','Hedge rising rates','Inflation protection','More ▾'];
// The Agentic Trading Room is now a REAL React page (AgentRoomReal) wired to the
// backend desk agents (/agent/desk/run) + real market data, replacing the static
// CDN/Babel design-kit iframe that used mock data.
function AgentRoomPage() {
  return (
    <React.Suspense fallback={<div className="container page"><div className="panel course-script-state"><span className="mono mute">Loading agent room…</span></div></div>}>
      <AgentRoomReal/>
    </React.Suspense>
  );
}

function AgentRoomPage_legacy() {
  const [tab,setTab]=useState('RFQ COCKPIT');
  const tabs=['RFQ COCKPIT','PRODUCT BUILDER','PRICING & RISK','SCENARIOS','REPORT CENTER'];
  const DEFAULT_Q="J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?";
  const [q,setQ]=useState(DEFAULT_Q);
  const [submitted,setSubmitted]=useState(DEFAULT_Q);
  const [parsed,setParsed]=useState(()=>parseMarketRequest(DEFAULT_Q));
  const [desk,setDesk]=useState(null); // real multi-agent backend result
  const [live,setLive]=useState(null); // live stateful trading-room snapshot
  const [liveOn,setLiveOn]=useState(false); // default frame = the mockup; go live after the first Send
  const [running,setRunning]=useState(false);
  const [stage,setStage]=useState(AGENTS.length); // settled
  // Once engaged, poll the LIVE trading-room state (time passes, books revalue).
  useEffect(()=>{
    if(!liveOn) return;
    let alive=true;
    const poll=()=>{ platformApi.deskState().then(s=>{ if(alive&&s) setLive(s); }).catch(()=>{}); };
    poll();
    const id=setInterval(poll, 1500);
    return ()=>{ alive=false; clearInterval(id); };
  },[liveOn]);
  // Drive the agent pipeline forward while the real agents run.
  useEffect(()=>{
    if(!running) return;
    if(stage>=AGENTS.length){ setRunning(false); return; }
    const id=setTimeout(()=>setStage(s=>s+1), 480);
    return ()=>clearTimeout(id);
  },[running,stage]);
  const run=async(text)=>{
    const t=(text||'').trim(); if(!t) return;
    setSubmitted(t); setParsed(parseMarketRequest(t)); setDesk(null); setTab('RFQ COCKPIT');
    setStage(0); setRunning(true); setLiveOn(true);
    // Run the REAL multi-agent desk AND book the resulting position into the live room.
    const traded = await platformApi.deskTrade(t);
    const result = traded?.result || await platformApi.deskRun(t);
    if (result) { setDesk(result); if(result.parsed) setParsed(p=>({...p,...result.parsed})); }
    if (traded?.snapshot) setLive(traded.snapshot);
  };
  return (
    <div style={{background:AGR.bg,minHeight:'100vh',color:AGR.text}}>
      <AgentRoomTopNav/>
      <div style={{padding:'22px 26px 0'}}>
        {/* HERO ROW */}
        <div style={{display:'grid',gridTemplateColumns:'1.55fr 1fr 0.72fr',gap:16}}>
          <div>
            <div style={{fontFamily:agrMono,fontSize:11.5,color:AGR.red,letterSpacing:'.12em',marginBottom:20}}>AGENTIC TRADING ROOM · FIXED INCOME DESK</div>
            <h1 style={{fontFamily:agrMono,fontSize:43,lineHeight:1.15,fontWeight:700,color:AGR.text,margin:'0 0 16px',letterSpacing:'-0.005em'}}>From any market question to a <span style={{color:AGR.red}}>desk-ready</span> answer.</h1>
            <p style={{fontSize:14.5,color:AGR.mute,lineHeight:1.55,maxWidth:'46ch',margin:'0 0 24px'}}>Ask anything. Our agents structure, price, and analyze financial products for you.</p>
            <form onSubmit={(e)=>{e.preventDefault();run(q);}} style={{display:'flex',gap:0,border:`1px solid ${AGR.line2}`,borderRadius:6,overflow:'hidden',background:AGR.panel2}}>
              <input value={q} onChange={e=>setQ(e.target.value)} style={{flex:1,background:'transparent',border:'none',outline:'none',color:AGR.text,fontSize:12.5,padding:'13px 14px'}}/>
              <button type="submit" style={{background:AGR.red,border:'none',color:'#fff',fontFamily:agrMono,fontSize:12,fontWeight:600,padding:'0 18px',display:'flex',alignItems:'center',gap:7,cursor:'pointer'}}>Send <Icon name="send" size={12}/></button>
            </form>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:14,flexWrap:'wrap'}}>
              <span style={{fontSize:11.5,color:AGR.mute}}>Try examples:</span>
              {AGR_EXAMPLES.map(c=>(
                <span key={c} onClick={()=>{ if(c!=='More ▾'){ setQ(c); run(c);} }} style={{fontFamily:agrMono,fontSize:10.5,color:AGR.text,border:`1px solid ${AGR.line2}`,borderRadius:3,padding:'5px 9px',cursor:'pointer'}}>{c}</span>
              ))}
            </div>
          </div>
          <SpxPanel live={live}/>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <VolSurfacePanel/>
            <OrderBookPanel live={live}/>
          </div>
        </div>
        <AgentPipeline running={running} stage={stage} desk={desk}/>
        {/* TABS */}
        <div style={{display:'flex',gap:26,borderBottom:`1px solid ${AGR.line}`,marginTop:18}}>
          {tabs.map(t=>(
            <span key={t} onClick={()=>setTab(t)} style={{fontFamily:agrMono,fontSize:11.5,letterSpacing:'.04em',fontWeight:600,color:t===tab?AGR.red:AGR.mute,padding:'10px 0',cursor:'pointer',borderBottom:t===tab?`2px solid ${AGR.red}`:'2px solid transparent'}}>{t}</span>
          ))}
        </div>
        {tab==='RFQ COCKPIT' ? <RfqCockpit parsed={parsed} query={submitted} desk={desk} live={live}/> : (
          <div style={{padding:'60px 0',textAlign:'center',color:AGR.mute,fontFamily:agrMono,fontSize:13}}>{tab} — this legacy surface is not included in the current release.</div>
        )}
      </div>
      <div style={{marginTop:18}}><MarketWatch live={live}/></div>
    </div>
  );
}

// Main App and router
function App() {
  const route = useHashRoute();
  const path = route.path;

  // Agentic Trading Room is a standalone full-screen app shell (its own nav).
  if (path==='/agent-room') {
    return <div data-screen-label="agent-room"><a className="skip-link" href="#main-content">Skip to content</a><main id="main-content" tabIndex={-1}><GatedPage required="pro" what="The agentic desk"><AgentRoomPage/></GatedPage></main><RouteMetadata path={path}/></div>;
  }

  let page;
  if (path==='' || path==='/') page = <HomePage/>;
  else if (path.startsWith('/courses/')) page = <CourseDetailPage route={route}/>;
  else if (path==='/courses') page = <CoursesPage/>;
  else if (path==='/interview' || path.startsWith('/interview/')) page = <React.Suspense fallback={<div className="container page"><p role="status">Loading Interview Lab…</p></div>}><InterviewLab route={route}/></React.Suspense>;
  else if ((path==='/tools' || path.startsWith('/tools/'))) page = <ToolsPage route={route}/>;
  else if ((path==='/lab' || path.startsWith('/lab/'))) page = <GatedPage required="student" what="Trading Lab"><TradingLabPage route={route}/></GatedPage>;
  else if ((path==='/exercises' || path.startsWith('/exercises/'))) page = <GatedPage required="starter" what="The exercise workspace"><ExercisesPage route={route}/></GatedPage>;
  else if ((path==='/survival' || path.startsWith('/survival/'))) page = <GatedPage required="student" what="Survival Mode"><SurvivalPage route={route}/></GatedPage>;
  else if ((path==='/community' || path.startsWith('/community/'))) page = <GatedPage required="starter" what="The practitioner community"><CommunityPage route={route}/></GatedPage>;
  else if ((path==='/blog' || path.startsWith('/blog/'))) page = <BlogPage route={route}/>;
  else if (path==='/dashboard') page = <DashboardPage/>;
  else if (path==='/account') page = <AccountPage/>;
  else if (path==='/pricing') page = <PricingPage/>;
  else if ((path==='/auth' || path.startsWith('/auth/'))) page = <AuthPage route={route}/>;
  else if (path==='/leaderboard') page = <LeaderboardPage/>;
  else if (path==='/notebooks') page = <GatedPage required="student" what="Browser notebooks"><NotebooksPage/></GatedPage>;
  else if (path==='/mentoring') page = <MentoringPage/>;
  else if (path==='/jobs') page = <JobsPage/>;
  else if (path==='/bug') page = <BugReportPage/>;
  else if (path==='/api') page = <GatedPage required="pro" what="The private API preview"><ApiDocsPage/></GatedPage>;
  else if (path==='/admin') page = <AdminPage/>;
  else if (path==='/practice') page = <PracticePage/>;
  else if (path==='/challenge') page = <ChallengePage/>;
  else if (path==='/billing/success') page = <BillingResultPage status="success"/>;
  else if (path==='/billing/cancel') page = <BillingResultPage status="cancel"/>;
  else if (path==='/starter-kit' || path==='/starter-kit/success' || path==='/starter-kit/cancel') page = <React.Suspense fallback={<div className="container page" style={{minHeight:'calc(100vh - 150px)'}}><div className="panel" style={{padding:28}}><span className="mono mute">Chargement de l'espace produit…</span></div></div>}><StarterKitPage salesGuard={STARTER_KIT_SALES_GUARD} returnStatus={path.endsWith('/success')?'success':path.endsWith('/cancel')?'cancel':null}/></React.Suspense>;
  else if (path==='/terms') page = <LegalPage kind="terms"/>;
  else if (path==='/privacy') page = <LegalPage kind="privacy"/>;
  else if (path==='/refund') page = <LegalPage kind="refund"/>;
  else if (path==='/legal') page = <LegalPage kind="legal"/>;
  else if (path==='/contact') page = <LegalPage kind="contact"/>;
  else if (path==='/about') page = <AboutPage/>;
  else if (path==='/cancel') page = <LegalPage kind="cancel"/>;
  else page = <NotFoundPage/>;

  return (
    <div data-screen-label={path||'home'}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header route={route}/>
      <main id="main-content" tabIndex={-1}>{page}</main>
      <RouteMetadata path={path || '/'}/>
      <Footer/>
      {/* ChatFab replaced by the global AG-UI AgentDock (mounted in App.tsx) */}
      <ToastStack/>
    </div>
  );
}

export default App;
