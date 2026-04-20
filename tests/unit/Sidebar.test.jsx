import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockUsePathname = vi.fn(() => '/tareas');
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ activeMetas: [], counts: { metas: 0, objetivos: 0, tareas: 0 } }),
  })
);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

import Sidebar from '@/components/layout/Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ activeMetas: [], counts: { metas: 0, objetivos: 0, tareas: 0 } }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nav items: Metas, Objetivos, Tareas', () => {
    render(<Sidebar onSearchOpen={() => {}} />);
    expect(screen.getByTestId('nav-metas')).toBeTruthy();
    expect(screen.getByTestId('nav-objetivos')).toBeTruthy();
    expect(screen.getByTestId('nav-tareas')).toBeTruthy();
  });

  it('active item has differentiated style based on current pathname', () => {
    mockUsePathname.mockReturnValue('/tareas');
    render(<Sidebar onSearchOpen={() => {}} />);

    const tareasLink = screen.getByTestId('nav-tareas');
    const metasLink = screen.getByTestId('nav-metas');

    expect(tareasLink.style.background).toBe('oklch(0.95 0.004 90)');
    expect(metasLink.style.background).toBe('transparent');
  });

  it('language toggle: clicking EN persists "en" to localStorage', async () => {
    const user = userEvent.setup();
    render(<Sidebar onSearchOpen={() => {}} />);

    const enBtn = screen.getByRole('button', { name: /switch to en/i });
    await user.click(enBtn);

    expect(localStorageMock.getItem('lang')).toBe('en');
  });

  it('language toggle: clicking ES persists "es" to localStorage', async () => {
    const user = userEvent.setup();
    // Start with EN
    localStorageMock.setItem('lang', 'en');
    render(<Sidebar onSearchOpen={() => {}} />);

    const esBtn = screen.getByRole('button', { name: /switch to es/i });
    await user.click(esBtn);

    expect(localStorageMock.getItem('lang')).toBe('es');
  });

  it('footer contains "Review semanal" and "Nueva meta" buttons', () => {
    render(<Sidebar onSearchOpen={() => {}} />);
    expect(screen.getByText('Review semanal')).toBeTruthy();
    expect(screen.getByText('Nueva meta')).toBeTruthy();
  });
});
