export function objProgress(objId, tareas) {
  const objTareas = tareas.filter((t) => t.objId === objId);
  if (objTareas.length === 0) return 0;
  const doneTareas = objTareas.filter((t) => t.done).length;
  return (doneTareas / objTareas.length) * 100;
}

export function metaProgress(metaId, objetivos) {
  const metaObjetivos = objetivos.filter((o) => o.metaId === metaId);
  if (metaObjetivos.length === 0) return 0;
  const completed = metaObjetivos.filter((o) => o.completed).length;
  return (completed / metaObjetivos.length) * 100;
}
