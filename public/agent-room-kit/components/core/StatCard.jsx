import React from 'react';

/**
 * StatCard — the dense KPI tile used across the desk (THEO PRICE, BID, DAILY
 * PNL, VAR …). Uppercase label, big mono value with unit, optional coloured
 * delta and a sparkline/area slot beneath.
 */
export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaTone,           // 'positive' | 'negative' | tone override
  sub,
  valueColor,
  accent = false,      // red-accent emphasis card (e.g. BID / YOUR QUOTE)
  chart = null,        // sparkline node rendered below
  size = 'md',
  style,
  ...rest
}) {
  const big = size === 'lg';
  const tone = deltaTone === 'positive' ? 'var(--green-500)'
    : deltaTone === 'negative' ? 'var(--red-500)'
    : deltaTone || 'var(--text-secondary)';

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-panel)',
        border: `1px solid ${accent ? 'var(--red-700)' : 'var(--border-hairline)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--pad-card)',
        overflow: 'hidden',
        backgroundImage: accent ? 'var(--grad-hero)' : 'var(--grad-panel)',
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-2xs)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-label)',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 8,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontFamily: 'var(--font-numeric)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: big ? 'var(--text-3xl)' : 'var(--text-2xl)',
            fontWeight: 700,
            lineHeight: 1,
            color: valueColor || 'var(--text-primary)',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{unit}</span>
        )}
        {delta != null && (
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-sm)', fontWeight: 600, color: tone }}>
            {delta}
          </span>
        )}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{sub}</div>
      )}
      {chart && <div style={{ marginTop: 10 }}>{chart}</div>}
    </div>
  );
}
