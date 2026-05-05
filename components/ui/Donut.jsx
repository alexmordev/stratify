'use client';

export default function Donut({ value = 0, size = 64, stroke = 5, color, track, label }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const center = size / 2;
  const strokeColor = color ?? 'var(--accent)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <filter id={`donut-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={track ?? 'var(--line-2)'}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter={pct > 0 ? `url(#donut-glow-${size})` : undefined}
          style={{ transition: 'stroke-dashoffset 0.7s var(--ease-out), stroke 0.3s var(--ease-out)' }}
        />
      </svg>
      <div
        className="mono"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.2,
          color: 'var(--ink)',
          fontWeight: 500,
          letterSpacing: '-0.02em',
        }}
      >
        {label ?? `${Math.round(pct)}%`}
      </div>
    </div>
  );
}
