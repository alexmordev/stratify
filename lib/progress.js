export function objProgress(objId, tareas) {
  const objTareas = tareas.filter((t) => t.objId === objId);
  if (objTareas.length === 0) return 0;
  const doneTareas = objTareas.filter((t) => t.done).length;
  return (doneTareas / objTareas.length) * 100;
}

export function metaProgress(metaId, objetivos, tareas) {
  const metaObjetivos = objetivos.filter((o) => o.metaId === metaId);
  if (metaObjetivos.length === 0) return 0;

  const totalLoad = metaObjetivos.reduce((sum, o) => sum + o.weeklyLoad, 0);
  if (totalLoad === 0) return 0;

  const weightedSum = metaObjetivos.reduce((sum, o) => {
    return sum + objProgress(o.id, tareas) * o.weeklyLoad;
  }, 0);

  return weightedSum / totalLoad;
}
