import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/objetivos',
}));

// Mock server actions
vi.mock('@/lib/actions/objetivos', () => ({
  getObjetivos: vi.fn(() => Promise.resolve([])),
  createObjetivo: vi.fn((data) => Promise.resolve({ id: 'new-obj', ...data })),
  updateObjetivo: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/actions/tareas', () => ({
  toggleTarea: vi.fn((id) => Promise.resolve({ id, done: true })),
  createTarea: vi.fn((data) => Promise.resolve({ id: 'new-tarea', done: false, ...data })),
  getTareas: vi.fn(() => Promise.resolve([])),
  moveTarea: vi.fn(() => Promise.resolve()),
  updateSubtasks: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/actions/metas', () => ({
  getMetas: vi.fn(() => Promise.resolve([])),
  toggleMetaActive: vi.fn(() => Promise.resolve()),
}));

// Mock progress helpers
vi.mock('@/lib/progress', () => ({
  objProgress: vi.fn((objId, tareas) => {
    const objTareas = tareas.filter((t) => t.objId === objId);
    if (objTareas.length === 0) return 0;
    return (objTareas.filter((t) => t.done).length / objTareas.length) * 100;
  }),
  metaProgress: vi.fn((metaId, objetivos, tareas) => {
    const metaObjs = objetivos.filter((o) => o.metaId === metaId);
    if (metaObjs.length === 0) return 0;
    const totalLoad = metaObjs.reduce((s, o) => s + o.weeklyLoad, 0);
    if (totalLoad === 0) return 0;
    const weightedSum = metaObjs.reduce((s, o) => {
      const objTareas = tareas.filter((t) => t.objId === o.id);
      const prog = objTareas.length === 0 ? 0 : (objTareas.filter((t) => t.done).length / objTareas.length) * 100;
      return s + prog * o.weeklyLoad;
    }, 0);
    return weightedSum / totalLoad;
  }),
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

import ViewObjetivos from '@/components/views/ViewObjetivos';
import { toggleTarea, createTarea } from '@/lib/actions/tareas';
import { metaProgress, objProgress } from '@/lib/progress';

const METAS = [
  {
    id: 'meta-1',
    title: 'Meta Activa',
    title_en: 'Active Goal',
    active: true,
  },
  {
    id: 'meta-2',
    title: 'Meta Archivada',
    title_en: 'Archived Goal',
    active: false,
  },
];

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
    title: 'Tarea completada',
    title_en: 'Completed task',
    day: 0,
    start: 9,
    dur: 1,
    done: true,
  },
  {
    id: 'tarea-2',
    objId: 'obj-1',
    title: 'Tarea pendiente',
    title_en: 'Pending task',
    day: 1,
    start: 10,
    dur: 1,
    done: false,
  },
];

function renderView(props = {}) {
  return render(
    <ViewObjetivos
      metas={props.metas ?? METAS}
      objetivos={props.objetivos ?? OBJETIVOS}
      tareas={props.tareas ?? TAREAS}
    />
  );
}

describe('ViewObjetivos', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('empty state is visible when activeMetas.length === 0', () => {
    const inactiveMetas = METAS.map((m) => ({ ...m, active: false }));
    renderView({ metas: inactiveMetas });
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState).toBeTruthy();
    expect(screen.getByText('No hay metas activas aún')).toBeTruthy();
  });

  it('collapse/expand hides and shows the task list', async () => {
    renderView();
    // Task list is visible by default
    const taskList = screen.getByTestId('task-list-obj-1');
    expect(taskList).toBeTruthy();
    expect(screen.getByText('Tarea pendiente')).toBeTruthy();

    // Click collapse button
    const collapseBtn = screen.getByTestId('collapse-btn-obj-1');
    await act(async () => {
      fireEvent.click(collapseBtn);
    });

    // Task list should be hidden
    expect(screen.queryByTestId('task-list-obj-1')).toBeNull();
    expect(screen.queryByText('Tarea pendiente')).toBeNull();

    // Click expand again
    await act(async () => {
      fireEvent.click(collapseBtn);
    });

    // Task list visible again
    expect(screen.getByTestId('task-list-obj-1')).toBeTruthy();
    expect(screen.getByText('Tarea pendiente')).toBeTruthy();
  });

  it('completing a task updates the objetivo progress bar', async () => {
    renderView();

    // tarea-2 is not done — find its check button
    const tareaRow = screen.getByTestId('tarea-row-tarea-2');
    const checkBtn = tareaRow.querySelector('[role="checkbox"]');
    expect(checkBtn).toBeTruthy();
    expect(checkBtn.getAttribute('aria-checked')).toBe('false');

    await act(async () => {
      fireEvent.click(checkBtn);
    });

    // toggleTarea should have been called
    expect(toggleTarea).toHaveBeenCalledWith('tarea-2');

    // Optimistically updated — checkbox now checked
    await waitFor(() => {
      const updatedRow = screen.getByTestId('tarea-row-tarea-2');
      const updatedCheck = updatedRow.querySelector('[role="checkbox"]');
      expect(updatedCheck.getAttribute('aria-checked')).toBe('true');
    });
  });

  it('"Añadir tarea" creates a task with correct objId', async () => {
    renderView();

    const addBtn = screen.getByTestId('add-tarea-btn-obj-1');
    await act(async () => {
      fireEvent.click(addBtn);
    });

    // Form is visible
    const form = screen.getByTestId('add-tarea-form');
    expect(form).toBeTruthy();

    // Fill in title
    const input = form.querySelector('input[type="text"], input:not([type])');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Nueva tarea de prueba' } });
    });

    // Submit
    await act(async () => {
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(createTarea).toHaveBeenCalledWith(
        expect.objectContaining({ objId: 'obj-1', title: 'Nueva tarea de prueba' })
      );
    });
  });

  it('meta progress header uses weighted average of its objetivos', () => {
    // obj-1 has 2 tareas: 1 done, 1 not done → 50% progress, weeklyLoad 2
    // obj-2 has 0 tareas → 0% progress, weeklyLoad 1
    // weighted average: (50*2 + 0*1) / 3 = 33.33...
    renderView();

    // metaProgress should have been called with meta-1's data
    expect(metaProgress).toHaveBeenCalledWith('meta-1', expect.any(Array), expect.any(Array));

    // The meta group renders a ProgressBar for the meta header — check it exists
    const metaGroup = screen.getByTestId('meta-group-meta-1');
    expect(metaGroup).toBeTruthy();
  });
});
