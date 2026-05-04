'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Donut from '@/components/ui/Donut';
import ProgressBar from '@/components/ui/ProgressBar';
import ColorDot from '@/components/ui/ColorDot';
import Check from '@/components/ui/Check';
import Switch from '@/components/ui/Switch';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import { t } from '@/lib/i18n';
import { PALETTE, palById } from '@/lib/palette';
import { toggleMetaActive, createMeta, updateMetaColor } from '@/lib/actions/metas';
import { createObjetivo, updateObjetivo, deleteObjetivo, toggleObjetivoThisWeek, toggleObjetivoCompleted } from '@/lib/actions/objetivos';
import { toggleTarea, reorderTareas, unscheduleTarea, createTarea, updateTarea, deleteTarea } from '@/lib/actions/tareas';
import { toggleHitoDone, createHito, updateHito } from '@/lib/actions/hitos';
import NewMetaForm from '@/components/modals/NewMetaForm';
import WizardAgent from '@/components/modals/WizardAgent';
import GenerateObjetivosModal from '@/components/modals/GenerateObjetivosModal';
import TaskItem from '@/components/views/TaskItem';
import NewTaskForm from '@/components/views/NewTaskForm';

function getLang() {
  if (typeof window === 'undefined') return 'es';
  const stored = localStorage.getItem('lang');
  return stored === 'en' || stored === 'es' ? stored : 'es';
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthShort(lang, idx) {
  return (lang === 'es' ? MONTHS_ES : MONTHS_EN)[idx] ?? '';
}

function getWeekStart(d = new Date()) {
  const x = new Date(d); x.setHours(0,0,0,0);
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtWeekRange(lang) {
  const start = getWeekStart();
  const end = addDays(start, 6);
  const mStart = getMonthShort(lang, start.getMonth());
  const mEnd = getMonthShort(lang, end.getMonth());
  return `${start.getDate()} ${mStart} – ${end.getDate()} ${mEnd}`;
}

function fmtDue(iso, lang) {
  if (!iso) return '—';
  const d = new Date(typeof iso === 'string' ? iso + 'T00:00:00' : iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0)  return t(lang, 'dueOverdue');
  if (diff === 0) return t(lang, 'dueToday');
  if (diff === 1) return t(lang, 'dueTomorrow');
  if (diff < 7)  return `${t(lang, 'dueIn')} ${diff}d`;
  return `${d.getDate()} ${getMonthShort(lang, d.getMonth())}`;
}

function sortTasks(arr, mode) {
  const a = [...arr];
  const doneLast = (x, y) => (x.done ? 1 : 0) - (y.done ? 1 : 0);
  if (mode === 'due') a.sort((x, y) => {
    const dd = doneLast(x, y);
    if (dd !== 0) return dd;
    const xd = x.dueDate ? new Date(x.dueDate).getTime() : Infinity;
    const yd = y.dueDate ? new Date(y.dueDate).getTime() : Infinity;
    return xd - yd;
  });
  else if (mode === 'load') a.sort((x, y) => doneLast(x, y) || (y.sessions ?? 0) - (x.sessions ?? 0));
  else a.sort((x, y) => doneLast(x, y) || (x.sortOrder ?? 0) - (y.sortOrder ?? 0));
  return a;
}

function CollapseSection({ open, onToggle, label, count, action, sub, children }) {
  return (
    <section>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 0 14px', borderBottom: '1px solid var(--line-2)',
        marginBottom: 16,
      }}>
        <button
          type="button"
          onClick={onToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: 'none', background: 'transparent', cursor: 'pointer',
            padding: 0, color: 'var(--ink)',
          }}
        >
          <span style={{ display: 'inline-flex', transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .15s ease' }}>
            <Icon name="chev-d" size={14} />
          </span>
          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}>{label}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{count}</span>
        </button>
        {sub && <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>· {sub}</span>}
        <span style={{ flex: 1 }} />
        {action}
      </div>
      {open && children}
    </section>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {PALETTE.map(p => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          title={p.id}
          style={{
            width: 18, height: 18, borderRadius: '50%', padding: 0,
            background: p.dot, cursor: 'pointer', flexShrink: 0,
            border: value === p.id ? '2px solid var(--ink)' : '2px solid transparent',
            outline: value === p.id ? `2px solid ${p.dot}` : 'none',
            outlineOffset: 2,
            transition: 'outline .1s, border .1s',
          }}
        />
      ))}
    </div>
  );
}

function MetaRow({ meta, isSelected, pct, lang, onSelect }) {
  const pal = palById(meta.color ?? 'sand');
  const title = lang === 'en' && meta.title_en ? meta.title_en : meta.title;

  return (
    <button
      type="button"
      onClick={() => onSelect(meta.id)}
      style={{
        width: '100%', textAlign: 'left',
        display: 'grid', gridTemplateColumns: '8px 1fr', gap: 10,
        alignItems: 'start', padding: '10px 12px',
        border: 'none', cursor: 'pointer',
        background: isSelected ? pal.bg : 'transparent',
        borderLeft: isSelected ? `2px solid ${pal.dot}` : '2px solid transparent',
        paddingLeft: isSelected ? 10 : 12,
        transition: 'background .12s ease',
      }}
    >
      <span
        className={meta.active ? 'pulse' : ''}
        style={{
          width: 7, height: 7, borderRadius: '50%', marginTop: 7,
          display: 'block', flexShrink: 0,
          background: meta.active ? pal.dot : 'var(--ink-4)',
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: isSelected ? 500 : 400,
          color: meta.active ? 'var(--ink)' : 'var(--ink-3)',
          lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar value={pct} color={meta.active ? pal.dot : 'var(--ink-4)'} height={2} />
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{pct}%</span>
        </div>
      </div>
    </button>
  );
}

function ObjetivoWeekRow({ objetivo, isSelected, allTareas, lang, onSelect }) {
  const pal = palById(objetivo.color);
  const tks = allTareas.filter(t => t.objId === objetivo.id);
  const done = tks.filter(t => t.done).length;
  const pct = tks.length ? Math.round((done / tks.length) * 100) : 0;
  const title = lang === 'en' && objetivo.title_en ? objetivo.title_en : objetivo.title;

  return (
    <button
      type="button"
      onClick={() => onSelect(objetivo.metaId)}
      style={{
        width: '100%', textAlign: 'left',
        display: 'grid', gridTemplateColumns: '8px 1fr', gap: 10,
        alignItems: 'start', padding: '8px 12px',
        border: 'none', cursor: 'pointer',
        background: isSelected ? 'var(--panel)' : 'transparent',
        borderLeft: isSelected ? `2px solid ${pal.dot}` : '2px solid transparent',
        paddingLeft: isSelected ? 10 : 12,
        transition: 'background .12s ease',
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: '50%', marginTop: 6,
        display: 'block', flexShrink: 0,
        background: pal.dot,
      }} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: isSelected ? 500 : 400,
          color: 'var(--ink)', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {title}
        </div>
        {tks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <div style={{ flex: 1 }}>
              <ProgressBar value={pct} color={pal.dot} height={2} />
            </div>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{done}/{tks.length}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function ObjectiveCard({ objetivo, allTareas, lang, onTaskToggle, onTaskUnschedule, onReorder, onThisWeekToggle, onDone, onEdit, onDelete, onCreateTask, onUpdateTask, onDeleteTask }) {
  const [isOpen, setIsOpen] = useState(true);
  const [sortMode, setSortMode] = useState('order');
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newTaskObjId, setNewTaskObjId] = useState(null);

  function startCreateTask(objId) {
    setNewTaskObjId(objId);
  }

  function cancelCreateTask() {
    setNewTaskObjId(null);
  }

  async function saveNewTask(title) {
    if (!newTaskObjId) return;
    try {
      await onCreateTask(newTaskObjId, title);
      setNewTaskObjId(null);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  const pal = palById(objetivo.color);
  const isDone = Boolean(objetivo.done);
  const tks = allTareas.filter(t => t.objId === objetivo.id);
  const doneTks = tks.filter(t => t.done).length;
  const totalSes = tks.reduce((s, t) => s + (t.sessions ?? 0), 0);
  const doneSes = tks.filter(t => t.done).reduce((s, t) => s + (t.sessions ?? 0), 0);
  const pct = tks.length ? Math.round((doneTks / tks.length) * 100) : 0;
  const sorted = sortTasks(tks, sortMode);

  const title = lang === 'en' && objetivo.title_en ? objetivo.title_en : objetivo.title;

  function startEdit() {
    setEditValue(title);
    setEditing(true);
  }

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) onEdit?.(objetivo.id, trimmed);
    setEditing(false);
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') setEditing(false);
  }

  const DAY_LABELS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const DAY_LABELS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dayLabels = lang === 'es' ? DAY_LABELS_ES : DAY_LABELS_EN;

  function handleDragStart(e, taskId) {
    setDragId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/task', taskId);
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOver(null);
  }

  function handleDropZone(e, beforeIdx) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/task') || dragId;
    if (id && onReorder) {
      onReorder(id, objetivo.id, beforeIdx);
    }
    setDragId(null);
    setDragOver(null);
  }

  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--line-2)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 14px 10px', opacity: isDone ? 0.6 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <ColorDot color={pal.dot} size={9} />
          {editing ? (
            <input
              autoFocus
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={commitEdit}
              style={{
                flex: 1, fontSize: 13.5, fontWeight: 500,
                border: 'none', borderBottom: `1px solid ${pal.dot}`,
                background: 'transparent', outline: 'none', padding: '0 2px',
                fontFamily: 'inherit', color: 'var(--ink)',
              }}
            />
          ) : (
            <div style={{
              flex: 1, fontSize: 13.5, fontWeight: 500,
              textDecoration: isDone ? 'line-through' : 'none',
              color: isDone ? 'var(--ink-3)' : 'var(--ink)',
            }}>
              {title}
            </div>
          )}
          {!editing && (
            <button
              type="button"
              title={lang === 'es' ? 'Editar' : 'Edit'}
              onClick={startEdit}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-4)', padding: 2, display: 'flex', alignItems: 'center' }}
            >
              <Icon name="edit" size={12} />
            </button>
          )}
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {doneSes}/{totalSes} {t(lang, 'sessionShort')}
          </span>
          <button
            type="button"
            title={isDone ? (lang === 'es' ? 'Reabrir objetivo' : 'Reopen objective') : (lang === 'es' ? 'Marcar completado' : 'Mark complete')}
            onClick={() => onDone?.(objetivo.id)}
            style={{
              border: isDone ? `1px solid oklch(0.62 0.14 145)` : '1px solid var(--line)',
              background: isDone ? 'oklch(0.94 0.05 145)' : 'transparent',
              color: isDone ? 'oklch(0.42 0.12 145)' : 'var(--ink-4)',
              borderRadius: 6, padding: '3px 5px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Icon name="check" size={13} />
          </button>
          <button
            type="button"
            title={objetivo.thisWeek ? (lang === 'es' ? 'Quitar de esta semana' : 'Remove from this week') : (lang === 'es' ? 'Trabajar esta semana' : 'Work this week')}
            onClick={() => onThisWeekToggle?.(objetivo.id)}
            style={{
              border: objetivo.thisWeek ? `1px solid ${pal.dot}` : '1px solid transparent',
              background: objetivo.thisWeek ? pal.bg : 'transparent',
              color: objetivo.thisWeek ? pal.dot : 'var(--ink-4)',
              borderRadius: 6, padding: '3px 5px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <Icon name="calendar" size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(v => !v)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 2 }}
          >
            <span style={{ display: 'inline-flex', transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s ease' }}>
              <Icon name="chev-d" size={14} />
            </span>
          </button>
          {confirmDelete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                {lang === 'es' ? '¿Eliminar?' : 'Delete?'}
              </span>
              <button
                type="button"
                onClick={() => { setConfirmDelete(false); onDelete?.(objetivo.id); }}
                style={{ border: 'none', background: 'oklch(0.6 0.18 25)', color: 'white', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 11 }}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{ border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-3)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 11 }}
              >
                ✗
              </button>
            </div>
          ) : (
            <button
              type="button"
              title={lang === 'es' ? 'Eliminar objetivo' : 'Delete objective'}
              onClick={() => setConfirmDelete(true)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-4)', padding: 2, display: 'flex', alignItems: 'center' }}
            >
              <Icon name="trash" size={12} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar value={pct} color={pal.dot} track={pal.bg} height={3} />
          </div>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', minWidth: 46, textAlign: 'right' }}>
            {doneTks}/{tks.length}
          </span>
        </div>
      </div>

      {isOpen && (
        <div style={{ borderTop: '1px solid var(--line-2)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderBottom: '1px solid var(--line-2)', background: 'var(--bg-2)',
          }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              {t(lang, 'sortBy')}
            </span>
            {[['order', t(lang,'sortManual')], ['due', t(lang,'sortDue')], ['load', t(lang,'sortLoad')]].map(([k, lab]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSortMode(k)}
                style={{
                  border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11,
                  background: sortMode === k ? 'white' : 'transparent',
                  color: sortMode === k ? 'var(--ink)' : 'var(--ink-3)',
                  cursor: 'pointer',
                  boxShadow: sortMode === k ? '0 0 0 1px var(--line)' : 'none',
                }}
              >{lab}</button>
            ))}
            <span style={{ flex: 1 }} />
            {sortMode === 'order' && (
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{t(lang, 'dragHint')}</span>
            )}
          </div>

          {sorted.map((task, idx) => {
            const isDragging = dragId === task.id;
            const isDropBefore = dragOver?.beforeIdx === idx;

            return (
              <div key={task.id}>
                {sortMode === 'order' && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver({ beforeIdx: idx }); }}
                    onDrop={(e) => handleDropZone(e, idx)}
                    style={{
                      height: isDropBefore ? 16 : 3,
                      background: isDropBefore ? pal.dot : 'transparent',
                      transition: 'height .12s ease',
                      margin: isDropBefore ? '0 14px' : 0,
                      borderRadius: 2,
                    }}
                  />
                )}
                <TaskItem
                  task={task}
                  lang={lang}
                  onToggle={onTaskToggle}
                  onDelete={onDeleteTask}
                  onUpdate={onUpdateTask}
                />
              </div>
            );
          })}

          {sortMode === 'order' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver({ beforeIdx: sorted.length }); }}
              onDrop={(e) => handleDropZone(e, sorted.length)}
              style={{
                height: dragOver?.beforeIdx === sorted.length ? 16 : 3,
                background: dragOver?.beforeIdx === sorted.length ? pal.dot : 'transparent',
                transition: 'height .12s ease',
                margin: '0 14px',
                borderRadius: 2,
              }}
            />
          )}
          
          {/* Formulario para agregar nueva tarea */}
          {newTaskObjId === objetivo.id ? (
            <NewTaskForm
              lang={lang}
              onSave={saveNewTask}
              onCancel={cancelCreateTask}
            />
          ) : (
            <div style={{ padding: '8px 14px' }}>
              <button
                type="button"
                onClick={() => startCreateTask(objetivo.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: '1px dashed var(--line)', background: 'transparent',
                  borderRadius: 6, padding: '6px 10px', cursor: 'pointer',
                  color: 'var(--ink-3)', fontSize: 12,
                  width: '100%', justifyContent: 'center',
                }}
              >
                <Icon name="plus" size={12} />
                {lang === 'es' ? 'Agregar tarea' : 'Add task'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function toDateInputValue(isoOrDate) {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function HitoRow({ hito, last, lang, onToggle, onEdit, onGenerate }) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');

  const hasObjetivos = (hito._count?.objetivos ?? 0) > 0;
  const d = hito.fecha_objetivo ? new Date(hito.fecha_objetivo) : null;
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = d ? Math.round((d - today) / 86400000) : null;
  const done = hito.done ?? false;
  const overdue = !done && diff !== null && diff < 0;

  const labelDate = d
    ? `${d.getDate()} ${getMonthShort(lang, d.getMonth())}`
    : '—';

  const relative = done
    ? t(lang, 'achieved')
    : diff === null ? '—'
    : diff < 0     ? t(lang, 'dueOverdue')
    : diff === 0   ? t(lang, 'dueToday')
    : diff === 1   ? t(lang, 'dueTomorrow')
    : `${t(lang, 'dueIn')} ${diff}d`;

  const dotColor = done
    ? 'oklch(0.62 0.14 145)'
    : overdue ? 'oklch(0.6 0.18 25)'
    : 'var(--ink-4)';

  function startEdit() {
    setEditTitle(hito.enunciado);
    setEditDate(toDateInputValue(hito.fecha_objetivo));
    setEditing(true);
  }

  function commitEdit() {
    const title = editTitle.trim();
    if (title) {
      const data = { enunciado: title };
      if (editDate) data.fecha_objetivo = new Date(editDate + 'T12:00:00');
      else data.fecha_objetivo = null;
      onEdit?.(hito.id, data);
    }
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 12, position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => onToggle && onToggle(hito.id)}
          title={done ? (lang === 'es' ? 'Marcar pendiente' : 'Mark pending') : (lang === 'es' ? 'Marcar logrado' : 'Mark achieved')}
          style={{
            width: 14, height: 14, borderRadius: '50%', border: 'none', padding: 0,
            outline: `2px solid ${dotColor}`, outlineOffset: 0,
            background: done ? 'oklch(0.62 0.14 145)' : 'var(--panel)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', marginTop: 4, zIndex: 1, flexShrink: 0, cursor: 'pointer',
          }}
        >
          {done && <Icon name="check" size={8} />}
        </button>
        {!last && (
          <span style={{
            position: 'absolute', top: 18, bottom: -16,
            left: '50%', transform: 'translateX(-50%)',
            width: 1.5, background: 'var(--line)',
          }} />
        )}
      </div>

      <div style={{ padding: '2px 14px 18px 0' }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: 13.5, fontWeight: 450, width: '100%',
                border: 'none', borderBottom: '1px solid var(--ink-3)',
                background: 'transparent', outline: 'none',
                fontFamily: 'inherit', color: 'var(--ink)', padding: '2px 0',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                {lang === 'es' ? 'Fecha objetivo:' : 'Target date:'}
              </span>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                style={{
                  fontSize: 11.5, fontFamily: 'inherit',
                  border: '1px solid var(--line)', borderRadius: 5,
                  padding: '2px 6px', background: 'var(--bg-2)', color: 'var(--ink)',
                }}
              />
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); commitEdit(); }}
                style={{
                  border: 'none', background: 'oklch(0.62 0.14 145)',
                  color: 'white', borderRadius: 5, padding: '2px 8px',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {lang === 'es' ? 'Guardar' : 'Save'}
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); setEditing(false); }}
                style={{
                  border: '1px solid var(--line)', background: 'transparent',
                  color: 'var(--ink-3)', borderRadius: 5, padding: '2px 8px',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 14, alignItems: 'center' }}>
            <button
              type="button"
              onClick={startEdit}
              title={lang === 'es' ? 'Editar hito' : 'Edit milestone'}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 13.5, fontWeight: 450, textAlign: 'left', padding: 0,
                color: done ? 'var(--ink-3)' : 'var(--ink)',
                textDecoration: done ? 'line-through' : 'none',
                lineHeight: 1.4,
              }}
            >
              {hito.enunciado}
            </button>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{labelDate}</span>
            <span className="mono" style={{
              fontSize: 10.5, padding: '2px 8px', borderRadius: 999,
              background: done    ? 'oklch(0.94 0.05 145)'
                        : overdue ? 'oklch(0.94 0.06 25)'
                        :           'var(--bg-2)',
              color:      done    ? 'oklch(0.4 0.12 145)'
                        : overdue ? 'oklch(0.45 0.14 25)'
                        :           'var(--ink-3)',
              minWidth: 64, textAlign: 'center',
            }}>
              {relative}
            </span>
            {!confirming ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
                title={lang === 'es' ? 'Generar objetivos' : 'Generate objectives'}
                style={{
                  border: `1px solid ${hasObjetivos ? 'oklch(0.62 0.14 145)' : 'var(--line)'}`,
                  background: hasObjetivos ? 'oklch(0.96 0.04 145)' : 'transparent',
                  borderRadius: 5, padding: '2px 5px', cursor: 'pointer',
                  fontSize: 11,
                  color: hasObjetivos ? 'oklch(0.42 0.12 145)' : 'var(--ink-3)',
                  lineHeight: 1,
                }}
              >
                ⚡
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                  {lang === 'es' ? '¿Generar?' : 'Generate?'}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirming(false); onGenerate?.(hito); }}
                  style={{
                    border: 'none', background: 'oklch(0.62 0.14 145)',
                    color: 'white', borderRadius: 4,
                    padding: '1px 6px', cursor: 'pointer', fontSize: 11,
                  }}
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                  style={{
                    border: '1px solid var(--line)', background: 'transparent',
                    color: 'var(--ink-3)', borderRadius: 4,
                    padding: '1px 6px', cursor: 'pointer', fontSize: 11,
                  }}
                >
                  ✗
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ViewWorkspace({ metas: initialMetas, objetivos: initialObjetivos, tareas: initialTareas }) {
  const router = useRouter();
  const [lang, setLang] = useState('es');
  const [metas, setMetas] = useState(initialMetas);
  const [objetivos, setObjetivos] = useState(initialObjetivos);
  const [tareas, setTareas] = useState(initialTareas);
  const [metaFormOpen, setMetaFormOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [generateModal, setGenerateModal] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'es') setLang(stored);
    function handleLangChange() {
      const s = localStorage.getItem('lang');
      if (s === 'en' || s === 'es') setLang(s);
    }
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  const firstActive = metas.find(m => m.active) ?? metas[0];
  const [selectedId, setSelectedId] = useState(firstActive?.id ?? null);
  const selectedMeta = metas.find(m => m.id === selectedId) ?? firstActive ?? null;

  const [openObjs, setOpenObjs] = useState(true);
  const [openHitos, setOpenHitos] = useState(true);

  const metaObjetivos = selectedMeta
    ? (objetivos.filter(o => o.metaId === selectedMeta.id))
    : [];
  const metaTareas = tareas.filter(t => metaObjetivos.some(o => o.id === t.objId));
  const metaDone = metaTareas.filter(t => t.done).length;
  const totalSessions = metaTareas.reduce((s, t) => s + (t.sessions ?? 0), 0);
  const doneSessions = metaTareas.filter(t => t.done).reduce((s, t) => s + (t.sessions ?? 0), 0);
  const metaHitos = selectedMeta ? (selectedMeta.hitos ?? []) : [];
  const hitosDone = metaHitos.filter(h => h.done ?? false).length;
  const metaPct = metaHitos.length
    ? Math.round((hitosDone / metaHitos.length) * 100)
    : 0;

  function calcMetaPct(meta) {
    const hitos = meta.hitos ?? [];
    if (hitos.length === 0) return 0;
    return Math.round((hitos.filter(h => h.done).length / hitos.length) * 100);
  }

  function handleCreateMeta(newMeta) {
    setMetas(prev => [{ ...newMeta, hitos: [], objetivos: [] }, ...prev]);
    setSelectedId(newMeta.id);
  }

  async function handleUpdateMetaColor(metaId, color) {
    setMetas(prev => prev.map(m => m.id === metaId ? { ...m, color } : m));
    setObjetivos(prev => prev.map(o => o.metaId === metaId ? { ...o, color } : o));
    try { await updateMetaColor(metaId, color); } catch { /* server revalidates */ }
  }

  async function handleDeleteObjetivo(objId) {
    setObjetivos(prev => prev.filter(o => o.id !== objId));
    try { await deleteObjetivo(objId); } catch { /* server revalidates */ }
  }

  async function handleToggleActive(id) {
    setMetas(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
    try { await toggleMetaActive(id); }
    catch { setMetas(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m)); }
  }

  async function handleTaskToggle(taskId) {
    setTareas(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
    try { await toggleTarea(taskId); }
    catch { setTareas(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t)); }
  }

  async function handleUnschedule(taskId) {
    setTareas(prev => prev.map(t => t.id === taskId ? { ...t, day: null, start: null } : t));
    try { await unscheduleTarea(taskId); } catch { /* revert if needed */ }
  }

  function handleReorder(taskId, objId, beforeIdx) {
    setTareas(prev => {
      const moving = prev.find(t => t.id === taskId);
      if (!moving) return prev;
      const sameObj = prev.filter(t => t.objId === objId && t.id !== taskId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      const updated = { ...moving, objId };
      sameObj.splice(Math.min(beforeIdx, sameObj.length), 0, updated);
      const reordered = sameObj.map((t, i) => ({ ...t, sortOrder: i }));
      return prev.map(t => {
        if (t.id === taskId) return reordered.find(r => r.id === taskId) ?? t;
        const r = reordered.find(r => r.id === t.id);
        return r ?? t;
      });
    });
    reorderTareas(
      tareas
        .filter(t => t.objId === objId)
        .map((t, i) => ({ id: t.id, sortOrder: i }))
    ).catch(() => {});
  }

  async function handleCreateTask(objId, title) {
    const defaultTitle = title ?? (lang === 'es' ? 'Nueva tarea' : 'New task');
    try {
      const newTask = await createTarea({
        objId,
        title: defaultTitle,
        title_en: defaultTitle,
        dur: 1,
        sessions: 1,
      });
      setTareas(prev => [...prev, newTask]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  async function handleUpdateTask(taskId, data) {
    setTareas(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
    try {
      await updateTarea(taskId, data);
    } catch {
      setTareas(prev => [...initialTareas]);
    }
  }

  async function handleDeleteTask(taskId) {
    setTareas(prev => prev.filter(t => t.id !== taskId));
    try {
      await deleteTarea(taskId);
    } catch {
      setTareas(prev => [...initialTareas]);
    }
  }

  async function handleThisWeekToggle(objId) {
    setObjetivos(prev => prev.map(o => o.id === objId ? { ...o, thisWeek: !o.thisWeek } : o));
    try { await toggleObjetivoThisWeek(objId); }
    catch { setObjetivos(prev => prev.map(o => o.id === objId ? { ...o, thisWeek: !o.thisWeek } : o)); }
  }

  async function handleToggleObjetivoCompleted(objId) {
    setObjetivos(prev => prev.map(o => o.id === objId ? { ...o, done: o.done ? 0 : 1 } : o));
    try { await toggleObjetivoCompleted(objId); }
    catch { setObjetivos(prev => prev.map(o => o.id === objId ? { ...o, done: o.done ? 0 : 1 } : o)); }
  }

  async function handleEditObjetivo(objId, title) {
    setObjetivos(prev => prev.map(o => o.id === objId ? { ...o, title } : o));
    try { await updateObjetivo(objId, { title }); } catch { /* server revalidates */ }
  }

  async function handleToggleHito(hitoId) {
    setMetas(prev => prev.map(m => ({
      ...m,
      hitos: (m.hitos ?? []).map(h =>
        h.id === hitoId ? { ...h, done: !(h.done ?? false) } : h
      ),
    })));
    try { await toggleHitoDone(hitoId); } catch { /* revert would need refetch */ }
  }

  async function handleUpdateHito(hitoId, data) {
    setMetas(prev => prev.map(m => ({
      ...m,
      hitos: (m.hitos ?? []).map(h => h.id === hitoId ? { ...h, ...data } : h),
    })));
    try { await updateHito(hitoId, data); } catch { /* server revalidates */ }
  }

  function handleGenerateObjetivos(hito) {
    setGenerateModal({ hito, meta: selectedMeta });
  }

  async function handleAddHito(metaId) {
    const d = new Date(); d.setDate(d.getDate() + 21);
    const title = lang === 'es' ? 'Nuevo hito' : 'New milestone';
    try {
      const newHito = await createHito({
        metaId,
        enunciado: title,
        criterio_verificacion: '',
        puente_con_meta: '',
        fecha_objetivo: d,
        done: false,
      });
      setMetas(prev => prev.map(m =>
        m.id === metaId
          ? { ...m, hitos: [...(m.hitos ?? []), newHito] }
          : m
      ));
    } catch { /* ignore */ }
  }

  const activeMetas = metas.filter(m => m.active);
  const inactiveMetas = metas.filter(m => !m.active);
  const thisWeekObjetivos = objetivos.filter(o => o.thisWeek);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100vh', minHeight: 0, overflow: 'hidden' }}>
      <aside style={{
        borderRight: '1px solid var(--line-2)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg)', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--line-2)', flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8, color: 'var(--ink-4)' }}>
            {fmtWeekRange(lang)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 17, fontWeight: 500, margin: 0, letterSpacing: '-0.01em' }}>
              {t(lang, 'metas')}
            </h2>
            <button
              type="button"
              onClick={() => setMetaFormOpen(true)}
              title={t(lang, 'newMeta')}
              style={{
                border: '1px solid var(--line)', background: 'white', borderRadius: 7,
                padding: '4px 7px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-2)',
              }}
            >
              <Icon name="plus" size={12} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Esta Semana */}
          <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              {lang === 'es' ? 'Esta semana' : 'This week'}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{thisWeekObjetivos.length}</span>
          </div>
          {thisWeekObjetivos.map(o => (
            <ObjetivoWeekRow
              key={o.id}
              objetivo={o}
              isSelected={o.metaId === selectedId}
              allTareas={tareas}
              lang={lang}
              onSelect={setSelectedId}
            />
          ))}
          {thisWeekObjetivos.length === 0 && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--ink-4)' }}>—</div>
          )}

          {/* Todas las metas */}
          <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              {t(lang, 'active')}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{activeMetas.length}</span>
          </div>
          {activeMetas.map(m => (
            <MetaRow key={m.id} meta={m} isSelected={m.id === selectedId} pct={calcMetaPct(m)} lang={lang} onSelect={setSelectedId} />
          ))}
          {activeMetas.length === 0 && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--ink-4)' }}>—</div>
          )}

          {inactiveMetas.length > 0 && (
            <>
              <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                  {t(lang, 'archived')}
                </span>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{inactiveMetas.length}</span>
              </div>
              {inactiveMetas.map(m => (
                <MetaRow key={m.id} meta={m} isSelected={m.id === selectedId} pct={calcMetaPct(m)} lang={lang} onSelect={setSelectedId} />
              ))}
            </>
          )}
        </div>
      </aside>

      <div style={{ overflow: 'auto', minHeight: 0 }}>
        {!selectedMeta ? (
          <div style={{ padding: 60, color: 'var(--ink-3)', fontSize: 14 }}>
            {t(lang, 'selectMeta')}
          </div>
        ) : (
          <div style={{ padding: '32px 44px 80px', maxWidth: 920 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, alignItems: 'start', marginBottom: 28 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span className="mono" style={{
                    fontSize: 10.5, padding: '2px 7px', borderRadius: 999,
                    background: 'var(--bg-2)', color: 'var(--ink-2)',
                    border: '1px solid var(--line-2)',
                  }}>
                    {selectedMeta.active ? t(lang, 'activeNow') : t(lang, 'inactiveNow')}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    {lang === 'en' && selectedMeta.horizon_en ? selectedMeta.horizon_en : selectedMeta.horizon}
                  </span>
                </div>
                <h1 className="serif" style={{
                  fontStyle: 'italic', fontWeight: 500,
                  fontSize: 32, lineHeight: 1.1, margin: 0, letterSpacing: '-0.01em',
                }}>
                  {lang === 'en' && selectedMeta.title_en ? selectedMeta.title_en : selectedMeta.title}
                </h1>
                <div style={{ marginTop: 12 }}>
                  <ColorPicker
                    value={selectedMeta.color ?? 'sand'}
                    onChange={color => handleUpdateMetaColor(selectedMeta.id, color)}
                  />
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: '14px 0 0', maxWidth: 580, color: 'var(--ink-2)' }}>
                  {lang === 'en' && selectedMeta.why_en ? selectedMeta.why_en : selectedMeta.why}
                </p>
                {(selectedMeta.success || selectedMeta.success_en) && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px',
                    background: 'var(--bg-2)', borderRadius: 8,
                    borderLeft: '2px solid var(--ink-4)',
                    fontSize: 13, color: 'var(--ink-2)', maxWidth: 580,
                  }}>
                    <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', marginRight: 8, color: 'var(--ink-3)' }}>
                      {t(lang, 'successCriteria')}
                    </span>
                    {lang === 'en' && selectedMeta.success_en ? selectedMeta.success_en : selectedMeta.success}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={() => handleToggleActive(selectedMeta.id)}
                >
                  <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                    {selectedMeta.active ? t(lang, 'activeNow') : t(lang, 'inactiveNow')}
                  </span>
                  <Switch checked={selectedMeta.active} onChange={() => handleToggleActive(selectedMeta.id)} />
                </div>
                <Donut
                  value={metaPct} size={88} stroke={6}
                  color={selectedMeta.active ? palById(selectedMeta.color ?? 'sand').dot : 'var(--ink-4)'}
                  label={`${metaPct}%`}
                />
              </div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1, background: 'var(--line-2)',
              border: '1px solid var(--line-2)', borderRadius: 10, overflow: 'hidden',
              marginBottom: 28,
            }}>
              {[
                { label: t(lang, 'objectives'), value: metaObjetivos.length },
                { label: t(lang, 'tasksTotal'), value: `${metaDone}/${metaTareas.length}` },
                { label: t(lang, 'sessions'), value: `${doneSessions}/${totalSessions}` },
                { label: t(lang, 'milestones'), value: `${hitosDone}/${metaHitos.length}` },
              ].map((kpi, i) => (
                <div key={i} style={{ background: 'var(--panel)', padding: '12px 16px' }}>
                  <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4, color: 'var(--ink-3)' }}>
                    {kpi.label}
                  </div>
                  <div className="mono" style={{ fontSize: 18, color: 'var(--ink)' }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            <CollapseSection
              open={openObjs}
              onToggle={() => setOpenObjs(v => !v)}
              label={t(lang, 'objetivos')}
              count={metaObjetivos.length}
              action={
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const defaultTitle = lang === 'es' ? 'Nuevo objetivo' : 'New objective';
                      const newObj = await createObjetivo({
                        metaId: selectedMeta.id,
                        title: defaultTitle,
                        title_en: defaultTitle,
                        color: 'sand', weeklyLoad: 1, done: 0,
                      });
                      setObjetivos(prev => [...prev, { ...newObj, tareas: [] }]);
                    } catch { /* ignore */ }
                  }}
                  style={{
                    border: '1px solid var(--line)', background: 'white', borderRadius: 7,
                    padding: '4px 10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--ink-2)',
                  }}
                >
                  <Icon name="plus" size={12} /> {t(lang, 'addObjective')}
                </button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {metaObjetivos.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', border: '1px dashed var(--line)', borderRadius: 10, color: 'var(--ink-3)', fontSize: 13 }}>
                    {lang === 'es' ? 'Sin objetivos. Añade el primero.' : 'No objectives yet. Add one.'}
                  </div>
                ) : (
                  metaObjetivos.map(o => (
                    <ObjectiveCard
                      key={o.id}
                      objetivo={o}
                      allTareas={tareas}
                      lang={lang}
                      onTaskToggle={handleTaskToggle}
                      onTaskUnschedule={handleUnschedule}
                      onReorder={handleReorder}
                      onThisWeekToggle={handleThisWeekToggle}
                      onDone={handleToggleObjetivoCompleted}
                      onEdit={handleEditObjetivo}
                      onDelete={handleDeleteObjetivo}
                      onCreateTask={handleCreateTask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            </CollapseSection>

            <div style={{ height: 24 }} />
            <CollapseSection
              open={openHitos}
              onToggle={() => setOpenHitos(v => !v)}
              label={t(lang, 'milestones')}
              count={metaHitos.length}
              sub={t(lang, 'milestonesSub')}
              action={
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleAddHito(selectedMeta.id); }}
                  style={{
                    border: '1px solid var(--line)', background: 'white', borderRadius: 7,
                    padding: '4px 10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--ink-2)',
                  }}
                >
                  <Icon name="plus" size={12} /> {t(lang, 'addMilestone')}
                </button>
              }
            >
              <div style={{ background: 'var(--panel)', border: '1px solid var(--line-2)', borderRadius: 10, padding: '20px 22px 6px' }}>
                {metaHitos.length === 0 ? (
                  <div style={{ padding: '12px 0 18px', color: 'var(--ink-3)', fontSize: 13 }}>
                    {lang === 'es' ? 'Sin hitos definidos.' : 'No milestones yet.'}
                  </div>
                ) : (
                  [...metaHitos]
                    .sort((a, b) => {
                      const ad = a.fecha_objetivo ? new Date(a.fecha_objetivo).getTime() : Infinity;
                      const bd = b.fecha_objetivo ? new Date(b.fecha_objetivo).getTime() : Infinity;
                      return ad - bd;
                    })
                    .map((hito, i, arr) => (
                      <HitoRow
                        key={hito.id}
                        hito={hito}
                        last={i === arr.length - 1}
                        lang={lang}
                        onToggle={handleToggleHito}
                        onEdit={handleUpdateHito}
                        onGenerate={handleGenerateObjetivos}
                      />
                    ))
                )}
              </div>
            </CollapseSection>
          </div>
        )}
      </div>

      {metaFormOpen && (
        <NewMetaForm
          lang={lang}
          onClose={() => setMetaFormOpen(false)}
          onCreated={handleCreateMeta}
          onUseAgent={() => setWizardOpen(true)}
        />
      )}

      {wizardOpen && (
        <WizardAgent onClose={() => setWizardOpen(false)} />
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
