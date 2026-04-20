'use client';

export default function ColorDot({ color, size = 10, className = '', ...rest }) {
  return (
    <span
      className={className}
      {...rest}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}
