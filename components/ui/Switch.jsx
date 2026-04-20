'use client';

export default function Switch({ checked = false, onChange, label, disabled = false }) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        style={{
          width: 32,
          height: 18,
          borderRadius: 999,
          background: checked ? 'var(--ink)' : 'var(--line)',
          border: 'none',
          padding: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'background .12s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: 'block',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'white',
            transform: checked ? 'translateX(14px)' : 'translateX(0)',
            transition: 'transform .12s',
            boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          }}
        />
      </button>
      {label && (
        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</span>
      )}
    </label>
  );
}
