# Post-Development: fix/goals — Schema Changes & Server Action Additions

## Branch
`fix/goals`

## Summary of Changes

### prisma/schema.prisma
- `Tarea.day` changed from `Int` to `Int?` (nullable)
- `Tarea.start` changed from `Float` to `Float?` (nullable)
- `Hito.done Boolean @default(false)` field added

### prisma/migrations/20260503000002_backlog_and_hito_done/migration.sql
New migration file created:
- `ALTER TABLE Tarea MODIFY day INTEGER NULL`
- `ALTER TABLE Tarea MODIFY start DOUBLE NULL`
- `ALTER TABLE Hito ADD COLUMN done BOOLEAN NOT NULL DEFAULT false`

### lib/actions/tareas.js
Two new exported functions added at the end:
- `scheduleTarea(id, day, start)` — sets day and start on a tarea
- `unscheduleTarea(id)` — sets day and start to null (moves to backlog)

### lib/actions/hitos.js
Two new exported functions added at the end:
- `createHito(data)` — creates a hito and revalidates /workspace and /metas
- `toggleHitoDone(id)` — flips the done boolean and revalidates /workspace and /metas

### lib/actions/metas.js
Added `revalidatePath('/workspace')` to:
- `toggleMetaActive` — after existing revalidatePath calls
- `updateMeta` — after existing revalidatePath call
- `deleteMeta` — after existing revalidatePath calls

### lib/actions/objetivos.js
- Added `import { revalidatePath } from 'next/cache'`
- `createObjetivo` now stores result, calls revalidatePath for /workspace and /objetivos, returns result
- `updateObjetivo` same pattern
- `deleteObjetivo` same pattern

## TDD Results
No tests were included in this plan.

## Post-Development Steps (Manual)

1. **Run the Prisma migration** against your database:
   ```
   npx prisma migrate deploy
   ```
   Or for development:
   ```
   npx prisma migrate dev
   ```

2. **Regenerate the Prisma client** (migrate dev does this automatically; if using deploy, run separately):
   ```
   npx prisma generate
   ```

## Important Notes
- All changes are strictly additive — no existing function signatures were modified or removed.
- The nullable `day`/`start` fields mean existing rows with values are unaffected; only new backlog tareas will have NULL in those columns.
- The `Hito.done` column defaults to `false`, so all existing hito rows will automatically have `done = false` after migration.
