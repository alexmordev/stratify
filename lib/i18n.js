const strings = {
  es: {
    // Nav
    workspace: 'Workspace',
    metas: 'Metas',
    objetivos: 'Objetivos',
    tareas: 'Tareas',
    thisWeek: 'Esta semana',
    weeklyReview: 'Review semanal',
    newMeta: 'Nueva meta',

    // Metas page
    metasTitle: 'Metas',
    metasSubtitle: 'Tus metas a largo plazo',
    active: 'Activas',
    archived: 'Archivadas',
    noActiveMetas: 'No hay metas activas',
    noArchivedMetas: 'No hay metas archivadas',
    horizon: 'Horizonte',
    objectives: 'objetivos',
    tasksDone: 'completadas',
    tasksTotal: 'tareas',

    // Objetivos page
    objetivosTitle: 'Objetivos',
    objetivosSubtitle: 'Tus objetivos semanales',
    addTask: 'Añadir tarea',
    addObjective: 'Añadir objetivo',
    noActiveMetas2: 'No hay metas activas aún',

    // Tareas page
    tareasTitle: 'Tareas',
    tareasSubtitle: 'Tu semana',
    day: 'Día',
    fourDays: '4 días',
    week: 'Semana',
    today: 'Hoy',
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mié',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sáb',
    sun: 'Dom',

    // Wizard
    wizardTitle: 'Nueva meta',
    stepDefine: 'Definir',
    stepAgree: 'Acordar',
    stepObjectives: 'Objetivos',
    stepDone: 'Listo',
    approveMeta: 'Aprobar meta',
    addOwn: 'Añadir uno propio',
    createMeta: 'Crear meta y objetivos',
    agentLabel: 'Agente',
    youLabel: 'Tú',
    inputPlaceholder: 'Responde al agente…',
    send: 'Enviar',

    // Review
    reviewTitle: 'Review semanal',
    reviewSubtitle: 'Reflexión de tu semana',
    saveAndClose: 'Guardar y cerrar semana',
    reflectionPlaceholder: 'Esta semana he aprendido que…',
    tasksCompleted: 'Tareas completadas',

    // Search
    searchPlaceholder: 'Buscar metas, objetivos, tareas…',

    // Common
    edit: 'Editar',
    delete: 'Eliminar',
    cancel: 'Cancelar',
    save: 'Guardar',
    close: 'Cerrar',
    weeklyLoad: 'Carga semanal',
    color: 'Color',
    progress: 'Progreso',
    done: 'Completada',
    pending: 'Pendiente',
  },

  en: {
    // Nav
    workspace: 'Workspace',
    metas: 'Goals',
    objetivos: 'Objectives',
    tareas: 'Tasks',
    thisWeek: 'This week',
    weeklyReview: 'Weekly review',
    newMeta: 'New goal',

    // Metas page
    metasTitle: 'Goals',
    metasSubtitle: 'Your long-term goals',
    active: 'Active',
    archived: 'Archived',
    noActiveMetas: 'No active goals',
    noArchivedMetas: 'No archived goals',
    horizon: 'Horizon',
    objectives: 'objectives',
    tasksDone: 'completed',
    tasksTotal: 'tasks',

    // Objetivos page
    objetivosTitle: 'Objectives',
    objetivosSubtitle: 'Your weekly objectives',
    addTask: 'Add task',
    addObjective: 'Add objective',
    noActiveMetas2: 'No active goals yet',

    // Tareas page
    tareasTitle: 'Tasks',
    tareasSubtitle: 'Your week',
    day: 'Day',
    fourDays: '4 days',
    week: 'Week',
    today: 'Today',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',

    // Wizard
    wizardTitle: 'New goal',
    stepDefine: 'Define',
    stepAgree: 'Agree',
    stepObjectives: 'Objectives',
    stepDone: 'Done',
    approveMeta: 'Approve goal',
    addOwn: 'Add your own',
    createMeta: 'Create goal & objectives',
    agentLabel: 'Agent',
    youLabel: 'You',
    inputPlaceholder: 'Reply to the agent…',
    send: 'Send',

    // Review
    reviewTitle: 'Weekly review',
    reviewSubtitle: 'Reflection on your week',
    saveAndClose: 'Save and close week',
    reflectionPlaceholder: 'This week I learned that…',
    tasksCompleted: 'Tasks completed',

    // Search
    searchPlaceholder: 'Search goals, objectives, tasks…',

    // Common
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    weeklyLoad: 'Weekly load',
    color: 'Color',
    progress: 'Progress',
    done: 'Completed',
    pending: 'Pending',
  },
};

export function t(lang, key) {
  return strings[lang]?.[key] ?? strings.es[key] ?? key;
}

export default strings;
