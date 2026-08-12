# Tournament Operations Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the main display directly operable, simplify the Tournament Director around Structure-first workflows, and ship the exact 80-player/200-chip PPC schedule with a true untimed final level.

**Architecture:** Extend poker levels with nullable duration and optional notes, centralize duration semantics in pure structure helpers, and teach timer/reducer/persistence to handle an untimed terminal entry without changing the numeric runtime clock. Keep main-display interactions as focused components dispatching existing reducer actions, while the Director composes time editing, draft structure editing, and extracted reset controls on its first page.

**Tech Stack:** React 19, TypeScript, Vite PWA, Vitest, Testing Library, CSS

## Global Constraints

- The public display must not show `Official Tournament Clock` or `Total chips`.
- Starting defaults are exactly 80 players and 200 chips each; the allocation is `10 × 1 · 8 × 5 · 6 × 25 = 200`, totaling 16,000 chips.
- The schedule contains exactly 17 poker levels and two 10-minute breaks in the order and values from the approved design specification.
- Levels before 10/20 have no ante; 10/20 and every later level use a big-blind ante equal to the big blind.
- Only the final structure entry may have `durationSeconds: null`, meaning `Until end`; breaks are always timed.
- Active, progressed, or customized saved tournaments must never be replaced by new defaults.
- Main schedule jumps are immediate and confirmation-free; reset actions retain explicit confirmation.
- All controls remain keyboard accessible, visibly focusable, and at least 44 px high where directly operated.
- No remote assets, new runtime dependencies, backend, account, or network requirement may be introduced.
- Existing timer accuracy, persistence recovery, audio alerts, fullscreen, keyboard shortcuts, and PWA behavior must remain intact.

---

### Task 1: Default schedule, notes, and untimed structure contract

**Files:**
- Create: `src/domain/structure.ts`
- Create: `src/domain/structure.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/sampleStructure.ts`
- Modify: `src/domain/calculations.test.ts`
- Modify: `src/domain/validation.ts`
- Modify: `src/domain/validation.test.ts`

**Interfaces:**
- Produces: `isUntimedEntry(entry: StructureEntry): entry is PokerLevel & { durationSeconds: null }`, `entryDurationMs(entry: StructureEntry): number | null`, `durationLabel(entry: StructureEntry): string`, `DEFAULT_STACK_ALLOCATION_LABEL`.
- Consumes: existing `StructureEntry`, `PokerLevel`, and `TournamentState` types.

- [ ] **Step 1: Write failing default-schedule and structure-contract tests**

Add `src/domain/structure.test.ts` with assertions that fail against the old model/default:

```ts
import { describe, expect, it } from 'vitest'
import { createInitialState, sampleStructure } from './sampleStructure'
import { durationLabel, entryDurationMs, isUntimedEntry } from './structure'

describe('PPC default structure', () => {
  it('uses the exact 80-player 200-chip configuration', () => {
    const state = createInitialState()
    expect(state.configuration.startingPlayers).toBe(80)
    expect(state.configuration.startingStack).toBe(200)
    expect(state.chipLedger[0].chips).toBe(16_000)
  })

  it('contains 17 levels and two ten-minute breaks', () => {
    expect(sampleStructure.filter((entry) => entry.kind === 'level')).toHaveLength(17)
    expect(sampleStructure.filter((entry) => entry.kind === 'break')).toHaveLength(2)
    expect(sampleStructure.filter((entry) => entry.kind === 'break').every((entry) => entry.durationSeconds === 600)).toBe(true)
  })

  it('starts BBA at 10/20 and ends with an untimed 500/1000 level', () => {
    const levels = sampleStructure.filter((entry) => entry.kind === 'level')
    expect(levels.slice(0, 5).every((entry) => entry.anteType === 'none' && entry.ante === 0)).toBe(true)
    expect(levels[5]).toMatchObject({ smallBlind: 10, bigBlind: 20, ante: 20, anteType: 'big-blind', note: 'BB ante begins' })
    expect(levels.at(-1)).toMatchObject({ smallBlind: 500, bigBlind: 1_000, ante: 1_000, durationSeconds: null, note: 'Final level' })
  })

  it('exposes safe duration semantics', () => {
    const final = sampleStructure.at(-1)!
    expect(isUntimedEntry(final)).toBe(true)
    expect(entryDurationMs(final)).toBeNull()
    expect(durationLabel(final)).toBe('Until end')
    expect(durationLabel(sampleStructure[0])).toBe('12 min')
  })
})
```

Update `calculations.test.ts` to expect `totalChips(createInitialState()) === 16_000` and `averageStack(...) === 200`.

- [ ] **Step 2: Run the new domain tests and verify RED**

Run:

```bash
npm test -- --run src/domain/structure.test.ts src/domain/calculations.test.ts
```

Expected: FAIL because the helper module, nullable duration, new default schedule, and 200-chip configuration do not exist.

- [ ] **Step 3: Extend the types and add pure duration helpers**

Change `PokerLevel` without changing `BreakLevel`:

```ts
export interface PokerLevel {
  id: string
  kind: 'level'
  durationSeconds: number | null
  smallBlind: number
  bigBlind: number
  ante: number
  anteType: AnteType
  note?: string
}
```

Create `src/domain/structure.ts`:

```ts
import type { PokerLevel, StructureEntry } from './types'

export function isUntimedEntry(
  entry: StructureEntry,
): entry is PokerLevel & { durationSeconds: null } {
  return entry.kind === 'level' && entry.durationSeconds === null
}

export function entryDurationMs(entry: StructureEntry): number | null {
  return entry.durationSeconds === null ? null : entry.durationSeconds * 1_000
}

export function durationLabel(entry: StructureEntry): string {
  return entry.durationSeconds === null
    ? 'Until end'
    : `${Math.round(entry.durationSeconds / 60)} min`
}
```

- [ ] **Step 4: Replace the bundled sample with the exact approved schedule**

In `sampleStructure.ts`, export:

```ts
export const DEFAULT_STACK_ALLOCATION_LABEL = '10 × 1 · 8 × 5 · 6 × 25 = 200'
```

Define all 19 entries exactly:

```ts
export const sampleStructure: StructureEntry[] = [
  { id: 'level-1', kind: 'level', durationSeconds: 720, smallBlind: 1, bigBlind: 2, ante: 0, anteType: 'none' },
  { id: 'level-2', kind: 'level', durationSeconds: 720, smallBlind: 2, bigBlind: 4, ante: 0, anteType: 'none' },
  { id: 'level-3', kind: 'level', durationSeconds: 720, smallBlind: 3, bigBlind: 6, ante: 0, anteType: 'none' },
  { id: 'level-4', kind: 'level', durationSeconds: 720, smallBlind: 5, bigBlind: 10, ante: 0, anteType: 'none' },
  { id: 'level-5', kind: 'level', durationSeconds: 720, smallBlind: 8, bigBlind: 16, ante: 0, anteType: 'none' },
  { id: 'break-1', kind: 'break', durationSeconds: 600, label: 'Chip up to 5s' },
  { id: 'level-6', kind: 'level', durationSeconds: 900, smallBlind: 10, bigBlind: 20, ante: 20, anteType: 'big-blind', note: 'BB ante begins' },
  { id: 'level-7', kind: 'level', durationSeconds: 900, smallBlind: 15, bigBlind: 30, ante: 30, anteType: 'big-blind' },
  { id: 'level-8', kind: 'level', durationSeconds: 900, smallBlind: 20, bigBlind: 40, ante: 40, anteType: 'big-blind' },
  { id: 'level-9', kind: 'level', durationSeconds: 900, smallBlind: 30, bigBlind: 60, ante: 60, anteType: 'big-blind' },
  { id: 'level-10', kind: 'level', durationSeconds: 900, smallBlind: 40, bigBlind: 80, ante: 80, anteType: 'big-blind' },
  { id: 'break-2', kind: 'break', durationSeconds: 600, label: 'Chip up to 25s and 100s' },
  { id: 'level-11', kind: 'level', durationSeconds: 900, smallBlind: 50, bigBlind: 100, ante: 100, anteType: 'big-blind' },
  { id: 'level-12', kind: 'level', durationSeconds: 900, smallBlind: 75, bigBlind: 150, ante: 150, anteType: 'big-blind' },
  { id: 'level-13', kind: 'level', durationSeconds: 900, smallBlind: 100, bigBlind: 200, ante: 200, anteType: 'big-blind', note: 'Final table target · chip up to 100s and 500s' },
  { id: 'level-14', kind: 'level', durationSeconds: 900, smallBlind: 200, bigBlind: 400, ante: 400, anteType: 'big-blind' },
  { id: 'level-15', kind: 'level', durationSeconds: 900, smallBlind: 300, bigBlind: 600, ante: 600, anteType: 'big-blind', note: 'Expected finish' },
  { id: 'level-16', kind: 'level', durationSeconds: 900, smallBlind: 400, bigBlind: 800, ante: 800, anteType: 'big-blind' },
  { id: 'level-17', kind: 'level', durationSeconds: null, smallBlind: 500, bigBlind: 1_000, ante: 1_000, anteType: 'big-blind', note: 'Final level' },
]
```

Set `startingStack = 200` and initialize the first runtime duration through `entryDurationMs(structure[0]) ?? 0`.

- [ ] **Step 5: Write failing validation tests for untimed placement and note length**

Add tests that expect:

```ts
it('accepts one untimed final poker level', () => {
  expect(validateStructure(structuredClone(sampleStructure)).valid).toBe(true)
})

it('rejects an untimed non-final level', () => {
  const structure = structuredClone(sampleStructure)
  const first = structure[0]
  if (first.kind === 'level') first.durationSeconds = null
  expect(validateStructure(structure).issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ entryId: 'level-1', field: 'durationSeconds' }),
  ]))
})

it('rejects notes longer than 80 characters', () => {
  const structure = structuredClone(sampleStructure)
  const level = structure.find((entry) => entry.kind === 'level')!
  level.note = 'x'.repeat(81)
  expect(validateStructure(structure).issues).toEqual(expect.arrayContaining([
    expect.objectContaining({ entryId: level.id, field: 'note' }),
  ]))
})
```

- [ ] **Step 6: Run validation tests and verify RED**

Run `npm test -- --run src/domain/validation.test.ts`.

Expected: FAIL because nullable duration and notes are rejected or unchecked.

- [ ] **Step 7: Implement terminal-only untimed and note validation**

For each entry, accept positive whole-minute durations as before. Accept `null` only when `entry.kind === 'level'` and its index equals `entries.length - 1`. Add an 80-character limit for `PokerLevel.note`; normalize absence through optional typing rather than inserting empty strings.

- [ ] **Step 8: Run all Task 1 tests and commit**

Run:

```bash
npm test -- --run src/domain/structure.test.ts src/domain/calculations.test.ts src/domain/validation.test.ts
npm run typecheck
git diff --check
```

Commit:

```bash
git add src/domain
git commit -m "feat: add PPC 200-chip default structure"
```

### Task 2: Untimed timer, reducer, persistence, and safe legacy migration

**Files:**
- Create: `src/persistence/legacyDefaults.ts`
- Create: `src/persistence/legacyDefaults.test.ts`
- Modify: `src/domain/timer.ts`
- Modify: `src/domain/timer.test.ts`
- Modify: `src/state/reducer.ts`
- Modify: `src/state/reducer.test.ts`
- Modify: `src/persistence/snapshot.ts`
- Modify: `src/persistence/snapshot.test.ts`
- Modify: `src/persistence/presets.ts`
- Modify: `src/persistence/presets.test.ts`
- Modify: `src/app/TournamentProvider.tsx`

**Interfaces:**
- Consumes: `entryDurationMs`, `isUntimedEntry`, `sampleStructure` from Task 1.
- Produces: timer/reducer/persistence semantics where untimed entries use `remainingMs: 0`, `baselineAt: null`, and never auto-complete.

- [ ] **Step 1: Write failing timer tests for automatic untimed entry**

Add:

```ts
it('enters the untimed final level without completing', () => {
  const state = createInitialState()
  state.runtime.currentEntryIndex = state.structure.length - 2
  state.runtime.status = 'running'
  state.runtime.remainingMs = 1_000
  state.runtime.baselineAt = 10_000

  const result = resolveTimer(state, 12_000)

  expect(result.runtime.currentEntryIndex).toBe(state.structure.length - 1)
  expect(result.runtime.remainingMs).toBe(0)
  expect(result.runtime.baselineAt).toBeNull()
  expect(result.runtime.status).toBe('running')
  expect(result.runtime.transitionCause).toBe('automatic')
})

it('does not advance or decrement an active untimed level', () => {
  const state = createInitialState()
  state.runtime.currentEntryIndex = state.structure.length - 1
  state.runtime.status = 'running'
  state.runtime.remainingMs = 0
  state.runtime.baselineAt = null
  expect(resolveTimer(state, 999_999)).toEqual(state)
})
```

- [ ] **Step 2: Run timer tests and verify RED**

Run `npm test -- --run src/domain/timer.test.ts`.

Expected: FAIL from null multiplication or incorrect completion/baseline status.

- [ ] **Step 3: Implement untimed-aware resolution**

Before elapsed-time math, return the running untimed state unchanged. In the overflow loop, inspect `entryDurationMs(nextEntry)`; when it returns `null`, enter that index with `remainingMs: 0`, `baselineAt: null`, `status: 'running'`, cleared thresholds, and `transitionCause: 'automatic'`. Timed final entries retain the existing completion behavior.

- [ ] **Step 4: Write failing reducer tests for direct navigation, reset, and replacement**

Cover:

```ts
it('jumps to an untimed final level without a countdown baseline', () => {
  const state = createInitialState()
  state.runtime.status = 'running'
  const result = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: state.structure.length - 1, now: 5_000 })
  expect(result.runtime).toMatchObject({ remainingMs: 0, baselineAt: null, status: 'running', transitionCause: 'manual' })
})

it('resets an untimed current level without completing', () => {
  const state = createInitialState()
  state.runtime.currentEntryIndex = state.structure.length - 1
  state.runtime.status = 'paused'
  const result = tournamentReducer(state, { type: 'RESET_CURRENT', now: 5_000 })
  expect(result.runtime).toMatchObject({ remainingMs: 0, baselineAt: null, status: 'paused' })
})
```

Also test `START`, `PAUSE`, and `SET_STRUCTURE` when the current entry is untimed.

- [ ] **Step 5: Run reducer tests and verify RED**

Run `npm test -- --run src/state/reducer.test.ts`.

Expected: FAIL because reducer actions multiply `null` and/or store baselines for untimed entries.

- [ ] **Step 6: Route reducer duration decisions through the helper**

Use `entryDurationMs(entry)` in `RESET_CURRENT`, `RESET_TOURNAMENT`, `GO_TO_ENTRY`, and `SET_STRUCTURE`. For untimed entries, use zero remaining and a null baseline. `START` sets `status: 'running'` but keeps `baselineAt: null` when current is untimed. `SET_TIME` and `ADJUST_TIME` return the untimed state unchanged.

- [ ] **Step 7: Write failing persistence and migration tests**

Add snapshot coverage proving a terminal `durationSeconds: null` structure round-trips. Create `legacyDefaults.test.ts` fixtures representing the exact former 80-player/30,000-stack, 12-entry structure and assert:

- idle/index-zero/all-80 legacy state migrates to the new 200-chip initial state;
- the same legacy structure at index one or with 79 players is preserved;
- a customized structure is preserved;
- the former bundled standard preset is upgraded in place while a custom preset is not altered.

- [ ] **Step 8: Run persistence tests and verify RED**

Run:

```bash
npm test -- --run src/persistence/snapshot.test.ts src/persistence/presets.test.ts src/persistence/legacyDefaults.test.ts
```

Expected: FAIL because `null` is rejected and no safe legacy matcher/migration exists.

- [ ] **Step 9: Implement structural snapshot parsing and exact legacy matching**

Create `legacyDefaults.ts` with the exact former 12-entry structure/configuration constant and pure predicates. The former structure is:

```ts
const formerBundledStructure: StructureEntry[] = [
  { id: 'level-1', kind: 'level', durationSeconds: 1_200, smallBlind: 100, bigBlind: 200, ante: 200, anteType: 'big-blind' },
  { id: 'level-2', kind: 'level', durationSeconds: 1_200, smallBlind: 100, bigBlind: 300, ante: 300, anteType: 'big-blind' },
  { id: 'level-3', kind: 'level', durationSeconds: 1_200, smallBlind: 200, bigBlind: 400, ante: 400, anteType: 'big-blind' },
  { id: 'level-4', kind: 'level', durationSeconds: 1_200, smallBlind: 300, bigBlind: 600, ante: 600, anteType: 'big-blind' },
  { id: 'break-1', kind: 'break', durationSeconds: 900, label: 'Break' },
  { id: 'level-5', kind: 'level', durationSeconds: 1_200, smallBlind: 400, bigBlind: 800, ante: 800, anteType: 'big-blind' },
  { id: 'level-6', kind: 'level', durationSeconds: 1_200, smallBlind: 500, bigBlind: 1_000, ante: 1_000, anteType: 'big-blind' },
  { id: 'level-7', kind: 'level', durationSeconds: 1_200, smallBlind: 600, bigBlind: 1_200, ante: 1_200, anteType: 'big-blind' },
  { id: 'level-8', kind: 'level', durationSeconds: 1_200, smallBlind: 800, bigBlind: 1_600, ante: 1_600, anteType: 'big-blind' },
  { id: 'break-2', kind: 'break', durationSeconds: 900, label: 'Break' },
  { id: 'level-9', kind: 'level', durationSeconds: 1_200, smallBlind: 1_000, bigBlind: 2_000, ante: 2_000, anteType: 'big-blind' },
  { id: 'level-10', kind: 'level', durationSeconds: 1_200, smallBlind: 1_500, bigBlind: 3_000, ante: 3_000, anteType: 'big-blind' },
]
```

The former configuration matcher requires `startingPlayers === 80`, `startingStack === 30_000`, organization `PRINCETON POKER CLUB`, tournament name `Princeton Poker Club Standard`, idle status, index zero, 80 remaining players, and exact structure equality. Export pure predicates:

```ts
export function isFormerBundledStructure(structure: StructureEntry[]): boolean
export function isUntouchedFormerDefault(state: TournamentState): boolean
```

Use deep value comparison against the exact former bundled structure, not name-only matching. In `loadSnapshot`, replace only an `isUntouchedFormerDefault` snapshot with `createInitialState()`. In the preset repository initialization, upgrade only the standard preset whose structure exactly matches the former bundled structure; preserve its ID/name/creation time and set its structure to `sampleStructure`.

Update `isStructureEntry` so level duration accepts positive numbers or `null`, break duration stays positive, optional notes must be strings of at most 80 characters, and `validateStructure` remains the final whole-structure gate.

- [ ] **Step 10: Avoid polling while an untimed level is active**

In `TournamentProvider`, derive the current entry and skip the 250 ms interval when it is untimed, even if runtime status is `running`. Include current index/structure in effect dependencies so moving back to a timed entry restarts polling.

- [ ] **Step 11: Run all Task 2 tests and commit**

Run:

```bash
npm test -- --run src/domain/timer.test.ts src/state/reducer.test.ts src/persistence/snapshot.test.ts src/persistence/presets.test.ts src/persistence/legacyDefaults.test.ts src/app/TournamentProvider.test.tsx
npm run typecheck
git diff --check
```

Commit:

```bash
git add src/domain/timer.ts src/domain/timer.test.ts src/state src/persistence src/app/TournamentProvider.tsx
git commit -m "feat: support untimed terminal levels"
```

### Task 3: Public structure navigation and simplified statistics

**Files:**
- Modify: `src/features/display/TournamentDisplay.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/features/display/BlindStructure.tsx`
- Modify: `src/features/display/Clock.tsx`
- Modify: `src/features/display/CurrentLevel.tsx`
- Modify: `src/features/display/PlayerStats.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Consumes: `durationLabel`, `isUntimedEntry`, existing `GO_TO_ENTRY` dispatch.
- Produces: `BlindStructure({ state, onSelectEntry })`, `Clock({ remainingMs, untimed })`.

- [ ] **Step 1: Write failing removal, note, untimed, and navigation tests**

Update `TournamentDisplay.test.tsx` so the main test expects `12:00`, `LEVEL 1`, `1 / 2`, `80 / 80`, and average stack `200`, while asserting:

```ts
expect(screen.queryByText('Official Tournament Clock')).not.toBeInTheDocument()
expect(screen.queryByText('Total chips')).not.toBeInTheDocument()
expect(screen.queryByText('16,000')).not.toBeInTheDocument()
```

Add interaction tests:

```ts
it('jumps to a schedule entry from the main display', async () => {
  const user = userEvent.setup()
  renderDisplay()
  await user.click(screen.getByRole('button', { name: /^Level 2 2 \/ 4/ }))
  expect(screen.getByText('LEVEL 2')).toBeVisible()
  expect(screen.getByRole('timer')).toHaveTextContent('12:00')
})

it('renders schedule notes and the untimed terminal clock', async () => {
  const user = userEvent.setup()
  renderDisplay()
  expect(screen.getByText(/Chip up to 5s/)).toBeVisible()
  expect(screen.getByText(/Final table target/)).toBeVisible()
  await user.click(screen.getByRole('button', { name: /^Level 17 500 \/ 1,000/ }))
  expect(screen.getByRole('timer')).toHaveTextContent('UNTIL END')
})
```

- [ ] **Step 2: Run display tests and verify RED**

Run `npm test -- --run src/features/display/TournamentDisplay.test.tsx`.

Expected: FAIL because old eyebrow/stat/schedule markup remains and clock lacks untimed rendering.

- [ ] **Step 3: Implement the simplified header and two-stat panel**

Remove `.brand-eyebrow` markup from `TournamentDisplay`. Remove the Total Chips article and import from `PlayerStats`. Change `.stats-grid` to two equal columns on desktop while retaining the existing single-column mobile layout.

- [ ] **Step 4: Make schedule rows real buttons**

Change `BlindStructure` to accept:

```ts
interface BlindStructureProps {
  state: TournamentState
  onSelectEntry: (index: number) => void
}
```

Keep each semantic `<li>` and wrap its complete visible row content in `<button type="button" className="structure-row-button">`. Pass `index` on click. Preserve `data-state` and `aria-current` on the list item. Include level notes and break labels in visible text and accessible names; use `durationLabel` for `12 min`, `15 min`, and `Until end`.

In `TournamentDisplay`, pass:

```tsx
<BlindStructure
  state={state}
  onSelectEntry={(index) => dispatch({ type: 'GO_TO_ENTRY', index, now: Date.now() })}
/>
```

- [ ] **Step 5: Render untimed clock and notes**

Give `Clock` an `untimed: boolean` prop. When true, render `UNTIL END` with `clock--untimed`; otherwise keep exact countdown formatting. In `TournamentDisplay`, derive the current entry and pass `isUntimedEntry(currentEntry)`. `CurrentLevel` displays a poker-level note beneath the ante when present and a break's configured chip-up label in the break eyebrow/heading block.

- [ ] **Step 6: Add button hover/focus and compact note styling**

Make `.structure-row-button` fill its list item, inherit color/type, use a transparent border/background by default, and show the existing copper/brass current/hover/focus language. Keep at least 44 px row height and do not introduce document-level overflow.

- [ ] **Step 7: Run focused and full display checks and commit**

Run:

```bash
npm test -- --run src/features/display/TournamentDisplay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit:

```bash
git add src/features/display src/styles/display.css
git commit -m "feat: add direct public schedule navigation"
```

### Task 4: Editable main player-count control

**Files:**
- Create: `src/features/display/PlayerCountControl.tsx`
- Create: `src/features/display/PlayerCountControl.test.tsx`
- Modify: `src/features/display/DisplayControls.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Consumes: `playersRemaining`, `startingPlayers`, and callbacks `onSetPlayers(players)`, `onAdjustPlayers(delta)`.
- Produces: a controlled-draft player input that commits on blur/Enter and reverts on Escape.

- [ ] **Step 1: Write failing component behavior tests**

Create tests with a small stateful harness proving:

```ts
it('commits a typed player count on Enter', async () => {
  const user = userEvent.setup()
  renderHarness({ players: 80, startingPlayers: 80 })
  const input = screen.getByRole('spinbutton', { name: 'Players remaining' })
  await user.clear(input)
  await user.type(input, '53{Enter}')
  expect(screen.getByRole('spinbutton', { name: 'Players remaining' })).toHaveValue(53)
})

it('commits on blur and clamps through the reducer-facing callback', async () => {
  // Type 999, blur, and expect the harness to settle at 80.
})

it('restores the live value on Escape', async () => {
  // Type 40, press Escape, and expect 80 without invoking onSetPlayers.
})

it('keeps minus and plus buttons synchronized with the input', async () => {
  // Click eliminate/restore and assert the visible input updates.
})
```

- [ ] **Step 2: Run the new component test and verify RED**

Run `npm test -- --run src/features/display/PlayerCountControl.test.tsx`.

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement focused draft/commit behavior**

The component owns string draft state, an editing flag, and a `cancelBlurRef`. Commit with `Number(draft)` through `onSetPlayers`; the harness/real reducer clamps. On Enter call `currentTarget.blur()`. On Escape set `cancelBlurRef.current = true`, replace the draft with the live value, and blur; the blur handler consumes the flag without calling `onSetPlayers`. Synchronize prop changes in an effect only when not editing. Keep the existing `Eliminate player` and `Restore player` accessible button names and disabled boundaries.

- [ ] **Step 4: Replace the read-only stepper center**

In `DisplayControls`, render:

```tsx
<PlayerCountControl
  playersRemaining={state.runtime.playersRemaining}
  startingPlayers={state.configuration.startingPlayers}
  onSetPlayers={(players) => dispatch({ type: 'SET_PLAYERS', players })}
  onAdjustPlayers={(delta) => dispatch({ type: 'ADJUST_PLAYERS', delta })}
/>
```

Remove the duplicated stepper markup from `DisplayControls`.

- [ ] **Step 5: Style the numeric input as an editable instrument**

Keep the existing stepper frame. The input must have a transparent background, warm-ivory centered numeric type, no browser spinner decoration where supported, a visible focus inset/outline, and a minimum 44 px hit area without increasing desktop dock height.

- [ ] **Step 6: Add an integrated main-display test and commit**

In `TournamentDisplay.test.tsx`, type `53` into `Players remaining`, press Enter, and assert the Players Remaining stat shows `53 / 80` and average stack updates. Run:

```bash
npm test -- --run src/features/display/PlayerCountControl.test.tsx src/features/display/TournamentDisplay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit:

```bash
git add src/features/display src/styles/display.css
git commit -m "feat: make main player count editable"
```

### Task 5: Structure-first Director and integrated clock/reset controls

**Files:**
- Create: `src/features/director/ResetControls.tsx`
- Create: `src/features/director/ResetControls.test.tsx`
- Delete: `src/features/director/DirectorRun.tsx`
- Modify: `src/features/director/DirectorOverlay.tsx`
- Modify: `src/features/director/DirectorOverlay.test.tsx`
- Modify: `src/features/director/StructureEditor.tsx`
- Modify: `src/features/director/StructureEditor.test.tsx`
- Modify: `src/features/director/StructureRow.tsx`
- Modify: `src/features/director/TimeEditor.tsx`
- Modify: `src/features/director/TournamentSettings.tsx`
- Modify: `src/styles/director.css`

**Interfaces:**
- Consumes: `isUntimedEntry`, `durationLabel`, existing reset actions/dialog.
- Produces: `ResetControls()` and a four-tab Director whose default tab is `structure`.

- [ ] **Step 1: Rewrite Director integration expectations before production changes**

Replace Run-page tests with tests that assert immediately after opening:

```ts
expect(screen.getByRole('button', { name: 'Structure' })).toHaveAttribute('aria-pressed', 'true')
expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument()
expect(screen.queryByText('Progression')).not.toBeInTheDocument()
expect(screen.queryByText('Field')).not.toBeInTheDocument()
expect(screen.getByRole('heading', { name: 'Edit remaining time' })).toBeVisible()
expect(screen.getByRole('button', { name: 'Reset current level' })).toBeVisible()
```

Retain time-edit/reset confirmation behavior tests, but remove overlay player-edit and select-based progression tests. Update focus-trap expectations so the actual last enabled control on Structure is used.

- [ ] **Step 2: Run Director integration tests and verify RED**

Run `npm test -- --run src/features/director/DirectorOverlay.test.tsx`.

Expected: FAIL because Run remains first and Structure lacks time/reset controls.

- [ ] **Step 3: Extract reset behavior test-first**

Create `ResetControls.test.tsx` proving both buttons open their existing confirmation dialogs and confirming dispatches `RESET_CURRENT`/`RESET_TOURNAMENT`. Then create `ResetControls.tsx` by moving only the reset confirmation state/markup from `DirectorRun`; it obtains state/dispatch from `useTournament` and keeps exact dialog copy.

- [ ] **Step 4: Remove Run and make Structure first**

Change the tab union/list to:

```ts
export type DirectorTab = 'structure' | 'presets' | 'tournament' | 'settings'

const tabs = [
  { id: 'structure', label: 'Structure', marker: '01' },
  { id: 'presets', label: 'Presets', marker: '02' },
  { id: 'tournament', label: 'Tournament', marker: '03' },
  { id: 'settings', label: 'Settings', marker: '04' },
] satisfies { id: DirectorTab; label: string; marker: string }[]
```

Initialize `tab` to `structure`, delete the `DirectorRun` import/render/file, and render only the four remaining pages.

- [ ] **Step 5: Compose time/editor/reset on Structure**

At the start of `StructureEditor`, render `<TimeEditor key={currentEntry.id} />`; after sticky apply actions render `<ResetControls />`. Preserve the draft editor between them. Add a small live-entry heading so TimeEditor context is clear without reintroducing Progression or Field.

- [ ] **Step 6: Write failing untimed TimeEditor and StructureRow tests**

Add tests proving:

- on the final untimed level, TimeEditor displays `Untimed final level` and has no Minutes/Seconds inputs;
- a level row has an `Until end` checkbox and checking it emits `durationSeconds: null`;
- timed duration input is disabled/absent while Until end is checked;
- editing `Level note` emits trimmed/raw draft text and validation owns length enforcement.

- [ ] **Step 7: Run focused Director tests and verify RED**

Run:

```bash
npm test -- --run src/features/director/StructureEditor.test.tsx src/features/director/DirectorOverlay.test.tsx src/features/director/ResetControls.test.tsx
```

Expected: FAIL because the editor has no untimed or note controls and reset extraction is incomplete.

- [ ] **Step 8: Implement untimed and note editing**

In `StructureRow`, add a checkbox labeled `Until end` for poker levels. Checking sets `durationSeconds: null`; unchecking restores 900 seconds. Disable or hide the duration-number input when untimed. Add a full-width `Level note` input with `maxLength={80}` only for poker levels.

In `StructureEditor.addLevel`, use `previous?.durationSeconds ?? 900` so an untimed prior level does not create a second untimed level. New breaks default to 600 seconds. Validation continues to prevent applying any untimed level that is not last.

In `TimeEditor`, detect the current untimed entry before deriving minutes. Render an explanatory director card with heading `Untimed final level` and copy `This level runs until the tournament ends; there is no countdown to edit.`

- [ ] **Step 9: Add the stack allocation and computed chips helper**

In `TournamentSettings`, compute `players * stack` from valid draft numbers. Beneath the starting fields show `Starting chips in play: 16,000` (or the current computed value). When the draft stack equals `200`, also show `Default allocation: 10 × 1 · 8 × 5 · 6 × 25 = 200` using `DEFAULT_STACK_ALLOCATION_LABEL`. This information is Director-only.

Update the existing atomic tournament-information test to assert the helper rather than expecting Total Chips on the public display.

- [ ] **Step 10: Remove obsolete Run-specific CSS and tune Structure composition**

Delete selectors used only by `.run-hero`, `.navigation-card`, `.level-navigation`, `.player-editor`, and `.player-edit-row` after confirming no remaining markup uses them. Add compact `.structure-live-tools`/untimed-state styling and preserve mobile stacking, sticky apply actions, reset danger semantics, and 44 px controls.

- [ ] **Step 11: Run all Task 5 tests and commit**

Run:

```bash
npm test -- --run src/features/director/DirectorOverlay.test.tsx src/features/director/StructureEditor.test.tsx src/features/director/ResetControls.test.tsx src/features/director/DirectorSettings.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit:

```bash
git add -A src/features/director src/styles/director.css
git commit -m "feat: make Director structure-first"
```

### Task 6: Full regression, production build, and responsive browser QA

**Files:**
- Modify only if verification exposes a defect.

**Interfaces:**
- Consumes: completed Tasks 1–5.
- Produces: a verified, integration-ready branch.

- [ ] **Step 1: Run the fresh automated gate**

Run exactly:

```bash
git diff --check
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

Expected: zero failures, zero lint/type errors, and a generated PWA service worker/manifest.

- [ ] **Step 2: Inspect the production artifact**

Confirm `dist/branding/ppc-logo.png`, all three icons, `manifest.webmanifest`, and service worker files exist. Confirm the manifest still contains theme/background `#070705` and three icon entries.

- [ ] **Step 3: Browser QA at 1920×1080**

Verify:

- no `Official Tournament Clock` or Total Chips;
- logo, organization, and tournament header remain aligned;
- two-stat panel is balanced;
- schedule rows are visibly clickable/focusable and jumping changes level/time;
- player input accepts a typed value and Enter updates the stat;
- no horizontal overflow and the fixed dock does not overlap content.

- [ ] **Step 4: Browser QA at 1366×768**

Verify the 19-entry schedule scrolls internally, note text remains legible, current row scrolls into view after jumps, the main clock retains priority, all dock controls fit, and the Director Structure page scrolls without horizontal overflow.

- [ ] **Step 5: Browser QA at 390×844**

Verify no horizontal overflow; schedule buttons, player input, Structure tab rail, time editor, structure rows, and reset controls remain usable; the in-flow mobile dock covers no content; every directly operated target is at least 44 px.

- [ ] **Step 6: Verify the untimed terminal workflow**

Jump to Level 17. Confirm schedule duration and clock both say `Until end`/`UNTIL END`, no NaN/00:00 appears, Start/Pause does not create a countdown, the Director time editor shows the untimed explanation, and Reset Current retains the untimed state.

- [ ] **Step 7: Verify fresh and legacy startup behavior**

With empty storage, confirm 80 players, 200 average stack, 1/2 for 12:00, and the new standard preset. With an exact untouched legacy fixture, confirm migration. With a progressed/custom fixture, confirm it is preserved.

- [ ] **Step 8: Request final whole-branch review**

Review the full branch against `docs/superpowers/specs/2026-08-12-tournament-operations-refresh-design.md`. Fix every Critical/Important finding and re-run the relevant tests.

- [ ] **Step 9: Commit any verification-only fixes and prepare integration**

If QA required changes, commit them with a focused `fix:` message. Finish only after the exact final head passes the full automated gate again.
