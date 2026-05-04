'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getMetas() {
  return prisma.meta.findMany({
    include: {
      hitos: {
        orderBy: { fecha_objetivo: 'asc' },
        include: { _count: { select: { objetivos: true } } },
      },
      objetivos: { include: { tareas: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMeta(data) {
  return prisma.meta.create({ data });
}

export async function toggleMetaActive(id) {
  const meta = await prisma.meta.findUnique({ where: { id } });
  const updated = await prisma.meta.update({
    where: { id },
    data: { active: !meta.active },
  });
  revalidatePath('/metas');
  revalidatePath('/workspace');
  revalidatePath('/objetivos');
  return updated;
}

export async function updateMeta(id, data) {
  const updated = await prisma.meta.update({ where: { id }, data });
  revalidatePath('/metas');
  revalidatePath('/workspace');
  return updated;
}

export async function updateMetaColor(metaId, color) {
  await prisma.$transaction([
    prisma.meta.update({ where: { id: metaId }, data: { color } }),
    prisma.objetivo.updateMany({ where: { metaId }, data: { color } }),
  ]);
  revalidatePath('/metas');
  revalidatePath('/workspace');
}

export async function deleteMeta(id) {
  await prisma.meta.delete({ where: { id } });
  revalidatePath('/metas');
  revalidatePath('/workspace');
  revalidatePath('/objetivos');
}
