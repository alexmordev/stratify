# Objetivo
Construir un mapa conceptual y arquitectónico del repositorio actual (MVP de Stratify) para guiar a desarrolladores y agentes de IA sobre cómo está estructurado el código, dónde residen los componentes lógicos, de la interfaz de usuario, persistencia, y cómo se comunican entre sí.

# Clasificación
Feature (Arquitectura / Context Retrieval)

# Dominios Relevantes
- Capa de Base de Datos y Modelado (Prisma / MySQL).
- Capa de Back-end (Next.js Server Actions y Rutas de API REST).
- Capa de Front-end (Next.js App Router, React Client Components, UI).
- Utilidades Compartidas e Internacionalización.

# Archivos para Revisar

- **File Name:** `schema.prisma`
  - **Full Path:** `prisma/schema.prisma`
  - **Purpose:** Contiene la definición estricta de las entidades y relaciones del sistema de datos.
- **File Name:** `package.json`
  - **Full Path:** `package.json`
  - **Purpose:** Listado de dependencias clave que definen la arquitectura (Next.js, Prisma, Tailwind).
- **File Name:** `lib/actions/*`
  - **Full Path:** `lib/actions/`
  - **Purpose:** Contiene los Server Actions divididos por dominio (metas, hitos, objetivos, tareas) para las mutaciones.
- **File Name:** `components/views/*`
  - **Full Path:** `components/views/`
  - **Purpose:** Vistas principales donde ocurre la interactividad del usuario (Client Side).
- **File Name:** `palette.js`
  - **Full Path:** `lib/palette.js`
  - **Purpose:** Gestión centralizada de estética y temas basados en variables `oklch`.

# 1. Arquitectura General
- **Framework Principal:** Next.js 14 (App Router) y React 18.
- **Gestión de Datos (ORM):** Prisma (`@prisma/client` ^5.22.0) conectado a una base de datos MySQL (según `schema.prisma`).
- **Estilos:** Se emplea **Tailwind CSS** (v3.4.1) como motor utilitario, pero se combina con un uso exhaustivo de **Estilos en línea (Inline Styles)** y **Variables CSS** nativas para estructurar colores y componentes clave. No se utiliza `tailwind-variants` explícitamente; en su lugar, se manejan las variantes (primary, secondary, danger) de forma algorítmica con objetos JS dentro de los propios componentes (ej. `components/ui/Btn.jsx`).
- **Flujo Global:** Aplicación híbrida. Lectura inicial mediante Server Components, mutaciones mediante Next.js Server Actions e invalidación de caché (`revalidatePath`), y lectura asíncrona mediante REST APIs clásicas para utilidades específicas.

# 2. Estructura de Directorios Clave
- `app/`: Directorio central del Next.js App Router. Aloja los Server Components que construyen cada ruta (ej. `page.jsx`, `layout.jsx`) y endpoints de API en `app/api/`.
- `components/`: Agrupa componentes modulares de React.
  - `ui/`: Botones, switches, gráficos donut.
  - `layout/`: Estructura base (Sidebar, Command Palette).
  - `modals/`: Vistas de sobreposición contextual (Review, Wizard).
  - `views/`: "Páginas del lado del cliente" masivas.
- `lib/`: Lógica compartida, Server Actions y configuración de servicios.
  - `actions/`: Directorio dedicado a la escritura de DB.
- `prisma/`: Definición de bases de datos y scripts semilla.

# 3. Dominios de Datos (Modelos Prisma)
1. **Meta:** Aspiración a largo plazo. Define porqué, métricas de éxito e identidad. Puede asociarse a Hitos y Objetivos.
2. **Hito:** Punto de control intermedio. Tiene enunciado, fechas y criterios de verificación. Pertenece a una Meta.
3. **Objetivo:** Entregable tangible, medible y programado para ciertas semanas. Cuelga de una Meta y/o Hito.
4. **Tarea:** Trabajo atómico y diario que pertenece a un Objetivo. Puede alojarse en un día en particular, durar sesiones múltiples y tener estado completado o backlog.

# 4. Mapa de Componentes / Vistas
La aplicación emplea un patrón delegación donde un **Server Component** asíncrono realiza la lectura y pasa los datos mediante props a un componente de vista **Client Component**:
- `app/metas/page.jsx` -> `components/views/ViewMetas.jsx`
- `app/objetivos/page.jsx` -> `components/views/ViewObjetivos.jsx`
- `app/tareas/page.jsx` -> `components/views/ViewTareas.jsx`
- `app/workspace/page.jsx` -> `components/views/ViewWorkspace.jsx`

# 5. Flujo de Datos
- **Lectura Principal (Server):** Ocurre directamente al hidratar los Server Components.
- **Lectura Dinámica (Client):** Carga perezosa de datos globales mediante llamadas REST a `app/api/sidebar-data/route.js` y `app/api/search/route.js`.
- **Escrituras y Mutaciones:** Encapsuladas en módulos como `lib/actions/metas.js` o `lib/actions/tareas.js`. Usan prisma para persistir y terminan invocando `revalidatePath(...)` para obligar a Next.js a regenerar la vista modificada.

# 6. Utilidades Centrales
- **`lib/palette.js`**: Única fuente de la verdad para el espacio de color (usando `oklch`). Administra los tonos "sand, blush, peach, lagoon, etc.".
- **`lib/i18n.js`**: Almacén estático para la localización (Inglés y Español). Exporta la función de traducción `t(lang, key)`.
- **`lib/progress.js`**: Funciones matemáticas puras (`objProgress`, `metaProgress`) para estimar avances basándose en relaciones y contadores de completado.
- **`lib/prisma.js`**: Objeto global inmutable de cliente prisma que previene la sobrepoblación de conexiones durante desarrollo local.