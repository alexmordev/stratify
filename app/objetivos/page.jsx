import { getMetas } from '@/lib/actions/metas';
import ViewObjetivos from '@/components/views/ViewObjetivos';

export default async function ObjetivosPage() {
  const metas = await getMetas();

  const objetivos = metas.flatMap((m) => m.objetivos ?? []);
  const tareas = objetivos.flatMap((o) => o.tareas ?? []);

  return (
    <ViewObjetivos
      metas={metas}
      objetivos={objetivos}
      tareas={tareas}
    />
  );
}
