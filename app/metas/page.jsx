import { getMetas } from '@/lib/actions/metas';
import { getObjetivos } from '@/lib/actions/objetivos';
import { getTareas } from '@/lib/actions/tareas';
import ViewMetas from '@/components/views/ViewMetas';

export default async function MetasPage() {
  const metas = await getMetas();
  const objetivos = await getObjetivos();
  const tareas = await getTareas();
  return <ViewMetas metas={metas} objetivos={objetivos} tareas={tareas} />;
}
