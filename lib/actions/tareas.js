'use server';

import prisma from '@/lib/prisma';

export async function getTareas(week) {
  return prisma.tarea.findMany({
    where: week !== undefined ? { day: { gte: 0, lte: 6 } } : undefined,
    include: { objetivo: true },
    orderBy: [{ sortOrder: 'asc' }, { day: 'asc' }, { start: 'asc' }],
  });
}

export async function createTarea(data) {
  return prisma.tarea.create({
    data: { ...data, done: false },
    include: { objetivo: true },
  });
}

export async function toggleTarea(id) {
  const tarea = await prisma.tarea.findUnique({ where: { id } });
  const updatedTarea = await prisma.tarea.update({
    where: { id },
    data: { done: !tarea.done },
  });

  const increment = updatedTarea.done ? 1 : -1;
  await prisma.objetivo.update({
    where: { id: tarea.objId },
    data: { done: { increment } },
  });

  return updatedTarea;
}

export async function updateTarea(id, data) {
  return prisma.tarea.update({
    where: { id },
    data,
    include: { objetivo: true },
  });
}

export async function reorderTareas(updates) {
  await prisma.$transaction(
    updates.map(({ id, sortOrder }) =>
      prisma.tarea.update({ where: { id }, data: { sortOrder } })
    )
  );
}

export async function deleteTarea(id) {
  const tarea = await prisma.tarea.findUnique({ where: { id }, select: { objId: true, done: true } });
  if (tarea.done) {
    await prisma.objetivo.update({
      where: { id: tarea.objId },
      data: { done: { decrement: 1 } },
    });
  }
  return prisma.tarea.delete({ where: { id } });
}

export async function moveTarea(id, day) {
  return prisma.tarea.update({ where: { id }, data: { day } });
}

export async function updateSubtasks(id, subtasks) {
  return prisma.tarea.update({ where: { id }, data: { subtasks } });
}

export async function scheduleTarea(id, day, start) {
  return prisma.tarea.update({ where: { id }, data: { day, start } });
}

export async function unscheduleTarea(id) {
  return prisma.tarea.update({ where: { id }, data: { day: null, start: null } });
}
