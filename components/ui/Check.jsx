'use client';

import Icon from './Icon';

export default function Check({ checked = false, onChange, disabled = false, size = 16 }) {
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
        borderRadius: 4,
        border: `1.5px solid ${checked ? 'var(--ink)' : 'var(--line)'}`,
        background: checked ? 'var(--ink)' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        padding: 0,
        transition: 'background .12s, border-color .12s',
      }}
    >
      {checked && (
        <Icon name="check" size={size * 0.65} style={{ color: 'white' }} />
      )}
    </button>
  );
}
