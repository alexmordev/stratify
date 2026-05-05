'use client';

export default function Spinner({ size = 16, color, thickness = 2, label }) {
  const c = color ?? 'var(--accent)';
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Cargando'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--ink-3)',
        fontSize: 12,
      }}
    >
      <span
        className="spin"
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `${thickness}px solid var(--line)`,
          borderTopColor: c,
          borderRightColor: c,
          boxSizing: 'border-box',
        }}
      />
      {label && <span>{label}</span>}
    </span>
  );
}

export function ThinkingDots({ label }) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Pensando'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        color: 'var(--ink-3)',
        fontSize: 12,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        <span className="thinking-dot" />
        <span className="thinking-dot" />
        <span className="thinking-dot" />
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

export function ShimmerBar({ height = 6, width = '100%', radius = 999 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        height,
        width,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--panel) 0%, var(--panel-2) 50%, var(--panel) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s linear infinite',
      }}
    />
  );
}
