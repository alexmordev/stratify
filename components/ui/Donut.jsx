'use client';

export default function Donut({ value = 0, size = 64, stroke = 5, color, track, label }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const center = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={track ?? 'var(--line)'}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color ?? 'var(--ink)'}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .5s ease' }}
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
          color: 'var(--ink-2)',
          fontWeight: 500,
        }}
      >
        {label ?? `${Math.round(pct)}%`}
      </div>
    </div>
  );
}
