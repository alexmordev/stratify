'use server';

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
  return prisma.meta.update({
    where: { id },
    data: { active: !meta.active },
  });
}
