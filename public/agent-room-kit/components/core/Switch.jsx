import React from 'react';

/**
 * Switch — terminal toggle. Off = hairline track; on = red track.
 */
export function Switch({ checked = false, onChange, disabled = false, label, tone = 'red', style, ...rest }) {
  const onColor = tone === 'green' ? 'var(--green-500)' : 'var(--red-500)';
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 34,
          height: 18,
          padding: 2,
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-strong)',
          background: checked ? onColor : 'var(--bg-inset)',
          borderColor: checked ? onColor : 'var(--border-strong)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background var(--dur-fast), border-color var(--dur-fast)',
          display: 'inline-flex',
          alignItems: 'center',
          ...rest.buttonStyle,
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: checked ? 'var(--text-on-accent)' : 'var(--text-muted)',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform var(--dur-fast) var(--ease-snap), background var(--dur-fast)',
          }}
        />
      </button>
      {label && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
      )}
    </label>
  );
}
