import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tarea.deleteMany();
  await prisma.objetivo.deleteMany();
  await prisma.meta.deleteMany();

  const meta1 = await prisma.meta.create({
    data: {
      title: 'Lanzar producto SaaS',
      title_en: 'Launch SaaS product',
      why: 'Quiero construir independencia financiera y crear algo de valor',
      why_en: 'I want to build financial independence and create something valuable',
      success: 'Tener 10 clientes de pago al final del trimestre',
      success_en: 'Have 10 paying customers by end of quarter',
      horizon: 'Q3 2026',
      horizon_en: 'Q3 2026',
      active: true,
    },
  });

  const obj1 = await prisma.objetivo.create({
    data: {
      metaId: meta1.id,
      title: 'Desarrollar MVP',
      title_en: 'Develop MVP',
      color: 'sky',
      weeklyLoad: 3,
    },
  });

  const obj2 = await prisma.objetivo.create({
    data: {
      metaId: meta1.id,
      title: 'Validar con usuarios',
      title_en: 'Validate with users',
      color: 'moss',
      weeklyLoad: 2,
    },
  });

  await prisma.tarea.createMany({
    data: [
      {
        objId: obj1.id,
        title: 'Diseñar esquema de base de datos',
        title_en: 'Design database schema',
        day: 0,
        start: 9,
        dur: 2,
        done: true,
        subtasks: [
          { t: 'Definir modelos', d: true },
          { t: 'Escribir migraciones', d: true },
        ],
      },
      {
        objId: obj1.id,
        title: 'Implementar autenticación',
        title_en: 'Implement authentication',
        day: 1,
        start: 10,
        dur: 1.5,
        done: false,
      },
      {
        objId: obj2.id,
        title: 'Entrevistar 5 usuarios',
        title_en: 'Interview 5 users',
        day: 3,
        start: 14,
        dur: 2,
        done: false,
      },
    ],
  });

  const meta2 = await prisma.meta.create({
    data: {
      title: 'Mejorar condición física',
      title_en: 'Improve physical fitness',
      why: 'Quiero tener más energía y salud a largo plazo',
      why_en: 'I want more energy and long-term health',
      success: 'Correr 5km en menos de 25 minutos',
      success_en: 'Run 5km in under 25 minutes',
      horizon: 'Dic 2026',
      horizon_en: 'Dec 2026',
      active: true,
    },
  });

  const obj3 = await prisma.objetivo.create({
    data: {
      metaId: meta2.id,
      title: 'Entrenar 3 veces por semana',
      title_en: 'Train 3 times per week',
      color: 'peach',
      weeklyLoad: 3,
    },
  });

  await prisma.tarea.createMany({
    data: [
      {
        objId: obj3.id,
        title: 'Sesión de cardio 30min',
        title_en: 'Cardio session 30min',
        day: 0,
        start: 7,
        dur: 0.5,
        done: false,
      },
      {
        objId: obj3.id,
        title: 'Entrenamiento de fuerza',
        title_en: 'Strength training',
        day: 2,
        start: 7,
        dur: 1,
        done: false,
      },
    ],
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
