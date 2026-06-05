import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { useAuth } from '../contexts/AuthContext';
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
  saveGeneratedExercise,
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

const TOOLS = [
  {id:'bs-pricer', name:'Black-Scholes Pricer', cat:'Calculators', tier:'free', desc:'Closed-form price + Greeks for European options.'},
  {id:'payoff', name:'Payoff Visualizer', cat:'Visualizers', tier:'free', desc:'Build multi-leg strategies, view P&L, breakevens, Greeks.'},
  {id:'mc', name:'Monte Carlo Simulator', cat:'Simulators', tier:'free', desc:'GBM paths, terminal distribution, VaR & ES.'},
  {id:'iv-calc', name:'Volatility Calculator', cat:'Calculators', tier:'free', desc:'Realized vol, rolling windows, multiple estimators.'},
  {id:'calib', name:'Model Calibration', cat:'Calculators', tier:'student', desc:'Fit Black, SABR, Heston to market smiles.'},
  {id:'binomial', name:'Binomial Tree', cat:'Calculators', tier:'pro', desc:'Cox-Ross-Rubinstein for American + early exercise.'},
  {id:'volsurface', name:'Vol Surface Explorer', cat:'Visualizers', tier:'pro', desc:'3D implied vol surface, slice by strike/tenor.'},
  {id:'bond', name:'Bond Calculator', cat:'Calculators', tier:'pro', desc:'YTM, duration, convexity, scenario shifts.'},
  {id:'curve', name:'Yield Curve Builder', cat:'Calculators', tier:'pro', desc:'Bootstrap from deposits, futures, swaps.'},
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
          <span>{c.modules} modules</span>
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

// ============== COURSE DETAIL ==============
function CourseDetailPage({route}) {
  const id = route.parts[1] || 'black-scholes';
  const c = COURSES.find(x=>x.id===id) || COURSES[0];
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

  const openModule = useCallback((index) => {
    setSelectedModuleIndex(index);
    setTab('content');
  }, []);

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
          {tab==='script' && <CourseScript c={c} scriptState={scriptState} scriptModel={scriptModel}/>}
          {tab==='calc' && <CourseCalculator c={c}/>}
          {tab==='exercises' && <CourseExercises c={c}/>}
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
    labs: parseNumberedSection(clean, 'Labs pratiques a inclure'),
    exerciseBank: parseBulletSection(clean, "Banque d'exercices rattaches"),
    teacherScript: parseNumberedSection(clean, 'Script enseignant'),
    supports: parseBulletSection(clean, 'Supports a produire'),
    facts: parseBulletSection(clean, 'Faits et angles extraits de la base'),
    sources: parseSourceAppendix(clean),
  };
}

function parseWrittenLessons(markdown) {
  const section = markdownSection(markdown, 'Cours redige');
  const matches = [...section.matchAll(/^### Lecon\s+(\d+)\s+-\s+(.+?)\s*\r?\n([\s\S]*?)(?=^### Lecon\s+\d+\s+-|\s*$)/gm)];
  return matches.map((match)=>({
    number: Number(match[1]),
    title: match[2].trim(),
    body: match[3].trim(),
  }));
}

function parseScriptModules(markdown) {
  const section = markdownSection(markdown, 'Deroule pratique');
  const matches = [...section.matchAll(/^### Module\s+(\d+)\s+-\s+(.+?)\s*\r?\n([\s\S]*?)(?=^### Module\s+\d+\s+-|\s*$)/gm)];
  return matches.map((match) => {
    const fields = parseDeskBullets(match[3]);
    return {
      number: Number(match[1]),
      title: match[2].trim(),
      fields,
      objective: fields['Objectif pratique'] || '',
      situation: fields['Situation de desk'] || '',
      notion: fields['Notion utile'] || '',
      activity: fields.Activite || '',
      deliverable: fields['Livrable apprenant'] || '',
      raw: match[3].trim(),
    };
  });
}

function parseScriptFormulas(markdown) {
  const section = markdownSection(markdown, 'Formules de desk');
  const matches = [...section.matchAll(/^### F(\d+)\s+-\s+(.+?)\s*\r?\n\$\$\s*\r?\n([\s\S]*?)\r?\n\$\$\s*\r?\n([\s\S]*?)(?=^### F\d+\s+-|\s*$)/gm)];
  return matches.map((match) => ({
    number: Number(match[1]),
    title: match[2].trim(),
    expression: match[3].trim(),
    usage: (match[4].match(/Usage desk:\s*(.+)/i)?.[1] || match[4].replace(/^-\s*/, '')).trim(),
  }));
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
        d: module.deliverable || module.objective || 'Desk deliverable',
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
        <div className="label" style={{marginBottom:10}}>Curriculum status</div>
        <div className="row between" style={{marginBottom:6}}>
          <span className="mono" style={{fontSize:18,fontWeight:700}}>OPEN</span>
          <span className="mono mute" style={{fontSize:11}}>{unlockedCount} / {unlockedCount} modules</span>
        </div>
        <div style={{height:3,background:'var(--line)',borderRadius:0}}>
          <div style={{height:'100%',width:'100%',background:'var(--red)'}}></div>
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

function LatexMarkdown({content}) {
  return (
    <div className="course-script-markdown">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {stripFrontmatter(content)}
      </ReactMarkdown>
    </div>
  );
}

function stripFrontmatter(markdown = '') {
  return markdown.replace(/^---\s*[\s\S]*?\s*---\s*/, '');
}

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
  const labs = scriptModel?.labs?.length ? scriptModel.labs : blueprint.labs.map(([lab, task])=>`${lab}: ${task}`);
  const facts = scriptModel?.facts?.slice(0, 6) || [];
  const supports = scriptModel?.supports?.length ? scriptModel.supports : blueprint.resources;
  const loading = scriptState?.status === 'loading';

  return (
    <div className="col" style={{gap:18}}>
      <div className="panel" style={{padding:24}}>
        <div className="section-eyebrow" style={{margin:0}}>// Practice-first curriculum</div>
        <h2 className="mono" style={{fontSize:24,fontWeight:700,marginTop:10,marginBottom:12}}>{blueprint.deskRole}</h2>
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.75,marginTop:0,maxWidth:'82ch'}}>
          {blueprint.deskPromise} The module starts from a market task, introduces only the minimum theory needed,
          then finishes with a calculation, a risk interpretation and a desk action.
        </p>
        <div className="row" style={{gap:8,flexWrap:'wrap',marginTop:16}}>
          <span className="badge badge-green">All modules open</span>
          {blueprint.workflow.map((step,idx)=>(
            <span key={step} className="badge">{String(idx + 1).padStart(2,'0')} · {step}</span>
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
        moduleCount={modules.length}
        selectedModuleIndex={safeIndex}
        onOpenScript={onOpenScript}
      />

      <div className="grid-2">
        <div className="panel course-module-switcher">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Modules du cours</div>
            <span className="badge">{modules.length} open</span>
          </div>
          <div className="course-module-list">
            {modules.map((module,idx)=>(
              <button key={`${module.number}-${module.title}`} type="button" className={idx===safeIndex ? 'active' : ''} onClick={()=>onSelectModule?.(idx)}>
                <span className="mono">{String(idx + 1).padStart(2,'0')}</span>
                <div>
                  <strong>{module.title}</strong>
                  <small>{module.deliverable || module.objective || 'Desk output'}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="panel" style={{padding:18}}>
          <div className="label" style={{marginBottom:14}}>What the learner produces</div>
          <div className="col" style={{gap:10}}>
            {[
              ['Market read', 'Inputs, assumptions and missing data are made explicit.'],
              ['Calculation', 'Numbers are shown with units and signs, not hidden behind prose.'],
              ['Risk view', 'The learner identifies the exposure that matters on a desk.'],
              ['Action', 'Every lesson ends with hedge, monitor, reduce, quote or escalate.'],
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
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenScript}>Full derivation <Icon name="arrow-right" size={13}/></button>
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
            <Link to="/exercises" className="btn btn-outline btn-sm">Open exercises <Icon name="arrow-right" size={13}/></Link>
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

      <div className="grid-3">
        {[
          {label:'Course role', value: blueprint.deskRole, icon:'briefcase'},
          {label:'Practice assets', value: `${labs.length} labs`, icon:'clipboard-check'},
          {label:'Source base', value: `${scriptModel?.sources?.length || blueprint.resources.length} sources`, icon:'database'},
        ].map((item)=>(
          <div key={item.label} className="panel" style={{padding:18}}>
            <Icon name={item.icon} size={18} style={{color:'var(--red)'}}/>
            <div className="label" style={{marginTop:14}}>{item.label}</div>
            <div className="mono" style={{fontWeight:700,fontSize:15,marginTop:6}}>{item.value}</div>
          </div>
        ))}
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

function CourseModuleReader({c, module, writtenLesson, formula, moduleCount, selectedModuleIndex, onOpenScript}) {
  if (!module) {
    return (
      <div className="panel course-script-state">
        <Icon name="circle-alert" size={16} style={{color:'var(--red)'}}/>
        <span className="mono mute">No module content available yet.</span>
      </div>
    );
  }

  const fields = [
    ['Situation de desk', module.situation || 'Start from a real market task and identify the missing data.', 'activity'],
    ['Objectif pratique', module.objective || 'Produce a calculation usable by a trader or risk manager.', 'target'],
    ['Notion utile', module.notion || c.topics.join(', '), 'sigma'],
    ['Activite', module.activity || 'Calculate, check signs and write the desk action.', 'calculator'],
    ['Livrable', module.deliverable || 'Risk snapshot', 'clipboard-check'],
  ];

  return (
    <div className="panel course-module-reader">
      <div className="course-module-reader-head">
        <div>
          <div className="section-eyebrow" style={{margin:0}}>// Module {selectedModuleIndex + 1} of {moduleCount}</div>
          <h2 className="mono">{module.title}</h2>
          <p className="text-2">{module.objective || module.situation || 'Module pratique construit depuis les sources de la bibliotheque.'}</p>
        </div>
        <div className="row" style={{gap:8,flexWrap:'wrap'}}>
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
        <div className="course-written-lesson">
          <div className="label" style={{marginBottom:10}}>Cours redige</div>
          <LatexMarkdown content={writtenLesson.body}/>
        </div>
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
            <thead><tr><th>Method</th><th>Steps</th><th className="num">Price</th><th className="num">Δ vs BS</th><th className="num">ms</th></tr></thead>
            <tbody>
              <tr><td className="symbol">Black-Scholes</td><td>—</td><td className="num">{fmt(call.price)}</td><td className="num">0.0000</td><td className="num">0.01</td></tr>
              <tr><td className="symbol">CRR Binomial</td><td>50</td><td className="num">{fmt(call.price+0.082)}</td><td className="num green">+0.082</td><td className="num">0.41</td></tr>
              <tr><td className="symbol">CRR Binomial</td><td>500</td><td className="num">{fmt(call.price+0.011)}</td><td className="num green">+0.011</td><td className="num">3.20</td></tr>
              <tr><td className="symbol">CRR Binomial</td><td>5000</td><td className="num">{fmt(call.price+0.0012)}</td><td className="num green">+0.001</td><td className="num">42.1</td></tr>
              <tr><td className="symbol">Monte Carlo</td><td>100k paths</td><td className="num">{fmt(call.price-0.027)}</td><td className="num red">-0.027</td><td className="num">128.4</td></tr>
            </tbody>
          </table>
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
          <span className="badge">14:32</span>
        </div>
        <div style={{aspectRatio:'16/7', background:'#06080B', border:'1px solid var(--line)', marginTop:14, display:'grid', placeItems:'center', position:'relative'}}>
          <div style={{textAlign:'center'}}>
            <div style={{width:60,height:60,borderRadius:30,border:'1px solid var(--red)',display:'grid',placeItems:'center',margin:'0 auto'}}>
              <Icon name="play" size={24} style={{color:'var(--red)'}}/>
            </div>
            <div className="mono mute" style={{fontSize:11,marginTop:14,letterSpacing:'.08em'}}>INTERACTIVE LESSON · GREEKS RISK PANEL</div>
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
        <ChartFrame title="Zero-coupon curve" subtitle="USD swap mid · 23-May-2026">
          <LineChart width={500} height={240} series={[{name:'Z', color:'#3E8BFF', data:zero, fillOpacity:0.08}]}/>
        </ChartFrame>
        <ChartFrame title="Instantaneous forwards" subtitle="dF / dτ">
          <LineChart width={500} height={240} series={[{name:'F', color:'#FF2E45', data:fwd, fillOpacity:0.08}]}/>
        </ChartFrame>
      </div>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Quoted instruments</div>
          <span className="badge">USD · MID</span>
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
        <p className="text-2" style={{fontSize:13.5,lineHeight:1.7}}>Equity-index options exhibit a persistent negative skew. Below: the smile across maturities for SPX as of 23-May-2026 (mid).</p>
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
        <Stat label="Mean Price" value={fmt(6.18,3)}/>
        <Stat label="Std Error" value="±0.012" sub="100k paths"/>
        <Stat label="95% CI" value="[6.156, 6.204]"/>
        <Stat label="VaR 99%" value="-3.41" sub="1-day" accent="var(--red)"/>
        <Stat label="Expected Shortfall" value="-4.82" sub="1-day · 99%" accent="var(--red)"/>
        <Stat label="Convergence" value="O(1/√n)"/>
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

function ToolDetailPage({id}) {
  const tool = TOOLS.find(t=>t.id===id);
  if (!tool) return <ToolNotFound/>;
  if (id === 'bs-pricer') return <BSPricerTool/>;
  if (id === 'payoff') return <PayoffVisualizerTool/>;
  if (id === 'mc') return <MonteCarloTool/>;
  if (id === 'iv-calc') return <IVCalcTool/>;
  if (id === 'calib') return <CalibrationTool/>;
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
function CalibrationTool() {
  const [model, setModel] = useState('SABR');
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/tools">tools</Link><i>›</i><span>model calibration</span></>}
        title="Model Calibration"
        sub="Fit Black, SABR or Heston parameters to a market volatility surface."
        right={<><TierBadge tier="student"/></>}
      />
      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:14}}>
        <div className="col" style={{gap:14}}>
          <div className="panel">
            <div className="row between" style={{padding:'12px 16px', borderBottom:'1px solid var(--line)'}}>
              <div className="label">Market vs Model</div>
              <div className="toggle">
                {['Black','SABR','Heston'].map(m=><button key={m} className={model===m?'on':''} onClick={()=>setModel(m)}>{m}</button>)}
              </div>
            </div>
            <div style={{padding:14}}>
              <LineChart width={760} height={280} series={[
                {name:'Market', color:'#FF2E45', data:Array.from({length:30},(_,i)=>({x:80+i*1.5, y:0.18+0.12*((i-15)/15)**2 - 0.05*((i-15)/15) + 0.005*Math.sin(i)})), fill:false, strokeWidth:2},
                {name:'Model', color:'#3E8BFF', data:Array.from({length:30},(_,i)=>({x:80+i*1.5, y:0.18+0.10*((i-15)/15)**2 - 0.05*((i-15)/15)})), fill:false, dashed:true},
              ]}/>
            </div>
            <div className="row between" style={{padding:'10px 16px',borderTop:'1px solid var(--line)',background:'var(--panel-2)'}}>
              <span className="mono mute" style={{fontSize:11}}>K range 80 → 125</span>
              <span className="mono" style={{fontSize:11.5}}>RMSE <span className="green">0.0042</span> · MAE <span className="green">0.0031</span></span>
            </div>
          </div>
          <div className="panel">
            <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
              <div className="label">Market quotes · SPX Dec-26</div>
              <span className="badge">23-May-2026 mid</span>
            </div>
            <table className="data">
              <thead><tr><th>Strike</th><th className="num">Bid σ</th><th className="num">Ask σ</th><th className="num">Mid σ</th><th className="num">Model σ</th><th className="num">Residual</th></tr></thead>
              <tbody>
                {[80,90,95,100,105,110,120].map(k=>{
                  const mid = 0.18+0.10*((k-100)/15)**2 - 0.05*((k-100)/15) + 0.003*Math.sin(k);
                  const mdl = 0.18+0.10*((k-100)/15)**2 - 0.05*((k-100)/15);
                  const res = mid - mdl;
                  return <tr key={k}>
                    <td className="symbol">{k}</td>
                    <td className="num">{(mid-0.003).toFixed(4)}</td>
                    <td className="num">{(mid+0.003).toFixed(4)}</td>
                    <td className="num">{mid.toFixed(4)}</td>
                    <td className="num">{mdl.toFixed(4)}</td>
                    <td className={"num "+(Math.abs(res)<0.005?'green':'amber')}>{res>=0?'+':''}{res.toFixed(4)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col" style={{gap:14}}>
          <div className="panel" style={{padding:16}}>
            <div className="label" style={{marginBottom:14}}>Calibrated Parameters · {model}</div>
            {model==='SABR' && (
              <table className="data" style={{border:'none'}}>
                <tbody>
                  <tr><td className="symbol">α (vol of vol)</td><td className="num">0.2841</td></tr>
                  <tr><td className="symbol">β (CEV)</td><td className="num">0.5000</td></tr>
                  <tr><td className="symbol">ρ (correlation)</td><td className="num">-0.6210</td></tr>
                  <tr><td className="symbol">ν (vol-of-vol)</td><td className="num">0.4128</td></tr>
                </tbody>
              </table>
            )}
            {model==='Heston' && (
              <table className="data" style={{border:'none'}}>
                <tbody>
                  <tr><td className="symbol">v₀</td><td className="num">0.0392</td></tr>
                  <tr><td className="symbol">κ</td><td className="num">2.1502</td></tr>
                  <tr><td className="symbol">θ</td><td className="num">0.0481</td></tr>
                  <tr><td className="symbol">σ_v</td><td className="num">0.5816</td></tr>
                  <tr><td className="symbol">ρ</td><td className="num">-0.7032</td></tr>
                </tbody>
              </table>
            )}
            {model==='Black' && (
              <table className="data" style={{border:'none'}}>
                <tbody>
                  <tr><td className="symbol">σ (flat)</td><td className="num">0.1882</td></tr>
                </tbody>
              </table>
            )}
            <button className="btn btn-primary btn-sm" onClick={()=>notify(`${model} calibration refreshed.`)} style={{width:'100%',marginTop:14,justifyContent:'center'}}><Icon name="play" size={13}/> Re-calibrate</button>
          </div>
          <div className="panel" style={{padding:16}}>
            <div className="label" style={{marginBottom:10}}>Optimizer</div>
            <table className="data" style={{border:'none'}}>
              <tbody>
                <tr><td className="symbol">Method</td><td className="num">L-BFGS-B</td></tr>
                <tr><td className="symbol">Iterations</td><td className="num">28</td></tr>
                <tr><td className="symbol">Wall time</td><td className="num">412 ms</td></tr>
                <tr><td className="symbol">Loss (final)</td><td className="num">1.18e-5</td></tr>
              </tbody>
            </table>
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
        sub="Build, backtest and stress-test option strategies against historical and synthetic regimes."
        right={<>
          <span className="badge"><span className="dot dot-green"></span>SANDBOX</span>
          <button className="btn btn-outline btn-sm" onClick={()=>notify('Saved runs opened in sandbox mode.')}><Icon name="folder-open" size={13}/> My runs (12)</button>
          <button className="btn btn-primary btn-sm" onClick={()=>notify('New backtest run initialized.')}><Icon name="plus" size={13}/> New run</button>
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

function BacktestPanel() {
  const equity = useMemo(()=>{
    let v = 100000;
    return Array.from({length:252},(_,i)=>{
      v *= 1 + 0.0006 + 0.013*(Math.sin(i*0.07)*0.5 + (Math.random()-0.5));
      return {x:i, y:Math.round(v)};
    });
  },[]);
  const dd = useMemo(()=>{
    let peak = equity[0].y;
    return equity.map(p=>{ if (p.y>peak) peak=p.y; return {x:p.x, y: (p.y/peak-1)*100}; });
  },[equity]);
  const trades = [
    {dt:'2026-04-12', sym:'SPX',  st:'Bull Call Spread', qty:10, pnl:1218, win:true},
    {dt:'2026-04-19', sym:'NDX',  st:'Iron Condor', qty:5, pnl:-412, win:false},
    {dt:'2026-04-26', sym:'TSLA', st:'Long Straddle', qty:8, pnl:920, win:true},
    {dt:'2026-05-03', sym:'NVDA', st:'Short Strangle', qty:6, pnl:1410, win:true},
    {dt:'2026-05-10', sym:'AAPL', st:'Calendar Spread', qty:12, pnl:-208, win:false},
    {dt:'2026-05-17', sym:'SPX',  st:'Iron Condor', qty:5, pnl:680, win:true},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:14}}>
      {/* config */}
      <div className="col" style={{gap:14, alignSelf:'start'}}>
        <div className="panel" style={{padding:18}}>
          <div className="label" style={{marginBottom:14}}>Configuration</div>
          {[
            ['Strategy','Iron Condor · ATM ±5%', 'select'],
            ['Underlying','SPX', 'select'],
            ['Period','2024-01-01 → 2026-05-23','text'],
            ['Capital','$100,000','text'],
            ['Fees','0.30 / contract','text'],
            ['Slippage','0.5 ticks','text'],
            ['Margin','Reg-T','select'],
          ].map(([k,v])=>(
            <div key={k} className="field" style={{marginBottom:12}}>
              <span className="mono mute" style={{fontSize:11,letterSpacing:'.08em'}}>{k}</span>
              <input defaultValue={v}/>
            </div>
          ))}
          <button className="btn btn-primary btn-sm" onClick={()=>notify('Backtest refreshed with the current configuration.')} style={{width:'100%',justifyContent:'center',marginTop:8}}><Icon name="play" size={13}/> Run backtest</button>
        </div>
        <div className="panel" style={{padding:14}}>
          <div className="label" style={{marginBottom:10}}>KPIs</div>
          <table className="data" style={{border:'none'}}>
            <tbody>
              <tr><td className="symbol">Total Return</td><td className="num green">+18.42%</td></tr>
              <tr><td className="symbol">Annualized</td><td className="num green">+9.21%</td></tr>
              <tr><td className="symbol">Sharpe</td><td className="num">1.42</td></tr>
              <tr><td className="symbol">Sortino</td><td className="num">2.18</td></tr>
              <tr><td className="symbol">Max DD</td><td className="num red">-8.31%</td></tr>
              <tr><td className="symbol">Win Rate</td><td className="num">62.8%</td></tr>
              <tr><td className="symbol">Profit Factor</td><td className="num">1.81</td></tr>
              <tr><td className="symbol"># Trades</td><td className="num">142</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      {/* charts + trades */}
      <div className="col" style={{gap:14}}>
        <ChartFrame title="Equity curve" subtitle="Strategy P&L · USD" right={<><span className="mono mute" style={{fontSize:10.5}}>Init $100,000</span><span className="badge badge-green">+18,420 USD</span></>}>
          <LineChart width={820} height={260} series={[
            {name:'eq', color:'#FF2E45', data:equity, fillOpacity:0.1},
          ]}/>
        </ChartFrame>
        <ChartFrame title="Drawdown" subtitle="Underwater curve · %">
          <LineChart width={820} height={150} series={[{name:'dd', color:'#FFB020', data:dd, fillOpacity:0.15}]}/>
        </ChartFrame>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Trade log</div>
            <div className="row" style={{gap:8}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>copyText(trades.map((t)=>`${t.dt},${t.sym},${t.st},${t.qty},${t.pnl}`).join('\n'), 'Trade log copied as CSV.')}>Export CSV</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>notify('Trade log filtered to current strategy.')} >Filter</button>
            </div>
          </div>
          <table className="data">
            <thead><tr><th>Date</th><th>Symbol</th><th>Strategy</th><th className="num">Qty</th><th className="num">P&L</th><th>Result</th></tr></thead>
            <tbody>
              {trades.map((t,i)=>(
                <tr key={i}>
                  <td className="symbol">{t.dt}</td>
                  <td>{t.sym}</td>
                  <td>{t.st}</td>
                  <td className="num">{t.qty}</td>
                  <td className={"num "+(t.pnl>=0?'green':'red')}>{t.pnl>=0?'+':''}{t.pnl}</td>
                  <td><span className={"badge "+(t.win?'badge-green':'badge-red')}>{t.win?'WIN':'LOSS'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ScenariosPanel() {
  const presets = [
    {n:'Bullish drift', d:'Slow grind higher · σ=12%', pnl:+4280, sharpe:1.81, dd:-2.1, win:74},
    {n:'Bearish drift', d:'Trend reversal · σ=15%', pnl:-2120, sharpe:0.42, dd:-9.4, win:48},
    {n:'Vol spike', d:'+8 σ overnight', pnl:-6840, sharpe:-1.21, dd:-12.8, win:38},
    {n:'Vol crush', d:'Post-event collapse', pnl:+8312, sharpe:2.94, dd:-1.2, win:82},
    {n:'Time decay', d:'Sideways, 30d run', pnl:+1820, sharpe:1.62, dd:-0.8, win:71},
    {n:'Rate shock', d:'+100bp parallel', pnl:-1840, sharpe:-0.81, dd:-6.4, win:42},
  ];
  return (
    <div className="col" style={{gap:14}}>
      <div className="grid-3">
        {presets.map(p=>(
          <div key={p.n} className="panel" style={{padding:18}}>
            <div className="row between">
              <div className="mono" style={{fontWeight:700, fontSize:14}}>{p.n}</div>
              <span className={"badge "+(p.pnl>=0?'badge-green':'badge-red')}>{p.pnl>=0?'+':''}{p.pnl}</span>
            </div>
            <div className="mute" style={{fontSize:12,marginTop:6}}>{p.d}</div>
            <div className="grid-2" style={{gap:8,marginTop:14}}>
              {[['Sharpe',p.sharpe],['Max DD',p.dd+'%'],['Win',p.win+'%'],['P&L',p.pnl]].map(([k,v])=>(
                <div key={k} className="panel-2" style={{padding:'8px 10px'}}>
                  <div className="mono mute" style={{fontSize:10}}>{k}</div>
                  <div className="mono tnum" style={{fontSize:13,fontWeight:600,marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-sm" onClick={()=>notify(`${p.n} scenario queued.`)} style={{width:'100%',justifyContent:'center',marginTop:14}}>Run scenario</button>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Aggregate stress · Iron Condor SPX</div>
          <span className="badge">6 scenarios · 1000 paths each</span>
        </div>
        <table className="data">
          <thead><tr><th>Scenario</th><th className="num">P&L</th><th className="num">Mean Return</th><th className="num">Vol of P&L</th><th className="num">Sharpe</th><th className="num">Worst Path</th></tr></thead>
          <tbody>
            {presets.map(p=>(
              <tr key={p.n}>
                <td className="symbol">{p.n}</td>
                <td className={"num "+(p.pnl>=0?'green':'red')}>{p.pnl>=0?'+':''}{p.pnl}</td>
                <td className={"num "+(p.pnl>=0?'green':'red')}>{((p.pnl/100000)*100).toFixed(2)}%</td>
                <td className="num">{(Math.abs(p.pnl)/2400).toFixed(2)}%</td>
                <td className="num">{p.sharpe}</td>
                <td className="num red">{(p.dd*1.4).toFixed(2)}%</td>
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
  const strategies = [
    {n:'Iron Condor SPX', sharpe:1.42, pnl:+18420, win:62.8, dd:-8.3, runs:28},
    {n:'Bull Call NDX', sharpe:1.12, pnl:+12180, win:54.2, dd:-12.1, runs:14},
    {n:'Long Vol TSLA', sharpe:0.61, pnl:-3210, win:38.4, dd:-18.4, runs:9},
    {n:'Calendar NVDA', sharpe:2.18, pnl:+22100, win:71.2, dd:-4.1, runs:18},
    {n:'Short Strangle SPY', sharpe:1.61, pnl:+8210, win:68.4, dd:-9.8, runs:21},
  ];
  return (
    <div className="col" style={{gap:14}}>
      <div className="grid-4">
        {[
          {l:'Total P&L',v:'+57,700',c:'var(--green)'},
          {l:'Avg Sharpe',v:'1.39',c:'var(--text)'},
          {l:'Win Rate',v:'59.0%',c:'var(--text)'},
          {l:'Max DD (port)',v:'-12.8%',c:'var(--red)'},
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
          <button className="btn btn-primary btn-sm" onClick={()=>{setTab('output'); notify('Code executed against sample tests.')}}><Icon name="play" size={13}/> Run code</button>
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
            <div className="panel exercise-readable-panel" style={{padding:0}}>
              <div className="row between" style={{padding:'10px 14px',borderBottom:'1px solid var(--line)'}}>
                <div className="row" style={{gap:14}}>
                  <span className="badge">Python 3.11</span>
                  <span className="mono mute" style={{fontSize:11}}>exercise.py · unsaved</span>
                </div>
                <div className="row" style={{gap:6}}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>notify('Starter code restored.')}><Icon name="rotate-ccw" size={12}/> Reset</button>
                  <button className="btn btn-primary btn-sm" onClick={()=>{setTab('output'); notify('Code executed against sample tests.')}}><Icon name="play" size={12}/> Run</button>
                </div>
              </div>
              <pre className="code exercise-code"><code>{ex.starterCode}</code></pre>
            </div>
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
        right={<><span className="badge badge-red"><span className="dot dot-red"></span>LIVE · 38 players</span></>}
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
          <table className="data">
            <thead><tr><th>#</th><th>Player</th><th>Wave</th><th className="num">Score</th><th className="num">Streak</th><th className="num">Avg time</th><th>Country</th></tr></thead>
            <tbody>
              {[
                ['#1','@aurora_vol','Legendary',12421,89,'14.2s','FR'],
                ['#2','@gamma_god','Master',11820,72,'15.8s','UK'],
                ['#3','@quantfox','Master',11201,68,'16.1s','US'],
                ['#4','@nu_oresund','Master',10982,64,'16.5s','DK'],
                ['#5','@theta_burn','Expert',9418,52,'18.2s','DE'],
                ['#6','@vega_neutral','Expert',9112,48,'19.0s','SG'],
                ['#7','@itos_lemma','Expert',8941,46,'19.4s','JP'],
                ['#8','@strangle_kid','Expert',8512,42,'20.1s','BR'],
                ['#9','@cox_ross','Expert',8201,40,'20.4s','CA'],
                ['#10','@you','Advanced',4218,18,'22.4s','GR'],
              ].map(r=><tr key={r[1]} style={r[1]==='@you'?{color:'var(--red)'}:{}}>
                <td className="symbol">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td>
                <td className="num">{r[3].toLocaleString()}</td><td className="num">{r[4]}</td><td className="num">{r[5]}</td><td>{r[6]}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SurvivalWave({wave}) {
  const [timer, setTimer] = useState(28);
  const [progress, setProgress] = useState(7);
  const [lives, setLives] = useState(2);
  const [score, setScore] = useState(1842);
  const [selected, setSelected] = useState(null);
  const total = 20;
  const correct = 'C';
  const waveName = (wave || 'advanced').replace(/-/g,' ');
  const prettyWave = waveName.charAt(0).toUpperCase() + waveName.slice(1);
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
      setProgress((value)=>Math.min(total, value + 1));
      notify(`Correct. +${earned} pts.`);
    } else {
      setLives((value)=>Math.max(0, value - 1));
      notify('Wrong answer. One life removed.', 'warning');
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
              <div className="row between"><span className="mono mute" style={{fontSize:11}}>Streak</span><span className="mono" style={{fontSize:13,fontWeight:600}}>x7</span></div>
              <div className="row between"><span className="mono mute" style={{fontSize:11}}>Multiplier</span><span className="mono red" style={{fontSize:13,fontWeight:600}}>x2.4</span></div>
              <div className="row between"><span className="mono mute" style={{fontSize:11}}>Score</span><span className="mono" style={{fontSize:13,fontWeight:600}}>{score.toLocaleString()}</span></div>
              <div className="row between"><span className="mono mute" style={{fontSize:11}}>Rank live</span><span className="mono" style={{fontSize:13,fontWeight:600}}>#318</span></div>
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
  const sub = route.parts[1] || 'forum';
  const tabs = [['forum','Forum'],['projects','Projects'],['publications','Publications']];
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ community</span></>}
        title="Community"
        sub="Forums, shared notebooks, projects and peer-reviewed publications."
        right={<>
          <span className="badge"><span className="dot dot-green"></span>1,824 online</span>
          <button className="btn btn-primary btn-sm" onClick={()=>submitStub('Community post draft')}><Icon name="plus" size={13}/> New post</button>
        </>}
      />
      <div className="tabs-bar">
        {tabs.map(([k,l])=><Link key={k} to={"/community/"+k} className={"tab-btn "+(sub===k?'on':'')}>{l}</Link>)}
      </div>
      {sub==='forum' && <ForumPanel/>}
      {sub==='projects' && <ProjectsPanel/>}
      {sub==='publications' && <PublicationsPanel/>}
    </div>
  );
}

function ForumPanel() {
  const [mode,setMode] = useState('Latest');
  const [query,setQuery] = useState('');
  const topics = [
    {t:'[PINNED] Read first: forum guidelines & code of conduct', tag:'Meta', r:0, v:8721, l:412, pinned:true, hot:false},
    {t:'Heston calibration diverging on short maturities', tag:'Calibration', r:24, v:1218, l:48, hot:true},
    {t:'Closed-form vega for barriers — anyone tried Lipton?', tag:'Exotics', r:18, v:842, l:32},
    {t:'Negative IV from market call quotes — bid/ask filtering', tag:'Volatility', r:42, v:2418, l:118, hot:true},
    {t:'QuantLib 1.34 segfault on macOS arm64', tag:'Tooling', r:7, v:312, l:14},
    {t:'Best resource for SDE intuition?', tag:'Stochastic', r:38, v:1842, l:94},
    {t:'Smile fit: SVI vs SABR for equity indices', tag:'Volatility', r:21, v:1102, l:58},
    {t:'Variance swap PnL attribution — gamma vs vega', tag:'Vol Products', r:11, v:484, l:24},
    {t:'Antithetic vs Sobol for path-dependent payoffs', tag:'Monte Carlo', r:16, v:712, l:38},
  ];
  const displayed = topics
    .filter((topic) => {
      const match = `${topic.t} ${topic.tag}`.toLowerCase().includes(query.trim().toLowerCase());
      const modeMatch = mode === 'Unanswered' ? topic.r === 0 : true;
      return match && modeMatch;
    })
    .sort((a,b) => mode === 'Top week' ? b.l - a.l : Number(b.pinned) - Number(a.pinned));
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14}}>
      <div className="panel">
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="row" style={{gap:10}}>
            {['Latest','Top week','Unanswered'].map((t)=>(
              <button key={t} className="btn btn-ghost btn-sm" onClick={()=>setMode(t)} style={mode===t?{color:'var(--text)',background:'var(--panel-2)'}:{}}>{t}</button>
            ))}
          </div>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search forum…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'6px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:200}}/>
        </div>
        <table className="data">
          <thead><tr><th>Topic</th><th>Category</th><th className="num">Views</th><th className="num">Replies</th><th className="num">Likes</th></tr></thead>
          <tbody>
            {displayed.map((t,i)=>(
              <tr key={i}>
                <td>
                  <div className="row" style={{gap:10,alignItems:'center'}}>
                    {t.pinned && <Icon name="pin" size={11} style={{color:'var(--amber)'}}/>}
                    {t.hot && <span className="badge badge-red" style={{fontSize:9}}>HOT</span>}
                    <span style={{fontWeight: t.pinned?700:500, color: t.pinned?'var(--amber)':'var(--text)'}}>{t.t}</span>
                  </div>
                </td>
                <td><span className="badge">{t.tag}</span></td>
                <td className="num">{t.v.toLocaleString()}</td>
                <td className="num">{t.r}</td>
                <td className="num">{t.l}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
function BlogIndex() {
  const [tag,setTag] = useState('All');
  const [query,setQuery] = useState('');
  const categories = ['All','Options','Black-Scholes','Monte Carlo','Volatility','Quant Interview','Python'];
  const normalizedQuery = query.trim().toLowerCase();
  const matches = POSTS.filter((post) => {
    const inTag = tag === 'All' || post.tag === tag;
    const haystack = `${post.title} ${post.excerpt} ${post.tag} ${post.author}`.toLowerCase();
    return inTag && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const featured = matches[0] || POSTS[0];
  const cards = matches.filter((post) => post.id !== featured.id);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ blog</span></>}
        title="The Pricing Letter"
        sub="Long-form essays, deep dives and quant interview seeds — published weekly."
        right={<>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search posts…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
          <button className="btn btn-primary btn-sm" onClick={()=>submitStub('Blog subscription')}>Subscribe</button>
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

function PostDetail({slug}) {
  const p = POSTS.find(x=>x.id===slug) || POSTS[0];
  const [email,setEmail] = useState('');
  const [subscribed,setSubscribed] = useState(false);
  const subscribe = (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      notify('Enter a valid email address.', 'warning');
      return;
    }
    setSubscribed(true);
    setEmail('');
    notify('Subscription recorded.');
  };
  return (
    <div className="container page" style={{maxWidth:880}}>
      <div className="crumb" style={{marginTop:24}}><Link to="/blog">/ blog</Link><i>›</i><span>{p.tag.toLowerCase()}</span></div>
      <div className="row" style={{gap:10,marginTop:14,marginBottom:18}}>
        <span className="badge">{p.tag}</span>
        <span className="mono mute" style={{fontSize:11}}>{p.date} · {p.readTime} · {p.author}</span>
      </div>
      <h1 className="mono" style={{fontSize:38,fontWeight:700,lineHeight:1.15,margin:'0 0 18px'}}>{p.title}</h1>
      <p className="text-2" style={{fontSize:15,lineHeight:1.7,maxWidth:'62ch'}}>{p.excerpt}</p>
      <div style={{margin:'32px 0', borderTop:'1px solid var(--line)', borderBottom:'1px solid var(--line)', padding:'32px 0'}}>
        <p style={{fontSize:14.5,lineHeight:1.8, color:'var(--text-2)', maxWidth:'68ch'}}>
          Most introductions to the volatility surface stop at the smile. This is fine for an interview answer, but it leaves a lot on the table the moment you trade.
          In particular, vega — the sensitivity of an option's price to volatility — is rarely as flat across strikes as the textbook diagrams suggest.
        </p>
        <h3 className="mono" style={{fontSize:20,fontWeight:700,marginTop:36,marginBottom:12}}>1 · The closed-form expression</h3>
        <p style={{fontSize:14.5,lineHeight:1.8, color:'var(--text-2)',maxWidth:'68ch'}}>
          Recall that, under the Black-Scholes assumptions, vega is given by ν = S·e<sup>-qT</sup>·φ(d₁)·√T. The dependence on d₁ matters more than the textbook makes obvious — it is what makes vega largest at the money and decays as we move away in either direction.
        </p>
        <pre className="code" style={{margin:'24px 0', maxWidth:'68ch'}}><code>{`def vega(S, K, r, sigma, T, q=0):
    d1 = (log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*sqrt(T))
    return S * exp(-q*T) * norm.pdf(d1) * sqrt(T) / 100`}</code></pre>
        <p style={{fontSize:14.5,lineHeight:1.8, color:'var(--text-2)', maxWidth:'68ch'}}>
          On the surface, dividing by 100 is a convention so vega quotes "per vol point". This matters when you compare with traded products like variance swaps, where the convention is different again.
        </p>
        <h3 className="mono" style={{fontSize:20,fontWeight:700,marginTop:36,marginBottom:12}}>2 · Vega along the smile</h3>
        <ChartFrame title="Vega across strikes" subtitle="S=100, σ=20%, T=6m">
          <LineChart width={620} height={240} series={[{name:'vega', color:'#FF2E45', data: Array.from({length:60},(_,i)=>{
            const K = 60+i*1.4; const v = bsPrice({S:100,K,r:0.02,sigma:0.2,T:0.5,type:'call'}).vega; return {x:K,y:v};
          }), fillOpacity:0.1}]}/>
        </ChartFrame>
        <p style={{fontSize:14.5,lineHeight:1.8, color:'var(--text-2)', maxWidth:'68ch',marginTop:24}}>
          The bell-shape is symmetric only under flat vol. Once the smile bites, vega tilts: deep-OTM puts can carry vega per unit risk well above their ATM peers.
        </p>
      </div>
      <div className="panel" style={{padding:24,marginTop:32}}>
        <div className="row between" style={{marginBottom:14}}>
          <div className="label">The Pricing Letter</div>
          <span className="mono mute" style={{fontSize:11}}>1 / week · 14k subscribers</span>
        </div>
        <p className="text-2" style={{fontSize:13.5,marginTop:0}}>Long-form quant essays in your inbox, every Sunday. No spam, no upsells.</p>
        {subscribed && <FormNotice>You are on the next issue list.</FormNotice>}
        <form className="row" onSubmit={subscribe} style={{gap:8,marginTop:10}}>
          <input value={email} onChange={(event)=>setEmail(event.target.value)} placeholder="you@desk.com" style={{flex:1, background:'#0A0C10',border:'1px solid var(--line-2)',color:'var(--text)',padding:'8px 10px',borderRadius:3,fontFamily:"'JetBrains Mono',monospace",fontSize:12.5,outline:'none'}}/>
          <button className="btn btn-primary btn-sm" type="submit">Subscribe</button>
        </form>
      </div>
      <div style={{marginTop:32}}>
        <div className="label" style={{marginBottom:14}}>Related posts</div>
        <div className="grid-3">
          {POSTS.filter(x=>x.id!==p.id).slice(0,3).map(rp=>(
            <Link to={"/blog/"+rp.id} key={rp.id} className="panel" style={{padding:14,display:'block'}}>
              <span className="badge">{rp.tag}</span>
              <div className="mono" style={{fontWeight:700,marginTop:10}}>{rp.title}</div>
              <div className="mono mute" style={{fontSize:10.5,marginTop:6}}>{rp.date}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============= DASHBOARD =============
function DashboardPage() {
  const [tab,setTab] = useState('overview');
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ dashboard</span></>}
        title="Dashboard"
        sub="Your learning desk · progress, achievements, recent activity."
        right={<>
          <span className="badge"><span className="dot dot-green"></span>STUDENT</span>
          <Link to="/pricing" className="btn btn-primary btn-sm">Upgrade <Icon name="arrow-right" size={13}/></Link>
        </>}
      />
      <div className="tabs-bar">
        {[['overview','Overview'],['progress','Progress'],['quizzes','Quizzes'],['achievements','Achievements']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>
      {tab==='overview' && <DashOverview/>}
      {tab==='progress' && <DashProgress/>}
      {tab==='quizzes' && <DashQuizzes/>}
      {tab==='achievements' && <DashAchievements/>}
    </div>
  );
}
function DashOverview() {
  return (
    <>
      <div className="grid-4">
        <Stat label="Modules done" value="12 / 28" sub="42.8%"/>
        <Stat label="Learn time · 30d" value="48h 12m" sub="+18% wk"/>
        <Stat label="Quizzes passed" value="36 / 42" sub="85.7%"/>
        <Stat label="Badges" value="7" sub="Last: SVI Master"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:14,marginTop:18}}>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Continue learning</div>
            <Link to="/courses" className="btn btn-ghost btn-sm">All courses ›</Link>
          </div>
          {COURSES.slice(0,4).map((c,i)=>(
            <Link to={"/courses/"+c.id} key={c.id} style={{display:'flex',padding:14, borderTop:i?'1px solid var(--line)':'none',gap:14,alignItems:'center'}}>
              <div style={{width:48,height:48, border:'1px solid var(--line)', background:'#06080B',display:'grid',placeItems:'center'}}>
                <Icon name="book-open" size={18} style={{color:'var(--red)'}}/>
              </div>
              <div style={{flex:1}}>
                <div className="mono" style={{fontWeight:600}}>{c.title}</div>
                <div className="row" style={{gap:14,marginTop:4}}>
                  <span className="mono mute" style={{fontSize:11}}>{c.tier} · {c.duration}</span>
                  <span className="mono mute" style={{fontSize:11}}>{30+i*15}% complete</span>
                </div>
                <div style={{height:2,marginTop:6,background:'var(--line)'}}>
                  <div style={{height:'100%',width:(30+i*15)+'%',background:'var(--red)'}}></div>
                </div>
              </div>
              <Icon name="play" size={14} style={{color:'var(--red)'}}/>
            </Link>
          ))}
        </div>
        <div className="panel">
          <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
            <div className="label">Activity · 90d</div>
          </div>
          <div style={{padding:14}}>
            <ActivityHeatmap/>
            <div className="row between" style={{marginTop:14}}>
              <span className="mono mute" style={{fontSize:10.5}}>62 active days</span>
              <span className="mono mute" style={{fontSize:10.5}}>longest streak · 14d</span>
            </div>
          </div>
        </div>
      </div>
      <div className="panel" style={{padding:0,marginTop:14}}>
        <div className="row between" style={{padding:'12px 16px',borderBottom:'1px solid var(--line)'}}>
          <div className="label">Recent exercises</div>
          <Link to="/exercises" className="btn btn-ghost btn-sm">All exercises ›</Link>
        </div>
        <table className="data">
          <thead><tr><th>Exercise</th><th>Category</th><th>Level</th><th>Submitted</th><th className="num">Score</th><th>Status</th></tr></thead>
          <tbody>
            {EXERCISES.slice(0,6).map(e=>(
              <tr key={e.id}>
                <td className="symbol">{e.title}</td>
                <td>{e.cat}</td>
                <td>{e.level}</td>
                <td>{['2d','5d','1w','2w','3w','1mo'][EXERCISES.indexOf(e)%6]}</td>
                <td className={"num "+(e.done?'green':'mute')}>{e.done?'94/100':'-'}</td>
                <td>{e.done?<span className="badge badge-green">PASS</span>:<span className="badge">DRAFT</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function ActivityHeatmap() {
  const W = 14, H = 7;
  return (
    <svg viewBox={`0 0 ${W*14} ${H*14}`} width="100%" style={{display:'block'}}>
      {Array.from({length:W*H}).map((_,i)=>{
        const v = Math.random();
        const c = v>0.85?'#FF2E45':v>0.65?'#7B1B26':v>0.4?'#3A0E15':v>0.2?'#1F1216':'#11141A';
        return <rect key={i} x={(i%W)*14} y={Math.floor(i/W)*14} width="11" height="11" fill={c}/>;
      })}
    </svg>
  );
}
function DashProgress() {
  return (
    <div className="grid-3">
      {COURSES.map(c=>{
        const pct = Math.floor(20 + Math.random()*70);
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
            <div style={{height:3,background:'var(--line)'}}>
              <div style={{height:'100%',width:pct+'%',background:'var(--red)'}}></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function DashQuizzes() {
  const qs = ['Options Fundamentals','Pricing Models','Greeks','Volatility','Exotic Options','Trading Strategies'];
  return (
    <div className="grid-3">
      {qs.map((q,i)=>{
        const passed = i % 2 === 0;
        return (
        <div key={q} className="panel" style={{padding:18}}>
          <div className="row between" style={{marginBottom:12}}>
            <span className="badge">Quiz</span>
            <span className="mono mute" style={{fontSize:11}}>20 questions</span>
          </div>
          <div className="mono" style={{fontWeight:700,fontSize:14,marginBottom:10}}>{q}</div>
          <div className="row between" style={{marginTop:14}}>
            <span className="mono" style={{fontSize:12,color: passed?'var(--green)':'var(--amber)'}}>{passed?'PASSED ✓':'IN PROGRESS'}</span>
            <button className="btn btn-outline btn-sm" onClick={()=>notify(`${q} quiz opened.`)}>Take quiz</button>
          </div>
        </div>
        );
      })}
    </div>
  );
}
function DashAchievements() {
  const ach = [
    {n:'First Greek',d:'Computed your first delta',u:true,r:'common'},
    {n:'BS Master',d:'Black-Scholes course completed',u:true,r:'rare'},
    {n:'SVI Master',d:'Calibrated your first smile',u:true,r:'rare'},
    {n:'Hot Streak',d:'10 exercises in a row',u:true,r:'epic'},
    {n:'Pathfinder',d:'1M MC paths sampled',u:false,r:'epic'},
    {n:'Volatility King',d:'Top 5 on Vol leaderboard',u:false,r:'legendary'},
    {n:'Exotic Mind',d:'All Complex courses cleared',u:false,r:'legendary'},
    {n:'Marathon',d:'30-day streak',u:false,r:'epic'},
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
  const plans = [
    {name:'Starter', price:annual?7:9, save:annual?'-22%':null, desc:'For learners who want the core desk workflow, not scattered theory.',
     features:['All Fundamentals courses','Core calculators: BS, payoff, Monte Carlo','Starter AI exercise quota','Course scripts with LaTeX formulas','Community + weekly desk brief'],
     cta:'Start Starter', highlight:false},
    {name:'Student', price:annual?15:19, save:annual?'-21%':null, desc:'Most popular for active learners building real pricing reflexes.', popular:true,
     features:['Everything in Starter','All Advanced courses','Unlimited exercises + quizzes','Trading Lab access','Notebooks workspace','Source-backed RAG course scripts','Priority support'],
     cta:'Go Student', highlight:true},
    {name:'Professional', price:annual?39:49, save:annual?'-20%':null, desc:'For working quants, desk analysts and serious career transition.',
     features:['Everything in Student','All Complex courses','All 9 tools incl. PRO','API access','Backtest engine','Mentoring credits (2/mo)','Job board access'],
     cta:'Go Pro', highlight:false},
  ];
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
            <Link to="/auth/signup" className={"btn "+(p.highlight?'btn-primary':'btn-outline')} style={{width:'100%',justifyContent:'center',marginTop:24}}>{p.cta}</Link>
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
        await signUp(email, password, prenom || name.trim(), rest.join(' ') || '-');
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
function LeaderboardPage() {
  const [range,setRange] = useState('All-time');
  const rows = useMemo(() => Array.from({length:20},(_,i)=>({
    n:['aurora_vol','gamma_god','quantfox','nu_oresund','theta_burn','vega_neutral','itos_lemma','strangle_kid','cox_ross','heston_99','sigma_dev','vol_carrier','quant_falcon','marathon_q','black_box','wiener_w','kelly_bet','sharpe_x','tail_risk','iv_seer'][i],
    s:12421-i*341+Math.floor(Math.random()*40),
    w:i<3?'Legendary':i<8?'Master':i<14?'Expert':'Advanced',
    c:['FR','UK','US','DK','DE','SG','JP','BR','CA','GR','IN','CN','AU','NL','IE','SE','MX','CH','ES','IT'][i],
    bd:7-Math.floor(i/3),
  })), []);
  const factor = range === 'Week' ? 0.18 : range === 'Q2 2026' ? 0.62 : 1;
  const visibleRows = rows.map((row)=>({...row, s: Math.round(row.s * factor)})).sort((a,b)=>b.s-a.s);
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ leaderboard</span></>}
        title="Leaderboard"
        sub="Top performers across courses, exercises and Survival Mode."
        right={<>
          <div className="toggle">
            {['All-time','Q2 2026','Week'].map((item)=>(
              <button key={item} className={range===item?'on':''} onClick={()=>setRange(item)}>{item}</button>
            ))}
          </div>
        </>}
      />
      <div className="grid-3" style={{marginBottom:18}}>
        {visibleRows.slice(0,3).map((r,i)=>(
          <div key={r.n} className="panel" style={{padding:24, textAlign:'center', borderColor: i===0?'var(--amber)':'var(--line)'}}>
            <div className="mono mute" style={{fontSize:11,letterSpacing:'.14em'}}>#{i+1}</div>
            <div style={{width:60,height:60,border:'1px solid '+(i===0?'var(--amber)':'var(--line-2)'),borderRadius:30,display:'grid',placeItems:'center',margin:'14px auto',color:i===0?'var(--amber)':'var(--text-2)'}}>
              <Icon name={i===0?'crown':'medal'} size={24}/>
            </div>
            <div className="mono" style={{fontWeight:700,fontSize:16}}>@{r.n}</div>
            <div className="mono mute" style={{fontSize:11,marginTop:4}}>{r.w} · {r.c}</div>
            <div className="mono red" style={{fontSize:24,fontWeight:700,marginTop:14}}>{r.s.toLocaleString()}</div>
            <div className="mono mute" style={{fontSize:10.5,marginTop:4}}>points</div>
          </div>
        ))}
      </div>
      <div className="panel">
        <table className="data">
          <thead><tr><th>#</th><th>Player</th><th>Wave</th><th>Country</th><th className="num">Badges</th><th className="num">Score</th></tr></thead>
          <tbody>
            {visibleRows.map((r,i)=>(
              <tr key={r.n}>
                <td className="symbol">#{i+1}</td>
                <td>@{r.n}</td>
                <td>{r.w}</td>
                <td>{r.c}</td>
                <td className="num">{r.bd}</td>
                <td className="num">{r.s.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        <div className="panel">
          <div className="row between" style={{padding:'10px 14px',borderBottom:'1px solid var(--line)'}}>
            <div className="row" style={{gap:14}}>
              <span className="mono" style={{fontWeight:600,fontSize:12.5}}>black-scholes-intro.ipynb</span>
              <span className="badge badge-green">CONNECTED</span>
            </div>
            <div className="row" style={{gap:6}}>
              <button className="btn btn-ghost btn-sm" onClick={()=>handleSave('Notebook')}><Icon name="save" size={12}/> Save</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>handleShare('Notebook')}><Icon name="share" size={12}/> Share</button>
              <button className="btn btn-primary btn-sm" onClick={()=>notify('Notebook executed. Outputs are refreshed below.')}><Icon name="play" size={12}/> Run all</button>
            </div>
          </div>
          <div style={{padding:14}}>
            <div className="row" style={{gap:10,marginBottom:10}}>
              <span className="mono mute" style={{fontSize:11,width:40,textAlign:'right'}}>In [1]</span>
              <div className="panel-2" style={{flex:1, padding:'12px 14px'}}>
                <pre className="code" style={{padding:0,border:'none',background:'transparent'}}><code>{`from math import log, sqrt, exp
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    d1 = (log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*sqrt(T))
    d2 = d1 - sigma*sqrt(T)
    return S*norm.cdf(d1) - K*exp(-r*T)*norm.cdf(d2)`}</code></pre>
              </div>
            </div>
            <div className="row" style={{gap:10,marginBottom:10}}>
              <span className="mono mute" style={{fontSize:11,width:40,textAlign:'right'}}>In [2]</span>
              <div className="panel-2" style={{flex:1, padding:'12px 14px'}}>
                <pre className="code" style={{padding:0,border:'none',background:'transparent'}}><code>{`print(bs_call(100, 100, 0.02, 0.20, 0.5))`}</code></pre>
              </div>
            </div>
            <div className="row" style={{gap:10,marginBottom:10}}>
              <span className="mono mute" style={{fontSize:11,width:40,textAlign:'right'}}>Out [2]</span>
              <div className="panel-2" style={{flex:1, padding:'12px 14px'}}>
                <pre className="code mono" style={{padding:0,border:'none',background:'transparent',color:'var(--green)'}}><code>6.0401</code></pre>
              </div>
            </div>
            <div className="row" style={{gap:10}}>
              <span className="mono mute" style={{fontSize:11,width:40,textAlign:'right'}}>Out [3]</span>
              <div className="panel-2" style={{flex:1, padding:14}}>
                <LineChart width={600} height={200} series={[{name:'C',color:'#FF2E45',data:genCurve(50,(i,n)=>{
                  const S=50+i*100/n,K=100,r=.02,sigma=.2,T=.5;
                  const d1=(Math.log(S/K)+(r+.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
                  const d2=d1-sigma*Math.sqrt(T);
                  return S*normCdf(d1)-K*Math.exp(-r*T)*normCdf(d2);
                }),fillOpacity:0.08}]}/>
              </div>
            </div>
          </div>
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
  const [tab,setTab] = useState('all');
  const [query,setQuery] = useState('');
  const jobs = [
    {co:'Greenwich Capital', role:'Junior Quant - Vol Trading', loc:'Paris', t:'Full-time', s:'£90k-110k', tag:'Vol'},
    {co:'Helios Markets', role:'Derivatives Pricing Engineer', loc:'London', t:'Full-time', s:'£110k-140k', tag:'Pricing'},
    {co:'Nordic Risk', role:'Risk Quant Intern', loc:'Stockholm', t:'Intern', s:'£3k/mo', tag:'Risk'},
    {co:'Citadel-style fund', role:'Senior Quant Researcher', loc:'NY · Remote', t:'Remote', s:'$220k+', tag:'Research'},
    {co:'Bridgewater-like', role:'Equity Vol Researcher', loc:'Remote', t:'Remote', s:'$180k+', tag:'Vol'},
    {co:'Optiver-style', role:'Trader · Options Market Making', loc:'Amsterdam', t:'Full-time', s:'€90k+bonus', tag:'Trading'},
  ];
  const filtered = jobs.filter(j => {
    const inTab = tab==='all' || (tab==='remote' && j.t==='Remote') || (tab==='intern' && j.t==='Intern');
    const haystack = `${j.co} ${j.role} ${j.loc} ${j.t} ${j.tag}`.toLowerCase();
    return inTab && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  });
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ jobs</span></>}
        title="Quant Jobs"
        sub="Curated openings across pricing, risk, market making and research."
        right={<>
          <input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Role or keyword…" style={{background:'#0A0C10',border:'1px solid var(--line-2)',padding:'8px 10px',borderRadius:3,color:'var(--text)',fontFamily:"'JetBrains Mono',monospace",fontSize:12,width:220}}/>
          <button className="btn btn-primary btn-sm" onClick={()=>submitStub('Job posting draft')}><Icon name="plus" size={13}/> Post a job</button>
        </>}
      />
      <div className="tabs-bar">
        {[['all','All'],['remote','Remote'],['intern','Internship']].map(([k,l])=>(
          <button key={k} className={"tab-btn "+(tab===k?'on':'')} onClick={()=>setTab(k)}>{l} <span className="mute" style={{marginLeft:6}}>{k==='all'?jobs.length:jobs.filter(j=>(k==='remote'&&j.t==='Remote')||(k==='intern'&&j.t==='Intern')).length}</span></button>
        ))}
      </div>
      <div className="panel">
        <table className="data">
          <thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Type</th><th className="num">Salary</th><th></th></tr></thead>
          <tbody>
            {filtered.map((j,i)=>(
              <tr key={i}>
                <td className="symbol">{j.co}</td>
                <td>{j.role} <span className="badge" style={{marginLeft:8}}>{j.tag}</span></td>
                <td>{j.loc}</td>
                <td>{j.t}</td>
                <td className="num">{j.s}</td>
                <td><button className="btn btn-outline btn-sm" onClick={()=>submitStub(`Application for ${j.role}`)}>Apply</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BugReportPage() {
  const [sent, setSent] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    setSent(true);
    notify('Bug report queued.');
  };
  return (
    <div className="container page" style={{maxWidth:680}}>
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ report a bug</span></>}
        title="Report a bug"
        sub="Help us harden the platform."
      />
      <div className="panel" style={{padding:32}}>
        <form className="col" style={{gap:16}} onSubmit={submit}>
          <FormNotice>{sent && 'Report captured. In production this can be sent to GitHub Issues, Supabase, or your support inbox.'}</FormNotice>
          {[
            ['Category',['select','Calculator','Lesson','UI','Account','Other']],
            ['Priority',['select','Low','Medium','High','Critical']],
            ['Title','text'],
            ['Steps to reproduce','area'],
            ['Expected behaviour','area'],
            ['Actual behaviour','area'],
          ].map(([l,t])=>(
            <div key={l} className="field">
              <span className="mono mute" style={{fontSize:10.5,letterSpacing:'.1em'}}>{l}</span>
              {Array.isArray(t) ? <select>{t.slice(1).map(o=><option key={o}>{o}</option>)}</select> :
               t==='area' ? <textarea rows={3}></textarea> :
               <input placeholder=""/>}
            </div>
          ))}
          <button className="btn btn-primary" type="submit" style={{width:'100%',justifyContent:'center',marginTop:8}}>Submit report <Icon name="send" size={13}/></button>
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
  return (
    <div className="container page">
      <PageHead
        crumb={<><Link to="/">/ home</Link><i>›</i><span>/ admin</span></>}
        title={<>Admin Dashboard <span className="badge badge-red" style={{marginLeft:12,fontSize:9}}>RESTRICTED</span></>}
        sub="Platform operations · users, content, infrastructure."
      />
      <div className="grid-4">
        {[
          {l:'Users',v:'14,218', c:''},
          {l:'Active 30d',v:'4,812', c:''},
          {l:'Paying',v:'1,841', c:'var(--green)'},
          {l:'Churn 30d',v:'2.4%', c:'var(--red)'},
          {l:'Revenue MRR',v:'$84,210', c:'var(--green)'},
          {l:'DB size',v:'214 GB', c:''},
          {l:'Errors 24h',v:'18', c:'var(--amber)'},
          {l:'API calls 24h',v:'1.21M', c:''},
        ].map(s=><Stat key={s.l} label={s.l} value={s.v} accent={s.c}/>)}
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
          {t:'Exercises',d:'Notebook-style coding tasks with grading.',ic:'code',to:'/exercises',n:'52 exercises'},
          {t:'Quizzes',d:'Multiple choice — quick check on theory.',ic:'help-circle',to:'/dashboard',n:'6 categories'},
          {t:'Survival Mode',d:'Pressure-tested questions. Timer running.',ic:'zap',to:'/survival',n:'6 waves'},
          {t:'Weekly Challenge',d:'New problem every Sunday. Leaderboard.',ic:'trophy',to:'/challenge',n:'this week · DOC barrier'},
          {t:'Leaderboard',d:'Where you stand. Global and by topic.',ic:'crown',to:'/leaderboard',n:'1,824 players'},
          {t:'Pair Programming',d:'Live pair sessions with other learners.',ic:'users',to:'/community',n:'live · 18 rooms'},
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
        sub="Submit by Sunday 23:59 UTC. Top 3 get XP, badge, and a feature in the newsletter."
        right={<><span className="badge badge-red">CLOSES 4d 12h</span></>}
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
// Main App and router
function App() {
  const route = useHashRoute();
  const path = route.path;

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
      <ChatFab/>
      <ToastStack/>
    </div>
  );
}

export default App;


