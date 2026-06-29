import React from 'react';

/* Tone → color mapping for badges, tags, and status pills. */
const TONES = {
  red:     { fg: 'var(--red-400)',    bg: 'var(--red-tint)',     bd: 'var(--red-700)' },
  green:   { fg: 'var(--green-400)',  bg: 'var(--green-tint)',   bd: 'var(--green-600)' },
  amber:   { fg: 'var(--amber-400)',  bg: 'var(--amber-tint)',   bd: 'var(--amber-600)' },
  purple:  { fg: 'var(--purple-400)', bg: 'var(--purple-tint)',  bd: 'var(--purple-600)' },
  blue:    { fg: 'var(--blue-400)',   bg: 'var(--blue-tint)',    bd: 'var(--blue-600)' },
  cyan:    { fg: 'var(--cyan-400)',   bg: 'var(--cyan-tint)',    bd: 'var(--cyan-600)' },
  neutral: { fg: 'var(--text-secondary)', bg: 'rgba(138,148,164,0.10)', bd: 'var(--border-strong)' },
};

/* Semantic aliases used across the desk. */
const SEMANTIC = {
  directional: 'red', balanced: 'purple', hedge: 'amber', structured: 'green',
  'high-exposure': 'amber', 'data-export': 'blue', 'term-sheet': 'red', notebook: 'green',
  high: 'green', medium: 'amber', low: 'red',
  approved: 'green', live: 'green', 'in-progress': 'purple', locked: 'neutral',
  completed: 'green', positive: 'green', negative: 'red',
};

/**
 * Badge / Tag / Status pill. Pass `tone` directly (red, green, amber, …) or a
 * semantic `kind` (directional, hedge, high, approved, live …) that maps to a tone.
 */
export function Badge({
  children,
  tone,
  kind,
  variant = 'soft',   // 'soft' | 'outline' | 'dot'
  uppercase = true,
  dot = false,
  size = 'md',
  style,
  ...rest
}) {
  const toneName = tone || (kind ? SEMANTIC[kind] : null) || 'neutral';
  const t = TONES[toneName] || TONES.neutral;
  const sm = size === 'sm';

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: sm ? 18 : 22,
    padding: sm ? '0 6px' : '0 9px',
    fontFamily: 'var(--font-mono)',
    fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
    fontWeight: 600,
    letterSpacing: uppercase ? 'var(--tracking-label)' : '0.01em',
    textTransform: uppercase ? 'uppercase' : 'none',
    lineHeight: 1,
    borderRadius: 'var(--radius-xs)',
    whiteSpace: 'nowrap',
  };

  const skin = variant === 'outline'
    ? { color: t.fg, background: 'transparent', border: `1px solid ${t.bd}` }
    : { color: t.fg, background: t.bg, border: `1px solid transparent` };

  return (
    <span style={{ ...base, ...skin, ...style }} {...rest}>
      {(dot || variant === 'dot') && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.fg, flex: 'none' }} />
      )}
      {children}
    </span>
  );
}
