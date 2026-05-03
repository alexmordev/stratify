'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/ui/SectionHeader';
import Btn from '@/components/ui/Btn';
import Chip from '@/components/ui/Chip';
import Donut from '@/components/ui/Donut';
import Switch from '@/components/ui/Switch';
import Icon from '@/components/ui/Icon';
import { t } from '@/lib/i18n';
import { palById } from '@/lib/palette';
import { metaProgress } from '@/lib/progress';
import { toggleMetaActive, updateMeta, deleteMeta } from '@/lib/actions/metas';
import WizardAgent from '@/components/modals/WizardAgent';
import GenerateObjetivosModal from '@/components/modals/GenerateObjetivosModal';

function getLang() {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('lang');
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13.5,
  border: '1px solid var(--line)',
  borderRadius: 8,
  background: 'var(--bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

function ModalEditMeta({ meta, lang, onClose, onSave }) {
  const [form, setForm] = useState({
    title: meta.title,
    why: meta.why,
    success: meta.success,
    horizon: meta.horizon,
  });
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(meta.id, form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--panel)', borderRadius: 14, padding: '28px 32px',
          width: 480, maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          {t(lang, 'editMeta')}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'titleLabel')}
            </span>
            <input
              ref={firstRef}
              style={inputStyle}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'whyLabel')}
            </span>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.why}
              onChange={(e) => set('why', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'successLabel')}
            </span>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.success}
              onChange={(e) => set('success', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'horizonLabel')}
            </span>
            <input
              style={inputStyle}
              value={form.horizon}
              onChange={(e) => set('horizon', e.target.value)}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>{t(lang, 'cancel')}</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
            {t(lang, 'save')}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteMeta({ meta, lang, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm(meta.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const title = meta.title;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--panel)', borderRadius: 14, padding: '28px 32px',
          width: 420, maxWidth: '92vw',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          {t(lang, 'deleteMeta')}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
          {t(lang, 'deleteMetaConfirm')}
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, fontStyle: 'italic' }}>
          &ldquo;{title}&rdquo;
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>{t(lang, 'cancel')}</Btn>
          <Btn variant="danger" onClick={handleConfirm} disabled={deleting}>
            {t(lang, 'delete')}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ meta, objetivos, tareas, lang, onToggle, onEdit, onDelete }) {
  const router = useRouter();
  const metaObjetivos = objetivos.filter((o) => o.metaId === meta.id);
  const metaTareas = tareas.filter((t) => metaObjetivos.some((o) => o.id === t.objId));
  const completedTareas = metaTareas.filter((t) => t.done).length;
  const progress = metaProgress(meta.id, objetivos);

  const title = lang === 'en' && meta.title_en ? meta.title_en : meta.title;
  const why = lang === 'en' && meta.why_en ? meta.why_en : meta.why;
  const horizon = lang === 'en' && meta.horizon_en ? meta.horizon_en : meta.horizon;

  const [hovered, setHovered] = useState(false);

  function handleCardClick(e) {
    if (e.target.closest('[data-switch]')) return;
    router.push(`/objetivos?metaId=${meta.id}`);
  }

  return (
    <div
      role="article"
      data-testid={`meta-card-${meta.id}`}
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--panel)',
        border: `1px solid ${hovered ? 'var(--line)' : 'var(--line-2)'}`,
        borderRadius: 12,
        padding: '20px 24px',
        cursor: 'pointer',
        boxShadow: hovered ? '0 2px 8px -4px rgba(0,0,0,.06)' : 'none',
        transition: 'border-color .15s, box-shadow .15s',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        alignItems: 'center',
      }}
    >
      {/* Left content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {/* Row 1: Chip + horizon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Chip bg={meta.active ? 'var(--bg-2)' : 'var(--line-2)'} fg={meta.active ? 'var(--ink)' : 'var(--ink-3)'}>
            {meta.active ? t(lang, 'active') : t(lang, 'archived')}
          </Chip>
          {horizon && (
            <span
              className="mono"
              style={{ fontSize: 11, color: 'var(--ink-4)', textAlign: 'right', flexShrink: 0 }}
            >
              {horizon}
            </span>
          )}
        </div>

        {/* Row 2: Title */}
        <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.3 }}>
          {title}
        </div>

        {/* Row 3: Why */}
        {why && (
          <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {why}
          </div>
        )}

        {/* Row 4: Stats */}
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {metaObjetivos.length} {t(lang, 'objectives')} · {metaTareas.length} {t(lang, 'tasksTotal')} · {completedTareas} {t(lang, 'tasksDone')}
        </div>
      </div>

      {/* Right rail */}
      <div
        data-switch
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Switch
          checked={meta.active}
          onChange={() => onToggle(meta.id)}
          label={meta.active ? t(lang, 'active') : t(lang, 'archived')}
        />
        <Donut value={progress} size={64} stroke={5} />
        <div
          style={{
            display: 'flex', gap: 4,
            opacity: hovered ? 1 : 0,
            transition: 'opacity .15s',
            pointerEvents: hovered ? 'auto' : 'none',
          }}
        >
          <button
            title={t(lang, 'editMeta')}
            onClick={() => onEdit(meta)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6, border: '1px solid var(--line)',
              background: 'var(--bg)', cursor: 'pointer', color: 'var(--ink-3)',
            }}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            title={t(lang, 'deleteMeta')}
            onClick={() => onDelete(meta)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6, border: '1px solid oklch(0.88 0.04 25)',
              background: 'var(--bg)', cursor: 'pointer', color: 'oklch(0.5 0.15 25)',
            }}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function HitosSection({ meta, lang, onGenerate }) {
  const [open, setOpen] = useState(false);
  const hitos = meta.hitos ?? [];
  if (hitos.length === 0) return null;

  return (
    <div style={{ marginTop: -4, borderTop: '1px solid var(--line-2)', background: 'var(--bg)', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 24px', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--ink-3)', fontFamily: 'inherit',
        }}
      >
        <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {lang === 'en' ? `${hitos.length} milestones` : `${hitos.length} hitos`}
        </span>
        <span style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {hitos.map((hito) => {
            const pal = palById(hito.color ?? 'sand');
            const objCount = hito._count?.objetivos ?? 0;
            const dateStr = hito.fecha_objetivo
              ? new Date(hito.fecha_objetivo).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : null;

            return (
              <div
                key={hito.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 24px', background: 'var(--bg)',
                  borderTop: '1px solid var(--line-2)',
                }}
              >
                <div style={{ width: 3, height: 28, borderRadius: 2, background: pal.dot, flexShrink: 0 }} />

                {hito.arc && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: 'var(--ink-4)',
                    background: 'var(--bg-2)', borderRadius: 3, padding: '2px 5px',
                    letterSpacing: '0.06em', flexShrink: 0,
                  }}>
                    {hito.arc}
                  </span>
                )}

                <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {hito.enunciado}
                </span>

                {dateStr && (
                  <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>{dateStr}</span>
                )}

                {objCount > 0 && (
                  <span style={{
                    fontSize: 10, color: 'var(--ink-4)',
                    background: 'var(--bg-2)', borderRadius: 10, padding: '1px 6px', flexShrink: 0,
                  }}>
                    {objCount} obj
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onGenerate(hito, meta); }}
                  title={lang === 'en' ? 'Generate objectives' : 'Generar objetivos'}
                  style={{
                    fontSize: 11, fontWeight: 600, color: 'oklch(0.45 0.14 150)',
                    background: 'oklch(0.95 0.05 150)', border: 'none',
                    borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
                    flexShrink: 0, fontFamily: 'inherit',
                  }}
                >
                  ⚡ {lang === 'en' ? 'Generate' : 'Generar'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div
      data-testid="empty-state"
      style={{
        border: '1px dashed var(--line)',
        borderRadius: 12,
        padding: 32,
        textAlign: 'center',
        color: 'var(--ink-4)',
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

export default function ViewMetas({ metas: initialMetas, objetivos, tareas }) {
  const router = useRouter();
  const [lang, setLang] = useState('es');
  const [metas, setMetas] = useState(initialMetas);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [deletingMeta, setDeletingMeta] = useState(null);
  const [generateModal, setGenerateModal] = useState(null); // { hito, meta }

  useEffect(() => {
    setLang(getLang());
    function handleLangChange() { setLang(getLang()); }
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const handleToggle = useCallback(async (id) => {
    setMetas((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
    try {
      await toggleMetaActive(id);
    } catch {
      setMetas((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
    }
  }, []);

  const handleSave = useCallback(async (id, data) => {
    const updated = await updateMeta(id, data);
    setMetas((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  }, []);

  const handleDelete = useCallback(async (id) => {
    await deleteMeta(id);
    setMetas((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const activeMetas = metas.filter((m) => m.active);
  const inactiveMetas = metas.filter((m) => !m.active);

  return (
    <div style={{ padding: '40px 48px 80px', maxWidth: 960, margin: '0 auto' }}>
      <SectionHeader
        eyebrow={t(lang, 'metasTitle')}
        title={t(lang, 'metasTitle')}
        subtitle={t(lang, 'metasSubtitle')}
        right={
          <Btn variant="primary" onClick={() => setWizardOpen(true)}>
            {t(lang, 'newMeta')}
          </Btn>
        }
      />

      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Active section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>
              {t(lang, 'active')}
            </h2>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', background: 'var(--bg-2)', borderRadius: 10, padding: '1px 6px' }}>
              {activeMetas.length}
            </span>
          </div>

          {activeMetas.length === 0 ? (
            <EmptyState message={t(lang, 'noActiveMetas')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeMetas.map((meta) => (
                <div key={meta.id} style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-2)' }}>
                  <MetaCard
                    meta={meta}
                    objetivos={objetivos}
                    tareas={tareas}
                    lang={lang}
                    onToggle={handleToggle}
                    onEdit={setEditingMeta}
                    onDelete={setDeletingMeta}
                  />
                  <HitosSection
                    meta={meta}
                    lang={lang}
                    onGenerate={(hito, m) => setGenerateModal({ hito, meta: m })}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Passive section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>
              {t(lang, 'archived')}
            </h2>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', background: 'var(--bg-2)', borderRadius: 10, padding: '1px 6px' }}>
              {inactiveMetas.length}
            </span>
          </div>

          {inactiveMetas.length === 0 ? (
            <EmptyState message={t(lang, 'noArchivedMetas')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {inactiveMetas.map((meta) => (
                <div key={meta.id} style={{ display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-2)' }}>
                  <MetaCard
                    meta={meta}
                    objetivos={objetivos}
                    tareas={tareas}
                    lang={lang}
                    onToggle={handleToggle}
                    onEdit={setEditingMeta}
                    onDelete={setDeletingMeta}
                  />
                  <HitosSection
                    meta={meta}
                    lang={lang}
                    onGenerate={(hito, m) => setGenerateModal({ hito, meta: m })}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {wizardOpen && (
        <WizardAgent onClose={() => setWizardOpen(false)} />
      )}

      {editingMeta && (
        <ModalEditMeta
          meta={editingMeta}
          lang={lang}
          onClose={() => setEditingMeta(null)}
          onSave={handleSave}
        />
      )}

      {deletingMeta && (
        <ConfirmDeleteMeta
          meta={deletingMeta}
          lang={lang}
          onClose={() => setDeletingMeta(null)}
          onConfirm={handleDelete}
        />
      )}

      {generateModal && (
        <GenerateObjetivosModal
          hito={generateModal.hito}
          meta={generateModal.meta}
          onClose={() => setGenerateModal(null)}
          onSaved={() => { setGenerateModal(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
