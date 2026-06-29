import React from 'react';

/**
 * Button — terminal-style action button.
 * Primary = solid red; secondary = hairline outline; ghost = bare.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  disabled = false,
  fullWidth = false,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: { padding: '6px 10px', fontSize: 'var(--text-xs)', height: 28, gap: 6 },
    md: { padding: '9px 14px', fontSize: 'var(--text-sm)', height: 36, gap: 8 },
    lg: { padding: '12px 18px', fontSize: 'var(--text-md)', height: 44, gap: 10 },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: {
      background: 'var(--red-500)',
      color: 'var(--text-on-accent)',
      border: '1px solid var(--red-500)',
      boxShadow: '0 0 0 0 var(--red-glow)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'transparent',
      color: 'var(--red-400)',
      border: '1px solid var(--red-700)',
    },
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        width: fullWidth ? '100%' : undefined,
        fontFamily: 'var(--font-mono)',
        fontSize: s.fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1,
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
        transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast), box-shadow var(--dur-fast), transform var(--dur-instant)',
        ...variants[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === 'primary') { e.currentTarget.style.background = 'var(--red-400)'; e.currentTarget.style.boxShadow = 'var(--glow-red-sm)'; }
        if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border-bright)';
        if (variant === 'ghost') { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }
        if (variant === 'danger') e.currentTarget.style.background = 'var(--red-tint)';
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') { e.currentTarget.style.background = 'var(--red-500)'; e.currentTarget.style.boxShadow = '0 0 0 0 var(--red-glow)'; }
        if (variant === 'secondary') e.currentTarget.style.borderColor = 'var(--border-strong)';
        if (variant === 'ghost') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }
        if (variant === 'danger') e.currentTarget.style.background = 'transparent';
      }}
      onMouseDown={(e) => { if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--red-700)'; }}
      onMouseUp={(e) => { if (!disabled && variant === 'primary') e.currentTarget.style.background = 'var(--red-400)'; }}
      {...rest}
    >
      {icon ? <span style={{ display: 'inline-flex' }}>{icon}</span> : null}
      {children}
      {iconRight ? <span style={{ display: 'inline-flex' }}>{iconRight}</span> : null}
    </button>
  );
}
