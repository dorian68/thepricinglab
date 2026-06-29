import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { useAuth } from '../contexts/AuthContext';
import { useToolRegister } from '../agent/toolControl';
import { runPython } from './pyodideRunner';
import { getDerivation } from './derivations';
import { loadDeskSeries, pickCourseSeries, SYMBOL_ALIAS } from './marketSeries';
import { getLessonProse } from './lessonProse';
import { getCourseLayout, showMarketOnLesson } from './courseLayouts';
import AgentRoomReal from '../agent/AgentRoomReal';
import {
  GENERATOR_PRESETS,
  PRACTICE_COURSE_EXTENSIONS,
  PRACTICE_EXERCISES,
  exerciseDescription,
  generateAiDeskExercise,
  getCourseBlueprint,
  getExerciseById,
  getPracticeApiBase,
  loadGeneratedExercises,
  platformApi,
  saveGeneratedExercise,
  startCheckout,
  strategyApi,
} from './practiceEngine';
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
    <div className={`form-notice ${type}`}>
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
  notify(`${label} saved to your workspace.`);
}

function handleShare(label) {
  copyText(window.location.href, `${label} link copied.`);
}

function submitStub(label) {
  notify(`${label} queued for backend processing.`);
}

// ---------- Routing ----------
const COURSE_ROUTE_ALIASES = {
  'black-scholes': 'black-scholes',
  'yield-curves': 'yield-curves',
  greeks: 'greeks',
  'implied-vol': 'implied-vol',
  'vol-products': 'vol-products',
  'exotic-options': 'exotics',
  exotics: 'exotics',
  'monte-carlo': 'monte-carlo',
  'stochastic-calculus': 'stochastic',
  stochastic: 'stochastic',
  'hedging-strategies': 'hedging',
  hedging: 'hedging',
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
  if (path === '/quizzes') return '/dashboard';
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
function Link({to, children, className, style, onClick}) {
  return <RouterLink to={to} className={className} style={style} onClick={onClick}>{children}</RouterLink>;
}

// ---------- Lucide icon ----------
function Icon({name, size=14, style, className}) {
  return <i className={"icon icon-"+name+" "+(className||'')} style={{fontSize:size, lineHeight:1, ...style}} />;
}

// ---------- Math: Black-Scholes ----------
function normCdf(x){
  // Abramowitz & Stegun
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = x<0?-1:1;
  x = Math.abs(x)/Math.SQRT2;
  const t = 1/(1+p*x);
  const y = 1 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5*(1+sign*y);
}
function normPdf(x){ return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI); }

function bsPrice({S,K,r,q=0,sigma,T,type='call'}){
  if (T<=0 || sigma<=0) {
    const intr = type==='call' ? Math.max(S-K,0) : Math.max(K-S,0);
    return {price:intr, delta:0, gamma:0, vega:0, theta:0, rho:0, d1:0, d2:0};
  }
  const d1 = (Math.log(S/K) + (r-q+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
  const d2 = d1 - sigma*Math.sqrt(T);
  const Nd1 = normCdf(d1), Nd2 = normCdf(d2);
  const pdf = normPdf(d1);
  const eqT = Math.exp(-q*T), erT = Math.exp(-r*T);
  let price, delta, theta, rho;
  if (type === 'call') {
    price = S*eqT*Nd1 - K*erT*Nd2;
    delta = eqT*Nd1;
    theta = (-S*eqT*pdf*sigma/(2*Math.sqrt(T)) - r*K*erT*Nd2 + q*S*eqT*Nd1)/365;
    rho   = K*T*erT*Nd2/100;
  } else {
    price = K*erT*normCdf(-d2) - S*eqT*normCdf(-d1);
    delta = eqT*(Nd1-1);
    theta = (-S*eqT*pdf*sigma/(2*Math.sqrt(T)) + r*K*erT*normCdf(-d2) - q*S*eqT*normCdf(-d1))/365;
    rho   = -K*T*erT*normCdf(-d2)/100;
  }
  const gamma = eqT*pdf/(S*sigma*Math.sqrt(T));
  const vega = S*eqT*pdf*Math.sqrt(T)/100;
  return {price, delta, gamma, vega, theta, rho, d1, d2};
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

// ---------- Mock data: courses ----------
const COURSES = [
  // FUNDAMENTALS
  {id:'black-scholes', title:'Black-Scholes Model', tier:'Fundamentals', level:'L1', duration:'4h 20m', modules:8, badge:'free',
   tagline:'Closed-form pricing for European options, from PDE to code.',
   topics:['PDE derivation','d1/d2','Risk-neutral measure','Implementation','Limitations'],
   accent:'#19C37D'},
  {id:'yield-curves', title:'Yield Curves', tier:'Fundamentals', level:'L1', duration:'3h 50m', modules:7, badge:'free',
   tagline:'Bootstrapping, zero rates, forward curves, bond pricing.',
   topics:['Bootstrapping','Zero-coupon','Forward rates','Discount factors'],
   accent:'#3E8BFF'},
  {id:'greeks', title:'Option Greeks', tier:'Fundamentals', level:'L2', duration:'5h 10m', modules:9, badge:'student',
   tagline:'Delta, Gamma, Vega, Theta, Rho — measure & manage risk.',
   topics:['Delta hedging','Gamma scalping','Vega risk','Theta decay'],
   accent:'#FFB020'},
  // ADVANCED
  {id:'implied-vol', title:'Implied Volatility Analysis', tier:'Advanced', level:'L3', duration:'6h 40m', modules:11, badge:'student',
   tagline:'Smile, skew, term structure & surface construction.',
   topics:['Smile/skew','Term structure','SVI','Arbitrage-free surfaces'],
   accent:'#FF2E45'},
  {id:'vol-products', title:'Volatility Products', tier:'Advanced', level:'L3', duration:'4h 50m', modules:9, badge:'pro',
   tagline:'Variance swaps, VIX futures, vol carry & dispersion.',
   topics:['Variance swaps','VIX','Dispersion','Vol carry'],
   accent:'#D946EF'},
  {id:'hedging', title:'Advanced Hedging', tier:'Advanced', level:'L4', duration:'5h 30m', modules:10, badge:'student',
   tagline:'Static & dynamic hedging across vega, gamma, cross-greeks.',
   topics:['Delta-gamma','Vega hedging','Cross greeks','Replication'],
   accent:'#19C37D'},
  // COMPLEX
  {id:'exotics', title:'Exotic Options', tier:'Complex', level:'L4', duration:'7h 15m', modules:12, badge:'pro',
   tagline:'Barriers, Asians, lookbacks, autocallables. Path matters.',
   topics:['Barriers','Asians','Lookbacks','Autocallables'],
   accent:'#3E8BFF'},
  {id:'monte-carlo', title:'Monte Carlo Methods', tier:'Complex', level:'L4', duration:'6h 05m', modules:10, badge:'pro',
   tagline:'GBM paths, variance reduction, convergence, VaR/ES.',
   topics:['GBM','Antithetic','Control variates','VaR/ES'],
   accent:'#FFB020'},
  {id:'stochastic', title:'Stochastic Calculus', tier:'Complex', level:'L5', duration:'8h 30m', modules:14, badge:'pro',
   tagline:"Itô's lemma, SDEs, measure changes — the math behind it all.",
   topics:["Itô's lemma","SDE","Girsanov","Martingales"],
   accent:'#FF2E45'},
  ...PRACTICE_COURSE_EXTENSIONS,
];

const COURSE_SCRIPT_SLUGS = {
  'black-scholes': 'vanilla-options-quote',
  'greeks': 'options-book-greeks-pnl',
  'hedging': 'options-book-greeks-pnl',
  'rates-swaps': 'rates-swaps-dv01',
  'yield-curves': 'yield-curve-bootstrapping',
  'implied-vol': 'implied-volatility-smile',
  'vol-products': 'implied-volatility-smile',
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
const CHAPTER_COUNTS = {
  'black-scholes': 8, 'yield-curves': 8, 'greeks': 8, 'implied-vol': 8,
  'vol-products': 8, 'hedging': 8, 'exotics': 8, 'monte-carlo': 8, 'stochastic': 8,
};

const TOOLS = [
  {id:'bs-pricer', name:'Black-Scholes Pricer', cat:'Calculators', tier:'free', desc:'Closed-form price + Greeks for European options.'},
  {id:'payoff', name:'Payoff Visualizer', cat:'Visualizers', tier:'free', desc:'Build multi-leg strategies, view P&L, breakevens, Greeks.'},
  {id:'mc', name:'Monte Carlo Simulator', cat:'Simulators', tier:'free', desc:'GBM paths, terminal distribution, VaR & ES.'},
  {id:'iv-calc', name:'Volatility Calculator', cat:'Calculators', tier:'free', desc:'Realized vol, rolling windows, multiple estimators.'},
  {id:'calib', name:'Model Calibration', cat:'Calculators', tier:'student', desc:'Fit Black, SABR, Heston to market smiles.'},
  {id:'binomial', name:'Binomial Tree', cat:'Calculators', tier:'free', desc:'Cox-Ross-Rubinstein for American + early exercise.'},
  {id:'volsurface', name:'Vol Surface Explorer', cat:'Visualizers', tier:'free', desc:'Implied vol surface, slice by strike/tenor.'},
  {id:'bond', name:'Bond Calculator', cat:'Calculators', tier:'free', desc:'YTM, duration, convexity, scenario shifts.'},
  {id:'curve', name:'Yield Curve Builder', cat:'Calculators', tier:'free', desc:'Bootstrap from deposits, futures, swaps.'},
];

const TIER_BADGE = {
  free:    {label:'Starter', cls:'badge-green'},
  student: {label:'Student', cls:'badge-blue'},
  pro:     {label:'Pro', cls:'badge-red'},
};

// ---------- Mock: blog ----------
const POSTS = [
  {id:'understanding-vega', title:'Understanding Vega Across Strikes', tag:'Options', readTime:'8 min', date:'May 18, 2026', author:'L. Martin', excerpt:'How vega behaves along the volatility smile and what hedgers miss when assuming flat vol.'},
  {id:'monte-carlo-pitfalls', title:'Monte Carlo Pitfalls in Production', tag:'Monte Carlo', readTime:'12 min', date:'May 10, 2026', author:'S. Okafor', excerpt:'Variance reduction is not optional. Five mistakes that survive code review and torch your P&L.'},
  {id:'bs-from-scratch', title:'Re-deriving Black-Scholes from Scratch', tag:'Black-Scholes', readTime:'15 min', date:'May 03, 2026', author:'M. Rivera', excerpt:'A pedagogical derivation starting from the replicating portfolio — no measure theory required.'},
  {id:'vol-cones', title:'Volatility Cones Reconsidered', tag:'Volatility', readTime:'6 min', date:'Apr 27, 2026', author:'A. Chen', excerpt:'Why cones can mislead during regime shifts, and a simple Bayesian alternative.'},
  {id:'quant-interview', title:'10 Quant Interview Brain-teasers Worth Practicing', tag:'Quant Interview', readTime:'10 min', date:'Apr 19, 2026', author:'L. Martin', excerpt:'Hands-on problems that show up at top desks, with full solutions and intuition.'},
  {id:'python-numerics', title:'Python Numerics for Pricing: Pitfalls', tag:'Python', readTime:'9 min', date:'Apr 12, 2026', author:'S. Okafor', excerpt:'Float precision, vectorization and when to abandon NumPy for plain loops.'},
];

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
          <span><span className="dot dot-green" style={{marginRight:6}}></span>MKT · OPEN</span>
          <span className="mute">SESSION · NY</span>
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
  {to:'/agent-room', label:'Agent Room'},
  {to:'/courses', label:'Courses'},
  {to:'/lab', label:'Trading Lab'},
  {to:'/tools', label:'Tools'},
  {to:'/exercises', label:'Exercises'},
  {to:'/community', label:'Community'},
  {to:'/blog', label:'Blog'},
];

function Header({route}) {
  const [lang, setLang] = useState('EN');
  const [drawer, setDrawer] = useState(false);
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const isActive = (to) => route.path === to || route.path.startsWith(to+'/');
  const displayName = profile?.prenom || user?.email?.split('@')[0] || 'Desk';
  const closeDrawer = () => setDrawer(false);
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
          <Link to="/" className="brand">
            <span className="brand-mark"></span>
            <span>THE PRICING LIBRARY</span>
            <span style={{color:'var(--mute)',marginLeft:8,fontWeight:500}}>·</span>
            <span className="mute" style={{fontWeight:500}}>EDU</span>
          </Link>
          <nav className="nav-links">
            {NAV_ITEMS.map(n => (
              <Link key={n.to} to={n.to} className={"nav-link " + (isActive(n.to)?'active':'')}>{n.label}</Link>
            ))}
          </nav>
          <div className="nav-right">
            <div className="lang-switch">
              <button className={lang==='FR'?'on':''} onClick={()=>{setLang('FR'); notify('Interface language set to French.');}}>FR</button>
              <button className={lang==='EN'?'on':''} onClick={()=>{setLang('EN'); notify('Interface language set to English.');}}>EN</button>
            </div>
            <Link to="/dashboard" className="btn btn-ghost btn-sm nav-dashboard" style={{padding:'6px 10px'}}>
              <Icon name="layout-dashboard" size={13}/> Dashboard
            </Link>
            {isAuthenticated ? (
              <button className="btn btn-outline btn-sm nav-login" onClick={handleSignOut}>
                <Icon name="log-out" size={13}/> {displayName}
              </button>
            ) : (
              <>
                <Link to="/auth/login" className="btn btn-outline btn-sm nav-login">Log in</Link>
                <Link to="/auth/signup" className="btn btn-primary btn-sm nav-signup">Sign up<Icon name="arrow-right" size={13}/></Link>
              </>
            )}
            <button className="btn btn-ghost btn-sm mobile-menu-btn" onClick={()=>setDrawer(true)} aria-label="Open menu">
              <Icon name="menu" size={16}/>
            </button>
          </div>
        </div>
      </header>
      {drawer && (
        <div className="mobile-drawer-backdrop" onClick={closeDrawer}>
          <aside className="mobile-drawer" onClick={(event)=>event.stopPropagation()} aria-label="Mobile navigation">
            <div className="row between" style={{padding:'16px 18px',borderBottom:'1px solid var(--line)'}}>
              <Link to="/" className="brand" onClick={closeDrawer}>
                <span className="brand-mark"></span>
                <span>TPL</span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={closeDrawer} aria-label="Close menu"><Icon name="x" size={16}/></button>
            </div>
            <div className="mobile-drawer-body">
              {NAV_ITEMS.map((n) => (
                <Link key={n.to} to={n.to} onClick={closeDrawer} className={"mobile-drawer-link " + (isActive(n.to)?'active':'')}>
                  <span>{n.label}</span>
                  <Icon name="arrow-right" size={13}/>
                </Link>
              ))}
              <div className="hairline" style={{margin:'12px 0'}}></div>
              <Link to="/dashboard" onClick={closeDrawer} className="mobile-drawer-link"><span>Dashboard</span><Icon name="layout-dashboard" size={13}/></Link>
              <Link to="/pricing" onClick={closeDrawer} className="mobile-drawer-link"><span>Pricing</span><Icon name="credit-card" size={13}/></Link>
              <Link to="/api" onClick={closeDrawer} className="mobile-drawer-link"><span>API Docs</span><Icon name="braces" size={13}/></Link>
              {isAuthenticated ? (
                <button onClick={handleSignOut} className="mobile-drawer-link">
                  <span>Sign out · {displayName}</span>
                  <Icon name="log-out" size={13}/>
                </button>
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
  const submit = (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('Enter a valid email address.');
      notify('Enter a valid email address.', 'warning');
      return;
    }
    setStatus('You are on the list.');
    notify('Subscription recorded.');
    setEmail('');
  };
  return (
    <form className="news-strip" onSubmit={submit}>
      <span className="pulse"></span>
      <span className="micro" style={{color:'var(--red)'}}>The Pricing Letter</span>
      <span className="mute" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11.5}}>
        Weekly · Black-Scholes, smile dynamics, recent quant interview seeds. Free.
      </span>
      <div style={{flex:1}}></div>
      {status && <span className="mono green" style={{fontSize:11}}>{status}</span>}
      <input value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@desk.com" style={{background:'#06080B',border:'1px solid var(--line-2)',color:'var(--text)',padding:'5px 10px',borderRadius:3,fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,width:200,outline:'none'}}/>
      <button className="btn btn-primary btn-sm" type="submit">Subscribe</button>
    </form>
  );
}

function Footer() {
  return (
    <footer className="site">
      <div className="foot-grid">
        <div>
          <Link to="/" className="brand" style={{marginBottom:14}}>
            <span className="brand-mark"></span>
            <span>THE PRICING LIBRARY</span>
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
            <li><Link to="/admin">Admin</Link></li>
            <li><Link to="/404">Not Found</Link></li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <div>© 2026 The Pricing Library · All rights reserved</div>
        <div className="row" style={{gap:18}}>
          <span>Educational platform · Not investment advice</span>
          <span>·</span>
          <span>Built in Paris · NY · Singapore</span>
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
  const t = TIER_BADGE[tier];
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
function LineChart({series, width=420, height=200, yAxis=true, xAxis=true, grid=true, fill=true, padX=8, smooth=false}) {
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
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{display:'block',fontFamily:"'JetBrains Mono',monospace"}}>
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
      <line x1={ML} y1={MT} x2={ML} y2={height-MB} stroke="#2C3340"/>
      <line x1={ML} y1={height-MB} x2={width-MR} y2={height-MB} stroke="#2C3340"/>

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
    data.push({r,c, v: gen ? gen(r,c,rows,cols) : 0.15 + 0.08*Math.cos((c-cols/2)/cols*Math.PI*2) + 0.04*(r/rows) + 0.03*Math.random()});
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
    bids.push({px:pBid, sz: Math.floor(50+Math.random()*450)});
    asks.push({px:pAsk, sz: Math.floor(50+Math.random()*450)});
    pBid -= 0.01 + Math.random()*0.02;
    pAsk += 0.01 + Math.random()*0.02;
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
    <div>
      <NewsletterStrip/>
      <div className="container">
        <HeroBlock/>
        <BuiltForBlock/>
        <CurriculumPreview/>
        <ToolsPreview/>
        <CommunityPreview/>
        <FinalCTA/>
      </div>
    </div>
  );
}

function HeroBlock() {
  const walk = useMemo(() => genWalk(120, 100, 0.014, 0.0006, 7), []);
  const walk2 = useMemo(() => genWalk(120, 100, 0.011, 0.0002, 19), []);
  return (
    <div className="hero-grid">
      <div className="hero-left">
        <div className="hero-eyebrow">
          <span className="dot dot-red"></span>
          <span>Quant Finance · Option Pricing · 2026</span>
        </div>
        <h1 className="hero-title">Master Option Pricing<br/><span className="accent">From Theory</span> to Code.</h1>
        <p className="hero-sub">
          A dense, terminal-grade platform for learning derivatives — closed-form models, stochastic calculus,
          calibration, exotic payoffs and Monte Carlo. Built by quants, for aspiring quants.
        </p>
        <div className="hero-ctas">
          <Link to="/courses" className="btn btn-primary">Start Learning<Icon name="arrow-right" size={14}/></Link>
          <Link to="/tools" className="btn btn-outline">Explore Tools<Icon name="terminal" size={14}/></Link>
          <Link to="/survival" className="btn btn-ghost">Survival Mode<Icon name="zap" size={14}/></Link>
        </div>
        <div className="kpi-row">
          <div className="kpi"><div className="num">9+</div><div className="lbl">Courses</div></div>
          <div className="kpi"><div className="num">50+</div><div className="lbl">Exercises</div></div>
          <div className="kpi"><div className="num">9</div><div className="lbl">Tools</div></div>
          <div className="kpi"><div className="num">9€</div><div className="lbl">Starter Plan</div></div>
        </div>
      </div>
      <div className="hero-right">
        <div className="term-toolbar">
          <div className="row" style={{gap:14}}>
            <span style={{color:'var(--red)',fontWeight:700}}>BS&lt;GO&gt;</span>
            <span>EUR · CALL · SPX Index</span>
            <span className="mute">K=5900 · T=30d</span>
          </div>
          <div className="row" style={{gap:10}}>
            <span className="green">● LIVE</span>
            <span className="mute">15:42:18</span>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:0, flex:1}}>
          <div style={{borderRight:'1px solid var(--line)', display:'flex', flexDirection:'column'}}>
            <div style={{padding:'10px 12px', borderBottom:'1px solid var(--line)'}}>
              <div className="row between">
                <div>
                  <div className="label">SPX · spot vs theoretical</div>
                  <div className="row" style={{gap:14, marginTop:4}}>
                    <span className="mono" style={{fontSize:18,fontWeight:700}}>5,872.34</span>
                    <span className="badge badge-green">+0.31%</span>
                    <span className="mono mute" style={{fontSize:11}}>σ=14.2 · 30d</span>
                  </div>
                </div>
                <div className="mono mute" style={{fontSize:10.5}}>HV5 12.4 · HV20 13.8 · HV60 15.2</div>
              </div>
            </div>
            <div style={{flex:1,padding:'4px 6px'}}>
              <LineChart series={[
                {name:'spot', color:'#FF2E45', data:walk, fillOpacity:0.1},
                {name:'theo', color:'#3E8BFF', data:walk2, dashed:true, fill:false},
              ]} width={500} height={240}/>
            </div>
            <div className="row" style={{borderTop:'1px solid var(--line)', padding:'8px 12px', gap:18}}>
              {['delta 0.512','gamma 0.018','vega 6.42','theta -0.34','rho 1.21'].map((g,i)=>(
                <span key={i} className="mono" style={{fontSize:10.5}}>
                  <span className="mute" style={{marginRight:4}}>{g.split(' ')[0]}</span>
                  <span>{g.split(' ')[1]}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column'}}>
            <div style={{padding:'10px 12px', borderBottom:'1px solid var(--line)'}}>
              <div className="label">Vol Surface · SPX</div>
              <div className="mono mute" style={{fontSize:10.5,marginTop:4}}>Strike × Tenor → σ</div>
            </div>
            <div style={{flex:1, padding:4}}>
              <HeatmapChart width={300} height={150} rows={6} cols={10}/>
            </div>
            <div style={{borderTop:'1px solid var(--line)', padding:'8px 0'}}>
              <div className="label" style={{padding:'0 12px',marginBottom:6}}>Order Book · SPX 5900C</div>
              <OrderBook/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuiltForBlock() {
  const items = [
    {ic:'graduation-cap', t:'Aspiring Quants', d:'Targeting desks at top funds, market-makers, and prop shops.'},
    {ic:'briefcase', t:'Career Switchers', d:'From engineering or pure math into pricing & risk.'},
    {ic:'building-2', t:'Practitioners', d:'Active traders who want to read between the screens.'},
    {ic:'book-open', t:'Curious Minds', d:'Researchers and students sharpening their applied skills.'},
  ];
  return (
    <section className="section">
      <div className="section-eyebrow">// 01 · Audience</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Built for aspiring quants.</h2>
          <p className="text-2" style={{marginTop:8, maxWidth:'52ch'}}>The platform mirrors a trading floor cockpit. You learn the way you'll work — with code, data, and live numerics.</p>
        </div>
        <Link to="/about" className="btn btn-ghost btn-sm">About the platform <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-4">
        {items.map(it=>(
          <div key={it.t} className="panel" style={{padding:18}}>
            <div className="row" style={{color:'var(--red)', marginBottom:14}}>
              <Icon name={it.ic} size={18}/>
            </div>
            <div className="mono" style={{fontWeight:700, fontSize:14, marginBottom:6}}>{it.t}</div>
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
    <section className="section">
      <div className="section-eyebrow">// 02 · Curriculum</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Module preview.</h2>
          <p className="text-2" style={{marginTop:8}}>Three tiers · Fundamentals, Advanced, Complex.</p>
        </div>
        <Link to="/courses" className="btn btn-outline btn-sm">All courses <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-3">
        {featured.map(c => <CourseCard key={c.id} c={c}/>)}
      </div>
    </section>
  );
}

function ToolsPreview() {
  const ts = TOOLS.slice(0,4);
  return (
    <section className="section">
      <div className="section-eyebrow">// 03 · Tools</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">Professional tools — usable.</h2>
          <p className="text-2" style={{marginTop:8}}>Not screenshots. Real calculators with inputs, charts, and Greeks.</p>
        </div>
        <Link to="/tools" className="btn btn-outline btn-sm">All tools <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-4">
        {ts.map(t=>(
          <Link to={"/tools/"+t.id} key={t.id} className="course-card" style={{textDecoration:'none'}}>
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
    <section className="section">
      <div className="section-eyebrow">// 04 · Community</div>
      <div className="section-head">
        <div>
          <h2 className="section-title">A community of practitioners.</h2>
          <p className="text-2" style={{marginTop:8}}>Forums, projects, peer review. Built where the conversation actually happens.</p>
        </div>
        <Link to="/community" className="btn btn-outline btn-sm">Enter community <Icon name="arrow-right" size={13}/></Link>
      </div>
      <div className="grid-3">
        <div className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="label">Forum · Most Active</div>
            <span className="badge badge-red">LIVE · 142</span>
          </div>
          {[
            {t:'Negative IV from market call quotes?', r:18, c:'Volatility'},
            {t:'Heston calibration converges to garbage', r:24, c:'Models'},
            {t:'Anyone using QuantLib 1.34 in prod?', r:9, c:'Tooling'},
          ].map((f,i)=>(
            <div key={i} className="row between" style={{padding:'10px 0', borderTop:i?'1px solid var(--line)':'none'}}>
              <div>
                <div style={{fontWeight:600}}>{f.t}</div>
                <div className="mono mute" style={{fontSize:10.5, marginTop:4}}>{f.c}</div>
              </div>
              <div className="mute mono" style={{fontSize:11}}>{f.r} replies</div>
            </div>
          ))}
        </div>
        <div className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="label">Leaderboard · Q2</div>
            <span className="badge">TOP 5</span>
          </div>
          {[
            {n:'@quantfox', s:'18,420', f:false},
            {n:'@nu_oresund', s:'17,116', f:false},
            {n:'@vega_neutral', s:'15,902', f:false},
            {n:'@theta_burn', s:'14,701', f:false},
            {n:'@you', s:'4,218', f:true},
          ].map((u,i)=>(
            <div key={i} className="row between" style={{padding:'10px 0', borderTop:i?'1px solid var(--line)':'none', color: u.f ? 'var(--red)':undefined}}>
              <div className="row" style={{gap:10}}>
                <span className="mono mute" style={{width:18}}>#{i+1}</span>
                <span style={{fontWeight: u.f?700:500}}>{u.n}</span>
              </div>
              <span className="mono">{u.s}</span>
            </div>
          ))}
        </div>
        <div className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="label">This Week's Challenge</div>
            <span className="badge badge-amber">156 SUBMITTED</span>
          </div>
          <div className="mono" style={{fontSize:16, fontWeight:700, marginBottom:8}}>Price a Down-and-Out Call</div>
          <p className="text-2" style={{fontSize:12.5,lineHeight:1.5}}>S=100, K=100, H=85, σ=20%, r=2%, T=6m. Use closed-form (Merton 1973) and verify with 100k MC paths. Submit notebook by Sunday 23:59 UTC.</p>
          <div className="row between" style={{marginTop:16}}>
            <span className="mono mute" style={{fontSize:11}}>Reward · 250 XP + Badge</span>
            <Link to="/challenge" className="btn btn-outline btn-sm">Enter <Icon name="arrow-right" size={13}/></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section">
      <div className="panel" style={{padding:'48px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:30, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', right:-40, top:-40, opacity:0.06, fontFamily:"'JetBrains Mono',monospace", fontSize:280, fontWeight:700, color:'#FF2E45'}}>σ</div>
        <div style={{position:'relative', maxWidth:'60ch'}}>
          <div className="section-eyebrow" style={{margin:0}}>// 05 · Get on the desk</div>
          <h2 className="section-title" style={{fontSize:32, marginTop:8}}>Start serious desk practice at 9€.</h2>
          <p className="text-2" style={{marginTop:10, fontSize:14}}>
            Starter gives the core curriculum, practical exercises and calculators. Upgrade when you need advanced products, notebooks and professional workflow tools.
          </p>
        </div>
        <div className="row" style={{gap:10, position:'relative', flexShrink:0}}>
          <Link to="/auth/signup" className="btn btn-primary">Choose a plan <Icon name="arrow-right" size={14}/></Link>
          <Link to="/pricing" className="btn btn-outline">See plans</Link>
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
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ courses</span></>}
        title="Course Catalogue"
        sub="A structured curriculum across three tiers. Start from Fundamentals or jump to Complex if you have the prerequisites."
        right={
          <>
            <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search modules…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
            <button className="btn btn-outline btn-sm" onClick={()=>{setTab('All'); setQuery('');}}><Icon name="sliders-horizontal" size={13}/> Reset</button>
          </>
        }
      />
      <div className="tabs-bar">
        {tiers.map(t=>(
          <button key={t} className={"tab-btn "+(tab===t?'on':'')} onClick={()=>setTab(t)}>
            {t} <span className="mute" style={{marginLeft:6}}>{t==='All' ? COURSES.length : COURSES.filter(c=>c.tier===t).length}</span>
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid-3">
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
  if (id==='vol-products') {
    const d = useMemo(()=>genWalk(60, 18, 0.045, 0.0001, 9),[]);
    return <ChartThumb data={d} color={acc}/>;
  }
  if (id==='hedging') {
    return (
      <svg viewBox="0 0 200 100" width="100%" height="100%" style={{padding:10}}>
        <path d="M 0,50 L 50,50 L 100,30 L 150,55 L 200,40" fill="none" stroke={acc} strokeWidth="1.5"/>
        <path d="M 0,55 L 50,55 L 100,35 L 150,60 L 200,45" fill="none" stroke="#7C8493" strokeWidth="1" strokeDasharray="2 2"/>
        <text x="6" y="92" fill="#7C8493" fontSize="8" fontFamily="JetBrains Mono">P&amp;L vs replicating</text>
      </svg>
    );
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
const COURSE_TIER_PLAN = { Fundamentals:'free', Foundation:'free', Core:'free', Advanced:'student', Complex:'pro' };
const PLAN_LABEL = { free:'Free', starter:'Starter', student:'Student', pro:'Professional' };
function useEntitlement() {
  let auth=null; try { auth=useAuth(); } catch { auth=null; }
  return {
    plan: auth?.plan || 'free',
    isAuthed: !!auth?.isAuthenticated,
    has: (required)=> required==='free' ? true : (auth?.hasPlan ? auth.hasPlan(required) : false),
  };
}
function LockPanel({required, what='This content'}) {
  return (
    <div className="panel" style={{padding:48, textAlign:'center'}}>
      <Icon name="lock" size={30} style={{color:'var(--red)'}}/>
      <h2 className="mono" style={{fontSize:20,fontWeight:700,marginTop:16}}>{PLAN_LABEL[required]||required} plan required</h2>
      <p className="text-2" style={{maxWidth:'46ch',margin:'10px auto 22px',fontSize:13.5}}>{what} is part of the {PLAN_LABEL[required]||required} tier. Upgrade to unlock it — your progress and account stay the same.</p>
      <Link to="/pricing" className="btn btn-primary">See plans <Icon name="arrow-right" size={13}/></Link>
    </div>
  );
}

// ============== COURSE DETAIL ==============
const _progressSent = new Set();
export function recordProgressOnce(auth, kind, ref, score, meta) {
  try {
    const uid = auth?.user?.id || auth?.user?.email; if (!uid) return;
    const key = `${kind}:${ref}`; if (_progressSent.has(key)) return; _progressSent.add(key);
    const username = auth?.profile?.prenom || (auth?.user?.email ? auth.user.email.split('@')[0] : 'learner');
    platformApi.recordProgress({ user_id: uid, username, kind, ref, score: score ?? null, meta: meta || {} });
  } catch { /* progress is best-effort */ }
}
function CourseDetailPage({route}) {
  const id = route.parts[1] || 'black-scholes';
  const c = COURSES.find(x=>x.id===id) || COURSES[0];
  let auth=null; try { auth = useAuth(); } catch { auth=null; }
  const ent = useEntitlement();
  const requiredPlan = COURSE_TIER_PLAN[c.tier] || 'free';
  const locked = requiredPlan!=='free' && !ent.has(requiredPlan);
  const [tab, setTab] = useState('content');
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const scriptState = useCourseScript(c.id);
  const scriptModel = useMemo(
    () => scriptState.status === 'ready' ? parseCourseScript(scriptState.content) : null,
    [scriptState.status, scriptState.content]
  );

  useEffect(() => {
    setSelectedModuleIndex(0);
    setTab('content');
  }, [c.id]);

  useEffect(() => {
    if (scriptState.status === 'ready') recordProgressOnce(auth, 'lesson', `${c.id}#L0`, 5, { course: c.id });
  }, [scriptState.status, auth, c.id]);

  const openModule = useCallback((index) => {
    setSelectedModuleIndex(index);
    setTab('content');
    recordProgressOnce(auth, 'lesson', `${c.id}#L${index}`, 5, { course: c.id });
  }, [auth, c.id]);

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
          <button className="btn btn-primary btn-sm" onClick={()=>{openModule(selectedModuleIndex); notify(`Opening ${c.title} module ${selectedModuleIndex + 1}.`)}}>Resume <Icon name="play" size={13}/></button>
        </>}
      />

      <div className="course-detail-layout">
        <CourseSidebar
          c={c}
          scriptModel={scriptModel}
          selectedModuleIndex={selectedModuleIndex}
          onSelectModule={openModule}
          onOpenScript={()=>setTab('script')}
          onOpenResources={()=>setTab('resources')}
        />
        <div>
          <div className="tabs-bar">
            {[
              ['content','Content'],
              ['script','Script'],
              ['calc','Calculator'],
              ['exercises','Exercises'],
              ['resources','Resources'],
            ].map(([k,l])=>(
              <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
          {tab==='content' && <CourseContent c={c} scriptState={scriptState} scriptModel={scriptModel} selectedModuleIndex={selectedModuleIndex} onSelectModule={openModule} onOpenScript={()=>setTab('script')}/>}
          {tab==='script' && (locked ? <LockPanel required={requiredPlan} what={`The full ${c.title} script`}/> : <CourseScript c={c} scriptState={scriptState} scriptModel={scriptModel}/>)}
          {tab==='calc' && (locked ? <LockPanel required={requiredPlan} what="The interactive calculator"/> : <CourseCalculator c={c}/>)}
          {tab==='exercises' && (locked ? <LockPanel required={requiredPlan} what="The graded exercises"/> : <CourseExercises c={c}/>)}
          {tab==='resources' && <CourseResources c={c} scriptModel={scriptModel}/>}
        </div>
      </div>
    </div>
  );
}

function useCourseScript(courseId) {
  const scriptSlug = COURSE_SCRIPT_SLUGS[courseId];
  const [script, setScript] = useState({status:'loading', content:'', error:''});

  useEffect(() => {
    if (!scriptSlug) {
      setScript({status:'missing', content:'', error:''});
      return undefined;
    }

    const controller = new AbortController();
    setScript({status:'loading', content:'', error:''});
    fetch(`/course-scripts/${scriptSlug}.md`, {signal: controller.signal})
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((content) => setScript({status:'ready', content, error:''}))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setScript({status:'error', content:'', error:error.message || 'Course script unavailable'});
        }
      });

    return () => controller.abort();
  }, [scriptSlug]);

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
    labs: parseNumberedSection(clean, 'Labs pratiques a inclure'),
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
const _SKIP_H2 = /^(promesse|niveau cible|public|prerequis|objectifs|positionnement|legende|provenance|source\s*map|sources?\b|table des|sommaire)/i;
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
  const section = markdownSection(markdown, 'Cours redige');
  const blocks = splitMarkdownHeadingBlocks(section, /^### Lecon\s+(\d+)\s+-\s+(.+?)\s*\r?\n/gm);
  if (blocks.length) {
    return blocks.map((block)=>({ number: Number(block.number), title: block.title.trim(), body: block.body.trim() }));
  }
  return parseH2Chapters(markdown);  // Hull-structure fallback
}

function parseScriptModules(markdown) {
  const section = markdownSection(markdown, 'Deroule pratique');
  const blocks = splitMarkdownHeadingBlocks(section, /^### Module\s+(\d+)\s+-\s+(.+?)\s*\r?\n/gm);
  if (blocks.length) {
    return blocks.map((block) => {
      const fields = parseDeskBullets(block.body);
      return {
        number: Number(block.number), title: block.title.trim(), fields,
        objective: fields['Objectif pratique'] || '', situation: fields['Situation de desk'] || '',
        notion: fields['Notion utile'] || '', activity: fields.Activite || '',
        deliverable: fields['Livrable apprenant'] || '', raw: block.body.trim(),
      };
    });
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
    const match = line.match(/^-\s*([^:]+):\s*(.+)$/);
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
  const section = markdownSection(markdown, 'Source Appendix') || markdownSection(markdown, 'Sources RAG a citer');
  return section
    .split(/\r?\n/)
    .map((line) => parseSourceLine(line))
    .filter(Boolean);
}

// Robust to both the current backend format
//   - [S1] Title, chunk 58, score 0.65: clean excerpt
//   - [S2] Title, chunk 9, score 0.4 (extrait non cite: source bruitee)
// and the legacy parenthesised format
//   - [S1] Title (chunk 58, score 0.65)
// Never folds the excerpt (or noise) into the title.
export function parseSourceLine(line) {
  if (!line) return null;
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

function CourseSidebar({c, scriptModel, selectedModuleIndex = 0, onSelectModule, onOpenScript, onOpenResources}) {
  const blueprint = getCourseBlueprint(c.id);
  const lessons = scriptModel?.modules?.length
    ? scriptModel.modules.map((module,idx)=>({
        n: String(idx + 1).padStart(2, '0'),
        t: module.title,
        d: normalizeCourseMicrocopy(module.deliverable || module.objective || 'Livrable de desk'),
      }))
    : (blueprint?.lessons || blueprint?.modules || [
        {n:'01', t:'Desk setup', d:'Inputs, market context and first calculation'},
        {n:'02', t:'Risk read', d:'Sensitivities and scenario interpretation'},
        {n:'03', t:'Desk action', d:'Hedge, quote, monitor or escalate'},
      ]).map((lesson,idx)=>({
        n: lesson.n || String(idx + 1).padStart(2, '0'),
        t: lesson.t,
        d: lesson.d,
      }));
  const unlockedCount = lessons.length;
  return (
    <div className="course-sidebar">
      <div className="panel" style={{padding:16, marginBottom:16}}>
        <div className="label" style={{marginBottom:10}}>Your progress</div>
        <div className="row between" style={{marginBottom:6}}>
          <span className="mono" style={{fontSize:18,fontWeight:700}}>Module {Math.min(selectedModuleIndex+1, unlockedCount)}</span>
          <span className="mono mute" style={{fontSize:11}}>of {unlockedCount}</span>
        </div>
        <div style={{height:3,background:'var(--line)',borderRadius:0}}>
          <div style={{height:'100%',width:`${unlockedCount?Math.round((Math.min(selectedModuleIndex+1,unlockedCount))/unlockedCount*100):0}%`,background:'var(--red)'}}></div>
        </div>
      </div>
      <div className="panel">
        <div className="label" style={{padding:'14px 14px 8px'}}>Open modules</div>
        {lessons.map((l,idx) => {
          const active = idx === selectedModuleIndex;
          return (
          <button key={`${l.n}-${l.t}`} type="button" className={`course-lesson-item ${active ? 'active' : ''}`} onClick={()=>onSelectModule?.(idx)}>
            <span className="mono mute" style={{fontSize:11, minWidth:22}}>{l.n}</span>
            <div style={{flex:1}}>
              <div className="course-lesson-title">{l.t}</div>
              <div className="mono mute" style={{fontSize:10.5,marginTop:2}}>{l.d}</div>
            </div>
            <Icon name={active?'play':'circle'} size={12} style={{color: active?'var(--red)':'var(--steel)', marginTop:2}}/>
          </button>
        )})}
      </div>
      <div className="panel" style={{padding:14,marginTop:16}}>
        <div className="label" style={{marginBottom:8}}>Course desk</div>
        <div className="col" style={{gap:6}}>
          <button type="button" className="course-side-action" onClick={onOpenScript}><span>Full script</span><Icon name="file-text" size={13}/></button>
          <button type="button" className="course-side-action" onClick={onOpenResources}><span>RAG sources</span><Icon name="database" size={13}/></button>
          <Link to="/exercises" className="course-side-action"><span>Practice cases</span><Icon name="arrow-right" size={13}/></Link>
        </div>
      </div>
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
      <input value={obj[k]} onChange={(e) => set((p) => ({ ...p, [k]: num(e) }))}
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
  const blueprint = getCourseBlueprint(c.id);
  if (blueprint) {
    return (
      <PracticeCourseContent
        c={c}
        blueprint={blueprint}
        scriptState={scriptState}
        scriptModel={scriptModel}
        selectedModuleIndex={selectedModuleIndex}
        onSelectModule={onSelectModule}
        onOpenScript={onOpenScript}
      />
    );
  }
  if (c.id === 'black-scholes') return <BSContent/>;
  if (c.id === 'yield-curves') return <YCContent/>;
  if (c.id === 'greeks') return <GreeksContent/>;
  if (c.id === 'implied-vol') return <IVContent/>;
  if (c.id === 'exotics') return <ExoticsContent/>;
  if (c.id === 'monte-carlo') return <MCContent/>;
  if (c.id === 'hedging') return <HedgingContent/>;
  // generic fallback
  return <GenericContent c={c}/>;
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
  const scriptUrl = `/course-scripts/${scriptSlug}.md`;

  return (
    <div className="col course-script-shell" style={{gap:14}}>
      <div className="panel course-script-hero">
        <div>
          <div className="section-eyebrow" style={{margin:0}}>// Generated desk course</div>
          <h2 className="mono">{c.title} · course script</h2>
          <p className="text-2">
            Script construit depuis la base RAG locale, avec formules LaTeX, cas pratiques, livrables et sources rattachees.
          </p>
          <div className="row" style={{gap:8,flexWrap:'wrap',marginTop:14}}>
            <span className="badge">{formulaCount} formulas</span>
            <span className="badge">{sourceCount} sources</span>
            <span className="badge">{c.level} · {c.duration}</span>
          </div>
        </div>
        <a className="btn btn-outline btn-sm" href={scriptUrl} target="_blank" rel="noreferrer">
          Open MD <Icon name="external-link" size={13}/>
        </a>
      </div>
      <div className="panel course-script-panel">
        <LatexMarkdown content={scriptState.content}/>
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
  if (mp) { try { out.params = JSON.parse(mp[1].replace(/([{,]\s*)([a-zA-Z_][\w]*)\s*:/g,'$1"$2":').replace(/'/g,'"')); } catch(e){ out.params = {}; } }
  return out;
}

const RAG_API = (import.meta.env.VITE_TPL_RAG_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/,'');

const TONE_COLOR = { blue:'var(--blue)', amber:'var(--amber)', green:'var(--green)', red:'var(--red)' };

// Real price history. Tries the backend market API first (live AAPL etc.); when
// no backend is reachable, falls back to the bundled farmed series so the chart
// still renders genuine history offline. Renders through the real LineChart.
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
          setData({label:symbol, closes, src:`${(j.rows||closes.length).toLocaleString()} real bars`});
        } else throw new Error('no-backend');
      })
      .catch(()=>{ loadDeskSeries().then(b=>{
        if(!ok) return;
        const key=SYMBOL_ALIAS[symbol]||'SPX';
        const s=b.series?.[key];
        if(s&&s.points?.length) setData({label:s.label, closes:s.points.map(p=>p.c), src:s.source, range:[s.points[0].d, s.points[s.points.length-1].d]});
      }); });
    return ()=>{ok=false;};
  },[symbol,points]);
  if(!data) return <div className="mute mono" style={{fontSize:12,padding:14}}>Chargement de l'historique de prix reel…</div>;
  const series=[{name:data.label,color:'var(--blue)',data:data.closes.map((y,i)=>({x:i,y}))}];
  const last=data.closes[data.closes.length-1];
  return (<div><LineChart series={series} xAxis={false} height={160}/><div className="mono mute" style={{fontSize:11,marginTop:6}}>{data.label} · {data.src}{data.range?` · ${data.range[0]} → ${data.range[1]}`:''} · dernier {fmt(last)}</div></div>);
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
  if(!bundle) return <div className="panel" style={{padding:16,margin:'14px 0'}}><div className="mute mono" style={{fontSize:12}}>Chargement des donnees de marche reelles…</div></div>;
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
          <div className="label">Donnee de marche reelle</div>
          <h4 className="mono" style={{margin:'4px 0 0',fontSize:14}}>{prim.label}</h4>
        </div>
        <span className="badge" style={{background:'rgba(25,195,125,.08)',color:'var(--green)'}}>farmed cache · {prim.source}</span>
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
    </div>
  );
}

function UIScenarioTable(props) {
  const { rows, cols, cells, rowLabel } = props;
  // Generic engine-fed grid: a course supplies explicit rows/cols/cells (real
  // rate-shock / VaR / KRD01 numbers) instead of the Black-Scholes option grid.
  if (Array.isArray(rows) && Array.isArray(cols) && Array.isArray(cells)) {
    return (<table className="data"><thead><tr><th>{rowLabel||''}</th>{cols.map((c,i)=><th key={i} className="num">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={i}><td className="symbol">{r}</td>{(cells[i]||[]).map((v,j)=>{ const neg=String(v).trim().startsWith('-'); return <td key={j} className="num" style={neg?{color:'var(--red)'}:undefined}>{String(v)}</td>; })}</tr>)}</tbody></table>);
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
      <input value={obj[k]} onChange={(e) => set((p) => ({ ...p, [k]: num(e) }))}
        style={{ width: '100%', background: '#0A0C10', border: '1px solid var(--line-2)', padding: '7px 9px', borderRadius: 3, color: 'var(--text)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }} />
    </div>
  );
  return (
    <div className="grid-2">
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

function UICorrMatrix({ labels = [], matrix = [] }) {
  const col = (v) => { const x = Math.max(-1, Math.min(1, Number(v) || 0)), a = Math.abs(x);
    return x >= 0 ? `rgba(46,204,113,${0.10 + 0.55 * a})` : `rgba(255,46,69,${0.10 + 0.55 * a})`; };
  return (<table className="data" style={{ fontSize: 11 }}><thead><tr><th></th>{labels.map((l, i) => <th key={i} className="num">{l}</th>)}</tr></thead>
    <tbody>{matrix.map((row, i) => <tr key={i}><td className="symbol">{labels[i]}</td>{row.map((v, j) => <td key={j} className="num" style={{ background: col(v), color: 'var(--text)' }}>{Number(v).toFixed(2)}</td>)}</tr>)}</tbody></table>);
}

function UIPayoffChart({ spot=100, strike=100, kind='call', premium=0, qty=1, title='' }) {
  const S0 = Math.max(1e-6, Number(spot) || 100);
  const K = Math.max(1e-6, Number(strike) || S0);
  const q = Number(qty) || 1;
  const prem = Number(premium) || 0;
  const side = String(kind || '').toLowerCase().includes('put') ? 'put' : 'call';
  const lo = Math.min(S0, K) * 0.55;
  const hi = Math.max(S0, K) * 1.55;
  const xs = Array.from({ length: 81 }, (_, i) => lo + (hi - lo) * i / 80);
  const payoffValue = (x) => q * ((side === 'put' ? Math.max(K - x, 0) : Math.max(x - K, 0)) - prem);
  const payoff = xs.map((x) => ({ x, y: payoffValue(x) }));
  const breakevens = [];
  for (let i = 1; i < payoff.length; i += 1) {
    const a = payoff[i - 1], b = payoff[i];
    if (Math.abs(a.y) < 1e-8) breakevens.push(a.x);
    if (a.y * b.y < 0) breakevens.push(a.x - a.y * (b.x - a.x) / (b.y - a.y));
  }
  const legs = [{ id: 'course-payoff', K, side: 'long', type: side, qty: q, prem }];
  const maxGain = Math.max(...payoff.map((p) => p.y));
  const maxLoss = Math.min(...payoff.map((p) => p.y));
  return (
    <div className="ui-payoff-widget">
      <PayoffChart payoff={payoff} breakevens={breakevens.slice(0, 3)} legs={legs}/>
      <div className="payoff-widget-stats">
        <div><span>Produit</span><strong>{title.toLowerCase().includes('barrier') ? 'Payoff conditionnel' : `${side.toUpperCase()} vanilla`}</strong></div>
        <div><span>Spot</span><strong>{fmt(S0, 2)}</strong></div>
        <div><span>Strike</span><strong>{fmt(K, 2)}</strong></div>
        <div><span>P&L min / max</span><strong>{fmt(maxLoss, 2)} / {fmt(maxGain, 2)}</strong></div>
      </div>
    </div>
  );
}

function UIBlock({ spec }) {
  const { type, title, params = {} } = spec;
  const isCDS = params && params.kind === 'cds';
  const body = (() => {
    switch(type){
      case 'greeks_scenario': return isCDS ? <CDSScenario {...params}/> : <HedgingContent {...params}/>;
      case 'payoff': return <UIPayoffChart {...params} title={title}/>;
      case 'monte_carlo': return (params && (params.mode==='var_pnl' || params.histVaR!=null)) ? <VarMCContent {...params}/> : <MCContent/>;
      case 'vol_smile': return <VolHeatmap matrix={params.matrix||TR_VOLHEAT} rowLabels={['80%','100%','120%','','']} colLabels={['1W','1M','3M','6M','1Y']} cell={20}/>;
      case 'price_chart': return <UIPriceChart symbol={params.symbol||'AAPL'} points={params.points||140}/>;
      case 'scenario_table': case 'pnl_grid': case 'rate_shock_table': case 'stress_table':
        return isCDS ? <CDSScenarioTable {...params}/> : <UIScenarioTable {...params}/>;
      case 'equation': return <LatexMarkdown content={`$$\n${params.latex||params.expression||''}\n$$`}/>;
      case 'corr_matrix': case 'covariance_matrix': return <UICorrMatrix {...params}/>;
      default: return <div className="mono mute" style={{fontSize:12}}>UI block: {type}</div>;
    }
  })();
  return (
    <div className="panel" style={{padding:18, margin:'18px 0'}}>
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
      {parts.map((p,i)=> p.t==='block'
        ? <UIBlock key={i} spec={parseUiBlock(p.v)}/>
        : <ReactMarkdown key={i} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{p.v}</ReactMarkdown>
      )}
    </div>
  );
}

function stripFrontmatter(markdown = '') {
  return markdown.replace(/^---\s*[\s\S]*?\s*---\s*/, '');
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

function PracticeCourseContent({c, blueprint, scriptState, scriptModel, selectedModuleIndex = 0, onSelectModule, onOpenScript}) {
  const modules = scriptModel?.modules?.length
    ? scriptModel.modules
    : blueprint.modules.map((module,idx)=>({
        number: idx + 1,
        title: module.t,
        objective: module.d,
        situation: blueprint.deskPromise,
        notion: c.topics.join(', '),
        activity: `Build the desk calculation for ${module.t.toLowerCase()}.`,
        deliverable: 'Desk note',
      }));
  const safeIndex = Math.min(Math.max(selectedModuleIndex, 0), Math.max(modules.length - 1, 0));
  const activeModule = modules[safeIndex];
  const formulas = scriptModel?.formulas || [];
  const uiBlocks = scriptModel?.uiBlocks || [];
  const labs = scriptModel?.labs?.length ? scriptModel.labs : blueprint.labs.map(([lab, task])=>`${lab}: ${task}`);
  const facts = scriptModel?.facts?.slice(0, 6) || [];
  const supports = scriptModel?.supports?.length ? scriptModel.supports : blueprint.resources;
  const loading = scriptState?.status === 'loading';

  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Parcours pratique salle de marche</div>
        <h2 className="mono" style={{fontSize:24,fontWeight:700,marginTop:10,marginBottom:12}}>{blueprint.deskRole}</h2>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.75,marginTop:0,maxWidth:'82ch'}}>
          {blueprint.deskPromise} Chaque module part d'un ticket ou d'un risque de marche, introduit la theorie utile,
          puis force un calcul, un controle, une lecture de risque et une action de desk.
        </p>
        <div className="row" style={{gap:8,flexWrap:'wrap',marginTop:16}}>
          <span className="badge badge-green">Modules ouverts</span>
          {(modules.length ? modules : blueprint.workflow).slice(0, 6).map((step,idx)=>(
            <span key={step.title || step} className="badge">{String(idx + 1).padStart(2,'0')} · {step.title || step}</span>
          ))}
        </div>
      </div>

      {loading && (
        <div className="panel course-script-state">
          <Icon name="loader-circle" size={16} style={{color:'var(--red)'}}/>
          <span className="mono mute">Loading generated RAG course modules...</span>
        </div>
      )}

      <CourseModuleReader
        c={c}
        module={activeModule}
        writtenLesson={scriptModel?.writtenLessons?.[safeIndex]}
        formula={formulas[safeIndex % Math.max(formulas.length, 1)]}
        uiBlocks={selectModuleUiBlocks(uiBlocks, safeIndex)}
        moduleCount={modules.length}
        selectedModuleIndex={safeIndex}
        onOpenScript={onOpenScript}
      />

      <div>
        <div className="panel" style={{padding:18}}>
          <div className="label" style={{marginBottom:14}}>Ce que l'apprenant produit</div>
          <div className="col" style={{gap:10}}>
            {[
              ['Lecture marche', 'Inputs, hypotheses et donnees manquantes sont explicites.'],
              ['Calcul', 'Les chiffres ont des unites, des signes et des controles.'],
              ['Vue risque', "L'apprenant identifie l'exposition qui compte vraiment."],
              ['Action', 'Chaque lecon finit par quote, hedge, monitor, reduce ou escalate.'],
            ].map(([title,desc])=>(
              <div key={title} className="row" style={{gap:12,alignItems:'flex-start',padding:'9px 0',borderTop:title!=='Market read'?'1px solid var(--line)':'none'}}>
                <Icon name="check" size={13} style={{color:'var(--green)',marginTop:2}}/>
                <div>
                  <div className="mono" style={{fontWeight:700,fontSize:12.5}}>{title}</div>
                  <div className="mute" style={{fontSize:12,marginTop:3,lineHeight:1.5}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel formula-bank-preview">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Formules de desk</div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenScript}>Derivation complete <Icon name="arrow-right" size={13}/></button>
          </div>
          <div className="formula-bank-list">
            {formulas.length ? formulas.map((formula)=>(
              <div key={formula.number} className="formula-card">
                <div className="row between" style={{marginBottom:8}}>
                  <strong className="mono">{formula.title}</strong>
                  <span className="badge">F{formula.number}</span>
                </div>
                <LatexMarkdown content={`$$\n${formula.expression}\n$$\n${formula.usage}`}/>
              </div>
            )) : (
              <div className="mute" style={{fontSize:12.5,lineHeight:1.6,padding:16}}>Formula bank is loading from the generated script.</div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Labs pratiques</div>
            <Link to="/exercises" className="btn btn-outline btn-sm">Cas pratiques <Icon name="arrow-right" size={13}/></Link>
          </div>
          <div className="course-lab-list">
            {labs.map((lab,idx)=>(
              <div key={lab} className="course-lab-item">
                <span className="mono">{String(idx + 1).padStart(2,'0')}</span>
                <p>{lab}</p>
              </div>
            ))}
          </div>
        </div>
      </div>


      <div className="grid-2">
        <div className="panel" style={{padding:18}}>
          <div className="label" style={{marginBottom:12}}>Angles extraits des ouvrages</div>
          <div className="course-source-facts">
            {(facts.length ? facts : supports).slice(0,6).map((fact,idx)=>(
              <div key={`${idx}-${fact}`} className="row" style={{gap:10,alignItems:'flex-start'}}>
                <Icon name="quote" size={13} style={{color:'var(--red)',marginTop:3,flexShrink:0}}/>
                <p>{fact}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel" style={{padding:18}}>
          <div className="label" style={{marginBottom:12}}>Supports produits par le cours</div>
          <div className="course-support-list">
            {supports.slice(0,6).map((support,idx)=>(
              <div key={`${idx}-${support}`} className="row between">
                <span>{support}</span>
                <Icon name={idx % 2 ? 'file-text' : 'book-open'} size={13} style={{color:'var(--mute)'}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function selectModuleUiBlocks(uiBlocks = [], selectedModuleIndex = 0) {
  if (!uiBlocks.length) return [];
  const practicalBlocks = uiBlocks.filter((block) => block.type !== 'equation');
  const primary = practicalBlocks[selectedModuleIndex % Math.max(practicalBlocks.length, 1)] || uiBlocks[selectedModuleIndex % uiBlocks.length];
  const equation = uiBlocks.find((block) => block.type === 'equation');
  const picked = [primary, equation].filter(Boolean);
  return picked.filter((block, index) => picked.findIndex((item) => item.number === block.number) === index).slice(0, 2);
}

function normalizeCourseMicrocopy(value = '') {
  const text = String(value || '').trim();
  if (/^Risk snapshot\.?$/i.test(text)) return 'Note de risque: facteur dominant, unite, controle, action.';
  if (text === 'Desk note') return 'Note de desk: resultat, controle, limite, decision.';
  if (text === 'Desk deliverable') return 'Livrable de desk verifiable.';
  return text;
}

function courseWordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function CourseModuleReader({c, module, writtenLesson, formula, uiBlocks = [], moduleCount, selectedModuleIndex, onOpenScript}) {
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
          <p className="text-2">{module.objective || module.situation || 'Module pratique construit depuis les sources de la bibliotheque.'}</p>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}>
          {lessonWords > 0 && <span className="badge">{lessonWords} mots</span>}
          {uiBlocks.length > 0 && <span className="badge badge-blue">{uiBlocks.length} UI blocks</span>}
          <button type="button" className="btn btn-outline btn-sm" onClick={onOpenScript}>Script complet <Icon name="file-text" size={13}/></button>
          <Link to="/exercises" className="btn btn-primary btn-sm">Exercice <Icon name="arrow-right" size={13}/></Link>
        </div>
      </div>
      <div className="course-desk-fields">
        {fields.map(([label,value,icon])=>(
          <DeskField key={label} label={label} value={value} icon={icon}/>
        ))}
      </div>
      {writtenLesson?.body && (
        <CourseWrittenLessonExperience
          c={c}
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

function CourseWrittenLessonExperience({c, module, writtenLesson, formula, uiBlocks = [], lessonWords = 0, onOpenScript}) {
  const courseSlug = COURSE_SCRIPT_SLUGS[c.id] || c.id;
  const bespokeProse = getLessonProse(courseSlug, writtenLesson.number);
  const sections = bespokeProse ? buildBespokeSections(bespokeProse) : buildLessonSections(writtenLesson.body);
  const equationDemo = buildEquationDemo(c, module, formula);
  const actionText = normalizeCourseMicrocopy(module.deliverable || module.activity || 'Note de quote/risque avec decision');
  const layout = getCourseLayout(courseSlug);
  const tone = layout?.tone || 'blue';
  const showMarket = showMarketOnLesson(courseSlug, writtenLesson.number);
  const narrative = bespokeProse?.narrative;
  return (
    <div className={`course-written-lesson course-written-lesson-cockpit tone-${tone}`}>
      <div className="course-written-head">
        <div>
          <div className="label">Cours redige</div>
          <h3 className="mono course-written-title">Lecon {writtenLesson.number} - {writtenLesson.title}</h3>
          <p className="mute">{layout?.hero ? `Fil du cours: ${layout.hero}.` : 'Lecture guidee: situation, intuition, demonstration, widget, action.'}</p>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}>
          <span className="badge">{lessonWords} mots</span>
          <span className="badge badge-blue">cockpit</span>
        </div>
      </div>

      {narrative && (
        <div className="lesson-editorial">
          <LatexMarkdown content={narrative}/>
        </div>
      )}

      <div className="lesson-situation-grid">
        <div className="lesson-situation-card">
          <div className="label">Mise en situation</div>
          <p>{normalizeCourseMicrocopy(module.situation || "Le desk demande une decision chiffrable avant d'envoyer le niveau au client.")}</p>
        </div>
        <div className="lesson-situation-card">
          <div className="label">Question de valorisation</div>
          <p>{normalizeCourseMicrocopy(module.objective || "Transformer la notion en prix, risque, controle et action.")}</p>
        </div>
        <div className="lesson-situation-card">
          <div className="label">Livrable desk</div>
          <p>{actionText}</p>
        </div>
      </div>

      {!narrative && sections.length > 0 && (
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
              <div className="label">Lab interactif de marche</div>
              <p className="mute">Le widget met la notion en risque, prix, P&L ou scenario manipulable.</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenScript}>Tous les blocs <Icon name="arrow-right" size={13}/></button>
          </div>
          <div className="course-module-uiblock-grid">
            {uiBlocks.map((block) => <UIBlock key={`${block.number}-${block.type}`} spec={block}/>)}
          </div>
        </div>
      )}

      <div className="lesson-action-card">
        <div>
          <div className="label">Decision attendue</div>
          <p>Conclure par un resultat, une unite, un controle, une limite et une action: quote, hedge, monitor, reduce, reject ou escalate.</p>
        </div>
        <Icon name="clipboard-check" size={18}/>
      </div>
    </div>
  );
}

function buildLessonSections(body = '') {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((item) => stripNoiseCitations(item).trim())
    .filter(Boolean)
    .filter((p) => !_LESSON_BOILERPLATE.test(p));
  const buckets = [
    { title: 'Intuition marche', icon: 'activity', items: paragraphs.slice(0, 2) },
    { title: 'Mecanisme quantitatif', icon: 'sigma', items: paragraphs.slice(2, 4) },
    { title: 'Mise en pratique et controle', icon: 'target', items: paragraphs.slice(4) },
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

function buildEquationDemo(c, module, formula) {
  if (!formula?.expression) return null;
  // Prefer a rigorous, formula-specific proof when one is authored; otherwise
  // fall back to the generic family-level outline (no regression).
  const slug = COURSE_SCRIPT_SLUGS[c.id] || c.id;
  const real = getDerivation(slug, formula);
  if (real) {
    return {
      title: formula.title,
      expression: real.expression,
      assumption: real.assumption,
      steps: real.steps,
      result: real.result,
      desk: real.desk,
      limit: real.limit,
      proof: true,
    };
  }
  const family = inferEquationFamily(c.id, `${module.title} ${module.notion} ${formula.title} ${formula.expression}`);
  const library = {
    option: {
      assumption: 'Sous-jacent lognormal, taux et volatilite constants, marche sans arbitrage, payoff europeen.',
      steps: ['Ecrire le payoff actualise sous la mesure risque-neutre.', 'Remplacer la dynamique du sous-jacent par sa loi lognormale.', 'Standardiser le seuil de payoff avec d1 et d2.', 'Separer valeur forward attendue et strike actualise pour obtenir le prix.'],
      desk: 'Le prix devient defendable car chaque input du ticket a une place: spot, strike, maturite, taux, dividende et vol.',
      limit: 'La formule est locale au modele: smile, dividendes discrets, liquidite et exercice anticipe doivent etre controles.'
    },
    rates: {
      assumption: 'Courbe de discount factors construite, cash-flows dates, conventions de year fraction et signe payer/receiver fixes.',
      steps: ['Actualiser chaque cash-flow avec le discount factor de sa date.', 'Regrouper la jambe fixe dans une annuite de swap.', 'Imposer PV fixe = PV flottante pour obtenir le taux par.', 'Bumper la courbe de 1 bp pour lire DV01 et P&L de taux.'],
      desk: 'La valorisation explique directement quel bucket de courbe porte le risque.',
      limit: 'Interpolation, collateral, basis et convexity peuvent dominer si les conventions ne sont pas celles du ticket.'
    },
    credit: {
      assumption: 'Survie, recovery, risky annuity et spread de credit fixes au niveau du ticket.',
      steps: ['Ecrire la jambe de prime comme spread multiplie par risky annuity.', 'Ecrire la jambe de protection comme perte en cas de defaut actualisee.', 'Lineariser la variation de valeur par 1 bp de spread.', 'Comparer CS01, carry et jump-to-default avant de decider.'],
      desk: 'Le trader voit si le risque vient du carry, du mark-to-market ou du defaut saute.',
      limit: 'La linearisation CS01 casse pour larges chocs, restructuration, wrong-way risk ou recovery instable.'
    },
    var: {
      assumption: 'Distribution de P&L, horizon, niveau de confiance et matrice de correlation fixes.',
      steps: ['Transformer les positions en sensibilites aux facteurs.', 'Propager la variance via covariance/correlation.', 'Lire le quantile de perte au niveau de confiance.', 'Comparer VaR, expected shortfall et stress avant escalation.'],
      desk: 'La mesure devient utile seulement si elle identifie le facteur et la limite a escalader.',
      limit: 'Normalite, correlation stable et historique representatif sont des hypotheses fortes en regime de stress.'
    },
    montecarlo: {
      assumption: 'Dynamique stochastique, payoff, discounting, nombre de chemins et graine de simulation controles.',
      steps: ['Simuler les chemins sous la mesure de pricing.', 'Evaluer le payoff sur chaque trajectoire.', 'Actualiser puis moyenner les payoffs.', 'Calculer erreur standard et intervalle de confiance.'],
      desk: "Le prix n'est utilisable que si l'incertitude Monte Carlo est petite face au bid/ask ou au seuil de decision.",
      limit: 'Discretisation, variance, rare events et model risk doivent etre suivis avant de citer un prix.'
    },
    bond: {
      assumption: 'Cash-flows, yield, frequence, convention de prix et courbe de taux controles.',
      steps: ['Actualiser chaque coupon et le principal.', 'Sommer les valeurs presentes pour obtenir le prix.', 'Deriver le prix par rapport au yield pour duration.', 'Ajouter le terme de convexite pour les grands chocs.'],
      desk: 'Duration et convexite transforment un mouvement de taux en P&L explicable.',
      limit: 'Optionnalite, spread de credit, accrued interest et liquidite peuvent deformer la lecture yield-only.'
    },
    stochastic: {
      assumption: 'Processus SDE specifie, fonction de valeur derivable, volatilite et mesure de pricing claires.',
      steps: ['Partir de la dynamique du facteur de risque.', 'Appliquer Ito pour separer drift, delta et gamma.', 'Construire le portefeuille hedge pour annuler le risque aleatoire local.', 'Lire l equation de pricing ou de P&L hedgee.'],
      desk: 'La demonstration relie le symbole mathematique au ticket hedgeable.',
      limit: 'Les hypotheses de continuite, liquidite et rebalancement continu ne tiennent pas telles quelles en production.'
    },
    generic: {
      assumption: 'Inputs, conventions, unite de choc et signe de position fixes avant le calcul.',
      steps: ['Identifier la variable d etat et le payoff ou cash-flow.', 'Ecrire la valeur comme prix, esperance actualisee ou approximation de sensibilite.', 'Isoler les termes qui changent sous choc.', 'Conclure avec unite, controle et action de desk.'],
      desk: 'La formule n est utile que si elle produit un chiffre defendable et une decision.',
      limit: 'Une formule sans conventions ni controle d ordre de grandeur ne doit pas etre envoyee au desk.'
    },
  };
  const item = library[family] || library.generic;
  return {
    title: formula.title,
    expression: formula.expression,
    assumption: item.assumption,
    steps: item.steps,
    desk: item.desk,
    limit: item.limit,
  };
}

function inferEquationFamily(courseId, text = '') {
  const t = `${courseId} ${text}`.toLowerCase();
  if (/black|option|greek|vol|smile|barrier|autocall|payoff|delta|vega|gamma/.test(t)) return 'option';
  if (/swap|curve|rate|dv01|discount|forward/.test(t)) return 'rates';
  if (/credit|cds|cs01|recovery|spread/.test(t)) return 'credit';
  if (/var|expected shortfall|stress|correlation/.test(t)) return 'var';
  if (/monte|simulation|gbm|confidence/.test(t)) return 'montecarlo';
  if (/bond|duration|convexity|ytm/.test(t)) return 'bond';
  if (/stochastic|ito|sde|girsanov/.test(t)) return 'stochastic';
  return 'generic';
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
        <span className="badge badge-blue">{isProof ? 'preuve pas a pas' : 'valuation proof'}</span>
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
            <Link to="/tools" className="btn btn-outline btn-sm" style={{marginTop:12}}>Open the live pricing tools ›</Link>
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
  const paths = useMemo(()=>Array.from({length:20},(_,i)=>genWalk(100, 100, 0.014, 0.0005, i+3)),[]);
  const histo = useMemo(()=>{
    const bins = Array(20).fill(0);
    for (let i=0;i<2000;i++) {
      let s = 100;
      for (let j=0;j<100;j++) s *= Math.exp(0.0005 + 0.014*(Math.random()-0.5)*2);
      const idx = Math.min(19, Math.max(0, Math.floor((s-60)/4)));
      bins[idx]++;
    }
    return bins.map((b,i)=>({x:60+i*4, y:b}));
  },[]);
  // Real Monte-Carlo call price (Box-Muller GBM) + standard error, vs BS — all
  // computed live, no fabricated figures.
  const mc = useMemo(()=>{
    const S0=100,K=100,r=0.02,sigma=0.20,T=1,N=20000;
    const disc=Math.exp(-r*T), drift=(r-0.5*sigma*sigma)*T, vol=sigma*Math.sqrt(T);
    let sum=0,sum2=0;
    for(let i=0;i<N;i++){
      const u1=Math.random()||1e-9,u2=Math.random();
      const z=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      const pay=disc*Math.max(S0*Math.exp(drift+vol*z)-K,0);
      sum+=pay; sum2+=pay*pay;
    }
    const mean=sum/N, se=Math.sqrt(Math.max(0,sum2/N-mean*mean)/N);
    const bs=bsPrice({S:S0,K,r,sigma,T,type:'call'}).price;
    return {mean,se,lo:mean-1.96*se,hi:mean+1.96*se,bs,N};
  },[]);
  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Lesson 1.1 · GBM</div>
        <h2 className="mono" style={{fontSize:22, fontWeight:700, marginTop:10}}>Simulate. Average. Discount.</h2>
        <div className="panel-2 mono" style={{padding:18,fontSize:13.5,marginTop:10}}>S(t+Δt) = S(t) · exp((r − σ²/2)Δt + σ √Δt · Z),  Z ~ N(0,1)</div>
      </div>
      <div className="grid-2">
        <ChartFrame title="GBM paths" subtitle="20 of 100,000">
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
        <Stat label="MC Mean Price" value={fmt(mc.mean,3)} sub={`${(mc.N/1000)}k paths`}/>
        <Stat label="Std Error" value={`±${fmt(mc.se,3)}`}/>
        <Stat label="95% CI" value={`[${fmt(mc.lo,3)}, ${fmt(mc.hi,3)}]`}/>
        <Stat label="Black-Scholes ref" value={fmt(mc.bs,3)} accent="var(--blue)"/>
        <Stat label="MC − BS" value={fmt(mc.mean-mc.bs,3)} sub="convergence check"/>
        <Stat label="Convergence" value="O(1/√n)"/>
      </div>
    </div>
  );
}

// VaR/ES Monte-Carlo P&L distribution, tied to the real ^GSPC return sample.
// The histogram is the parametric (Gaussian) P&L model the desk *assumes*
// (P&L = V·σ·Z, σ the realised ^GSPC 252d vol); the vertical markers are the
// engine-computed empirical VaR/ES on the 24,737 real ^GSPC returns plus the
// worst realised day. The point made visual: the Gaussian model is a thin
// spike near zero while the real tail sprawls far to the left (fat tails).
function VarMCContent(props) {
  const V = props.V || 10000000;
  const sigma = props.sigma || 0.00788;
  const conf = props.confidence || 0.99;
  const paramVaR = props.paramVaR || V*sigma*2.3263479;
  const paramES  = props.paramES  || V*sigma*0.0266521/(1-conf);
  const histVaR  = props.histVaR  || 348606;
  const histES   = props.histES   || 521990;
  const worst    = props.worst    || 2289973;      // 1987-10-19 loss on the book
  const worstLbl = props.worstLabel || '1987';
  const N = 20000;
  const sim = useMemo(()=>{
    let x = 987654321;
    const rnd = () => { x = (x*1664525+1013904223) % 4294967296; return x/4294967296; };
    const xmin = -2400000, xmax = 300000, NB = 80, bw = (xmax-xmin)/NB;
    const bins = Array(NB).fill(0);
    const pnls = [];
    for (let i=0;i<N;i++){
      const u1 = rnd()||1e-9, u2 = rnd();
      const z = Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
      const p = V*sigma*z; pnls.push(p);
      const idx = Math.floor((p-xmin)/bw);
      if (idx>=0 && idx<NB) bins[idx]++;
    }
    pnls.sort((a,b)=>a-b);
    const simVaR = -pnls[Math.floor((1-conf)*N)];   // empirical 99% loss of the sim
    return { bins, xmin, xmax, NB, bw, simVaR };
  },[V,sigma,conf]);

  const W=760, Hh=210, ML=8, MR=8, MT=10, MB=42;
  const pw = W-ML-MR, ph = Hh-MT-MB;
  const xpix = v => ML + (v - sim.xmin)/(sim.xmax - sim.xmin) * pw;
  const ymax = Math.max(...sim.bins);
  const ypix = c => MT + (1 - c/ymax) * ph;
  const k = v => (v>=0?'+':'−') + '$' + Math.abs(Math.round(v/1000)) + 'k';
  const mk = (v, color, label, up) => (
    <g>
      <line x1={xpix(-v)} y1={MT} x2={xpix(-v)} y2={MT+ph} stroke={color} strokeWidth="1.5" strokeDasharray="3 2"/>
      <text x={xpix(-v)} y={up?MT+10:MT+ph-4} fill={color} fontSize="9.5" textAnchor="middle" fontFamily="'JetBrains Mono',monospace">{label}</text>
    </g>
  );
  return (
    <div className="col" style={{gap:14}}>
      <div className="mono mute" style={{fontSize:11.5, lineHeight:1.5}}>
        Histogramme = {N.toLocaleString()} P&amp;L simulés sous le modèle <b>gaussien</b> (P&amp;L = V·σ·Z, σ = {(sigma*100).toFixed(3)}%/j, la vol 252j réelle du ^GSPC). Repères verticaux = VaR/ES <b>empiriques</b> calculées sur les 24&nbsp;737 rendements ^GSPC réels (§3.3) + le pire jour réalisé. La cloche gaussienne est un pic étroit ; la vraie queue est loin à gauche.
      </div>
      <svg viewBox={`0 0 ${W} ${Hh}`} width="100%" height={Hh} style={{display:'block',fontFamily:"'JetBrains Mono',monospace"}}>
        <line x1={ML} y1={MT+ph} x2={W-MR} y2={MT+ph} stroke="#2C3340"/>
        {sim.bins.map((c,i)=> c>0 && (
          <rect key={i} x={xpix(sim.xmin+i*sim.bw)} y={ypix(c)} width={Math.max(1,pw/sim.NB-0.5)} height={MT+ph-ypix(c)} fill="#3E8BFF" opacity="0.55"/>
        ))}
        {mk(paramVaR, '#3E8BFF', 'VaR param '+k(-paramVaR), true)}
        {mk(histVaR, '#F5A623', 'VaR hist '+k(-histVaR), false)}
        {mk(histES, '#FF7A1A', 'ES hist '+k(-histES), true)}
        {mk(worst, '#FF2E45', worstLbl+' '+k(-worst), false)}
        {[-2000000,-1500000,-1000000,-500000,0].map(t=>(
          <text key={t} x={xpix(t)} y={Hh-6} fill="#7C8493" fontSize="9" textAnchor="middle">{(t/1e6).toFixed(1)}M</text>
        ))}
      </svg>
      <div className="grid-3">
        <Stat label="VaR param. 99% (gaussien)" value={'$'+Math.round(paramVaR).toLocaleString()} sub="modèle simulé" accent="var(--blue)"/>
        <Stat label="VaR sim. (contrôle)" value={'$'+Math.round(sim.simVaR).toLocaleString()} sub={`${(N/1000)}k tirages → ≈ VaR param.`}/>
        <Stat label="VaR hist. 99% (réel ^GSPC)" value={'$'+Math.round(histVaR).toLocaleString()} sub="24 737 rendements"/>
        <Stat label="ES hist. 99% (réel ^GSPC)" value={'$'+Math.round(histES).toLocaleString()} sub={`ES/VaR = ${(histES/histVaR).toFixed(2)}`}/>
        <Stat label="Pire jour réalisé" value={'−$'+Math.round(worst).toLocaleString()} sub="19/10/1987 (−22.9%)" accent="var(--red)"/>
        <Stat label="Sous-estimation queue" value={(histVaR/paramVaR).toFixed(1)+'×'} sub="hist / paramétrique"/>
      </div>
    </div>
  );
}

function CourseCalculator({c}) {
  if (c.id==='black-scholes') return <BSContent/>;
  if (c.id==='yield-curves') return <YCContent/>;
  if (c.id==='monte-carlo') return <MCContent/>;
  return <BSContent/>;
}

function CourseExercises({c}) {
  const blueprint = getCourseBlueprint(c.id);
  const related = EXERCISES
    .filter((exercise)=>blueprint?.relatedExerciseIds?.includes(exercise.id) || exercise.courseIds?.includes(c.id) || exercise.cat === c.title)
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
            {e.done && <span className="badge badge-green">Completed</span>}
            <Icon name="arrow-right" size={14} style={{color:'var(--mute)'}}/>
          </div>
        </Link>
      ))}
      <div className="panel" style={{padding:18}}>
        <div className="row between" style={{gap:14}}>
          <div>
            <div className="label" style={{marginBottom:6}}>Generate from this course</div>
            <div className="mute" style={{fontSize:12.5,lineHeight:1.5}}>Use the AI generator to create a fresh desk case with this course context, difficulty and product family.</div>
          </div>
          <Link to="/exercises" className="btn btn-primary btn-sm" style={{flexShrink:0}}>Open generator <Icon name="arrow-right" size={13}/></Link>
        </div>
      </div>
    </div>
  );
}
function CourseResources({c, scriptModel}) {
  const blueprint = getCourseBlueprint(c.id);
  const scriptSlug = COURSE_SCRIPT_SLUGS[c.id];
  const generatedResources = [
    {t:'Generated course script', d:'Full Markdown course populated from the local RAG corpus, with LaTeX formulas.', ic:'file-text', href:`/course-scripts/${scriptSlug}.md`},
    {t:'Course generation index', d:'List of all generated modules, source counts and generation metadata.', ic:'database', href:'/course-scripts/_index.json'},
  ];
  const blueprintResources = blueprint?.resources?.map((item,idx)=>({
    t: item,
    d: idx === 0 ? 'Primary source from the local knowledge base.' : 'Practice support used for labs, exercises and desk cases.',
    ic: idx % 3 === 0 ? 'book-open' : idx % 3 === 1 ? 'file-text' : 'database',
  })) || [];
  const resources = [
    ...generatedResources,
    ...(blueprintResources.length ? blueprintResources : [
    {t:'Course notes', d:'Full PDF with derivations and code annotations.', ic:'file-text'},
    {t:'Jupyter notebook', d:'Interactive Python notebook covering every exercise.', ic:'notebook'},
    {t:'Reference papers', d:'Original Black & Scholes 1973, Merton 1973, Heston 1993.', ic:'book'},
    {t:'Video lectures', d:'8 hours of recorded sessions with timestamps and transcripts.', ic:'video'},
    {t:'Cheatsheet', d:'Single-page reference for formulas, Greeks, and pitfalls.', ic:'sticky-note'},
    {t:'Sample data', d:'Real market data extracts in CSV for hands-on practice.', ic:'database'},
    ]),
  ];
  const sources = scriptModel?.sources || [];
  return (
    <div className="col" style={{gap:18}}>
      <div className="grid-2">
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
          <div className="label">Sources RAG rattachees aux ouvrages</div>
          <span className="badge">{sources.length || 'loading'} sources</span>
        </div>
        <div className="course-source-table">
          {(sources.length ? sources : [{id:'S-', title:'Sources loading from generated course script.', chunk:'', score:''}]).map((source)=>(
            <div key={`${source.id}-${source.title}`} className="course-source-row">
              <span className="mono">{source.id}</span>
              <div>
                <strong>{source.title}</strong>
                {(source.chunk || source.score) && <small>chunk {source.chunk} · score {source.score}</small>}
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
  const filtered = TOOLS.filter(t => cat==='All Tools' || t.cat===cat);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ tools</span></>}
        title="Quantitative Tools"
        sub="Real calculators with live inputs, charts and Greeks. Five free, four PRO."
        right={<>
          <Link to="/dashboard" className="btn btn-outline btn-sm"><Icon name="bookmark" size={13}/> Saved (3)</Link>
          <button className="btn btn-primary btn-sm" onClick={()=>submitStub('Tool request')}><Icon name="plus" size={13}/> Request a tool</button>
        </>}
      />
      <div className="tabs-bar">
        {cats.map(c=>(
          <button key={c} className={"tab-btn "+(cat===c?'on':'')} onClick={()=>setCat(c)}>
            {c} <span className="mute" style={{marginLeft:6}}>{c==='All Tools'?TOOLS.length:TOOLS.filter(t=>t.cat===c).length}</span>
          </button>
        ))}
      </div>
      <div className="grid-3">
        {filtered.map(t=>(
          <Link to={"/tools/"+t.id} key={t.id} className="course-card">
            <div className="thumb" style={{position:'relative'}}>
              <ToolThumb id={t.id}/>
              <div style={{position:'absolute',top:10,left:10}}><TierBadge tier={t.tier}/></div>
              {t.tier==='pro' && <div style={{position:'absolute',inset:0,background:'rgba(10,12,16,.3)',display:'grid',placeItems:'center'}}>
                <div style={{background:'rgba(10,12,16,.85)',padding:'8px 12px',border:'1px solid var(--line-2)',borderRadius:3,display:'flex',gap:8,alignItems:'center'}}>
                  <Icon name="lock" size={13} style={{color:'var(--red)'}}/>
                  <span className="mono" style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase'}}>PRO required</span>
                </div>
              </div>}
            </div>
            <div className="body">
              <div className="meta">
                <span>{t.cat}</span>
                <span>·</span>
                <span>{t.tier==='pro'?'Locked':'Open'}</span>
              </div>
              <h3>{t.name}</h3>
              <div className="desc">{t.desc}</div>
              <div className="foot">
                <span className="mono mute" style={{fontSize:10.5}}>v1.2 · stable</span>
                <span className="mono" style={{fontSize:11,color: t.tier==='pro'?'var(--mute)':'var(--red)'}}>{t.tier==='pro'?'upgrade':'launch ›'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------- Math: implied vol (Newton + bisection fallback) ----------
function impliedVol({S,K,r,q=0,T,price,type='call'}){
  const intrinsic = type==='call' ? Math.max(S*Math.exp(-q*T)-K*Math.exp(-r*T),0) : Math.max(K*Math.exp(-r*T)-S*Math.exp(-q*T),0);
  if (!(price>intrinsic+1e-8)) return {sigma:NaN, iters:0, ok:false, reason:'price below intrinsic'};
  let sigma=0.2;
  for (let i=1;i<=100;i++){
    const o = bsPrice({S,K,r,q,sigma,T,type});
    const vega = o.vega*100; // bsPrice vega is per 1 vol point; here per unit vol
    const diff = o.price - price;
    if (Math.abs(diff)<1e-7) return {sigma, iters:i, ok:true};
    if (vega<1e-9) break;
    sigma -= diff/vega;
    if (sigma<=0||sigma>5) sigma = Math.min(Math.max(sigma,1e-3),5);
  }
  // bisection fallback
  let lo=1e-3, hi=5;
  for (let i=0;i<100;i++){
    const mid=(lo+hi)/2;
    const pm = bsPrice({S,K,r,q,sigma:mid,T,type}).price;
    if (Math.abs(pm-price)<1e-7) return {sigma:mid, iters:i, ok:true};
    if (pm>price) hi=mid; else lo=mid;
  }
  return {sigma:(lo+hi)/2, iters:100, ok:true};
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
  return <PageHead crumb={<><Link to="/tools">tools</Link><i>›</i><span>{slug}</span></>} title={name} sub={sub} right={<span className="badge badge-green">Live compute</span>}/>;
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
          <span className="badge">Python 3.11 · Pyodide</span>
          <span className="mono mute" style={{fontSize:11}}>{label}</span>
        </div>
        <div className="row" style={{gap:6}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setCode(initial)}><Icon name="rotate-ccw" size={12}/> Reset</button>
          <button className="btn btn-primary btn-sm" onClick={run} disabled={busy}><Icon name="play" size={12}/> {busy?'Running…':'Run'}</button>
        </div>
      </div>
      <textarea value={code} onChange={(e)=>setCode(e.target.value)} spellCheck={false}
        style={{width:'100%',minHeight,background:'#0A0C10',color:'var(--text)',border:'none',borderBottom:'1px solid var(--line)',fontFamily:"'JetBrains Mono',monospace",fontSize:12.5,lineHeight:1.6,padding:14,resize:'vertical',outline:'none'}}/>
      <div style={{padding:'10px 14px'}}>
        <div className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em',marginBottom:6}}>OUTPUT</div>
        <pre className="code" style={{margin:0,maxHeight:240,overflow:'auto',color:err?'var(--red)':'var(--text-2)',whiteSpace:'pre-wrap'}}><code>{out || '— run the code to see output —'}</code></pre>
      </div>
    </div>
  );
}

// ---------- Binomial tree (Cox-Ross-Rubinstein), American early exercise ----------
function crrPrice({S,K,r,q,sigma,T,steps,type,american}){
  const dt=T/steps, u=Math.exp(sigma*Math.sqrt(dt)), d=1/u;
  const p=(Math.exp((r-q)*dt)-d)/(u-d), disc=Math.exp(-r*dt);
  if (p<=0||p>=1) return {price:NaN};
  const val=new Array(steps+1);
  for (let i=0;i<=steps;i++){ const ST=S*Math.pow(u,steps-i)*Math.pow(d,i); val[i]=type==='call'?Math.max(ST-K,0):Math.max(K-ST,0); }
  for (let n=steps-1;n>=0;n--){
    for (let i=0;i<=n;i++){
      let v=disc*(p*val[i]+(1-p)*val[i+1]);
      if (american){ const ST=S*Math.pow(u,n-i)*Math.pow(d,i); const ex=type==='call'?Math.max(ST-K,0):Math.max(K-ST,0); v=Math.max(v,ex); }
      val[i]=v;
    }
  }
  return {price:val[0], u, d, p};
}
function BinomialTreeTool(){
  const [S,setS]=useState(100),[K,setK]=useState(100),[r,setR]=useState(3),[q,setQ]=useState(0),[sigma,setSigma]=useState(25),[T,setT]=useState(365),[steps,setSteps]=useState(200);
  const [type,setType]=useState('put'),[american,setAmerican]=useState(true);
  const p={S,K,r:r/100,q:q/100,sigma:sigma/100,T:T/365};
  const am=crrPrice({...p,steps,type,american:true}).price;
  const eu=crrPrice({...p,steps,type,american:false}).price;
  const bs=bsPrice({...p,type}).price;
  const conv=useMemo(()=>{const a=[];for(let n=5;n<=Math.min(steps,300);n+=5){a.push({x:n,y:+crrPrice({...p,steps:n,type,american}).price.toFixed(4)});}return a;},[S,K,r,q,sigma,T,steps,type,american]);
  return (
    <div className="container page">
      <ToolHead slug="binomial tree" name="Binomial Tree (CRR)" sub="Cox-Ross-Rubinstein lattice — American & European, with early-exercise premium."/>
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr 320px',gap:14}}>
        <ToolInputs fields={[['Spot S',S,10,500,1,setS,'$'],['Strike K',K,10,500,1,setK,'$'],['Rate r',r,-2,15,0.1,setR,'%'],['Yield q',q,0,12,0.1,setQ,'%'],['Vol σ',sigma,1,120,0.5,setSigma,'%'],['Maturity T',T,1,1825,1,setT,'d'],['Steps',steps,5,500,5,setSteps,'n']]}>
          <div className="label" style={{marginBottom:8}}>Option</div>
          <div className="toggle" style={{width:'100%',marginBottom:10}}>{['call','put'].map(t=><button key={t} className={type===t?'on':''} onClick={()=>setType(t)} style={{flex:1}}>{t}</button>)}</div>
          <div className="toggle" style={{width:'100%'}}>{[['true','American'],['false','European']].map(([k,l])=><button key={k} className={String(american)===k?'on':''} onClick={()=>setAmerican(k==='true')} style={{flex:1}}>{l}</button>)}</div>
        </ToolInputs>
        <ChartFrame title="Convergence vs steps" subtitle="lattice price stabilises as steps increase">
          <LineChart width={620} height={260} series={[{name:'price',color:'#FF2E45',data:conv,fillOpacity:0.1}]}/>
        </ChartFrame>
        <div className="panel" style={{padding:18,alignSelf:'start'}}>
          <div className="label" style={{marginBottom:6}}>Results</div>
          <ResultRow k="American price" v={fmt(am,4)} accent="var(--red)"/>
          <ResultRow k="European price" v={fmt(eu,4)}/>
          <ResultRow k="Black-Scholes" v={fmt(bs,4)}/>
          <ResultRow k="Early-exercise premium" v={fmt(am-eu,4)} accent={am-eu>1e-4?'var(--amber)':'var(--text-2)'}/>
          <div className="mute" style={{fontSize:11.5,marginTop:12,lineHeight:1.5}}>{am-eu>1e-4? 'Early exercise is worth something here (typical for American puts / dividend-paying calls).' : 'No early-exercise premium — American ≈ European for these inputs.'}</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Bond calculator: price, duration, convexity, DV01 ----------
function bondAnalytics({face,coupon,freq,years,ytm}){
  const n=Math.round(years*freq), c=face*coupon/freq, y=ytm/freq;
  let price=0, dur=0, conv=0;
  for(let t=1;t<=n;t++){ const cf=c+(t===n?face:0); const df=Math.pow(1+y,-t); const pv=cf*df; price+=pv; dur+=t*pv; conv+=t*(t+1)*pv; }
  const macaulay=(dur/price)/freq;
  const modified=macaulay/(1+y);
  const convexity=(conv/price)/(freq*freq*Math.pow(1+y,2));
  const dv01=modified*price*1e-4;
  return {price,macaulay,modified,convexity,dv01,n};
}
function BondCalcTool(){
  const [face,setFace]=useState(100),[coupon,setCoupon]=useState(5),[freq,setFreq]=useState(2),[years,setYears]=useState(10),[ytm,setYtm]=useState(4),[shock,setShock]=useState(25);
  const a=bondAnalytics({face,coupon:coupon/100,freq,years,ytm:ytm/100});
  const aShock=bondAnalytics({face,coupon:coupon/100,freq,years,ytm:(ytm+shock/100)/100});
  const approx=-a.modified*(shock/1e4)+0.5*a.convexity*Math.pow(shock/1e4,2);
  const curve=useMemo(()=>{const arr=[];for(let yv=Math.max(0.1,ytm-4);yv<=ytm+4;yv+=0.2){arr.push({x:+yv.toFixed(2),y:+bondAnalytics({face,coupon:coupon/100,freq,years,ytm:yv/100}).price.toFixed(3)});}return arr;},[face,coupon,freq,years,ytm]);
  return (
    <div className="container page">
      <ToolHead slug="bond calculator" name="Bond Calculator" sub="Price, Macaulay & modified duration, convexity, DV01 and scenario shifts."/>
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr 320px',gap:14}}>
        <ToolInputs fields={[['Face',face,1,1000,1,setFace,''],['Coupon',coupon,0,15,0.1,setCoupon,'%'],['Freq/yr',freq,1,12,1,setFreq,'×'],['Years',years,0.5,40,0.5,setYears,'y'],['YTM',ytm,0.1,20,0.05,setYtm,'%'],['Rate shock',shock,-200,200,5,setShock,'bp']]}/>
        <ChartFrame title="Price vs yield" subtitle="convex, downward-sloping price/yield relationship">
          <LineChart width={620} height={260} series={[{name:'price',color:'#FF2E45',data:curve,fillOpacity:0.1}]}/>
        </ChartFrame>
        <div className="panel" style={{padding:18,alignSelf:'start'}}>
          <div className="label" style={{marginBottom:6}}>Analytics</div>
          <ResultRow k="Clean price" v={fmt(a.price,3)} accent="var(--red)"/>
          <ResultRow k="Macaulay duration" v={fmt(a.macaulay,3)+' y'}/>
          <ResultRow k="Modified duration" v={fmt(a.modified,3)}/>
          <ResultRow k="Convexity" v={fmt(a.convexity,2)}/>
          <ResultRow k="DV01" v={fmt(a.dv01,4)+' / bp'}/>
          <div className="hairline" style={{margin:'12px 0'}}></div>
          <div className="label" style={{marginBottom:6}}>Shock {shock>=0?'+':''}{shock}bp</div>
          <ResultRow k="Repriced (exact)" v={fmt(aShock.price,3)}/>
          <ResultRow k="ΔP exact" v={fmt(aShock.price-a.price,3)}/>
          <ResultRow k="ΔP/P dur+convex" v={fmtPct(approx,3)} accent="var(--amber)"/>
        </div>
      </div>
    </div>
  );
}

// ---------- Yield curve builder: bootstrap par swaps ----------
function bootstrapCurve(nodes){ // nodes: [{t, rate}] annual par swaps, sorted
  const dfs=[]; let cum=0; const out=[];
  for(const nd of nodes){ const s=nd.rate; const df=(1-s*cum)/(1+s); dfs.push(df); cum+=df; const zero=Math.pow(df,-1/nd.t)-1; out.push({t:nd.t,par:s,df,zero}); }
  for(let i=1;i<out.length;i++){ out[i].fwd=dfs[i-1]/dfs[i]-1; }
  return out;
}
function YieldCurveTool(){
  const [r1,setR1]=useState(3.0),[r2,setR2]=useState(3.2),[r3,setR3]=useState(3.35),[r5,setR5]=useState(3.55),[r10,setR10]=useState(3.8);
  const nodes=[{t:1,rate:r1/100},{t:2,rate:r2/100},{t:3,rate:r3/100},{t:5,rate:r5/100},{t:10,rate:r10/100}];
  const out=bootstrapCurve(nodes);
  const zeroSeries=out.map(o=>({x:o.t,y:+(o.zero*100).toFixed(3)}));
  const dfSeries=out.map(o=>({x:o.t,y:+o.df.toFixed(4)}));
  return (
    <div className="container page">
      <ToolHead slug="yield curve builder" name="Yield Curve Builder" sub="Bootstrap discount factors, zero & forward rates from par swap quotes."/>
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr 360px',gap:14}}>
        <ToolInputs title="Par swap rates" fields={[['1y',r1,0,10,0.05,setR1,'%'],['2y',r2,0,10,0.05,setR2,'%'],['3y',r3,0,10,0.05,setR3,'%'],['5y',r5,0,10,0.05,setR5,'%'],['10y',r10,0,10,0.05,setR10,'%']]}/>
        <ChartFrame title="Zero curve" subtitle="annualised zero-coupon rates by maturity">
          <LineChart width={640} height={260} series={[{name:'zero',color:'#FF2E45',data:zeroSeries,fillOpacity:0.1}]}/>
        </ChartFrame>
        <div className="panel" style={{padding:0,alignSelf:'start'}}>
          <div className="label" style={{padding:'14px 16px'}}>Bootstrapped curve</div>
          <table className="data"><thead><tr><th>Tenor</th><th className="num">DF</th><th className="num">Zero</th><th className="num">1y fwd</th></tr></thead>
          <tbody>{out.map(o=><tr key={o.t}><td className="symbol">{o.t}y</td><td className="num">{fmt(o.df,4)}</td><td className="num">{fmt(o.zero*100,3)}%</td><td className="num">{o.fwd!=null?fmt(o.fwd*100,3)+'%':'—'}</td></tr>)}</tbody></table>
        </div>
      </div>
    </div>
  );
}

// ---------- Vol surface explorer: parametric skew, inverted to IV ----------
function VolSurfaceTool(){
  const [atm,setAtm]=useState(20),[skew,setSkew]=useState(-12),[smile,setSmile]=useState(40),[term,setTerm]=useState(3);
  // total-variance flat term structure with a quadratic-in-logmoneyness smile
  const ivAt=(k,T)=>{ const base=(atm/100)+(skew/100)*k+(smile/100)*k*k; const tt=base*(1+(term/100)*Math.log(Math.max(T,0.05))); return Math.max(0.02,tt); };
  const tenors=[0.25,0.5,1,2,5];
  const ks=useMemo(()=>{const a=[];for(let k=-0.4;k<=0.4;k+=0.04)a.push(+k.toFixed(3));return a;},[]);
  const series=tenors.map((T,i)=>({name:`${T}y`,color:['#FF2E45','#FFB020','#3DA5FF','#36C26B','#B36BFF'][i],data:ks.map(k=>({x:k,y:+(ivAt(k,T)*100).toFixed(2)})),fill:false}));
  return (
    <div className="container page">
      <ToolHead slug="vol surface explorer" name="Vol Surface Explorer" sub="Parametric implied-vol surface — slice the smile by tenor and log-moneyness."/>
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:14}}>
        <ToolInputs title="Surface parameters" fields={[['ATM vol',atm,5,80,0.5,setAtm,'%'],['Skew',skew,-50,50,1,setSkew,'%/k'],['Smile (curv.)',smile,0,150,2,setSmile,'%/k²'],['Term slope',term,-30,30,1,setTerm,'%']]}>
          <div className="mute" style={{fontSize:11.5,marginTop:6,lineHeight:1.5}}>σ(k,T) = ATM + skew·k + smile·k², k = ln(K/S), scaled in maturity. Each line is a tenor slice.</div>
        </ToolInputs>
        <ChartFrame title="Implied-vol smile slices" subtitle="vol (%) vs log-moneyness, per tenor" h={320}>
          <LineChart width={760} height={320} series={series} fill={false}/>
        </ChartFrame>
      </div>
    </div>
  );
}

function GatedTool({required, name, children}) {
  const ent = useEntitlement();
  if (ent.has(required)) return children;
  return <div className="container page"><ToolHead slug={name.toLowerCase()} name={name} sub="Premium tool."/><LockPanel required={required} what={`The ${name}`}/></div>;
}
function ToolDetailPage({id}) {
  const tool = TOOLS.find(t=>t.id===id);
  if (!tool) return <ToolNotFound/>;
  if (id === 'bs-pricer') return <BSPricerTool/>;
  if (id === 'payoff') return <PayoffVisualizerTool/>;
  if (id === 'mc') return <MonteCarloTool/>;
  if (id === 'iv-calc') return <IVCalcTool/>;
  if (id === 'calib') return <GatedTool required="student" name="Smile Calibration"><CalibrationTool/></GatedTool>;
  if (id === 'binomial') return <BinomialTreeTool/>;
  if (id === 'bond') return <BondCalcTool/>;
  if (id === 'curve') return <YieldCurveTool/>;
  if (id === 'volsurface') return <VolSurfaceTool/>;
  if (tool.tier === 'pro') return <ProLockedTool tool={tool}/>;
  return <BSPricerTool/>;
}

function ToolNotFound() {
  return <div className="container page"><PageHead title="Tool not found"/></div>;
}

function ProLockedTool({tool}) {
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/tools">tools</Link><i>›</i><span>{tool.name.toLowerCase()}</span></>}
        title={tool.name}
        sub={tool.desc}
        right={<TierBadge tier="pro"/>}
      />
      <div className="panel" style={{padding:60, textAlign:'center', position:'relative', overflow:'hidden'}}>
        <Icon name="lock" size={32} style={{color:'var(--red)'}}/>
        <h2 className="mono" style={{fontSize:22,fontWeight:700,marginTop:18}}>Pro Feature</h2>
        <p className="text-2" style={{maxWidth:'48ch',margin:'10px auto 24px',fontSize:13.5}}>
          {tool.name} is part of the Pro tier. Upgrade to unlock all 9 tools and Complex courses.
        </p>
        <div className="row" style={{gap:10,justifyContent:'center'}}>
          <Link to="/pricing" className="btn btn-primary">See plans <Icon name="arrow-right" size={13}/></Link>
          <Link to="/tools" className="btn btn-outline">Back to tools</Link>
        </div>
      </div>
    </div>
  );
}

// ============= BS PRICER =============
function BSPricerTool() {
  const [S,setS]=useState(100),[K,setK]=useState(100),[r,setR]=useState(2),[q,setQ]=useState(0),[sigma,setSigma]=useState(20),[T,setT]=useState(180);
  const [view,setView]=useState('spot'); // sensitivity
  useToolRegister('bs-pricer', {S,K,r,q,sigma,T,view}, {S:setS,K:setK,r:setR,q:setQ,sigma:setSigma,T:setT,view:setView});
  const params = {S,K,r:r/100,q:q/100,sigma:sigma/100,T:T/365};
  const call = bsPrice({...params, type:'call'});
  const put  = bsPrice({...params, type:'put'});
  const sens = useMemo(()=>{
    const arr = [];
    let lo, hi, step;
    if (view==='spot') { lo=S*0.5; hi=S*1.5; step=(hi-lo)/40; }
    else if (view==='vol') { lo=0.05; hi=0.8; step=(hi-lo)/40; }
    else { lo=0.01; hi=2; step=(hi-lo)/40; }
    for (let v=lo; v<=hi; v+=step) {
      const p = view==='spot' ? bsPrice({...params, S:v, type:'call'}).price :
                view==='vol'  ? bsPrice({...params, sigma:v, type:'call'}).price :
                                bsPrice({...params, T:v, type:'call'}).price;
      arr.push({x:+v.toFixed(3), y:+p.toFixed(4)});
    }
    return arr;
  },[S,K,r,sigma,T,view]);

  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/tools">tools</Link><i>›</i><span>black-scholes pricer</span></>}
        title="Black-Scholes Pricer"
        sub="Closed-form European option pricing — price, Greeks, and sensitivity curves."
        right={<>
          <span className="badge badge-green">Free</span>
          <button className="btn btn-outline btn-sm" onClick={()=>handleSave('Black-Scholes Pricer')}><Icon name="bookmark" size={13}/> Save</button>
          <button className="btn btn-outline btn-sm" onClick={()=>handleShare('Black-Scholes Pricer')}><Icon name="share" size={13}/> Share</button>
        </>}
      />

      <div style={{display:'grid', gridTemplateColumns:'320px 1fr 340px', gap:14}}>
        {/* LEFT: inputs */}
        <div className="panel" style={{padding:18, alignSelf:'start'}}>
          <div className="label" style={{marginBottom:14}}>Market Inputs</div>
          {[
            ['Spot S', S, 10, 500, 0.5, setS, '$'],
            ['Strike K', K, 10, 500, 0.5, setK, '$'],
            ['Rate r', r, -2, 15, 0.05, setR, '%'],
            ['Yield q', q, 0, 10, 0.05, setQ, '%'],
            ['Vol σ', sigma, 1, 120, 0.5, setSigma, '%'],
            ['Maturity T', T, 1, 1825, 1, setT, 'd'],
          ].map(([lbl,val,min,max,step,setter,unit])=>(
            <div key={lbl} className="field" style={{marginBottom:16}}>
              <div className="row between">
                <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>{lbl}</span>
                <div className="row" style={{gap:6}}>
                  <input value={val} onChange={e=>{const v=parseFloat(e.target.value); if(!isNaN(v))setter(v);}} style={{width:74,padding:'4px 8px',background:'#0A0C10',border:'1px solid var(--line-2)',color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,borderRadius:3,outline:'none',textAlign:'right'}}/>
                  <span className="mono mute" style={{fontSize:11,width:14}}>{unit}</span>
                </div>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(+e.target.value)}/>
            </div>
          ))}
          <div className="hairline" style={{margin:'18px 0'}}></div>
          <div className="label" style={{marginBottom:8}}>Sensitivity axis</div>
          <div className="toggle" style={{width:'100%'}}>
            {['spot','vol','time'].map(v=><button key={v} className={view===v?'on':''} onClick={()=>setView(v)} style={{flex:1}}>{v}</button>)}
          </div>
        </div>

        {/* CENTER: outputs */}
        <div className="col" style={{gap:14}}>
          <div className="grid-2">
            <div className="panel" style={{padding:18}}>
              <div className="row between">
                <div className="label">European Call</div>
                <span className="mono mute" style={{fontSize:10.5}}>EUR · {K} · {T}d</span>
              </div>
              <div className="mono" style={{fontSize:38,fontWeight:700,color:'var(--red)',marginTop:6,lineHeight:1}}>{fmt(call.price,3)}</div>
              <div className="row" style={{gap:18,marginTop:14,flexWrap:'wrap'}}>
                {[['Δ Delta',call.delta,4],['Γ Gamma',call.gamma,5],['ν Vega',call.vega,3],['Θ Theta',call.theta,4],['ρ Rho',call.rho,3]].map(([l,v,d])=>(
                  <div key={l}>
                    <div className="mono mute" style={{fontSize:9.5,letterSpacing:'.1em'}}>{l}</div>
                    <div className="mono tnum" style={{fontSize:14,marginTop:2}}>{fmt(v,d)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel" style={{padding:18}}>
              <div className="row between">
                <div className="label">European Put</div>
                <span className="mono mute" style={{fontSize:10.5}}>Put-Call parity ✓</span>
              </div>
              <div className="mono" style={{fontSize:38,fontWeight:700,color:'var(--text)',marginTop:6,lineHeight:1}}>{fmt(put.price,3)}</div>
              <div className="row" style={{gap:18,marginTop:14,flexWrap:'wrap'}}>
                {[['Δ Delta',put.delta,4],['Γ Gamma',put.gamma,5],['ν Vega',put.vega,3],['Θ Theta',put.theta,4],['ρ Rho',put.rho,3]].map(([l,v,d])=>(
                  <div key={l}>
                    <div className="mono mute" style={{fontSize:9.5,letterSpacing:'.1em'}}>{l}</div>
                    <div className="mono tnum" style={{fontSize:14,marginTop:2}}>{fmt(v,d)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ChartFrame title={`Call price vs ${view}`} subtitle={view==='spot'?'sweep S from 50% to 150%':view==='vol'?'sweep σ from 5% to 80%':'sweep T from 0 to 2y'}>
            <LineChart width={760} height={260} series={[{name:'C', color:'#FF2E45', data:sens, fillOpacity:0.1}]}/>
          </ChartFrame>
          <div className="panel">
            <div className="row between" style={{padding:'12px 16px', borderBottom:'1px solid var(--line)'}}>
              <div className="label">Methodology</div>
              <span className="badge">Black-Scholes 1973</span>
            </div>
            <div style={{padding:18}}>
              <p className="text-2" style={{fontSize:13,lineHeight:1.7,margin:0}}>
                Assumptions: log-normal dynamics under risk-neutral measure, frictionless market, constant volatility and rate.
                Inputs are clipped to numerically stable ranges. For American options use the Binomial tool. For path-dependent payoffs use Monte Carlo.
              </p>
              <div className="grid-3" style={{marginTop:14}}>
                <Link to="/courses/black-scholes" className="panel-2" style={{padding:12,display:'block'}}>
                  <div className="mono mute" style={{fontSize:10.5}}>RELATED COURSE</div>
                  <div className="mono" style={{fontWeight:600,marginTop:4}}>Black-Scholes Model</div>
                </Link>
                <Link to="/courses/greeks" className="panel-2" style={{padding:12,display:'block'}}>
                  <div className="mono mute" style={{fontSize:10.5}}>RELATED COURSE</div>
                  <div className="mono" style={{fontWeight:600,marginTop:4}}>Option Greeks</div>
                </Link>
                <Link to="/tools/payoff" className="panel-2" style={{padding:12,display:'block'}}>
                  <div className="mono mute" style={{fontSize:10.5}}>NEXT TOOL</div>
                  <div className="mono" style={{fontWeight:600,marginTop:4}}>Payoff Visualizer</div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: numerical breakdown */}
        <div className="col" style={{gap:14}}>
          <div className="panel">
            <div className="row between" style={{padding:'12px 14px',borderBottom:'1px solid var(--line)'}}>
              <div className="label">Numerical breakdown</div>
            </div>
            <table className="data">
              <tbody>
                {[
                  ['d₁', call.d1.toFixed(5)],
                  ['d₂', call.d2.toFixed(5)],
                  ['N(d₁)', normCdf(call.d1).toFixed(5)],
                  ['N(d₂)', normCdf(call.d2).toFixed(5)],
                  ['S · e^(-qT)', (S*Math.exp(-q/100*T/365)).toFixed(4)],
                  ['K · e^(-rT)', (K*Math.exp(-r/100*T/365)).toFixed(4)],
                  ['σ·√T', (sigma/100*Math.sqrt(T/365)).toFixed(5)],
                ].map(([k,v])=><tr key={k}><td className="symbol">{k}</td><td className="num">{v}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="panel" style={{padding:14}}>
            <div className="label" style={{marginBottom:10}}>Moneyness</div>
            <div className="row between" style={{marginBottom:8}}>
              <span className="mono" style={{fontSize:11.5}}>S/K</span>
              <span className="mono tnum" style={{fontSize:13,fontWeight:600}}>{(S/K).toFixed(4)}</span>
            </div>
            <div style={{height:4,background:'var(--line)',position:'relative'}}>
              <div style={{position:'absolute',top:-2,left:'50%',width:1,height:8,background:'var(--mute)'}}></div>
              <div style={{position:'absolute',top:-3,left:Math.max(0,Math.min(100, (S/K)*50))+'%',width:10,height:10,background:'var(--red)',borderRadius:5,transform:'translateX(-50%)'}}></div>
            </div>
            <div className="row between" style={{marginTop:6}}>
              <span className="mono mute" style={{fontSize:10}}>OTM</span>
              <span className="mono mute" style={{fontSize:10}}>ATM</span>
              <span className="mono mute" style={{fontSize:10}}>ITM</span>
            </div>
          </div>
          <div className="panel" style={{padding:14}}>
            <div className="label" style={{marginBottom:10}}>Put-Call Parity</div>
            <div className="mono" style={{fontSize:11.5,lineHeight:1.8,color:'var(--text-2)'}}>
              C − P = S·e^(-qT) − K·e^(-rT)<br/>
              {fmt(call.price,3)} − {fmt(put.price,3)} = {fmt(call.price-put.price,3)}<br/>
              <span className="green">RHS = {fmt(S*Math.exp(-q/100*T/365) - K*Math.exp(-r/100*T/365), 3)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= PAYOFF VISUALIZER =============
function PayoffVisualizerTool() {
  const [legs, setLegs] = useState([
    {id:1, type:'call', side:'long',  K:100, qty:1, prem:6.0},
    {id:2, type:'call', side:'short', K:110, qty:1, prem:2.5},
  ]);
  const addLeg = () => setLegs([...legs, {id:Date.now(), type:'call', side:'long', K:100, qty:1, prem:5}]);
  const updateLeg = (id, k, v) => setLegs(legs.map(l => l.id===id?{...l,[k]:v}:l));
  const removeLeg = (id) => setLegs(legs.filter(l => l.id!==id));
  useToolRegister('payoff', {legs}, {legs:(v)=>setLegs((v||[]).map((l,i)=>({id:i+1,qty:1,prem:0,...l})))});

  const presets = [
    {name:'Bull Call Spread', legs:[{type:'call',side:'long',K:100,qty:1,prem:6},{type:'call',side:'short',K:110,qty:1,prem:2.5}]},
    {name:'Iron Condor', legs:[{type:'put',side:'long',K:85,qty:1,prem:1.0},{type:'put',side:'short',K:95,qty:1,prem:2.5},{type:'call',side:'short',K:105,qty:1,prem:2.5},{type:'call',side:'long',K:115,qty:1,prem:1.0}]},
    {name:'Long Straddle', legs:[{type:'call',side:'long',K:100,qty:1,prem:5},{type:'put',side:'long',K:100,qty:1,prem:5}]},
    {name:'Butterfly', legs:[{type:'call',side:'long',K:95,qty:1,prem:7},{type:'call',side:'short',K:100,qty:2,prem:4},{type:'call',side:'long',K:105,qty:1,prem:2}]},
  ];
  const loadPreset = (p) => setLegs(p.legs.map((l,i)=>({...l,id:i+1})));

  // Compute payoff vs spot
  const payoff = useMemo(()=>{
    const arr = [];
    for (let s=50; s<=150; s+=1) {
      let total = 0;
      for (const l of legs) {
        const intrinsic = l.type==='call' ? Math.max(s-l.K,0) : Math.max(l.K-s,0);
        const v = (intrinsic - l.prem) * l.qty * (l.side==='long'?1:-1);
        total += v;
      }
      arr.push({x:s, y:total});
    }
    return arr;
  },[legs]);

  // Breakevens (zero crossings)
  const breakevens = useMemo(()=>{
    const bes = [];
    for (let i=1;i<payoff.length;i++) {
      if (Math.sign(payoff[i].y) !== Math.sign(payoff[i-1].y) && Math.abs(payoff[i].y-payoff[i-1].y)>0.001) {
        const t = -payoff[i-1].y/(payoff[i].y-payoff[i-1].y);
        bes.push(payoff[i-1].x + t);
      }
    }
    return bes;
  },[payoff]);

  // Strategy metrics
  const maxP = Math.max(...payoff.map(p=>p.y));
  const minP = Math.min(...payoff.map(p=>p.y));
  const netDebit = legs.reduce((a,l)=>a + l.prem*l.qty*(l.side==='long'?1:-1), 0);

  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/tools">tools</Link><i>›</i><span>payoff visualizer</span></>}
        title="Payoff Visualizer"
        sub="Build multi-leg strategies. See P&L, breakevens, and aggregate Greeks."
        right={<>
          <span className="badge badge-green">Free</span>
          <button className="btn btn-outline btn-sm" onClick={addLeg}><Icon name="plus" size={13}/> Add leg</button>
          <button className="btn btn-primary btn-sm" onClick={()=>handleSave('Strategy')}><Icon name="save" size={13}/> Save strategy</button>
        </>}
      />

      <div style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:14}}>
        <div className="col" style={{gap:14}}>
          <ChartFrame title="P&L at expiry" subtitle={`${legs.length} legs · net ${netDebit>=0?'debit':'credit'} ${fmt(Math.abs(netDebit),2)}`} right={
            <div className="row" style={{gap:14}}>
              <span className="mono mute" style={{fontSize:10.5}}>Max gain <span className="green">{maxP>1e6?'∞':fmt(maxP,2)}</span></span>
              <span className="mono mute" style={{fontSize:10.5}}>Max loss <span className="red">{minP<-1e6?'-∞':fmt(minP,2)}</span></span>
            </div>
          }>
            <PayoffChart payoff={payoff} breakevens={breakevens} legs={legs}/>
          </ChartFrame>

          <div className="panel">
            <div className="row between" style={{padding:'12px 16px', borderBottom:'1px solid var(--line)'}}>
              <div className="label">Legs</div>
              <div className="row" style={{gap:8}}>
                {presets.map(p=>(
                  <button key={p.name} className="btn btn-ghost btn-sm" onClick={()=>loadPreset(p)} style={{padding:'4px 8px', fontSize:11}}>{p.name}</button>
                ))}
              </div>
            </div>
            <table className="data">
              <thead><tr><th>Side</th><th>Type</th><th className="num">Strike</th><th className="num">Qty</th><th className="num">Premium</th><th className="num">Cost</th><th></th></tr></thead>
              <tbody>
                {legs.map(l => (
                  <tr key={l.id}>
                    <td>
                      <select value={l.side} onChange={e=>updateLeg(l.id,'side',e.target.value)} style={{background:'#06080B',border:'1px solid var(--line-2)',color:l.side==='long'?'var(--green)':'var(--red)',padding:'3px 6px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderRadius:2}}>
                        <option value="long">LONG</option>
                        <option value="short">SHORT</option>
                      </select>
                    </td>
                    <td>
                      <select value={l.type} onChange={e=>updateLeg(l.id,'type',e.target.value)} style={{background:'#06080B',border:'1px solid var(--line-2)',color:'var(--text)',padding:'3px 6px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderRadius:2}}>
                        <option value="call">CALL</option>
                        <option value="put">PUT</option>
                      </select>
                    </td>
                    <td className="num">
                      <input type="number" value={l.K} onChange={e=>updateLeg(l.id,'K',+e.target.value)} style={{width:60,background:'#06080B',border:'1px solid var(--line-2)',color:'var(--text)',padding:'3px 6px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderRadius:2,textAlign:'right'}}/>
                    </td>
                    <td className="num">
                      <input type="number" value={l.qty} onChange={e=>updateLeg(l.id,'qty',+e.target.value)} style={{width:50,background:'#06080B',border:'1px solid var(--line-2)',color:'var(--text)',padding:'3px 6px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderRadius:2,textAlign:'right'}}/>
                    </td>
                    <td className="num">
                      <input type="number" step="0.1" value={l.prem} onChange={e=>updateLeg(l.id,'prem',+e.target.value)} style={{width:62,background:'#06080B',border:'1px solid var(--line-2)',color:'var(--text)',padding:'3px 6px',fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderRadius:2,textAlign:'right'}}/>
                    </td>
                    <td className="num">{fmt(l.prem*l.qty*(l.side==='long'?1:-1),2)}</td>
                    <td><button onClick={()=>removeLeg(l.id)} className="btn btn-ghost btn-sm" style={{padding:'2px 6px'}}><Icon name="x" size={12}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col" style={{gap:14}}>
          <div className="panel" style={{padding:16}}>
            <div className="label" style={{marginBottom:14}}>Strategy Metrics</div>
            <div className="col" style={{gap:10}}>
              {[
                ['Net Debit', netDebit>=0?fmt(netDebit,2):'-', netDebit>=0?'mute':''],
                ['Net Credit', netDebit<0?fmt(-netDebit,2):'-', netDebit<0?'green':''],
                ['Max Gain', maxP>1e6?'Unlimited':fmt(maxP,2), maxP>0?'green':''],
                ['Max Loss', minP<-1e6?'Unlimited':fmt(minP,2), 'red'],
                ['Breakevens', breakevens.length?breakevens.map(b=>fmt(b,1)).join(' · '):'—', 'mono'],
                ['Risk/Reward', maxP>0&&minP<0?fmt(maxP/Math.abs(minP),2):'—', ''],
              ].map(([k,v,c])=>(
                <div key={k} className="row between" style={{padding:'8px 0', borderTop:k!=='Net Debit'?'1px solid var(--line)':'none'}}>
                  <span className="mono mute" style={{fontSize:11}}>{k}</span>
                  <span className={"mono tnum "+c} style={{fontSize:12.5,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="row between" style={{padding:'12px 14px',borderBottom:'1px solid var(--line)'}}>
              <div className="label">Aggregate Greeks</div>
              <span className="mono mute" style={{fontSize:10.5}}>S=100, σ=20%, T=30d</span>
            </div>
            <table className="data">
              <tbody>
                {(()=>{
                  const aggParams = {S:100,K:100,r:0.02,sigma:0.20,T:30/365};
                  let D=0,G=0,V=0,Th=0;
                  for (const l of legs) {
                    const p = bsPrice({...aggParams, K:l.K, type:l.type});
                    const sign = l.qty * (l.side==='long'?1:-1);
                    D += p.delta*sign; G += p.gamma*sign; V += p.vega*sign; Th += p.theta*sign;
                  }
                  return [['Δ Delta',D,4],['Γ Gamma',G,5],['ν Vega',V,3],['Θ Theta',Th,4]].map(([k,v,d])=>(
                    <tr key={k}><td className="symbol">{k}</td><td className={"num "+(v>=0?'green':'red')}>{fmt(v,d)}</td></tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          <div className="panel" style={{padding:14}}>
            <div className="label" style={{marginBottom:8}}>Strategy DNA</div>
            <div className="mono mute" style={{fontSize:11,lineHeight:1.8}}>
              {legs.map((l,i) => (
                <div key={l.id}>
                  {l.side==='long'?'+':'-'}{l.qty} {l.type.toUpperCase()} {l.K} @ {fmt(l.prem,2)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function PayoffChart({payoff, breakevens, legs}) {
  const W=820, H=320;
  const ML=44, MR=16, MT=16, MB=28;
  const ys = payoff.map(p=>p.y);
  const ymin = Math.min(...ys), ymax = Math.max(...ys);
  const pad = (ymax-ymin)*0.1 || 1;
  const yLo = ymin-pad, yHi = ymax+pad;
  const xs = payoff.map(p=>p.x);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const X = x=>ML+(x-xmin)/(xmax-xmin)*(W-ML-MR);
  const Y = y=>MT+(1-(y-yLo)/(yHi-yLo))*(H-MT-MB);
  // build paths split by sign
  const posPath = payoff.map((p,i)=>`${i===0?'M':'L'} ${X(p.x)} ${Y(Math.max(p.y,0))}`).join(' ');
  const negPath = payoff.map((p,i)=>`${i===0?'M':'L'} ${X(p.x)} ${Y(Math.min(p.y,0))}`).join(' ');
  const zero = Y(0);
  const linePath = payoff.map((p,i)=>`${i===0?'M':'L'} ${X(p.x)} ${Y(p.y)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{display:'block',fontFamily:"'JetBrains Mono',monospace"}}>
      {/* y grid */}
      {[yLo, (yLo+yHi)/2, yHi].map((t,i)=>(
        <g key={i}>
          <line x1={ML} y1={Y(t)} x2={W-MR} y2={Y(t)} stroke="#1A1F28"/>
          <text x={ML-6} y={Y(t)+3} textAnchor="end" fill="#7C8493" fontSize="10">{t.toFixed(0)}</text>
        </g>
      ))}
      {/* zero line */}
      <line x1={ML} y1={zero} x2={W-MR} y2={zero} stroke="#3A4150" strokeWidth="1"/>
      {/* x axis */}
      <line x1={ML} y1={H-MB} x2={W-MR} y2={H-MB} stroke="#2C3340"/>
      {[xmin, (xmin+xmax)/2, xmax].map((t,i)=>(
        <text key={i} x={X(t)} y={H-10} textAnchor="middle" fill="#7C8493" fontSize="10">{t.toFixed(0)}</text>
      ))}
      {/* fill positive */}
      <path d={`M ${X(xmin)} ${zero} ${payoff.map(p=>`L ${X(p.x)} ${Y(Math.max(p.y,0))}`).join(' ')} L ${X(xmax)} ${zero} Z`} fill="#19C37D" opacity="0.12"/>
      <path d={`M ${X(xmin)} ${zero} ${payoff.map(p=>`L ${X(p.x)} ${Y(Math.min(p.y,0))}`).join(' ')} L ${X(xmax)} ${zero} Z`} fill="#FF2E45" opacity="0.12"/>
      {/* strikes */}
      {legs.map((l,i)=>(
        <g key={i}>
          <line x1={X(l.K)} y1={MT} x2={X(l.K)} y2={H-MB} stroke="#3E8BFF" strokeDasharray="2 3" strokeWidth="1" opacity="0.6"/>
          <text x={X(l.K)} y={MT-2} textAnchor="middle" fill="#3E8BFF" fontSize="9">K={l.K}</text>
        </g>
      ))}
      {/* breakevens */}
      {breakevens.map((b,i)=>(
        <g key={i}>
          <line x1={X(b)} y1={MT} x2={X(b)} y2={H-MB} stroke="#FFB020" strokeDasharray="3 3" opacity="0.7"/>
          <circle cx={X(b)} cy={zero} r="3" fill="#FFB020"/>
          <text x={X(b)+4} y={zero-4} fill="#FFB020" fontSize="9">BE {b.toFixed(1)}</text>
        </g>
      ))}
      {/* payoff line */}
      <path d={linePath} fill="none" stroke="#FF2E45" strokeWidth="2"/>
    </svg>
  );
}

// ============= MONTE CARLO =============
function MonteCarloTool() {
  const [S,setS]=useState(100),[mu,setMu]=useState(5),[sigma,setSigma]=useState(20),[T,setT]=useState(252),[N,setN]=useState(1000);
  useToolRegister('mc', {S,mu,sigma,T,N}, {S:setS,mu:setMu,sigma:setSigma,T:setT,N:setN});
  const [seed,setSeed] = useState(7);
  const paths = useMemo(()=>{
    const out = [];
    const steps = 100;
    let rng = seed;
    const rnd = () => { rng = (rng*1664525+1013904223) % 4294967296; return rng/4294967296; };
    const gauss = () => Math.sqrt(-2*Math.log(rnd()||0.0001))*Math.cos(2*Math.PI*rnd());
    const dt = (T/365)/steps;
    for (let i=0;i<Math.min(N,40);i++) {
      let s = S;
      const p = [{x:0, y:s}];
      for (let t=1;t<=steps;t++) {
        s = s * Math.exp((mu/100 - 0.5*(sigma/100)**2)*dt + (sigma/100)*Math.sqrt(dt)*gauss());
        p.push({x:t, y:+s.toFixed(2)});
      }
      out.push(p);
    }
    return out;
  },[S,mu,sigma,T,N,seed]);

  const histo = useMemo(()=>{
    const bins = Array(24).fill(0);
    let rng = seed*3+1;
    const rnd = () => { rng = (rng*1664525+1013904223) % 4294967296; return rng/4294967296; };
    const gauss = () => Math.sqrt(-2*Math.log(rnd()||0.0001))*Math.cos(2*Math.PI*rnd());
    const steps = 60;
    const dt = (T/365)/steps;
    let finals = [];
    for (let i=0;i<Math.min(N*5,5000);i++) {
      let s = S;
      for (let t=1;t<=steps;t++) {
        s = s * Math.exp((mu/100 - 0.5*(sigma/100)**2)*dt + (sigma/100)*Math.sqrt(dt)*gauss());
      }
      finals.push(s);
    }
    const fmin = Math.min(...finals), fmax = Math.max(...finals);
    const bw = (fmax-fmin)/24;
    for (const f of finals) bins[Math.min(23, Math.max(0, Math.floor((f-fmin)/bw)))]++;
    return {bins: bins.map((b,i)=>({x:Math.round(fmin+i*bw), y:b})), finals};
  },[S,mu,sigma,T,N,seed]);

  const sorted = [...histo.finals].sort((a,b)=>a-b);
  const var95 = sorted[Math.floor(sorted.length*0.05)]-S;
  const var99 = sorted[Math.floor(sorted.length*0.01)]-S;
  const es99 = sorted.slice(0, Math.floor(sorted.length*0.01)).reduce((a,b)=>a+(b-S),0)/Math.max(1,Math.floor(sorted.length*0.01));
  const mean = sorted.reduce((a,b)=>a+b,0)/sorted.length;

  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/tools">tools</Link><i>›</i><span>monte carlo</span></>}
        title="Monte Carlo Simulator"
        sub="Geometric Brownian motion — paths, terminal distribution, VaR and Expected Shortfall."
        right={<>
          <span className="badge badge-green">Free</span>
          <button className="btn btn-outline btn-sm" onClick={()=>setSeed(seed+1)}><Icon name="refresh-cw" size={13}/> Re-seed</button>
          <button className="btn btn-primary btn-sm" onClick={()=>{setSeed(seed+1); notify('Monte Carlo simulation refreshed.')}}><Icon name="play" size={13}/> Run</button>
        </>}
      />
      <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:14}}>
        <div className="panel" style={{padding:18,alignSelf:'start'}}>
          <div className="label" style={{marginBottom:14}}>Parameters</div>
          {[
            ['Spot S', S, 10, 500, 0.5, setS, '$'],
            ['Drift μ', mu, -10, 25, 0.1, setMu, '%'],
            ['Vol σ', sigma, 1, 100, 0.5, setSigma, '%'],
            ['Horizon T', T, 5, 730, 1, setT, 'd'],
            ['Paths N', N, 100, 5000, 100, setN, ''],
          ].map(([lbl,val,min,max,step,setter,unit])=>(
            <div key={lbl} className="field" style={{marginBottom:14}}>
              <div className="row between">
                <span className="mono mute" style={{fontSize:11}}>{lbl}</span>
                <span className="mono" style={{fontSize:12.5,fontWeight:600}}>{val}{unit&&' '+unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(+e.target.value)}/>
            </div>
          ))}
          <div className="hairline" style={{margin:'16px 0'}}></div>
          <div className="label" style={{marginBottom:10}}>Risk Metrics</div>
          <table className="data" style={{border:'none'}}>
            <tbody>
              <tr><td className="symbol">Mean S(T)</td><td className="num">{fmt(mean,2)}</td></tr>
              <tr><td className="symbol">VaR 95%</td><td className="num red">{fmt(var95,2)}</td></tr>
              <tr><td className="symbol">VaR 99%</td><td className="num red">{fmt(var99,2)}</td></tr>
              <tr><td className="symbol">ES 99%</td><td className="num red">{fmt(es99,2)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="col" style={{gap:14}}>
          <ChartFrame title={`GBM paths · ${paths.length} of ${N}`} subtitle={`S₀=${S} · σ=${sigma}% · T=${T}d`}>
            <svg viewBox="0 0 760 280" width="100%" height="280">
              <line x1="44" y1="260" x2="750" y2="260" stroke="#2C3340"/>
              <line x1="44" y1="10" x2="44" y2="260" stroke="#2C3340"/>
              {(()=>{
                const allY = paths.flat().map(p=>p.y);
                const ymin = Math.min(...allY), ymax = Math.max(...allY);
                return paths.map((p,i)=>{
                  const path = p.map((d,j)=>`${j===0?'M':'L'} ${44+j/(p.length-1)*706} ${260-(d.y-ymin)/((ymax-ymin)||1)*240}`).join(' ');
                  return <path key={i} d={path} fill="none" stroke="#FF2E45" strokeWidth="0.7" opacity="0.4"/>;
                });
              })()}
            </svg>
          </ChartFrame>
          <div className="grid-2">
            <ChartFrame title="Terminal distribution" subtitle="S(T) histogram · 5,000 samples">
              <BarChart data={histo.bins} width={420} height={220} color="#3E8BFF" labels={false}/>
            </ChartFrame>
            <div className="panel">
              <div className="row between" style={{padding:'12px 14px',borderBottom:'1px solid var(--line)'}}>
                <div className="label">Quantiles · S(T)</div>
              </div>
              <table className="data">
                <thead><tr><th>%</th><th className="num">Value</th><th className="num">Δ vs S₀</th></tr></thead>
                <tbody>
                  {[[1,sorted[Math.floor(sorted.length*0.01)]],
                    [5,sorted[Math.floor(sorted.length*0.05)]],
                    [25,sorted[Math.floor(sorted.length*0.25)]],
                    [50,sorted[Math.floor(sorted.length*0.50)]],
                    [75,sorted[Math.floor(sorted.length*0.75)]],
                    [95,sorted[Math.floor(sorted.length*0.95)]],
                    [99,sorted[Math.floor(sorted.length*0.99)]]].map(([p,v])=>(
                    <tr key={p}><td className="symbol">P{p}</td><td className="num">{fmt(v,2)}</td><td className={"num "+(v-S>=0?'green':'red')}>{fmtPct((v-S)/S,2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============= IV CALCULATOR =============
function IVCalcTool() {
  const [asset,setAsset] = useState('SPX');
  const [window,setWin] = useState(20);
  useToolRegister('iv-calc', {asset,window}, {asset:setAsset, window:setWin});
  const assets = ['SPX','NDX','TSLA','NVDA','BTC','EURUSD'];
  // Build a price walk and rolling realized vol
  const prices = useMemo(()=>genWalk(252, 100, 0.013, 0.0002, asset.charCodeAt(0)+window),[asset,window]);
  const rv = useMemo(()=>{
    const out = [];
    for (let i=window;i<prices.length;i++) {
      let v = 0;
      for (let j=i-window+1;j<=i;j++) {
        const r = Math.log(prices[j].y/prices[j-1].y);
        v += r*r;
      }
      out.push({x:i, y: Math.sqrt(v/window*252)*100 });
    }
    return out;
  },[prices, window]);
  const current = rv[rv.length-1]?.y || 0;

  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/tools">tools</Link><i>›</i><span>volatility calculator</span></>}
        title="Volatility Calculator"
        sub="Realized volatility via rolling windows. Compare estimators across assets."
        right={<><span className="badge badge-green">Free</span></>}
      />
      <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:14}}>
        <div className="panel" style={{padding:18,alignSelf:'start'}}>
          <div className="label" style={{marginBottom:10}}>Asset</div>
          <div className="col" style={{gap:4}}>
            {assets.map(a=>(
              <button key={a} className={"row between "+(a===asset?'on':'')} onClick={()=>setAsset(a)} style={{padding:'8px 12px',background:a===asset?'rgba(255,46,69,.08)':'transparent',border:'1px solid '+(a===asset?'rgba(255,46,69,.3)':'transparent'),borderRadius:3,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:a===asset?'var(--text)':'var(--text-2)'}}>
                <span>{a}</span>
                <span className="mute" style={{fontSize:10.5}}>{a===asset?'●':'select'}</span>
              </button>
            ))}
          </div>
          <div className="hairline" style={{margin:'18px 0'}}></div>
          <div className="label" style={{marginBottom:10}}>Window</div>
          {[5,10,20,60,120].map(w=>(
            <button key={w} className={"toggle-btn"} onClick={()=>setWin(w)} style={{padding:'6px 12px',marginRight:6,marginBottom:6,background:w===window?'var(--red)':'#06080B',color:w===window?'#fff':'var(--text-2)',border:'1px solid '+(w===window?'var(--red)':'var(--line-2)'),fontFamily:"'JetBrains Mono',monospace",fontSize:11,borderRadius:3}}>{w}d</button>
          ))}
          <div className="hairline" style={{margin:'18px 0'}}></div>
          <div className="label" style={{marginBottom:8}}>Current realized vol</div>
          <div className="mono" style={{fontSize:36,fontWeight:700,color:'var(--red)',lineHeight:1}}>{fmt(current,2)}%</div>
          <div className="mono mute" style={{fontSize:11,marginTop:6}}>{window}d annualized · 252 trading days</div>
        </div>
        <div className="col" style={{gap:14}}>
          <ChartFrame title={`${asset} · Price`} subtitle="252 trading days, synthetic">
            <LineChart width={760} height={220} series={[{name:asset, color:'#FF2E45', data:prices, fillOpacity:0.08}]}/>
          </ChartFrame>
          <ChartFrame title={`Rolling realized vol · ${window}d`} subtitle="Annualized %">
            <LineChart width={760} height={220} series={[{name:'rv', color:'#FFB020', data:rv, fillOpacity:0.08}]}/>
          </ChartFrame>
        </div>
      </div>
    </div>
  );
}

// ============= CALIBRATION =============
function solve3(A,b){ // Gaussian elimination for 3x3
  const M=[[...A[0],b[0]],[...A[1],b[1]],[...A[2],b[2]]];
  for(let i=0;i<3;i++){
    let p=i; for(let r=i+1;r<3;r++) if(Math.abs(M[r][i])>Math.abs(M[p][i])) p=r;
    [M[i],M[p]]=[M[p],M[i]];
    if(Math.abs(M[i][i])<1e-12) return null;
    for(let r=0;r<3;r++){ if(r!==i){ const f=M[r][i]/M[i][i]; for(let c=i;c<4;c++) M[r][c]-=f*M[i][c]; } }
  }
  return [M[0][3]/M[0][0],M[1][3]/M[1][1],M[2][3]/M[2][2]];
}
function fitQuadraticSmile(points, S0){ // sigma = a + b k + c k^2, k=ln(K/S0); least squares
  let s0=points.length,s1=0,s2=0,s3=0,s4=0,ty=0,tky=0,tk2y=0;
  for(const {K,iv} of points){ const k=Math.log(K/S0); const k2=k*k;
    s1+=k; s2+=k2; s3+=k2*k; s4+=k2*k2; ty+=iv; tky+=k*iv; tk2y+=k2*iv; }
  const A=[[s0,s1,s2],[s1,s2,s3],[s2,s3,s4]], b=[ty,tky,tk2y];
  const sol=solve3(A,b); if(!sol) return {a:NaN,b:NaN,c:NaN,rmse:NaN,mae:NaN};
  const [a,bb,c]=sol;
  let se=0,ae=0; for(const {K,iv} of points){ const k=Math.log(K/S0); const m=a+bb*k+c*k*k; se+=(m-iv)**2; ae+=Math.abs(m-iv); }
  return {a,b:bb,c,rmse:Math.sqrt(se/points.length),mae:ae/points.length, model:(K)=>{const k=Math.log(K/S0);return a+bb*k+c*k*k;}};
}
function CalibrationTool() {
  const S0=100;
  const [points,setPoints]=useState([
    {K:80,iv:0.262},{K:90,iv:0.221},{K:95,iv:0.205},{K:100,iv:0.192},
    {K:105,iv:0.187},{K:110,iv:0.190},{K:120,iv:0.214},
  ]);
  const fit=useMemo(()=>fitQuadraticSmile(points,S0),[points]);
  const setIv=(i,v)=>setPoints(ps=>ps.map((p,j)=>j===i?{...p,iv:v}:p));
  const market=points.map(p=>({x:p.K,y:+(p.iv*100).toFixed(2)}));
  const fitted=useMemo(()=>{const a=[];for(let K=78;K<=122;K+=1)a.push({x:K,y:+((fit.model?fit.model(K):0)*100).toFixed(2)});return a;},[fit]);
  return (
    <div className="container page">
      <ToolHead slug="model calibration" name="Smile Calibration (least-squares)" sub="Fit a quadratic-in-log-moneyness smile to market IV quotes — real closed-form least squares."/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:14}}>
        <div className="col" style={{gap:14}}>
          <ChartFrame title="Market vs fitted smile" subtitle="implied vol (%) vs strike">
            <LineChart width={760} height={300} series={[
              {name:'Fitted', color:'#3E8BFF', data:fitted, fill:false, dashed:true},
              {name:'Market', color:'#FF2E45', data:market, fill:false, strokeWidth:2},
            ]}/>
          </ChartFrame>
          <div className="panel">
            <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
              <div className="label">Market quotes (editable)</div>
              <span className="badge">spot {S0}</span>
            </div>
            <table className="data">
              <thead><tr><th>Strike</th><th className="num">Market σ</th><th className="num">Fitted σ</th><th className="num">Residual</th></tr></thead>
              <tbody>
                {points.map((p,i)=>{ const m=fit.model?fit.model(p.K):0; const res=m-p.iv; return (
                  <tr key={p.K}>
                    <td className="symbol">{p.K}</td>
                    <td className="num"><input value={p.iv} onChange={e=>{const v=parseFloat(e.target.value);if(!isNaN(v))setIv(i,v);}} style={{width:80,textAlign:'right',background:'#0A0C10',border:'1px solid var(--line-2)',color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,borderRadius:3,padding:'3px 6px'}}/></td>
                    <td className="num">{m.toFixed(4)}</td>
                    <td className={"num "+(Math.abs(res)<0.005?'green':'amber')}>{res>=0?'+':''}{res.toFixed(4)}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col" style={{gap:14}}>
          <div className="panel" style={{padding:16}}>
            <div className="label" style={{marginBottom:6}}>Calibrated parameters</div>
            <ResultRow k="a (ATM level)" v={fmt(fit.a,4)} accent="var(--red)"/>
            <ResultRow k="b (skew)" v={fmt(fit.b,4)}/>
            <ResultRow k="c (curvature)" v={fmt(fit.c,4)}/>
            <div className="hairline" style={{margin:'12px 0'}}></div>
            <ResultRow k="RMSE" v={fmt(fit.rmse,5)} accent={fit.rmse<0.005?'var(--green)':'var(--amber)'}/>
            <ResultRow k="MAE" v={fmt(fit.mae,5)} accent={fit.mae<0.005?'var(--green)':'var(--amber)'}/>
            <div className="mute" style={{fontSize:11.5,marginTop:12,lineHeight:1.5}}>σ(K) = a + b·ln(K/S) + c·ln(K/S)². Closed-form normal-equations fit — edit any quote and the fit + residuals update live. (SABR/Heston need an iterative solver — that runs on the backend.)</div>
          </div>
          <div className="panel" style={{padding:16}}>
            <div className="label" style={{marginBottom:6}}>Method</div>
            <ResultRow k="Estimator" v="Ordinary least squares"/>
            <ResultRow k="Basis" v="1, k, k²"/>
            <ResultRow k="Points" v={String(points.length)}/>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {ToolsPage, BSPricerTool, PayoffVisualizerTool, MonteCarloTool, IVCalcTool, CalibrationTool});


// ===== src\pages-lab.jsx =====
// Trading Lab, Exercises, Survival Mode

// ============= TRADING LAB =============
function TradingLabPage({route}) {
  const sub = route.parts[1] || 'backtest';
  const tabs = [
    ['exercises','Trading Exercises'],
    ['backtest','Backtest'],
    ['scenarios','Scenarios'],
    ['strategies','Strategies'],
    ['performance','Performance'],
  ];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ trading lab</span></>}
        title="Trading Lab"
        sub="Backtest sur un vrai moteur (données réelles) dans l’onglet Backtest ; les Scénarios/Stratégies restent des simulations pédagogiques."
        right={<>
          <span className="badge"><span className="dot dot-green"></span>MOTEUR RÉEL · BACKTEST</span>
        </>}
      />
      <div className="tabs-bar">
        {tabs.map(([k,l])=>(
          <Link key={k} to={"/lab/"+k} className={"tab-btn "+(sub===k?'on':'')}>{l}</Link>
        ))}
      </div>
      {sub==='backtest' && <BacktestPanel/>}
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
    strategyApi.instruments().then((d) => {
      if (!alive) return;
      if (!d || !d.instruments) { setMetaErr(true); return; }
      setMeta(d);
    });
    return () => { alive = false; };
  }, []);

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
              {metaErr ? 'BACKEND HORS LIGNE' : (meta ? (meta.available ? 'MOTEUR EN LIGNE' : 'MOTEUR INDISPONIBLE') : 'CONNEXION…')}
            </span>
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Instrument</span>
            <select value={instrument} onChange={(e) => setInstrument(e.target.value)} disabled={!instruments.length}>
              {instruments.length
                ? instruments.map((i) => <option key={i.key} value={i.key}>{i.label} · {i.asset_class}</option>)
                : <option value="EURUSD">EUR/USD</option>}
            </select>
          </div>

          <div className="field" style={{ marginBottom: 6 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Stratégie (walk-forward OOS)</span>
            <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              {STRATEGY_CHOICES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="mute" style={{ fontSize: 11, marginBottom: 12 }}>
            {STRATEGY_CHOICES.find((s) => s[0] === strategy)?.[2]}
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Capital</span>
            <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value) || 0)} />
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <span className="mono mute" style={{ fontSize: 11, letterSpacing: '.08em' }}>Horizon</span>
            <select value={maxBars} onChange={(e) => setMaxBars(Number(e.target.value))}>
              {STRATEGY_HORIZONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>

          <button className="btn btn-primary btn-sm" disabled={loading || metaErr} onClick={runBacktest} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            <Icon name="play" size={13} /> {loading ? 'Backtest en cours…' : 'Run backtest'}
          </button>
          <button className="btn btn-outline btn-sm" disabled={wfLoading || metaErr} onClick={runWalkforward} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
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
              {loading ? 'Calcul du backtest sur données réelles…' : (metaErr ? 'Backend requis : aucune métrique tant que le moteur est hors ligne.' : 'Lance un backtest pour afficher des métriques réelles.')}
            </div>
          )}
        </div>
      </div>

      {/* charts + verdict + trades */}
      <div className="col" style={{ gap: 14 }}>
        {metaErr && (
          <div className="panel" style={{ padding: 18, borderColor: '#FF2E45' }}>
            <div className="label" style={{ color: '#FF2E45' }}>Backend requis</div>
            <div className="mute" style={{ fontSize: 13, marginTop: 8 }}>
              Le Trading Lab exécute un vrai moteur de backtest côté serveur ({strategyApi.base()}). Démarre le backend FastAPI pour lancer des backtests sur données réelles. Aucun chiffre n’est simulé ici.
            </div>
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
// Real distribution -> expected P&L, Sharpe, worst path, win rate.
function scenarioMC({mu, sigma, seed=1, n=2000, entryIV=0.18}){
  const S0=100, T=30/252, Kc=105, Kp=95, M=400; // contract multiplier -> ~$100k book
  const premium=(bsPrice({S:S0,K:Kc,r:0.02,sigma:entryIV,T,type:'call'}).price + bsPrice({S:S0,K:Kp,r:0.02,sigma:entryIV,T,type:'put'}).price)*M;
  let s=(seed*2654435761>>>0)||1; const rnd=()=>{ s=(1103515245*s+12345)>>>0; return s/4294967296; };
  const gauss=()=>{ let u=0,v=0; while(u===0)u=rnd(); while(v===0)v=rnd(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  const pnls=[]; let worst=Infinity, wins=0;
  for(let i=0;i<n;i++){
    const ST=S0*Math.exp((mu-0.5*sigma*sigma)*T+sigma*Math.sqrt(T)*gauss());
    const pnl=premium - (Math.max(ST-Kc,0)+Math.max(Kp-ST,0))*M;
    pnls.push(pnl); if(pnl<worst)worst=pnl; if(pnl>0)wins++;
  }
  const mean=pnls.reduce((a,b)=>a+b,0)/n;
  const sd=Math.sqrt(pnls.reduce((a,b)=>a+(b-mean)**2,0)/n);
  return { pnl:Math.round(mean), sharpe:sd>0?mean/sd:0, worst:Math.round(worst), win:Math.round(100*wins/n), volPnl:Math.round(sd), meanRet:mean/100000 };
}
function ScenariosPanel() {
  const presets=[
    {n:'Bullish drift', d:'Slow grind higher · σ=12%', mu:0.15, sigma:0.12, seed:11},
    {n:'Bearish drift', d:'Trend reversal · σ=15%', mu:-0.15, sigma:0.15, seed:22},
    {n:'Vol spike', d:'Realised σ=45%', mu:0, sigma:0.45, seed:33},
    {n:'Vol crush', d:'Realised σ=8%', mu:0, sigma:0.08, seed:44},
    {n:'Time decay', d:'Sideways · σ=12%', mu:0, sigma:0.12, seed:55},
    {n:'Rate shock', d:'Drift -5% · σ=20%', mu:-0.05, sigma:0.20, seed:66},
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
            <div className="mute" style={{fontSize:12,marginTop:6}}>{p.d}</div>
            <div className="grid-2" style={{gap:8,marginTop:14}}>
              {[['Sharpe',p.sharpe.toFixed(2)],['Worst','$'+p.worst.toLocaleString()],['Win',p.win+'%'],['E[P&L]',p.pnl.toLocaleString()]].map(([k,v])=>(
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
          <div className="label">Aggregate stress · Short Strangle (Kc 105 / Kp 95)</div>
          <span className="badge">6 scenarios · 2000 paths each · live MC</span>
        </div>
        <table className="data">
          <thead><tr><th>Scenario</th><th className="num">E[P&L]</th><th className="num">Mean Return</th><th className="num">Vol of P&L</th><th className="num">Sharpe</th><th className="num">Worst Path</th></tr></thead>
          <tbody>
            {rows.map(p=>(
              <tr key={p.n}>
                <td className="symbol">{p.n}</td>
                <td className={"num "+(p.pnl>=0?'green':'red')}>{p.pnl>=0?'+':''}{p.pnl.toLocaleString()}</td>
                <td className={"num "+(p.pnl>=0?'green':'red')}>{(p.meanRet*100).toFixed(2)}%</td>
                <td className="num">{p.volPnl.toLocaleString()}</td>
                <td className="num">{p.sharpe.toFixed(2)}</td>
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
    {n:'Calendar Spread', vol:'Low', view:'Neutral', max:'Capped', cost:'Debit'},
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
              <div className="mono mute" style={{fontSize:10}}>Vol bias</div>
              <div className="mono" style={{fontSize:12,fontWeight:600,marginTop:2}}>{t.vol}</div>
            </div>
          </div>
          <Link to="/tools/payoff" className="btn btn-outline btn-sm" style={{width:'100%',justifyContent:'center',marginTop:14}}>Open in builder <Icon name="arrow-right" size={13}/></Link>
        </div>
      ))}
    </div>
  );
}
function StrategySketch({name}){
  // Quick payoff sketches for templates
  const map = {
    'Bull Call Spread': 'M 0,80 L 60,80 L 130,30 L 200,30',
    'Iron Condor': 'M 0,30 L 40,30 L 80,80 L 120,80 L 160,30 L 200,30',
    'Butterfly': 'M 0,80 L 70,80 L 100,30 L 130,80 L 200,80',
    'Long Call': 'M 0,80 L 100,80 L 200,15',
    'Bear Put Spread': 'M 0,30 L 70,30 L 140,80 L 200,80',
    'Long Straddle': 'M 0,30 L 100,80 L 200,30',
    'Short Strangle': 'M 0,30 L 70,80 L 130,80 L 200,30',
    'Calendar Spread': 'M 0,80 L 60,80 Q 100,40 140,80 L 200,80',
  };
  return (
    <svg viewBox="0 0 200 100" width="100%" height="90">
      <line x1="0" y1="80" x2="200" y2="80" stroke="#2C3340"/>
      <path d={map[name] || map['Bull Call Spread']} fill="none" stroke="#FF2E45" strokeWidth="1.6"/>
    </svg>
  );
}

function PerformancePanel() {
  const strategies = useMemo(()=>{
    const defs=[
      {n:'Short Strangle SPX', mu:0.05, sigma:0.14, seed:101, runs:28},
      {n:'Short Strangle NDX', mu:0.02, sigma:0.20, seed:202, runs:14},
      {n:'Short Strangle TSLA', mu:0.0, sigma:0.42, seed:303, runs:9},
      {n:'Short Strangle NVDA', mu:0.08, sigma:0.10, seed:404, runs:18},
      {n:'Short Strangle SPY', mu:0.03, sigma:0.12, seed:505, runs:21},
    ];
    return defs.map(d=>{ const m=scenarioMC(d); return {n:d.n, sharpe:+m.sharpe.toFixed(2), pnl:m.pnl, win:m.win, dd:+((m.worst/100000)*100).toFixed(1), runs:d.runs}; });
  },[]);
  const totalPnL=strategies.reduce((a,s)=>a+s.pnl,0);
  const avgSharpe=strategies.reduce((a,s)=>a+s.sharpe,0)/strategies.length;
  const avgWin=strategies.reduce((a,s)=>a+s.win,0)/strategies.length;
  const maxDD=Math.min(...strategies.map(s=>s.dd));
  return (
    <div className="col" style={{gap:14}}>
      <div className="grid-4">
        {[
          {l:'Total E[P&L]',v:(totalPnL>=0?'+':'')+totalPnL.toLocaleString(),c:totalPnL>=0?'var(--green)':'var(--red)'},
          {l:'Avg Sharpe',v:avgSharpe.toFixed(2),c:'var(--text)'},
          {l:'Win Rate',v:avgWin.toFixed(1)+'%',c:'var(--text)'},
          {l:'Worst Path',v:maxDD.toFixed(1)+'%',c:'var(--red)'},
        ].map(s=><Stat key={s.l} label={s.l} value={s.v} accent={s.c}/>)}
      </div>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Strategy leaderboard · Q2 2026</div>
          <button className="btn btn-ghost btn-sm" onClick={()=>copyText(strategies.map((s)=>`${s.n},${s.sharpe},${s.pnl},${s.win}`).join('\n'), 'Performance table copied as CSV.')}>Export</button>
        </div>
        <table className="data">
          <thead><tr><th>#</th><th>Strategy</th><th className="num">Sharpe</th><th className="num">P&L</th><th className="num">Win %</th><th className="num">Max DD</th><th className="num">Runs</th><th></th></tr></thead>
          <tbody>
            {strategies.sort((a,b)=>b.sharpe-a.sharpe).map((s,i)=>(
              <tr key={s.n}>
                <td className="symbol">{i+1}</td>
                <td className="symbol">{s.n}</td>
                <td className="num">{s.sharpe}</td>
                <td className={"num "+(s.pnl>=0?'green':'red')}>{s.pnl>=0?'+':''}{s.pnl}</td>
                <td className="num">{s.win}%</td>
                <td className="num red">{s.dd}%</td>
                <td className="num">{s.runs}</td>
                <td><Icon name="chevron-right" size={12} style={{color:'var(--mute)'}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TradingExercisesPanel() {
  const exs = [
    {n:'Hedge a delta-neutral book', diff:'L3', t:'45m'},
    {n:'Roll a calendar through expiry', diff:'L3', t:'35m'},
    {n:'Capture a vol-spike with strangle', diff:'L2', t:'30m'},
    {n:'Pair-trade SPX vs NDX', diff:'L4', t:'60m'},
    {n:'Earnings event positioning', diff:'L3', t:'40m'},
    {n:'Construct a gamma-neutral hedge', diff:'L4', t:'55m'},
  ];
  return (
    <div className="grid-3">
      {exs.map(e=>(
        <div key={e.n} className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:12}}>
            <span className="badge">{e.diff}</span>
            <span className="mono mute" style={{fontSize:11}}>{e.t}</span>
          </div>
          <div className="mono" style={{fontWeight:700, marginBottom:8}}>{e.n}</div>
          <div className="mute" style={{fontSize:12.5,lineHeight:1.5}}>Step-by-step exercise with a simulated market and grading.</div>
          <button className="btn btn-outline btn-sm" onClick={()=>notify(`${e.n} opened in the trading lab.`)} style={{marginTop:14,width:'100%',justifyContent:'center'}}>Start exercise</button>
        </div>
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
  const [cat,setCat] = useState('All');
  const [query,setQuery] = useState('');
  const [generated,setGenerated] = useState(()=>loadGeneratedExercises());
  const cats = ['All','Generated','Black-Scholes','Greeks','Volatility','Monte Carlo','Barrier','Yield Curves','Rates','Credit','Risk','Exotic'];
  const normalizedQuery = query.trim().toLowerCase();
  const allExercises = useMemo(()=>[...generated, ...EXERCISES], [generated]);
  const filtered = allExercises.filter(e => {
    const inCat = cat==='All' || (cat==='Generated' ? e.generated : e.cat===cat);
    const haystack = `${e.title} ${e.cat} ${e.level} ${e.product || ''} ${e.concept || ''}`.toLowerCase();
    return inCat && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const onGenerated = (exercise) => {
    const next = saveGeneratedExercise(exercise);
    setGenerated(next);
    notify(exercise.engine === 'rag' ? 'RAG exercise generated and added to the library.' : 'Local fallback exercise generated and added.');
    nav(`/exercises/${exercise.id}`);
  };
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ exercises</span></>}
        title="Exercises"
        sub="Desk-first practice. Generate, solve and review exercises grounded in the local finance knowledge base."
        right={<>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search exercises…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
          <Link to="/practice" className="btn btn-outline btn-sm">Practice Hub <Icon name="arrow-right" size={13}/></Link>
        </>}
      />
      <ExerciseGeneratorPanel route={route} onGenerated={onGenerated}/>
      <ExerciseLibraryStats exercises={allExercises} generatedCount={generated.length}/>
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

function ExerciseGeneratorPanel({onGenerated}) {
  const [form,setForm] = useState(()=>({...GENERATOR_PRESETS[0]}));
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState({checked:false, ok:false, detail:'Checking engine'});

  useEffect(()=>{
    let alive = true;
    fetch(`${getPracticeApiBase()}/health`)
      .then((response)=>response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then((data)=>{
        if (!alive) return;
        const canGenerate = !String(data.llm || '').startsWith('openai:') || data.openai_configured;
        setStatus({
          checked:true,
          ok:canGenerate,
          detail:canGenerate ? `${data.llm} · ${data.embedding_backend}` : `${data.llm} · API key missing`,
        });
      })
      .catch((error)=>{ if (alive) setStatus({checked:true, ok:false, detail:error.message}); });
    return ()=>{ alive = false; };
  },[]);

  const update = (key,value) => setForm((current)=>({...current, [key]: value}));
  const applyPreset = (preset) => setForm({...preset});
  const generate = async () => {
    setBusy(true);
    try {
      const exercise = await generateAiDeskExercise(form);
      onGenerated(exercise);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Generation failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel generator-panel">
      <div className="row between generator-head">
        <div>
          <div className="section-eyebrow" style={{margin:0}}>// AI Practice Engine</div>
          <h2 className="mono" style={{fontSize:20,fontWeight:700,margin:'8px 0 0'}}>Generate a desk case</h2>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}>
          <span className={"badge "+(status.ok?'badge-green':'badge-amber')}>
            <span className={"dot "+(status.ok?'dot-green':'dot-red')}></span>{status.ok ? 'RAG ONLINE' : 'LOCAL FALLBACK'}
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
            <textarea value={form.free_prompt} onChange={(event)=>update('free_prompt', event.target.value)} rows={6} placeholder="Describe the market case, product, numbers and expected action."/>
          </div>
        </div>
        <div className="generator-form">
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Topic</span>
            <input value={form.topic} onChange={(event)=>update('topic', event.target.value)}/>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Product</span>
            <input value={form.product} onChange={(event)=>update('product', event.target.value)}/>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Concept</span>
            <input value={form.concept} onChange={(event)=>update('concept', event.target.value)}/>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Difficulty</span>
            <select value={form.difficulty} onChange={(event)=>update('difficulty', event.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>Format</span>
            <select value={form.exercise_format} onChange={(event)=>update('exercise_format', event.target.value)}>
              <option value="mixed">Mixed</option>
              <option value="case_study">Case study</option>
              <option value="quantitative_problem">Quantitative problem</option>
              <option value="trading_decision">Trading decision</option>
              <option value="risk_management">Risk management</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={generate} disabled={busy} style={{alignSelf:'end',justifyContent:'center'}}>
            {busy ? <><Icon name="terminal" size={13}/> Generating</> : <><Icon name="play" size={13}/> Generate exercise</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({e}) {
  return (
    <Link to={"/exercises/"+e.id} className="panel exercise-card" style={{display:'block', textDecoration:'none'}}>
      <div className="row between exercise-card-top">
        <span className="row" style={{gap:6,flexWrap:'wrap'}}>
          <span className="badge">{e.cat}</span>
          {e.generated && <span className={"badge "+(e.engine==='rag'?'badge-green':'badge-amber')}>{e.engine==='rag'?'AI/RAG':'AI/LOCAL'}</span>}
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
        {e.done ? <span className="badge badge-green">Completed</span> : <span className="badge">Open</span>}
        <span className="mono" style={{fontSize:11,color:'var(--red)'}}>start ›</span>
      </div>
    </Link>
  );
}

function ExerciseDetail({id}) {
  const ex = getExerciseById(id) || EXERCISES[0];
  if (ex.generated) return <GeneratedExerciseDetail ex={ex}/>;
  return <StaticExerciseDetail ex={ex}/>;
}

function StaticExerciseDetail({ex}) {
  const [tab,setTab] = useState('problem');
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/exercises">exercises</Link><i>›</i><span>{ex.title.toLowerCase()}</span></>}
        title={ex.title}
        sub={`${ex.cat} · ${ex.level} · est. ${ex.time} · ${ex.product || 'market finance'}`}
        right={<>
          {ex.done && <span className="badge badge-green">Completed</span>}
          <button className="btn btn-outline btn-sm" onClick={()=>handleSave(ex.title)}><Icon name="bookmark" size={13}/> Save</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setTab('code')}><Icon name="play" size={13}/> Run code</button>
        </>}
      />
      <div className="tabs-bar">
        {[['problem','Problem'],['code','Code'],['output','Output'],['solution','Solution']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div className="exercise-detail-grid">
        <div className="col" style={{gap:14}}>
          {tab==='problem' && (
            <>
              <div className="panel exercise-readable-panel">
                <div className="label" style={{marginBottom:8}}>Objective</div>
                <p className="exercise-lead">{ex.objective}</p>
                <div className="label" style={{marginBottom:8,marginTop:20}}>Market data</div>
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
                <ExerciseReferenceChart ex={ex}/>
              </div>
            </>
          )}
          {tab==='code' && (
            <PyCodeCell initial={ex.starterCode || '# Write your solution here\nprint("hello desk")'} label="exercise.py"/>
          )}
          {tab==='output' && (
            <div className="panel exercise-readable-panel">
              <div className="label" style={{marginBottom:10}}>Console output</div>
              <pre className="code" style={{marginBottom:14}}><code>{ex.output}</code></pre>
              <ChartFrame title="Your output">
                <ExerciseReferenceChart ex={ex} compact/>
              </ChartFrame>
            </div>
          )}
          {tab==='solution' && (
            <div className="panel exercise-readable-panel">
              <div className="row between" style={{marginBottom:14}}>
                <div className="label">Reference solution</div>
                <span className="badge badge-amber">Spoiler</span>
              </div>
              <pre className="code"><code>{ex.solution}</code></pre>
            </div>
          )}
        </div>

        <div className="col exercise-side-stack">
          <div className="panel exercise-side-panel">
            <div className="label" style={{marginBottom:10}}>Grading</div>
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
    <LineChart width={620} height={compact ? 180 : 220} series={[{name:ex.cat,color:'#FF2E45',data,fillOpacity:0.08}]}/>
  );
}

function GeneratedExerciseDetail({ex}) {
  const [tab,setTab] = useState('brief');
  const sources = ex.sources || [];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/exercises">exercises</Link><i>›</i><span>generated</span></>}
        title={ex.title}
        sub={`${ex.cat} · ${ex.level} · ${ex.engine === 'rag' ? 'RAG grounded' : 'local fallback'} · ${ex.time}`}
        right={<>
          <span className={"badge "+(ex.engine==='rag'?'badge-green':'badge-amber')}>{ex.engine==='rag'?'AI/RAG':'AI/LOCAL'}</span>
          <button className="btn btn-outline btn-sm" onClick={()=>copyText(ex.content, 'Exercise copied as Markdown.')}><Icon name="copy" size={13}/> Copy Markdown</button>
          <button className="btn btn-primary btn-sm" onClick={()=>handleSave(ex.title)}><Icon name="bookmark" size={13}/> Save</button>
        </>}
      />
      <div className="tabs-bar">
        {[['brief','Brief'],['solution','Correction'],['sources','Sources'],['export','Export']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="exercise-detail-grid">
        <div className="panel generated-markdown">
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
            <div className="label" style={{marginBottom:10}}>Generation metadata</div>
            <div className="col" style={{gap:8}}>
              {[
                ['Engine', ex.engine === 'rag' ? 'RAG backend' : 'Local fallback'],
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
              Solve the case first, then open the correction. If the source count is zero, start the RAG backend to regenerate with document grounding.
            </div>
            <button className="btn btn-outline btn-sm" onClick={()=>nav('/exercises')} style={{width:'100%',justifyContent:'center',marginTop:14}}>Back to generator</button>
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
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.7}}>No retrieved sources were attached. This usually means the browser used the local fallback because the RAG backend was not running.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="label" style={{marginBottom:12}}>Retrieved sources</div>
      <table className="data">
        <thead><tr><th>#</th><th>Source</th><th className="num">Score</th></tr></thead>
        <tbody>
          {sources.map((src,idx)=>(
            <tr key={src.chunk_id || idx}>
              <td className="symbol">S{idx + 1}</td>
              <td>
                <div className="symbol">{src.title || src.source || src.document_id}</div>
                <div className="mute" style={{fontSize:11,marginTop:4,lineHeight:1.45}}>{src.snippet}</div>
              </td>
              <td className="num">{typeof src.score === 'number' ? src.score.toFixed(3) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MarkdownBlock({content}) {
  const parsed = useMemo(()=>parseMarkdownSections(content), [content]);
  return (
    <div className="generated-doc">
      {parsed.title && <h1>{parsed.title}</h1>}
      <div className="generated-section-grid">
        {parsed.sections.map((section,idx)=>(
          <section key={idx} className="generated-section">
            <h2>{section.title}</h2>
            <MarkdownLines lines={section.lines}/>
          </section>
        ))}
      </div>
    </div>
  );
}

function MarkdownLines({lines}) {
  let inCode = false;
  const rendered = [];
  let codeLines = [];
  const flushCode = (key) => {
    if (!codeLines.length) return;
    rendered.push(<pre key={key} className="code generated-code"><code>{codeLines.join('\n')}</code></pre>);
    codeLines = [];
  };
  lines.forEach((line,idx)=>{
    if (line.trim().startsWith('```')) {
      if (inCode) {
        flushCode(`code-${idx}`);
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    if (!line.trim()) {
      rendered.push(<div key={idx} style={{height:6}}/>);
      return;
    }
    if (line.startsWith('### ')) {
      rendered.push(<h3 key={idx}>{line.slice(4)}</h3>);
      return;
    }
    if (line.startsWith('- ')) {
      rendered.push(<div key={idx} className="md-line md-bullet">{renderInlineMarkdown(line.slice(2))}</div>);
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      rendered.push(<div key={idx} className="md-line md-number">{renderInlineMarkdown(line)}</div>);
      return;
    }
    rendered.push(<p key={idx}>{renderInlineMarkdown(line)}</p>);
  });
  flushCode('code-final');
  return <>{rendered}</>;
}

function renderInlineMarkdown(text) {
  return String(text).split(/(\[S\d+\])/g).map((part,idx)=>{
    if (/^\[S\d+\]$/.test(part)) return <span key={idx} className="source-chip">{part}</span>;
    return part;
  });
}

function parseMarkdownSections(content) {
  const lines = String(content || '').split(/\r?\n/);
  let title = '';
  const sections = [];
  let current = {title:'Desk brief', lines:[]};
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith('# ')) {
      title = line.slice(2).trim();
      continue;
    }
    if (line.startsWith('## ')) {
      if (current.lines.some((item)=>item.trim())) sections.push(current);
      current = {title: line.slice(3).trim(), lines: []};
      continue;
    }
    current.lines.push(line);
  }
  if (current.lines.some((item)=>item.trim())) sections.push(current);
  return {title, sections};
}

function pickGeneratedContent(content, mode) {
  if (mode === 'solution') {
    const match = String(content || '').match(/## Corrig[\s\S]*/i);
    return match ? match[0] : content;
  }
  if (mode === 'brief') {
    return String(content || '').split(/## Corrig/i)[0].trim() || content;
  }
  return content;
}

// ============= SURVIVAL MODE =============
function SurvivalPage({route}) {
  const sub = route.parts[1];
  if (sub) return <SurvivalWave wave={sub}/>;
  return <SurvivalIndex/>;
}

function SurvivalIndex() {
  const [board,setBoard] = useState(null);
  useEffect(()=>{ platformApi.survivalLeaderboard(10).then(setBoard).catch(()=>setBoard([])); },[]);
  const waves = [
    {n:'Beginner', lvl:1, time:'60s', count:10, topics:['Definitions','Basic payoffs'], status:'completed'},
    {n:'Intermediate', lvl:2, time:'45s', count:15, topics:['Black-Scholes','Greeks'], status:'completed'},
    {n:'Advanced', lvl:3, time:'30s', count:20, topics:['Volatility','Hedging'], status:'current'},
    {n:'Expert', lvl:4, time:'25s', count:25, topics:['Exotics','MC'], status:'locked'},
    {n:'Master', lvl:5, time:'20s', count:30, topics:['SDE','Calibration'], status:'locked'},
    {n:'Legendary', lvl:6, time:'15s', count:40, topics:['Everything'], status:'locked'},
  ];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ survival</span></>}
        title={<>Survival Mode <span className="blink" style={{color:'var(--red)',marginLeft:10}}>●</span></>}
        sub="Pressure-tested. Timer running. Each wave gets faster and meaner. Make a mistake — drop a life. Run out of lives, run out of session."
        right={<><span className="badge badge-red"><span className="dot dot-red"></span>Timed mode</span></>}
      />
      <div className="grid-4" style={{marginBottom:18}}>
        <Stat label="Highest wave" value="Advanced" accent="var(--red)"/>
        <Stat label="Challenges completed" value="312"/>
        <Stat label="Success rate" value="78.4%"/>
        <Stat label="Avg time/Q" value="22.4s"/>
      </div>
      <div className="grid-3">
        {waves.map(w=>(
          <div key={w.n} className="panel" style={{padding:0, position:'relative', overflow:'hidden', cursor: w.status!=='locked'?'pointer':'default'}}>
            <div style={{height:6, background:'#06080B', position:'relative'}}>
              <div style={{position:'absolute',inset:0, width: w.status==='completed'?'100%':w.status==='current'?'45%':'0%', background:'var(--red)'}}></div>
            </div>
            <div style={{padding:20}}>
              <div className="row between" style={{marginBottom:14}}>
                <div className="mono" style={{fontSize:11,letterSpacing:'.14em',color:'var(--mute)'}}>WAVE 0{w.lvl}</div>
                <span className={"badge "+(w.status==='completed'?'badge-green':w.status==='current'?'badge-red':'badge-locked')}>
                  {w.status==='completed'?'✓ Cleared':w.status==='current'?'● In progress':'⌬ Locked'}
                </span>
              </div>
              <div className="mono" style={{fontWeight:700,fontSize:20,marginBottom:14}}>{w.n}</div>
              <div className="grid-2" style={{gap:8, marginBottom:14}}>
                <div className="panel-2" style={{padding:'8px 10px'}}>
                  <div className="mono mute" style={{fontSize:10}}>TIME / Q</div>
                  <div className="mono" style={{fontSize:14,fontWeight:600,color:'var(--red)',marginTop:2}}>{w.time}</div>
                </div>
                <div className="panel-2" style={{padding:'8px 10px'}}>
                  <div className="mono mute" style={{fontSize:10}}>CHALLENGES</div>
                  <div className="mono" style={{fontSize:14,fontWeight:600,marginTop:2}}>{w.count}</div>
                </div>
              </div>
              <div className="row" style={{gap:6,flexWrap:'wrap', marginBottom:14}}>
                {w.topics.map(t=><span key={t} className="badge">{t}</span>)}
              </div>
              <Link to={"/survival/"+w.n.toLowerCase()} className={"btn "+(w.status==='locked'?'btn-outline':'btn-primary')+" btn-sm"} style={{width:'100%',justifyContent:'center', opacity: w.status==='locked'?0.5:1, pointerEvents: w.status==='locked'?'none':'auto'}}>
                {w.status==='locked' ? <><Icon name="lock" size={13}/> Locked</> : w.status==='completed' ? <>Replay <Icon name="rotate-ccw" size={13}/></> : <>Continue <Icon name="arrow-right" size={13}/></>}
              </Link>
            </div>
          </div>
        ))}
      </div>
      <section className="section" style={{borderTop:'1px solid var(--line)',marginTop:32}}>
        <div className="section-eyebrow">// Leaderboard</div>
        <div className="section-head">
          <h2 className="section-title">All-time top 10</h2>
        </div>
        <div className="panel">
          {board===null && <div className="mute" style={{padding:18}}>Loading leaderboard…</div>}
          {board!==null && board.length===0 && <div className="mute" style={{padding:18}}>No runs yet. Play a wave to put your score on the board.</div>}
          {board && board.length>0 && <table className="data">
            <thead><tr><th>#</th><th>Player</th><th className="num">Best score</th><th className="num">Streak</th></tr></thead>
            <tbody>
              {board.map(r=><tr key={r.username}>
                <td className="symbol">#{r.rank}</td><td>@{r.username}</td>
                <td className="num">{Number(r.score).toLocaleString()}</td><td className="num">{r.streak||0}</td>
              </tr>)}
            </tbody>
          </table>}
        </div>
      </section>
    </div>
  );
}

function SurvivalWave({wave}) {
  let auth=null; try { auth=useAuth(); } catch { auth=null; }
  const [timer, setTimer] = useState(28);
  const [progress, setProgress] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const total = 20;
  const correct = 'D'; // ATM call delta = N(d1), d1=(0.02+0.02)/0.2=0.2 -> N(0.2)=0.579 ~ 0.58
  const waveName = (wave || 'advanced').replace(/-/g,' ');
  const prettyWave = waveName.charAt(0).toUpperCase() + waveName.slice(1);
  const saveRun = (finalScore, finalStreak) => {
    const username = auth?.profile?.prenom || (auth?.user?.email ? auth.user.email.split('@')[0] : 'guest');
    platformApi.recordSurvival({ user_id: auth?.user?.id || null, username, wave: prettyWave, score: Math.round(finalScore), streak: finalStreak });
    if (auth?.user) recordProgressOnce(auth, 'survival', `${prettyWave}-${Date.now()}`, Math.round(finalScore), { wave: prettyWave });
  };
  useEffect(()=>{
    const id = setInterval(()=>setTimer(t=>selected?t:(t>0?t-1:30)),1000);
    return ()=>clearInterval(id);
  },[selected]);
  const choose = (key) => {
    if (selected) return;
    setSelected(key);
    if (key === correct) {
      const earned = Math.max(50, timer * 12);
      setScore((value)=>value + earned);
      setStreak((s)=>s+1);
      setProgress((value)=>{ const np = Math.min(total, value + 1); if (np>=total) saveRun(score+earned, streak+1); return np; });
      notify(`Correct. +${earned} pts.`);
    } else {
      setStreak(0);
      setLives((value)=>{ const nl = Math.max(0, value - 1); if (nl===0) saveRun(score, streak); return nl; });
      notify(lives-1<=0 ? 'Game over — score saved to the leaderboard.' : 'Wrong answer. One life removed.', 'warning');
    }
  };
  const nextQuestion = () => {
    setSelected(null);
    setTimer(30);
  };
  return (
    <div className="container page">
      <div className="row between" style={{padding:'18px 0',borderBottom:'1px solid var(--line)',marginBottom:24}}>
        <div className="row" style={{gap:14}}>
          <Link to="/survival" className="btn btn-ghost btn-sm"><Icon name="x" size={14}/> Quit</Link>
          <span className="mono mute" style={{fontSize:11,letterSpacing:'.1em'}}>WAVE · {prettyWave.toUpperCase()}</span>
        </div>
        <div className="row" style={{gap:24}}>
          <div className="row" style={{gap:6}}>
            {[1,2,3].map(i=>(
              <span key={i} style={{width:10,height:10,borderRadius:5,background: i<=lives?'var(--red)':'var(--line-2)'}}></span>
            ))}
            <span className="mono mute" style={{fontSize:11,marginLeft:6}}>lives</span>
          </div>
          <div>
            <div className="mono mute" style={{fontSize:10,textAlign:'right'}}>PROGRESS</div>
            <div className="mono" style={{fontSize:14,fontWeight:700,textAlign:'right'}}>{progress}/{total}</div>
          </div>
          <div>
            <div className="mono mute" style={{fontSize:10,textAlign:'right'}}>TIME</div>
            <div className="mono" style={{fontSize:24,fontWeight:700,color: timer<10?'var(--red)':'var(--text)',textAlign:'right',lineHeight:1}}>{timer<10?'0'+timer:timer}<span style={{fontSize:14,color:'var(--mute)'}}>s</span></div>
          </div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:24}}>
        <div className="panel" style={{padding:40}}>
          <div className="mono mute" style={{fontSize:11,letterSpacing:'.14em',marginBottom:18}}>QUESTION {progress} / {total}</div>
          <h2 className="mono" style={{fontSize:26,fontWeight:700,lineHeight:1.3,marginTop:0,marginBottom:6}}>
            For an at-the-money European call with σ = 20% and T = 1y, what is the approximate Delta?
          </h2>
          <p className="text-2" style={{fontSize:13.5,marginTop:14}}>S = 100, K = 100, r = 2%, q = 0. Pick the closest value.</p>
          <div className="col" style={{gap:10,marginTop:30}}>
            {[
              ['A','0.42'],
              ['B','0.50'],
              ['C','0.54'],
              ['D','0.58'],
            ].map(([k,v])=>{
              const isCorrect = selected && k === correct;
              const isWrong = selected === k && k !== correct;
              return (
              <button key={k} onClick={()=>choose(k)} className="panel-2" style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:18,textAlign:'left',cursor:selected?'default':'pointer',transition:'all .15s',borderColor:isCorrect?'var(--green)':isWrong?'var(--red)':'var(--line)'}}>
                <span className="mono" style={{width:30,height:30,border:'1px solid '+(isCorrect?'var(--green)':isWrong?'var(--red)':'var(--line-2)'),display:'grid',placeItems:'center',borderRadius:3,fontSize:13,fontWeight:600,color:isCorrect?'var(--green)':isWrong?'var(--red)':'var(--text)'}}>{k}</span>
                <span className="mono" style={{fontSize:16,fontWeight:500}}>{v}</span>
              </button>
              );
            })}
          </div>
          {selected && (
            <div className="row between" style={{marginTop:22,paddingTop:18,borderTop:'1px solid var(--line)'}}>
              <span className={selected===correct?'green mono':'red mono'} style={{fontSize:12}}>
                {selected===correct ? 'Correct: ATM call delta is slightly above 0.50 when rates are positive.' : 'Answer C is closest: positive rates lift d1 above zero.'}
              </span>
              <button className="btn btn-primary btn-sm" onClick={nextQuestion}>Next <Icon name="arrow-right" size={13}/></button>
            </div>
          )}
        </div>
        <div className="col" style={{gap:14, alignSelf:'start'}}>
          <div className="panel" style={{padding:16}}>
            <div className="label" style={{marginBottom:10}}>Session</div>
            <div className="col" style={{gap:8}}>
              <div className="row between"><span className="mono mute" style={{fontSize:11}}>Streak</span><span className="mono" style={{fontSize:13,fontWeight:600}}>x{streak}</span></div>
              <div className="row between"><span className="mono mute" style={{fontSize:11}}>Lives</span><span className="mono red" style={{fontSize:13,fontWeight:600}}>{lives}</span></div>
              <div className="row between"><span className="mono mute" style={{fontSize:11}}>Score</span><span className="mono" style={{fontSize:13,fontWeight:600}}>{score.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="panel" style={{padding:16}}>
            <div className="label" style={{marginBottom:10}}>Topics this wave</div>
            <div className="row" style={{gap:6,flexWrap:'wrap'}}>
              {['Black-Scholes','Greeks','Vol smile','Hedging','MC'].map(t=><span key={t} className="badge">{t}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {TradingLabPage, ExercisesPage, SurvivalPage});


// ===== src\pages-misc.jsx =====
// Community, Blog, Dashboard, Pricing, Auth, Misc pages

// ============= COMMUNITY =============
function CommunityPage({route}) {
  let authName = null; try { const a=useAuth(); authName = a?.profile?.prenom || a?.user?.email || null; } catch { authName=null; }
  const sub = route.parts[1] || 'forum';
  const tabs = [['forum','Forum'],['projects','Projects'],['publications','Publications']];
  const [composing,setComposing] = useState(false);
  const [reloadKey,setReloadKey] = useState(0);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ community</span></>}
        title="Community"
        sub="Forums, shared notebooks, projects and peer-reviewed publications."
        right={<>
          <button className="btn btn-primary btn-sm" onClick={()=>setComposing(c=>!c)}><Icon name="plus" size={13}/> New post</button>
        </>}
      />
      <div className="tabs-bar">
        {tabs.map(([k,l])=><Link key={k} to={"/community/"+k} className={"tab-btn "+(sub===k?'on':'')}>{l}</Link>)}
      </div>
      {sub==='forum' && <ForumPanel composing={composing} setComposing={setComposing} authName={authName} reloadKey={reloadKey} onPosted={()=>setReloadKey(k=>k+1)}/>}
      {sub==='projects' && <ProjectsPanel/>}
      {sub==='publications' && <PublicationsPanel/>}
    </div>
  );
}

function ForumPanel({composing, setComposing, authName, reloadKey, onPosted}) {
  const [query,setQuery] = useState('');
  const [threads,setThreads] = useState(null);
  const [form,setForm] = useState({ title:'', body:'', tag:'' });
  const refetch = useCallback(()=>{ platformApi.listThreads('forum').then(setThreads).catch(()=>setThreads([])); },[]);
  useEffect(()=>{ refetch(); },[refetch, reloadKey]);
  const submitPost = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { notify('Title and body are required.', 'error'); return; }
    try {
      await platformApi.createThread({ channel:'forum', title:form.title.trim(), body:form.body.trim(), author: authName||'anon', tags: form.tag?[form.tag]:[] });
      setForm({ title:'', body:'', tag:'' }); setComposing&&setComposing(false);
      notify('Posted to the forum.'); onPosted&&onPosted(); refetch();
    } catch (e) { notify(`Could not post (${e.message}).`, 'error'); }
  };
  const vote = async (id) => { try { await platformApi.voteThread(id); refetch(); } catch { /* ignore */ } };
  const list = threads || [];
  const displayed = list.filter((t)=>`${t.title} ${(t.tags||[]).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14}}>
      <div className="panel">
        {composing && (
          <form className="col" style={{gap:10, padding:16, borderBottom:'1px solid var(--line)'}} onSubmit={submitPost}>
            <input value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} placeholder="Question or topic title"/>
            <textarea rows={3} value={form.body} onChange={(e)=>setForm(f=>({...f,body:e.target.value}))} placeholder="Describe your question…"></textarea>
            <div className="row" style={{gap:8}}>
              <input value={form.tag} onChange={(e)=>setForm(f=>({...f,tag:e.target.value}))} placeholder="tag (e.g. volatility)" style={{flex:1}}/>
              <button className="btn btn-primary btn-sm" type="submit">Post</button>
            </div>
          </form>
        )}
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="mono mute" style={{fontSize:12}}>{list.length} topic{list.length===1?'':'s'}</div>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search forum…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'6px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:200}}/>
        </div>
        {threads===null && <div className="mute" style={{padding:18}}>Loading topics…</div>}
        {threads!==null && list.length===0 && <div className="mute" style={{padding:18}}>No topics yet. Start the conversation with “New post”.</div>}
        {list.length>0 && <table className="data">
          <thead><tr><th>Topic</th><th>Tags</th><th className="num">Replies</th><th className="num">Votes</th></tr></thead>
          <tbody>
            {displayed.map((t)=>(
              <tr key={t.id}>
                <td><div style={{fontWeight:500}}>{t.title}</div><div className="mono mute" style={{fontSize:10.5,marginTop:2}}>by @{t.author}</div></td>
                <td>{(t.tags||[]).map(tag=><span key={tag} className="badge" style={{marginRight:4}}>{tag}</span>)}</td>
                <td className="num">{t.comment_count}</td>
                <td className="num"><button className="btn btn-ghost btn-sm" onClick={()=>vote(t.id)} style={{padding:'2px 8px'}}>▲ {t.votes}</button></td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
      <div className="col" style={{gap:14, alignSelf:'start'}}>
        <div className="panel" style={{padding:16}}>
          <div className="label" style={{marginBottom:10}}>Categories</div>
          {[
            ['Black-Scholes',428],['Volatility',612],['Exotics',218],['Greeks',391],['Monte Carlo',184],['Calibration',152],['Tooling',92],['Meta',38],
          ].map(([k,v])=>(
            <div key={k} className="row between" style={{padding:'8px 0', borderTop:k!=='Black-Scholes'?'1px solid var(--line)':'none'}}>
              <span className="mono" style={{fontSize:12}}>{k}</span>
              <span className="mono mute" style={{fontSize:11}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="panel" style={{padding:16}}>
          <div className="row between" style={{marginBottom:10}}>
            <div className="label">Upcoming events</div>
          </div>
          {[
            {d:'May 28',t:'AMA · Vol surface modelling',w:'+184 RSVP'},
            {d:'Jun 04',t:'Workshop · MC variance reduction',w:'+92 seats'},
            {d:'Jun 11',t:'Live calibration · Heston on SPX',w:'free'},
          ].map((e,i)=>(
            <div key={i} className="row" style={{padding:'10px 0', borderTop:i?'1px solid var(--line)':'none', gap:12}}>
              <div className="mono red" style={{fontSize:11,minWidth:50}}>{e.d}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:600}}>{e.t}</div>
                <div className="mono mute" style={{fontSize:10.5,marginTop:2}}>{e.w}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="panel" style={{padding:16}}>
          <div className="label" style={{marginBottom:10}}>Community poll</div>
          <div className="mono" style={{fontWeight:700,marginBottom:12,fontSize:13}}>Favourite stochastic vol model?</div>
          {[['Heston',54],['SABR',31],['Bergomi',10],['Other',5]].map(([k,v])=>(
            <div key={k} style={{marginBottom:8}}>
              <div className="row between" style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",marginBottom:4}}>
                <span>{k}</span><span>{v}%</span>
              </div>
              <div style={{height:4,background:'var(--line)'}}>
                <div style={{height:'100%',width:v+'%',background:'var(--red)'}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsPanel() {
  const myp = [
    {n:'option-pricer-go', desc:'Closed-form & MC option pricer in Go.', stars:38, lang:'Go', updated:'2d'},
    {n:'svi-fitter', desc:'SVI calibration with arbitrage constraints.', stars:24, lang:'Python', updated:'1w'},
  ];
  const com = [
    {n:'@aurora_vol/heston-py', desc:'Pure-Python Heston with FFT pricing.', stars:412, lang:'Python', updated:'4h'},
    {n:'@gamma_god/lookback', desc:'Lookback option closed forms & MC tests.', stars:218, lang:'C++', updated:'1d'},
    {n:'@quantfox/curve-boot', desc:'Multi-curve bootstrap (OIS, SOFR, ESTR).', stars:184, lang:'Rust', updated:'3d'},
    {n:'@vega_neutral/autocall', desc:'Phoenix autocallable pricer + greeks.', stars:142, lang:'Python', updated:'6d'},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">My projects</div>
          <button className="btn btn-outline btn-sm" onClick={()=>submitStub('GitHub connection')}><Icon name="github" size={13}/> Connect</button>
        </div>
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
          <div className="label">Community · trending</div>
        </div>
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
  const pubs = [
    {t:'A practical guide to SVI in production',a:'@aurora_vol',d:'May 18',cite:42,kind:'Article'},
    {t:'Heston FFT pricing — caveats and convergence',a:'@gamma_god',d:'May 11',cite:38,kind:'Notebook'},
    {t:'Volatility carry: empirical evidence on equity indices',a:'@vega_neutral',d:'Apr 28',cite:54,kind:'Strategy'},
    {t:'Closed-form expressions for double-barrier options',a:'@itos_lemma',d:'Apr 14',cite:31,kind:'Article'},
    {t:'GPU Monte Carlo: benchmarks on H100',a:'@quantfox',d:'Mar 30',cite:22,kind:'Notebook'},
  ];
  return (
    <div className="grid-3">
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
  useEffect(()=>{ platformApi.listBlog().then((d)=>setPosts((d||[]).map(mapBlog))).catch(()=>setPosts([])); },[]);
  const all = posts || [];
  const categories = ['All', ...Array.from(new Set(all.map(p=>p.tag)))];
  const normalizedQuery = query.trim().toLowerCase();
  const matches = all.filter((post) => {
    const inTag = tag === 'All' || post.tag === tag;
    const haystack = `${post.title} ${post.excerpt} ${post.tag} ${post.author}`.toLowerCase();
    return inTag && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  if (posts===null) return <div className="container page"><div className="panel mute" style={{padding:24}}>Loading articles…</div></div>;
  if (all.length===0) return <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ blog</span></>} title="The Pricing Letter" sub="Long-form quant essays."/><div className="panel" style={{padding:28,textAlign:'center'}}><div className="mono" style={{fontWeight:600}}>No articles yet.</div><div className="mute" style={{fontSize:13,marginTop:8}}>Start the platform backend and seed content to populate the blog.</div></div></div>;
  const featured = matches[0] || all[0];
  const cards = matches.filter((post) => post.id !== featured.id);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ blog</span></>}
        title="The Pricing Letter"
        sub="Long-form essays, deep dives and quant interview seeds — published weekly."
        right={<>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search posts…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
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
        <input value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@desk.com" style={{flex:1, background:'#0A0C10',border:'1px solid var(--line-2)',color:'var(--text)',padding:'8px 10px',borderRadius:3,fontFamily:"'JetBrains Mono',monospace",fontSize:12.5,outline:'none'}}/>
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>{busy?'…':'Subscribe'}</button>
      </form>
    </div>
  );
}
function PostDetail({slug}) {
  const [p,setP] = useState(undefined); // undefined=loading, null=not found
  const [related,setRelated] = useState([]);
  useEffect(()=>{
    let alive=true;
    platformApi.getBlog(slug).then((d)=>{ if(alive) setP(d||null); }).catch(()=>{ if(alive) setP(null); });
    platformApi.listBlog().then((d)=>{ if(alive) setRelated((d||[]).map(mapBlog).filter(x=>x.id!==slug).slice(0,3)); }).catch(()=>{});
    return ()=>{ alive=false; };
  },[slug]);
  if (p===undefined) return <div className="container page"><div className="panel mute" style={{padding:24}}>Loading article…</div></div>;
  if (p===null) return <div className="container page" style={{maxWidth:880}}><div className="crumb" style={{marginTop:24}}><Link to="/blog">/ blog</Link></div><div className="panel" style={{padding:28,marginTop:18,textAlign:'center'}}><div className="mono" style={{fontWeight:600}}>Article not found.</div><Link to="/blog" className="btn btn-outline" style={{marginTop:16}}>Back to blog</Link></div></div>;
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
function courseModules(courseId){ const c = COURSES.find(x=>x.id===courseId); return (c && c.modules) || 8; }
function coursePct(courseId, lessonsDone){ return Math.min(100, Math.round((lessonsDone / courseModules(courseId)) * 100)); }
function DashboardPage() {
  let auth=null; try { auth = useAuth(); } catch { auth=null; }
  const userId = auth?.user?.id || auth?.user?.email || null;
  const plan = (auth?.profile?.plan || 'free').toUpperCase();
  const [tab,setTab] = useState('overview');
  const [prog,setProg] = useState(null); // null=loading
  useEffect(()=>{
    if (!userId) { setProg({}); return; }
    platformApi.getProgress(userId).then((d)=>setProg(d||{})).catch(()=>setProg({}));
  },[userId]);
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
          <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade <Icon name="arrow-right" size={13}/></Link>
        </>}
      />
      <div className="tabs-bar">
        {[['overview','Overview'],['progress','Progress'],['quizzes','Quizzes'],['achievements','Achievements']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {prog===null && <div className="panel mute" style={{padding:24}}>Loading your activity…</div>}
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
    <div className="mute" style={{fontSize:13,marginTop:8}}>{what} As you study, open lessons and run exercises, your real activity appears here.</div>
  </div>;
}
function DashOverview({prog}) {
  const courses = prog.courses || [];
  const quizzes = prog.quizzes || [];
  const exercises = prog.exercises || [];
  const lessonsDone = courses.reduce((s,c)=>s+c.lessons_done,0);
  const quizzesPassed = quizzes.filter(q=>(q.score||0)>=50).length;
  if (!(prog.events>0)) return <EmptyDash what="No activity recorded yet."/>;
  return (
    <>
      <div className="grid-4">
        <Stat label="Lessons done" value={String(lessonsDone)} sub={`${courses.length} courses`}/>
        <Stat label="Activities" value={String(prog.events||0)} sub={`${prog.active_days||0} active days`}/>
        <Stat label="Quizzes passed" value={`${quizzesPassed} / ${quizzes.length}`} sub={quizzes.length?`${Math.round(100*quizzesPassed/quizzes.length)}%`:'—'}/>
        <Stat label="Avg score" value={prog.avg_score!=null?String(prog.avg_score):'—'} sub="all graded work"/>
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
            <div className="label">Activity · 90d</div>
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
  if (!(prog.events>0)) return <EmptyDash what="No course progress yet."/>;
  return (
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
  const [annual,setAnnual] = useState(false);
  const [busy,setBusy] = useState(null);
  const [notice,setNotice] = useState(null);
  let authEmail = null;
  try { authEmail = useAuth()?.user?.email || null; } catch { authEmail = null; }
  const plans = [
    {name:'Starter', key:'starter', price:annual?7:9, save:annual?'-22%':null, desc:'For learners who want the core desk workflow, not scattered theory.',
     features:['All Fundamentals courses','Core calculators: BS, payoff, Monte Carlo','Starter AI exercise quota','Course scripts with LaTeX formulas','Community + weekly desk brief'],
     cta:'Start Starter', highlight:false},
    {name:'Student', key:'student', price:annual?15:19, save:annual?'-21%':null, desc:'Most popular for active learners building real pricing reflexes.', popular:true,
     features:['Everything in Starter','All Advanced courses','Unlimited exercises + quizzes','Trading Lab access','Notebooks workspace','Source-backed RAG course scripts','Priority support'],
     cta:'Go Student', highlight:true},
    {name:'Professional', key:'pro', price:annual?39:49, save:annual?'-20%':null, desc:'For working quants, desk analysts and serious career transition.',
     features:['Everything in Student','All Complex courses','All 9 tools incl. PRO','API access','Backtest engine','Mentoring credits (2/mo)','Job board access'],
     cta:'Go Pro', highlight:false},
  ];
  async function handleCheckout(planKey, planName){
    setNotice(null); setBusy(planKey);
    try {
      const s = await startCheckout(planKey, authEmail);
      if (s.mode === 'live' && s.url) { window.location.href = s.url; return; }
      // Backend reachable but Stripe not configured (mock) — be honest.
      setNotice({type:'info', msg:`Paiement en mode test : Stripe n'est pas encore configuré sur le backend (plan ${planName}). Renseigne les clés Stripe pour activer le vrai checkout.`});
    } catch(e){
      setNotice({type:'error', msg:`Paiement indisponible — le backend de paiement est requis (${e.message}).`});
    } finally { setBusy(null); }
  }
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ pricing</span></>}
        title="Plans"
        sub="Three paid tiers: 9€, 19€ and 49€ per month. Each tier maps to a real learning workflow, not just locked pages."
        right={<>
          <div className="toggle">
            <button className={!annual?'on':''} onClick={()=>setAnnual(false)}>Monthly</button>
            <button className={annual?'on':''} onClick={()=>setAnnual(true)}>Annual · -20%</button>
          </div>
        </>}
      />
      {notice && (
        <div className="panel" style={{padding:'12px 16px',marginBottom:16,borderColor:notice.type==='error'?'var(--red)':'var(--line-2)',fontSize:13}}>
          <span className="mono" style={{color:notice.type==='error'?'var(--red)':'var(--text)'}}>{notice.type==='error'?'⚠ ':'ℹ '}</span>{notice.msg}
        </div>
      )}
      <a href="/market-finance-starter-kit/" className="panel" style={{display:'flex',alignItems:'center',gap:18,padding:'18px 22px',marginBottom:18,borderColor:'rgba(255,46,69,.35)',background:'linear-gradient(100deg, rgba(255,46,69,.07), transparent 60%)',textDecoration:'none'}}>
        <span className="badge badge-red">BÊTA · 29€</span>
        <div style={{flex:1}}>
          <div className="mono" style={{fontWeight:700,fontSize:14}}>Market Finance Starter Kit</div>
          <div className="mute" style={{fontSize:12.5,marginTop:3}}>Construis en 7 jours ton premier projet finance de marché en Python &amp; Excel — prêt pour ton CV, GitHub ou LinkedIn.</div>
        </div>
        <span className="btn btn-primary btn-sm" style={{flexShrink:0}}>Voir l'offre<Icon name="arrow-right" size={13}/></span>
      </a>
      <div className="grid-3">
        {plans.map(p=>(
          <div key={p.name} className="panel" style={{padding:30, position:'relative', borderColor: p.highlight?'var(--red)':'var(--line)'}}>
            {p.popular && <div style={{position:'absolute',top:-1,right:14,background:'var(--red)',color:'#fff',padding:'4px 10px',fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:'.14em',fontWeight:600}}>MOST POPULAR</div>}
            <div className="mono" style={{fontWeight:700,fontSize:18, color: p.highlight?'var(--red)':'var(--text)'}}>{p.name}</div>
            <div className="mute" style={{fontSize:12.5,marginTop:8,minHeight:36}}>{p.desc}</div>
            <div className="row" style={{gap:6,alignItems:'baseline',marginTop:18}}>
              <span className="mono" style={{fontSize:48,fontWeight:700,lineHeight:1}}>{p.price+'€'}</span>
              <span className="mono mute" style={{fontSize:12}}>/mo</span>
              {p.save && <span className="badge badge-green" style={{marginLeft:8}}>{p.save}</span>}
            </div>
            <button type="button" onClick={()=>handleCheckout(p.key, p.name)} disabled={busy===p.key} className={"btn "+(p.highlight?'btn-primary':'btn-outline')} style={{width:'100%',justifyContent:'center',marginTop:24,cursor:busy===p.key?'wait':'pointer'}}>{busy===p.key?'Redirection…':p.cta}</button>
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
                ['Generated RAG course scripts','✓','✓','✓'],
                ['LaTeX formula rendering','✓','✓','✓'],
                ['LEARNING TOOLS',null,null,null,true],
                ['Black-Scholes Pricer','✓','✓','✓'],
                ['Payoff Visualizer','✓','✓','✓'],
                ['Monte Carlo','✓','✓','✓'],
                ['AI exercise generation','Limited','Unlimited','Unlimited'],
                ['Calibration','—','✓','✓'],
                ['Vol Surface','—','—','✓'],
                ['Binomial Tree','—','—','✓'],
                ['TRADING TOOLS',null,null,null,true],
                ['Trading Lab','—','✓','✓'],
                ['Backtest engine','—','—','✓'],
                ['Survival Mode','—','✓','✓'],
                ['PROFESSIONAL',null,null,null,true],
                ['Mentoring','—','—','2/mo'],
                ['API access','—','—','✓'],
                ['Job board','—','—','✓'],
                ['Priority support','—','✓','✓'],
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
            ['Is there a free trial?','All paid plans include a 14-day money-back guarantee. Starter is priced to keep the entry point low without diluting the product.'],
            ['Can I cancel anytime?','Yes — cancel from your dashboard in one click. No questions asked.'],
            ['Do you offer student discounts?','Yes — verify with your .edu email for 40% off Student and Pro.'],
            ['What about teams?','Team plans (5+ seats) available. Contact sales for a quote and bulk pricing.'],
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
  const isLogin = mode==='login';
  const [plan,setPlan] = useState('student');
  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [status,setStatus] = useState('');
  const [statusType,setStatusType] = useState('success');
  const [loading,setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const submit = async (event) => {
    event.preventDefault();
    setStatus('');
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6 || (!isLogin && !name.trim())) {
      setStatusType('error');
      setStatus('Please enter a valid email, a 6+ character password, and your name.');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        setStatus('Logged in. Redirecting to your dashboard.');
      } else {
        const [prenom, ...rest] = name.trim().split(/\s+/);
        await signUp(email, password, prenom || name.trim(), rest.join(' ') || '-', plan);
        setStatus(`Account created on the ${plan} plan. Check your email if confirmation is enabled.`);
      }
      setStatusType('success');
      notify(isLogin ? 'Logged in.' : 'Account created.');
      window.setTimeout(() => nav('/dashboard'), 600);
    } catch (error) {
      setStatusType('error');
      setStatus(error instanceof Error ? error.message : 'Authentication failed.');
      notify('Authentication failed.', 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:'calc(100vh - 78px - 24px - 200px)'}}>
      <div className="panel" style={{borderRadius:0,borderRight:'none',padding:48,display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div style={{maxWidth:380, margin:'0 auto', width:'100%'}}>
          <Link to="/" className="brand" style={{marginBottom:36}}>
            <span className="brand-mark"></span>
            <span>THE PRICING LIBRARY</span>
          </Link>
          <h1 className="mono" style={{fontSize:30,fontWeight:700,margin:'0 0 8px'}}>{isLogin?'Welcome back.':'Create account.'}</h1>
          <p className="text-2" style={{fontSize:13.5,marginTop:0,marginBottom:30}}>
            {isLogin ? 'Resume your session. Markets don\'t wait.' : 'Pick your plan, give us an email, start learning in 60 seconds.'}
          </p>
          {!isLogin && (
            <>
              <div className="label" style={{marginBottom:10}}>Plan</div>
              <div className="col" style={{gap:8,marginBottom:24}}>
                {[
                  {k:'starter',n:'Starter',p:'9€/mo'},
                  {k:'student',n:'Student',p:'19€/mo',pop:true},
                  {k:'pro',n:'Professional',p:'49€/mo'},
                ].map(p=>(
                  <button key={p.k} onClick={()=>setPlan(p.k)} className="row between" style={{padding:'12px 14px', background:plan===p.k?'rgba(255,46,69,.06)':'#06080B', border:'1px solid '+(plan===p.k?'var(--red)':'var(--line-2)'),borderRadius:3, cursor:'pointer'}}>
                    <div className="row" style={{gap:10}}>
                      <span style={{width:14,height:14,border:'1px solid '+(plan===p.k?'var(--red)':'var(--line-2)'),borderRadius:7,display:'grid',placeItems:'center'}}>
                        {plan===p.k && <span style={{width:6,height:6,background:'var(--red)',borderRadius:3}}></span>}
                      </span>
                      <span className="mono" style={{fontWeight:600,fontSize:13}}>{p.n}</span>
                      {p.pop && <span className="badge badge-red" style={{fontSize:9}}>POPULAR</span>}
                    </div>
                    <span className="mono" style={{fontSize:12}}>{p.p}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <form className="col" style={{gap:14}} onSubmit={submit}>
            <FormNotice type={statusType}>{status}</FormNotice>
            {!isLogin && (
              <div className="field">
                <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Name</span>
                <input value={name} onChange={(event)=>setName(event.target.value)} placeholder="Jordan Marais"/>
              </div>
            )}
            <div className="field">
              <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Email</span>
              <input value={email} onChange={(event)=>setEmail(event.target.value)} type="email" placeholder="jordan@desk.com"/>
            </div>
            <div className="field">
              <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Password</span>
              <input value={password} onChange={(event)=>setPassword(event.target.value)} type="password" placeholder="••••••••••••"/>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:8,opacity:loading?0.7:1}}>
              {loading ? 'Processing…' : isLogin ? 'Log in' : 'Create account'} <Icon name="arrow-right" size={13}/>
            </button>
            <div className="row" style={{gap:14,margin:'14px 0'}}>
              <div style={{flex:1,height:1,background:'var(--line)'}}></div>
              <span className="mono mute" style={{fontSize:11}}>or continue with</span>
              <div style={{flex:1,height:1,background:'var(--line)'}}></div>
            </div>
            <div className="row" style={{gap:8}}>
              <button type="button" className="btn btn-outline" onClick={()=>submitStub('GitHub OAuth request')} style={{flex:1,justifyContent:'center'}}><Icon name="github" size={14}/> GitHub</button>
              <button type="button" className="btn btn-outline" onClick={()=>submitStub('Google OAuth request')} style={{flex:1,justifyContent:'center'}}><Icon name="mail" size={14}/> Google</button>
            </div>
          </form>
          <div className="mute" style={{fontSize:12,textAlign:'center',marginTop:24}}>
            {isLogin ? <>No account? <Link to="/auth/signup" style={{color:'var(--red)'}}>Sign up</Link></> : <>Already have one? <Link to="/auth/login" style={{color:'var(--red)'}}>Log in</Link></>}
          </div>
        </div>
      </div>
      <div style={{background:'#06080B', borderLeft:'1px solid var(--line)', padding:48, position:'relative', overflow:'hidden'}}>
        <div className="micro" style={{color:'var(--red)'}}>// AUTHENTICATION</div>
        <h2 className="mono" style={{fontSize:24,fontWeight:700,marginTop:14,maxWidth:'24ch'}}>Your trading floor for learning.</h2>
        <div className="panel" style={{padding:18, marginTop:30}}>
          <div className="row between" style={{marginBottom:14}}>
            <div className="label">Session preview</div>
            <span className="badge badge-green">SANDBOX</span>
          </div>
          <LineChart width={500} height={180} series={[{name:'demo',color:'#FF2E45',data:genWalk(80,100,0.013,0.0004,42),fillOpacity:0.12}]}/>
          <div className="grid-2" style={{gap:8,marginTop:14}}>
            {[['P&L 30d','+4.2%','green'],['Sharpe','1.41',''],['Trades','142',''],['Win %','62.8',''] ].map(([k,v,c])=>(
              <div key={k} className="panel-2" style={{padding:'8px 10px'}}>
                <div className="mono mute" style={{fontSize:10}}>{k}</div>
                <div className={"mono "+c} style={{fontSize:13,fontWeight:600,marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mute" style={{fontSize:12.5,marginTop:30,lineHeight:1.6,maxWidth:'40ch'}}>
          By signing up you agree to our Terms and Privacy Policy. The platform is educational — not investment advice.
        </div>
      </div>
    </div>
  );
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
        sub="Live ranking by points earned across courses, exercises and Survival Mode."
      />
      {rows===null && <div className="panel mute" style={{padding:24}}>Loading leaderboard…</div>}
      {rows!==null && visibleRows.length===0 && (
        <div className="panel" style={{padding:28, textAlign:'center'}}>
          <div className="mono" style={{fontWeight:600,fontSize:15}}>No scores yet.</div>
          <div className="mute" style={{fontSize:13,marginTop:8}}>
            {err ? 'Leaderboard backend unreachable — start the platform API to see live rankings.'
                 : 'Complete a lesson, exercise, quiz or Survival run and you will appear here in real time.'}
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
  const nbs = [
    {n:'black-scholes-intro.ipynb', m:'2d', tags:['Python','BS']},
    {n:'svi-fit.ipynb', m:'5d', tags:['Python','SVI','Vol']},
    {n:'mc-asian-option.ipynb', m:'1w', tags:['MC','Asian']},
    {n:'curve-bootstrap.ipynb', m:'2w', tags:['Curves']},
  ];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ notebooks</span></>}
        title="Notebooks"
        sub="Interactive Python notebooks — run code, plot results, share with peers."
        right={<button className="btn btn-primary btn-sm" onClick={()=>submitStub('Notebook draft')}><Icon name="plus" size={13}/> New notebook</button>}
      />
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:14}}>
        <div className="panel">
          <div className="label" style={{padding:'14px 14px 10px'}}>Library</div>
          {nbs.map((n,i)=>(
            <div key={n.n} style={{padding:'10px 14px',borderTop:'1px solid var(--line)', cursor:'pointer', background: i===0?'rgba(255,46,69,.05)':'transparent', borderLeft: i===0?'2px solid var(--red)':'2px solid transparent'}}>
              <div className="mono" style={{fontWeight:600,fontSize:12.5}}>{n.n}</div>
              <div className="row" style={{gap:6,marginTop:6,flexWrap:'wrap'}}>
                {n.tags.map(t=><span key={t} className="badge" style={{fontSize:9}}>{t}</span>)}
              </div>
              <div className="mono mute" style={{fontSize:10.5,marginTop:6}}>modified {n.m} ago</div>
            </div>
          ))}
        </div>
        <div className="col" style={{gap:14}}>
          <div className="mono mute" style={{fontSize:11}}>black-scholes-intro.ipynb · runs real Python in your browser (Pyodide)</div>
          <PyCodeCell label="black-scholes-intro.ipynb" minHeight={300} initial={`from math import log, sqrt, exp
from statistics import NormalDist
N = NormalDist().cdf

def bs_call(S, K, r, sigma, T):
    d1 = (log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqrt(T))
    d2 = d1 - sigma*sqrt(T)
    return S*N(d1) - K*exp(-r*T)*N(d2)

price = bs_call(100, 100, 0.02, 0.20, 0.5)
print(f"BS call price = {price:.4f}")

# price across spot
for S in range(80, 121, 10):
    print(f"S={S:3d}  call={bs_call(S, 100, 0.02, 0.20, 0.5):.4f}")`}/>
        </div>
      </div>
    </div>
  );
}

function MentoringPage() {
  const mentors = [
    {n:'Loïs Martin', r:'Vol trader · Paris', y:8, sp:'Vol surfaces · SABR'},
    {n:'Sade Okafor', r:'Quant researcher · NY', y:12, sp:'Stochastic vol · Heston'},
    {n:'Marisol Rivera', r:'Risk strategist · London', y:10, sp:'Greeks · Risk management'},
    {n:'Akira Chen', r:'Derivs structurer · HK', y:6, sp:'Exotic options · Autocallables'},
  ];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ mentoring</span></>}
        title="Mentoring"
        sub="Get unstuck. 1-on-1 sessions with practicing quants — pricing, code review, career."
        right={<span className="badge">Bientôt · booking opens soon</span>}
      />
      <div className="grid-4">
        {[
          {t:'Pick a mentor', d:'Browse by specialty and timezone.', ic:'users'},
          {t:'Book a slot', d:'30 or 60 minutes, on the calendar.', ic:'calendar'},
          {t:'Brief them', d:'Share notebooks, papers, screenshots.', ic:'paperclip'},
          {t:'Ship', d:'Video call + recording + follow-up notes.', ic:'video'},
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
          {mentors.map(m=>(
            <div key={m.n} className="panel" style={{padding:20, display:'flex',gap:16,alignItems:'center'}}>
              <div style={{width:60,height:60,border:'1px solid var(--line-2)',display:'grid',placeItems:'center',background:'#06080B'}}>
                <Icon name="user" size={20}/>
              </div>
              <div style={{flex:1}}>
                <div className="mono" style={{fontWeight:700}}>{m.n}</div>
                <div className="mute" style={{fontSize:12,marginTop:4}}>{m.r} · {m.y}y</div>
                <div className="mono red" style={{fontSize:11.5,marginTop:6}}>{m.sp}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={()=>submitStub(`Mentoring booking with ${m.n}`)}>Book</button>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <h2 className="section-title">Packages</h2>
        <div className="grid-3" style={{marginTop:14}}>
          {[
            {n:'1 session',p:'49€',d:'30 min, single topic'},
            {n:'4 sessions',p:'179€',d:'1 month coaching plan'},
            {n:'12 sessions',p:'479€',d:'Career-track quarterly'},
          ].map((p,i)=>(
            <div key={p.n} className="panel" style={{padding:24}}>
              <div className="mono" style={{fontWeight:700,fontSize:14}}>{p.n}</div>
              <div className="mono" style={{fontSize:32,fontWeight:700,marginTop:14,color:i===1?'var(--red)':'var(--text)'}}>{p.p}</div>
              <div className="mute" style={{fontSize:12.5,marginTop:8}}>{p.d}</div>
              <button className={"btn "+(i===1?'btn-primary':'btn-outline')+" btn-sm"} onClick={()=>submitStub(`${p.n} mentoring package`)} style={{width:'100%',justifyContent:'center',marginTop:20}}>Choose</button>
            </div>
          ))}
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
  const [applied,setApplied] = useState({});
  const [posting,setPosting] = useState(false);
  const [form,setForm] = useState({ title:'', company:'', location:'', kind:'full-time', description:'' });
  const refetch = useCallback(()=>{ platformApi.listJobs().then(setJobs).catch(()=>setJobs([])); },[]);
  useEffect(()=>{ refetch(); },[refetch]);
  const apply = async (j) => {
    try {
      await platformApi.applyJob(j.id, { applicant: authEmail || 'guest', note:`Applied via platform` });
      setApplied((p)=>({...p,[j.id]:true}));
      notify(`Application sent for ${j.title}.`);
    } catch (e) { notify(`Could not apply (${e.message}).`, 'error'); }
  };
  const postJob = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.company.trim()) { notify('Title and company are required.', 'error'); return; }
    try {
      await platformApi.createJob({ ...form, tags:[], posted_by: authEmail || 'anon' });
      setPosting(false); setForm({ title:'', company:'', location:'', kind:'full-time', description:'' });
      notify('Job posted.'); refetch();
    } catch (e) { notify(`Could not post (${e.message}).`, 'error'); }
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
        sub="Aggregated from top quant firms (Jane Street, Point72, IMC, Optiver…) and curated boards — trading, quant, structuring, risk."
        right={<>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Role or keyword…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
          <button className="btn btn-primary btn-sm" onClick={()=>setPosting(p=>!p)}><Icon name="plus" size={13}/> Post a job</button>
        </>}
      />
      {posting && (
        <div className="panel" style={{padding:20, marginBottom:16}}>
          <form className="grid-2" style={{gap:12}} onSubmit={postJob}>
            <input value={form.title} onChange={(e)=>setForm(f=>({...f,title:e.target.value}))} placeholder="Role title"/>
            <input value={form.company} onChange={(e)=>setForm(f=>({...f,company:e.target.value}))} placeholder="Company"/>
            <input value={form.location} onChange={(e)=>setForm(f=>({...f,location:e.target.value}))} placeholder="Location (or Remote)"/>
            <select value={form.kind} onChange={(e)=>setForm(f=>({...f,kind:e.target.value}))}>{['full-time','internship','remote','contract'].map(o=><option key={o}>{o}</option>)}</select>
            <textarea value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} placeholder="Short description" rows={2} style={{gridColumn:'1 / -1'}}></textarea>
            <button className="btn btn-primary btn-sm" type="submit" style={{justifySelf:'start'}}>Publish job</button>
          </form>
        </div>
      )}
      <div className="tabs-bar">
        {[['all','All'],['remote','Remote'],['intern','Internship']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l} <span className="mute" style={{marginLeft:6}}>{k==='all'?list.length:list.filter(j=>(k==='remote'&&/remote/i.test(j.location||''))||(k==='intern'&&/intern/i.test(j.kind||''))).length}</span></button>
        ))}
      </div>
      <div className="panel">
        {jobs===null && <div className="mute" style={{padding:20}}>Loading jobs…</div>}
        {jobs!==null && list.length===0 && <div className="mute" style={{padding:20}}>No openings yet. Be the first to post one — or start the platform backend.</div>}
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
                  ? <a className="btn btn-outline btn-sm" href={j.url} target="_blank" rel="noopener noreferrer" onClick={()=>{ try{ platformApi.applyJob(j.id,{applicant:authEmail||'guest',note:'Opened posting'}); }catch(e){} }}>Apply ↗</a>
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
            <select value={f.kind} onChange={set('kind')}>{['Calculator','Lesson','UI','Account','Other'].map(o=><option key={o}>{o}</option>)}</select>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Priority</span>
            <select value={f.severity} onChange={set('severity')}>{['Low','Medium','High','Critical'].map(o=><option key={o}>{o}</option>)}</select>
          </div>
          <div className="field">
            <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>Title</span>
            <input value={f.summary} onChange={set('summary')} placeholder="Short summary of the bug"/>
          </div>
          {[['Steps to reproduce','steps'],['Expected behaviour','expected'],['Actual behaviour','actual']].map(([l,k])=>(
            <div key={k} className="field">
              <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>{l}</span>
              <textarea rows={3} value={f[k]} onChange={set(k)}></textarea>
            </div>
          ))}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{width:'100%',justifyContent:'center',marginTop:8,opacity:busy?0.7:1}}>{busy?'Submitting…':'Submit report'} <Icon name="send" size={13}/></button>
        </form>
      </div>
    </div>
  );
}

function ApiDocsPage() {
  const [endpoint, setEndpoint] = useState('/v1/price/european');
  const endpoints = [
    {p:'GET',u:'/v1/price/european',d:'Closed-form European option price'},
    {p:'POST',u:'/v1/price/american',d:'Binomial American option price'},
    {p:'POST',u:'/v1/price/mc',d:'Monte Carlo price for path-dependent payoffs'},
    {p:'GET',u:'/v1/iv/calc',d:'Implied volatility from market price'},
    {p:'POST',u:'/v1/curve/bootstrap',d:'Bootstrap zero curve from instruments'},
    {p:'POST',u:'/v1/calibrate',d:'Fit Black/SABR/Heston to vol surface'},
  ];
  const activeEndpoint = endpoints.find((item)=>item.u===endpoint) || endpoints[0];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ api</span></>}
        title="API Documentation"
        sub="Programmatic access to all pricers and calibrators."
        right={<><span className="badge">v1.4</span><button className="btn btn-primary btn-sm" onClick={()=>submitStub('API key request')}>Get API key</button></>}
      />
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:14}}>
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
            <p className="text-2" style={{fontSize:13,marginTop:0}}>{activeEndpoint.d}. The schema below shows the pricing endpoint shape; POST endpoints accept the same market block plus product-specific fields.</p>
            <div className="label" style={{margin:'18px 0 8px'}}>{activeEndpoint.p === 'GET' ? 'Query parameters' : 'Request body'}</div>
            <table className="data">
              <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
              <tbody>
                {[
                  ['S','float','yes','Spot price'],
                  ['K','float','yes','Strike'],
                  ['r','float','yes','Risk-free rate'],
                  ['sigma','float','yes','Volatility'],
                  ['T','float','yes','Maturity (years)'],
                  ['type','string','no','call|put (default: call)'],
                ].map(r=><tr key={r[0]}><td className="symbol">{r[0]}</td><td>{r[1]}</td><td className={r[2]==='yes'?'red':'mute'}>{r[2]}</td><td>{r[3]}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="grid-2">
            <div className="panel" style={{padding:18}}>
              <div className="label" style={{marginBottom:10}}>cURL</div>
              <pre className="code"><code>{`curl https://api.thepricinglibrary.com/v1/price/european \\
  -H "Authorization: Bearer $TPL_KEY" \\
  -G \\
  -d S=100 -d K=100 -d r=0.02 \\
  -d sigma=0.20 -d T=0.5`}</code></pre>
            </div>
            <div className="panel" style={{padding:18}}>
              <div className="label" style={{marginBottom:10}}>Response · 200 OK</div>
              <pre className="code"><code>{`{
  "price": 6.0401,
  "greeks": {
    "delta": 0.5398,
    "gamma": 0.0281,
    "vega":  0.2812,
    "theta": -0.0058,
    "rho":   0.2611
  },
  "d1": 0.1591, "d2": 0.0177
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPage() {
  let auth=null; try { auth=useAuth(); } catch { auth=null; }
  const isAdmin = (()=>{ try { return typeof auth?.isAdmin==='function' ? auth.isAdmin() : (auth?.profile?.role==='admin'); } catch { return false; } })();
  const [counts,setCounts] = useState(null);
  useEffect(()=>{ if(isAdmin) platformApi.health().then((d)=>setCounts(d?.counts||{})).catch(()=>setCounts({})); },[isAdmin]);
  if (!auth?.isAuthenticated) return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ admin</span></>} title="Admin" sub="Restricted area."/>
      <div className="panel" style={{padding:28,textAlign:'center'}}><Icon name="lock" size={24}/><div className="mono" style={{fontWeight:600,marginTop:10}}>Sign in required.</div><Link to="/auth/login" className="btn btn-primary" style={{marginTop:16}}>Log in</Link></div></div>
  );
  if (!isAdmin) return (
    <div className="container page"><PageHead crumb={<><Link to="/">/ home</Link><i>›</i><span>/ admin</span></>} title="Admin" sub="Restricted area."/>
      <div className="panel" style={{padding:28,textAlign:'center'}}><Icon name="lock" size={24}/><div className="mono" style={{fontWeight:600,marginTop:10}}>Access denied.</div><div className="mute" style={{fontSize:13,marginTop:8}}>This area requires an admin role on your profile.</div></div></div>
  );
  const c = counts || {};
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ admin</span></>}
        title={<>Admin Dashboard <span className="badge badge-red" style={{marginLeft:12,fontSize:9}}>RESTRICTED</span></>}
        sub="Platform operations · live counts from the platform database."
      />
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
              {['@quant_apprentice|Free|UK|2h','@vol_seeker|Student|DE|4h','@gamma_grinder|Pro|US|6h','@theta_tamer|Student|FR|8h','@sigma_hunter|Free|JP|12h'].map(r=>{
                const [n,p,c,t] = r.split('|');
                return <tr key={n}><td className="symbol">{n}</td><td><TierBadge tier={p.toLowerCase()}/></td><td>{c}</td><td>{t} ago</td></tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Content moderation queue</div>
            <span className="badge badge-amber">12 pending</span>
          </div>
          <table className="data">
            <thead><tr><th>Item</th><th>Type</th><th>Reporter</th><th></th></tr></thead>
            <tbody>
              {[
                ['Spam in forum thread #2412','Forum','@auto-mod'],
                ['Notebook violates copyright','Notebook','@quantfox'],
                ['Inappropriate content in chat','Chat','@aurora_vol'],
                ['Plagiarism in publication','Publication','@editor'],
              ].map((r,i)=><tr key={i}><td>{r[0]}</td><td>{r[1]}</td><td className="symbol">{r[2]}</td><td><div className="row" style={{gap:4}}><button className="btn btn-ghost btn-sm" onClick={()=>notify('Moderation item approved.')} style={{padding:'2px 6px'}}>OK</button><button className="btn btn-ghost btn-sm" onClick={()=>notify('Moderation ban staged.', 'warning')} style={{padding:'2px 6px',color:'var(--red)'}}>BAN</button></div></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="container page">
      <div className="panel" style={{padding:60,textAlign:'center',marginTop:24}}>
        <div className="mono" style={{fontSize:120,fontWeight:700,color:'var(--red)',lineHeight:1}}>404</div>
        <div className="mono mute" style={{fontSize:14,letterSpacing:'.1em',marginTop:14,textTransform:'uppercase'}}>RESOURCE NOT FOUND</div>
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
        sub="Exercises · Quizzes · Survival Mode · Weekly Challenge — all in one place."
      />
      <div className="grid-3">
        {[
          {t:'Exercises',d:'AI-generated desk exercises with worked solutions.',ic:'code',to:'/exercises',n:'AI generator'},
          {t:'Quizzes',d:'Multiple choice — quick check on theory.',ic:'help-circle',to:'/dashboard',n:'by topic'},
          {t:'Survival Mode',d:'Pressure-tested questions. Timer running.',ic:'zap',to:'/survival',n:'6 waves'},
          {t:'Weekly Challenge',d:'A worked desk problem to practise on.',ic:'trophy',to:'/challenge',n:'preview'},
          {t:'Leaderboard',d:'Where you stand. Global and by topic.',ic:'crown',to:'/leaderboard',n:'live ranking'},
          {t:'Pair Programming',d:'Discuss problems with other learners.',ic:'users',to:'/community',n:'via community'},
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
        title="Weekly Challenge"
        sub="A worked desk problem to practise on. (Live ranked challenges are coming soon.)"
        right={<><span className="badge">Preview</span></>}
      />
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14}}>
        <div className="panel" style={{padding:32}}>
          <div className="mono" style={{fontSize:11, color:'var(--mute)', letterSpacing:'.14em',marginBottom:18}}>CHALLENGE 22 · WEEK 21 · 2026</div>
          <h2 className="mono" style={{fontSize:24,fontWeight:700, margin:'0 0 14px'}}>Price a Down-and-Out Call</h2>
          <p className="text-2" style={{fontSize:14,lineHeight:1.7}}>
            Compute the closed-form value of a down-and-out call on a non-dividend underlying using the Merton (1973) result,
            then verify with 100,000 Monte Carlo paths using antithetic variance reduction.
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
            <li>MC verification (100k paths, antithetic)</li>
            <li>Standard error and 95% CI</li>
            <li>One-paragraph commentary on convergence</li>
          </ul>
        </div>
        <div className="col" style={{gap:14, alignSelf:'start'}}>
          <div className="panel" style={{padding:18}}>
            <div className="label" style={{marginBottom:14}}>Stats</div>
            <div className="col" style={{gap:8}}>
              {[['Submissions','156'],['Avg score','7.2/10'],['Top score','9.8'],['Median time','42min']].map(([k,v])=>(
                <div key={k} className="row between" style={{padding:'4px 0'}}>
                  <span className="mono mute" style={{fontSize:11}}>{k}</span>
                  <span className="mono" style={{fontSize:12.5,fontWeight:600}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <Link to="/notebooks" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>Open notebook <Icon name="arrow-right" size={13}/></Link>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CommunityPage, BlogPage, DashboardPage, PricingPage, AuthPage, LeaderboardPage,
  NotebooksPage, MentoringPage, JobsPage, BugReportPage, ApiDocsPage, AdminPage, NotFoundPage,
  PracticePage, ChallengePage,
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
  return <AgentRoomReal/>;
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
          <div style={{padding:'60px 0',textAlign:'center',color:AGR.mute,fontFamily:agrMono,fontSize:13}}>{tab} — coming next in the agentic desk build.</div>
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
  if (path.startsWith('/agent-room')) {
    return <div data-screen-label="agent-room"><AgentRoomPage/></div>;
  }

  let page;
  if (path==='' || path==='/') page = <HomePage/>;
  else if (path.startsWith('/courses/')) page = <CourseDetailPage route={route}/>;
  else if (path==='/courses') page = <CoursesPage/>;
  else if (path.startsWith('/tools')) page = <ToolsPage route={route}/>;
  else if (path.startsWith('/lab')) page = <TradingLabPage route={route}/>;
  else if (path.startsWith('/exercises')) page = <ExercisesPage route={route}/>;
  else if (path.startsWith('/survival')) page = <SurvivalPage route={route}/>;
  else if (path.startsWith('/community')) page = <CommunityPage route={route}/>;
  else if (path.startsWith('/blog')) page = <BlogPage route={route}/>;
  else if (path==='/dashboard') page = <DashboardPage/>;
  else if (path==='/pricing') page = <PricingPage/>;
  else if (path.startsWith('/auth')) page = <AuthPage route={route}/>;
  else if (path==='/leaderboard') page = <LeaderboardPage/>;
  else if (path==='/notebooks') page = <NotebooksPage/>;
  else if (path==='/mentoring') page = <MentoringPage/>;
  else if (path==='/jobs') page = <JobsPage/>;
  else if (path==='/bug') page = <BugReportPage/>;
  else if (path==='/api') page = <ApiDocsPage/>;
  else if (path==='/admin') page = <AdminPage/>;
  else if (path==='/practice') page = <PracticePage/>;
  else if (path==='/challenge') page = <ChallengePage/>;
  else page = <NotFoundPage/>;

  return (
    <div data-screen-label={path||'home'}>
      <TopStrip/>
      <Header route={route}/>
      {page}
      <Footer/>
      {/* ChatFab replaced by the global AG-UI AgentDock (mounted in App.tsx) */}
      <ToastStack/>
    </div>
  );
}

export default App;
