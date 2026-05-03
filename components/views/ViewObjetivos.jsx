'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import ProgressBar from '@/components/ui/ProgressBar';
import ColorDot from '@/components/ui/ColorDot';
import Check from '@/components/ui/Check';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import { t } from '@/lib/i18n';
import { PALETTE, palById } from '@/lib/palette';
import { objProgress, metaProgress } from '@/lib/progress';
import {
  createObjetivo,
  updateObjetivo,
  deleteObjetivo,
  toggleObjetivoThisWeek,
  toggleObjetivoCompleted,
} from '@/lib/actions/objetivos';
import { createTarea, toggleTarea } from '@/lib/actions/tareas';

function getLang() {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('lang');
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

function dateToInput(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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

function ModalEditObjetivo({ objetivo, lang, onClose, onSave }) {
  const [form, setForm] = useState({
    title: objetivo.title,
    tipo: objetivo.tipo ?? 'Aprendizaje',
    metrica: objetivo.metrica ?? '',
    fecha_limite: dateToInput(objetivo.fecha_limite),
    intencion_si_entonces: objetivo.intencion_si_entonces ?? '',
    seguimiento: objetivo.seguimiento ?? '',
    weeklyLoad: objetivo.weeklyLoad ?? 1,
    color: objetivo.color ?? 'sand',
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
      const data = {
        title: form.title.trim(),
        title_en: form.title.trim(),
        tipo: form.tipo,
        metrica: form.metrica.trim() || null,
        fecha_limite: form.fecha_limite || null,
        intencion_si_entonces: form.intencion_si_entonces.trim() || null,
        seguimiento: form.seguimiento.trim() || null,
        weeklyLoad: Number(form.weeklyLoad) || 1,
        color: form.color,
      };
      await onSave(objetivo.id, data);
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
          {t(lang, 'editObjective')}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'tipoLabel')}
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              {['Aprendizaje', 'Rendimiento'].map((tipo) => (
                <label key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer', color: 'var(--ink-2)' }}>
                  <input
                    type="radio"
                    name="edit-tipo"
                    value={tipo}
                    checked={form.tipo === tipo}
                    onChange={() => set('tipo', tipo)}
                    style={{ accentColor: 'var(--ink)' }}
                  />
                  {lang === 'en'
                    ? (tipo === 'Aprendizaje' ? t(lang, 'tipoAprendizaje') : t(lang, 'tipoRendimiento'))
                    : tipo}
                </label>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'metrica')}
            </span>
            <input
              style={inputStyle}
              value={form.metrica}
              onChange={(e) => set('metrica', e.target.value)}
              placeholder="…"
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'fecha_limite')}
            </span>
            <input
              type="date"
              style={inputStyle}
              value={form.fecha_limite}
              onChange={(e) => set('fecha_limite', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'intencion_si_entonces')}
            </span>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
              value={form.intencion_si_entonces}
              onChange={(e) => set('intencion_si_entonces', e.target.value)}
              rows={2}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'seguimiento')}
            </span>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
              value={form.seguimiento}
              onChange={(e) => set('seguimiento', e.target.value)}
              rows={2}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'weeklyLoad')}
            </span>
            <input
              type="number"
              min={1}
              max={7}
              style={{ ...inputStyle, width: 80 }}
              value={form.weeklyLoad}
              onChange={(e) => set('weeklyLoad', e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)' }}>
              {t(lang, 'color')}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {PALETTE.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.id}
                  onClick={() => set('color', p.id)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', background: p.dot,
                    border: form.color === p.id ? '2px solid var(--ink)' : '2px solid transparent',
                    cursor: 'pointer', padding: 0, outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>{t(lang, 'cancel')}</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
            {t(lang, 'save')}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteObjetivo({ objetivo, lang, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm(objetivo.id);
      onClose();
    } finally {
      setDeleting(false);
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
          width: 420, maxWidth: '92vw',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
          {t(lang, 'deleteObjective')}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
          {t(lang, 'deleteObjectiveConfirm')}
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, fontStyle: 'italic' }}>
          &ldquo;{objetivo.title}&rdquo;
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

function ObjetivoCard({ objetivo, tareas: initialTareas, lang, onTareaToggle, onTareaAdd, onThisWeekToggle, onEdit, onDelete, onComplete }) {
  const [collapsed, setCollapsed] = useState(false);
  const [tareas, setTareas] = useState(initialTareas);
  const [showAddForm, setShowAddForm] = useState(false);
  const [thisWeek, setThisWeek] = useState(objetivo.thisWeek ?? false);
  const [completed, setCompleted] = useState(Boolean(objetivo.done));
  const [togglingWeek, setTogglingWeek] = useState(false);
  const [togglingComplete, setTogglingComplete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const pal = palById(objetivo.color);
  const title = lang === 'en' && objetivo.title_en ? objetivo.title_en : objetivo.title;
  const progress = objProgress(objetivo.id, tareas);
  const doneTareas = tareas.filter((t) => t.done).length;
  const totalTareas = tareas.length;

  async function handleThisWeekToggle() {
    if (togglingWeek) return;
    setTogglingWeek(true);
    const next = !thisWeek;
    setThisWeek(next);
    try {
      await toggleObjetivoThisWeek(objetivo.id);
      onThisWeekToggle?.(objetivo.id, next);
    } catch {
      setThisWeek(!next);
    } finally {
      setTogglingWeek(false);
    }
  }

  async function handleCompleteToggle() {
    if (togglingComplete) return;
    setTogglingComplete(true);
    const next = !completed;
    setCompleted(next);
    try {
      await toggleObjetivoCompleted(objetivo.id);
      onComplete?.(objetivo.id, next);
    } catch {
      setCompleted(!next);
    } finally {
      setTogglingComplete(false);
    }
  }

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

  const iconBtnStyle = {
    background: 'none',
    border: '1px solid transparent',
    borderRadius: 5,
    padding: 3,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'background .15s, color .15s, border-color .15s',
  };

  return (
    <>
      <div
        data-testid={`objetivo-card-${objetivo.id}`}
        style={{
          background: completed ? 'var(--bg-2)' : 'var(--panel)',
          border: '1px solid var(--line-2)',
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          opacity: completed ? 0.7 : 1,
          transition: 'opacity .2s, background .2s',
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
              color: completed ? 'var(--ink-3)' : 'var(--ink)',
              textDecoration: completed ? 'line-through' : 'none',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>

          {/* Complete toggle */}
          <button
            type="button"
            title={completed ? t(lang, 'markPending') : t(lang, 'markCompleted')}
            onClick={handleCompleteToggle}
            style={{
              ...iconBtnStyle,
              background: completed ? pal.bg : 'none',
              border: completed ? `1px solid ${pal.dot}` : '1px solid transparent',
              color: completed ? pal.dot : 'var(--ink-4)',
            }}
          >
            <Icon name="check" size={13} />
          </button>

          {/* Edit */}
          <button
            type="button"
            title={t(lang, 'editObjective')}
            onClick={() => setShowEdit(true)}
            style={{ ...iconBtnStyle, color: 'var(--ink-4)' }}
          >
            <Icon name="edit" size={13} />
          </button>

          {/* Delete */}
          <button
            type="button"
            title={t(lang, 'deleteObjective')}
            onClick={() => setShowDelete(true)}
            style={{ ...iconBtnStyle, color: 'var(--ink-4)' }}
          >
            <Icon name="trash" size={13} />
          </button>

          {/* This week */}
          <button
            data-testid={`thisweek-btn-${objetivo.id}`}
            type="button"
            title={thisWeek ? t(lang, 'removeFromWeek') : t(lang, 'scheduleThisWeek')}
            onClick={handleThisWeekToggle}
            style={{
              ...iconBtnStyle,
              background: thisWeek ? pal.bg : 'none',
              border: thisWeek ? `1px solid ${pal.dot}` : '1px solid transparent',
              color: thisWeek ? pal.dot : 'var(--ink-4)',
            }}
          >
            <Icon name="calendar" size={13} />
          </button>

          {/* Collapse */}
          <button
            data-testid={`collapse-btn-${objetivo.id}`}
            type="button"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((c) => !c)}
            style={{
              ...iconBtnStyle,
              color: 'var(--ink-4)',
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

      {showEdit && (
        <ModalEditObjetivo
          objetivo={objetivo}
          lang={lang}
          onClose={() => setShowEdit(false)}
          onSave={async (id, data) => {
            await updateObjetivo(id, data);
            onEdit?.(id, data);
          }}
        />
      )}

      {showDelete && (
        <ConfirmDeleteObjetivo
          objetivo={objetivo}
          lang={lang}
          onClose={() => setShowDelete(false)}
          onConfirm={async (id) => {
            await deleteObjetivo(id);
            onDelete?.(id);
          }}
        />
      )}
    </>
  );
}

function MetaGroup({ meta, objetivos, allTareas, lang, onObjetivoAdd, onObjetivoEdit, onObjetivoDelete, onObjetivoComplete }) {
  const metaTitle = lang === 'en' && meta.title_en ? meta.title_en : meta.title;
  const progress = metaProgress(meta.id, objetivos);

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
              onEdit={onObjetivoEdit}
              onDelete={onObjetivoDelete}
              onComplete={onObjetivoComplete}
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

  const handleObjetivoEdit = useCallback((id, data) => {
    setObjetivos((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)));
  }, []);

  const handleObjetivoDelete = useCallback((id) => {
    setObjetivos((prev) => prev.filter((o) => o.id !== id));
    setTareas((prev) => prev.filter((t) => t.objId !== id));
  }, []);

  const handleObjetivoComplete = useCallback((id, isDone) => {
    setObjetivos((prev) => prev.map((o) => (o.id === id ? { ...o, done: isDone ? 1 : 0 } : o)));
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
                onObjetivoEdit={handleObjetivoEdit}
                onObjetivoDelete={handleObjetivoDelete}
                onObjetivoComplete={handleObjetivoComplete}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
