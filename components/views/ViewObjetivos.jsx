'use client';

import { useState, useEffect, useCallback } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import ColorDot from '@/components/ui/ColorDot';
import Check from '@/components/ui/Check';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import { t } from '@/lib/i18n';
import { palById } from '@/lib/palette';
import { objProgress, metaProgress } from '@/lib/progress';
import { createObjetivo } from '@/lib/actions/objetivos';
import { createTarea, toggleTarea } from '@/lib/actions/tareas';

function getLang() {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('lang');
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function AddTareaForm({ objId, lang, onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(0);
  const [start, setStart] = useState(9);
  const [dur, setDur] = useState(1);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const newTarea = await createTarea({
        objId,
        title: title.trim(),
        title_en: title.trim(),
        day: Number(day),
        start: Number(start),
        dur: Number(dur),
      });
      onAdd(newTarea);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      data-testid="add-tarea-form"
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 0 2px',
        borderTop: '1px solid var(--line-2)',
      }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={lang === 'en' ? 'Task title…' : 'Título de tarea…'}
        style={{
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '5px 8px',
          fontSize: 13,
          fontFamily: 'inherit',
          color: 'var(--ink)',
          background: 'var(--bg)',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          style={{
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '4px 6px',
            fontSize: 12,
            fontFamily: 'inherit',
            color: 'var(--ink)',
            background: 'var(--bg)',
          }}
        >
          {DAY_NAMES.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
        <input
          type="number"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          min={0}
          max={23}
          step={0.5}
          placeholder="Hora"
          style={{
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '4px 6px',
            fontSize: 12,
            fontFamily: 'inherit',
            color: 'var(--ink)',
            background: 'var(--bg)',
            width: 60,
          }}
        />
        <input
          type="number"
          value={dur}
          onChange={(e) => setDur(e.target.value)}
          min={0.5}
          max={8}
          step={0.5}
          placeholder="Dur"
          style={{
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '4px 6px',
            fontSize: 12,
            fontFamily: 'inherit',
            color: 'var(--ink)',
            background: 'var(--bg)',
            width: 54,
          }}
        />
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <Btn size="sm" variant="ghost" onClick={onCancel} type="button">
            {t(lang, 'cancel')}
          </Btn>
          <Btn size="sm" variant="primary" type="submit" disabled={saving || !title.trim()}>
            {t(lang, 'save')}
          </Btn>
        </div>
      </div>
    </form>
  );
}

function ObjetivoCard({ objetivo, tareas: initialTareas, lang, onTareaToggle, onTareaAdd }) {
  const [collapsed, setCollapsed] = useState(false);
  const [tareas, setTareas] = useState(initialTareas);
  const [showAddForm, setShowAddForm] = useState(false);

  const pal = palById(objetivo.color);
  const title = lang === 'en' && objetivo.title_en ? objetivo.title_en : objetivo.title;
  const progress = objProgress(objetivo.id, tareas);
  const doneTareas = tareas.filter((t) => t.done).length;
  const totalTareas = tareas.length;

  async function handleToggleTarea(tareaId) {
    setTareas((prev) =>
      prev.map((t) => (t.id === tareaId ? { ...t, done: !t.done } : t))
    );
    try {
      await toggleTarea(tareaId);
      onTareaToggle?.(tareaId);
    } catch {
      setTareas((prev) =>
        prev.map((t) => (t.id === tareaId ? { ...t, done: !t.done } : t))
      );
    }
  }

  function handleTareaAdded(newTarea) {
    setTareas((prev) => [...prev, newTarea]);
    setShowAddForm(false);
    onTareaAdd?.(newTarea);
  }

  return (
    <div
      data-testid={`objetivo-card-${objetivo.id}`}
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line-2)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ColorDot color={pal.dot} size={10} />
        <span
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--ink)',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        <button
          data-testid={`collapse-btn-${objetivo.id}`}
          type="button"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: 'none',
            border: 'none',
            padding: 2,
            cursor: 'pointer',
            color: 'var(--ink-4)',
            display: 'inline-flex',
            alignItems: 'center',
            transition: 'transform .15s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <Icon name="chev-d" size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ProgressBar
          value={progress}
          color={pal.dot}
          track={pal.bg}
          height={5}
          style={{ flex: 1 }}
        />
        <span
          className="mono"
          style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}
        >
          {doneTareas}/{totalTareas}
        </span>
      </div>

      {/* Collapsible task list */}
      {!collapsed && (
        <div
          data-testid={`task-list-${objetivo.id}`}
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {tareas.map((tarea) => {
            const tareaTitle = lang === 'en' && tarea.title_en ? tarea.title_en : tarea.title;
            return (
              <div
                key={tarea.id}
                data-testid={`tarea-row-${tarea.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Check
                  checked={tarea.done}
                  onChange={() => handleToggleTarea(tarea.id)}
                  size={15}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: tarea.done ? 'var(--ink-4)' : 'var(--ink)',
                    textDecoration: tarea.done ? 'line-through' : 'none',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tareaTitle}
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}
                >
                  {DAY_NAMES[tarea.day] ?? tarea.day}
                </span>
              </div>
            );
          })}

          {showAddForm ? (
            <AddTareaForm
              objId={objetivo.id}
              lang={lang}
              onAdd={handleTareaAdded}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <button
              data-testid={`add-tarea-btn-${objetivo.id}`}
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: '4px 0',
                cursor: 'pointer',
                fontSize: 12.5,
                color: 'var(--ink-4)',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'inherit',
                marginTop: 2,
              }}
            >
              <Icon name="plus" size={12} />
              {t(lang, 'addTask')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MetaGroup({ meta, objetivos, allTareas, lang, onObjetivoAdd }) {
  const metaTitle = lang === 'en' && meta.title_en ? meta.title_en : meta.title;
  const progress = metaProgress(meta.id, objetivos, allTareas);

  return (
    <section data-testid={`meta-group-${meta.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Meta header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <h2
          className="serif"
          style={{
            fontSize: 22,
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'var(--ink)',
            flex: 1,
            minWidth: 0,
          }}
        >
          {metaTitle}
        </h2>
        <ProgressBar
          value={progress}
          color="var(--ink)"
          track="var(--line)"
          height={5}
          style={{ width: 160, flexShrink: 0 }}
        />
      </div>

      {/* Objetivos grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 12,
        }}
      >
        {objetivos.map((obj) => {
          const objTareas = allTareas.filter((t) => t.objId === obj.id);
          return (
            <ObjetivoCard
              key={obj.id}
              objetivo={obj}
              tareas={objTareas}
              lang={lang}
            />
          );
        })}
      </div>

      {/* Add objetivo button */}
      <AddObjetivoButton metaId={meta.id} lang={lang} onAdd={onObjetivoAdd} />
    </section>
  );
}

function AddObjetivoButton({ metaId, lang, onAdd }) {
  const [hovered, setHovered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const newObj = await createObjetivo({
        metaId,
        title: title.trim(),
        title_en: title.trim(),
        color: 'sand',
        weeklyLoad: 1,
        done: 0,
      });
      onAdd?.(newObj);
      setTitle('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  if (showForm) {
    return (
      <form
        data-testid={`add-objetivo-form-${metaId}`}
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'en' ? 'Objective title…' : 'Título de objetivo…'}
          style={{
            flex: 1,
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 13,
            fontFamily: 'inherit',
            color: 'var(--ink)',
            background: 'var(--bg)',
            outline: 'none',
          }}
        />
        <Btn size="sm" variant="ghost" onClick={() => setShowForm(false)} type="button">
          {t(lang, 'cancel')}
        </Btn>
        <Btn size="sm" variant="primary" type="submit" disabled={saving || !title.trim()}>
          {t(lang, 'save')}
        </Btn>
      </form>
    );
  }

  return (
    <button
      data-testid={`add-objetivo-btn-${metaId}`}
      type="button"
      onClick={() => setShowForm(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: `1px dashed ${hovered ? 'var(--ink-4)' : 'var(--line)'}`,
        borderRadius: 10,
        padding: '10px 16px',
        cursor: 'pointer',
        fontSize: 13,
        color: hovered ? 'var(--ink-4)' : 'var(--ink-3)',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'border-color .15s, color .15s',
        width: '100%',
        justifyContent: 'center',
      }}
    >
      <Icon name="plus" size={13} />
      {t(lang, 'addObjective')}
    </button>
  );
}

function EmptyState({ message }) {
  return (
    <div
      data-testid="empty-state"
      style={{
        border: '1px dashed var(--line)',
        borderRadius: 12,
        padding: 48,
        textAlign: 'center',
        color: 'var(--ink-4)',
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

export default function ViewObjetivos({ metas: initialMetas, objetivos: initialObjetivos, tareas: initialTareas }) {
  const [lang, setLang] = useState('es');
  const [metas] = useState(initialMetas);
  const [objetivos, setObjetivos] = useState(initialObjetivos);
  const [tareas, setTareas] = useState(initialTareas);

  useEffect(() => {
    setLang(getLang());

    function handleLangChange() {
      setLang(getLang());
    }

    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const activeMetas = metas.filter((m) => m.active);

  const handleObjetivoAdd = useCallback((newObj) => {
    setObjetivos((prev) => [...prev, newObj]);
  }, []);

  return (
    <div
      style={{
        padding: '40px 48px 80px',
        maxWidth: 1060,
        margin: '0 auto',
      }}
    >
      <SectionHeader
        eyebrow={t(lang, 'objetivosTitle')}
        title={t(lang, 'objetivosTitle')}
        subtitle={t(lang, 'objetivosSubtitle')}
      />

      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 48 }}>
        {activeMetas.length === 0 ? (
          <EmptyState message={t(lang, 'noActiveMetas2')} />
        ) : (
          activeMetas.map((meta) => {
            const metaObjetivos = objetivos.filter((o) => o.metaId === meta.id);
            return (
              <MetaGroup
                key={meta.id}
                meta={meta}
                objetivos={metaObjetivos}
                allTareas={tareas}
                lang={lang}
                onObjetivoAdd={handleObjetivoAdd}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
