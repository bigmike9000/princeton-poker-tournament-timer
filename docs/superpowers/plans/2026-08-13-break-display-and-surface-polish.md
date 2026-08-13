# Break Display and Surface Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make public break rows instruction-free, show chip-stacking instructions only for the active break beneath player statistics, add the 150/300/300 level, and apply a restrained professional corner/spacing system to the public clock.

**Architecture:** Keep `breakPresentation()` as the normalization boundary for legacy and customized break labels, but make its heading/accessibility output schedule-safe. Add one focused display component for the active procedure and place it after the existing statistics module. Extend the stable default structure without renumbering existing IDs, then protect the visual treatment with DOM and raw-CSS contract tests plus real-browser projector measurements.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, Vite/PWA, in-app Browser QA.

## Global Constraints

- Public schedule copy is exactly `BREAK — 10 MIN`; no chip-stacking instruction appears in a main or Info schedule row.
- The active-break hero says only `BREAK`; its instruction appears only below player and average-stack counts.
- The new level is `150 / 300 / 300`, uses a big-blind ante, lasts 15 minutes, and sits between `100 / 200 / 200` and `200 / 400 / 400`.
- Existing default entry IDs stay unchanged; the new entry ID is `level-150-300`.
- Use 6px public controls, 8px grouped cards, and 4px compact schedule/badge corners; do not introduce pill styling.
- Preserve current focus rings, 44px minimum targets, PWA output, saved-state compatibility, and responsive containment.

---

## File Map

- `src/domain/breakPresentation.ts`: normalize break heading, optional procedure, and schedule-safe accessible name.
- `src/domain/sampleStructure.ts`: insert the new stable default level.
- `src/features/display/BreakProcedure.tsx`: render only the active meaningful break instruction.
- `src/features/display/CurrentLevel.tsx`: keep the break hero instruction-free.
- `src/features/display/BlindStructure.tsx`: render compact schedule-only break rows.
- `src/features/display/TournamentDisplay.tsx`: place the procedure after statistics.
- `src/features/info/InfoStructure.tsx`: use the shared compact break heading.
- `src/styles/tokens.css`: define restrained shared radius tokens.
- `src/styles/display.css`: polish public cards, controls, stepper, rows, and break notice.
- Existing adjacent tests: prove behavior, default data, accessibility, CSS contracts, and integration counts.

### Task 1: Schedule-safe break presentation and default level

**Files:**
- Modify: `src/domain/breakPresentation.test.ts`
- Modify: `src/domain/breakPresentation.ts`
- Modify: `src/domain/structure.test.ts`
- Modify: `src/domain/sampleStructure.ts`

**Interfaces:**
- Consumes: `durationLabel(entry: StructureEntry): string`.
- Produces: `breakPresentation(entry: BreakLevel): { heading: string; subtitle: string | null; accessibleLabel: string }`, where `heading` is schedule-safe and `subtitle` is procedure-only.
- Produces: `sampleStructure` with 20 entries and a stable `level-150-300` entry.

- [ ] **Step 1: Write failing break-presentation tests**

Change the expected heading to `BREAK — 10 MIN` and require `accessibleLabel: 'Break, 10 min'` for generic, legacy, and customized labels. Keep `subtitle` assertions for the actual instruction.

```ts
expect(breakPresentation(breakEntry)).toEqual({
  heading: 'BREAK — 10 MIN',
  subtitle: 'Count and stack white chips in stacks of 10',
  accessibleLabel: 'Break, 10 min',
})
```

- [ ] **Step 2: Run RED for break presentation**

Run: `npm test -- --run src/domain/breakPresentation.test.ts`

Expected: failures show the old middle-dot heading and instruction-bearing accessible label.

- [ ] **Step 3: Implement schedule-safe presentation**

Update `breakPresentation()` to emit `BREAK — ${duration.toLocaleUpperCase()}` and `['Break', duration].join(', ')`, while preserving the existing subtitle normalization and legacy mapping.

- [ ] **Step 4: Run GREEN for break presentation**

Run: `npm test -- --run src/domain/breakPresentation.test.ts`

Expected: all tests pass.

- [ ] **Step 5: Write failing default-structure tests**

Update the exact schedule fixture to include:

```ts
[100, 200, 200, 'big-blind', 900],
[150, 300, 300, 'big-blind', 900],
[200, 400, 400, 'big-blind', 900],
```

Require 18 levels, 2 breaks, 20 total entries, and assert that the inserted entry has ID `level-150-300`.

- [ ] **Step 6: Run RED for the new level**

Run: `npm test -- --run src/domain/structure.test.ts`

Expected: exact structure/count/ID assertions fail because the new level is absent.

- [ ] **Step 7: Insert the stable default level**

Add this entry after `level-13` without changing any existing ID:

```ts
{ id: 'level-150-300', kind: 'level', durationSeconds: 900, smallBlind: 150, bigBlind: 300, ante: 300, anteType: 'big-blind' },
```

- [ ] **Step 8: Run focused GREEN and commit**

Run: `npm test -- --run src/domain/breakPresentation.test.ts src/domain/structure.test.ts src/persistence/presets.test.ts src/state/reducer.test.ts`

Expected: all focused tests pass.

Commit: `feat: extend default tournament structure`

### Task 2: Active-break-only procedure placement

**Files:**
- Create: `src/features/display/BreakProcedure.tsx`
- Modify: `src/features/display/CurrentLevel.tsx`
- Modify: `src/features/display/BlindStructure.tsx`
- Modify: `src/features/display/TournamentDisplay.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/features/info/InfoStructure.tsx`
- Modify: `src/features/info/InfoOverlay.test.tsx`
- Modify: `src/app/App.integration.test.tsx`

**Interfaces:**
- Consumes: `breakPresentation(entry)` and the current `StructureEntry` selected by `TournamentDisplay`.
- Produces: `BreakProcedure({ entry }: { entry: StructureEntry }): JSX.Element | null`.
- Schedule renderers consume only `heading` and `accessibleLabel`; `BreakProcedure` alone consumes `subtitle`.

- [ ] **Step 1: Write failing display tests**

For an active first break, assert:

```ts
const currentBreak = screen.getByRole('region', { name: 'Current break' })
expect(currentBreak).toHaveTextContent('BREAK')
expect(currentBreak).not.toHaveTextContent('Count and stack white chips')
const procedure = screen.getByRole('status', { name: 'Break procedure' })
expect(procedure).toHaveTextContent('Count and stack white chips in stacks of 10')
expect(procedure.compareDocumentPosition(screen.getByLabelText('Tournament statistics')) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
```

Also assert that poker levels have no `Break procedure`, the second break shows the red-chip instruction, and each schedule break button is named only `Break, 10 min` and contains only `BREAK — 10 MIN`.

- [ ] **Step 2: Write failing Info/integration tests**

Update Info expectations to 20 rows, preserve the 11/9 column distribution, update the final index/level number to Level 18, and require both break rows to show only `BREAK — 10 MIN`. Update the app integration schedule-button accessible name to `Break, 10 min`.

- [ ] **Step 3: Run UI RED**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx src/features/info/InfoOverlay.test.tsx src/app/App.integration.test.tsx`

Expected: failures identify the hero instruction, instruction-bearing schedule rows/names, old punctuation, missing procedure region, and old 19-row counts.

- [ ] **Step 4: Implement the focused procedure component**

Create `BreakProcedure.tsx`:

```tsx
export function BreakProcedure({ entry }: { entry: StructureEntry }) {
  if (entry.kind !== 'break') return null
  const { subtitle } = breakPresentation(entry)
  if (!subtitle) return null
  return (
    <aside className="break-procedure" role="status" aria-label="Break procedure">
      <span>Break procedure</span>
      <strong>{subtitle}</strong>
    </aside>
  )
}
```

- [ ] **Step 5: Wire the display and remove duplicate copy**

- Remove the subtitle paragraph and unused presentation import from `CurrentLevel`.
- Render `<BreakProcedure entry={currentEntry} />` immediately after `<PlayerStats>`.
- Remove the schedule `<small>` from `BlindStructure`.
- Use `presentation.heading` and `presentation.accessibleLabel` in both schedule renderers.

- [ ] **Step 6: Run UI GREEN**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx src/features/info/InfoOverlay.test.tsx src/app/App.integration.test.tsx`

Expected: all focused UI tests pass.

- [ ] **Step 7: Mutation-check the placement contract**

Temporarily restore the hero subtitle or schedule subtitle and rerun the relevant focused test. Confirm it fails for the intended duplicate/exposure assertion; restore the implementation and rerun GREEN.

- [ ] **Step 8: Commit**

Commit: `feat: show procedures only during active breaks`

### Task 3: Professional public-surface geometry

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/display.css`
- Modify: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Produces CSS tokens `--radius-compact: .25rem`, `--radius-control: .375rem`, and `--radius-card: .5rem`.
- No component API changes.

- [ ] **Step 1: Write failing CSS contract tests**

Use the existing raw-CSS helper to require:

```ts
expect(cssRule(tokensCss, ':root')).toMatch(/--radius-control:\s*\.375rem/)
expect(cssRule(displayCss, '.stats-grid')).toMatch(/border-radius:\s*var\(--radius-card\)/)
expect(cssRule(displayCss, '.stats-grid')).toMatch(/overflow:\s*hidden/)
expect(cssRule(displayCss, '.break-procedure')).toMatch(/border-radius:\s*var\(--radius-card\)/)
expect(cssRule(displayCss, '.player-stepper')).toMatch(/border-radius:\s*var\(--radius-control\)/)
expect(cssRule(displayCss, '.player-stepper')).toMatch(/overflow:\s*hidden/)
```

Also require shared main controls to use `var(--radius-control)` and schedule/current elements to use `var(--radius-compact)`.

- [ ] **Step 2: Run CSS RED**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx src/features/display/PlayerCountControl.test.tsx`

Expected: radius, overflow, and break-procedure style contracts fail against the old ~2px/square treatment.

- [ ] **Step 3: Add the restrained radius tokens**

Add to `:root`:

```css
--radius-compact: .25rem;
--radius-control: .375rem;
--radius-card: .5rem;
```

- [ ] **Step 4: Polish statistics and active procedure**

- Give `.stats-grid` an 8px radius, `overflow: hidden`, a softer border, and a two-layer shadow.
- Increase stat-card internal horizontal padding while keeping the existing two-column hierarchy.
- Add `.break-procedure` as a compact full-width two-column notice beneath stats, with an orange left accent, 8px radius, readable procedure label, and a single-line desktop instruction that wraps safely on narrow screens.
- Remove obsolete `.current-level-note--break` and `.structure-break-copy small` styles.

- [ ] **Step 5: Polish controls and compact surfaces**

- Apply 6px corners to `.control-button`, `.icon-button`, `.director-button`, and `.player-stepper`.
- Keep child stepper buttons square internally but clip them inside the rounded parent.
- Improve stepper center padding and label/value spacing without changing its editing behavior.
- Apply 4px corners to `.status-pill`, `.structure-count`, `.structure-row-button`, `.level-index`, `.live-marker`, and current/hover schedule containment.
- Preserve minimum control heights and focus-visible outlines.

- [ ] **Step 6: Add responsive procedure rules**

At the existing mobile breakpoint, stack the procedure label and message only when necessary, and confirm it introduces no page overflow.

- [ ] **Step 7: Run focused GREEN and mutation check**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx src/features/display/PlayerCountControl.test.tsx`

Then temporarily remove `.stats-grid { overflow: hidden; }`, confirm the CSS contract fails, restore it, and rerun GREEN.

- [ ] **Step 8: Run implementation gate and commit**

Run:

```bash
npm test -- --run
npm run typecheck
npm run lint
git diff --check
```

Expected: all commands exit 0.

Commit: `style: refine public tournament surfaces`

### Task 4: Projector QA, review, and test-preview handoff

**Files:**
- Modify tests or CSS only if browser evidence exposes a real regression.

**Interfaces:**
- Produces a verified production build and a user-facing preview URL.

- [ ] **Step 1: Build production/PWA assets**

Run: `npm run build`

Expected: Vite exits 0 and emits non-empty `dist/manifest.webmanifest`, `dist/sw.js`, and `dist/workbox-*.js`.

- [ ] **Step 2: Start a production preview from the feature worktree**

Run: `npm run preview -- --host 127.0.0.1 --port 4186`

Keep the session running for browser QA.

- [ ] **Step 3: Verify the 1366×768 projector layout in the in-app Browser**

Measure and visually inspect:

- document width/height equals the viewport;
- 20 schedule rows exist and both break rows contain only `BREAK — 10 MIN`;
- Level 14 is `150 / 300 / 300` and the final poker level is Level 18;
- stat cards and controls expose the approved computed radii;
- no visible text or control escapes its container;
- console warnings/errors are zero.

- [ ] **Step 4: Verify both active breaks**

Click the first and second break schedule rows. For each, confirm the hero says only `BREAK`, the procedure is beneath the stats, the correct white/red instruction is visible exactly once, timer remains present, and the schedule row stays instruction-free.

- [ ] **Step 5: Verify a narrow layout**

At 390×844, confirm no horizontal page overflow, stats and procedure wrap cleanly, all public controls remain at least 44px, and the schedule remains usable.

- [ ] **Step 6: Request independent code review**

Use `superpowers:requesting-code-review` with the base design commit and feature HEAD. Fix every valid Critical or Important finding test-first, then repeat the relevant gate.

- [ ] **Step 7: Run the fresh final release gate**

Run:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
test -s dist/manifest.webmanifest
test -s dist/sw.js
find dist -maxdepth 1 -name 'workbox-*.js' -type f -size +0c | grep -q .
git diff --check
git status --short
```

Expected: 0 test failures, all commands exit 0, PWA assets exist, and the tracked worktree is clean after the final commit.

- [ ] **Step 8: Integrate and refresh the user preview**

Fast-forward `master` to the reviewed feature branch, rebuild from main, restart the user-facing production preview on `127.0.0.1:4185`, open/keep it as the deliverable in-app Browser tab, and report the URL plus verification summary.
