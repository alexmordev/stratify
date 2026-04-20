import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock prisma singleton ---
const prismaMock = {
  meta: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  objetivo: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  tarea: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ default: prismaMock }));

// Import after mock is set up
const { createMeta, toggleMetaActive } = await import('@/lib/actions/metas');
const { createTarea, toggleTarea } = await import('@/lib/actions/tareas');
const { objProgress, metaProgress } = await import('@/lib/progress');

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createMeta ───────────────────────────────────────────────────────────────
describe('createMeta', () => {
  it('persists and returns the record', async () => {
    const input = {
      title: 'Test meta',
      title_en: 'Test meta',
      why: 'reason',
      why_en: 'reason',
      success: 'success criteria',
      success_en: 'success criteria',
      horizon: 'Q4 2026',
      horizon_en: 'Q4 2026',
    };
    const expected = { id: 'meta_1', ...input, active: true };
    prismaMock.meta.create.mockResolvedValue(expected);

    const result = await createMeta(input);

    expect(prismaMock.meta.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(expected);
  });
});

// ─── toggleMetaActive ─────────────────────────────────────────────────────────
describe('toggleMetaActive', () => {
  it('inverts the active field from true to false', async () => {
    prismaMock.meta.findUnique.mockResolvedValue({ id: 'meta_1', active: true });
    prismaMock.meta.update.mockResolvedValue({ id: 'meta_1', active: false });

    const result = await toggleMetaActive('meta_1');

    expect(prismaMock.meta.update).toHaveBeenCalledWith({
      where: { id: 'meta_1' },
      data: { active: false },
    });
    expect(result.active).toBe(false);
  });

  it('inverts the active field from false to true', async () => {
    prismaMock.meta.findUnique.mockResolvedValue({ id: 'meta_2', active: false });
    prismaMock.meta.update.mockResolvedValue({ id: 'meta_2', active: true });

    const result = await toggleMetaActive('meta_2');

    expect(prismaMock.meta.update).toHaveBeenCalledWith({
      where: { id: 'meta_2' },
      data: { active: true },
    });
    expect(result.active).toBe(true);
  });
});

// ─── createTarea ──────────────────────────────────────────────────────────────
describe('createTarea', () => {
  it('assigns done: false by default', async () => {
    const input = {
      objId: 'obj_1',
      title: 'New task',
      title_en: 'New task',
      day: 0,
      start: 9,
      dur: 1,
    };
    const expected = { id: 'tarea_1', ...input, done: false };
    prismaMock.tarea.create.mockResolvedValue(expected);

    const result = await createTarea(input);

    expect(prismaMock.tarea.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ done: false }) })
    );
    expect(result.done).toBe(false);
  });
});

// ─── toggleTarea ──────────────────────────────────────────────────────────────
describe('toggleTarea', () => {
  it('increments done on objetivo when task is marked complete', async () => {
    prismaMock.tarea.findUnique.mockResolvedValue({
      id: 'tarea_1',
      objId: 'obj_1',
      done: false,
    });
    prismaMock.tarea.update.mockResolvedValue({ id: 'tarea_1', done: true });
    prismaMock.objetivo.update.mockResolvedValue({ id: 'obj_1', done: 1 });

    await toggleTarea('tarea_1');

    expect(prismaMock.objetivo.update).toHaveBeenCalledWith({
      where: { id: 'obj_1' },
      data: { done: { increment: 1 } },
    });
  });

  it('decrements done on objetivo when task is marked incomplete', async () => {
    prismaMock.tarea.findUnique.mockResolvedValue({
      id: 'tarea_2',
      objId: 'obj_1',
      done: true,
    });
    prismaMock.tarea.update.mockResolvedValue({ id: 'tarea_2', done: false });
    prismaMock.objetivo.update.mockResolvedValue({ id: 'obj_1', done: 0 });

    await toggleTarea('tarea_2');

    expect(prismaMock.objetivo.update).toHaveBeenCalledWith({
      where: { id: 'obj_1' },
      data: { done: { increment: -1 } },
    });
  });
});

// ─── objProgress ──────────────────────────────────────────────────────────────
describe('objProgress', () => {
  it('returns 0 when there are no tasks', () => {
    expect(objProgress('obj_1', [])).toBe(0);
  });

  it('returns 0 when no tasks are done', () => {
    const tareas = [
      { objId: 'obj_1', done: false },
      { objId: 'obj_1', done: false },
    ];
    expect(objProgress('obj_1', tareas)).toBe(0);
  });

  it('returns 100 when all tasks are done', () => {
    const tareas = [
      { objId: 'obj_1', done: true },
      { objId: 'obj_1', done: true },
    ];
    expect(objProgress('obj_1', tareas)).toBe(100);
  });

  it('returns 50 when half the tasks are done', () => {
    const tareas = [
      { objId: 'obj_1', done: true },
      { objId: 'obj_1', done: false },
    ];
    expect(objProgress('obj_1', tareas)).toBe(50);
  });

  it('ignores tasks from other objectives', () => {
    const tareas = [
      { objId: 'obj_1', done: true },
      { objId: 'obj_2', done: false },
    ];
    expect(objProgress('obj_1', tareas)).toBe(100);
  });
});

// ─── metaProgress ─────────────────────────────────────────────────────────────
describe('metaProgress', () => {
  it('returns 100 when all objectives are 100%', () => {
    const objetivos = [
      { id: 'obj_1', metaId: 'meta_1', weeklyLoad: 2 },
      { id: 'obj_2', metaId: 'meta_1', weeklyLoad: 3 },
    ];
    const tareas = [
      { objId: 'obj_1', done: true },
      { objId: 'obj_2', done: true },
    ];
    expect(metaProgress('meta_1', objetivos, tareas)).toBe(100);
  });

  it('weights correctly by weeklyLoad', () => {
    // obj_1: weeklyLoad=1, 100% done; obj_2: weeklyLoad=3, 0% done
    // weighted = (100*1 + 0*3) / 4 = 25
    const objetivos = [
      { id: 'obj_1', metaId: 'meta_1', weeklyLoad: 1 },
      { id: 'obj_2', metaId: 'meta_1', weeklyLoad: 3 },
    ];
    const tareas = [
      { objId: 'obj_1', done: true },
      { objId: 'obj_2', done: false },
    ];
    expect(metaProgress('meta_1', objetivos, tareas)).toBe(25);
  });

  it('returns 0 when no objectives exist for the meta', () => {
    expect(metaProgress('meta_99', [], [])).toBe(0);
  });

  it('subtasks in Json do not affect objective progress calculation', () => {
    const objetivos = [{ id: 'obj_1', metaId: 'meta_1', weeklyLoad: 1 }];
    // subtasks field is irrelevant — only done boolean on tarea counts
    const tareas = [
      {
        objId: 'obj_1',
        done: true,
        subtasks: [
          { t: 'step 1', d: false },
          { t: 'step 2', d: false },
        ],
      },
    ];
    expect(metaProgress('meta_1', objetivos, tareas)).toBe(100);
  });
});
