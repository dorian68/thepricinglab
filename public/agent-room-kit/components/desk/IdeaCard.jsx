import React from 'react';
import { Badge } from '../core/Badge.jsx';
import { PayoffChart } from '../charts/PayoffChart.jsx';

/**
 * IdeaCard — an "approach" / proposal card. A mini red payoff chart, title,
 * one-line rationale, a product tag chip, and (optionally) Est. Cost +
 * Confidence. Selectable with a red ring + check.
 */
export function IdeaCard({
  title,
  rationale,
  tagKind = 'directional',
  tagLabel,
  payoff = null,        // PayoffChart props override
  estCost,
  confidence,           // 'high' | 'medium' | 'low'
  selected = false,
  onClick,
  style,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: 'var(--bg-panel)',
        border: `1px solid ${selected ? 'var(--red-500)' : 'var(--border-hairline)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 12,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: selected ? 'var(--glow-red-sm)' : 'none',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        ...style,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-bright)'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = 'var(--border-hairline)'; }}
    >
      {selected && (
        <span style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: 'var(--red-500)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>✓</span>
      )}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</div>

      <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', height: 72, marginBottom: 10, overflow: 'hidden' }}>
        <PayoffChart mini height={72} width={240} {...(payoff || {})} />
      </div>

      {rationale && (
        <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{rationale}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Badge kind={tagKind}>{tagLabel || tagKind}</Badge>
        {(estCost != null || confidence) && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {estCost != null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                Est. <span style={{ fontFamily: 'var(--font-numeric)', color: 'var(--text-primary)' }}>{estCost}</span>
              </span>
            )}
            {confidence && <Badge kind={confidence} size="sm">{confidence}</Badge>}
          </span>
        )}
      </div>
    </div>
  );
}
