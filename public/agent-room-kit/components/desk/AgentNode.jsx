import React from 'react';

const HUE = {
  red: 'var(--red-500)', amber: 'var(--amber-500)', blue: 'var(--blue-500)',
  purple: 'var(--purple-500)', green: 'var(--green-500)', cyan: 'var(--cyan-500)',
};

/**
 * AgentNode — a node card in the agent pipeline. Numbered title with a domain
 * icon in a tinted ring, a coloured status word, a short description, optional
 * data rows, an elapsed timer, and a status-hued progress bar at the bottom.
 */
export function AgentNode({
  index,
  name,
  icon = null,
  status = '',          // e.g. UNDERSTANDING
  hue = 'red',
  description,
  rows = [],            // [{ label, value }]
  elapsed,              // e.g. "00:08"
  progress = 0.6,       // 0..1
  active = false,
  style,
}) {
  const color = HUE[hue] || hue;
  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-panel)',
      border: `1px solid ${active ? color : 'var(--border-hairline)'}`,
      borderRadius: 'var(--radius-md)',
      padding: 12,
      overflow: 'hidden',
      boxShadow: active ? `0 0 16px ${color}33` : 'none',
      ...style,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
        <span style={{
          width: 26, height: 26, flex: 'none', borderRadius: 'var(--radius-sm)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}1F`, border: `1px solid ${color}55`, color,
        }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {index != null ? `${index}. ` : ''}{name}
        </span>
        <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>

      {status && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', color, marginBottom: 6 }}>{status}</div>
      )}
      {description && (
        <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{description}</p>
      )}

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ color: r.tone || 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {elapsed && <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-2xs)', color: 'var(--text-dim)' }}>{elapsed}</span>}
      </div>
      {/* progress bar */}
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 8, height: 2, background: 'var(--bg-inset)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}
