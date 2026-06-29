import React from 'react';

/**
 * RfqHeader — screen header row. Big title + helper subtitle on the left; on the
 * right an RFQ-ID with a copy button and a green "Auto-Saved HH:MM:SS" state.
 */
export function RfqHeader({
  title,
  subtitle,
  rfqId,
  savedAt,
  right = null,
  copyIcon = null,
  style,
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try { navigator.clipboard && navigator.clipboard.writeText(rfqId); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, ...style }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        {rfqId && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            RFQ ID: <span style={{ color: 'var(--text-primary)' }}>{rfqId}</span>
            <button onClick={copy} title="Copy RFQ ID" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--green-500)' : 'var(--text-muted)', display: 'inline-flex', padding: 2 }}>
              {copyIcon || (copied ? '✓' : '⧉')}
            </button>
          </span>
        )}
        {savedAt && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 'var(--radius-xs)', background: 'var(--green-tint)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: '0.04em', color: 'var(--green-400)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-500)' }} />
            Auto-Saved {savedAt}
          </span>
        )}
        {right}
      </div>
    </div>
  );
}
