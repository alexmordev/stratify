'use server';

import prisma from '@/lib/prisma';

export async function getObjetivos(metaId) {
  return prisma.objetivo.findMany({
    where: metaId ? { metaId } : undefined,
    include: { tareas: true },
    orderBy: { id: 'asc' },
  });
}

export async function createObjetivo(data) {
  return prisma.objetivo.create({ data });
}

export async function updateObjetivo(id, data) {
  return prisma.objetivo.update({ where: { id }, data });
}

export async function toggleObjetivoThisWeek(id) {
  const obj = await prisma.objetivo.findUnique({ where: { id }, select: { thisWeek: true } });
  return prisma.objetivo.update({ where: { id }, data: { thisWeek: !obj.thisWeek } });
}
