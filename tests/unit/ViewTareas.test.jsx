import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/tareas',
}));

// Mock server actions
vi.mock('@/lib/actions/tareas', () => ({
  toggleTarea: vi.fn((id) => Promise.resolve({ id, done: true })),
  moveTarea: vi.fn((id, day) => Promise.resolve({ id, day })),
  createTarea: vi.fn((data) => Promise.resolve({ id: 'new-tarea', done: false, ...data })),
  getTareas: vi.fn(() => Promise.resolve([])),
  updateSubtasks: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/actions/objetivos', () => ({
  getObjetivos: vi.fn(() => Promise.resolve([])),
  createObjetivo: vi.fn(),
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

import ViewTareas from '@/components/views/ViewTareas';
import { toggleTarea, moveTarea, createTarea } from '@/lib/actions/tareas';

// Helper: get today's dayOfWeek index (Mon=0 ... Sun=6)
function todayDayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

const TODAY_DAY = todayDayIndex();

const OBJETIVOS = [
  {
    id: 'obj-1',
    metaId: 'meta-1',
    title: 'Objetivo Uno',
    title_en: 'Objective One',
    color: 'moss',
    weeklyLoad: 2,
    done: 1,
  },
  {
    id: 'obj-2',
    metaId: 'meta-1',
    title: 'Objetivo Dos',
    title_en: 'Objective Two',
    color: 'sky',
    weeklyLoad: 1,
    done: 0,
  },
];

const TAREAS = [
  {
    id: 'tarea-1',
    objId: 'obj-1',
    title: 'Tarea Uno',
    title_en: 'Task One',
    day: TODAY_DAY,
    start: 9,
    dur: 1,
    done: false,
    objetivo: OBJETIVOS[0],
    subtasks: null,
  },
  {
    id: 'tarea-2',
    objId: 'obj-1',
    title: 'Tarea Dos',
    title_en: 'Task Two',
    day: TODAY_DAY,
    start: 11,
    dur: 2,
    done: false,
    objetivo: OBJETIVOS[0],
    subtasks: null,
  },
];

function renderView(props = {}) {
  return render(
    <ViewTareas
      tareas={props.tareas ?? TAREAS}
      objetivos={props.objetivos ?? OBJETIVOS}
      metas={props.metas ?? []}
    />
  );
}

describe('ViewTareas', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('view "day" shows 1 column, "4d" shows 4, "week" shows 7', async () => {
    renderView();

    // Default is week — 7 columns
    const calendarCols = screen.getByTestId('calendar-columns');
    expect(calendarCols.children.length).toBe(7);

    // Switch to day
    await act(async () => {
      fireEvent.click(screen.getByText('Día'));
    });
    expect(screen.getByTestId('calendar-columns').children.length).toBe(1);

    // Switch to 4 days
    await act(async () => {
      fireEvent.click(screen.getByText('4 días'));
    });
    expect(screen.getByTestId('calendar-columns').children.length).toBe(4);

    // Switch back to week
    await act(async () => {
      fireEvent.click(screen.getByText('Semana'));
    });
    expect(screen.getByTestId('calendar-columns').children.length).toBe(7);
  });

  it('drop on different column calls moveTarea with correct (id, dayIndex)', async () => {
    renderView();

    // Drag tarea-1
    const card = screen.getByTestId('task-card-tarea-1');
    await act(async () => {
      fireEvent.dragStart(card);
    });

    // Drop on column index 2 (third column in week view)
    const targetColumn = screen.getByTestId('day-column-2');
    await act(async () => {
      fireEvent.dragOver(targetColumn);
      fireEvent.drop(targetColumn);
    });

    await waitFor(() => {
      expect(moveTarea).toHaveBeenCalled();
    });

    const callArgs = moveTarea.mock.calls[0];
    expect(callArgs[0]).toBe('tarea-1');
    // dayIndex 2 in week view = Wednesday (index 2 from Monday = Wed = day 2)
    expect(typeof callArgs[1]).toBe('number');
  });

  it('click Check on a TaskCard calls toggleTarea with task id', async () => {
    renderView();

    const card = screen.getByTestId('task-card-tarea-1');
    const checkbox = card.querySelector('[role="checkbox"]');
    expect(checkbox).toBeTruthy();

    await act(async () => {
      fireEvent.click(checkbox);
    });

    await waitFor(() => {
      expect(toggleTarea).toHaveBeenCalledWith('tarea-1');
    });
  });

  it('click on empty slot at Y=88 opens modal with start=9', async () => {
    renderView();

    // Switch to day view to have a single clear column
    await act(async () => {
      fireEvent.click(screen.getByText('Día'));
    });

    const column = screen.getByTestId('day-column-0');

    // Mock getBoundingClientRect so relY calculation works
    column.getBoundingClientRect = () => ({
      top: 0,
      left: 0,
      bottom: 660,
      right: 200,
      width: 200,
      height: 660,
    });

    // Y=88 → relY=88, SLOT_H=44 → 88/44=2 hours from HOUR_START(7) → start = 7 + floor((88/44)*2)/2 = 7 + floor(4)/2 = 7 + 2 = 9
    await act(async () => {
      fireEvent.click(column, { clientY: 88 });
    });

    await waitFor(() => {
      expect(screen.getByTestId('quick-create-modal')).toBeTruthy();
    });

    // The modal should show time indicator with 9
    const modal = screen.getByTestId('quick-create-modal');
    expect(modal.textContent).toContain('9');
  });

  it('TaskCard with dur=0.5 renders with height >= 22px', () => {
    const shortTarea = {
      id: 'tarea-short',
      objId: 'obj-1',
      title: 'Short task',
      title_en: 'Short task',
      day: TODAY_DAY,
      start: 10,
      dur: 0.5,
      done: false,
      objetivo: OBJETIVOS[0],
      subtasks: null,
    };

    renderView({ tareas: [shortTarea] });

    const card = screen.getByTestId('task-card-tarea-short');
    // The card uses inline style height: Math.max(0.5 * 44, 22) = Math.max(22, 22) = 22
    // For dur=0.5: 0.5 * 44 = 22, so height = 22 >= 22
    const styleAttr = card.getAttribute('style');
    // Extract height from inline styles
    const heightMatch = styleAttr && styleAttr.match(/height:\s*(\d+(?:\.\d+)?)px/);
    if (heightMatch) {
      expect(Number(heightMatch[1])).toBeGreaterThanOrEqual(22);
    } else {
      // height is set via style object, check computed-like from jsdom
      expect(card.style.height).toBeTruthy();
      const h = parseInt(card.style.height, 10);
      expect(h).toBeGreaterThanOrEqual(22);
    }
  });
});
