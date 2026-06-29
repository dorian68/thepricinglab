import React from 'react';

/**
 * VolHeatmap — implied-vol surface grid (Strike rows × Tenor columns) with
 * red-intensity cells. Pass a 2D `matrix` of values in [0,1] (or raw values +
 * min/max), plus axis labels.
 */
export function VolHeatmap({
  matrix = [],          // rows of numbers
  rowLabels = [],       // strike / moneyness
  colLabels = [],       // tenor
  min,
  max,
  cell = 26,
  gap = 2,
  style,
}) {
  const flat = matrix.flat();
  const lo = min ?? Math.min(...flat);
  const hi = max ?? Math.max(...flat);
  const span = (hi - lo) || 1;

  const color = (v) => {
    const t = Math.max(0, Math.min(1, (v - lo) / span));
    // dark navy → vivid red
    const r = Math.round(20 + t * 235);
    const g = Math.round(28 + t * 18);
    const b = Math.round(40 + t * 29);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div style={{ display: 'inline-flex', gap: 8, ...style }}>
      {rowLabels.length > 0 && (
        <div style={{ display: 'grid', gridTemplateRows: `repeat(${matrix.length}, ${cell}px)`, gap, alignItems: 'center' }}>
          {rowLabels.map((l, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textAlign: 'right' }}>{l}</span>
          ))}
        </div>
      )}
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${(colLabels.length || (matrix[0]||[]).length)}, ${cell}px)`, gap }}>
          {matrix.map((row, ri) => row.map((v, ci) => (
            <div key={`${ri}-${ci}`} title={`${v}`} style={{ width: cell, height: cell, borderRadius: 'var(--radius-xs)', background: color(v) }} />
          )))}
        </div>
        {colLabels.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colLabels.length}, ${cell}px)`, gap, marginTop: 4 }}>
            {colLabels.map((l, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textAlign: 'center' }}>{l}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
