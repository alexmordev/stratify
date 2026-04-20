import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/metas',
}));

// Mock server actions
vi.mock('@/lib/actions/metas', () => ({
  toggleMetaActive: vi.fn(() => Promise.resolve()),
}));

// Mock progress helpers
vi.mock('@/lib/progress', () => ({
  metaProgress: vi.fn(() => 0),
  objProgress: vi.fn(() => 0),
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

import ViewMetas from '@/components/views/ViewMetas';
import { toggleMetaActive } from '@/lib/actions/metas';
import { metaProgress } from '@/lib/progress';

const METAS = [
  {
    id: 'meta-1',
    title: 'Meta Activa ES',
    title_en: 'Active Goal EN',
    why: 'Porque quiero crecer',
    why_en: 'Because I want to grow',
    horizon: 'Q4 2025',
    horizon_en: 'Q4 2025',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'meta-2',
    title: 'Meta Inactiva ES',
    title_en: 'Inactive Goal EN',
    why: 'Razón inactiva',
    why_en: 'Inactive reason',
    horizon: 'Q1 2025',
    horizon_en: 'Q1 2025',
    active: false,
    createdAt: new Date().toISOString(),
  },
];

const OBJETIVOS = [
  {
    id: 'obj-1',
    metaId: 'meta-1',
    title: 'Objetivo 1',
    title_en: 'Objective 1',
    color: 'moss',
    weeklyLoad: 3,
    done: 1,
  },
  {
    id: 'obj-2',
    metaId: 'meta-2',
    title: 'Objetivo 2',
    title_en: 'Objective 2',
    color: 'sky',
    weeklyLoad: 2,
    done: 0,
  },
];

const TAREAS = [
  {
    id: 'tarea-1',
    objId: 'obj-1',
    title: 'Tarea 1',
    title_en: 'Task 1',
    day: 0,
    start: 9,
    dur: 1,
    done: true,
  },
  {
    id: 'tarea-2',
    objId: 'obj-1',
    title: 'Tarea 2',
    title_en: 'Task 2',
    day: 1,
    start: 10,
    dur: 1,
    done: false,
  },
];

function renderViewMetas(props = {}) {
  return render(
    <ViewMetas
      metas={props.metas ?? METAS}
      objetivos={props.objetivos ?? OBJETIVOS}
      tareas={props.tareas ?? TAREAS}
    />
  );
}

describe('ViewMetas', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    metaProgress.mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders active and inactive sections', () => {
    renderViewMetas();
    // Both section headings visible (ES by default)
    const activeHeadings = screen.getAllByText('Activas');
    expect(activeHeadings.length).toBeGreaterThan(0);
    const archivedHeadings = screen.getAllByText('Archivadas');
    expect(archivedHeadings.length).toBeGreaterThan(0);
    // Active card visible
    expect(screen.getByText('Meta Activa ES')).toBeTruthy();
    // Inactive card visible
    expect(screen.getByText('Meta Inactiva ES')).toBeTruthy();
  });

  it('MetaCard shows correct donut % from metaProgress', () => {
    metaProgress.mockReturnValue(75);
    renderViewMetas();
    // Donut renders the percentage as text label
    expect(screen.getAllByText('75%').length).toBeGreaterThan(0);
  });

  it('Switch toggle moves card from Activas to Inactivas optimistically', async () => {
    renderViewMetas();
    // meta-1 is active, find its switch
    const card = screen.getByTestId('meta-card-meta-1');
    const switchBtn = card.querySelector('[role="switch"]');
    expect(switchBtn).toBeTruthy();

    await act(async () => {
      fireEvent.click(switchBtn);
    });

    expect(toggleMetaActive).toHaveBeenCalledWith('meta-1');
    // After optimistic update, meta-1 should now be inactive
    await waitFor(() => {
      const updatedCard = screen.getByTestId('meta-card-meta-1');
      const sw = updatedCard.querySelector('[role="switch"]');
      expect(sw.getAttribute('aria-checked')).toBe('false');
    });
  });

  it('click on card body navigates to /objetivos?metaId=...', () => {
    renderViewMetas();
    const card = screen.getByTestId('meta-card-meta-1');
    // Click on the title text (not the switch area)
    const title = card.querySelector('[style*="font-weight: 500"]') ?? card;
    fireEvent.click(card);
    expect(mockPush).toHaveBeenCalledWith('/objetivos?metaId=meta-1');
  });

  it('empty state shown when active.length === 0', () => {
    const inactiveMetas = METAS.map((m) => ({ ...m, active: false }));
    renderViewMetas({ metas: inactiveMetas });
    const emptyStates = screen.getAllByTestId('empty-state');
    // At least the active section empty state should show
    expect(emptyStates.length).toBeGreaterThan(0);
    expect(screen.getByText('No hay metas activas')).toBeTruthy();
  });

  it('objective chips show ColorDot with correct palette color', () => {
    renderViewMetas();
    const chip = screen.getByTestId('obj-chip-obj-1');
    expect(chip).toBeTruthy();
    // ColorDot renders a span with background style — find the dot inside the chip
    const dot = chip.querySelector('span[style*="border-radius: 50%"]');
    expect(dot).toBeTruthy();
    // moss palette dot color
    expect(dot.style.background).toBe('oklch(0.7 0.13 140)');
  });

  it('language toggle event updates text to title_en', async () => {
    renderViewMetas();
    // Initially ES
    expect(screen.getByText('Meta Activa ES')).toBeTruthy();

    // Simulate lang change to EN
    localStorageMock.setItem('lang', 'en');
    await act(async () => {
      window.dispatchEvent(new Event('langchange'));
    });

    await waitFor(() => {
      expect(screen.getByText('Active Goal EN')).toBeTruthy();
    });
  });
});
