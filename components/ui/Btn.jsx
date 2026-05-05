'use client';

const variants = {
  primary: {
    background: 'var(--accent)',
    color: 'white',
    border: '1px solid transparent',
    hoverBg: 'oklch(0.78 0.18 265)',
    hoverShadow: '0 4px 14px var(--accent-glow)',
  },
  secondary: {
    background: 'var(--panel)',
    color: 'var(--ink)',
    border: '1px solid var(--line)',
    hoverBg: 'var(--panel-2)',
    hoverShadow: 'var(--shadow-sm)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--ink-2)',
    border: '1px solid transparent',
    hoverBg: 'var(--panel-2)',
    hoverShadow: 'none',
  },
  danger: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid oklch(0.4 0.12 25)',
    hoverBg: 'oklch(0.28 0.07 25)',
    hoverShadow: '0 2px 8px rgba(255,80,80,0.18)',
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
  ...rest
}) {
  const base = variants[variant] ?? variants.secondary;
  const padding = size === 'sm' ? '5px 10px' : size === 'lg' ? '10px 20px' : '7px 14px';
  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13.5;

  function handleEnter(e) {
    if (disabled) return;
    e.currentTarget.style.background = base.hoverBg;
    e.currentTarget.style.boxShadow = base.hoverShadow;
    e.currentTarget.style.transform = 'translateY(-1px)';
  }
  function handleLeave(e) {
    if (disabled) return;
    e.currentTarget.style.background = base.background;
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  }
  function handleDown(e) {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(0)';
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseDown={handleDown}
      className={className}
      {...rest}
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
        transition: 'background var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-fast) var(--ease-out), opacity var(--t-fast) var(--ease-out), color var(--t-base) var(--ease-out)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
