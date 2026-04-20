import { getTareas } from '@/lib/actions/tareas';
import { getObjetivos } from '@/lib/actions/objetivos';
import { getMetas } from '@/lib/actions/metas';
import ViewTareas from '@/components/views/ViewTareas';

export default async function TareasPage() {
  const [tareas, objetivos, metas] = await Promise.all([
    getTareas(),
    getObjetivos(),
    getMetas(),
  ]);

  return (
    <ViewTareas
      tareas={tareas}
      objetivos={objetivos}
      metas={metas}
    />
  );
}
