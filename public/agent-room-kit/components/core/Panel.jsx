import React from 'react';

/**
 * Panel — the workhorse container. Flat dark fill, 1px hairline, 4px radius,
 * faint top inner-gradient. Optional uppercase title (eyebrow), right-side
 * actions, and a "live" indicator.
 */
export function Panel({
  title,
  titleColor,
  right = null,
  live = false,
  liveLabel = 'LIVE',
  inset = false,
  pad = true,
  children,
  style,
  bodyStyle,
  ...rest
}) {
  return (
    <section
      style={{
        position: 'relative',
        background: inset ? 'var(--bg-inset)' : 'var(--bg-panel)',
        border: '1px solid var(--border-hairline)',
        borderRadius: 'var(--radius-md)',
        backgroundImage: 'var(--grad-panel)',
        ...style,
      }}
      {...rest}
    >
      {(title || right || live) && (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '11px 14px',
            borderBottom: children ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {title && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  letterSpacing: 'var(--tracking-label)',
                  textTransform: 'uppercase',
                  color: titleColor || 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {live && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-label)', color: 'var(--green-500)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-500)', boxShadow: 'var(--glow-green)', animation: 'tpl-pulse var(--pulse) infinite' }} />
                {liveLabel}
              </span>
            )}
            {right}
          </div>
        </header>
      )}
      <div style={{ padding: pad ? 'var(--pad-panel)' : 0, ...bodyStyle }}>{children}</div>
    </section>
  );
}
