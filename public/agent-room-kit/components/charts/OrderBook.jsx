import React from 'react';

/**
 * OrderBook — bid/ask depth ladder. Asks render red (depth bar from the right),
 * bids render green (depth bar from the left), with a MID + SPREAD row between.
 * Pass `rows` as the combined ladder, or `bids`/`asks` separately.
 */
export function OrderBook({
  bids = [],            // [{ price, size }] ascending toward mid
  asks = [],            // [{ price, size }] ascending away from mid
  mid,
  spread,
  highlight = null,     // price to highlight
  style,
}) {
  const maxSize = Math.max(1, ...bids.map(b => b.size), ...asks.map(a => a.size));

  const Row = ({ row, side }) => {
    const pct = (row.size / maxSize) * 100;
    const isAsk = side === 'ask';
    const depthColor = isAsk ? 'rgba(255,46,69,0.16)' : 'rgba(46,204,113,0.16)';
    const sizeColor = isAsk ? 'var(--red-400)' : 'var(--green-400)';
    const hot = highlight != null && Math.abs(row.price - highlight) < 1e-6;
    return (
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', height: 22, padding: '0 8px', background: hot ? 'var(--bg-hover)' : 'transparent' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, [isAsk ? 'right' : 'left']: 0, width: `${pct}%`, background: depthColor }} />
        {isAsk ? (
          <>
            <span style={{ position: 'relative', fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{row.price}</span>
            <span style={{ position: 'relative', textAlign: 'right', fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-xs)', color: sizeColor }}>{row.size}</span>
          </>
        ) : (
          <>
            <span style={{ position: 'relative', fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-xs)', color: sizeColor }}>{row.size}</span>
            <span style={{ position: 'relative', textAlign: 'right', fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{row.price}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px 6px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-label)', color: 'var(--text-muted)' }}>
        <span>BID SIZE</span><span>PRICE</span><span>ASK SIZE</span>
      </div>
      {[...asks].reverse().map((a, i) => <Row key={`a${i}`} row={a} side="ask" />)}
      {(mid != null) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', margin: '2px 0', borderTop: '1px solid var(--border-hairline)', borderBottom: '1px solid var(--border-hairline)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: 'var(--tracking-label)', color: 'var(--text-muted)' }}>MID</span>
          <span style={{ fontFamily: 'var(--font-numeric)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{mid}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>SPREAD {spread}</span>
        </div>
      )}
      {bids.map((b, i) => <Row key={`b${i}`} row={b} side="bid" />)}
    </div>
  );
}
