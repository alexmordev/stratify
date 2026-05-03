# feature_workspace — Post Development

## Branch
`feature_workspace`

## Summary of changes

### New files
- `app/workspace/page.jsx` — Server component. Fetches metas via `getMetas()`, derives `objetivos` and `tareas` via `flatMap`, renders `<ViewWorkspace>`.
- `components/views/ViewWorkspace.jsx` — Large client component (~800 lines). Structure:
  - Helper functions: `getLang`, `fmtWeekRange`, `fmtDue`, `sortTasks`
  - Sub-components: `CollapseSection`, `MetaRow`, `ObjectiveCard`, `HitoRow`
  - Default export: `ViewWorkspace` with left panel (320px meta list, active/archived sections) and right panel (hero, KPI strip, objectives, milestones timeline)
  - Optimistic UI for task toggle, unschedule, reorder, hito toggle, meta active toggle
  - Drag-and-drop task reordering within ObjectiveCard (sortMode = 'order')
  - Language support (es/en) via localStorage + `langchange` event listener

### Modified files
- `app/page.jsx` — Changed redirect target from `/tareas` to `/workspace`

## TDD results
No tests were specified in the plan.

## Post-development steps

No migrations or environment variable changes required. No new dependencies were added.

If the following i18n keys are missing from `lib/i18n.js`, add them:
- `metas`, `newMeta`, `active`, `archived`, `activeNow`, `inactiveNow`
- `objectives`, `tasksTotal`, `sessions`, `milestones`, `milestonesSub`
- `objetivos`, `addObjective`, `addMilestone`
- `selectMeta`, `successCriteria`
- `sortBy`, `sortManual`, `sortDue`, `sortLoad`, `dragHint`
- `sessionShort`, `backlog`, `pomodoro`
- `dueOverdue`, `dueToday`, `dueTomorrow`, `dueIn`
- `unschedule`, `achieved`

Run the dev server to verify:
```
npm run dev
```
Then navigate to `http://localhost:3000` — it will redirect to `/workspace`.

## Important notes
- The `createObjetivo` action call in the Objectives section does not trigger a UI optimistic update (a page refresh would be needed to see the new objective). This is intentional per plan scope — no router.refresh() or refetch was added.
- `updateObjetivo` and `deleteObjetivo` are imported but not wired to any UI action in this view. They are available for future use.
- The `Btn` component is imported but not used in the rendered output. It can be removed if tree-shaking is a concern.
