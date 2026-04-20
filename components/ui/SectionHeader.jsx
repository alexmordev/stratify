'use client';

export default function SectionHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
      <div>
        {eyebrow && (
          <p
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="serif"
          style={{
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.1,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: 14,
              color: 'var(--ink-3)',
              marginTop: 6,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right && (
        <div style={{ flexShrink: 0, paddingTop: 8 }}>{right}</div>
      )}
    </div>
  );
}
