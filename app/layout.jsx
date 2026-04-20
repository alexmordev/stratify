'use client';

import { Inter, IBM_Plex_Mono, Fraunces } from 'next/font/google';
import { useState, useEffect } from 'react';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import SearchPalette from '@/components/layout/SearchPalette';
import ModalReview from '@/components/modals/ModalReview';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

export default function RootLayout({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <html lang="es">
      <body className={`${inter.variable} ${ibmPlexMono.variable} ${fraunces.variable}`}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar onSearchOpen={() => setSearchOpen(true)} onReviewOpen={() => setReviewOpen(true)} />
          <main
            style={{
              marginLeft: 240,
              flex: 1,
              minWidth: 0,
              minHeight: '100vh',
              background: 'var(--bg)',
            }}
          >
            {children}
          </main>
        </div>
        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
        <ModalReview open={reviewOpen} onClose={() => setReviewOpen(false)} />
      </body>
    </html>
  );
}
