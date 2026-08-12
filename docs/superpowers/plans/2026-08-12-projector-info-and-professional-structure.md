# Projector Info and Professional Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a projector-ready professional tournament clock whose break timer cannot be accidentally reset, whose tournament information fits into two non-scrolling pages, and whose exact PPC schedule is the protected default preset.

**Architecture:** Keep tournament timing and persisted preset rules in pure domain/repository code, with React components limited to interaction and presentation. Share one pure break-copy helper across the public schedule and Info structure, keep Info pagination as transient local UI state, and enforce projector/editor layout through focused DOM and CSS-contract tests plus browser measurements.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest 4, Testing Library, CSS, localStorage-backed persistence.

## Global Constraints

- Use exactly 80 starting players, a 200-chip starting stack, and 16,000 starting chips in play.
- Use exactly 10 white 1-value chips, 8 red 5-value chips, and 6 green 25-value chips.
- Use the exact 17-level/two-break schedule in the approved design; levels 1–5 last 12 minutes, both breaks last 10 minutes, levels 6–16 last 15 minutes, and level 17 is untimed.
- Use big-blind ante equal to the big blind from 10/20 onward.
- Use stable built-in preset ID `ppc-standard-v1` and name `Princeton Poker Club Standard`.
- Do not replace existing custom structures or custom presets.
- Info uses two manually selected pages, resets to Overview when opened, never auto-rotates, and has no panel/document scrolling at the verification viewports.
- Chip meaning must be conveyed by value, color name, and quantity, never by color alone.
- Keep all directly operated controls at least 44 by 44 pixels and retain existing focus trap, inert background, Escape, shortcut isolation, semantic fields, validation, draft/apply, reordering, and confirmation behavior.
- Introduce no network dependency, remote image, or user-authored HTML.

---

## File map

- Create `src/domain/breakPresentation.ts`: pure normalization for public break headings, subtitles, and accessible labels.
- Create `src/domain/breakPresentation.test.ts`: duplicate/generic label and meaningful chip-up coverage.
- Modify `src/state/reducer.ts` and `src/state/reducer.test.ts`: same-entry navigation no-op and exact break pause/resume regression.
- Modify `src/services/shortcuts.ts` and `src/services/shortcuts.test.ts`: safe Space/arrow shortcuts from schedule buttons.
- Modify `src/features/display/BlindStructure.tsx` and `src/features/display/TournamentDisplay.test.tsx`: shared break copy and schedule-button shortcut opt-in.
- Modify `src/features/display/CurrentLevel.tsx`: shared non-redundant current-break hero copy.
- Modify `src/persistence/presets.ts` and `src/persistence/presets.test.ts`: canonical built-in preset identity, ordering, migration, restoration, and protected operations.
- Modify `src/features/director/PresetManager.tsx` and `src/features/director/StructureEditor.test.tsx`: built-in preset badge and load/duplicate-only controls.
- Create `src/features/info/ChipDenominations.tsx`: canonical accessible chip cards and supplemental information.
- Create `src/features/info/InfoOverview.tsx`: Overview page content.
- Modify `src/features/info/InfoOverlay.tsx`, `src/features/info/InfoOverlay.test.tsx`, and `src/features/info/InfoStructure.tsx`: two-page navigation and compact full schedule.
- Modify `src/features/display/SponsorStrip.test.tsx` and `src/styles/display.css`: Susquehanna contrast plaque, Info pagination, projector typography, compact rows, and public cleanup.
- Modify `src/features/director/StructureEditor.tsx`, `src/features/director/StructureRow.tsx`, `src/features/director/StructureEditor.test.tsx`, and `src/styles/director.css`: editor hierarchy and professional visual polish without behavior changes.
- Modify `src/app/App.integration.test.tsx`: end-to-end running-break, Info, and focused schedule shortcut coverage.

---

### Task 1: Break timing, shortcut safety, and non-redundant break copy

**Files:**
- Create: `src/domain/breakPresentation.ts`
- Create: `src/domain/breakPresentation.test.ts`
- Modify: `src/state/reducer.ts`
- Modify: `src/state/reducer.test.ts`
- Modify: `src/services/shortcuts.ts`
- Modify: `src/services/shortcuts.test.ts`
- Modify: `src/features/display/BlindStructure.tsx`
- Modify: `src/features/display/CurrentLevel.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Consumes: `BreakLevel` from `src/domain/types.ts`, `durationLabel(entry)` from `src/domain/structure.ts`.
- Produces: `breakPresentation(entry: BreakLevel): { heading: string; subtitle: string | null; accessibleLabel: string }`; schedule buttons marked with `data-tournament-shortcuts="true"`; same-index `GO_TO_ENTRY` returns the existing state object.

- [ ] **Step 1: Write failing reducer tests for the actual reset path and exact break pause/resume**

Add to `src/state/reducer.test.ts`:

```ts
it('does not reload the current break when that schedule entry is selected again', () => {
  const state = createInitialState()
  state.runtime.currentEntryIndex = 5
  state.runtime.status = 'running'
  state.runtime.remainingMs = 524_000
  state.runtime.baselineAt = 10_000

  const result = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: 5, now: 20_000 })

  expect(result).toBe(state)
  expect(result.runtime.remainingMs).toBe(524_000)
  expect(result.runtime.baselineAt).toBe(10_000)
})

it('pauses and resumes a running break at the exact resolved remainder', () => {
  let state = createInitialState()
  state = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: 5, now: 1_000 })
  state = tournamentReducer(state, { type: 'START', now: 1_000 })
  state = tournamentReducer(state, { type: 'PAUSE', now: 16_250 })
  expect(state.runtime).toMatchObject({ status: 'paused', remainingMs: 584_750, baselineAt: null })

  state = tournamentReducer(state, { type: 'START', now: 40_000 })
  expect(state.runtime).toMatchObject({ status: 'running', remainingMs: 584_750, baselineAt: 40_000 })
})

it('pauses an automatically entered break without reloading its duration', () => {
  const state = createInitialState()
  state.runtime.currentEntryIndex = 4
  state.runtime.status = 'running'
  state.runtime.remainingMs = 1_000
  state.runtime.baselineAt = 20_000

  const result = tournamentReducer(state, { type: 'PAUSE', now: 22_500 })

  expect(result.runtime).toMatchObject({
    currentEntryIndex: 5,
    status: 'paused',
    remainingMs: 598_500,
    baselineAt: null,
    transitionCause: null,
  })
})
```

- [ ] **Step 2: Run the reducer tests and verify RED**

Run: `npm test -- --run src/state/reducer.test.ts`

Expected: the same-index test fails because the timer reloads to 600,000 ms; the exact pause test documents the intended stable remainder.

- [ ] **Step 3: Make same-entry navigation a no-op**

In `src/state/reducer.ts`, immediately after clamping the requested index:

```ts
const index = clamp(Math.round(action.index), 0, state.structure.length - 1)
if (index === state.runtime.currentEntryIndex) return state
```

Do not resolve elapsed time here: reselecting a row is not a timer command, and normal `TICK`/`PAUSE` remains responsible for wall-clock resolution.

- [ ] **Step 4: Add failing break presentation tests**

Create `src/domain/breakPresentation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { breakPresentation } from './breakPresentation'

describe('breakPresentation', () => {
  it.each(['', 'Break', ' break ', 'BREAK · 10 MIN', 'Break - 10 mins'])(
    'suppresses generic or repeated subtitle %j',
    (label) => expect(breakPresentation({ id: 'break', kind: 'break', durationSeconds: 600, label })).toEqual({
      heading: 'BREAK · 10 MIN',
      subtitle: null,
      accessibleLabel: 'Break, 10 min',
    }),
  )

  it('retains operational chip-up copy once', () => {
    expect(breakPresentation({ id: 'break', kind: 'break', durationSeconds: 600, label: 'Chip up to 5s' })).toEqual({
      heading: 'BREAK · 10 MIN',
      subtitle: 'Chip up to 5s',
      accessibleLabel: 'Break, 10 min, Chip up to 5s',
    })
  })
})
```

- [ ] **Step 5: Run the new domain test and verify RED**

Run: `npm test -- --run src/domain/breakPresentation.test.ts`

Expected: FAIL because `breakPresentation.ts` does not exist.

- [ ] **Step 6: Implement the shared pure formatter**

Create `src/domain/breakPresentation.ts`:

```ts
import { durationLabel } from './structure'
import type { BreakLevel } from './types'

export interface BreakPresentation {
  heading: string
  subtitle: string | null
  accessibleLabel: string
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[—–-]/g, ' ').replace(/[·,:]/g, ' ').replace(/\s+/g, ' ')
}

export function breakPresentation(entry: BreakLevel): BreakPresentation {
  const duration = durationLabel(entry)
  const heading = `BREAK · ${duration.toLocaleUpperCase()}`
  const candidate = entry.label.trim()
  const generic = normalized(candidate)
  const repetitions = new Set([
    '',
    'break',
    normalized(heading),
    normalized(`Break ${duration}`),
    normalized(`Break ${entry.durationSeconds / 60} mins`),
  ])
  const subtitle = repetitions.has(generic) ? null : candidate
  return {
    heading,
    subtitle,
    accessibleLabel: ['Break', duration, subtitle].filter(Boolean).join(', '),
  }
}
```

- [ ] **Step 7: Add failing shortcut and display interaction tests**

In `src/services/shortcuts.test.ts`, create a button with the opt-in attribute and assert:

```ts
const scheduleButton = document.createElement('button')
scheduleButton.dataset.tournamentShortcuts = 'true'
expect(shortcutForEvent(keyEvent(' ', scheduleButton))).toBe('toggle-running')
expect(shortcutForEvent(keyEvent('ArrowRight', scheduleButton))).toBe('next')
expect(shortcutForEvent(keyEvent('ArrowLeft', scheduleButton))).toBe('previous')
expect(shortcutForEvent(keyEvent('Enter', scheduleButton))).toBeNull()
```

In `src/features/display/TournamentDisplay.test.tsx`, assert a generic break renders one `BREAK · 10 MIN` heading, no second `Break` subtitle, and the current schedule button has `data-tournament-shortcuts="true"`.

- [ ] **Step 8: Run the focused shortcut/display tests and verify RED**

Run: `npm test -- --run src/services/shortcuts.test.ts src/features/display/TournamentDisplay.test.tsx`

Expected: FAIL because all button targets are ignored, the opt-in marker is absent, and the old break markup always prints its label.

- [ ] **Step 9: Implement opt-in button shortcuts and shared break copy**

In `src/services/shortcuts.ts`, keep ordinary buttons/editable fields excluded but allow only Space/Left/Right on the explicit schedule opt-in:

```ts
function isScheduleShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('[data-tournament-shortcuts="true"]') !== null
}

export function shortcutForEvent(event: KeyboardEvent): TournamentShortcut | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null
  const scheduleKey = event.key === ' ' || event.key === 'ArrowRight' || event.key === 'ArrowLeft'
  if (isEditableTarget(event.target) && !(scheduleKey && isScheduleShortcutTarget(event.target))) return null
  // retain the existing key switch unchanged
}
```

In `BlindStructure.tsx`, import `breakPresentation`, mark both level and break row buttons with `data-tournament-shortcuts="true"`, and render the subtitle only when non-null:

```tsx
const presentation = breakPresentation(entry)
<button data-tournament-shortcuts="true" aria-label={presentation.accessibleLabel}>
  <span className="structure-break-copy">
    <strong>{presentation.heading}</strong>
    {presentation.subtitle && <small>{presentation.subtitle}</small>}
  </span>
</button>
```

In `CurrentLevel.tsx`, use the same presentation object: retain the eyebrow `Tournament break`, replace the second large `BREAK` plus unconditional label with the single `presentation.heading`, and render `presentation.subtitle` only when present. Keep the next-level card unchanged.

- [ ] **Step 10: Run all focused tests and commit**

Run: `npm test -- --run src/domain/breakPresentation.test.ts src/state/reducer.test.ts src/services/shortcuts.test.ts src/features/display/TournamentDisplay.test.tsx`

Expected: PASS.

Then:

```bash
git add src/domain/breakPresentation.ts src/domain/breakPresentation.test.ts src/state/reducer.ts src/state/reducer.test.ts src/services/shortcuts.ts src/services/shortcuts.test.ts src/features/display/BlindStructure.tsx src/features/display/CurrentLevel.tsx src/features/display/TournamentDisplay.test.tsx
git commit -m "fix: preserve active break timing"
```

---

### Task 2: Canonical protected PPC preset

**Files:**
- Modify: `src/persistence/presets.ts`
- Modify: `src/persistence/presets.test.ts`
- Modify: `src/features/director/PresetManager.tsx`
- Modify: `src/features/director/StructureEditor.test.tsx`
- Verify: `src/domain/sampleStructure.ts`
- Verify: `src/domain/structure.test.ts`

**Interfaces:**
- Consumes: `sampleStructure`, `isFormerBundledStructure(structure)`, `StructurePreset`.
- Produces: `BUILT_IN_PRESET_ID = 'ppc-standard-v1'`; `isBuiltInPreset(presetOrId)`; repository `list()` always returns the canonical built-in first; `rename`/`remove` reject its ID with `The built-in preset cannot be renamed.` / `The built-in preset cannot be deleted.`.

- [ ] **Step 1: Expand exact default-structure tests**

In `src/domain/structure.test.ts`, assert the complete normalized tuple sequence, not only selected rows:

```ts
expect(state.structure.map((entry) => entry.kind === 'break'
  ? ['break', entry.durationSeconds, entry.label]
  : [entry.smallBlind, entry.bigBlind, entry.ante, entry.anteType, entry.durationSeconds]
)).toEqual([
  [1, 2, 0, 'none', 720], [2, 4, 0, 'none', 720], [3, 6, 0, 'none', 720],
  [5, 10, 0, 'none', 720], [8, 16, 0, 'none', 720],
  ['break', 600, 'Chip up to 5s'],
  [10, 20, 20, 'big-blind', 900], [15, 30, 30, 'big-blind', 900],
  [20, 40, 40, 'big-blind', 900], [30, 60, 60, 'big-blind', 900],
  [40, 80, 80, 'big-blind', 900],
  ['break', 600, 'Chip up to 25s and 100s'],
  [50, 100, 100, 'big-blind', 900], [75, 150, 150, 'big-blind', 900],
  [100, 200, 200, 'big-blind', 900], [200, 400, 400, 'big-blind', 900],
  [300, 600, 600, 'big-blind', 900], [400, 800, 800, 'big-blind', 900],
  [500, 1000, 1000, 'big-blind', null],
])
expect(state.configuration).toMatchObject({ startingPlayers: 80, startingStack: 200 })
expect(state.chipLedger).toContainEqual({ id: 'initial-chips', kind: 'initial', chips: 16_000 })
```

- [ ] **Step 2: Write failing built-in repository tests**

In `src/persistence/presets.test.ts`, import `BUILT_IN_PRESET_ID` and add tests that prove:

```ts
const [builtIn] = createPresetRepository(localStorage).list()
expect(builtIn).toMatchObject({ id: BUILT_IN_PRESET_ID, name: 'Princeton Poker Club Standard', structure: sampleStructure })
expect(() => repository.rename(BUILT_IN_PRESET_ID, 'Changed')).toThrow('The built-in preset cannot be renamed.')
expect(() => repository.remove(BUILT_IN_PRESET_ID)).toThrow('The built-in preset cannot be deleted.')
```

Also seed storage with:

- a custom preset;
- the former bundled standard under a random ID;
- a customized preset also named `Princeton Poker Club Standard`;

Then assert exactly one `ppc-standard-v1` canonical record is first, the former bundled record is replaced, and both custom records remain byte-equivalent. Delete the built-in record directly from storage, reconstruct the repository, and assert it self-restores first without touching customs.

- [ ] **Step 3: Run repository/domain tests and verify RED**

Run: `npm test -- --run src/domain/structure.test.ts src/persistence/presets.test.ts`

Expected: structure assertions pass; stable ID/protection/restoration tests fail against the random, mutable seed.

- [ ] **Step 4: Implement the canonical descriptor and normalization**

At module scope in `src/persistence/presets.ts`:

```ts
export const BUILT_IN_PRESET_ID = 'ppc-standard-v1'
export const BUILT_IN_PRESET_NAME = 'Princeton Poker Club Standard'

export function isBuiltInPreset(value: StructurePreset | string): boolean {
  return (typeof value === 'string' ? value : value.id) === BUILT_IN_PRESET_ID
}
```

Inside `createPresetRepository`, create one canonical record with cloned `sampleStructure`. Normalize valid persisted records by removing any existing stable-ID record and one exact former bundled standard, preserving the oldest `createdAt` when available, then prepend the canonical record. Persist only when normalization changes storage. Never treat a standard-named customized structure as bundled.

Guard repository writes:

```ts
rename(id, name) {
  if (isBuiltInPreset(id)) throw new Error('The built-in preset cannot be renamed.')
  // existing rename path
},
remove(id) {
  if (isBuiltInPreset(id)) throw new Error('The built-in preset cannot be deleted.')
  // existing remove path
}
```

Ensure `list()` always normalizes and returns a structured clone so direct storage removal self-heals on the next repository construction/read.

- [ ] **Step 5: Write failing PresetManager protection test**

In the PresetManager section of `src/features/director/StructureEditor.test.tsx`:

```ts
const builtIn = screen.getByRole('group', { name: 'Preset Princeton Poker Club Standard' })
expect(within(builtIn).getByText('Built-in')).toBeVisible()
expect(within(builtIn).getByLabelText('Preset name')).toHaveAttribute('readonly')
expect(within(builtIn).getByRole('button', { name: 'Load' })).toBeEnabled()
expect(within(builtIn).getByRole('button', { name: 'Duplicate' })).toBeEnabled()
expect(within(builtIn).queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument()
expect(within(builtIn).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
```

- [ ] **Step 6: Run UI test and verify RED**

Run: `npm test -- --run src/features/director/StructureEditor.test.tsx`

Expected: FAIL because the built-in row is not identified or protected in the UI.

- [ ] **Step 7: Implement the protected built-in row**

Import `isBuiltInPreset` into `PresetManager.tsx`, compute `const builtIn = isBuiltInPreset(preset)`, set the preset-name input to `readOnly={builtIn}`, render `<span className="preset-built-in">Built-in</span>`, and omit Rename/Delete for built-in rows. Keep Load and Duplicate unchanged.

- [ ] **Step 8: Run focused tests and commit**

Run: `npm test -- --run src/domain/structure.test.ts src/persistence/presets.test.ts src/features/director/StructureEditor.test.tsx`

Expected: PASS.

Then:

```bash
git add src/domain/structure.test.ts src/persistence/presets.ts src/persistence/presets.test.ts src/features/director/PresetManager.tsx src/features/director/StructureEditor.test.tsx
git commit -m "feat: protect the standard tournament preset"
```

---

### Task 3: Two-page non-scrolling Tournament Info

**Files:**
- Create: `src/features/info/ChipDenominations.tsx`
- Create: `src/features/info/InfoOverview.tsx`
- Modify: `src/features/info/InfoOverlay.tsx`
- Modify: `src/features/info/InfoStructure.tsx`
- Modify: `src/features/info/InfoOverlay.test.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Consumes: `selectTournamentInformation(state)`, `breakPresentation(entry)`, `formatChips`, `TournamentState`.
- Produces: local page type `'overview' | 'structure'`; `ChipDenominations({ state, chipLines })`; two tab buttons with `aria-selected`; page indicator; compact `InfoStructure` ordered list with all 19 entries.

- [ ] **Step 1: Replace the one-page Info expectations with failing page-state tests**

Update `src/features/info/InfoOverlay.test.tsx` so the opening assertion checks:

```ts
expect(overlay.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
expect(overlay.getByText('Page 1 of 2')).toBeVisible()
expect(overlay.getByRole('heading', { name: 'Chip denominations' })).toBeVisible()
expect(overlay.queryByRole('list', { name: 'Tournament blind structure' })).not.toBeInTheDocument()

await user.click(overlay.getByRole('tab', { name: 'Blind structure' }))
expect(overlay.getByRole('tab', { name: 'Blind structure' })).toHaveAttribute('aria-selected', 'true')
expect(overlay.getByText('Page 2 of 2')).toBeVisible()
expect(overlay.getByRole('list', { name: 'Tournament blind structure' })).toBeVisible()
expect(overlay.queryByRole('heading', { name: 'Chip denominations' })).not.toBeInTheDocument()
```

Close while on page 2, reopen, and assert Overview is selected again. Retain focus-trap, inert, backdrop, Escape, and shortcut-isolation tests, updating the last tabbable control to match the new footer/tabs.

- [ ] **Step 2: Add failing chip-card accessibility and live-total tests**

Assert three chip groups:

```ts
const one = overlay.getByRole('group', { name: '10 white 1-value chips' })
expect(within(one).getByText('1')).toBeVisible()
expect(within(one).getByText('White')).toBeVisible()
expect(within(one).getByText('10 chips')).toBeVisible()
// Repeat for 8 red 5-value and 6 green 25-value.
expect(overlay.getByText('Starting stack')).toBeVisible()
expect(overlay.getByText('200')).toBeVisible()
expect(overlay.getByText('Players')).toBeVisible()
expect(overlay.getByText('80')).toBeVisible()
expect(overlay.getByText('Chips in play')).toBeVisible()
expect(overlay.getByText('16,000')).toBeVisible()
```

Keep the configured-supplemental-lines test, but expect canonical allocation lines and every stale `Starting stack:` line to be filtered before supplemental copy is rendered.

- [ ] **Step 3: Add failing compact structure and break-copy tests**

On page 2, assert 19 listitems, items 1–10 tagged with `data-column="1"`, items 11–19 tagged with `data-column="2"`, current entry has `CURRENT`, and both breaks contain one heading plus chip-up copy without repeated generic `Break` text. Assert level 17 shows `500 / 1,000`, `BBA 1,000`, and `Until end`.

- [ ] **Step 4: Run Info tests and verify RED**

Run: `npm test -- --run src/features/info/InfoOverlay.test.tsx`

Expected: FAIL because the existing overlay exposes all sections together, has no tabs/cards/page indicator, and uses large one-column structure rows.

- [ ] **Step 5: Implement canonical chip cards**

Create `ChipDenominations.tsx` with a constant allocation:

```ts
const CHIPS = [
  { value: 1, color: 'White', quantity: 10, className: 'chip--white' },
  { value: 5, color: 'Red', quantity: 8, className: 'chip--red' },
  { value: 25, color: 'Green', quantity: 6, className: 'chip--green' },
] as const
```

Render each as a `role="group"` with accessible name `${quantity} ${color.toLowerCase()} ${value}-value chips`, a visual disk with the numeric denomination, explicit color text, and quantity. Filter supplemental lines with these case-insensitive patterns before rendering: `starting stack:`, `10 × 1-value`, `8 × 5-value`, `6 × 25-value`. Do not parse arbitrary user text into CSS classes.

- [ ] **Step 6: Implement the Overview page component**

Create `InfoOverview.tsx` that renders:

- `ChipDenominations`;
- three live summary values from `state.configuration` and `state.configuration.startingPlayers * state.configuration.startingStack`;
- prize lines;
- house notes;
- the eight `TOURNAMENT_RULE_SUMMARY` items split into two semantic lists using `slice(0, 4)` / `slice(4)`.

Keep the TDA link and house-governance note in the Overview footer so it remains keyboard reachable.

- [ ] **Step 7: Implement local two-page navigation**

In `InfoOverlay.tsx`:

```tsx
const [page, setPage] = useState<'overview' | 'structure'>('overview')

useEffect(() => {
  if (open) setPage('overview')
}, [open])
```

Add a `role="tablist"` with Overview and Blind structure buttons; connect them to `role="tabpanel"` regions using `aria-controls`/`aria-labelledby`; render only the active page. Keep Close in the frame and add `<span className="info-page-count">Page {page === 'overview' ? 1 : 2} of 2</span>`. Preserve existing dialog event handling exactly.

- [ ] **Step 8: Compact InfoStructure using the shared break formatter**

Remove `scrollIntoView` from `InfoStructure`; a fully visible fixed grid must not move. Use `breakPresentation(entry)` and short ante copy `BBA ${formatNumber(entry.ante)}`. Add `data-column={index < 10 ? '1' : '2'}` and `data-sequence={index + 1}` to each listitem; render `CURRENT` only for the active item. Keep a single ordered list in DOM order.

- [ ] **Step 9: Replace scrollable Info CSS with a fixed projector composition**

In `display.css`, make the frame consume but never exceed the viewport:

```css
.info-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(86rem, 100%);
  height: min(54rem, calc(100dvh - clamp(1rem, 3vw, 2.5rem)));
  overflow: hidden;
}
.info-page { min-height: 0; overflow: hidden; }
.info-structure-list {
  display: grid;
  grid-template-rows: repeat(10, minmax(0, 1fr));
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
}
```

Use an Overview grid that keeps chip cards/totals left and prizes/notes/rules right. Give chip disks obvious white/red/green fills with contrast-safe text and visible ring patterns. At 640px and below, reduce typography/gaps while retaining two structure columns and 44px tab/Close targets; never add `overflow-y: auto` back to `.info-panel` or `.info-page`.

- [ ] **Step 10: Run Info tests, typecheck, and commit**

Run:

```bash
npm test -- --run src/features/info/InfoOverlay.test.tsx src/domain/breakPresentation.test.ts
npm run typecheck
```

Expected: PASS.

Then:

```bash
git add src/features/info/ChipDenominations.tsx src/features/info/InfoOverview.tsx src/features/info/InfoOverlay.tsx src/features/info/InfoOverlay.test.tsx src/features/info/InfoStructure.tsx src/styles/display.css
git commit -m "feat: split tournament info for projectors"
```

---

### Task 4: Sponsor contrast and professional Structure editor polish

**Files:**
- Modify: `src/features/display/SponsorStrip.test.tsx`
- Modify: `src/features/director/StructureEditor.tsx`
- Modify: `src/features/director/StructureRow.tsx`
- Modify: `src/features/director/StructureEditor.test.tsx`
- Modify: `src/styles/display.css`
- Modify: `src/styles/director.css`

**Interfaces:**
- Consumes: existing sponsor modifiers and `StructureRow` semantic fieldsets.
- Produces: `.sponsor-logo-card--susquehanna` contrast plaque; sticky `.structure-editor-columns`; row parity hook `data-row-tone`; grouped `.row-order-actions`; unchanged editor inputs/actions.

- [ ] **Step 1: Write failing sponsor plaque CSS contract test**

In `SponsorStrip.test.tsx`, read `.sponsor-logo-card--susquehanna` and assert:

```ts
expect(susquehannaRule).toMatch(/background:\s*#[a-f0-9]{6}|background:\s*rgb/i)
expect(susquehannaRule).toMatch(/border:\s*1px solid/)
expect(susquehannaRule).toMatch(/padding:/)
expect(susquehannaRule).toMatch(/border-radius:/)
```

Also retain the intrinsic containment contract for both logo images.

- [ ] **Step 2: Write failing editor hierarchy/CSS contract tests**

In `StructureEditor.test.tsx`, assert:

- each row has `data-row-tone="odd"` or `data-row-tone="even"` matching its list position;
- a break identity reads `Break 01`, not duplicated `Break Break 1`;
- the column heading rule contains `position: sticky`, a positive `z-index`, and background;
- row/action/input rules contain six-pixel (`.375rem` or `6px`) radius;
- numeric inputs use `font-variant-numeric: tabular-nums`;
- break rows use a stronger copper border/background hook;
- action buttons stay exactly 44×44 and in normal grid flow;
- existing field labels, fieldset/legend semantics, cancel restoration, validation, responsive grid, and mobile full-width contracts still pass.

- [ ] **Step 3: Run sponsor/editor tests and verify RED**

Run: `npm test -- --run src/features/display/SponsorStrip.test.tsx src/features/director/StructureEditor.test.tsx`

Expected: FAIL on the absent Susquehanna plaque, sticky header, parity hook, and new radius/typography contracts.

- [ ] **Step 4: Add minimal non-functional editor hooks**

Pass `tone={index % 2 === 0 ? 'odd' : 'even'}` from `StructureEditor` to `StructureRow`, extend `StructureRowProps` with `tone: 'odd' | 'even'`, and set `data-row-tone={tone}` on the fieldset. Change the visible identity to zero-padded copy while leaving the semantic legend and accessible group name as `Level 1` / `Break 1`:

```tsx
const [kind, number] = label.split(' ')
const displayLabel = `${kind} ${String(Number(number)).padStart(2, '0')}`
```

Do not change any input value, draft update, validation, reordering, deletion, Apply, Cancel, or Until End logic.

- [ ] **Step 5: Implement the sponsor and editor visual system**

Add to `display.css`:

```css
.sponsor-logo-card--susquehanna {
  border: 1px solid rgb(30 83 137 / 55%);
  border-radius: .375rem;
  padding: .24rem .46rem;
  background: #eef3f7;
  box-shadow: inset 0 1px rgb(255 255 255 / 75%);
}
```

In `director.css`:

- make `.structure-editor-columns` sticky at the Director content top with an opaque ink background;
- use a `.375rem` radius on row, inputs/selects, and the action well;
- set alternating level rows via `[data-row-tone]` without reducing text contrast;
- make break rows a copper-tinted separator with a stronger left edge;
- give `.row-order-actions` a grouped background/border/padding while retaining three 2.75rem buttons;
- apply `font-family: var(--font-numeric)` and `font-variant-numeric: tabular-nums` to numeric inputs;
- preserve the existing 1180px and 620px grid contracts and visible responsive labels;
- style validation/focus with orange or danger color only on the affected field/row.

- [ ] **Step 6: Run focused tests, lint, and commit**

Run:

```bash
npm test -- --run src/features/display/SponsorStrip.test.tsx src/features/director/StructureEditor.test.tsx
npm run typecheck
npm run lint
```

Expected: PASS.

Then:

```bash
git add src/features/display/SponsorStrip.test.tsx src/features/director/StructureEditor.tsx src/features/director/StructureRow.tsx src/features/director/StructureEditor.test.tsx src/styles/display.css src/styles/director.css
git commit -m "style: polish projector and structure surfaces"
```

---

### Task 5: Integrated regression, projector measurement, and final review

**Files:**
- Modify: `src/app/App.integration.test.tsx`
- Modify only if a measured defect requires it: `src/styles/display.css`
- Modify only if a measured defect requires it: `src/styles/director.css`

**Interfaces:**
- Consumes: completed Tasks 1–4.
- Produces: one integrated regression proving timing + keyboard + Info state; recorded browser measurements for all approved viewports; production build.

- [ ] **Step 1: Write the integrated running-break regression**

Add an integration test that:

1. clicks the first break schedule button;
2. starts the timer and advances fake time by 15 seconds;
3. focuses that same break row and presses Space;
4. asserts the timer reads `09:45` and the control reads Resume;
5. presses Space again and advances 2 seconds;
6. asserts `09:43`, proving neither pause nor native row activation reset it;
7. presses ArrowRight on the focused schedule button and asserts level 6 at `15:00`;
8. opens Info, changes to Blind structure, verifies 19 rows/current marker, closes, reopens, and verifies Overview is reset without tournament mutation.

Use `fireEvent.keyDown(button, { key: ' ' })` rather than `user.keyboard` so the global handler and `preventDefault` path are explicit.

- [ ] **Step 2: Run the integrated test and fix only demonstrated gaps**

Run: `npm test -- --run src/app/App.integration.test.tsx`

Expected: PASS. If it fails, preserve the failure output, identify whether reducer, shortcut routing, or overlay state owns the defect, add the narrowest focused regression beside that owner, then implement the minimal fix.

- [ ] **Step 3: Run the exact automated gate**

Run sequentially:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: every test file passes; typecheck/lint/build exit 0; `dist/manifest.webmanifest` and generated service-worker artifacts exist; diff-check prints nothing.

- [ ] **Step 4: Run desktop projector browser QA at 1920×1080 and 1366×768**

Start a disposable production preview on an unused local port. At both viewports, inspect the main clock and both Info pages and record:

```js
({
  documentOverflow: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth,
  panelOverflow: (() => { const p = document.querySelector('.info-panel'); return p ? p.scrollHeight > p.clientHeight || p.scrollWidth > p.clientWidth : null })(),
  rows: document.querySelectorAll('.info-structure-entry').length,
  current: document.querySelectorAll('.info-structure-entry[data-state="current"]').length,
  minControl: Math.min(...[...document.querySelectorAll('.info-panel button')].map((node) => Math.min(node.getBoundingClientRect().width, node.getBoundingClientRect().height))),
})
```

Expected: both overflow flags `false`, rows `19` on page 2, current `1`, `minControl >= 44`; timer, blinds, players, both sponsor logos, page tabs, page count, Close, chips, rules, and every structure row are visibly unclipped at browser zoom 100%.

- [ ] **Step 5: Run Director and narrow browser QA at 800px and 390×844**

At 800px, open Director → Structure and verify no horizontal document scroller, sticky headings do not cover the first row, all input text and row actions remain visible, break rows are distinct, and controls measure at least 44px. At 390×844, verify responsive field labels, two-column editor fields, full-width note/actions, both Info pages without panel/document scrolling, readable chip text, and no clipped Close/tab controls.

If a measurement fails, first add a raw-CSS or DOM regression assertion that reproduces the violated contract, then make the narrowest CSS correction and rerun the focused suite plus the failed viewport.

- [ ] **Step 6: Request code review and address findings**

Use `superpowers:requesting-code-review` across the complete feature range. Review specifically for timing state safety, persisted custom-preset preservation, focus/keyboard regressions, information accuracy, no-scroll projector behavior, and CSS breakpoint discontinuities. For any finding, use `superpowers:receiving-code-review`, reproduce it, add a failing regression where appropriate, fix it, and rerun the owning suite.

- [ ] **Step 7: Repeat the exact gate and commit final integration evidence**

Run again:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
git diff --check
```

Then:

```bash
git add src/app/App.integration.test.tsx src/styles/display.css src/styles/director.css
git commit -m "test: verify projector tournament workflow"
```

If the final task produced no source change after browser QA, do not create an empty commit; record the exact gate and viewport measurements in the final handoff instead.
