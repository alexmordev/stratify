import { useState } from 'react';
import Check from '@/components/ui/Check';
import Icon from '@/components/ui/Icon';

export default function TaskItem({ task, lang, onToggle, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid var(--line-2)',
        background: task.done ? 'var(--bg-2)' : 'transparent',
      }}
    >
      <Check
        checked={task.done}
        onChange={() => onToggle(task.id)}
        size={16}
      />

      {isEditing ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          style={{
            flex: 1,
            fontSize: 12.5,
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: '4px 8px',
            background: 'white',
            outline: 'none',
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            fontSize: 12.5,
            textDecoration: task.done ? 'line-through' : 'none',
            color: task.done ? 'var(--ink-4)' : 'var(--ink)',
            cursor: 'pointer',
            padding: '4px 0',
          }}
          onClick={handleEdit}
        >
          {task.title}
        </div>
      )}

      {!isEditing && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            onClick={handleEdit}
            title={lang === 'es' ? 'Editar tarea' : 'Edit task'}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--ink-4)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="edit" size={12} />
          </button>

          {showDeleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
                {lang === 'es' ? '¿Eliminar?' : 'Delete?'}
              </span>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); onDelete(task.id); }}
                style={{
                  border: 'none',
                  background: 'oklch(0.6 0.18 25)',
                  color: 'white',
                  borderRadius: 4,
                  padding: '1px 6px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--ink-3)',
                  borderRadius: 4,
                  padding: '1px 6px',
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                ✗
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              title={lang === 'es' ? 'Eliminar tarea' : 'Delete task'}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--ink-4)',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Icon name="trash" size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
