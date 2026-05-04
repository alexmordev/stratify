'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getObjetivos(metaId) {
  return prisma.objetivo.findMany({
    where: metaId ? { metaId } : undefined,
    include: { tareas: true },
    orderBy: { id: 'asc' },
  });
}

export async function createObjetivo(data) {
  const result = await prisma.objetivo.create({ data });
  revalidatePath('/workspace');
  revalidatePath('/objetivos');
  return result;
}

export async function updateObjetivo(id, data) {
  const result = await prisma.objetivo.update({ where: { id }, data });
  revalidatePath('/workspace');
  revalidatePath('/objetivos');
  return result;
}

export async function deleteObjetivo(id) {
  const result = await prisma.objetivo.delete({ where: { id } });
  revalidatePath('/workspace');
  revalidatePath('/objetivos');
  return result;
}

export async function toggleObjetivoCompleted(id) {
  const obj = await prisma.objetivo.findUnique({ where: { id }, select: { done: true } });
  const updated = await prisma.objetivo.update({ where: { id }, data: { done: obj.done ? 0 : 1 } });
  revalidatePath('/workspace');
  revalidatePath('/objetivos');
  return updated;
}

export async function toggleObjetivoThisWeek(id) {
  const obj = await prisma.objetivo.findUnique({ where: { id }, select: { thisWeek: true } });
  return prisma.objetivo.update({ where: { id }, data: { thisWeek: !obj.thisWeek } });
}
