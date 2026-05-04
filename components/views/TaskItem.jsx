import { useState } from 'react';
import Check from '@/components/ui/Check';
import Icon from '@/components/ui/Icon';
import { t } from '@/lib/i18n';

const DAY_LABELS_ES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DAY_LABELS_EN = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function TaskItem({
  task, lang,
  onToggle, onDelete, onUpdate, onUnschedule,
  isDraggable, isDragging, onDragStart, onDragEnd,
  accentColor,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editingSessions, setEditingSessions] = useState(false);
  const [sessionsDraft, setSessionsDraft] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dayLabels = lang === 'es' ? DAY_LABELS_ES : DAY_LABELS_EN;
  const accent = accentColor ?? 'var(--ink-3)';
  const dots = Math.min(task.sessions ?? 0, 6);

  function handleEdit() {
    setIsEditing(true);
    setEditTitle(task.title);
  }

  function handleSave() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdate(task.id, { title: trimmed });
    }
    setIsEditing(false);
  }

  function handleCancel() {
    setIsEditing(false);
    setEditTitle(task.title);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') handleCancel();
  }

  function startEditSessions() {
    setSessionsDraft(String(task.sessions ?? 1));
    setEditingSessions(true);
  }

  function saveSessions() {
    const n = parseInt(sessionsDraft, 10);
    if (!isNaN(n) && n >= 1 && n !== (task.sessions ?? 1)) {
      onUpdate(task.id, { sessions: n });
    }
    setEditingSessions(false);
  }

  function handleSessionsKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveSessions(); }
    if (e.key === 'Escape') setEditingSessions(false);
    // Increment/decrement with arrow keys
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSessionsDraft(v => String(Math.min(20, (parseInt(v, 10) || 1) + 1)));
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSessionsDraft(v => String(Math.max(1, (parseInt(v, 10) || 1) - 1)));
    }
  }

  const bg = task.done
    ? 'var(--bg-2)'
    : task.day == null
      ? 'oklch(0.985 0.005 90)'
      : 'transparent';

  return (
    <div
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 16px 1fr auto auto auto auto',
        alignItems: 'center', gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid var(--line-2)',
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
      <Check checked={task.done} onChange={() => onToggle(task.id)} size={16} />

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
            padding: '2px 6px', background: 'white', outline: 'none', width: '100%',
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
            padding: '2px 4px', background: 'white', outline: 'none', textAlign: 'center',
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

      {/* Scheduled day label */}
      <span className="mono" style={{ fontSize: 10.5, minWidth: 28, textAlign: 'right', color: 'var(--ink-4)' }}>
        {task.day != null ? (dayLabels[task.day] ?? '—').toLowerCase() : '—'}
      </span>

      {/* Unschedule button (only when scheduled) */}
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

      {/* Edit + Delete actions */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
  );
}
