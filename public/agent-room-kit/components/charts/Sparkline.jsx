import React from 'react';

function buildPath(data, w, h, pad) {
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const innerW = w - pad * 2, innerH = h - pad * 2;
  return data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * innerW;
    const y = pad + innerH - ((v - min) / span) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}

/**
 * Sparkline — tiny area+line trend used inside StatCards and rows.
 */
export function Sparkline({ data = [], width = 120, height = 32, tone = 'green', strokeWidth = 1.5, fill = true, style }) {
  const color = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-500)' : tone;
  const grad = tone === 'red' ? 'var(--grad-chart-red)' : 'var(--grad-chart-green)';
  const pad = 2;
  const line = buildPath(data, width, height, pad);
  const id = React.useId();
  const area = `${line} L${width - pad} ${height - pad} L${pad} ${height - pad} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', ...style }} preserveAspectRatio="none">
      {fill && (
        <>
          <defs>
            <linearGradient id={`spk-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#spk-${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
