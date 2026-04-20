# Stratify — Development Plan

## Stack
- **Next.js 14** (App Router) · **Tailwind CSS** · **MySQL** (servidor remoto) via **Prisma ORM**
- **Vitest** + **React Testing Library** (unit/integration)
- **Playwright** (E2E)
- **Claude API** (`claude-sonnet-4-6`) para el wizard agente

---

## Design System

### CSS Variables (globals.css)
```css
--bg:     oklch(0.985 0.003 90);   /* off-white cálido */
--bg-2:   oklch(0.975 0.004 90);
--panel:  oklch(1 0 0);
--line:   oklch(0.92 0.004 90);
--line-2: oklch(0.955 0.004 90);
--ink:    oklch(0.22 0.01 90);
--ink-2:  oklch(0.42 0.008 90);
--ink-3:  oklch(0.62 0.006 90);
--ink-4:  oklch(0.78 0.004 90);
--accent: oklch(0.48 0.02 260);
```

### Tipografía
| Clase | Fuente | Uso |
|---|---|---|
| base | Inter | UI general |
| `.mono` | IBM Plex Mono | Números, labels, kbd |
| `.serif` | Fraunces italic | Títulos H1/H2 |

### Paleta de objetivos (8 tonos oklch)
| id | bg | fg | dot |
|---|---|---|---|
| blush | oklch(0.93 0.04 25) | oklch(0.42 0.09 25) | oklch(0.72 0.13 25) |
| peach | oklch(0.94 0.05 60) | oklch(0.45 0.1 60) | oklch(0.75 0.14 60) |
| sand | oklch(0.94 0.04 95) | oklch(0.45 0.08 95) | oklch(0.77 0.1 95) |
| moss | oklch(0.93 0.05 140) | oklch(0.42 0.09 140) | oklch(0.7 0.13 140) |
| lagoon | oklch(0.93 0.04 200) | oklch(0.42 0.09 220) | oklch(0.7 0.12 210) |
| sky | oklch(0.94 0.04 245) | oklch(0.42 0.1 255) | oklch(0.7 0.13 250) |
| violet | oklch(0.93 0.05 295) | oklch(0.42 0.1 295) | oklch(0.7 0.13 295) |
| graphite | oklch(0.93 0.004 90) | oklch(0.35 0.005 90) | oklch(0.55 0.005 90) |

### Componentes UI reutilizables (`/components/ui/`)
- **Icon** — SVG inline custom (target, flag, check, calendar, plus, search, sparkle, chev-r/l/d, x, more, pause, play, edit, trash, clock, review, drag)
- **ProgressBar** — barra lineal, `transition: width .35s ease`
- **Donut** — anillo SVG, `strokeDashoffset .5s ease`, label central `.mono`
- **Chip** — badge redondeado con color de paleta o neutro
- **ColorDot** — círculo 10px con `pal.dot`
- **Check** — checkbox custom, checked = fondo ink
- **Switch** — toggle on/off, animación `.12s`
- **Btn** — variantes: `primary` (ink bg), `secondary` (borde), `ghost`, `danger`
- **SectionHeader** — eyebrow `.mono` uppercase + H1 Fraunces 36px + subtítulo + slot derecho

---

## DB Schema (Prisma)

```prisma
// datasource db en schema.prisma:
// provider = "mysql"
// url      = env("DATABASE_URL")  // ej. mysql://user:pass@host:3306/stratify

model Meta {
  id         String      @id @default(cuid())
  title      String
  title_en   String
  why        String
  why_en     String
  success    String
  success_en String
  horizon    String
  horizon_en String
  active     Boolean     @default(true)
  createdAt  DateTime    @default(now())
  objetivos  Objetivo[]
}

model Objetivo {
  id          String   @id @default(cuid())
  metaId      String
  meta        Meta     @relation(fields: [metaId], references: [id], onDelete: Cascade)
  title       String
  title_en    String
  color       String   @default("sand") // blush|peach|sand|moss|lagoon|sky|violet|graphite
  weeklyLoad  Int      @default(1)
  done        Int      @default(0)
  tareas      Tarea[]
}

model Tarea {
  id        String   @id @default(cuid())
  objId     String
  objetivo  Objetivo @relation(fields: [objId], references: [id], onDelete: Cascade)
  title     String
  title_en  String
  day       Int      // 0=Lun … 6=Dom
  start     Float    // hora decimal (ej. 9.5 = 9:30)
  dur       Float    // duración en horas
  done      Boolean  @default(false)
  subtasks  Json?    // [{ t: string, d: boolean }]
  createdAt DateTime @default(now())
}
```

---

## Fase 1 — Setup + Design System

### Tareas
1. `npx create-next-app@latest stratify --no-typescript --tailwind --app`
2. Instalar: `prisma`, `@prisma/client`, `@anthropic-ai/sdk`
3. Configurar `globals.css` con CSS variables y estilos base (scrollbars custom, checkbox, switch, focus-visible ring)
4. Configurar Google Fonts: Inter, IBM Plex Mono, Fraunces
5. Implementar todos los componentes UI en `/components/ui/`
6. Crear `lib/palette.js` con el array `PALETTE` y helper `palById(id)`
7. Crear `lib/i18n.js` con strings ES/EN completos

### Tests
- `Icon` renderiza cada nombre sin errores
- `Donut(value=75)` → `strokeDashoffset` correcto
- `ProgressBar(value=110)` → clampea a 100%
- `Btn` variante `primary` tiene `background: var(--ink)`
- `palById('moss')` retorna el objeto correcto, `palById('unknown')` retorna `PALETTE[0]`

---

## Fase 2 — Capa de datos (Server Actions)

### Tareas
1. `prisma/schema.prisma` con los 3 modelos y `provider = "mysql"`
2. Variable de entorno `DATABASE_URL` en `.env` apuntando al servidor MySQL remoto
3. Seed inicial (`prisma/seed.js`) con datos de ejemplo
4. Server Actions en `/lib/actions/`:
   - `getMetas()`, `createMeta(data)`, `toggleMetaActive(id)`
   - `getObjetivos(metaId?)`, `createObjetivo(data)`, `updateObjetivo(id, data)`
   - `getTareas(week?)`, `createTarea(data)`, `toggleTarea(id)`, `moveTarea(id, day)`, `updateSubtasks(id, subtasks)`
5. Helpers en `/lib/progress.js`:
   - `objProgress(objId, tareas[])` → `done/total * 100`
   - `metaProgress(metaId, objetivos[], tareas[])` → promedio ponderado por `weeklyLoad`

### Tests
- `createMeta` persiste y retorna el registro
- `toggleMetaActive` invierte el campo `active`
- `createTarea` asigna `done: false` por defecto
- `toggleTarea` incrementa `done` en el objetivo relacionado
- `objProgress` con 0 tareas retorna `0`
- `metaProgress` con todos los objetivos al 100% retorna `100`
- `metaProgress` con objetivos de distinto `weeklyLoad` pondera correctamente
- Subtareas en `Json` no afectan el cálculo de progreso del objetivo

---

## Fase 3 — Layout Shell + Sidebar

### Estructura de archivos
```
app/
  layout.tsx          ← AppShell (sidebar + main)
  page.tsx            ← redirect → /tareas
  metas/page.tsx
  objetivos/page.tsx
  tareas/page.tsx
components/
  layout/
    Sidebar.tsx
    SearchPalette.tsx
```

### Sidebar (240px, `border-right: 1px solid var(--line-2)`)
- Logo: cuadrado 26px `borderRadius: 7` fondo ink, letra "m" Fraunces italic blanca
- Toggle ES/EN: botones `.mono` 10px uppercase, activo con `bg-2`
- Buscador: botón con `Icon search`, kbd `⌘K`, `border: 1px solid var(--line)`
- Nav: eyebrow "Workspace" `.mono` uppercase 10px ink-4, 3 items con icon + label + contador
- Item activo: `background: oklch(0.95 0.004 90)`, fontWeight 500
- "Esta semana": lista de metas activas con dot verde `oklch(0.62 0.14 145)`, texto 12.5px
- Footer: botón "Review semanal" ghost + botón "Nueva meta" primary (ink bg)

### SearchPalette (⌘K)
- Overlay `rgba(0,0,0,0.3)`, modal centrado, input autofocus
- Debounce 150ms, filtra metas + objetivos + tareas por título
- `Escape` cierra, click en resultado navega a la vista correspondiente
- Persistencia de idioma en `localStorage`

### Tests
- Sidebar muestra contador correcto de tareas pendientes
- Item activo tiene estilo diferenciado
- `⌘K` abre SearchPalette, `Escape` la cierra
- Toggle ES/EN persiste en `localStorage` y actualiza todos los textos
- SearchPalette filtra correctamente por título con debounce

---

## Fase 4 — Vista Metas

### Layout
- `padding: 40px 48px 80px`, `maxWidth: 960px`, `margin: 0 auto`
- `SectionHeader`: eyebrow "Metas", H1 Fraunces, subtítulo, botón "Nueva meta" primary

### MetaCard
- Grid 2 columnas: contenido + rail derecho
- `background: var(--panel)`, `border: 1px solid var(--line-2)`, `borderRadius: 12px`
- Hover: `borderColor: var(--line)`, `boxShadow: 0 2px 8px -4px rgba(0,0,0,.06)`
- Chip activo/inactivo + horizonte `.mono ink-4`
- Título 19px fontWeight 500, `why` 13.5px ink-2
- Chips de objetivos con `ColorDot 7px` + nombre 11.5px
- Stats: `n objetivos · n tareas · n completadas` `.mono ink-3` 11px
- Rail derecho: `Switch` con label + `Donut` 64px stroke 5

### Secciones
- "Activas" y "Inactivas/Archivadas" con contador
- Estado vacío: `border: 1px dashed var(--line)`, texto centrado

### Tests
- Card muestra `%` correcto del donut
- Toggle `Switch` mueve card de "Activas" a "Inactivas" y viceversa
- Click en card navega a vista Objetivos
- Estado vacío visible cuando `active.length === 0`
- Chips de objetivos muestran `ColorDot` con color correcto

---

## Fase 5 — Wizard Agente

### Flujo (3 pasos)
```
Step 1 "Definir"  → chat con Claude API
Step 2 "Acordar"  → usuario aprueba meta
Step 3 "Objetivos"→ editar lista propuesta → crear
```

### UI
- Modal fullscreen overlay `rgba(0,0,0,0.4)`
- Header: stepper 4 estados (Definir · Acordar · Objetivos · Listo) con línea de progreso
- Chat: burbujas "Agente" (izquierda, bg-2) y "Tú" (derecha, ink bg blanco)
- Input `textarea` con botón "Enviar", placeholder "Responde al agente…"
- Step 2: botón "Aprobar meta" primary, muestra resumen de la meta definida
- Step 3: lista editable — título, color picker (8 swatches con `ColorDot`), `weeklyLoad` input number, botones editar/quitar, botón "Añadir uno propio"
- Botón final "Crear meta y objetivos" → persiste y navega a Objetivos

### Claude API
- System prompt: agente que ayuda a clarificar metas con preguntas sobre `why`, `success criteria`, `horizon`
- Streaming de respuesta
- Al aprobar: segunda llamada para proponer objetivos semanales en JSON

### Tests
- No se puede avanzar a Step 3 sin haber aprobado en Step 2
- Step 3 requiere al menos 1 objetivo para crear
- Color picker actualiza `ColorDot` del objetivo en tiempo real
- `createFromWizard` persiste meta + objetivos en DB
- `weeklyLoad` acepta solo enteros positivos

---

## Fase 6 — Vista Objetivos

### Layout
- `padding: 40px 48px 80px`, `maxWidth: 1060px`
- Agrupado por meta activa, header de meta: Fraunces italic 22px + `ProgressBar` 160px

### ObjetivoCard
- `background: var(--panel)`, `border: 1px solid var(--line-2)`, `borderRadius: 12px`
- Grid `auto-fill minmax(320px, 1fr)` gap 12px
- Header card: `ColorDot 10px` + título 14px fontWeight 500 + chevron collapse
- `ProgressBar` con `color: pal.dot`, `track: pal.bg`, contador `done/total` `.mono`
- Lista de tareas (collapsible): `Check` + título + día `.mono ink-4`
- Tarea completada: `text-decoration: line-through`, color `ink-4`
- Botón "Añadir tarea" ghost al final de la lista
- Botón "Añadir objetivo" con `border: 1px dashed var(--line)`, hover cambia a `ink-4`
- Estado vacío si no hay metas activas

### Tests
- Completar tarea actualiza barra de progreso del objetivo
- Collapse/expand oculta y muestra lista correctamente
- "Añadir tarea" crea tarea en DB con `objId` correcto
- Progreso de meta (header) es promedio ponderado de sus objetivos
- Estado vacío visible cuando `activeMetas.length === 0`

---

## Fase 7 — Vista Tareas (Calendario)

### Layout
- `padding: 40px 48px 80px`
- Toggle vistas: `Día | 4 días | Semana`, navegación chevrons izquierda/derecha
- Columnas de días con cabecera (nombre día + fecha, "Hoy" resaltado)
- Rejilla horaria 7:00–20:00, `SLOT_H = 44px/hora`, horas `.mono ink-4`

### TaskCard
- Posición absoluta: `top = (start - 7) * 44px`, `height = dur * 44px`
- `left: 4px, right: 4px`, `borderRadius: 6px`
- `background: pal.bg`, `color: pal.fg`
- Título 11.5px, check de completado, subtareas como lista interior
- `draggable`, clase `.dragging` → `opacity: 0.5`
- Completada: `text-decoration: line-through`, opacidad reducida

### Interacciones
- **Drag & drop nativo**: `onDragStart` → `setDragId`, `onDrop` en columna → `moveTarea(id, dayIdx)`
- **Click en hueco vacío**: calcula hora por posición Y, abre modal de creación rápida con `objId` del objetivo seleccionado
- **Vistas**: `day` = 1 col, `4d` = 4 cols desde hoy, `week` = 7 cols desde lunes

### Tests
- Drop en columna diferente actualiza `day` en DB
- Completar tarea desde calendario se refleja en vista Objetivos
- Click en hueco calcula `start` correcto a partir de posición Y
- Vista `day` muestra 1 columna, `4d` muestra 4, `week` muestra 7
- `TaskCard` con `dur = 0.5` tiene height `22px` mínimo

---

## Fase 8 — Review Semanal + Pulido

### ModalReview
- Overlay oscuro, modal 600px
- Resumen: total tareas completadas, `Donut` por cada meta activa con `%`
- `ProgressBar` por objetivo
- `textarea` reflexión, placeholder "Esta semana he aprendido que…"
- Botón "Guardar y cerrar semana"

### Pulido visual
- Animaciones: `transition: width .35s ease` (barras), `stroke-dashoffset .5s ease` (donuts)
- Scrollbars: `width: 10px`, `border: 2px solid var(--bg)`, thumb `oklch(0.9 0.004 90)`
- `focus-visible`: `box-shadow: 0 0 0 3px oklch(0.9 0.01 260)`
- Inputs sin spinners: `-webkit-appearance: none`

### Tests E2E (Playwright)
- **Flujo completo**: abrir wizard → definir meta → aprobar → crear 2 objetivos → crear tarea → completarla → ver `%` actualizado en vista Metas
- **Review**: abrir modal → muestra datos correctos de la semana → guardar cierra modal
- **Búsqueda**: `⌘K` → escribir título de tarea → click resultado → navega a Tareas
- **Toggle idioma**: cambiar a EN → todos los textos en inglés → refrescar → persiste

---

## Estructura de archivos final

```
stratify/
├── app/
│   ├── layout.jsx
│   ├── page.jsx
│   ├── metas/page.jsx
│   ├── objetivos/page.jsx
│   └── tareas/page.jsx
├── components/
│   ├── ui/
│   │   ├── Icon.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Donut.jsx
│   │   ├── Chip.jsx
│   │   ├── ColorDot.jsx
│   │   ├── Check.jsx
│   │   ├── Switch.jsx
│   │   ├── Btn.jsx
│   │   └── SectionHeader.jsx
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   └── SearchPalette.jsx
│   ├── views/
│   │   ├── ViewMetas.jsx
│   │   ├── ViewObjetivos.jsx
│   │   └── ViewTareas.jsx
│   └── modals/
│       ├── WizardAgent.jsx
│       └── ModalReview.jsx
├── lib/
│   ├── actions/
│   │   ├── metas.js
│   │   ├── objetivos.js
│   │   └── tareas.js
│   ├── palette.js
│   ├── i18n.js
│   ├── progress.js
│   └── claude.js
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── .env                  ← DATABASE_URL=mysql://user:pass@host:3306/stratify
└── tests/
    ├── unit/
    └── e2e/
```
