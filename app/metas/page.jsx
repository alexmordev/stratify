import { getMetas } from '@/lib/actions/metas';
import ViewMetas from '@/components/views/ViewMetas';

export default async function MetasPage() {
  const metas = await getMetas();
  const objetivos = metas.flatMap((m) => m.objetivos ?? []);
  const tareas = objetivos.flatMap((o) => o.tareas ?? []);
  return <ViewMetas metas={metas} objetivos={objetivos} tareas={tareas} />;
}
