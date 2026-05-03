'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';

export async function getHitosByMeta(metaId) {
  return prisma.hito.findMany({
    where: { metaId },
    include: { _count: { select: { objetivos: true } } },
    orderBy: { fecha_objetivo: 'asc' },
  });
}

export async function updateHito(id, data) {
  const updated = await prisma.hito.update({ where: { id }, data });
  revalidatePath('/metas');
  return updated;
}

export async function deleteHito(id) {
  await prisma.hito.delete({ where: { id } });
  revalidatePath('/metas');
}

/**
 * Saves 12 weekly objectives for a hito, replacing any existing ones.
 * All objectives inherit the hito's color unless individually overridden.
 *
 * @param {string} hitoId
 * @param {string} metaId
 * @param {string} hitoColor - default color inherited by all objectives
 * @param {Array} objetivos - array from GenerateObjetivosModal
 */
export async function saveHitoObjetivos(hitoId, metaId, hitoColor, objetivos) {
  return prisma.$transaction(async (tx) => {
    // Remove existing objectives for this hito (regeneration)
    await tx.objetivo.deleteMany({ where: { hitoId } });

    // Create new objectives
    await Promise.all(
      objetivos.map((obj) =>
        tx.objetivo.create({
          data: {
            metaId,
            hitoId,
            title: obj.enunciado ?? obj.title ?? '',
            title_en: obj.enunciado ?? obj.title ?? '',
            tipo: obj.tipo ?? 'Learning',
            metrica: obj.metrica ?? '',
            fecha_limite: obj.fecha_limite ? new Date(obj.fecha_limite) : null,
            intencion_si_entonces: obj.intencion_si_entonces ?? '',
            seguimiento: obj.seguimiento ?? '',
            color: obj.color ?? hitoColor ?? 'sand',
            weeklyLoad: Math.max(1, Math.floor(Number(obj.weeklyLoad) || 3)),
            done: 0,
          },
        })
      )
    );

    revalidatePath('/metas');
    revalidatePath('/objetivos');
  });
}
