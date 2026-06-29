// Loader for the real farmed market history sliced into a static bundle
// (public/market-data/desk-series.json). Lets course mini-widgets show genuine
// price / vol / rates history with NO backend running. Degrades gracefully to an
// empty bundle if the file is missing.

let _cache = null;
let _promise = null;

export function loadDeskSeries() {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch('/market-data/desk-series.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { _cache = j && j.series ? j : { series: {} }; return _cache; })
    .catch(() => ({ series: {} }));
  return _promise;
}

// Alias common tool symbols to a bundled series (offline fallback for price_chart).
export const SYMBOL_ALIAS = {
  AAPL: 'SPX', SPX: 'SPX', '^GSPC': 'SPX', SP500: 'SPX',
  VIX: 'VIX', '^VIX': 'VIX',
  EURUSD: 'EURUSD', 'EURUSD=X': 'EURUSD',
  BTC: 'BTCUSD', 'BTC-USD': 'BTCUSD', BTCUSD: 'BTCUSD',
  STOXX50E: 'STOXX50E', '^STOXX50E': 'STOXX50E',
  DGS10: 'UST10Y', UST10Y: 'UST10Y', DGS2: 'UST2Y', UST2Y: 'UST2Y',
  WTI: 'WTI', 'CL=F': 'WTI', DCOILWTICO: 'WTI',
  BRENT: 'BRENT', 'BZ=F': 'BRENT', DCOILBRENTEU: 'BRENT',
};

// Per-course-script choice: a primary series for the line chart and an optional
// secondary series shown as a sparkline, plus a desk-relevant read.
const COURSE_SERIES = {
  'vanilla-options-quote':          { primary: 'SPX',      secondary: 'SPX_RVOL21', tone: 'blue',  read: "Le spot et la vol realisee sont les deux inputs vivants du ticket d'option." },
  'options-book-greeks-pnl':        { primary: 'SPX',      secondary: 'VIX',        tone: 'blue',  read: "Le gamma du book transforme les mouvements du S&P en P&L; le VIX situe le regime de vol." },
  'monte-carlo-pricing':            { primary: 'SPX',      secondary: 'SPX_RVOL21', tone: 'blue',  read: "La GBM simulee doit reproduire la vol realisee observee sur le sous-jacent." },
  'implied-volatility-smile':       { primary: 'VIX',      secondary: 'SPX_RVOL21', tone: 'amber', read: "Vol implicite (VIX) vs vol realisee: l'ecart est la prime de risque de variance cotee." },
  'stochastic-calculus-for-hedging':{ primary: 'SPX',      secondary: 'SPX_RVOL21', tone: 'blue',  read: "La couverture dynamique vit dans ces trajectoires: drift ignore, variance facturee." },
  'barrier-options-gap-risk':       { primary: 'EURUSD',   secondary: 'VIX',        tone: 'blue',  read: "Sur une barriere FX, chaque approche du niveau EUR/USD reactive le risque de gap." },
  'structured-products-autocall':   { primary: 'STOXX50E', secondary: 'VIX',        tone: 'blue',  read: "L'autocall sur Euro Stoxx 50 rappelle quand l'indice franchit la barriere a la hausse." },
  'rates-swaps-dv01':               { primary: 'UST10Y',   secondary: 'UST2Y',      tone: 'green', read: "Le par swap suit la courbe: 10Y et 2Y donnent niveau et pente du risque de taux." },
  'yield-curve-bootstrapping':      { primary: 'UST10Y',   secondary: 'T10Y2Y',     tone: 'green', read: "La pente 10Y-2Y est l'objet bootstrappe: forwards et discount factors en derivent." },
  'fixed-income-bonds-duration':    { primary: 'UST10Y',   secondary: 'UST2Y',      tone: 'green', read: "Duration x variation de yield 10Y = P&L de l'obligation: la sensibilite se lit ici." },
  'credit-derivatives-cds':         { primary: 'BAA10Y',   secondary: 'UST10Y',     tone: 'red',   read: "Le spread Baa-10Y est le proxy macro du risque de credit que le CDS isole nom par nom." },
  'market-risk-var-stress':         { primary: 'SPX',      secondary: 'VIX',        tone: 'amber', read: "La VaR se nourrit de ces rendements; les pics de VIX marquent les regimes a stresser." },
};

export function pickCourseSeries(slug) {
  return COURSE_SERIES[slug] || null;
}
