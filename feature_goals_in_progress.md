### `feature_goals_in_progress.md`

## 1. Objective
Implementar la lógica para que los objetivos (goals) marcados como "en trabajo esta semana" (`thisWeek === true`) sean los únicos que aparezcan listados en el sidebar (Backlog) de la vista de tareas, y que a su vez sean las únicas opciones disponibles al asignar un objetivo a una nueva tarea desde el modal de creación rápida (`QuickCreateModal`).

## 2. Classification
**Feature**
*Razonamiento*: Aunque se aprovecha un campo de base de datos existente (`thisWeek`), la introducción de los filtros en la vista principal de tareas para condicionar los datos mostrados representa una nueva funcionalidad de negocio para enfocarse exclusivamente en los objetivos de la semana activa.

## 3. Relevant Domains
- **Database Schema**: La bandera de la base de datos que dictamina qué objetivo se está trabajando esta semana.
- **Server Actions**: Las funciones que cargan y modifican el estado de los objetivos.
- **UI Components (Task View)**: El renderizado y estado en cliente de la vista de Tareas, el Sidebar y el Modal de creación de tareas.

## 4. Files to Review

### 1. `prisma/schema.prisma`
- **Full Path**: `C:\Users\PC\Documents\Development\MVP\stratify\prisma\schema.prisma`
- **Purpose**: Define la estructura de base de datos de la aplicación usando Prisma, incluyendo las relaciones y campos de los modelos `Meta`, `Objetivo` y `Tarea`.
- **Análisis/Modificaciones**: Ninguna. El modelo `Objetivo` (línea 60) ya posee la propiedad `thisWeek Boolean @default(false)` instalada y funcional.

### 2. `lib/actions/objetivos.js`
- **Full Path**: `C:\Users\PC\Documents\Development\MVP\stratify\lib\actions\objetivos.js`
- **Purpose**: Contiene los Server Actions para mutar y leer los registros del modelo `Objetivo`.
- **Análisis/Modificaciones**: Ninguna. Ya existe y funciona la función `toggleObjetivoThisWeek(id)` que se utiliza actualmente en `ViewObjetivos.jsx` para cambiar este estado. La función `getObjetivos` deberá seguir devolviendo todos los registros (en lugar de filtrarlos desde la base de datos), para que tareas ya agendadas de semanas previas en el calendario sigan mostrando los datos del objetivo al que pertenecen (nombre, color).

### 3. `app/tareas/page.jsx`
- **Full Path**: `C:\Users\PC\Documents\Development\MVP\stratify\app\tareas\page.jsx`
- **Purpose**: Server component de Next.js que carga los datos de `tareas`, `objetivos` y `metas` antes de inyectarlos al cliente `ViewTareas.jsx`.
- **Análisis/Modificaciones**: Ninguna estricta. Todo el filtrado deberá ocurrir en el cliente (`ViewTareas`) para mantener la integridad visual del calendario histórico.

### 4. `components/views/ViewTareas.jsx`
- **Full Path**: `C:\Users\PC\Documents\Development\MVP\stratify\components\views\ViewTareas.jsx`
- **Purpose**: Componente principal de la vista de gestión de tareas. Gestiona el calendario "drag and drop", el Sidebar del Backlog de tareas sin programar, y renderiza el `<QuickCreateModal>`.
- **Qué necesita ser modificado**:
  1. **Actualizar la variable derivada `activeObjetivos`** (aprox. línea 703):
     Actualmente, los objetivos activos sólo revisan si la "meta" está activa:
     `const activeObjetivos = objetivos.filter(o => activeMetaIds.has(o.metaId));`
     **Cambio requerido**: Se debe añadir el filtro de `thisWeek`:
     `const activeObjetivos = objetivos.filter(o => activeMetaIds.has(o.metaId) && o.thisWeek);`
     *Impacto*: Al hacer esto, las "píldoras" o chips de filtro en la cabecera del sidebar (líneas 988-1011) usarán únicamente los objetivos en progreso de esta semana. Indirectamente, esto también filtrará la lista general del Backlog, ya que el array `backlog` se calcula evaluando si la tarea pertenece a un objetivo dentro de `activeObjIds`.
  
  2. **Actualizar las opciones del `<QuickCreateModal>`** (aprox. línea 1062):
     En la parte inferior del archivo, el componente `ViewTareas` renderiza el modal pasando todos los `objetivos`:
     `<QuickCreateModal ... objetivos={objetivos} />`
     **Cambio requerido**: Debe ser reemplazado para inyectar solo la lista filtrada:
     `<QuickCreateModal ... objetivos={activeObjetivos} />`
     *Impacto*: El modal iterará solo sobre los objetivos marcados para esta semana (limitado a 8 por el `.slice(0, 8)` existente en el modal), lo que garantiza que solo sean estos los seleccionables para cualquier tarea de nueva creación.