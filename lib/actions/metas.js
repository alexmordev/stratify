'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getMetas() {
  return prisma.meta.findMany({
    include: { objetivos: { include: { tareas: true } } },
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
  revalidatePath('/objetivos');
  return updated;
}

export async function updateMeta(id, data) {
  const updated = await prisma.meta.update({ where: { id }, data });
  revalidatePath('/metas');
  return updated;
}

export async function deleteMeta(id) {
  await prisma.meta.delete({ where: { id } });
  revalidatePath('/metas');
  revalidatePath('/objetivos');
}
