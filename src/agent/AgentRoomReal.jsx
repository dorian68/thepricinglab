// Agent Room — REAL, backend-wired RFQ Cockpit (iteration 1).
//
// Replaces the static design-kit iframe (public/agent-room-kit/.../index.html)
// with a real React page in the app build. The flagship "RFQ Cockpit" turns a
// natural-language request into:
//   - a Sales/Structurer interpretation (deterministic parse — same logic the
//     backend uses; labelled honestly),
//   - the live multi-agent desk result from POST /agent/desk/run (real agents,
//     real pricer), with an honest "backend requis" state when unreachable,
//   - Structurer product approaches (Call / Spread / Collar / Future /
//     Structured Note) with REAL mini payoff curves + Black-Scholes prices
//     computed on REAL market data,
//   - a Market Context panel (real /market/history with desk-series.json
//     offline fallback) and a bottom market-watch ticker (real bundled values).
//
// No CDN/Babel. Uses the app's CSS tokens / JetBrains Mono dark-desk aesthetic.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { platformApi, getPracticeApiBase } from '../claude/practiceEngine';
import { loadDeskSeries } from '../claude/marketSeries';

/* ------------------------------------------------------------------ tokens */
const T = {
  bg: '#070A0F', panel: '#0C1118', panel2: '#0A0F15', inset: '#0A0E14',
  line: '#171F2B', line2: '#222C3A', red: '#F23645', redDim: '#7d1f29',
  green: '#2FBF71', text: '#E6EAF1', mute: '#6F7B8C', dim: '#47525f',
  amber: '#E8B339', blue: '#4C7DFF', purple: '#A974FF',
};
const MONO = "'JetBrains Mono','SF Mono',ui-monospace,monospace";

function Icon({ name, size = 14, color, style }) {
  return <i className={`icon icon-${name}`} style={{ fontSize: size, lineHeight: 1, color, ...style }} />;
}

/* ------------------------------------------------------------ real pricing */
function normCdf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}
// Genuine Black-Scholes (same formula as the app's ClaudeFrontend bsPrice).
function bsPrice({ S, K, r, q = 0, sigma, T: tt, type = 'call' }) {
  if (tt <= 0 || sigma <= 0) {
    const intr = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
    return { price: intr, delta: 0, vega: 0 };
  }
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * tt) / (sigma * Math.sqrt(tt));
  const d2 = d1 - sigma * Math.sqrt(tt);
  const eqT = Math.exp(-q * tt), erT = Math.exp(-r * tt);
  let price, delta;
  if (type === 'call') { price = S * eqT * normCdf(d1) - K * erT * normCdf(d2); delta = eqT * normCdf(d1); }
  else { price = K * erT * normCdf(-d2) - S * eqT * normCdf(-d1); delta = eqT * (normCdf(d1) - 1); }
  return { price, delta, d1, d2 };
}

const fmt = (n, d = 2) => (isFinite(n) ? Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—');
const eur0 = (n) => (isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—');

// Black-76 on a forward RATE (caps/floors/swaptions). Returns a value in the
// SAME units as the rate (decimal), NOT a discounted cash price — multiply by
// the annuity × notional to get the premium. NEVER lognormal-BS the yield level.
function black76Rate(f, K, sigma, T, type = 'call') {
  if (T <= 0 || sigma <= 0 || f <= 0) return type === 'call' ? Math.max(f - K, 0) : Math.max(K - f, 0);
  const d1 = (Math.log(f / K) + 0.5 * sigma * sigma * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return type === 'call' ? f * normCdf(d1) - K * normCdf(d2) : K * normCdf(-d2) - f * normCdf(-d1);
}
// Black-76 on a forward PRICE (commodity options on futures): discounted cash
// premium. Same lognormal model as the desk's "Black-76 (lognormal futures)" —
// equals BS with the spot replaced by the forward F = S·e^{rT}, then PV'd.
function black76Price({ F, K, r, sigma, T: tt, type = 'call' }) {
  if (tt <= 0 || sigma <= 0) {
    const intr = type === 'call' ? Math.max(F - K, 0) : Math.max(K - F, 0);
    return Math.exp(-r * tt) * intr;
  }
  const d1 = (Math.log(F / K) + 0.5 * sigma * sigma * tt) / (sigma * Math.sqrt(tt));
  const d2 = d1 - sigma * Math.sqrt(tt);
  const erT = Math.exp(-r * tt);
  return type === 'call' ? erT * (F * normCdf(d1) - K * normCdf(d2)) : erT * (K * normCdf(-d2) - F * normCdf(-d1));
}
// Back out the lognormal-futures (Black-76) implied vol that reproduces a quoted
// premium — the inverse of black76Price. Bisection on sigma in [0.001, 5.0]
// (~60 iters, monotone in sigma). Returns null when the price is below intrinsic
// or richer than the 500%-vol cap (no solution) so the caller can fall back.
function black76ImpliedVol({ F, K, r, T: tt, price, type = 'call' }) {
  if (!(price > 0) || !(F > 0) || !(K > 0) || !(tt > 0)) return null;
  const intrinsic = Math.exp(-r * tt) * (type === 'call' ? Math.max(F - K, 0) : Math.max(K - F, 0));
  if (price <= intrinsic + 1e-9) return null;
  let lo = 0.001, hi = 5.0;
  if (black76Price({ F, K, r, sigma: hi, T: tt, type }) < price) return null;
  for (let i = 0; i < 60; i++) {
    const m = 0.5 * (lo + hi);
    if (black76Price({ F, K, r, sigma: m, T: tt, type }) < price) lo = m; else hi = m;
  }
  return 0.5 * (lo + hi);
}
// Same inversion for Black-Scholes / Garman–Kohlhagen (equity / FX): q = 0 for
// equity/crypto, q = foreign rate for FX. Mirrors how optionApproaches prices
// those classes (bsPrice on the spot), so the recovered vol is self-consistent.
function bsImpliedVol({ S, K, r, q = 0, T: tt, price, type = 'call' }) {
  if (!(price > 0) || !(S > 0) || !(K > 0) || !(tt > 0)) return null;
  const intrinsic = type === 'call'
    ? Math.max(S * Math.exp(-q * tt) - K * Math.exp(-r * tt), 0)
    : Math.max(K * Math.exp(-r * tt) - S * Math.exp(-q * tt), 0);
  if (price <= intrinsic + 1e-9) return null;
  let lo = 0.001, hi = 5.0;
  if (bsPrice({ S, K, r, q, sigma: hi, T: tt, type }).price < price) return null;
  for (let i = 0; i < 60; i++) {
    const m = 0.5 * (lo + hi);
    if (bsPrice({ S, K, r, q, sigma: m, T: tt, type }).price < price) lo = m; else hi = m;
  }
  return 0.5 * (lo + hi);
}
// Continuous annuity (PV of 1 unit/yr) at yield y over T years — drives DV01/CS01.
function annuityFactor(y, T) { return y > 1e-9 ? (1 - Math.exp(-y * T)) / y : T; }

// One-time probe: does this backend expose the /market data API at all? The
// stateless desk build ships without it, so we must NOT spam /market/history
// 404s per factor switch. Probe /market/providers once, cache the answer, and
// only attempt the live history upgrade when the API is genuinely present.
let _marketCap = null, _marketProbe = null;
function marketApiAvailable(base) {
  if (_marketCap != null) return Promise.resolve(_marketCap);
  if (_marketProbe) return _marketProbe;
  // Probe via /openapi.json (200) instead of hitting a market route blindly, so
  // a backend without the market API produces ZERO 404s in the console.
  _marketProbe = fetch(`${base}/openapi.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      _marketCap = !!(d && d.paths && Object.keys(d.paths).some((p) => p.startsWith('/market/history')));
      return _marketCap;
    })
    .catch(() => { _marketCap = false; return false; });
  return _marketProbe;
}

/* ------------------------------------------------ deterministic NL parsing */
// Mirrors pricinglibrary_rag/desk.py:parse_request — the backend itself derives
// these fields deterministically (not via an LLM), so showing them offline is
// honest, not a fake "agent" result.
function parseRequest(text) {
  const t = (text || '').toLowerCase();
  let underlying = 'Crude Oil (WTI)', factor = 'oil';
  if (/\bbtc\b|bitcoin|\beth\b|ether|crypto|deribit/.test(t)) { underlying = /\beth\b|ether/.test(t) ? 'Ethereum (ETH)' : 'Bitcoin (BTC)'; factor = 'crypto'; }
  else if (/p[ée]trole|oil|wti|brent|crude|baril/.test(t)) { underlying = 'Crude Oil (WTI)'; factor = 'oil'; }
  else if (/inflation|cpi/.test(t)) { underlying = 'Inflation (CPI)'; factor = 'inflation'; }
  else if (/credit|spread|cds|d[ée]faut|default/.test(t)) { underlying = 'Credit Spreads'; factor = 'credit'; }
  else if (/taux|rate|rates|bond|obligation|swap|coupon|callable/.test(t)) { underlying = 'US Rates (10Y)'; factor = 'rates'; }
  else if (/\bgold\b|\bor\b|once/.test(t)) { underlying = 'Gold'; factor = 'gold'; }
  else if (/eur|usd|fx|change|devise|dollar/.test(t)) { underlying = 'EUR/USD'; factor = 'fx'; }
  else { underlying = 'S&P 500'; factor = 'equity'; }
  const mM = t.match(/(\d+)\s*(mois|month)/), mY = t.match(/(\d+)\s*(ans?|years?)/);
  const months = mM ? +mM[1] : mY ? +mY[1] * 12 : 5;
  const horizon = mM ? `${mM[1]} Months` : mY ? `${mY[1]} Years` : '5 Months';
  let view = 'Price increase';
  if (/baiss|fall|down|drop|decreas|chut|recul/.test(t)) view = 'Price decrease';
  else if (/stable|sideways|range|flat|inchang|stagn/.test(t)) view = 'Range / stable';
  let intention = 'Hedge / Express a view';
  if (/explain|comprendre|understand|what is|c'est quoi|apprendre|fonctionne/.test(t)) intention = 'Learn a concept';
  else if (/price|pricer|quote|cote|combien|valoris/.test(t)) intention = 'Price a product';
  else if (/hedge|couvr|prot[ée]g|peur|afraid|worried|inqui[eè]t/.test(t)) intention = 'Hedge / Express a view';
  return { underlying, factor, horizon, months, view, intention, objective: 'Protection / Opportunity' };
}

/* --------------------------------------------- market-context per factor */
// api: live symbol for /market/history; bundled: key in desk-series.json
// (offline real fallback); refSpot/vol: clearly-labelled reference when no real
// series is available offline (e.g. oil/gold are not in the bundled slice).
const FACTOR_CTX = {
  oil: { api: 'WTI', bundled: 'WTI', label: 'Crude Oil (WTI)', unit: 'USD/bbl', refSpot: null, vol: 0.30 },
  gold: { api: 'GC=F', bundled: null, label: 'Gold', unit: 'USD/oz', refSpot: 2640, vol: 0.16 },
  fx: { api: 'EURUSD=X', bundled: 'EURUSD', label: 'EUR/USD', unit: '', refSpot: 1.08, vol: 0.08 },
  rates: { api: '^TNX', bundled: 'UST10Y', label: 'US 10Y Yield', unit: '%', refSpot: 4.4, vol: 0.20 },
  inflation: { api: '^TNX', bundled: 'UST10Y', label: 'US 10Y (proxy infl.)', unit: '%', refSpot: 4.4, vol: 0.20 },
  credit: { api: 'BAA10Y', bundled: 'BAA10Y', label: 'Baa–10Y spread', unit: '%', refSpot: 1.54, vol: 0.25 },
  crypto: { api: 'BTC-USD', bundled: 'BTCUSD', label: 'BTC / USD', unit: 'USD', refSpot: 60040, vol: 0.55 },
  equity: { api: '^GSPC', bundled: 'SPX', label: 'S&P 500', unit: '', refSpot: 7354, vol: 0.16 },
};

/* ----------------------------------------- structurer approaches (real) */
// Honest model label per asset class (the badge must NOT claim "BS" off-equity).
function modelLabel(factor) {
  if (factor === 'rates' || factor === 'inflation') return 'Structurer · DV01 / Black-76';
  if (factor === 'credit') return 'Structurer · CS01 / hazard-rate';
  if (factor === 'fx') return 'Structurer · Garman–Kohlhagen';
  if (factor === 'oil' || factor === 'gold') return 'Structurer · Black-76 (forward)';
  return 'Structurer · Black-Scholes';
}

// Asset-class-aware dispatcher. The BEST card is the SAME product the desk
// recommends for this factor+view (Payer Swap for rising rates, Buy CDS
// Protection for widening credit, …) so the headline never contradicts the
// desk quote shown below. Each class uses the RIGHT model + units.
function buildApproaches({ spot, vol, r, T: tt, view, unit, factor, deskRecon }) {
  if (factor === 'rates' || factor === 'inflation') return ratesApproaches({ spot, vol, T: tt, view });
  if (factor === 'credit') return creditApproaches({ spot, T: tt, view });
  if (factor === 'fx') return optionApproaches({ spot, vol, r, q: 0.03, T: tt, view, unit, deskRecon }); // GK: q = foreign (EUR) rate
  return optionApproaches({ spot, vol, r, q: 0, T: tt, view, unit, deskRecon, commodity: factor === 'oil' || factor === 'gold' }); // equity / crypto = BS ; oil / gold = Black-76 on forward
}

/* ---- RATES: swap (DV01) + cap/floor & swaption (Black-76), premia in bp ---- */
function ratesApproaches({ spot, vol, T: tt, view }) {
  const N = 1_000_000;             // 1mm notional
  const y = spot / 100;            // current par/forward rate (decimal); spot is a yield level in %
  const A = annuityFactor(y, tt);  // annuity (PV of fixed leg)
  const dv01 = A * N * 1e-4;       // EUR per 1bp parallel shift
  const down = view === 'Price decrease';
  const sign = down ? -1 : 1;      // payer (rates up) = +1, receiver (rates down) = -1
  const o = down ? 'put' : 'call';
  const swapName = down ? 'Receiver Swap' : 'Payer Swap';   // == desk product_spec.type
  const swName = down ? 'Receiver Swaption' : 'Payer Swaption';
  const capName = down ? 'Floor' : 'Cap';
  // MtM ≈ (s_mkt − s_fixed)·A·N — linear in the rate, NOT S·e^{rT}.
  const swapPay = (s) => sign * ((s / 100) - y) * A * N;

  // Cap/Floor: Black-76 strip ≈ annuity × ATM caplet rate-value; premium in bp of notional.
  const capRate = black76Rate(y, y, vol, tt, o);
  const capFrac = A * capRate, capBp = capFrac * 1e4, capCash = capFrac * N;
  const capBE = (y + sign * capRate) * 100;
  const capPay = (s) => Math.max(sign * ((s / 100) - y), 0) * A * N - capCash;

  // Swaption: option (expiry ≈ T/2) to enter the swap — Black-76, premium in bp.
  const swExp = Math.max(tt / 2, 1 / 12);
  const swRate = black76Rate(y, y, vol, swExp, o);
  const swFrac = A * swRate, swBp = swFrac * 1e4, swCash = swFrac * N;
  const swBE = (y + sign * swRate) * 100;
  const swPay = (s) => Math.max(sign * ((s / 100) - y), 0) * A * N - swCash;

  return [
    { name: swapName, kind: 'swap', tag: 'TAUX · DV01', best: true,
      desc: down ? 'Reçoit fixe / paie flottant : gagne si les taux baissent. P&L ≈ DV01 × Δtaux.'
                 : 'Paie fixe / reçoit flottant : gagne si les taux montent. P&L ≈ DV01 × Δtaux.',
      price: '0 (par)', breakeven: `${fmt(spot, 2)}% (par)`, maxLoss: 'linéaire (DV01)', maxProfit: 'linéaire (DV01)',
      pay: swapPay,
      metrics: [['Prime', '0 (par)'], ['DV01', `${eur0(dv01)} $/bp`], ['Taux par', `${fmt(spot, 2)}%`], ['Notionnel', `${eur0(N)} $`]] },
    { name: capName, kind: 'cap', tag: 'OPTION TAUX',
      desc: down ? 'Floor : plancher de taux, protège la baisse et garde la hausse. Prime en bp de notionnel (Black-76).'
                 : 'Cap : plafond de taux, protège la hausse et garde la baisse. Prime en bp de notionnel (Black-76).',
      price: `${capBp.toFixed(0)} bp`, breakeven: `${fmt(capBE, 2)}%`, maxLoss: `${capBp.toFixed(0)} bp (prime)`, maxProfit: 'linéaire (DV01)',
      pay: capPay,
      metrics: [['Prime', `${capBp.toFixed(0)} bp`], ['Prime $', `${eur0(capCash)} $`], ['Break-even', `${fmt(capBE, 2)}%`], ['Perte max', `${capBp.toFixed(0)} bp`]] },
    { name: swName, kind: 'swaption', tag: 'OPTION SWAP',
      desc: `Droit (non obligation) d'entrer dans le ${swapName.toLowerCase()} ; expiry ≈ ${swExp.toFixed(2)}a. Prime Black-76 en bp.`,
      price: `${swBp.toFixed(0)} bp`, breakeven: `${fmt(swBE, 2)}%`, maxLoss: `${swBp.toFixed(0)} bp (prime)`, maxProfit: 'linéaire (DV01)',
      pay: swPay,
      metrics: [['Prime', `${swBp.toFixed(0)} bp`], ['Prime $', `${eur0(swCash)} $`], ['Break-even', `${fmt(swBE, 2)}%`], ['Expiry', `${swExp.toFixed(2)}a`]] },
  ];
}

/* ---- CREDIT: CDS protection — premium = spread (bp), risk = CS01 / JTD ---- */
function creditApproaches({ spot, T: tt, view }) {
  const N = 1_000_000, R = 0.40, A = 4.2;   // risky annuity ≈ 4.2 (5y IG), recovery 40%
  const sDec = spot / 100;                   // spread (decimal); spot is a spread level in %
  const bp = spot * 100;                     // spread in bp
  const cs01 = A * N * 1e-4;                 // EUR per 1bp of spread
  const jtd = (1 - R) * N;                   // jump-to-default = (1−R)·N
  const carry = sDec * tt * N;               // premium paid/received over T
  const down = view === 'Price decrease';    // tightening view → sell protection is best
  const buyPay = (s) => ((s / 100) - sDec) * A * N - carry;            // long protection: gains on widening
  const sellPay = (s) => -(((s / 100) - sDec) * A * N) + carry;        // short protection: earns carry
  const buy = {
    name: 'Buy CDS Protection', kind: 'cds', tag: 'CRÉDIT · CS01', best: !down,
    desc: "Achète la protection : paie le spread, gagne si le spread s'écarte ou en cas de défaut.",
    price: `${bp.toFixed(0)} bp p.a.`, breakeven: 'écartement du spread', maxLoss: `${fmt(spot * tt, 2)}% (portage)`, maxProfit: `JTD ${eur0(jtd)} €`,
    pay: buyPay,
    metrics: [['Prime (spread)', `${bp.toFixed(0)} bp`], ['CS01', `${eur0(cs01)} €/bp`], ['JTD (1−R)·N', `${eur0(jtd)} €`], ['Portage', `${fmt(spot * tt, 2)}%`]] };
  const sell = {
    name: 'Sell CDS Protection', kind: 'cds', tag: 'CRÉDIT · PORTAGE', best: down,
    desc: "Vend la protection : encaisse le spread (portage), perd si le spread s'écarte / défaut.",
    price: `${bp.toFixed(0)} bp p.a.`, breakeven: 'resserrement du spread', maxLoss: `JTD ${eur0(jtd)} €`, maxProfit: `${fmt(spot * tt, 2)}% (portage)`,
    pay: sellPay,
    metrics: [['Prime (spread)', `${bp.toFixed(0)} bp`], ['CS01', `${eur0(cs01)} €/bp`], ['JTD (1−R)·N', `-${eur0(jtd)} €`], ['Portage', `+${fmt(spot * tt, 2)}%`]] };
  const index = {
    name: 'CDS Index (iTraxx/CDX)', kind: 'cds', tag: 'CRÉDIT · MACRO',
    desc: 'Protection via indice CDS : couverture macro diversifiée ; attention à la base single-name vs indice.',
    price: `${bp.toFixed(0)} bp p.a.`, breakeven: "écartement de l'indice", maxLoss: `${fmt(spot * tt, 2)}% (portage)`, maxProfit: 'écartement',
    pay: buyPay,
    metrics: [['Prime (spread)', `${bp.toFixed(0)} bp`], ['CS01', `${eur0(cs01)} €/bp`], ['Base', 'single vs indice'], ['Portage', `${fmt(spot * tt, 2)}%`]] };
  return down ? [sell, index, buy] : [buy, index, sell];
}

/* ---- EQUITY / COMMODITY / CRYPTO / FX: Black-Scholes (q=carry; FX→GK) ---- */
function optionApproaches({ spot, vol, r, q = 0, T: tt, view, unit, deskRecon, commodity = false }) {
  const S = spot;
  const down = view === 'Price decrease';
  const fwd = S * Math.exp((r - q) * tt);
  // Commodity options trade on the future: price the illustrative alternatives in
  // Black-76 on the forward F (== the desk's lognormal-futures model), and anchor
  // their strikes/moneyness to F so the "Black-76 (forward)" label is literally true.
  const call = commodity
    ? (K) => black76Price({ F: fwd, K, r, sigma: vol, T: tt, type: 'call' })
    : (K) => bsPrice({ S, K, r, q, sigma: vol, T: tt, type: 'call' }).price;
  const put = commodity
    ? (K) => black76Price({ F: fwd, K, r, sigma: vol, T: tt, type: 'put' })
    : (K) => bsPrice({ S, K, r, q, sigma: vol, T: tt, type: 'put' }).price;
  const anchor = commodity ? fwd : S;   // moneyness reference (forward for commodities)
  const Katm = anchor, Kup = anchor * 1.10, Kdn = anchor * 0.90, Knear = anchor * 1.05, Kfar = anchor * 0.95;
  const px = (v) => `${fmt(v, S < 10 ? 4 : 2)}${unit ? ' ' + unit : ''}`;

  // RECONCILE the BEST (directional) card with the desk quote: when a desk run
  // exists for an option product, the headline uses the desk's OWN strike and
  // its EXACT quoted premium (== desk MID) so the two pricers never disagree.
  // Alternatives stay illustrative but already share the desk's vol/spot.
  const bestK = deskRecon && isFinite(deskRecon.strike) ? deskRecon.strike : Katm;
  const bestPremOverride = deskRecon && isFinite(deskRecon.mid) ? deskRecon.mid : null;

  // capital-protected note participation, derived from BS (ZC + ATM option)
  const budget = 1 - Math.exp(-r * tt);
  const optFrac = (down ? put(Katm) : call(Katm)) / S;
  const participation = optFrac > 0 ? Math.min(2, budget / optFrac) : 0;

  if (down) {
    const pPrem = bestPremOverride != null ? bestPremOverride : put(bestK), spr = put(Katm) - put(Kdn);
    return [
      { name: 'Long Put', kind: 'put', tag: 'DIRECTIONNEL', best: true, desc: 'Option de vente : profite de la baisse, perte limitée à la prime.', price: px(pPrem), breakeven: bestK - pPrem, maxLoss: px(pPrem), maxProfit: px(bestK), pay: (s) => Math.max(bestK - s, 0) - pPrem },
      { name: 'Bear Put Spread', kind: 'spread', tag: 'COÛT RÉDUIT', desc: 'Achat put ATM / vente put OTM : baisse le coût, gain plafonné.', price: px(spr), breakeven: Katm - spr, maxLoss: px(spr), maxProfit: px(Katm - Kdn - spr), pay: (s) => Math.min(Math.max(Katm - s, 0), Katm - Kdn) - spr },
      { name: 'Collar', kind: 'collar', tag: 'COUVERTURE', desc: 'Long put / short call : protège à la baisse, finance via le call.', price: px(put(Kfar) - call(Knear)), breakeven: '—', maxLoss: px(Katm - Kfar), maxProfit: px(Knear - Katm), pay: (s) => Math.max(Kfar - s, 0) - Math.max(s - Knear, 0) - (put(Kfar) - call(Knear)) },
      { name: 'Short Future', kind: 'future', tag: 'LINÉAIRE', desc: 'Vente à terme : exposition linéaire, P&L symétrique.', price: '0.00', breakeven: fwd, maxLoss: '∞', maxProfit: px(fwd), pay: (s) => fwd - s },
      { name: 'Note capital protégé', kind: 'note', tag: 'STRUCTURÉ', desc: `Zéro-coupon + put : capital protégé, participation ${(participation * 100).toFixed(0)}% à la baisse.`, price: '100% par', breakeven: '100%', maxLoss: '0% (protégé)', maxProfit: '+' + (participation * 100).toFixed(0) + '%', pay: (s) => participation * Math.max(1 - s / S, 0) * 100 },
    ];
  }
  const cPrem = bestPremOverride != null ? bestPremOverride : call(bestK), spr = call(Katm) - call(Kup);
  return [
    { name: 'Long Call', kind: 'call', tag: 'DIRECTIONNEL', best: true, desc: "Option d'achat : profite de la hausse, perte limitée à la prime.", price: px(cPrem), breakeven: bestK + cPrem, maxLoss: px(cPrem), maxProfit: '∞', pay: (s) => Math.max(s - bestK, 0) - cPrem },
    { name: 'Bull Call Spread', kind: 'spread', tag: 'COÛT RÉDUIT', desc: 'Achat call ATM / vente call OTM : baisse le coût, gain plafonné.', price: px(spr), breakeven: Katm + spr, maxLoss: px(spr), maxProfit: px(Kup - Katm - spr), pay: (s) => Math.min(Math.max(s - Katm, 0), Kup - Katm) - spr },
    { name: 'Collar', kind: 'collar', tag: 'COUVERTURE', desc: 'Long call / short put : capture la hausse, financé par le put.', price: px(call(Knear) - put(Kfar)), breakeven: '—', maxLoss: px(Katm - Kfar), maxProfit: '∞', pay: (s) => Math.max(s - Knear, 0) - Math.max(Kfar - s, 0) - (call(Knear) - put(Kfar)) },
    { name: 'Long Future', kind: 'future', tag: 'LINÉAIRE', desc: 'Achat à terme : exposition linéaire, P&L symétrique.', price: '0.00', breakeven: fwd, maxLoss: px(fwd), maxProfit: '∞', pay: (s) => s - fwd },
    { name: 'Note capital protégé', kind: 'note', tag: 'STRUCTURÉ', desc: `Zéro-coupon + call : capital protégé, participation ${(participation * 100).toFixed(0)}% à la hausse.`, price: '100% par', breakeven: '100%', maxLoss: '0% (protégé)', maxProfit: '+' + (participation * 100).toFixed(0) + '%', pay: (s) => participation * Math.max(s / S - 1, 0) * 100 },
  ];
}

/* --------------------------------------------------------------- charts */
function Sparkline({ points, color = T.green, w = 64, h = 20 }) {
  if (!points || points.length < 2) return <svg width={w} height={h} />;
  const lo = Math.min(...points), hi = Math.max(...points), rng = (hi - lo) || 1;
  const d = points.map((y, i) => `${i === 0 ? 'M' : 'L'}${(i / (points.length - 1) * w).toFixed(1)},${(h - ((y - lo) / rng) * (h - 2) - 1).toFixed(1)}`).join(' ');
  return <svg width={w} height={h}><path d={d} fill="none" stroke={color} strokeWidth="1.3" /></svg>;
}

function AreaChart({ points, color = T.red, h = 140 }) {
  const W = 320;
  if (!points || points.length < 2) {
    return <div style={{ height: h, display: 'grid', placeItems: 'center', color: T.dim, fontFamily: MONO, fontSize: 11 }}>—</div>;
  }
  const lo = Math.min(...points), hi = Math.max(...points), rng = (hi - lo) || 1;
  const X = (i) => (i / (points.length - 1)) * W;
  const Y = (v) => h - ((v - lo) / rng) * (h - 10) - 5;
  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `M${X(0)},${h} ${points.map((v, i) => `L${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} L${W},${h} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <path d={area} fill={color} opacity="0.10" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function PayoffChart({ pay, lo, hi, spot, h = 96 }) {
  const W = 260, N = 60;
  const xs = Array.from({ length: N + 1 }, (_, i) => lo + (hi - lo) * (i / N));
  const ys = xs.map(pay);
  const ymin = Math.min(...ys, 0), ymax = Math.max(...ys, 0), yr = (ymax - ymin) || 1;
  const X = (x) => ((x - lo) / (hi - lo)) * W;
  const Y = (y) => h - ((y - ymin) / yr) * (h - 8) - 4;
  const zero = Y(0);
  const pos = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${X(x).toFixed(1)},${Y(Math.max(ys[i], 0)).toFixed(1)}`).join(' ');
  const neg = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${X(x).toFixed(1)},${Y(Math.min(ys[i], 0)).toFixed(1)}`).join(' ');
  const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${X(x).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <path d={`M0,${zero} ${pos} L${W},${zero} Z`} fill={T.green} opacity="0.13" />
      <path d={`M0,${zero} ${neg} L${W},${zero} Z`} fill={T.red} opacity="0.13" />
      <line x1="0" y1={zero} x2={W} y2={zero} stroke={T.line2} strokeWidth="1" strokeDasharray="3 3" />
      {spot >= lo && spot <= hi && <line x1={X(spot)} y1="0" x2={X(spot)} y2={h} stroke={T.mute} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />}
      <path d={line} fill="none" stroke={T.text} strokeWidth="1.6" />
    </svg>
  );
}

/* ----------------------------------------------------------- small UI */
function Panel({ title, right, children, live, style }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 6, padding: 16, ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: '.02em' }}>
            {title}{live && <span style={{ color: T.green, fontSize: 9, marginLeft: 8 }}>● LIVE</span>}
          </span>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

const tag = { fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em', color: T.mute, border: `1px solid ${T.line2}`, borderRadius: 2, padding: '2px 6px' };

/* ============================================================ TOP NAV */
function TopNav({ apiReachable }) {
  const items = ['DASHBOARD', 'MARKETS', 'PRODUCTS', 'LEARNING', 'TOOLS', 'AGENT ROOM'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 24px', borderBottom: `1px solid ${T.line}`, background: T.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ width: 10, height: 10, background: T.red, display: 'inline-block' }} />
          <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 12.5, letterSpacing: '.04em', color: T.text, lineHeight: 1.05 }}>THE PRICING<br />LIBRARY</span>
        </Link>
        <div style={{ display: 'flex', gap: 26 }}>
          {items.map((it) => {
            const active = it === 'AGENT ROOM';
            const to = it === 'AGENT ROOM' ? '/agent-room' : it === 'TOOLS' ? '/tools' : it === 'LEARNING' ? '/courses' : it === 'DASHBOARD' ? '/dashboard' : '/';
            return (
              <Link key={it} to={to} style={{ fontFamily: MONO, fontSize: 11.5, letterSpacing: '.06em', fontWeight: 600, color: active ? T.red : T.mute, textDecoration: 'none', position: 'relative', padding: '20px 0' }}>
                {it}{active && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: T.red }} />}
              </Link>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: MONO, fontSize: 10.5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: apiReachable ? T.green : T.amber }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: apiReachable ? T.green : T.amber }} />
          {apiReachable ? 'DESK API EN LIGNE' : 'DESK API HORS-LIGNE'}
        </span>
      </div>
    </div>
  );
}

/* ============================================================ TICKER */
function Ticker({ rows }) {
  if (!rows.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '9px 24px', borderTop: `1px solid ${T.line}`, background: T.bg, overflowX: 'auto' }}>
      <span style={{ fontFamily: MONO, fontSize: 10, color: T.red, letterSpacing: '.1em', flexShrink: 0 }}>MARKET WATCH</span>
      {rows.map((r) => (
        <span key={r.sym} style={{ display: 'flex', gap: 7, fontFamily: MONO, fontSize: 11, flexShrink: 0 }}>
          <span style={{ color: T.mute }}>{r.sym}</span>
          <span style={{ color: T.text }}>{r.px}</span>
          <span style={{ color: r.up ? T.green : T.red }}>{r.chg}</span>
        </span>
      ))}
      <span style={{ marginLeft: 'auto', flexShrink: 0, color: T.dim, fontFamily: MONO, fontSize: 9.5 }}>séries réelles · desk-series.json</span>
    </div>
  );
}

/* ============================================================ MARKET CTX */
function MarketContext({ factor, ctxData }) {
  const c = FACTOR_CTX[factor] || FACTOR_CTX.equity;
  const { points, last, prev, source, date } = ctxData;
  const chg = (last != null && prev) ? ((last - prev) / prev) * 100 : null;
  const up = (chg || 0) >= 0;
  return (
    <Panel title="Market Context" live={source === 'live'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: T.text }}>{c.label}</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: source === 'live' ? T.green : source === 'bundled' ? T.blue : T.amber }}>
          {source === 'live' ? 'live · farmé' : source === 'bundled' ? `réel · ${date}` : 'référence'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '4px 0 8px' }}>
        <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: T.text }}>{last != null ? fmt(last, c.unit === '' || last < 10 ? 4 : 2) : '—'}</span>
        {c.unit && <span style={{ fontFamily: MONO, fontSize: 11, color: T.mute }}>{c.unit}</span>}
        {chg != null && <span style={{ fontFamily: MONO, fontSize: 12, color: up ? T.green : T.red, marginLeft: 'auto' }}>{up ? '+' : ''}{chg.toFixed(2)}%</span>}
      </div>
      <AreaChart points={points} color={up ? T.green : T.red} />
      {source === 'reference' && (
        <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 10, color: T.amber, lineHeight: 1.4 }}>
          Historique live requis : {c.label} n'est pas dans la tranche hors-ligne. Démarre le backend pour la série réelle.
        </div>
      )}
    </Panel>
  );
}

/* ============================================================ MAIN PAGE */
export default function AgentRoomReal() {
  const DEFAULT_Q = "J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?";
  const [q, setQ] = useState(DEFAULT_Q);
  const [submitted, setSubmitted] = useState(DEFAULT_Q);
  const [parsed, setParsed] = useState(() => parseRequest(DEFAULT_Q));
  const [desk, setDesk] = useState(null);       // real /agent/desk/run result
  const [busy, setBusy] = useState(false);
  const [apiUp, setApiUp] = useState(null);     // null=unknown, bool once probed
  const [tab, setTab] = useState('RFQ');
  const [sel, setSel] = useState(0);
  const [ctxData, setCtxData] = useState({ points: null, last: null, prev: null, source: 'reference' });
  const [ticker, setTicker] = useState([]);
  const reqId = useRef(0);

  // health probe
  useEffect(() => {
    let alive = true;
    platformApi.health().then((h) => { if (alive) setApiUp(!!h); }).catch(() => { if (alive) setApiUp(false); });
    return () => { alive = false; };
  }, []);

  // ticker from bundled real series
  useEffect(() => {
    loadDeskSeries().then((bundle) => {
      const series = bundle?.series || {};
      const want = [['SPX', 'SPX'], ['STOXX50E', 'SX5E'], ['VIX', 'VIX'], ['UST10Y', 'US10Y'], ['UST2Y', 'US2Y'], ['EURUSD', 'EUR/USD'], ['BTCUSD', 'BTC'], ['BAA10Y', 'Baa-10Y']];
      const rows = [];
      for (const [k, sym] of want) {
        const p = series[k]?.points;
        if (!p || p.length < 2) continue;
        const last = p[p.length - 1].c, prev = p[p.length - 2].c;
        const ch = ((last - prev) / prev) * 100;
        rows.push({ sym, px: fmt(last, last < 10 ? 3 : last < 1000 ? 2 : 0), chg: `${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%`, up: ch >= 0 });
      }
      setTicker(rows);
    });
  }, []);

  // market context for the parsed factor (live first, bundled fallback, then ref)
  useEffect(() => {
    let alive = true;
    const c = FACTOR_CTX[parsed.factor] || FACTOR_CTX.equity;
    const base = getPracticeApiBase();
    (async () => {
      // 1) bundled offline REAL series first — renders instantly, no 404 noise.
      let haveReal = false;
      let refLast = Number.isFinite(c.refSpot) ? c.refSpot : null; // trustworthy magnitude anchor
      if (c.bundled) {
        const bundle = await loadDeskSeries();
        const p = bundle?.series?.[c.bundled]?.points;
        if (p && p.length > 2 && alive) {
          const closes = p.map((x) => x.c);
          refLast = closes[closes.length - 1];
          setCtxData({ points: closes, last: refLast, prev: closes[closes.length - 2], source: 'bundled', date: p[p.length - 1].d });
          haveReal = true;
        }
      }
      // 2) honest reference only when no real series exists for this factor
      if (!haveReal && alive) setCtxData({ points: null, last: c.refSpot, prev: c.refSpot, source: 'reference' });
      // 3) live upgrade — ONLY if the backend actually serves the market API
      //    (avoids a /market/history 404 on the stateless desk build).
      if (!(await marketApiAvailable(base))) return;
      try {
        const r = await fetch(`${base}/market/history/${encodeURIComponent(c.api)}?points=120`);
        if (r.ok) {
          const j = await r.json();
          const closes = (j.series || []).map((s) => s.close).filter((x) => isFinite(x));
          // Reject an implausible live value (e.g. a mis-mapped symbol returning
          // $3.27 for WTI): never clobber the trustworthy bundled real series with
          // a quote off by >4x — keep the honest bundled/reference spot instead.
          const liveLast = closes[closes.length - 1];
          const sane = !(Number.isFinite(refLast) && refLast > 0) || (liveLast > refLast * 0.25 && liveLast < refLast * 4);
          if (closes.length > 2 && alive && sane) {
            setCtxData({ points: closes, last: closes[closes.length - 1], prev: closes[closes.length - 2], source: 'live' });
          }
        }
      } catch { /* offline — bundled/reference already shown */ }
    })();
    return () => { alive = false; };
  }, [parsed.factor, apiUp]);

  const run = async (text) => {
    const t = (text || '').trim();
    if (!t) return;
    const id = ++reqId.current;
    setSubmitted(t);
    setParsed(parseRequest(t));
    setSel(0);
    setBusy(true);
    setDesk(null);
    const result = await platformApi.deskRun(t);   // POST /agent/desk/run (real)
    if (id !== reqId.current) return;               // stale
    if (result) { setDesk(result); setApiUp(true); if (result.parsed) setParsed((p) => ({ ...p, ...result.parsed })); }
    else { setApiUp(false); }
    setBusy(false);
  };

  // real approaches priced on the market-context spot (live/bundled/reference)
  const c = FACTOR_CTX[parsed.factor] || FACTOR_CTX.equity;
  // Real spot (bundled/live/reference). The 100 is only a sub-second pre-load
  // guard so the payoff SVGs never draw NaN before the real series resolves; it
  // is never displayed (Market Context shows the real value or '—').
  const spot = Number.isFinite(ctxData.last) ? ctxData.last : (Number.isFinite(c.refSpot) ? c.refSpot : 100);
  const tt = Math.max((parsed.months || 5) / 12, 1 / 12);

  // Reconciliation seed for OPTION desks: the desk's own pricing inputs + the
  // exact quoted premium, read straight from POST /agent/desk/run. Driving the
  // BEST card from these makes the headline premium == desk MID (no 6.71-vs-3.45).
  const deskRecon = useMemo(() => {
    if (!desk || desk.pricing?.kind !== 'option') return null;
    const ms = desk.market_snapshot || {};
    const sp = desk.product_spec || {};
    const pr = desk.pricing_result || {};
    const midRaw = desk.quote?.mid;
    const mid = Number.isFinite(midRaw) ? midRaw : (Number.isFinite(desk.pricing?.est_price) ? desk.pricing.est_price : null);
    const strike = Number.isFinite(sp.strike) ? sp.strike : (Number.isFinite(pr.strike) ? pr.strike : null);
    const vol = Number.isFinite(ms.vol) ? ms.vol : (Number.isFinite(pr.vol) ? pr.vol : null);
    const dspot = Number.isFinite(ms.spot) ? ms.spot : (Number.isFinite(pr.spot) ? pr.spot : null);
    if (mid == null) return null;
    return { mid, strike, vol, spot: dspot, unit: desk.pricing?.unit };
  }, [desk]);
  // Back out ONE self-consistent vol from the desk's quoted MID so the BEST card
  // (= desk MID, an override) and the forward-anchored ALTERNATIVES are priced off
  // the SAME vol. The desk MID is the ATM premium; the snapshot/realized vol
  // (deskRecon.vol, e.g. 13.4%) reprices the ATM call at ~2.74, NOT the quoted 3.45
  // — so it would contradict the BEST card. We instead invert the alternatives' OWN
  // pricer at the ATM anchor (forward for commodities, spot for equity/FX) against
  // the MID: that recovers the MID-implied vol (~16%) and GUARANTEES the spread's
  // ATM long leg == the standalone Long Call == desk MID (no 3.45-vs-2.74 split).
  // If the inversion fails (price below intrinsic / no solution) we fall back to the
  // realized vol and DROP the "même vol" reconciliation claim downstream.
  const { usedVol, volImplied } = useMemo(() => {
    const fallback = (deskRecon && Number.isFinite(deskRecon.vol)) ? deskRecon.vol : c.vol;
    if (!deskRecon || !Number.isFinite(deskRecon.mid)) return { usedVol: fallback, volImplied: false };
    const f = parsed.factor;
    const type = parsed.view === 'Price decrease' ? 'put' : 'call';
    let iv = null;
    if (f === 'oil' || f === 'gold') {
      const F = spot * Math.exp(0.04 * tt);            // same forward the alternatives use
      iv = black76ImpliedVol({ F, K: F, r: 0.04, T: tt, price: deskRecon.mid, type });
    } else if (f === 'fx' || f === 'equity' || f === 'crypto') {
      const q = f === 'fx' ? 0.03 : 0;                 // GK foreign rate for FX, else BS
      iv = bsImpliedVol({ S: spot, K: spot, r: 0.04, q, T: tt, price: deskRecon.mid, type });
    }
    return Number.isFinite(iv) ? { usedVol: iv, volImplied: true } : { usedVol: fallback, volImplied: false };
  }, [deskRecon, c.vol, parsed.factor, parsed.view, spot, tt]);
  // Footer labelling: only assert "reconciled / même vol" when the inversion held.
  const volPct = (usedVol * 100).toFixed(1);
  const volTag = !deskRecon ? 'hyp.' : (volImplied ? 'desk (implicite)' : 'réalisée, indicatif');
  const reconNote = deskRecon
    ? (volImplied
        ? ' Carte BEST = prime cotée par le desk ; alternatives à la même vol implicite (cohérentes avec la prime cotée).'
        : ' Carte BEST = prime cotée par le desk ; alternatives à la vol réalisée (indicatif, non reconciliées).')
    : '';

  const approaches = useMemo(
    () => buildApproaches({ spot, vol: usedVol, r: 0.04, T: tt, view: parsed.view, unit: c.unit, factor: parsed.factor, deskRecon }),
    [spot, usedVol, c.unit, tt, parsed.view, parsed.factor, deskRecon]
  );

  const interp = [
    { ic: 'shuffle', t: 'Request Type', v: parsed.intention },
    { ic: 'flame', t: 'Underlying / Risk Factor', v: parsed.underlying },
    { ic: 'calendar', t: 'Horizon', v: parsed.horizon },
    { ic: 'target', t: 'Objective', v: parsed.factor === 'rates'
        ? (parsed.view === 'Price decrease' ? 'Baisse des taux / falling rates'
          : parsed.view === 'Range / stable' ? parsed.view
          : 'Hausse des taux / rising rates')
        : parsed.view },
  ];

  const tabs = [['RFQ', 'RFQ Cockpit'], ['AGENTS', 'Agent Room'], ['TRADER', 'Trader View']];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, display: 'flex', flexDirection: 'column' }}>
      <TopNav apiReachable={apiUp !== false} />

      {/* tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: `1px solid ${T.line}`, background: T.bg }}>
        {tabs.map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === id ? T.red : 'transparent'}`, color: tab === id ? T.text : T.mute, fontFamily: MONO, fontSize: 12, fontWeight: 600, padding: '14px 14px', cursor: 'pointer' }}>
            {lbl}{id !== 'RFQ' && <span style={{ color: T.dim, fontSize: 9, marginLeft: 6 }}>à venir</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '20px 24px' }}>
        {tab === 'RFQ' ? (
          <>
            {/* hero */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: T.red, letterSpacing: '.12em', marginBottom: 12 }}>AGENTIC TRADING ROOM · RFQ COCKPIT</div>
              <h1 style={{ fontFamily: MONO, fontSize: 30, fontWeight: 800, color: T.text, margin: '0 0 8px', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                D'une question de marché à une réponse <span style={{ color: T.red }}>desk-ready</span>.
              </h1>
              <p style={{ fontSize: 13.5, color: T.mute, margin: 0, maxWidth: '60ch' }}>
                Posez votre besoin en langage naturel. Le desk multi-agents interprète, structure et price — chaque chiffre vient d'un pricer déterministe, jamais inventé.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, alignItems: 'start' }}>
              {/* main column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                {/* 1. request */}
                <Panel title="1. Votre requête" right={<span style={tag}>langage naturel</span>}>
                  <form onSubmit={(e) => { e.preventDefault(); run(q); }} style={{ display: 'flex', gap: 0, border: `1px solid ${T.line2}`, borderRadius: 6, overflow: 'hidden', background: T.panel2 }}>
                    <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={2} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: T.text, fontFamily: MONO, fontSize: 12.5, padding: '12px 14px', lineHeight: 1.5 }} />
                    <button type="submit" disabled={busy} style={{ alignSelf: 'stretch', width: 52, background: T.red, border: 'none', color: '#fff', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, display: 'grid', placeItems: 'center' }}>
                      <Icon name={busy ? 'loader-2' : 'send'} size={16} color="#fff" />
                    </button>
                  </form>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {["J'ai peur que le pétrole augmente dans 5 mois, que me proposez-vous ?", 'Hedge rising rates over 2 years', 'Price me an ATM Bitcoin call for 3 months'].map((ex) => (
                      <button key={ex} onClick={() => { setQ(ex); run(ex); }} style={{ background: 'transparent', border: `1px solid ${T.line2}`, borderRadius: 4, color: T.mute, fontFamily: MONO, fontSize: 11, padding: '5px 9px', cursor: 'pointer', textAlign: 'left' }}>{ex.length > 42 ? ex.slice(0, 42) + '…' : ex}</button>
                    ))}
                  </div>
                  {desk && <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 11, color: T.green }}>● Routé vers le desk {desk.desk} · {desk.agents?.length || 0} agents · théo {fmt(desk.pricing?.est_price, 2)}{desk.pricing?.unit ? ` ${String(desk.pricing.unit).trim().replace(/^\/\s*/, '/ ')}` : ''}</div>}
                  {apiUp === false && <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 11, color: T.amber }}>● Backend requis pour l'analyse multi-agents temps réel — interprétation locale ci-dessous (déterministe).</div>}
                </Panel>

                {/* 2. interpretation */}
                <Panel title="2. Interprétation de la RFQ" right={<span style={tag}>{desk ? 'Sales Agent · ' + desk.desk : 'analyse locale'}</span>}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                    {interp.map((cd) => (
                      <div key={cd.t} style={{ background: T.inset, border: `1px solid ${T.line}`, borderRadius: 6, padding: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, color: T.mute }}>
                          <Icon name={cd.ic} size={13} /><span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '.08em', color: T.mute, textTransform: 'uppercase' }}>{cd.t}</span>
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: T.text }}>{cd.v}</div>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* 3. approaches */}
                <Panel title="3. Approches produit" right={<span style={tag}>{modelLabel(parsed.factor)}</span>}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                    {approaches.map((a, i) => {
                      const active = i === sel;
                      return (
                        <button key={a.name} onClick={() => setSel(i)} style={{ textAlign: 'left', cursor: 'pointer', background: active ? 'rgba(242,54,69,.05)' : T.inset, border: `1px solid ${active ? T.redDim : T.line}`, borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.text }}>{a.name}</span>
                            {a.best && <span style={{ fontFamily: MONO, fontSize: 8, color: T.red, border: `1px solid ${T.redDim}`, borderRadius: 2, padding: '1px 4px' }}>BEST</span>}
                          </div>
                          <span style={{ ...tag, alignSelf: 'flex-start' }}>{a.tag}</span>
                          <div style={{ background: T.bg, borderRadius: 4, border: `1px solid ${T.line}` }}>
                            <PayoffChart pay={a.pay} lo={spot * 0.6} hi={spot * 1.4} spot={spot} h={70} />
                          </div>
                          <div style={{ fontSize: 10.5, color: T.mute, lineHeight: 1.4 }}>{a.desc}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${T.line}`, paddingTop: 8 }}>
                            <div><div style={{ fontSize: 9, color: T.mute }}>Prime est.</div><div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: T.text }}>{a.price}</div></div>
                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, color: T.mute }}>Perte max</div><div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: T.text }}>{typeof a.maxLoss === 'number' ? fmt(a.maxLoss) : a.maxLoss}</div></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 10, color: T.dim }}>
                    {parsed.factor === 'rates' || parsed.factor === 'inflation'
                      ? `Swaps via DV01 (annuité × notionnel × 1bp) ; caps/floors & swaptions en Black-76 sur le taux ${fmt(spot, 2)}%, vol ${(c.vol * 100).toFixed(0)}%, T=${tt.toFixed(2)}a, notionnel 1,000,000 $. Primes en bp de notionnel — pas en % de taux.`
                      : parsed.factor === 'credit'
                        ? `CDS : prime = spread ${fmt(spot, 2)}% (${(spot * 100).toFixed(0)} bp p.a.) ; CS01 = annuité risquée × notionnel × 1bp ; JTD = (1−R) × notionnel (R=40%), notionnel 1,000,000 €.`
                        : parsed.factor === 'fx'
                          ? `Options FX en Garman–Kohlhagen (r_USD=4%, r_EUR=3%) sur le spot ${ctxData.source === 'reference' ? 'de référence' : 'réel'} ${fmt(spot, 4)}, vol ${volTag} ${volPct}%, T=${tt.toFixed(2)}a.${reconNote}`
                          : (parsed.factor === 'oil' || parsed.factor === 'gold')
                            ? `Payoffs et primes calculés en Black-76 sur le forward ${fmt(spot * Math.exp(0.04 * tt), spot < 10 ? 4 : 2)}${c.unit ? ' ' + c.unit : ''} (spot ${ctxData.source === 'reference' ? 'de référence' : 'réel'} ${fmt(spot, spot < 10 ? 4 : 2)}, r=4%, T=${tt.toFixed(2)}a), vol ${volTag} ${volPct}%.${reconNote}`
                            : `Payoffs et primes calculés en Black-Scholes sur le spot ${ctxData.source === 'reference' ? 'de référence' : 'réel'} ${fmt(spot, spot < 10 ? 4 : 2)}${c.unit ? ' ' + c.unit : ''}, vol ${volTag} ${volPct}%, T=${tt.toFixed(2)}a, r=4%.${reconNote}`}
                  </div>
                </Panel>

                {/* 4. selected detail + desk quote */}
                <Panel title={`4. Détail — ${approaches[sel]?.name}`} right={<span style={tag}>Quick view</span>}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
                    <div style={{ background: T.bg, borderRadius: 4, border: `1px solid ${T.line}`, padding: 8 }}>
                      <PayoffChart pay={approaches[sel].pay} lo={spot * 0.6} hi={spot * 1.4} spot={spot} h={150} />
                      <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 9, color: T.mute, marginTop: 4 }}>{c.label} {c.unit && `(${c.unit})`} — payoff à maturité</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: T.line, border: `1px solid ${T.line}`, borderRadius: 6, overflow: 'hidden', alignSelf: 'start' }}>
                      {(approaches[sel].metrics || [['Prime est.', approaches[sel].price], ['Break-even', typeof approaches[sel].breakeven === 'number' ? fmt(approaches[sel].breakeven, spot < 10 ? 4 : 2) : approaches[sel].breakeven], ['Perte max', typeof approaches[sel].maxLoss === 'number' ? fmt(approaches[sel].maxLoss) : approaches[sel].maxLoss], ['Gain max', approaches[sel].maxProfit]]).map(([k, v], i) => (
                        <div key={k} style={{ background: T.panel, padding: '12px 14px' }}>
                          <div style={{ fontSize: 9.5, color: i === 3 ? T.red : T.mute }}>{k}</div>
                          <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: i === 3 ? T.red : T.text, marginTop: 3 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {desk?.quote && (
                    <div style={{ marginTop: 12, padding: '10px 12px', border: `1px solid ${T.line}`, borderRadius: 6, background: T.inset }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: T.mute, marginBottom: 6 }}>QUOTE DESK {desk.desk} (structure recommandée par le desk : {desk.pricing?.product})</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 12 }}>
                        <span style={{ color: T.green }}>BID {desk.quote.bid}</span>
                        <span style={{ color: T.mute }}>MID {desk.quote.mid}</span>
                        <span style={{ color: T.red }}>ASK {desk.quote.ask}</span>
                        {desk.risk && <span style={{ color: desk.risk.status === 'GREEN' ? T.green : T.amber }}>RISK {desk.risk.status} · {desk.risk.dominant_risk}</span>}
                      </div>
                    </div>
                  )}
                </Panel>

                {/* agent pipeline (real backend) */}
                <Panel title="Pipeline multi-agents" right={<span style={tag}>{desk ? 'live · ' + desk.desk + ' desk' : 'backend requis'}</span>}>
                  {desk?.agents?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {desk.agents.map((ag) => (
                        <div key={ag.name} style={{ display: 'flex', gap: 10, fontSize: 11, lineHeight: 1.4, alignItems: 'baseline' }}>
                          <span style={{ fontFamily: MONO, color: T.red, minWidth: 130, flexShrink: 0 }}>{ag.role}</span>
                          <span style={{ color: T.mute }}>{ag.output}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: T.amber, fontFamily: MONO, fontSize: 12 }}>
                      Backend requis pour l'analyse multi-agents temps réel.<br />
                      <span style={{ color: T.dim, fontSize: 11 }}>Lancez le RAG backend (uvicorn) puis renvoyez la requête.</span>
                    </div>
                  )}
                </Panel>
              </div>

              {/* right rail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <MarketContext factor={parsed.factor} ctxData={ctxData} />
                <Panel title="Notes du desk">
                  <div style={{ fontSize: 11.5, color: T.mute, lineHeight: 1.5 }}>
                    {desk?.report?.client_summary || (desk?.pricing_result?.hedge_hint) || "Soumettez une requête pour obtenir l'analyse du desk. Hors-ligne, les payoffs et primes restent calculés sur des données de marché réelles."}
                  </div>
                  {desk?.model_choice && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line}`, fontFamily: MONO, fontSize: 10.5, color: T.mute }}>
                      Modèle : {desk.model_choice.model}
                    </div>
                  )}
                </Panel>
                <Panel title="Sparklines bundle">
                  {ticker.slice(0, 5).map((r) => (
                    <div key={r.sym} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${T.line}` }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T.mute }}>{r.sym}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: T.text }}>{r.px}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: r.up ? T.green : T.red }}>{r.chg}</span>
                    </div>
                  ))}
                </Panel>
                <div style={{ fontFamily: MONO, fontSize: 10, color: T.dim, lineHeight: 1.5 }}>
                  Simulation éducative — analytics indicatifs, ceci n'est pas un conseil en investissement.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 420 }}>
            <div style={{ textAlign: 'center', maxWidth: 520 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>{tab === 'AGENTS' ? 'Agent Room' : 'Trader View'} — à venir</div>
              <p style={{ fontSize: 12.5, color: T.mute, lineHeight: 1.6 }}>
                {tab === 'AGENTS'
                  ? "La carte du workflow multi-agents (pipeline animé, logs temps réel) arrive dans une prochaine itération. Le pipeline réel du desk est déjà visible dans le RFQ Cockpit après soumission d'une requête."
                  : "La vue trader (gestion de quote, order book, hedging, P&L live) sera câblée sur /agent/desk/state et /agent/desk/trade dans une prochaine itération. Aucune donnée fictive n'est affichée ici."}
              </p>
              <button onClick={() => setTab('RFQ')} style={{ marginTop: 14, background: T.red, border: 'none', borderRadius: 4, color: '#fff', fontFamily: MONO, fontSize: 12, fontWeight: 600, padding: '9px 16px', cursor: 'pointer' }}>← Retour au RFQ Cockpit</button>
            </div>
          </div>
        )}
      </div>

      <Ticker rows={ticker} />
    </div>
  );
}
