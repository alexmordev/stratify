'use client';

import Icon from './Icon';

export default function Check({ checked = false, onChange, disabled = false, size = 16, color }) {
  const accent = color ?? 'var(--accent)';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        border: `1.5px solid ${checked ? accent : 'var(--line)'}`,
        background: checked ? accent : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        padding: 0,
        transition: 'background var(--t-base) var(--ease-out), border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-fast) var(--ease-out)',
        boxShadow: checked ? `0 0 0 3px var(--accent-glow)` : 'none',
      }}
    >
      {checked && (
        <Icon name="check" size={size * 0.65} style={{ color: 'white' }} />
      )}
    </button>
  );
}
