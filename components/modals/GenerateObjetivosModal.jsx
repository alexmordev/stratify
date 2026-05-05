'use client';

import { useState, useEffect } from 'react';
import Btn from '@/components/ui/Btn';
import ColorDot from '@/components/ui/ColorDot';
import { PALETTE, palById } from '@/lib/palette';
import { saveHitoObjetivos } from '@/lib/actions/hitos';

const WEEK_ROLE_COLORS = {
  'Quick win': 'oklch(0.45 0.14 150)',
  'Primary execution': 'oklch(0.45 0.12 250)',
  'Deepening': 'oklch(0.45 0.12 250)',
  'Integration': 'oklch(0.45 0.10 280)',
  'Closure': 'oklch(0.45 0.12 25)',
  'Closure & review': 'oklch(0.45 0.12 25)',
};

const WEEK_ROLE_BG = {
  'Quick win': 'oklch(0.95 0.05 150)',
  'Primary execution': 'oklch(0.95 0.04 250)',
  'Deepening': 'oklch(0.95 0.04 250)',
  'Integration': 'oklch(0.95 0.03 280)',
  'Closure': 'oklch(0.95 0.04 25)',
  'Closure & review': 'oklch(0.95 0.04 25)',
};

function ObjetivoWeekRow({ obj, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const pal = palById(obj.color ?? 'sand');
  const roleColor = WEEK_ROLE_COLORS[obj.role] ?? 'var(--ink-3)';
  const roleBg = WEEK_ROLE_BG[obj.role] ?? 'var(--bg-3, var(--line-2))';

  function f(key, label, multiline = false) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        {multiline ? (
          <textarea
            value={obj[key] ?? ''}
            onChange={(e) => onChange({ ...obj, [key]: e.target.value })}
            rows={2}
            style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical', width: '100%' }}
          />
        ) : (
          <input
            type={key === 'fecha_limite' ? 'date' : 'text'}
            value={obj[key] ?? ''}
            onChange={(e) => onChange({ ...obj, [key]: e.target.value })}
            style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', width: '100%' }}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `3px solid ${pal.dot}` }}>
      {/* Week header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '0.05em' }}>W{obj.week}</span>
          <span style={{ fontSize: 9, color: roleColor, background: roleBg, borderRadius: 3, padding: '1px 4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {obj.role}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <textarea
            value={obj.enunciado ?? ''}
            onChange={(e) => onChange({ ...obj, enunciado: e.target.value })}
            rows={2}
            style={{ border: '1px solid var(--line)', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical', width: '100%' }}
          />
        </div>
      </div>

      {/* Expand/collapse details */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ alignSelf: 'flex-start', fontSize: 10, color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}
      >
        <span style={{ fontSize: 9 }}>{expanded ? '▲' : '▼'}</span>
        {expanded ? 'Hide details' : 'Details'}
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--line-2)', paddingTop: 10 }}>
          {/* Tipo radio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Learning', 'Performance'].map((tipo) => (
                <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }}>
                  <input type="radio" name={`tipo-${obj.week}`} value={tipo} checked={obj.tipo === tipo} onChange={() => onChange({ ...obj, tipo })} style={{ accentColor: 'var(--ink)' }} />
                  {tipo}
                </label>
              ))}
            </div>
          </div>

          {f('metrica', 'Metric')}
          {f('fecha_limite', 'Deadline')}
          {f('intencion_si_entonces', 'If–Then', true)}
          {f('seguimiento', 'Tracking', true)}

          {/* Weekly load */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weekly load:</span>
            <input
              type="number" min={1} max={7} step={1}
              value={obj.weeklyLoad ?? 3}
              onChange={(e) => onChange({ ...obj, weeklyLoad: parseInt(e.target.value, 10) || 3 })}
              style={{ width: 48, border: '1px solid var(--line)', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontFamily: 'inherit', background: 'var(--bg)', color: 'var(--ink)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>h/week</span>
          </div>

          {/* Color override */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Color:</span>
            {PALETTE.map((p) => (
              <button key={p.id} type="button" onClick={() => onChange({ ...obj, color: p.id })} title={p.id}
                style={{ width: 14, height: 14, borderRadius: '50%', background: p.dot, border: obj.color === p.id ? '2px solid var(--ink)' : '2px solid transparent', cursor: 'pointer', padding: 0, outline: 'none' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GenerateObjetivosModal({ hito, meta, onClose, onSaved }) {
  const [state, setState] = useState('loading'); // 'loading' | 'review' | 'saving' | 'error'
  const [objetivos, setObjetivos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchObjetivos() {
      try {
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'proposeObjetivos', meta, hito }),
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const withColors = (data.objetivos ?? []).map((o) => ({ ...o, color: o.color ?? hito.color ?? 'sand' }));
        setObjetivos(withColors);
        setState('review');
      } catch (err) {
        console.error('[generate objetivos]', err);
        setError('Failed to generate objectives. Try again.');
        setState('error');
      }
    }
    fetchObjetivos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (objetivos.length === 0) return;
    setState('saving');
    try {
      await saveHitoObjetivos(hito.id, meta.id, hito.color ?? 'sand', objetivos);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('[save objetivos]', err);
      setError('Failed to save. Try again.');
      setState('review');
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg)', borderRadius: 16, width: 'min(680px, 95vw)', height: 'min(720px, 92vh)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--line-2)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Generate objectives</span>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              {hito.arc && <span style={{ fontWeight: 600, marginRight: 6 }}>{hito.arc}</span>}
              {(hito.enunciado ?? '').slice(0, 60)}{hito.enunciado?.length > 60 ? '…' : ''}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--ink-3)', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {state === 'loading' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--ink-3)', fontSize: 14 }}>
              <span className="spin" style={{
                display: 'inline-block', width: 28, height: 28, borderRadius: '50%',
                border: '2.5px solid var(--line)',
                borderTopColor: 'var(--accent)',
                borderRightColor: 'var(--accent)',
                boxSizing: 'border-box',
              }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Generating 12 weekly objectives
                <span style={{ display: 'inline-flex' }}>
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                  <span className="thinking-dot" />
                </span>
              </span>
            </div>
          )}

          {state === 'error' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ color: 'oklch(0.5 0.15 25)', fontSize: 14 }}>{error}</div>
              <Btn variant="secondary" onClick={onClose}>Close</Btn>
            </div>
          )}

          {(state === 'review' || state === 'saving') && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 4 }}>
                  12 weekly objectives for this milestone. Edit any field before saving.
                </div>
                {objetivos.map((obj, i) => (
                  <ObjetivoWeekRow
                    key={i}
                    obj={obj}
                    onChange={(updated) => setObjetivos(objetivos.map((o, j) => (j === i ? updated : o)))}
                  />
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--line-2)', padding: '14px 22px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn variant="secondary" onClick={onClose} disabled={state === 'saving'}>Cancel</Btn>
                <Btn variant="primary" onClick={handleSave} disabled={state === 'saving' || objetivos.length === 0}>
                  {state === 'saving' ? 'Saving…' : 'Save Objectives'}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
