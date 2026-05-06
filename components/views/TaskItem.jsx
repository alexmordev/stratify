import { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import { t } from '@/lib/i18n';

const DAY_LABELS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DAY_LABELS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function parseSubtasks(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function TaskItem({
  task, lang,
  onToggle, onDelete, onUpdate, onUnschedule,
  isDraggable, isDragging, onDragStart, onDragEnd,
  accentColor,
  objectives,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editingSessions, setEditingSessions] = useState(false);
  const [sessionsDraft, setSessionsDraft] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [detailsMode, setDetailsMode] = useState(() => {
    const subs = parseSubtasks(task.subtasks);
    if (task.notes && !subs.length) return 'text';
    return 'list';
  });
  const [subtaskItems, setSubtaskItems] = useState(() => parseSubtasks(task.subtasks));
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState(task.notes ?? '');

  useEffect(() => { setSubtaskItems(parseSubtasks(task.subtasks)); }, [task.subtasks]);
  useEffect(() => { setNotesDraft(task.notes ?? ''); }, [task.notes]);

  const dayLabels = lang === 'es' ? DAY_LABELS_ES : DAY_LABELS_EN;
  const accent = accentColor ?? 'var(--ink-3)';
  const dots = Math.min(task.sessions ?? 0, 6);
  const hasDetails = subtaskItems.length > 0 || (task.notes ?? '').trim().length > 0;

  // ── Title editing ──────────────────────────────────────────────
  function handleEdit() { setIsEditing(true); setEditTitle(task.title); }
  function handleSave() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed });
    setIsEditing(false);
  }
  function handleCancel() { setIsEditing(false); setEditTitle(task.title); }
  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') handleCancel();
  }

  // ── Sessions editing ───────────────────────────────────────────
  function startEditSessions() { setSessionsDraft(String(task.sessions ?? 1)); setEditingSessions(true); }
  function saveSessions() {
    const n = parseInt(sessionsDraft, 10);
    if (!isNaN(n) && n >= 1 && n !== (task.sessions ?? 1)) onUpdate(task.id, { sessions: n });
    setEditingSessions(false);
  }
  function handleSessionsKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveSessions(); }
    if (e.key === 'Escape') setEditingSessions(false);
    if (e.key === 'ArrowUp') { e.preventDefault(); setSessionsDraft(v => String(Math.min(20, (parseInt(v, 10) || 1) + 1))); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSessionsDraft(v => String(Math.max(1, (parseInt(v, 10) || 1) - 1))); }
  }

  // ── Subtask editing ────────────────────────────────────────────
  function toggleSubtask(i) {
    const updated = subtaskItems.map((s, idx) => idx === i ? { ...s, d: !s.d } : s);
    setSubtaskItems(updated);
    onUpdate(task.id, { subtasks: updated });
  }
  function removeSubtask(i) {
    const updated = subtaskItems.filter((_, idx) => idx !== i);
    setSubtaskItems(updated);
    onUpdate(task.id, { subtasks: updated });
  }
  function handleSubtaskKeyDown(e) {
    if (e.key === 'Enter' && subtaskDraft.trim()) {
      e.preventDefault();
      const updated = [...subtaskItems, { t: subtaskDraft.trim(), d: false }];
      setSubtaskItems(updated);
      setSubtaskDraft('');
      onUpdate(task.id, { subtasks: updated });
    }
    if (e.key === 'Escape') setSubtaskDraft('');
  }

  // ── Notes editing ──────────────────────────────────────────────
  function saveNotes() {
    if (notesDraft !== (task.notes ?? '')) onUpdate(task.id, { notes: notesDraft });
  }

  const bg = task.done ? 'var(--bg-2)' : task.day == null ? 'var(--panel)' : 'transparent';

  return (
    <div style={{ borderBottom: '1px solid var(--line-2)' }}>
      {/* ── Task row ─────────────────────────────────────── */}
      <div
        draggable={isDraggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          display: 'grid',
          gridTemplateColumns: '14px 22px 1fr auto auto auto auto',
          alignItems: 'center', gap: 10,
          padding: '8px 14px',
          cursor: isDraggable ? 'grab' : 'default',
          opacity: isDragging ? 0.4 : 1,
          background: bg,
        }}
      >
        {/* Drag handle */}
        <span style={{ color: 'var(--ink-4)', display: 'flex', alignItems: 'center', opacity: isDraggable ? 0.5 : 0 }}>
          <Icon name="drag" size={12} />
        </span>

        {/* Done toggle */}
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          title={task.done
            ? (lang === 'es' ? 'Marcar pendiente' : 'Mark pending')
            : (lang === 'es' ? 'Marcar completada' : 'Mark done')}
          style={{
            width: 20, height: 20, borderRadius: '50%', padding: 0, flexShrink: 0,
            border: task.done
              ? '2px solid oklch(0.52 0.18 145)'
              : '2px solid var(--line)',
            background: task.done ? 'oklch(0.52 0.18 145)' : 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color .15s, background .15s, box-shadow .15s',
            boxShadow: task.done ? '0 0 0 3px oklch(0.91 0.09 145)' : 'none',
          }}
        >
          {task.done && <Icon name="check" size={11} style={{ color: 'white' }} />}
        </button>

        {/* Title + backlog badge */}
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            style={{
              fontSize: 12.5, border: '1px solid var(--line)', borderRadius: 4,
              padding: '2px 6px', background: 'var(--panel)', outline: 'none', width: '100%',
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
            <span
              onClick={handleEdit}
              style={{
                fontSize: 12.5,
                textDecoration: task.done ? 'line-through' : 'none',
                color: task.done ? 'var(--ink-4)' : 'var(--ink)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {task.title}
            </span>
            {task.day == null && !task.done && (
              <span className="mono" style={{
                fontSize: 10.5, padding: '2px 7px', borderRadius: 999,
                background: 'var(--bg-2)', color: 'var(--ink-2)',
                border: '1px solid var(--line-2)', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {t(lang, 'backlog')}
              </span>
            )}
          </div>
        )}

        {/* Sessions indicator / editor */}
        {editingSessions ? (
          <input
            autoFocus
            type="number"
            min="1"
            max="20"
            value={sessionsDraft}
            onChange={(e) => setSessionsDraft(e.target.value)}
            onBlur={saveSessions}
            onKeyDown={handleSessionsKeyDown}
            style={{
              width: 52, fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
              border: '1px solid var(--line)', borderRadius: 4,
              padding: '2px 4px', background: 'var(--panel)', outline: 'none', textAlign: 'center',
            }}
          />
        ) : (
          <button
            type="button"
            title={t(lang, 'pomodoro')}
            onClick={startEditSessions}
            style={{
              display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
              border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
            }}
          >
            {Array.from({ length: dots }).map((_, i) => (
              <span key={i} style={{ width: 4, height: 10, borderRadius: 1, background: accent, opacity: 0.55, flexShrink: 0 }} />
            ))}
            <span className="mono" style={{ fontSize: 10.5, marginLeft: dots > 0 ? 4 : 0, color: 'var(--ink-3)', minWidth: 28 }}>
              {task.sessions ?? 0}×25
            </span>
          </button>
        )}

        {/* Scheduled day */}
        <span className="mono" style={{ fontSize: 10.5, minWidth: 28, textAlign: 'right', color: 'var(--ink-4)' }}>
          {task.day != null ? (dayLabels[task.day] ?? '—').toLowerCase() : '—'}
        </span>

        {/* Unschedule / spacer */}
        {task.day != null ? (
          <button
            type="button"
            title={t(lang, 'unschedule')}
            onClick={() => onUnschedule?.(task.id)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-4)', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            <Icon name="x" size={12} />
          </button>
        ) : (
          <span style={{ width: 16, flexShrink: 0 }} />
        )}

        {/* Details + Edit + Delete */}
        <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowDetails(v => !v)}
            title={lang === 'es' ? 'Detalles' : 'Details'}
            style={{
              border: 'none', borderRadius: 4,
              background: showDetails ? 'var(--bg-2)' : 'transparent',
              cursor: 'pointer',
              color: hasDetails ? (showDetails ? accent : 'var(--ink-3)') : 'var(--ink-4)',
              padding: 3, display: 'flex', alignItems: 'center',
              boxShadow: showDetails ? '0 0 0 1px var(--line)' : 'none',
            }}
          >
            <Icon name="notes" size={11} />
          </button>
          {!isEditing && !editingSessions && !showDeleteConfirm && (
            <button
              type="button"
              onClick={handleEdit}
              title={lang === 'es' ? 'Editar' : 'Edit'}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-4)', padding: 3, display: 'flex', alignItems: 'center' }}
            >
              <Icon name="edit" size={11} />
            </button>
          )}
          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                {lang === 'es' ? '¿Eliminar?' : 'Delete?'}
              </span>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); onDelete(task.id); }}
                style={{ border: 'none', background: 'oklch(0.6 0.18 25)', color: 'white', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 11 }}
              >✓</button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-3)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 11 }}
              >✗</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title={lang === 'es' ? 'Eliminar' : 'Delete'}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-4)', padding: 3, display: 'flex', alignItems: 'center' }}
            >
              <Icon name="trash" size={11} />
            </button>
          )}
        </div>
      </div>

      {/* ── Details panel ─────────────────────────────────── */}
      {showDetails && (
        <div style={{ padding: '6px 14px 10px 54px', background: bg }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {[
              ['list', lang === 'es' ? '☑ Lista' : '☑ List'],
              ['text', lang === 'es' ? '≡ Notas' : '≡ Notes'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDetailsMode(mode)}
                style={{
                  border: 'none', borderRadius: 5, padding: '2px 8px', fontSize: 11,
                  background: detailsMode === mode ? 'white' : 'transparent',
                  color: detailsMode === mode ? 'var(--ink)' : 'var(--ink-4)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: detailsMode === mode ? '0 0 0 1px var(--line)' : 'none',
                }}
              >{label}</button>
            ))}
          </div>

          {/* Objective selector */}
          {objectives && objectives.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>
                {t(lang, 'moveToObjective')}:
              </span>
              <select
                value={task.objId}
                onChange={e => {
                  const newObjId = e.target.value;
                  if (newObjId !== task.objId) onUpdate(task.id, { objId: newObjId });
                }}
                style={{
                  fontSize: 11, fontFamily: 'inherit',
                  border: '1px solid var(--line)', borderRadius: 5,
                  padding: '2px 6px', background: 'var(--bg-2)', color: 'var(--ink)',
                  maxWidth: 220, outline: 'none',
                }}
              >
                {objectives.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* List mode */}
          {detailsMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {subtaskItems.map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <button
                    type="button"
                    onClick={() => toggleSubtask(i)}
                    style={{
                      width: 14, height: 14, borderRadius: 3, padding: 0, flexShrink: 0,
                      border: `1.5px solid ${st.d ? accent : 'var(--line)'}`,
                      background: st.d ? accent : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {st.d && <Icon name="check" size={8} />}
                  </button>
                  <span style={{
                    flex: 1, fontSize: 12, lineHeight: 1.4,
                    color: st.d ? 'var(--ink-4)' : 'var(--ink-2)',
                    textDecoration: st.d ? 'line-through' : 'none',
                  }}>
                    {st.t}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(i)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-4)', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <Icon name="x" size={10} />
                  </button>
                </div>
              ))}
              <input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder={lang === 'es' ? '+ Agregar elemento…' : '+ Add item…'}
                style={{
                  border: 'none', borderBottom: '1px solid var(--line-2)',
                  background: 'transparent', fontSize: 12, color: 'var(--ink)',
                  outline: 'none', width: '100%', padding: '3px 0',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* Text mode */}
          {detailsMode === 'text' && (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={saveNotes}
              placeholder={lang === 'es' ? 'Agregar notas…' : 'Add notes…'}
              style={{
                width: '100%', border: 'none',
                borderBottom: '1px solid var(--line-2)',
                background: 'transparent', fontSize: 12, color: 'var(--ink)',
                outline: 'none', resize: 'vertical', minHeight: 64,
                padding: '2px 0', fontFamily: 'inherit', lineHeight: 1.55,
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
