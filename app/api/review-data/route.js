import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const metas = await prisma.meta.findMany({
    where: { active: true },
    include: {
      objetivos: {
        include: { tareas: true },
        orderBy: { id: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ metas });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { reflection } = body;

  // Store reflection as a simple log (no schema change needed)
  // In a real app this would persist to DB; here we just acknowledge
  return NextResponse.json({ ok: true, reflection: reflection ?? '' });
}
