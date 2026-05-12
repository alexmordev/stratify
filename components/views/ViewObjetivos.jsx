'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  createTarea,
  toggleTarea,
  updateTarea,
  reorderTareas,
  deleteTarea,
  unscheduleObjetivoTareas,
  changeTareaObjetivo,
} from '@/lib/actions/tareas';

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

function formatDueDate(date, lang) {
  if (!date) return '';
  const d = new Date(date);
  const mEs = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const mEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = lang === 'en' ? mEn : mEs;
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function sortTareas(list) {
  return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id.localeCompare(b.id));
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

const smallInput = {
  border: '1px solid var(--line)',
  borderRadius: 6,
  padding: '4px 6px',
  fontSize: 12,
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'var(--bg)',
  outline: 'none',
};

// ─── Objective edit modal ────────────────────────────────────────────────────

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

// ─── Objective delete confirm ─────────────────────────────────────────────────

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

// ─── Inline task edit form ────────────────────────────────────────────────────

function EditTareaForm({ tarea, lang, onSave, onCancel, onDelete, objectives }) {
  const [form, setForm] = useState({
    title: tarea.title,
    sessions: tarea.sessions ?? 1,
    dueDate: tarea.dueDate ? dateToInput(tarea.dueDate) : '',
    day: tarea.day,
    start: tarea.start,
    dur: tarea.dur,
    objId: tarea.objId,
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        title_en: form.title.trim(),
        sessions: Number(form.sessions) || 1,
        dueDate: form.dueDate || null,
        day: Number(form.day),
        start: Number(form.start),
        dur: Number(form.dur),
        objId: form.objId,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '8px 0 6px',
        borderTop: '1px solid var(--line-2)',
      }}
    >
      <input
        autoFocus
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        style={{
          ...smallInput,
          width: '100%', boxSizing: 'border-box',
          padding: '5px 8px', fontSize: 13,
        }}
      />
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={form.day}
          onChange={(e) => set('day', e.target.value)}
          style={smallInput}
        >
          {DAY_NAMES.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
        <input
          type="number" min={0} max={23} step={0.5}
          value={form.start}
          onChange={(e) => set('start', e.target.value)}
          placeholder={lang === 'en' ? 'Hour' : 'Hora'}
          style={{ ...smallInput, width: 58 }}
        />
        <input
          type="number" min={0.5} max={8} step={0.5}
          value={form.dur}
          onChange={(e) => set('dur', e.target.value)}
          placeholder="Dur"
          style={{ ...smallInput, width: 52 }}
        />
        <input
          type="number" min={1} max={8}
          value={form.sessions}
          onChange={(e) => set('sessions', e.target.value)}
          title={t(lang, 'sessions')}
          placeholder={t(lang, 'sessions')}
          style={{ ...smallInput, width: 52 }}
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => set('dueDate', e.target.value)}
          title={t(lang, 'dueDate')}
          style={smallInput}
        />
        {objectives && objectives.length > 0 && (
          <select
            value={form.objId}
            onChange={e => set('objId', e.target.value)}
            title={lang === 'es' ? 'Objetivo' : 'Objective'}
            style={{ ...smallInput, maxWidth: 180 }}
          >
            {(() => {
              const groups = {};
              objectives.forEach(o => {
                if (!groups[o.hitoId]) groups[o.hitoId] = { label: o.hitoEnunciado, items: [] };
                groups[o.hitoId].items.push(o);
              });
              return Object.entries(groups).map(([hitoId, group]) => (
                <optgroup key={hitoId} label={group.label}>
                  {group.items.map(o => (
                    <option key={o.id} value={o.id}>
                      {lang === 'en' && o.title_en ? o.title_en : o.title}
                    </option>
                  ))}
                </optgroup>
              ));
            })()}
          </select>
        )}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={onDelete}
            title={t(lang, 'deleteTask')}
            style={{
              background: 'none', border: 'none', padding: '2px 4px',
              cursor: 'pointer', color: 'var(--ink-4)', display: 'inline-flex',
            }}
          >
            <Icon name="trash" size={12} />
          </button>
          <Btn size="sm" variant="ghost" type="button" onClick={onCancel}>
            {t(lang, 'cancel')}
          </Btn>
          <Btn size="sm" variant="primary" type="submit" disabled={saving || !form.title.trim()}>
            {t(lang, 'save')}
          </Btn>
        </div>
      </div>
    </form>
  );
}

// ─── Add task form ────────────────────────────────────────────────────────────

function AddTareaForm({ objId, lang, nextSortOrder, onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(0);
  const [start, setStart] = useState(9);
  const [dur, setDur] = useState(1);
  const [sessions, setSessions] = useState(1);
  const [dueDate, setDueDate] = useState('');
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
        sessions: Number(sessions) || 1,
        dueDate: dueDate || null,
        sortOrder: nextSortOrder,
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
        display: 'flex', flexDirection: 'column', gap: 8,
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
          border: '1px solid var(--line)', borderRadius: 6,
          padding: '5px 8px', fontSize: 13,
          fontFamily: 'inherit', color: 'var(--ink)',
          background: 'var(--bg)', outline: 'none',
          width: '100%', boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          style={smallInput}
        >
          {DAY_NAMES.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
        <input
          type="number" min={0} max={23} step={0.5}
          value={start}
          onChange={(e) => setStart(e.target.value)}
          placeholder={lang === 'en' ? 'Hour' : 'Hora'}
          style={{ ...smallInput, width: 58 }}
        />
        <input
          type="number" min={0.5} max={8} step={0.5}
          value={dur}
          onChange={(e) => setDur(e.target.value)}
          placeholder="Dur"
          style={{ ...smallInput, width: 52 }}
        />
        <input
          type="number" min={1} max={8}
          value={sessions}
          onChange={(e) => setSessions(e.target.value)}
          title={t(lang, 'sessions')}
          placeholder={t(lang, 'sessions')}
          style={{ ...smallInput, width: 52 }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          title={t(lang, 'dueDate')}
          style={smallInput}
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

// ─── Objective card ───────────────────────────────────────────────────────────

function ObjetivoCard({
  objetivo,
  tareas: initialTareas,
  lang,
  onTareaToggle,
  onTareaAdd,
  onThisWeekToggle,
  onEdit,
  onDelete,
  onComplete,
  allObjetivos,
  onMoveTask,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [tareas, setTareas] = useState(() => sortTareas(initialTareas));
  const [showAddForm, setShowAddForm] = useState(false);
  const [thisWeek, setThisWeek] = useState(objetivo.thisWeek ?? false);
  const [completed, setCompleted] = useState(Boolean(objetivo.completed));
  const [togglingWeek, setTogglingWeek] = useState(false);
  const [togglingComplete, setTogglingComplete] = useState(false);
  const [confirmUnschedule, setConfirmUnschedule] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingTareaId, setEditingTareaId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [showAllTareas, setShowAllTareas] = useState(false);

  const PAGE_SIZE = 10;
  const visibleTareas = showAllTareas ? tareas : tareas.slice(0, PAGE_SIZE);

  const pal = palById(objetivo.color);
  const title = lang === 'en' && objetivo.title_en ? objetivo.title_en : objetivo.title;
  const progress = objProgress(objetivo.id, tareas);
  const doneTareas = tareas.filter((t) => t.done).length;
  const totalTareas = tareas.length;

  // ── Objective handlers ──────────────────────────────────────────────────────

  async function handleThisWeekToggle() {
    if (togglingWeek) return;
    if (thisWeek) {
      const scheduledCount = tareas.filter(t => t.scheduledDate != null && !t.done).length;
      if (scheduledCount > 0) {
        setConfirmUnschedule(true);
        return;
      }
    }
    await doThisWeekToggle();
  }

  async function doThisWeekToggle() {
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

  async function handleConfirmUnschedule() {
    setConfirmUnschedule(false);
    setTareas(prev => prev.map(t => t.done ? t : { ...t, day: null, start: null, scheduledDate: null }));
    setTogglingWeek(true);
    setThisWeek(false);
    try {
      await toggleObjetivoThisWeek(objetivo.id);
      await unscheduleObjetivoTareas(objetivo.id);
      onThisWeekToggle?.(objetivo.id, false);
    } catch {
      setThisWeek(true);
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

  // ── Task handlers ───────────────────────────────────────────────────────────

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
    setTareas((prev) => sortTareas([...prev, newTarea]));
    setShowAddForm(false);
    onTareaAdd?.(newTarea);
  }

  async function handleEditTarea(id, data) {
    const original = tareas.find((t) => t.id === id);
    const isMoving = data.objId !== undefined && data.objId !== objetivo.id;

    if (isMoving) {
      setTareas((prev) => prev.filter((t) => t.id !== id));
      setEditingTareaId(null);
      try {
        await changeTareaObjetivo(id, data.objId);
        const { objId: _removed, ...rest } = data;
        if (Object.keys(rest).length > 0) await updateTarea(id, rest);
        onMoveTask?.(id);
      } catch {
        if (original) setTareas((prev) => [...prev, original]);
      }
      return;
    }

    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    setEditingTareaId(null);
    try {
      await updateTarea(id, data);
    } catch {
      if (original) setTareas((prev) => prev.map((t) => (t.id === id ? original : t)));
    }
  }

  async function handleDeleteTarea(id) {
    const saved = [...tareas];
    setTareas((prev) => prev.filter((t) => t.id !== id));
    setEditingTareaId(null);
    try {
      await deleteTarea(id);
    } catch {
      setTareas(saved);
    }
  }

  async function handleClearDate(id) {
    const original = tareas.find((t) => t.id === id)?.dueDate;
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate: null } : t)));
    try {
      await updateTarea(id, { dueDate: null });
    } catch {
      setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate: original } : t)));
    }
  }

  // ── Drag and drop ───────────────────────────────────────────────────────────

  function handleDragStart(e, id) {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, id) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const side = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    setDropTarget({ id, side });
  }

  function handleDragEnd() {
    setDragId(null);
    setDropTarget(null);
  }

  function handleDrop(e, id) {
    e.preventDefault();
    if (!dragId || dragId === id) { handleDragEnd(); return; }

    const side = dropTarget?.side ?? 'after';
    const list = [...tareas];
    const srcIdx = list.findIndex((t) => t.id === dragId);
    const tgtIdx = list.findIndex((t) => t.id === id);

    let insertAt = side === 'before' ? tgtIdx : tgtIdx + 1;
    if (srcIdx < insertAt) insertAt--;

    const [item] = list.splice(srcIdx, 1);
    list.splice(insertAt, 0, item);

    const withOrder = list.map((t, i) => ({ ...t, sortOrder: i }));
    setTareas(withOrder);
    handleDragEnd();
    reorderTareas(withOrder.map(({ id: tid, sortOrder }) => ({ id: tid, sortOrder }))).catch(() => {});
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

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

          <button
            type="button"
            title={t(lang, 'editObjective')}
            onClick={() => setShowEdit(true)}
            style={{ ...iconBtnStyle, color: 'var(--ink-4)' }}
          >
            <Icon name="edit" size={13} />
          </button>

          <button
            type="button"
            title={t(lang, 'deleteObjective')}
            onClick={() => setShowDelete(true)}
            style={{ ...iconBtnStyle, color: 'var(--ink-4)' }}
          >
            <Icon name="trash" size={13} />
          </button>

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
            style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
          >
            {visibleTareas.map((tarea) => {
              const tareaTitle = lang === 'en' && tarea.title_en ? tarea.title_en : tarea.title;
              const isEditing = editingTareaId === tarea.id;
              const isDragging = dragId === tarea.id;
              const isDropBefore = dropTarget?.id === tarea.id && dropTarget.side === 'before';
              const isDropAfter = dropTarget?.id === tarea.id && dropTarget.side === 'after';

              if (isEditing) {
                return (
                  <EditTareaForm
                    key={tarea.id}
                    tarea={tarea}
                    lang={lang}
                    onSave={(data) => handleEditTarea(tarea.id, data)}
                    onCancel={() => setEditingTareaId(null)}
                    onDelete={() => handleDeleteTarea(tarea.id)}
                    objectives={allObjetivos}
                  />
                );
              }

              return (
                <div
                  key={tarea.id}
                  data-testid={`tarea-row-${tarea.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tarea.id)}
                  onDragOver={(e) => handleDragOver(e, tarea.id)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, tarea.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '3px 0',
                    opacity: isDragging ? 0.35 : 1,
                    borderTop: isDropBefore ? `2px solid ${pal.dot}` : '2px solid transparent',
                    borderBottom: isDropAfter ? `2px solid ${pal.dot}` : '2px solid transparent',
                    transition: 'opacity .15s',
                    userSelect: 'none',
                  }}
                >
                  {/* Drag handle */}
                  <span
                    style={{
                      cursor: 'grab',
                      color: 'var(--ink-4)',
                      display: 'flex',
                      opacity: 0.45,
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="drag" size={11} />
                  </span>

                  {/* Checkbox */}
                  <Check
                    checked={tarea.done}
                    onChange={() => handleToggleTarea(tarea.id)}
                    size={15}
                  />

                  {/* Title */}
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

                  {/* Sessions dots */}
                  {(tarea.sessions ?? 1) > 1 && (
                    <span
                      style={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {Array.from({ length: Math.min(tarea.sessions, 5) }).map((_, i) => (
                        <span
                          key={i}
                          style={{
                            width: 3.5,
                            height: 3.5,
                            borderRadius: '50%',
                            background: 'var(--ink-4)',
                            display: 'block',
                          }}
                        />
                      ))}
                      {tarea.sessions > 5 && (
                        <span style={{ fontSize: 9, color: 'var(--ink-4)' }}>
                          +{tarea.sessions - 5}
                        </span>
                      )}
                    </span>
                  )}

                  {/* Due date chip — click clears the date */}
                  {tarea.dueDate && (
                    <button
                      type="button"
                      onClick={() => handleClearDate(tarea.id)}
                      title={t(lang, 'clearDate')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        background: 'none',
                        border: '1px solid var(--line)',
                        borderRadius: 4,
                        padding: '1px 5px',
                        fontSize: 10.5,
                        color: 'var(--ink-4)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="calendar" size={9} />
                      {formatDueDate(tarea.dueDate, lang)}
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => setEditingTareaId(tarea.id)}
                    title={t(lang, 'editTask')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 2,
                      cursor: 'pointer',
                      color: 'var(--ink-4)',
                      display: 'inline-flex',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="edit" size={11} />
                  </button>
                </div>
              );
            })}

            {tareas.length > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setShowAllTareas((v) => !v)}
                style={{
                  background: 'none', border: 'none', padding: '4px 0',
                  cursor: 'pointer', fontSize: 12, color: 'var(--ink-4)',
                  textAlign: 'left', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Icon name={showAllTareas ? 'chev-d' : 'chev-r'} size={11} />
                {showAllTareas
                  ? (lang === 'es' ? 'Mostrar menos' : 'Show less')
                  : (lang === 'es' ? `Mostrar ${tareas.length - PAGE_SIZE} más` : `Show ${tareas.length - PAGE_SIZE} more`)}
              </button>
            )}

            {showAddForm ? (
              <AddTareaForm
                objId={objetivo.id}
                lang={lang}
                nextSortOrder={tareas.length}
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

      {confirmUnschedule && (() => {
        const count = tareas.filter(t => t.scheduledDate != null && !t.done).length;
        const title = lang === 'en' && objetivo.title_en ? objetivo.title_en : objetivo.title;
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setConfirmUnschedule(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12,
                padding: '24px 28px', maxWidth: 380, width: '90%',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              }}
            >
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                {lang === 'es' ? 'Quitar de esta semana' : 'Remove from this week'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 20 }}>
                {lang === 'es'
                  ? `"${title}" tiene ${count} tarea${count !== 1 ? 's' : ''} programada${count !== 1 ? 's' : ''}. Al quitar el objetivo de la semana, todas quedarán sin programar.`
                  : `"${title}" has ${count} scheduled task${count !== 1 ? 's' : ''}. Removing the objective from this week will unschedule all of them.`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmUnschedule(false)}
                  style={{
                    border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-3)',
                    borderRadius: 8, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUnschedule}
                  style={{
                    border: 'none', background: 'var(--danger)', color: 'white',
                    borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {lang === 'es' ? 'Quitar y desagendar' : 'Remove & unschedule'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

// ─── Meta group ───────────────────────────────────────────────────────────────

function MetaGroup({
  meta,
  objetivos,
  allTareas,
  lang,
  onObjetivoAdd,
  onObjetivoEdit,
  onObjetivoDelete,
  onObjetivoComplete,
  onMoveTask,
}) {
  const metaTitle = lang === 'en' && meta.title_en ? meta.title_en : meta.title;
  const progress = metaProgress(meta.id, objetivos);

  const hitoMap = Object.fromEntries((meta.hitos ?? []).map(h => [h.id, h.enunciado]));
  const moveableObjetivos = objetivos
    .filter(o => !o.done)
    .map(o => ({ id: o.id, title: o.title, title_en: o.title_en, color: o.color, hitoId: o.hitoId ?? null, hitoEnunciado: o.hitoId ? (hitoMap[o.hitoId] ?? '') : '' }));

  return (
    <section data-testid={`meta-group-${meta.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              allObjetivos={moveableObjetivos}
              onMoveTask={onMoveTask}
            />
          );
        })}
      </div>

      <AddObjetivoButton metaId={meta.id} hitos={meta.hitos ?? []} lang={lang} onAdd={onObjetivoAdd} />
    </section>
  );
}

// ─── Add objective button ─────────────────────────────────────────────────────

function AddObjetivoButton({ metaId, hitos = [], lang, onAdd }) {
  const [hovered, setHovered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [hitoId, setHitoId] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data = {
        metaId,
        title: title.trim(),
        title_en: title.trim(),
        color: 'sand',
        weeklyLoad: 1,
        done: 0,
      };
      if (hitoId) data.hitoId = hitoId;
      const newObj = await createObjetivo(data);
      onAdd?.(newObj);
      setTitle('');
      setHitoId('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    border: '1px solid var(--line)',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 13,
    fontFamily: 'inherit',
    color: 'var(--ink)',
    background: 'var(--bg)',
    outline: 'none',
  };

  if (showForm) {
    return (
      <form
        data-testid={`add-objetivo-form-${metaId}`}
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'en' ? 'Objective title…' : 'Título de objetivo…'}
          style={{ ...inputStyle }}
        />
        {hitos.length > 0 ? (
          <select
            value={hitoId}
            onChange={e => setHitoId(e.target.value)}
            required
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="" disabled>
              {lang === 'en' ? 'Assign to milestone…' : 'Asignar a hito…'}
            </option>
            {hitos.map(h => (
              <option key={h.id} value={h.id}>{h.enunciado}</option>
            ))}
          </select>
        ) : (
          <div style={{
            fontSize: 12, color: 'var(--ink-3)',
            border: '1px solid var(--line)', borderRadius: 8,
            padding: '6px 10px', background: 'var(--bg-2)',
          }}>
            {lang === 'en'
              ? 'This meta has no milestones. Create a milestone first.'
              : 'Esta meta no tiene hitos. Crea un hito primero.'}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn size="sm" variant="ghost" onClick={() => { setShowForm(false); setTitle(''); setHitoId(''); }} type="button">
            {t(lang, 'cancel')}
          </Btn>
          <Btn size="sm" variant="primary" type="submit" disabled={saving || !title.trim() || !hitoId}>
            {t(lang, 'save')}
          </Btn>
        </div>
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

// ─── Empty state ──────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ViewObjetivos({
  metas: initialMetas,
  objetivos: initialObjetivos,
  tareas: initialTareas,
}) {
  const router = useRouter();
  const [lang, setLang] = useState('es');
  const [metas] = useState(initialMetas);
  const [objetivos, setObjetivos] = useState(initialObjetivos);
  const [tareas, setTareas] = useState(initialTareas);

  useEffect(() => {
    setLang(getLang());
    function handleLangChange() { setLang(getLang()); }
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
    setObjetivos((prev) => prev.map((o) => (o.id === id ? { ...o, completed: isDone } : o)));
  }, []);

  const handleMoveTask = useCallback(() => {
    router.refresh();
  }, [router]);

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
                onMoveTask={handleMoveTask}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
