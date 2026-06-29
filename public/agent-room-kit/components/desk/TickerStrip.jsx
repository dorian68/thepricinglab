import React from 'react';

/**
 * TickerStrip — full-width MARKET WATCH bar. Red label on the left, then a row
 * of instruments with last price + signed delta (green up / red down). Optional
 * status + settings slot on the right.
 */
export function TickerStrip({
  label = 'MARKET WATCH',
  items = [],           // [{ sym, value, delta, dir }]
  status = null,        // e.g. 'All Systems Operational'
  right = null,
  style,
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      height: 'var(--ticker-h)',
      padding: '0 14px',
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border-hairline)',
      overflow: 'hidden',
      ...style,
    }}>
      <span style={{ flex: 'none', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', color: 'var(--red-500)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {items.map((it, i) => {
          const up = it.dir ? it.dir === 'up' : String(it.delta).trim().startsWith('+') || String(it.delta).trim().startsWith('▲');
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, flex: 'none' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{it.sym}</span>
              <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{it.value}</span>
              <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-2xs)', color: up ? 'var(--green-500)' : 'var(--red-500)' }}>{it.delta}</span>
            </span>
          );
        })}
      </div>
      {status && (
        <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-500)' }} />
          {status}
        </span>
      )}
      {right}
    </div>
  );
}
