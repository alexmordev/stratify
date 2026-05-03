'use server';

import prisma from '@/lib/prisma';

/**
 * Creates a Meta and its Hitos in a single transaction.
 * Objectives are NOT created here — they are generated per-hito later.
 *
 * @param {object} metaData - { title, title_en, why, why_en, horizon, horizon_en,
 *   success, success_en, identidad_deseada, obstaculo_interno, plan_respuesta, fecha_logro }
 * @param {Array<{ enunciado, criterio_verificacion, fecha_objetivo, puente_con_meta, color }>} hitosData
 */
export async function createFromWizard(metaData, hitosData) {
  return prisma.$transaction(async (tx) => {
    const meta = await tx.meta.create({
      data: {
        title: metaData.title ?? '',
        title_en: metaData.title_en ?? metaData.title ?? '',
        why: metaData.why ?? '',
        why_en: metaData.why_en ?? metaData.why ?? '',
        success: metaData.success ?? '',
        success_en: metaData.success_en ?? metaData.success ?? '',
        horizon: metaData.horizon ?? '',
        horizon_en: metaData.horizon_en ?? metaData.horizon ?? '',
        identidad_deseada: metaData.identidad_deseada ?? '',
        obstaculo_interno: metaData.obstaculo_interno ?? '',
        plan_respuesta: metaData.plan_respuesta ?? '',
        fecha_logro: metaData.fecha_logro ? new Date(metaData.fecha_logro) : null,
        active: true,
      },
    });

    const hitos = await Promise.all(
      (hitosData ?? []).map((h) =>
        tx.hito.create({
          data: {
            metaId: meta.id,
            enunciado: h.enunciado ?? '',
            criterio_verificacion: h.criterio_verificacion ?? '',
            fecha_objetivo: h.fecha_objetivo ? new Date(h.fecha_objetivo) : null,
            puente_con_meta: h.puente_con_meta ?? '',
            color: h.color ?? 'sand',
          },
        })
      )
    );

    return { meta, hitos };
  });
}
