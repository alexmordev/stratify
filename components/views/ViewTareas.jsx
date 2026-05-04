'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import Check from '@/components/ui/Check';
import Btn from '@/components/ui/Btn';
import Icon from '@/components/ui/Icon';
import { t } from '@/lib/i18n';
import { palById } from '@/lib/palette';
import { toggleTarea, moveTarea, createTarea, scheduleTarea, unscheduleTarea, updateTarea, deleteTarea } from '@/lib/actions/tareas';

const SLOT_H = 44;
const HOUR_START = 0;
const HOUR_END = 27;
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

function computeOverlapLayout(tareas) {
  const sorted = tareas
    .filter(t => t.start != null)
    .sort((a, b) => a.start - b.start);

  // Build overlap graph
  const overlaps = new Map(sorted.map(t => [t.id, new Set()]));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i], b = sorted[j];
      const aEnd = a.start + (a.dur || 1);
      const bEnd = b.start + (b.dur || 1);
      if (a.start < bEnd && aEnd > b.start) {
        overlaps.get(a.id).add(b.id);
        overlaps.get(b.id).add(a.id);
      }
    }
  }

  // Greedy column assignment (graph coloring)
  const layout = new Map();
  for (const t of sorted) {
    const usedCols = new Set(
      [...overlaps.get(t.id)].filter(id => layout.has(id)).map(id => layout.get(id).col)
    );
    let col = 0;
    while (usedCols.has(col)) col++;
    layout.set(t.id, { col });
  }

  // totalCols = max col in each overlap group + 1
  for (const t of sorted) {
    const groupCols = [...overlaps.get(t.id)]
      .filter(id => layout.has(id))
      .map(id => layout.get(id).col);
    layout.get(t.id).totalCols = Math.max(layout.get(t.id).col, ...groupCols) + 1;
  }

  return layout;
}

function TaskCard({ tarea, onToggle, onDragStart, onResize, columnDate, overlapCol = 0, overlapTotal = 1, onCardClick }) {
  const pal = palById(tarea.objetivo?.color ?? 'sand');
  const [localDur, setLocalDur] = useState(tarea.dur);
  
  useEffect(() => {
    setLocalDur(tarea.dur);
  }, [tarea.dur]);

  const top = (tarea.start - HOUR_START) * SLOT_H;
  const height = Math.max(localDur * SLOT_H, 22);
  const subtasks = parseSubtasks(tarea.subtasks);
  const [dragging, setDragging] = useState(false);

  const title = tarea.title;

  function handleDragStart(e) {
    setDragging(true);
    onDragStart(tarea.id, 'calendar', tarea.dur);
    // To allow dropping in Firefox, need to set data
    e.dataTransfer.setData('text/task', tarea.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a nicer ghost image if possible, but default is OK
  }

  function handleDragEnd() {
    setDragging(false);
  }

  function handleResizePointerDown(e) {
    e.stopPropagation();
    e.preventDefault();
    const startY = e.clientY;
    const startDur = localDur;

    function handlePointerMove(ev) {
      const deltaY = ev.clientY - startY;
      const deltaSlots = Math.round(deltaY / (SLOT_H / 2)) * 0.5; // Snap to 30 min (0.5)
      const newDur = Math.max(0.5, startDur + deltaSlots);
      setLocalDur(newDur);
    }

    function handlePointerUp(ev) {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      // Suppress the click that fires after pointerup so it doesn't
      // trigger the column's slot-click handler and open the create modal
      window.addEventListener('click', (e) => e.stopPropagation(), { capture: true, once: true });
      const deltaY = ev.clientY - startY;
      const deltaSlots = Math.round(deltaY / (SLOT_H / 2)) * 0.5;
      const newDur = Math.max(0.5, startDur + deltaSlots);
      if (newDur !== tarea.dur && onResize) {
        onResize(tarea.id, newDur);
      }
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handleCardClick(e) {
    if (onCardClick) onCardClick(tarea, { x: e.clientX, y: e.clientY });
  }

  return (
    <div
      data-testid={`task-card-${tarea.id}`}
      draggable={!tarea.done}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleCardClick}
      style={{
        position: 'absolute',
        top,
        height,
        left: `calc(${(overlapCol / overlapTotal) * 100}% + 2px)`,
        width: `calc(${(1 / overlapTotal) * 100}% - 4px)`,
        borderRadius: 6,
        background: pal.bg,
        color: pal.fg,
        padding: '3px 6px',
        overflow: 'hidden',
        cursor: tarea.done ? 'default' : 'grab',
        opacity: dragging ? 0.5 : tarea.done ? 0.6 : 1,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        userSelect: 'none',
        zIndex: dragging ? 10 : 1,
        boxShadow: dragging ? '0 8px 16px rgba(0,0,0,0.1)' : 'none',
        transition: dragging ? 'none' : 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span onClick={(e) => e.stopPropagation()}>
          <Check
            checked={tarea.done}
            onChange={() => onToggle(tarea.id)}
            size={11}
          />
        </span>
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
      
      {/* Resize handle */}
      {!tarea.done && (
        <div
          onPointerDown={handleResizePointerDown}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 10,
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 24, height: 3, borderRadius: 1.5, background: 'rgba(0,0,0,0.15)' }} />
        </div>
      )}
    </div>
  );
}

function BacklogCard({ tarea, lang, onDragStart, onDragEnd }) {
  const pal = palById(tarea.objetivo?.color ?? 'sand');
  const [dragging, setDragging] = useState(false);
  const objTitle = lang === 'en' && tarea.objetivo?.title_en
    ? tarea.objetivo.title_en
    : tarea.objetivo?.title ?? '';

  function fmtDueShort(iso) {
    if (!iso) return '—';
    const d = new Date(typeof iso === 'string' ? iso + 'T00:00:00' : iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    if (diff < 0) return lang === 'es' ? 'Vencida' : 'Overdue';
    if (diff === 0) return t(lang, 'today');
    if (diff === 1) return lang === 'es' ? 'Mañana' : 'Tomorrow';
    if (diff < 7) return `${diff}d`;
    const MONTHS_S = lang === 'es'
      ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${MONTHS_S[d.getMonth()]}`;
  }

  const dueLabel = fmtDueShort(tarea.dueDate);
  const isOverdue = dueLabel === (lang === 'es' ? 'Vencida' : 'Overdue');

  return (
    <div
      draggable
      onDragStart={(e) => {
        setDragging(true);
        onDragStart(tarea.id, 'backlog', tarea.dur);
        e.dataTransfer.setData('text/task', tarea.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd();
      }}
      style={{
        background: 'white',
        border: '1px solid var(--line-2)',
        borderLeft: `3px solid ${pal.dot}`,
        borderRadius: 8,
        padding: '8px 10px',
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="drag" size={11} />
        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tarea.title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: pal.dot, display: 'block', flexShrink: 0 }} />
        <span style={{ fontSize: 10.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {objTitle}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div title={t(lang, 'pomodoro')} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {Array.from({ length: Math.min(tarea.sessions ?? 0, 6) }).map((_, i) => (
            <span key={i} style={{ width: 3, height: 9, borderRadius: 1, background: pal.dot, opacity: 0.55 }} />
          ))}
          <span className="mono" style={{ fontSize: 10, marginLeft: 3, color: 'var(--ink-3)' }}>
            {tarea.sessions ?? 0}×25
          </span>
        </div>
        <span style={{ flex: 1 }} />
        <span className="mono" style={{ fontSize: 10, color: isOverdue ? 'oklch(0.55 0.16 25)' : 'var(--ink-3)' }}>
          {dueLabel}
        </span>
      </div>
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
  onResize,
  onSlotClick,
  onCardClick,
  dropHint,
  setDropHint,
  draggingDur,
}) {
  const dayKey = DAY_KEYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dayLabel = t(lang, dayKey);
  const dateNum = formatDate(date);

  function handleColumnClick(e) {
    if (e.target.closest('[data-testid^="task-card-"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const start = HOUR_START + Math.floor((relY / SLOT_H) * 2) / 2;
    onSlotClick(dayIndex, start, { x: e.clientX, y: e.clientY });
  }

  function handleTimeGridDragOver(e) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = Math.max(0, e.clientY - rect.top);
    const hour = Math.max(HOUR_START, Math.min(HOUR_END, HOUR_START + Math.floor(relY / SLOT_H)));
    setDropHint({ day: dayIndex, hour });
  }

  function handleTimeGridDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropHint(prev => (prev?.day === dayIndex ? null : prev));
    }
  }

  function handleTimeGridDrop(e) {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = Math.max(0, e.clientY - rect.top);
    const hour = Math.max(HOUR_START, Math.min(HOUR_END, HOUR_START + Math.floor(relY / SLOT_H)));
    const snapped = Math.round(hour * 2) / 2;
    onDrop(dayIndex, snapped);
    setDropHint(null);
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
        onDragOver={handleTimeGridDragOver}
        onDragLeave={handleTimeGridDragLeave}
        onDrop={handleTimeGridDrop}
        style={{
          position: 'relative',
          height: (HOUR_END - HOUR_START + 1) * SLOT_H,
          background: 'var(--panel)',
          cursor: 'crosshair',
        }}
      >
        {/* Drop hint highlight */}
        {dropHint?.day === dayIndex && dropHint.hour !== undefined && (
          <div
            style={{
              position: 'absolute',
              top: (dropHint.hour - HOUR_START) * SLOT_H,
              left: 4,
              right: 4,
              height: (draggingDur || 1) * SLOT_H,
              background: 'oklch(0.95 0.05 250 / 0.5)',
              border: '2px dashed oklch(0.8 0.1 250)',
              pointerEvents: 'none',
              zIndex: 5,
              borderRadius: 6,
              boxSizing: 'border-box',
            }}
          />
        )}

        {/* Hour lines */}
        {HOURS.map((h) => (
          <div
            key={h}
            style={{
              position: 'absolute',
              top: (h - HOUR_START) * SLOT_H,
              left: 0,
              right: 0,
              borderTop: h === 24 ? '2px solid var(--line)' : '1px solid var(--line-2)',
              pointerEvents: 'none',
              zIndex: h === 24 ? 2 : 0,
            }}
          />
        ))}

        {/* Tasks */}
        {(() => {
          const layout = computeOverlapLayout(tareas);
          return tareas.map((tarea) => {
            const ol = layout.get(tarea.id) ?? { col: 0, totalCols: 1 };
            return (
              <TaskCard
                key={tarea.id}
                tarea={tarea}
                onToggle={onToggle}
                onDragStart={onDragStart}
                onResize={onResize}
                columnDate={date}
                overlapCol={ol.col}
                overlapTotal={ol.totalCols}
                onCardClick={onCardClick}
              />
            );
          });
        })()}
      </div>
    </div>
  );
}

function TaskDetailPanel({ tarea, lang, position, onClose, onUpdate, onDelete }) {
  const [title, setTitle] = useState(tarea.title);
  const [dur, setDur] = useState(tarea.dur);
  const [saving, setSaving] = useState(false);

  const pal = palById(tarea.objetivo?.color ?? 'sand');
  const objTitle = lang === 'en' && tarea.objetivo?.title_en
    ? tarea.objetivo.title_en
    : tarea.objetivo?.title ?? '';
  const subtasks = parseSubtasks(tarea.subtasks);
  const sessions = Math.max(1, Math.round(dur * 2));
  const fmt = (h) => h != null
    ? `${String(Math.floor(h) % 24).padStart(2, '0')}:${h % 1 === 0.5 ? '30' : '00'}`
    : '—';
  const DAY_LABELS = lang === 'es'
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayLabel = tarea.day != null ? DAY_LABELS[tarea.day] : '—';

  useEffect(() => {
    setTitle(tarea.title);
    setDur(tarea.dur);
  }, [tarea.id]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave() {
    if (!title.trim() || saving) return;
    const newSessions = Math.max(1, Math.round(dur * 2));
    setSaving(true);
    try {
      await onUpdate(tarea.id, { title: title.trim(), title_en: title.trim(), dur, sessions: newSessions });
    } finally {
      setSaving(false);
    }
  }

  const PANEL_W = 308;
  const panelPos = position
    ? {
        left: Math.min(position.x + 12, window.innerWidth - PANEL_W - 20),
        top: Math.min(position.y - 20, window.innerHeight - 460),
      }
    : { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          ...panelPos,
          width: PANEL_W,
          background: 'var(--bg)',
          borderRadius: 12,
          border: '1px solid var(--line)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 3, background: pal.dot, flexShrink: 0 }} />

        {/* Title + close */}
        <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            style={{
              flex: 1,
              border: 'none',
              borderBottom: `2px solid ${title !== tarea.title ? pal.dot : 'var(--line)'}`,
              padding: '2px 0 5px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              color: 'var(--ink)',
              background: 'transparent',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-4)', padding: 2, flexShrink: 0 }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Objective + time */}
        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: pal.dot, display: 'block', flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {objTitle}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={12} style={{ color: 'var(--ink-4)' }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {dayLabel} · {fmt(tarea.start)} – {fmt((tarea.start ?? 0) + dur)}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-4)', marginRight: 2, flexShrink: 0 }}>
              {lang === 'en' ? 'Duration' : 'Duración'}
            </span>
            {[0.5, 1, 1.5, 2, 3, 4].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDur(d)}
                style={{
                  border: 'none',
                  background: dur === d ? 'var(--ink)' : 'var(--bg-2)',
                  color: dur === d ? 'white' : 'var(--ink-3)',
                  borderRadius: 6,
                  padding: '3px 7px',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: dur === d ? 600 : 400,
                  transition: 'all 0.1s',
                }}
              >
                {d}h
              </button>
            ))}
          </div>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>
            {sessions} {lang === 'en'
              ? `session${sessions !== 1 ? 's' : ''} × 25 min`
              : `sesión${sessions !== 1 ? 'es' : ''} × 25 min`}
          </span>
        </div>

        {/* Subtasks */}
        {subtasks.length > 0 && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line-2)', maxHeight: 130, overflowY: 'auto' }}>
            <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {lang === 'en' ? 'Subtasks' : 'Subtareas'} · {subtasks.filter(s => s.d).length}/{subtasks.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {subtasks.map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: 3,
                    border: `1.5px solid ${st.d ? pal.dot : 'var(--line)'}`,
                    background: st.d ? pal.bg : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {st.d && <Icon name="check" size={7} style={{ color: pal.fg }} />}
                  </span>
                  <span style={{
                    fontSize: 12, color: st.d ? 'var(--ink-4)' : 'var(--ink-2)',
                    textDecoration: st.d ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {st.t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          padding: '10px 14px 14px',
          borderTop: '1px solid var(--line-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <button
            type="button"
            onClick={() => onDelete(tarea.id)}
            title={lang === 'en' ? 'Delete task' : 'Eliminar tarea'}
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: 'var(--ink-4)', padding: '4px 6px', borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
          >
            <Icon name="trash" size={14} />
          </button>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid var(--line)', background: 'transparent',
              color: 'var(--ink-3)', borderRadius: 8, padding: '5px 14px',
              fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t(lang, 'cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim()}
            style={{
              border: 'none',
              background: !title.trim() ? 'var(--line)' : 'var(--ink)',
              color: !title.trim() ? 'var(--ink-4)' : 'white',
              borderRadius: 8, padding: '5px 14px',
              fontSize: 12.5, fontWeight: 500,
              cursor: !title.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background 0.1s',
            }}
          >
            {saving ? '…' : (lang === 'en' ? 'Save' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickCreateModal({ dayIndex, start, position, objetivos, lang, onConfirm, onCancel }) {
  const [title, setTitle] = useState('');
  const [objId, setObjId] = useState(objetivos[0]?.id ?? '');
  const [dur, setDur] = useState(1);
  const [saving, setSaving] = useState(false);

  const selectedObj = objetivos.find((o) => o.id === objId);
  const pal = palById(selectedObj?.color ?? 'sand');

  const CARD_W = 308;
  const cardPos = position
    ? {
        left: Math.min(position.x + 12, window.innerWidth - CARD_W - 20),
        top: Math.min(position.y - 16, window.innerHeight - 300),
      }
    : { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' };

  const fmt = (h) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${h % 1 === 0.5 ? '30' : '00'}`;

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
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          ...cardPos,
          width: CARD_W,
          background: 'var(--bg)',
          borderRadius: 12,
          border: '1px solid var(--line)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 3, background: pal.dot, flexShrink: 0 }} />

        {/* Title input */}
        <div style={{ padding: '14px 16px 6px' }}>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onCancel()}
            placeholder={lang === 'en' ? 'Task title' : 'Título de la tarea'}
            style={{
              border: 'none',
              borderBottom: `2px solid ${title ? pal.dot : 'var(--line)'}`,
              padding: '2px 0 7px',
              fontSize: 15,
              fontWeight: 500,
              fontFamily: 'inherit',
              color: 'var(--ink)',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* Time range */}
        <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={11} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {fmt(start)} – {fmt(start + dur)}
          </span>
        </div>

        {/* Objective chips */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--line-2)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 5,
        }}>
          {objetivos.slice(0, 8).map((obj) => {
            const p = palById(obj.color ?? 'sand');
            const sel = objId === obj.id;
            return (
              <button
                key={obj.id}
                type="button"
                onClick={() => setObjId(obj.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  border: `1px solid ${sel ? p.dot : 'var(--line)'}`,
                  background: sel ? p.bg : 'transparent',
                  color: sel ? p.fg : 'var(--ink-3)',
                  borderRadius: 999,
                  padding: '3px 9px',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.1s',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot, flexShrink: 0, display: 'block' }} />
                {lang === 'en' && obj.title_en ? obj.title_en : obj.title}
              </button>
            );
          })}
        </div>

        {/* Duration quick-select */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--line-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <span style={{ fontSize: 11, color: 'var(--ink-4)', marginRight: 2, flexShrink: 0 }}>
            {lang === 'en' ? 'Duration' : 'Duración'}
          </span>
          {[0.5, 1, 1.5, 2, 3].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDur(d)}
              style={{
                border: 'none',
                background: dur === d ? 'var(--ink)' : 'var(--bg-2)',
                color: dur === d ? 'white' : 'var(--ink-3)',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: dur === d ? 600 : 400,
                transition: 'all 0.1s',
              }}
            >
              {d}h
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{
          padding: '10px 16px 14px',
          borderTop: '1px solid var(--line-2)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-3)',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t(lang, 'cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !objId}
            style={{
              border: 'none',
              background: !title.trim() || !objId ? 'var(--line)' : 'var(--ink)',
              color: !title.trim() || !objId ? 'var(--ink-4)' : 'white',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12.5,
              fontWeight: 500,
              cursor: !title.trim() || !objId ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.1s',
            }}
          >
            {saving ? '…' : (lang === 'en' ? 'Create' : 'Crear')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ViewTareas({ tareas: initialTareas, objetivos, metas = [] }) {
  const [lang, setLang] = useState('es');
  const [view, setView] = useState('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [tareas, setTareas] = useState(initialTareas ?? []);
  const [modal, setModal] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [dropHint, setDropHint] = useState(null);
  const [filterObj, setFilterObj] = useState('all');
  const draggingId = useRef(null);
  const draggingSource = useRef(null);
  const draggingDur = useRef(1);

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

  // Derived backlog data
  const activeMetaIds = new Set(metas.filter(m => m.active).map(m => m.id));
  const activeObjetivos = objetivos.filter(o => activeMetaIds.has(o.metaId) && o.thisWeek);
  const activeObjIds = new Set(activeObjetivos.map(o => o.id));

  const backlog = tareas
    .filter(t => (t.day === null || t.day === undefined) && !t.done)
    .filter(t => filterObj === 'all' ? activeObjIds.has(t.objId) : t.objId === filterObj)
    .sort((a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return ad - bd;
    });

  function getTareasForColumn(colDate) {
    const dayOfWeek = colDate.getDay() === 0 ? 6 : colDate.getDay() - 1;
    return tareas.filter((t) => t.day === dayOfWeek);
  }

  function handleDragStart(id, source, dur = 1) {
    draggingId.current = id;
    draggingSource.current = source;
    draggingDur.current = dur;
  }

  function handleDragEnd() {
    // Reset if drop didn't fire (e.g. dropped outside)
  }

  async function handleDrop(colIndex, hour) {
    const id = draggingId.current;
    if (id == null) return;
    draggingId.current = null;
    draggingSource.current = null;
    setDropHint(null);

    const colDate = columns[colIndex];
    const dayOfWeek = colDate.getDay() === 0 ? 6 : colDate.getDay() - 1;

    if (hour != null) {
      setTareas(prev => prev.map(t => t.id === id ? { ...t, day: dayOfWeek, start: hour } : t));
      try { await scheduleTarea(id, dayOfWeek, hour); } catch { }
    } else {
      setTareas(prev => prev.map(t => t.id === id ? { ...t, day: dayOfWeek } : t));
      try { await moveTarea(id, dayOfWeek); } catch { }
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

  async function handleResize(id, newDur) {
    const newSessions = Math.max(1, Math.round(newDur * 2));
    setTareas(prev => prev.map(t => t.id === id ? { ...t, dur: newDur, sessions: newSessions } : t));
    try {
      await updateTarea(id, { dur: newDur, sessions: newSessions });
    } catch {
      // Could rollback on error
    }
  }

  function handleSlotClick(colIndex, start, position) {
    setDetailTask(null);
    setModal({ colIndex, start, position: position ?? null });
  }

  function handleTaskClick(tarea, position) {
    setModal(null);
    setDetailTask({ tareaId: tarea.id, position });
  }

  async function handleTaskUpdate(id, data) {
    setTareas(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    setDetailTask(null);
    try { await updateTarea(id, data); } catch {}
  }

  async function handleTaskDelete(id) {
    setTareas(prev => prev.filter(t => t.id !== id));
    setDetailTask(null);
    try { await deleteTarea(id); } catch {}
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 14px', borderBottom: '1px solid var(--line-2)', flexShrink: 0, background: 'var(--bg)' }}>
        {(() => {
          const weekStart = view === 'week' ? getWeekStart(anchorDate) : new Date(anchorDate);
          const weekEnd = new Date(weekStart);
          if (view !== 'day') weekEnd.setDate(weekStart.getDate() + (view === '4d' ? 3 : 6));
          const MONTHS_SHORT_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const ms = lang === 'es' ? MONTHS_SHORT_ES : MONTHS_SHORT_EN;
          const rangeLabel = view === 'day'
            ? `${weekStart.getDate()} ${ms[weekStart.getMonth()]}`
            : `${weekStart.getDate()} ${ms[weekStart.getMonth()]} – ${weekEnd.getDate()} ${ms[weekEnd.getMonth()]}`;
          const completedCount = tareas.filter(t => t.done).length;
          const scheduledTotal = tareas.filter(t => t.day != null).length;
          return (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
              <div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8, color: 'var(--ink-3)' }}>
                  {t(lang, 'weekOf')} {rangeLabel}
                </div>
                <h1 className="serif" style={{ fontStyle: 'italic', fontWeight: 500, fontSize: 28, margin: 0, letterSpacing: '-0.01em' }}>
                  {t(lang, 'tareasTitle')}
                </h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {completedCount}/{scheduledTotal} {t(lang, 'tasksDone')}
                </span>
                <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
                <button
                  onClick={goToday}
                  style={{ border: '1px solid var(--line)', background: 'white', borderRadius: 7, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--ink-2)', fontFamily: 'inherit' }}
                >
                  {t(lang, 'today')}
                </button>
                <div style={{ display: 'flex', gap: 0 }}>
                  <button onClick={() => navigate(-1)} style={{ border: '1px solid var(--line)', borderRight: 'none', background: 'white', borderRadius: '7px 0 0 7px', padding: '5px 8px', cursor: 'pointer', color: 'var(--ink-2)' }}>
                    <Icon name="chev-l" size={13} />
                  </button>
                  <button onClick={() => navigate(1)} style={{ border: '1px solid var(--line)', background: 'white', borderRadius: '0 7px 7px 0', padding: '5px 8px', cursor: 'pointer', color: 'var(--ink-2)' }}>
                    <Icon name="chev-r" size={13} />
                  </button>
                </div>
                <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
                <div style={{ display: 'flex', border: '1px solid var(--line)', borderRadius: 7, padding: 2, background: 'white' }}>
                  {[['day', t(lang, 'day')], ['4d', t(lang, 'fourDays')], ['week', t(lang, 'week')]].map(([k, l]) => (
                    <button key={k} onClick={() => { setView(k); setAnchorDate(new Date()); }}
                      style={{
                        border: 'none', background: view === k ? 'var(--ink)' : 'transparent',
                        color: view === k ? 'white' : 'var(--ink-2)',
                        padding: '4px 10px', borderRadius: 5, fontSize: 12, cursor: 'pointer',
                        fontWeight: view === k ? 500 : 400, fontFamily: 'inherit',
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Body: calendar + backlog sidebar */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Calendar */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--panel)' }}>
          <div
            style={{
              display: 'flex',
              border: '1px solid var(--line-2)',
              borderRadius: 0,
              overflow: 'hidden',
              background: 'var(--bg-2)',
              minHeight: '100%',
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
                  <div key={h} style={{ position: 'absolute', top: (h - HOUR_START) * SLOT_H - 7, right: 0, left: 0 }}>
                    {h === 24 && (
                      <div style={{
                        position: 'absolute',
                        top: 7,
                        left: 0,
                        right: 0,
                        height: 1,
                        background: 'var(--line)',
                        opacity: 0.6,
                      }} />
                    )}
                    <span
                      className="mono"
                      style={{
                        position: 'absolute',
                        right: 4,
                        fontSize: 11,
                        color: h >= 24 ? 'var(--ink-3)' : 'var(--ink-4)',
                        lineHeight: 1,
                        userSelect: 'none',
                      }}
                    >
                      {String(h % 24).padStart(2, '0')}:00
                    </span>
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
                  onResize={handleResize}
                  onSlotClick={handleSlotClick}
                  onCardClick={handleTaskClick}
                  dropHint={dropHint}
                  setDropHint={setDropHint}
                  draggingDur={draggingDur.current}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right backlog sidebar */}
        <aside
          style={{
            width: 296,
            flexShrink: 0,
            borderLeft: '1px solid var(--line-2)',
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const id = draggingId.current;
            const source = draggingSource.current;
            if (id && source === 'calendar') {
              setTareas(prev => prev.map(t => t.id === id ? { ...t, day: null, start: null } : t));
              unscheduleTarea(id).catch(() => {});
            }
            draggingId.current = null;
            draggingSource.current = null;
            setDropHint(null);
          }}
        >
          {/* Sidebar header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--line-2)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="checkbox" size={14} />
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, flex: 1, color: 'var(--ink)' }}>
                {t(lang, 'backlog')}
              </h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{backlog.length}</span>
            </div>
            <p style={{ fontSize: 11.5, margin: '4px 0 10px', lineHeight: 1.4, color: 'var(--ink-3)' }}>
              {t(lang, 'backlogSub')}
            </p>
            {/* Filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <button
                type="button"
                onClick={() => setFilterObj('all')}
                style={{
                  border: 'none',
                  background: filterObj === 'all' ? 'var(--ink)' : 'white',
                  color: filterObj === 'all' ? 'white' : 'var(--ink-2)',
                  borderRadius: 999, padding: '3px 9px', fontSize: 11, cursor: 'pointer',
                  boxShadow: filterObj === 'all' ? 'none' : 'inset 0 0 0 1px var(--line)',
                  fontFamily: 'inherit',
                }}
              >
                {t(lang, 'allObjectives')}
              </button>
              {activeObjetivos.map(o => {
                const pal = palById(o.color);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setFilterObj(o.id)}
                    style={{
                      border: 'none',
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: filterObj === o.id ? 'var(--ink)' : 'white',
                      color: filterObj === o.id ? 'white' : 'var(--ink-2)',
                      borderRadius: 999, padding: '3px 9px', fontSize: 11, cursor: 'pointer',
                      boxShadow: filterObj === o.id ? 'none' : 'inset 0 0 0 1px var(--line)',
                      maxWidth: 160, fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: pal.dot, display: 'block', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lang === 'en' && o.title_en ? o.title_en : o.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task list */}
          <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {backlog.map(tarea => (
              <BacklogCard
                key={tarea.id}
                tarea={tarea}
                lang={lang}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            ))}
            {backlog.length === 0 && (
              <div style={{
                padding: '24px 12px', textAlign: 'center',
                border: '1px dashed var(--line)', borderRadius: 10,
                color: 'var(--ink-4)', fontSize: 12,
              }}>
                {lang === 'es'
                  ? 'Bandeja vacía. Arrastra una tarea aquí para devolverla.'
                  : 'Inbox empty. Drag a task here to send it back.'}
              </div>
            )}
          </div>

          {/* Add task footer */}
          <div style={{ padding: 12, borderTop: '1px solid var(--line-2)', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setModal({ colIndex: 0, start: 9 })}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 10px', border: '1px dashed var(--line)', borderRadius: 8,
                background: 'transparent', color: 'var(--ink-2)', fontSize: 12.5, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon name="plus" size={13} /> {t(lang, 'addTask')}
            </button>
          </div>
        </aside>
      </div>

      {modal && (
        <QuickCreateModal
          dayIndex={modal.colIndex}
          start={modal.start}
          position={modal.position}
          objetivos={activeObjetivos}
          lang={lang}
          onConfirm={handleModalConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      {detailTask && (() => {
        const currentTarea = tareas.find(t => t.id === detailTask.tareaId);
        if (!currentTarea) return null;
        return (
          <TaskDetailPanel
            tarea={currentTarea}
            position={detailTask.position}
            lang={lang}
            onClose={() => setDetailTask(null)}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />
        );
      })()}
    </div>
  );
}
