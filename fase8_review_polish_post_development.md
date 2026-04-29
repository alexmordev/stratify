# Fase 8 — Review Semanal + Pulido: Post-Development Notes

## Branch
`feature_data_layer`

## Summary of Changes

### New Files
- `components/modals/ModalReview.jsx` — Full review modal with dark overlay, Donut per active meta, ProgressBar per objective, reflection textarea, save/close button
- `app/api/review-data/route.js` — GET returns active metas with nested objetivos+tareas; POST acknowledges reflection save
- `playwright.config.js` — Playwright config targeting `tests/e2e/`, uses `npm run dev` as web server
- `tests/e2e/review.spec.js` — E2E: open modal, show data, save closes, overlay/Escape dismiss
- `tests/e2e/search.spec.js` — E2E: Ctrl+K, sidebar button, Escape, typing
- `tests/e2e/language.spec.js` — E2E: EN switch, persist after refresh, switch back to ES
- `tests/e2e/full-flow.spec.js` — E2E: sidebar renders, all nav pages load, review button present
- `tests/unit/ModalReview.test.jsx` — 11 unit tests for ModalReview

### Modified Files
- `app/layout.jsx` — Added `reviewOpen` state, `ModalReview` import, wired `onReviewOpen` to Sidebar
- `components/layout/Sidebar.jsx` — Added `onReviewOpen` prop, wired to "Review semanal" ghost button with `data-testid="review-btn"`
- `vitest.config.js` — Added `include: ['tests/unit/**']` and `exclude: ['tests/e2e/**']` to prevent Playwright tests from running under Vitest
- `package.json` — Added `test:e2e` script (`playwright test`)

### Visual Polish (already present in globals.css, verified)
- Scrollbars: width 10px, border 2px solid var(--bg), thumb oklch(0.9 0.004 90)
- focus-visible: box-shadow 0 0 0 3px oklch(0.9 0.01 260)
- ProgressBar: `transition: width .35s ease` (in component)
- Donut: `transition: stroke-dashoffset .5s ease` (in component)
- Input spinners removed via -webkit-appearance: none

## TDD Results

### tests/unit/ModalReview.test.jsx
  ✓ renders nothing when open=false — PASS
  ✓ renders modal when open=true — PASS
  ✓ shows review title — PASS
  ✓ shows completed count after data loads — PASS
  ✓ shows reflection textarea with placeholder — PASS
  ✓ Escape key calls onClose — PASS
  ✓ clicking overlay calls onClose — PASS
  ✓ shows close button that calls onClose — PASS
  ✓ save button calls POST and triggers onClose — PASS
  ✓ shows meta title after data loads — PASS
  ✓ shows objective progress bar after data loads — PASS

### Full unit suite (93 tests, 9 files) — ALL PASS

### E2E Tests (Playwright)
Require a running dev server. Run with `npm run test:e2e`.

## Post-Development Steps (Manual)

1. Install Playwright browsers (first time only):
   ```
   npx playwright install
   ```

2. Run E2E tests (requires running Next.js app or will auto-start via config):
   ```
   npm run test:e2e
   ```

3. The `/api/review-data` POST endpoint currently does not persist the reflection to the database. If you want to store reflections, add a `WeeklyReview` model to `prisma/schema.prisma` and update the route.

## Notes
- The ModalReview fetches data from `/api/review-data` on open, so it always shows current week data
- Language changes are reflected in the modal automatically (listens to `langchange` event)
- The modal is rendered at the RootLayout level so it works across all pages
