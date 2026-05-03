'use client';

import { useEffect, useState, useRef } from 'react';
import Donut from '@/components/ui/Donut';
import ProgressBar from '@/components/ui/ProgressBar';
import Btn from '@/components/ui/Btn';
import Icon from '@/components/ui/Icon';
import { t } from '@/lib/i18n';
import { objProgress, metaProgress } from '@/lib/progress';

export default function ModalReview({ open, onClose }) {
  const [lang, setLang] = useState('es');
  const [data, setData] = useState(null);
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    if (stored) setLang(stored);

    function handleLangChange() {
      const updated = localStorage.getItem('lang') || 'es';
      setLang(updated);
    }
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    async function fetchData() {
      try {
        const res = await fetch('/api/review-data');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Ignore fetch errors
      }
    }
    fetchData();
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch('/api/review-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection }),
      });
    } catch {
      // Ignore
    } finally {
      setSaving(false);
      setReflection('');
      onClose();
    }
  }

  if (!open) return null;

  const metas = data?.metas ?? [];
  const allTareas = metas.flatMap((m) => m.objetivos.flatMap((o) => o.tareas));
  const completedCount = allTareas.filter((t) => t.done).length;

  return (
    <div
      ref={overlayRef}
      data-testid="modal-review-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t(lang, 'reviewTitle')}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        data-testid="modal-review"
        style={{
          width: 600,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--line-2)',
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>
              {t(lang, 'reviewTitle')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
              {t(lang, 'reviewSubtitle')}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t(lang, 'close')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 6,
              color: 'var(--ink-3)',
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Summary row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              background: 'var(--bg-2)',
              borderRadius: 10,
              border: '1px solid var(--line-2)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="check" size={16} style={{ color: 'white' }} />
            </div>
            <div>
              <div
                className="mono"
                style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}
                data-testid="completed-count"
              >
                {completedCount}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                {t(lang, 'tasksCompleted')}
              </div>
            </div>
          </div>

          {/* Metas section */}
          {metas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {metas.map((meta) => {
                const pct = metaProgress(meta.id, meta.objetivos);

                return (
                  <div
                    key={meta.id}
                    style={{
                      border: '1px solid var(--line-2)',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Meta header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--line-2)',
                      }}
                    >
                      <Donut value={pct} size={52} stroke={5} color="var(--accent)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {lang === 'en' && meta.title_en ? meta.title_en : meta.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                          {meta.objetivos.length} {t(lang, 'objectives')}
                        </div>
                      </div>
                    </div>

                    {/* Objectives */}
                    {meta.objetivos.length > 0 && (
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {meta.objetivos.map((obj) => {
                          const objPct = objProgress(obj.id, obj.tareas);
                          return (
                            <div key={obj.id}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: 5,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 12.5,
                                    color: 'var(--ink-2)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '75%',
                                  }}
                                >
                                  {lang === 'en' && obj.title_en ? obj.title_en : obj.title}
                                </span>
                                <span
                                  className="mono"
                                  style={{ fontSize: 11, color: 'var(--ink-3)' }}
                                >
                                  {Math.round(objPct)}%
                                </span>
                              </div>
                              <ProgressBar
                                value={objPct}
                                color="var(--accent)"
                                track="var(--line)"
                                height={5}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Reflection textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}
              htmlFor="review-reflection"
            >
              {t(lang, 'reflectionPlaceholder').split('…')[0]}…
            </label>
            <textarea
              id="review-reflection"
              data-testid="review-reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder={t(lang, 'reflectionPlaceholder')}
              rows={4}
              style={{
                width: '100%',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13.5,
                color: 'var(--ink)',
                background: 'var(--bg)',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--line-2)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Btn
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            data-testid="save-review-btn"
          >
            <Icon name="check" size={14} />
            {t(lang, 'saveAndClose')}
          </Btn>
        </div>
      </div>
    </div>
  );
}
