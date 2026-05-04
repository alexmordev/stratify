import { useState } from 'react';
import Icon from '@/components/ui/Icon';

export default function NewTaskForm({ lang, onSave, onCancel }) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onSave(trimmedTitle);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderBottom: '1px solid var(--line-2)',
    }}>
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: 8 }}>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={lang === 'es' ? 'Nueva tarea...' : 'New task...'}
          style={{
            flex: 1, fontSize: 12.5,
            border: '1px solid var(--line)', borderRadius: 4,
            padding: '6px 10px', background: 'white',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            border: '1px solid var(--line)', background: 'white',
            borderRadius: 4, padding: '6px 10px', cursor: 'pointer',
            fontSize: 12, color: 'var(--ink)',
          }}
        >
          {lang === 'es' ? 'Guardar' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: '1px solid var(--line)', background: 'transparent',
            borderRadius: 4, padding: '6px 10px', cursor: 'pointer',
            fontSize: 12, color: 'var(--ink-3)',
          }}
        >
          {lang === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
      </form>
    </div>
  );
}