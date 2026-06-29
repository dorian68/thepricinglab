import React from 'react';

/**
 * SegmentedToggle — small pill group (1D / 1W / 1M / 3M / 1Y, or Bid / Mid).
 * Active segment fills with the chosen tone (default red).
 */
export function SegmentedToggle({ options = [], value, onChange, tone = 'red', size = 'sm', style, ...rest }) {
  const toneFill = tone === 'red' ? 'var(--red-500)' : tone === 'green' ? 'var(--green-600)' : tone;
  const sm = size === 'sm';
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 2,
        gap: 2,
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-sm)',
        ...style,
      }}
      {...rest}
    >
      {options.map((opt) => {
        const o = typeof opt === 'string' ? { id: opt, label: opt } : opt;
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange && onChange(o.id)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: sm ? '4px 9px' : '6px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: sm ? 'var(--text-2xs)' : 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              borderRadius: 'var(--radius-xs)',
              background: active ? toneFill : 'transparent',
              color: active ? 'var(--text-on-accent)' : 'var(--text-muted)',
              transition: 'background var(--dur-fast), color var(--dur-fast)',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
