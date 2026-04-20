import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ metas: [], objetivos: [], tareas: [] });
  }

  const [metas, objetivos, tareas] = await Promise.all([
    prisma.meta.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { title_en: { contains: q } },
        ],
      },
      take: 10,
    }),
    prisma.objetivo.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { title_en: { contains: q } },
        ],
      },
      take: 10,
    }),
    prisma.tarea.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { title_en: { contains: q } },
        ],
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({ metas, objetivos, tareas });
}
