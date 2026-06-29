import React from 'react';

/**
 * PayoffChart — option payoff / P&L diagram (hockey-stick). Draws the payoff
 * line (red), a zero baseline, dashed break-even + spot/strike markers. Set
 * `mini` for the compact version inside idea cards.
 */
export function PayoffChart({
  points = null,        // [{x, y}] in data space; if null, a default call payoff is drawn
  width = 520,
  height = 240,
  tone = 'red',
  spot = null,          // x value for spot marker
  strike = null,        // x value for strike marker
  breakeven = null,     // x value for break-even marker
  xDomain = [50, 120],
  mini = false,
  showZero = true,
  style,
}) {
  const color = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-500)' : tone;
  const id = React.useId();
  const pad = mini ? { t: 8, r: 8, b: 8, l: 8 } : { t: 16, r: 16, b: 28, l: 40 };

  // default: long call payoff, strike 85, premium ~ -1
  const pts = points || (() => {
    const k = strike ?? 85, prem = 1;
    const out = [];
    for (let x = xDomain[0]; x <= xDomain[1]; x += 2) {
      out.push({ x, y: Math.max(0, x - k) - prem });
    }
    return out;
  })();

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const xmin = xDomain[0], xmax = xDomain[1];
  const ymin = Math.min(...ys, 0), ymax = Math.max(...ys, 1);
  const yspan = (ymax - ymin) || 1;
  const iw = width - pad.l - pad.r, ih = height - pad.t - pad.b;
  const X = (x) => pad.l + ((x - xmin) / (xmax - xmin)) * iw;
  const Y = (y) => pad.t + ih - ((y - ymin) / yspan) * ih;

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const zeroY = Y(0);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', ...style }}>
      <defs>
        <linearGradient id={`pf-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {!mini && (
        <>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i} x1={pad.l} x2={width - pad.r} y1={pad.t + t * ih} y2={pad.t + t * ih} stroke="var(--border-subtle)" strokeWidth="1" />
          ))}
        </>
      )}
      {/* area under payoff above zero */}
      <path d={`${line} L${X(xmax)} ${zeroY} L${X(xmin)} ${zeroY} Z`} fill={`url(#pf-${id})`} opacity="0.7" />
      {/* zero baseline */}
      {showZero && <line x1={pad.l} x2={width - pad.r} y1={zeroY} y2={zeroY} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray={mini ? '3 3' : '0'} />}
      {/* markers */}
      {strike != null && <line x1={X(strike)} x2={X(strike)} y1={pad.t} y2={pad.t + ih} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 3" />}
      {spot != null && <line x1={X(spot)} x2={X(spot)} y1={pad.t} y2={pad.t + ih} stroke="var(--purple-500)" strokeWidth="1" strokeDasharray="4 3" />}
      {breakeven != null && <circle cx={X(breakeven)} cy={zeroY} r="3" fill="var(--text-primary)" />}
      {/* payoff line */}
      <path d={line} fill="none" stroke={color} strokeWidth={mini ? 1.5 : 2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
