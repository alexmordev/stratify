# Phase 3 Post-Development: Layout Shell + Sidebar

## Branch
`feature_data_layer`

## What Was Built

### New Files
- `app/layout.jsx` — AppShell with `'use client'`, renders `<Sidebar>` (fixed 240px) + `<main>` with `marginLeft: 240px`. Manages `searchOpen` state and `⌘K`/`Ctrl+K` global shortcut. Replaces `app/layout.js`.
- `app/page.jsx` — Redirects to `/tareas` via `next/navigation` `redirect()`. Replaces `app/page.js`.
- `app/metas/page.jsx` — Placeholder page returning `<div>Metas</div>`.
- `app/objetivos/page.jsx` — Placeholder page returning `<div>Objetivos</div>`.
- `app/tareas/page.jsx` — Placeholder page returning `<div>Tareas</div>`.
- `components/layout/Sidebar.jsx` — 240px fixed sidebar with logo, ES/EN language toggle (localStorage + `langchange` event), search button, nav items (Metas/Objetivos/Tareas) with active state via `usePathname`, "Esta semana" active metas list, and footer with "Review semanal" + "Nueva meta" buttons.
- `components/layout/SearchPalette.jsx` — Modal overlay opened by ⌘K or sidebar button. Autofocused input with 150ms debounce, grouped results (Metas/Objetivos/Tareas), `Escape` to close, backdrop click to close, language-aware display.
- `tests/unit/Sidebar.test.jsx` — 5 tests for Sidebar component.
- `tests/unit/SearchPalette.test.jsx` — 7 tests for SearchPalette component.

### Modified Files
- `package.json` / `package-lock.json` — Added `@testing-library/user-event` dev dependency.

### Deleted Files
- `app/layout.js` — Replaced by `layout.jsx`
- `app/page.js` — Replaced by `page.jsx`

## TDD Results

### Sidebar.test.jsx
- renders nav items: Metas, Objetivos, Tareas — PASS
- active item has differentiated style based on current pathname — PASS
- language toggle: clicking EN persists "en" to localStorage — PASS
- language toggle: clicking ES persists "es" to localStorage — PASS
- footer contains "Review semanal" and "Nueva meta" buttons — PASS

### SearchPalette.test.jsx
- is hidden when open=false — PASS
- is visible when open=true — PASS
- Escape key calls onClose — PASS
- clicking backdrop calls onClose — PASS
- debounce: input change triggers search after 150ms delay — PASS
- filtering shows matching items after debounce — PASS
- empty query clears results without fetch — PASS

**Total: 60/60 tests passing** (includes Phase 1 and Phase 2 tests)

## Deviations from Plan

1. **`app/layout.jsx` uses `'use client'`** — The plan noted the layout can be server but Sidebar needs client. Since Sidebar and SearchPalette are client components that need state (searchOpen), the layout must also be client to manage that shared state. This is a minimal, necessary deviation.

2. **SearchPalette uses `/api/search` endpoint** — The plan specified filtering metas + objetivos + tareas but did not define a search API route. The SearchPalette calls `/api/search?q=...` which needs to be created in a future phase. In the test environment the fetch is mocked, so tests pass. In production the search will return no results until the API route is implemented.

3. **Sidebar uses `/api/sidebar-data` endpoint** — Similarly, the sidebar fetches active metas and pending counts from `/api/sidebar-data`. This route needs to be created in a future phase. The fetch fails gracefully (catches errors), so the sidebar renders correctly without data.

4. **`act(...)` warnings in Sidebar tests** — These are non-critical React testing warnings from the async fetch in `useEffect` updating state after the test renders. All tests still pass; this is a known testing-library pattern with async effects.

## Post-Development Steps the User Must Run

1. **Create API routes** (needed for full runtime functionality):
   - `app/api/search/route.js` — Query DB for metas, objetivos, tareas matching `?q=` param
   - `app/api/sidebar-data/route.js` — Return active metas and pending counts

2. **Database must be running** for the API routes to work (MySQL + Prisma already configured from Phase 2).

3. **No new env vars required** — All existing env vars from Phase 2 apply.

4. **No migrations required** — Schema unchanged from Phase 2.
