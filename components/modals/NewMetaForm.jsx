'use client';

import { useState } from 'react';
import { createMeta } from '@/lib/actions/metas';
import { PALETTE } from '@/lib/palette';

const FIELD_STYLE = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '1px solid var(--line)', borderRadius: 7,
  background: 'var(--bg-2)', fontFamily: 'inherit',
  color: 'var(--ink)', boxSizing: 'border-box', outline: 'none',
};

const LABEL_STYLE = { fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 5, display: 'block' };

export default function NewMetaForm({ lang = 'es', onClose, onCreated, onUseAgent }) {
  const [title, setTitle]     = useState('');
  const [why, setWhy]         = useState('');
  const [horizon, setHorizon] = useState('');
  const [success, setSuccess] = useState('');
  const [color, setColor]     = useState('sand');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const es = lang === 'es';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !why.trim() || !horizon.trim()) return;
    setSaving(true);
    setError('');
    try {
      const newMeta = await createMeta({
        title:       title.trim(),
        title_en:    title.trim(),
        why:         why.trim(),
        why_en:      why.trim(),
        horizon:     horizon.trim(),
        horizon_en:  horizon.trim(),
        success:     success.trim(),
        success_en:  success.trim(),
        color,
        active:      true,
      });
      onCreated?.(newMeta);
      onClose();
    } catch {
      setError(es ? 'Error al guardar. Intenta de nuevo.' : 'Failed to save. Please try again.');
      setSaving(false);
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg)', borderRadius: 14, padding: '28px 32px',
          width: 500, maxWidth: '92vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {es ? 'Nueva meta' : 'New goal'}
        </h2>

        <label style={{ display: 'block' }}>
          <span style={LABEL_STYLE}>{es ? 'Título *' : 'Title *'}</span>
          <input
            autoFocus required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={es ? 'Ej. Aprender programación en Rust' : 'E.g. Learn Rust programming'}
            style={FIELD_STYLE}
          />
        </label>

        <div>
          <span style={LABEL_STYLE}>{es ? 'Color' : 'Color'}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PALETTE.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setColor(p.id)}
                title={p.id}
                style={{
                  width: 20, height: 20, borderRadius: '50%', padding: 0,
                  background: p.dot, cursor: 'pointer', flexShrink: 0, border: 'none',
                  outline: color === p.id ? `3px solid ${p.dot}` : '2px solid transparent',
                  outlineOffset: 2,
                  boxShadow: color === p.id ? `0 0 0 1px var(--bg)` : 'none',
                  transition: 'outline .1s',
                }}
              />
            ))}
          </div>
        </div>

        <label style={{ display: 'block' }}>
          <span style={LABEL_STYLE}>{es ? '¿Por qué importa? *' : 'Why does it matter? *'}</span>
          <textarea
            required
            value={why}
            onChange={e => setWhy(e.target.value)}
            rows={3}
            placeholder={es ? 'Describe la motivación detrás de esta meta…' : 'Describe the motivation behind this goal…'}
            style={{ ...FIELD_STYLE, resize: 'vertical' }}
          />
        </label>

        <label style={{ display: 'block' }}>
          <span style={LABEL_STYLE}>{es ? 'Horizonte temporal *' : 'Time horizon *'}</span>
          <input
            required
            value={horizon}
            onChange={e => setHorizon(e.target.value)}
            placeholder={es ? 'Ej. 6 meses, Q3 2025' : 'E.g. 6 months, Q3 2025'}
            style={FIELD_STYLE}
          />
        </label>

        <label style={{ display: 'block' }}>
          <span style={LABEL_STYLE}>{es ? 'Criterio de éxito (opcional)' : 'Success criteria (optional)'}</span>
          <textarea
            value={success}
            onChange={e => setSuccess(e.target.value)}
            rows={2}
            placeholder={es ? '¿Cómo sabrás que lo lograste?' : 'How will you know you achieved it?'}
            style={{ ...FIELD_STYLE, resize: 'vertical' }}
          />
        </label>

        {error && (
          <p style={{ margin: 0, fontSize: 12, color: 'oklch(0.5 0.18 25)' }}>{error}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {onUseAgent && (
            <button
              type="button"
              onClick={() => { onClose(); onUseAgent(); }}
              style={{
                padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                border: '1px solid var(--line)', borderRadius: 7,
                background: 'transparent', color: 'var(--ink-3)', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              ✨ {es ? 'Usar agente IA' : 'Use AI agent'}
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px', fontSize: 13, cursor: 'pointer',
              border: '1px solid var(--line)', borderRadius: 7,
              background: 'transparent', color: 'var(--ink-2)', fontFamily: 'inherit',
            }}
          >
            {es ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 18px', fontSize: 13, cursor: saving ? 'default' : 'pointer',
              border: 'none', borderRadius: 7,
              background: 'var(--ink)', color: 'white',
              fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '…' : (es ? 'Crear meta' : 'Create goal')}
          </button>
        </div>
      </form>
    </div>
  );
}
