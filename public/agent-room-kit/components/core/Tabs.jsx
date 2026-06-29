import React from 'react';

/**
 * Tabs — underline tab bar. Active tab is red text with a 2px red underline.
 * Items: [{ id, label }]. Controlled via `value` + `onChange`.
 */
export function Tabs({ items = [], value, onChange, style, dense = false, ...rest }) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: dense ? 18 : 24,
        borderBottom: '1px solid var(--border-hairline)',
        ...style,
      }}
      {...rest}
    >
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange && onChange(it.id)}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              padding: dense ? '8px 0' : '10px 0',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
              color: active ? 'var(--red-500)' : 'var(--text-muted)',
              transition: 'color var(--dur-fast) var(--ease-out)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {it.label}
            <span
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: -1,
                height: 2,
                background: 'var(--red-500)',
                transform: active ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: 'transform var(--dur-fast) var(--ease-snap)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
