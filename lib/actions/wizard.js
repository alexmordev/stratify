'use server';

import prisma from '@/lib/prisma';

/**
 * Creates a Meta and its Objetivos in a single transaction.
 * @param {object} metaData - fields matching Meta model (title, title_en, why, why_en, success, success_en, horizon, horizon_en)
 * @param {Array<{title: string, color: string, weeklyLoad: number}>} objetivosData
 */
export async function createFromWizard(metaData, objetivosData) {
  return prisma.$transaction(async (tx) => {
    const meta = await tx.meta.create({
      data: {
        title: metaData.title,
        title_en: metaData.title_en ?? metaData.title,
        why: metaData.why ?? '',
        why_en: metaData.why_en ?? metaData.why ?? '',
        success: metaData.success ?? '',
        success_en: metaData.success_en ?? metaData.success ?? '',
        horizon: metaData.horizon ?? '',
        horizon_en: metaData.horizon_en ?? metaData.horizon ?? '',
        active: true,
      },
    });

    const objetivos = await Promise.all(
      objetivosData.map((obj) =>
        tx.objetivo.create({
          data: {
            metaId: meta.id,
            title: obj.title,
            title_en: obj.title_en ?? obj.title,
            color: obj.color ?? 'sand',
            weeklyLoad: Math.max(1, Math.floor(Number(obj.weeklyLoad) || 1)),
            done: 0,
          },
        })
      )
    );

    return { meta, objetivos };
  });
}
