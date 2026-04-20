'use client';

export default function Chip({ children, bg, fg, className = '', style = {} }) {
  return (
    <span
      className={`mono ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.02em',
        background: bg ?? 'var(--line)',
        color: fg ?? 'var(--ink-2)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
