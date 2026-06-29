import React from 'react';

/**
 * LearningTip — the educational aside. Tinted blue panel, graduation-cap glyph,
 * uppercase label, explanatory body, and an optional "learn more" link.
 */
export function LearningTip({
  label = 'LEARNING TIP',
  icon = null,
  children,
  linkLabel,
  onLink,
  tone = 'blue',
  style,
}) {
  const color = tone === 'amber' ? 'var(--amber-500)' : tone === 'green' ? 'var(--green-500)' : 'var(--blue-500)';
  const bg = tone === 'amber' ? 'var(--amber-tint)' : tone === 'green' ? 'var(--green-tint)' : 'var(--blue-tint)';
  return (
    <div style={{ background: bg, border: `1px solid ${color}40`, borderRadius: 'var(--radius-md)', padding: 12, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ color, display: 'inline-flex' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', color }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{children}</p>
      {linkLabel && (
        <button onClick={onLink} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color }}>
          {linkLabel} →
        </button>
      )}
    </div>
  );
}
