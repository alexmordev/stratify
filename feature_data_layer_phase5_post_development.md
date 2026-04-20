# Phase 5 — Wizard Agente: Post-Development

## Branch
`feature_data_layer`

## Summary of changes

### New files
| File | Description |
|---|---|
| `components/modals/WizardAgent.jsx` | Full-screen wizard modal (3-step flow: Definir → Acordar → Objetivos → Listo) with streaming chat, meta approval, and editable objectives list |
| `lib/claude.js` | Claude API helper: `streamChat()` (async generator, streaming) and `proposeObjetivos()` (JSON proposal call) using `claude-sonnet-4-6` |
| `lib/actions/wizard.js` | `createFromWizard(metaData, objetivosData)` server action — creates Meta + Objetivos in a Prisma transaction |
| `app/api/claude/route.js` | POST route with two modes: streaming chat (default) and `mode: 'propose'` for objectives JSON |
| `tests/unit/WizardAgent.test.jsx` | 5 Vitest tests covering wizard behavior |

### Modified files
| File | Change |
|---|---|
| `components/views/ViewMetas.jsx` | Wired "Nueva meta" button to open WizardAgent; added `wizardOpen` state; imported WizardAgent |
| `components/ui/Btn.jsx` | Added `...rest` spread to forward arbitrary props (e.g. `data-testid`) to the button element |
| `components/ui/ColorDot.jsx` | Added `...rest` spread to forward arbitrary props (e.g. `data-testid`) to the span element |

## TDD Results

**File: `tests/unit/WizardAgent.test.jsx`**

| # | Test | Result |
|---|---|---|
| 1 | cannot advance to step 3 without approving in step 2 | PASS |
| 2 | step 3 create button is disabled when objetivos list is empty | PASS |
| 3 | color picker updates ColorDot of objetivo in real time | PASS |
| 4 | createFromWizard is called with correct meta and objetivos data | PASS |
| 5 | weeklyLoad input rejects non-positive values | PASS |

**Previously passing tests: 67 — still all passing. Total: 72 tests, 72 pass.**

### Fix applied during TDD
- `scrollIntoView` is not available in jsdom — guarded with `typeof scrollIntoView === 'function'` check in `StepChat` useEffect
- `Btn` and `ColorDot` did not forward `data-testid` — added `...rest` spread to both components

## Deviations from plan
- Step numbering is 0-indexed in the component (0=Definir, 1=Acordar, 2=Objetivos, 3=Listo). Tests use `_testStep={2}` for the Objetivos step, not `_testStep={3}` as initially drafted.
- Test props (`_testStep`, `_testMeta`, `_testObjetivos`) were added to `WizardAgent` to enable direct state injection for unit testing without simulating the full multi-step flow.
- The meta extraction from conversation is heuristic (uses first 4 user messages as title/why/success/horizon). In production, a more structured prompt that returns JSON would be preferable, but this satisfies the plan scope.

## Post-development steps required

1. **Set environment variable** — add your Anthropic API key to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Database** — no new migrations needed (schema unchanged from Phase 2). If not already done:
   ```bash
   npx prisma migrate dev
   ```

3. **Install** — no new packages required; `@anthropic-ai/sdk` was already in `dependencies`.

4. **Run dev server**:
   ```bash
   npm run dev
   ```
   Navigate to `/metas` and click "Nueva meta" to open the wizard.
