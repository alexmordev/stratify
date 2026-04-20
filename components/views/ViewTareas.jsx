'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import Check from '@/components/ui/Check';
import Btn from '@/components/ui/Btn';
import Icon from '@/components/ui/Icon';
import { t } from '@/lib/i18n';
import { palById } from '@/lib/palette';
import { toggleTarea, moveTarea, createTarea } from '@/lib/actions/tareas';

const SLOT_H = 44;
const HOUR_START = 7;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function getLang() {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('lang');
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  return date.getDate();
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseSubtasks(raw) {
  if (!raw) return [];
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
}

function TaskCard({ tarea, onToggle, onDragStart, columnDate }) {
  const pal = palById(tarea.objetivo?.color ?? 'sand');
  const top = (tarea.start - HOUR_START) * SLOT_H;
  const height = Math.max(tarea.dur * SLOT_H, 22);
  const subtasks = parseSubtasks(tarea.subtasks);
  const [dragging, setDragging] = useState(false);

  const title = tarea.title;

  function handleDragStart(e) {
    setDragging(true);
    onDragStart(tarea.id);
  }

  function handleDragEnd() {
    setDragging(false);
  }

  return (
    <div
      data-testid={`task-card-${tarea.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        position: 'absolute',
        top,
        height,
        left: 4,
        right: 4,
        borderRadius: 6,
        background: pal.bg,
        color: pal.fg,
        padding: '3px 6px',
        overflow: 'hidden',
        cursor: 'grab',
        opacity: dragging ? 0.5 : tarea.done ? 0.6 : 1,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Check
          checked={tarea.done}
          onChange={() => onToggle(tarea.id)}
          size={11}
        />
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textDecoration: tarea.done ? 'line-through' : 'none',
            flex: 1,
            minWidth: 0,
          }}
        >
          {title}
        </span>
      </div>
      {subtasks.length > 0 && height >= 44 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginLeft: 15 }}>
          {subtasks.slice(0, 3).map((st, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                opacity: 0.85,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textDecoration: st.d ? 'line-through' : 'none',
              }}
            >
              {st.t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DayColumn({
  date,
  tareas,
  isToday,
  dayIndex,
  lang,
  onToggle,
  onDragStart,
  onDrop,
  onSlotClick,
}) {
  const dayKey = DAY_KEYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dayLabel = t(lang, dayKey);
  const dateNum = formatDate(date);

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    onDrop(dayIndex);
  }

  function handleColumnClick(e) {
    if (e.target.closest('[data-testid^="task-card-"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const start = HOUR_START + Math.floor((relY / SLOT_H) * 2) / 2;
    onSlotClick(dayIndex, start);
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        borderLeft: '1px solid var(--line-2)',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '6px 8px',
          textAlign: 'center',
          borderBottom: '1px solid var(--line-2)',
          background: isToday ? 'var(--ink)' : 'var(--panel)',
          color: isToday ? 'white' : 'var(--ink-3)',
          borderRadius: isToday ? '6px 6px 0 0' : 0,
        }}
      >
        <div className="mono" style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {dayLabel}
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.2, color: isToday ? 'white' : 'var(--ink)' }}>
          {dateNum}
        </div>
      </div>

      {/* Time grid */}
      <div
        data-testid={`day-column-${dayIndex}`}
        role="region"
        aria-label={`column-${dayIndex}`}
        onClick={handleColumnClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          height: (HOUR_END - HOUR_START + 1) * SLOT_H,
          background: 'var(--panel)',
          cursor: 'crosshair',
        }}
      >
        {/* Hour lines */}
        {HOURS.map((h) => (
          <div
            key={h}
            style={{
              position: 'absolute',
              top: (h - HOUR_START) * SLOT_H,
              left: 0,
              right: 0,
              borderTop: '1px solid var(--line-2)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Tasks */}
        {tareas.map((tarea) => (
          <TaskCard
            key={tarea.id}
            tarea={tarea}
            onToggle={onToggle}
            onDragStart={onDragStart}
            columnDate={date}
          />
        ))}
      </div>
    </div>
  );
}

function QuickCreateModal({ dayIndex, start, objetivos, lang, onConfirm, onCancel }) {
  const [title, setTitle] = useState('');
  const [objId, setObjId] = useState(objetivos[0]?.id ?? '');
  const [dur, setDur] = useState(1);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !objId) return;
    setSaving(true);
    try {
      await onConfirm({ objId, title: title.trim(), day: dayIndex, start, dur: Number(dur) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="quick-create-modal"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--panel)',
          borderRadius: 12,
          padding: '24px 28px',
          minWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="serif"
          style={{ fontSize: 20, fontWeight: 400, color: 'var(--ink)', margin: 0 }}
        >
          {lang === 'en' ? 'New task' : 'Nueva tarea'}
        </h3>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'en' ? 'Task title…' : 'Título…'}
          style={{
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '7px 10px',
            fontSize: 13,
            fontFamily: 'inherit',
            color: 'var(--ink)',
            background: 'var(--bg)',
            outline: 'none',
          }}
        />

        <select
          value={objId}
          onChange={(e) => setObjId(e.target.value)}
          style={{
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '7px 10px',
            fontSize: 13,
            fontFamily: 'inherit',
            color: 'var(--ink)',
            background: 'var(--bg)',
          }}
        >
          {objetivos.map((obj) => (
            <option key={obj.id} value={obj.id}>
              {obj.title}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>
            {lang === 'en' ? 'Duration (h)' : 'Duración (h)'}
          </label>
          <input
            type="number"
            value={dur}
            onChange={(e) => setDur(e.target.value)}
            min={0.5}
            max={8}
            step={0.5}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '5px 8px',
              fontSize: 13,
              fontFamily: 'inherit',
              color: 'var(--ink)',
              background: 'var(--bg)',
              width: 70,
            }}
          />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
            {lang === 'en' ? 'at' : 'a las'} {start}:00
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn variant="ghost" onClick={onCancel} type="button">
            {t(lang, 'cancel')}
          </Btn>
          <Btn variant="primary" type="submit" disabled={saving || !title.trim() || !objId}>
            {lang === 'en' ? 'Create' : 'Crear'}
          </Btn>
        </div>
      </form>
    </div>
  );
}

export default function ViewTareas({ tareas: initialTareas, objetivos }) {
  const [lang, setLang] = useState('es');
  const [view, setView] = useState('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [tareas, setTareas] = useState(initialTareas ?? []);
  const [modal, setModal] = useState(null);
  const draggingId = useRef(null);

  useEffect(() => {
    setLang(getLang());
    function handleLangChange() { setLang(getLang()); }
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function getColumns() {
    if (view === 'day') {
      return [new Date(anchorDate)];
    }
    if (view === '4d') {
      return Array.from({ length: 4 }, (_, i) => {
        const d = new Date(anchorDate);
        d.setDate(d.getDate() + i);
        return d;
      });
    }
    // week: Mon–Sun
    const weekStart = getWeekStart(anchorDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  function navigate(dir) {
    const d = new Date(anchorDate);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === '4d') d.setDate(d.getDate() + 4 * dir);
    else d.setDate(d.getDate() + 7 * dir);
    setAnchorDate(d);
  }

  function goToday() {
    setAnchorDate(new Date());
  }

  const columns = getColumns();

  function getTareasForColumn(colDate) {
    const dayOfWeek = colDate.getDay() === 0 ? 6 : colDate.getDay() - 1;
    return tareas.filter((t) => t.day === dayOfWeek);
  }

  function handleDragStart(id) {
    draggingId.current = id;
  }

  async function handleDrop(colIndex) {
    const id = draggingId.current;
    if (id == null) return;
    draggingId.current = null;

    const colDate = columns[colIndex];
    const dayOfWeek = colDate.getDay() === 0 ? 6 : colDate.getDay() - 1;

    setTareas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, day: dayOfWeek } : t))
    );

    try {
      await moveTarea(id, dayOfWeek);
    } catch {
      // revert on error — refetch not available in client component stub
    }
  }

  async function handleToggle(id) {
    setTareas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    try {
      await toggleTarea(id);
    } catch {
      setTareas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
      );
    }
  }

  function handleSlotClick(colIndex, start) {
    setModal({ colIndex, start });
  }

  async function handleModalConfirm({ objId, title, day, start, dur }) {
    const objetivo = objetivos.find((o) => o.id === objId) ?? null;
    const dayOfWeek = columns[day].getDay() === 0 ? 6 : columns[day].getDay() - 1;
    try {
      const newTarea = await createTarea({
        objId,
        title,
        title_en: title,
        day: dayOfWeek,
        start,
        dur,
        done: false,
      });
      const withObj = { ...newTarea, objetivo };
      setTareas((prev) => [...prev, withObj]);
    } catch {
      // silently fail for now
    }
    setModal(null);
  }

  const viewButtons = [
    { key: 'day', label: t(lang, 'day') },
    { key: '4d', label: t(lang, 'fourDays') },
    { key: 'week', label: t(lang, 'week') },
  ];

  return (
    <div style={{ padding: '40px 48px 80px' }}>
      <SectionHeader
        eyebrow={t(lang, 'tareasTitle')}
        title={t(lang, 'tareasTitle')}
        subtitle={t(lang, 'tareasSubtitle')}
      />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 20 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <Icon name="chev-l" size={14} />
        </Btn>
        <Btn variant="ghost" size="sm" onClick={() => navigate(1)}>
          <Icon name="chev-r" size={14} />
        </Btn>
        <Btn variant="secondary" size="sm" onClick={goToday}>
          {t(lang, 'today')}
        </Btn>
        <div style={{ flex: 1 }} />
        {viewButtons.map(({ key, label }) => (
          <Btn
            key={key}
            size="sm"
            variant={view === key ? 'primary' : 'ghost'}
            onClick={() => {
              setView(key);
              setAnchorDate(new Date());
            }}
          >
            {label}
          </Btn>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: 'flex',
          border: '1px solid var(--line-2)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--bg-2)',
        }}
      >
        {/* Hour labels sidebar */}
        <div
          style={{
            width: 44,
            flexShrink: 0,
            borderRight: '1px solid var(--line-2)',
            background: 'var(--panel)',
          }}
        >
          {/* Header spacer */}
          <div style={{ height: 49, borderBottom: '1px solid var(--line-2)' }} />
          {/* Hour slots */}
          <div style={{ position: 'relative', height: (HOUR_END - HOUR_START + 1) * SLOT_H }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="mono"
                style={{
                  position: 'absolute',
                  top: (h - HOUR_START) * SLOT_H - 7,
                  right: 4,
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  lineHeight: 1,
                  userSelect: 'none',
                }}
              >
                {h}:00
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div
          data-testid="calendar-columns"
          style={{ display: 'flex', flex: 1, minWidth: 0 }}
        >
          {columns.map((colDate, i) => (
            <DayColumn
              key={i}
              date={colDate}
              tareas={getTareasForColumn(colDate)}
              isToday={isSameDay(colDate, today)}
              dayIndex={i}
              lang={lang}
              onToggle={handleToggle}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onSlotClick={handleSlotClick}
            />
          ))}
        </div>
      </div>

      {modal && (
        <QuickCreateModal
          dayIndex={modal.colIndex}
          start={modal.start}
          objetivos={objetivos}
          lang={lang}
          onConfirm={handleModalConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
