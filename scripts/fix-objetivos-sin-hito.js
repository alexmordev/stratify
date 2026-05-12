/**
 * Verifica y corrige objetivos sin hitoId en una meta específica.
 * Uso: node scripts/fix-objetivos-sin-hito.js "Trabajo Digihaul"
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const metaTitle = process.argv[2];
  if (!metaTitle) {
    console.error('Uso: node scripts/fix-objetivos-sin-hito.js "<nombre de meta>"');
    process.exit(1);
  }

  const meta = await prisma.meta.findFirst({
    where: { title: { contains: metaTitle } },
    include: {
      hitos: { orderBy: { createdAt: 'asc' } },
      objetivos: { orderBy: { id: 'asc' } },
    },
  });

  if (!meta) {
    console.error(`No se encontró ninguna meta con el título: "${metaTitle}"`);
    process.exit(1);
  }

  console.log(`\nMeta encontrada: "${meta.title}" (${meta.id})`);
  console.log(`Hitos: ${meta.hitos.length}`);
  meta.hitos.forEach((h, i) => console.log(`  ${i + 1}. ${h.enunciado} (${h.id})`));

  const sinHito = meta.objetivos.filter(o => !o.hitoId);
  const conHito = meta.objetivos.filter(o => o.hitoId);

  console.log(`\nObjetivos totales: ${meta.objetivos.length}`);
  console.log(`  Con hito asignado: ${conHito.length}`);
  console.log(`  Sin hito asignado: ${sinHito.length}`);

  if (sinHito.length === 0) {
    console.log('\nTodos los objetivos ya tienen hito asignado.');
    return;
  }

  if (meta.hitos.length === 0) {
    console.error('\nEsta meta no tiene hitos. Crea un hito primero.');
    process.exit(1);
  }

  const primerHito = meta.hitos[0];
  console.log(`\nAsignando al hito: "${primerHito.enunciado}" (${primerHito.id})`);
  console.log('Objetivos a actualizar:');
  sinHito.forEach(o => console.log(`  - ${o.title}`));

  const result = await prisma.objetivo.updateMany({
    where: { id: { in: sinHito.map(o => o.id) } },
    data: { hitoId: primerHito.id },
  });

  console.log(`\n✓ ${result.count} objetivo(s) actualizados correctamente.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
