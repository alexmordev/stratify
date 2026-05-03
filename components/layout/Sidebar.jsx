'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import Btn from '@/components/ui/Btn';
import ColorDot from '@/components/ui/ColorDot';
import { t } from '@/lib/i18n';
import { palById } from '@/lib/palette';

const NAV_ITEMS = [
  { key: 'workspace', href: '/workspace', icon: 'flag' },
  { key: 'tareas', href: '/tareas', icon: 'calendar' },
];

export default function Sidebar({ onSearchOpen, onReviewOpen, onNewGoal }) {
  const pathname = usePathname();
  const [lang, setLang] = useState('es');
  const [thisWeekObjetivos, setThisWeekObjetivos] = useState([]);
  const [activeMetas, setActiveMetas] = useState([]);
  const [counts, setCounts] = useState({ metas: 0, objetivos: 0, tareas: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'es') setLang(stored);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/sidebar-data');
        if (res.ok) {
          const data = await res.json();
          setThisWeekObjetivos(data.thisWeekObjetivos ?? []);
          setActiveMetas(data.activeMetas ?? []);
          setCounts(data.counts ?? { metas: 0, objetivos: 0, tareas: 0 });
        }
      } catch { }
    }
    fetchData();
  }, []);

  function handleLangChange(newLang) {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    window.dispatchEvent(new Event('langchange'));
  }

  return (
    <aside
      data-testid="sidebar"
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        borderRight: '1px solid var(--line-2)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel)',
        position: 'fixed',
        top: 0,
        left: 0,
        overflowY: 'auto',
      }}
    >
      {/* Header: Logo + Lang toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 14px 10px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            className="serif"
            style={{ color: 'white', fontSize: 15, lineHeight: 1, userSelect: 'none' }}
          >
            m
          </span>
        </div>

        {/* Language toggle */}
        <div style={{ display: 'flex', gap: 2 }}>
          {['es', 'en'].map((l) => (
            <button
              key={l}
              aria-label={`Switch to ${l.toUpperCase()}`}
              aria-pressed={lang === l}
              onClick={() => handleLangChange(l)}
              className="mono"
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                padding: '3px 7px',
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: lang === l ? 'var(--bg-2)' : 'transparent',
                color: lang === l ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: lang === l ? 500 : 400,
                fontFamily: 'inherit',
                transition: 'background .1s',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Search button */}
      <div style={{ padding: '0 10px 10px' }}>
        <button
          onClick={onSearchOpen}
          data-testid="search-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '6px 10px',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--ink-3)',
            fontFamily: 'inherit',
            fontSize: 13,
            gap: 7,
          }}
        >
          <Icon name="search" size={14} />
          <span style={{ flex: 1, textAlign: 'left' }}>
            {t(lang, 'metas') ? 'Buscar…' : 'Buscar…'}
          </span>
          <kbd
            style={{
              fontSize: 11,
              color: 'var(--ink-4)',
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              padding: '1px 5px',
              fontFamily: 'inherit',
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav section */}
      <div style={{ padding: '0 10px', flex: 1 }}>
        <div
          className="mono"
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            color: 'var(--ink-4)',
            letterSpacing: '0.05em',
            padding: '6px 6px 4px',
          }}
        >
          {t(lang, 'workspace')}
        </div>

        {NAV_ITEMS.map(({ key, href, icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + '/');
          const count = counts[key] ?? 0;
          return (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${key}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 13.5,
                color: isActive ? 'var(--ink)' : 'var(--ink-2)',
                fontWeight: isActive ? 500 : 400,
                background: isActive ? 'oklch(0.95 0.004 90)' : 'transparent',
                transition: 'background .1s',
              }}
            >
              <Icon name={icon} size={15} />
              <span style={{ flex: 1 }}>{t(lang, key)}</span>
              {count > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    background: 'var(--bg-2)',
                    borderRadius: 10,
                    padding: '1px 6px',
                    minWidth: 20,
                    textAlign: 'center',
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Active metas section */}
      {activeMetas.length > 0 && (
        <div style={{ padding: '10px 10px 4px' }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              letterSpacing: '0.05em',
              padding: '0 6px 4px',
            }}
          >
            {t(lang, 'thisWeek')}
          </div>
          {activeMetas.map((meta) => (
            <div
              key={meta.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 6px',
              }}
            >
              <span
                className="pulse"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'oklch(0.62 0.14 145)',
                  display: 'block', flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {lang === 'en' && meta.title_en ? meta.title_en : meta.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '10px',
          borderTop: '1px solid var(--line-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <Btn
          variant="ghost"
          style={{ width: '100%', justifyContent: 'flex-start' }}
          onClick={onReviewOpen}
          data-testid="review-btn"
        >
          <Icon name="review" size={14} />
          {t(lang, 'weeklyReview')}
        </Btn>
        <Btn variant="primary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={onNewGoal}>
          <Icon name="plus" size={14} />
          {t(lang, 'newMeta')}
        </Btn>
      </div>
    </aside>
  );
}
