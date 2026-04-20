import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const [activeMetas, metasCount, objetivosCount, tareasCount, pendingCount] = await Promise.all([
    prisma.meta.findMany({
      where: { active: true },
      include: { objetivos: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.meta.count(),
    prisma.objetivo.count(),
    prisma.tarea.count(),
    prisma.tarea.count({ where: { done: false } }),
  ]);

  return NextResponse.json({
    activeMetas,
    counts: {
      metas: metasCount,
      objetivos: objetivosCount,
      tareas: tareasCount,
      pending: pendingCount,
    },
  });
}
