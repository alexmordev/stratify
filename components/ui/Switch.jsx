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
          width: 34,
          height: 20,
          borderRadius: 999,
          background: checked ? 'var(--accent)' : 'var(--line)',
          border: 'none',
          padding: 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: 'background var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out)',
          flexShrink: 0,
          boxShadow: checked ? '0 0 0 3px var(--accent-glow)' : 'inset 0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: 'white',
            transform: checked ? 'translateX(14px)' : 'translateX(0)',
            transition: 'transform var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out)',
            boxShadow: '0 1px 3px rgba(0,0,0,.4), 0 0 0 0.5px rgba(0,0,0,0.1)',
          }}
        />
      </button>
      {label && (
        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</span>
      )}
    </label>
  );
}
