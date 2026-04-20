'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';

export default function SearchPalette({ open, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ metas: [], objetivos: [], tareas: [] });
  const [lang, setLang] = useState('es');
  const debounceRef = useRef(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    if (stored) setLang(stored);

    function handleLangChange() {
      const updated = localStorage.getItem('lang') || 'es';
      setLang(updated);
    }
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setQuery('');
      setResults({ metas: [], objetivos: [], tareas: [] });
    }
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && open) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) {
          // Signal parent to open — parent manages open state
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const search = useCallback(async (q) => {
    if (!q.trim()) {
      setResults({ metas: [], objetivos: [], tareas: [] });
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // Ignore search errors
    }
  }, []);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(q);
    }, 150);
  }

  function handleNavigate(path) {
    router.push(path);
    onClose();
  }

  function getTitle(item) {
    return lang === 'en' && item.title_en ? item.title_en : item.title;
  }

  if (!open) return null;

  const hasResults =
    results.metas.length > 0 ||
    results.objetivos.length > 0 ||
    results.tareas.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search palette"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        background: 'rgba(0,0,0,0.3)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 500,
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 14px',
            borderBottom: hasResults ? '1px solid var(--line-2)' : 'none',
          }}
        >
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            placeholder={t(lang, 'searchPlaceholder')}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 14,
              color: 'var(--ink)',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {hasResults && (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {results.metas.length > 0 && (
              <ResultGroup
                label={t(lang, 'metas')}
                items={results.metas}
                path="/metas"
                getTitle={getTitle}
                onNavigate={handleNavigate}
              />
            )}
            {results.objetivos.length > 0 && (
              <ResultGroup
                label={t(lang, 'objetivos')}
                items={results.objetivos}
                path="/objetivos"
                getTitle={getTitle}
                onNavigate={handleNavigate}
              />
            )}
            {results.tareas.length > 0 && (
              <ResultGroup
                label={t(lang, 'tareas')}
                items={results.tareas}
                path="/tareas"
                getTitle={getTitle}
                onNavigate={handleNavigate}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultGroup({ label, items, path, getTitle, onNavigate }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
          padding: '8px 14px 4px',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(path)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '8px 14px',
            fontSize: 13.5,
            color: 'var(--ink)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {getTitle(item)}
        </button>
      ))}
    </div>
  );
}
