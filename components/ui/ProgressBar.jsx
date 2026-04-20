'use client';

export default function ProgressBar({ value = 0, color, track, height = 6, className = '' }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={className}
      style={{
        height,
        background: track ?? 'var(--line)',
        borderRadius: 999,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color ?? 'var(--ink)',
          borderRadius: 999,
          transition: 'width .35s ease',
        }}
      />
    </div>
  );
}
