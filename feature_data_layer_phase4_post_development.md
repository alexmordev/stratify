# Phase 4 — Vista Metas — Post Development

## Branch
`feature_data_layer`

## Summary of changes

### New files created
- `app/api/sidebar-data/route.js` — GET endpoint returning active metas with their objetivos plus aggregate counts (metas, objetivos, tareas, pending tareas).
- `app/api/search/route.js` — GET endpoint accepting `?q=` param, case-insensitive `contains` search across Meta, Objetivo, Tarea (title + title_en fields).
- `components/views/ViewMetas.jsx` — Client component rendering the full Metas page: SectionHeader with "Nueva meta" Btn, two sections (Activas / Archivadas) each with MetaCard grid and dashed empty state, language awareness via `langchange` window event.
- `tests/unit/ViewMetas.test.jsx` — 7 Vitest + React Testing Library tests.

### Modified files
- `app/metas/page.jsx` — Replaced placeholder with async server component that fetches metas, objetivos, and tareas then renders `<ViewMetas>`.

### lib/prisma.js
Already existed from Phase 2 — no changes needed.

## MetaCard behaviour
- Grid layout: left content (Chip, title, why, objective chips, stats) + right rail (Switch, Donut).
- Clicking the card body navigates to `/objetivos?metaId={id}`.
- Clicking the Switch calls `toggleMetaActive(id)` and optimistically flips `active` in local state (reverts on error).
- Donut value comes from `metaProgress(metaId, objetivos, tareas)`.
- All text fields respect `lang` state (ES/EN) driven by `localStorage` and the `langchange` window event.

## TDD Results — tests/unit/ViewMetas.test.jsx

  ✓ renders active and inactive sections — PASS
  ✓ MetaCard shows correct donut % from metaProgress — PASS
  ✓ Switch toggle moves card from Activas to Inactivas optimistically — PASS
  ✓ click on card body navigates to /objetivos?metaId=... — PASS
  ✓ empty state shown when active.length === 0 — PASS
  ✓ objective chips show ColorDot with correct palette color — PASS
  ✓ language toggle event updates text to title_en — PASS

Full suite: 67 tests across 5 files — all PASS.

## Post-development steps required

None beyond what was already needed in previous phases. The API routes (`/api/sidebar-data`, `/api/search`) require a running MySQL database configured via `DATABASE_URL` in `.env`. No new migrations or environment variables are introduced.

## Deviations from plan

- The plan specified that `lib/prisma.js` should export as a named export (`export const prisma`). The existing file uses a default export (`export default prisma`). No change was made to avoid breaking Phase 2 actions which already import it as the default export. The API routes import it the same way.
- The `Chip` for active/inactive in the MetaCard uses `var(--bg-2)` / `var(--line-2)` backgrounds instead of hardcoded palette colors, keeping it consistent with the design system's CSS variables.
- The "Nueva meta" button in the SectionHeader is a placeholder (`onClick={() => {}}`) as the WizardAgent modal is Phase 5.
