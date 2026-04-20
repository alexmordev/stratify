'use client';

const variants = {
  primary: {
    background: 'var(--ink)',
    color: 'white',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--line)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink-2)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'transparent',
    color: 'oklch(0.5 0.15 25)',
    border: '1px solid oklch(0.88 0.04 25)',
  },
};

export default function Btn({
  children,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  style = {},
}) {
  const base = variants[variant] ?? variants.secondary;
  const padding = size === 'sm' ? '5px 10px' : size === 'lg' ? '10px 20px' : '7px 14px';
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13.5;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        ...base,
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
        transition: 'opacity .12s, background .12s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
