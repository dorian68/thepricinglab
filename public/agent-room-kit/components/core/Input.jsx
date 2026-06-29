import React from 'react';

/**
 * Input / Textarea — terminal field. Dark elevated fill, hairline border that
 * turns red on focus with a soft red glow (matches the RFQ prompt box).
 */
export function Input({
  as = 'input',
  value,
  onChange,
  placeholder,
  icon = null,
  suffix = null,
  rows = 3,
  accent = false,      // always-on red border (active request box)
  disabled = false,
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const active = focus || accent;
  const Tag = as;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: as === 'textarea' ? 'flex-start' : 'center',
        gap: 8,
        background: 'var(--bg-elevated)',
        border: `1px solid ${active ? 'var(--red-500)' : 'var(--border-hairline)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: as === 'textarea' ? '12px 12px' : '0 10px',
        boxShadow: active ? 'var(--glow-focus)' : 'none',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon && <span style={{ display: 'inline-flex', color: 'var(--text-muted)', marginTop: as === 'textarea' ? 2 : 0 }}>{icon}</span>}
      <Tag
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={as === 'textarea' ? rows : undefined}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: as === 'textarea' ? 'none' : undefined,
          color: 'var(--text-primary)',
          fontFamily: as === 'textarea' ? 'var(--font-body)' : 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          lineHeight: 1.5,
          height: as === 'textarea' ? undefined : 36,
          ...inputStyle,
        }}
        {...rest}
      />
      {suffix && <span style={{ display: 'inline-flex', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{suffix}</span>}
    </div>
  );
}
