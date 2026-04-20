'use server';

import prisma from '@/lib/prisma';

export async function getTareas(week) {
  return prisma.tarea.findMany({
    where: week !== undefined ? { day: { gte: 0, lte: 6 } } : undefined,
    include: { objetivo: true },
    orderBy: [{ day: 'asc' }, { start: 'asc' }],
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

export async function moveTarea(id, day) {
  return prisma.tarea.update({ where: { id }, data: { day } });
}

export async function updateSubtasks(id, subtasks) {
  return prisma.tarea.update({ where: { id }, data: { subtasks } });
}
