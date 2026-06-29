import React from 'react';

/**
 * MetricRow — a label/value row for Greeks tables, key-metric lists and exposure
 * summaries. Optional unit, coloured change, and description column.
 */
export function MetricRow({
  label,
  value,
  unit,
  change,
  changeTone,
  desc,
  emphasize = false,
  style,
}) {
  const tone = changeTone === 'positive' ? 'var(--green-500)'
    : changeTone === 'negative' ? 'var(--red-500)'
    : changeTone || 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', ...style }}>
      <span style={{ flex: '0 0 auto', minWidth: 92, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-sm)', fontWeight: emphasize ? 700 : 600, color: emphasize ? 'var(--text-primary)' : 'var(--text-primary)' }}>
        {value}{unit ? <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}> {unit}</span> : null}
      </span>
      {change != null && (
        <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-xs)', color: tone }}>{change}</span>
      )}
      {desc && (
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{desc}</span>
      )}
    </div>
  );
}
