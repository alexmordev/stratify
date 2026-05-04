import { getMetas } from '@/lib/actions/metas';
import ViewWorkspace from '@/components/views/ViewWorkspace';

export default async function WorkspacePage() {
  const metas = await getMetas();
  const objetivos = metas.flatMap((m) => (m.objetivos ?? []).map(o => ({ ...o, color: m.color ?? 'sand' })));
  const tareas = objetivos.flatMap((o) => o.tareas ?? []);
  return <ViewWorkspace metas={metas} objetivos={objetivos} tareas={tareas} />;
}
