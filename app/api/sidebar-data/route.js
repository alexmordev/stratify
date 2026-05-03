import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const [thisWeekObjetivos, activeMetas, metasCount, objetivosCount, tareasCount, pendingCount] = await Promise.all([
    prisma.objetivo.findMany({
      where: { thisWeek: true },
      orderBy: { id: 'asc' },
    }),
    prisma.meta.findMany({
      where: { active: true },
      select: { id: true, title: true, title_en: true, active: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.meta.count(),
    prisma.objetivo.count(),
    prisma.tarea.count(),
    prisma.tarea.count({ where: { done: false } }),
  ]);

  return NextResponse.json({
    thisWeekObjetivos,
    activeMetas,
    counts: {
      metas: metasCount,
      objetivos: objetivosCount,
      tareas: tareasCount,
      pending: pendingCount,
    },
  });
}
