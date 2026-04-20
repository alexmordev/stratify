'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/ui/SectionHeader';
import Btn from '@/components/ui/Btn';
import Chip from '@/components/ui/Chip';
import ColorDot from '@/components/ui/ColorDot';
import Donut from '@/components/ui/Donut';
import Switch from '@/components/ui/Switch';
import { t } from '@/lib/i18n';
import { palById } from '@/lib/palette';
import { metaProgress } from '@/lib/progress';
import { toggleMetaActive } from '@/lib/actions/metas';

function getLang() {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('lang');
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

function MetaCard({ meta, objetivos, tareas, lang, onToggle }) {
  const router = useRouter();
  const metaObjetivos = objetivos.filter((o) => o.metaId === meta.id);
  const metaTareas = tareas.filter((t) => metaObjetivos.some((o) => o.id === t.objId));
  const completedTareas = metaTareas.filter((t) => t.done).length;
  const progress = metaProgress(meta.id, objetivos, tareas);

  const title = lang === 'en' && meta.title_en ? meta.title_en : meta.title;
  const why = lang === 'en' && meta.why_en ? meta.why_en : meta.why;
  const horizon = lang === 'en' && meta.horizon_en ? meta.horizon_en : meta.horizon;

  const [hovered, setHovered] = useState(false);

  function handleCardClick(e) {
    if (e.target.closest('[data-switch]')) return;
    router.push(`/objetivos?metaId=${meta.id}`);
  }

  function handleSwitchChange() {
    onToggle(meta.id);
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

        {/* Row 4: Objective chips */}
        {metaObjetivos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', alignItems: 'center' }}>
            {metaObjetivos.map((obj) => {
              const pal = palById(obj.color);
              const objTitle = lang === 'en' && obj.title_en ? obj.title_en : obj.title;
              return (
                <span
                  key={obj.id}
                  data-testid={`obj-chip-${obj.id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <ColorDot color={pal.dot} size={7} />
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{objTitle}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Row 5: Stats */}
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
          onChange={handleSwitchChange}
          label={meta.active ? t(lang, 'active') : t(lang, 'archived')}
        />
        <Donut value={progress} size={64} stroke={5} />
      </div>
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
  const [lang, setLang] = useState('es');
  const [metas, setMetas] = useState(initialMetas);

  useEffect(() => {
    setLang(getLang());

    function handleLangChange() {
      setLang(getLang());
    }

    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const handleToggle = useCallback(async (id) => {
    setMetas((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
    try {
      await toggleMetaActive(id);
    } catch {
      setMetas((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
      );
    }
  }, []);

  const activeMetas = metas.filter((m) => m.active);
  const inactiveMetas = metas.filter((m) => !m.active);

  return (
    <div
      style={{
        padding: '40px 48px 80px',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      <SectionHeader
        eyebrow={t(lang, 'metasTitle')}
        title={t(lang, 'metasTitle')}
        subtitle={t(lang, 'metasSubtitle')}
        right={
          <Btn variant="primary" onClick={() => {}}>
            {t(lang, 'newMeta')}
          </Btn>
        }
      />

      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Active section */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <h2
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}
            >
              {t(lang, 'active')}
            </h2>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--ink-4)',
                background: 'var(--bg-2)',
                borderRadius: 10,
                padding: '1px 6px',
              }}
            >
              {activeMetas.length}
            </span>
          </div>

          {activeMetas.length === 0 ? (
            <EmptyState message={t(lang, 'noActiveMetas')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeMetas.map((meta) => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  objetivos={objetivos}
                  tareas={tareas}
                  lang={lang}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </section>

        {/* Inactive / Archived section */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <h2
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}
            >
              {t(lang, 'archived')}
            </h2>
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--ink-4)',
                background: 'var(--bg-2)',
                borderRadius: 10,
                padding: '1px 6px',
              }}
            >
              {inactiveMetas.length}
            </span>
          </div>

          {inactiveMetas.length === 0 ? (
            <EmptyState message={t(lang, 'noArchivedMetas')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {inactiveMetas.map((meta) => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  objetivos={objetivos}
                  tareas={tareas}
                  lang={lang}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
