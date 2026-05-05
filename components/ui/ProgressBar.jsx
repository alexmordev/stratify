'use client';

export default function ProgressBar({ value = 0, color, track, height = 6, className = '', animated = false }) {
  const pct = Math.min(100, Math.max(0, value));
  const fillColor = color ?? 'var(--accent)';

  return (
    <div
      className={className}
      style={{
        height,
        background: track ?? 'var(--line-2)',
        borderRadius: 999,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: fillColor,
          backgroundImage: `linear-gradient(90deg, ${fillColor} 0%, ${fillColor} 100%)`,
          borderRadius: 999,
          transition: 'width 0.6s var(--ease-out)',
          position: 'relative',
          boxShadow: pct > 0 ? `0 0 8px ${fillColor}55` : 'none',
        }}
      >
        {animated && pct > 0 && pct < 100 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 999,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.6s linear infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}
