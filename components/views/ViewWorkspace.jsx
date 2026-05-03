'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Donut from '@/components/ui/Donut';
import ProgressBar from '@/components/ui/ProgressBar';
import ColorDot from '@/components/ui/ColorDot';
import Check from '@/components/ui/Check';
import Switch from '@/components/ui/Switch';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import { t } from '@/lib/i18n';
import { palById } from '@/lib/palette';
import { toggleMetaActive } from '@/lib/actions/metas';
import { createObjetivo, updateObjetivo, deleteObjetivo } from '@/lib/actions/objetivos';
import { toggleTarea, reorderTareas, unscheduleTarea } from '@/lib/actions/tareas';
import { toggleHitoDone, createHito } from '@/lib/actions/hitos';
import WizardAgent from '@/components/modals/WizardAgent';

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
  if (mode === 'due') a.sort((x, y) => {
    const xd = x.dueDate ? new Date(x.dueDate).getTime() : Infinity;
    const yd = y.dueDate ? new Date(y.dueDate).getTime() : Infinity;
    return xd - yd;
  });
  else if (mode === 'load') a.sort((x, y) => (y.sessions ?? 0) - (x.sessions ?? 0));
  else a.sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0));
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

function MetaRow({ meta, isSelected, pct, lang, onSelect }) {
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
        background: isSelected ? 'var(--panel)' : 'transparent',
        borderLeft: isSelected ? '2px solid var(--ink)' : '2px solid transparent',
        paddingLeft: isSelected ? 10 : 12,
        transition: 'background .12s ease',
      }}
    >
      <span
        className={meta.active ? 'pulse' : ''}
        style={{
          width: 7, height: 7, borderRadius: '50%', marginTop: 7,
          display: 'block', flexShrink: 0,
          background: meta.active ? 'oklch(0.62 0.14 145)' : 'var(--ink-4)',
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
            <ProgressBar value={pct} color={meta.active ? 'var(--ink)' : 'var(--ink-4)'} height={2} />
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{pct}%</span>
        </div>
      </div>
    </button>
  );
}

function ObjectiveCard({ objetivo, allTareas, lang, onTaskToggle, onTaskUnschedule, onReorder }) {
  const [isOpen, setIsOpen] = useState(true);
  const [sortMode, setSortMode] = useState('order');
  const [dragId, setDragId] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const pal = palById(objetivo.color);
  const tks = allTareas.filter(t => t.objId === objetivo.id);
  const doneTks = tks.filter(t => t.done).length;
  const totalSes = tks.reduce((s, t) => s + (t.sessions ?? 0), 0);
  const doneSes = tks.filter(t => t.done).reduce((s, t) => s + (t.sessions ?? 0), 0);
  const pct = tks.length ? Math.round((doneTks / tks.length) * 100) : 0;
  const sorted = sortTasks(tks, sortMode);

  const title = lang === 'en' && objetivo.title_en ? objetivo.title_en : objetivo.title;

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
      <div style={{ padding: '12px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <ColorDot color={pal.dot} size={9} />
          <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{title}</div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {doneSes}/{totalSes} {t(lang, 'sessionShort')}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(v => !v)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', padding: 2 }}
          >
            <span style={{ display: 'inline-flex', transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s ease' }}>
              <Icon name="chev-d" size={14} />
            </span>
          </button>
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
            const taskTitle = lang === 'en' && task.title_en ? task.title_en : task.title;
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
                <div
                  draggable={sortMode === 'order'}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '14px 16px 1fr auto auto auto auto',
                    alignItems: 'center', gap: 10,
                    padding: '8px 14px',
                    borderBottom: '1px solid var(--line-2)',
                    cursor: sortMode === 'order' ? 'grab' : 'default',
                    opacity: isDragging ? 0.4 : 1,
                    background: (task.day == null) ? 'oklch(0.985 0.005 90)' : 'transparent',
                  }}
                >
                  <Icon name="drag" size={12} />
                  <Check
                    checked={task.done}
                    onChange={() => onTaskToggle && onTaskToggle(task.id)}
                    size={16}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{
                      fontSize: 12.5,
                      textDecoration: task.done ? 'line-through' : 'none',
                      color: task.done ? 'var(--ink-4)' : 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{taskTitle}</span>
                    {task.day == null && (
                      <span className="mono" style={{
                        fontSize: 10.5, padding: '2px 7px', borderRadius: 999,
                        background: 'var(--bg-2)', color: 'var(--ink-2)',
                        border: '1px solid var(--line-2)', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>{t(lang, 'backlog')}</span>
                    )}
                  </div>
                  <div title={t(lang, 'pomodoro')} style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    {Array.from({ length: Math.min(task.sessions ?? 0, 6) }).map((_, i) => (
                      <span key={i} style={{ width: 4, height: 10, borderRadius: 1, background: pal.dot, opacity: 0.55 }} />
                    ))}
                    <span className="mono" style={{ fontSize: 10.5, marginLeft: 4, minWidth: 18, color: 'var(--ink-3)' }}>
                      {task.sessions ?? 0}×25
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: 10.5, minWidth: 56, textAlign: 'right', color: 'var(--ink-3)' }}>
                    {fmtDue(task.dueDate, lang)}
                  </span>
                  <span className="mono" style={{ fontSize: 10.5, minWidth: 28, textAlign: 'right', color: 'var(--ink-4)' }}>
                    {task.day != null ? (dayLabels[task.day] ?? '—').toLowerCase() : '—'}
                  </span>
                  {task.day != null ? (
                    <button
                      type="button"
                      title={t(lang, 'unschedule')}
                      onClick={() => onTaskUnschedule && onTaskUnschedule(task.id)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-4)', padding: 2 }}
                    >
                      <Icon name="x" size={12} />
                    </button>
                  ) : (
                    <span style={{ width: 16 }} />
                  )}
                </div>
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
        </div>
      )}
    </div>
  );
}

function HitoRow({ hito, last, lang, onToggle }) {
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 12, position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: `2px solid ${dotColor}`,
          background: done ? 'oklch(0.62 0.14 145)' : 'var(--panel)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', marginTop: 4, zIndex: 1, flexShrink: 0,
        }}>
          {done && <Icon name="check" size={8} />}
        </span>
        {!last && (
          <span style={{
            position: 'absolute', top: 18, bottom: -16,
            left: '50%', transform: 'translateX(-50%)',
            width: 1.5, background: 'var(--line)',
          }} />
        )}
      </div>
      <div style={{
        padding: '4px 14px 18px 0',
        display: 'grid', gridTemplateColumns: '1fr auto auto',
        gap: 14, alignItems: 'center',
      }}>
        <button
          type="button"
          onClick={() => onToggle && onToggle(hito.id)}
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
      </div>
    </div>
  );
}

export default function ViewWorkspace({ metas: initialMetas, objetivos: initialObjetivos, tareas: initialTareas }) {
  const [lang, setLang] = useState('es');
  const [metas, setMetas] = useState(initialMetas);
  const [tareas, setTareas] = useState(initialTareas);
  const [wizardOpen, setWizardOpen] = useState(false);

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
    ? (initialObjetivos.filter(o => o.metaId === selectedMeta.id))
    : [];
  const metaTareas = tareas.filter(t => metaObjetivos.some(o => o.id === t.objId));
  const metaDone = metaTareas.filter(t => t.done).length;
  const totalSessions = metaTareas.reduce((s, t) => s + (t.sessions ?? 0), 0);
  const doneSessions = metaTareas.filter(t => t.done).reduce((s, t) => s + (t.sessions ?? 0), 0);
  const metaHitos = selectedMeta ? (selectedMeta.hitos ?? []) : [];
  const hitosDone = metaHitos.filter(h => h.done ?? false).length;
  const metaPct = metaTareas.length
    ? Math.round((metaDone / metaTareas.length) * 100)
    : 0;

  function calcMetaPct(meta) {
    const objs = initialObjetivos.filter(o => o.metaId === meta.id);
    const tks = tareas.filter(t => objs.some(o => o.id === t.objId));
    return tks.length ? Math.round((tks.filter(t => t.done).length / tks.length) * 100) : 0;
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

  async function handleToggleHito(hitoId) {
    setMetas(prev => prev.map(m => ({
      ...m,
      hitos: (m.hitos ?? []).map(h =>
        h.id === hitoId ? { ...h, done: !(h.done ?? false) } : h
      ),
    })));
    try { await toggleHitoDone(hitoId); } catch { /* revert would need refetch */ }
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
              onClick={() => setWizardOpen(true)}
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
          <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              {t(lang, 'active')}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{activeMetas.length}</span>
          </div>
          {activeMetas.map(m => (
            <MetaRow key={m.id} meta={m} isSelected={m.id === selectedId} pct={calcMetaPct(m)} lang={lang} onSelect={setSelectedId} />
          ))}
          {activeMetas.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ink-4)' }}>—</div>
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
                  color={selectedMeta.active ? 'var(--ink)' : 'var(--ink-4)'}
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
                      await createObjetivo({
                        metaId: selectedMeta.id,
                        title: lang === 'es' ? 'Nuevo objetivo' : 'New objective',
                        title_en: 'New objective',
                        color: 'sand', weeklyLoad: 1, done: 0,
                      });
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
                      />
                    ))
                )}
              </div>
            </CollapseSection>
          </div>
        )}
      </div>

      {wizardOpen && (
        <WizardAgent onClose={() => setWizardOpen(false)} />
      )}
    </div>
  );
}
