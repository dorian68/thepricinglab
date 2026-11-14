import React from 'react';
import { Link } from 'react-router-dom';

const LEGS = {
  'Bull Call Spread': [['call', 95, 1], ['call', 105, -1]],
  'Iron Condor': [['put', 85, 1], ['put', 95, -1], ['call', 105, -1], ['call', 115, 1]],
  Butterfly: [['call', 90, 1], ['call', 100, -2], ['call', 110, 1]],
  'Long Call': [['call', 100, 1]],
  'Bear Put Spread': [['put', 105, 1], ['put', 95, -1]],
  'Long Straddle': [['call', 100, 1], ['put', 100, 1]],
  'Short Strangle': [['put', 95, -1], ['call', 105, -1]],
};

export function StrategyPayoffFigure({ name }) {
  const legs = LEGS[name];
  if (!legs) return null;
  const points = Array.from({ length: 81 }, (_, index) => {
    const spot = 60 + index;
    return { spot, payoff: legs.reduce((sum, [type, strike, quantity]) => sum + quantity * Math.max(type === 'call' ? spot - strike : strike - spot, 0), 0) };
  });
  const scale = Math.max(1, ...points.map((point) => Math.abs(point.payoff)));
  const d = points.map((point, index) => `${index ? 'L' : 'M'} ${index * 2.5},${50 - point.payoff / scale * 38}`).join(' ');
  return <figure style={{ margin: 0 }} data-strategy-payoff={name}>
    <svg viewBox="0 0 200 110" width="100%" height="110" role="img" aria-label={`${name}: gross terminal payoff, excluding entry premiums`}>
      <line x1="0" y1="50" x2="200" y2="50" stroke="var(--line-2)" />
      <path d={d} fill="none" stroke="var(--red)" strokeWidth="2" />
      <text x="0" y="105" fontSize="9" fill="var(--mute)">60</text><text x="182" y="105" fontSize="9" fill="var(--mute)">140</text>
    </svg>
    <figcaption className="mute" style={{ fontSize: 10, lineHeight: 1.5 }}>Gross payoff per unit, at a common expiry. Entry premiums excluded; this is not net P&amp;L. Terminal spot window: 60–140.</figcaption>
  </figure>;
}

export function SimulationComparison({ rows }) {
  function copyCsv() {
    const header = 'scenario,physicalDrift,physicalVol,seed,paths,meanPnl,pnlSd,meanOverSd,worstSample,positivePnlPct,analyticalMeanPnl,standardError';
    const csv = [header, ...rows.map((row) => [row.n, row.mu, row.sigma, row.seed, row.sampleCount, row.meanPnl, row.pnlSd, row.meanOverSd, row.worst, row.win, row.analyticalMeanPnl, row.standardError].join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a'); link.href = url; link.download = 'teaching-scenario-comparison.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="col" style={{ gap: 20 }} data-simulation-comparison="true">
    <div className="panel service-state"><span className="badge">SYNTHETIC TEACHING DATA</span><h2 style={{ marginTop: 14 }}>Compare assumptions, not historical strategies.</h2><p>Each row simulates 2,000 independent terminal outcomes under the physical measure P, over 30/252 years. Spot 100, short put 95 and short call 105, multiplier 400. Cash amounts are in USD. Entry premiums use Black-Scholes with r=2%, q=0 and IV=18%; financing of the collected premium is excluded.</p><p>Mean/SD is a non-annualised sample ratio. The worst sample is neither maximum possible loss nor a time-series drawdown. No observed returns, trading history, costs or hedging are included.</p></div>
    <div className="panel" style={{ overflowX: 'auto' }}><div className="row between" style={{ padding: 18 }}><h2 style={{ margin: 0, fontSize: 16 }}>Hypothetical scenarios</h2><button className="btn btn-outline btn-sm" onClick={copyCsv}>Download CSV</button></div>
      <table className="data"><thead><tr><th>Scenario</th><th className="num">Drift</th><th className="num">Volatility</th><th className="num">Seed</th><th className="num">Mean P&amp;L</th><th className="num">P&amp;L SD</th><th className="num">Mean / SD</th><th className="num">Worst sample</th></tr></thead><tbody>{rows.map((row) => <tr key={row.n}><td>{row.n}</td><td className="num">{(row.mu * 100).toFixed(0)}%</td><td className="num">{(row.sigma * 100).toFixed(0)}%</td><td className="num">{row.seed}</td><td className="num">{row.pnl}</td><td className="num">{row.volPnl}</td><td className="num">{row.meanOverSd==null?'—':row.meanOverSd.toFixed(3)}</td><td className="num">{row.worst}</td></tr>)}</tbody></table>
    </div><Link className="btn btn-outline" to="/tools/mc">Change assumptions in the Monte Carlo lab</Link>
  </section>;
}
