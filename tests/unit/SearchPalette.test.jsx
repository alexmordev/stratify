import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

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

import SearchPalette from '@/components/layout/SearchPalette';

const mockSearchResults = {
  metas: [{ id: 1, title: 'Aprender React', title_en: 'Learn React' }],
  objetivos: [{ id: 1, title: 'Completar curso', title_en: 'Complete course' }],
  tareas: [{ id: 1, title: 'Leer documentación', title_en: 'Read docs' }],
};

describe('SearchPalette', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is hidden when open=false', () => {
    render(<SearchPalette open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is visible when open=true', () => {
    render(<SearchPalette open={true} onClose={() => {}} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('Escape key calls onClose', () => {
    const onClose = vi.fn();
    render(<SearchPalette open={true} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking backdrop calls onClose', () => {
    const onClose = vi.fn();
    render(<SearchPalette open={true} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('debounce: input change triggers search after 150ms delay', async () => {
    render(<SearchPalette open={true} onClose={() => {}} />);
    const input = screen.getByPlaceholderText(/buscar/i);

    fireEvent.change(input, { target: { value: 'React' } });

    // Fetch should NOT be called immediately
    expect(global.fetch).not.toHaveBeenCalled();

    // Advance timers and flush promises
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('filtering shows matching items after debounce', async () => {
    render(<SearchPalette open={true} onClose={() => {}} />);
    const input = screen.getByPlaceholderText(/buscar/i);

    fireEvent.change(input, { target: { value: 'React' } });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByText('Aprender React')).toBeTruthy();
  });

  it('empty query clears results without fetch', () => {
    render(<SearchPalette open={true} onClose={() => {}} />);
    const input = screen.getByPlaceholderText(/buscar/i);

    fireEvent.change(input, { target: { value: '' } });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
