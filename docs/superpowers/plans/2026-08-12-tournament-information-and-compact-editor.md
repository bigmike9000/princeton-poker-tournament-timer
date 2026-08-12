# Tournament Information Overlay and Compact Structure Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make blind-structure editing dense and fast, add a public tournament-information overlay, and display the supplied Jane Street and Susquehanna sponsor logos.

**Architecture:** Add an optional, strictly parsed `TournamentInformation` block with pure default/normalization helpers and an atomic reducer action. Build the public Info surface as a focused modal whose lifecycle mirrors the reviewed Director overlay, and extract sponsor rendering into a local-asset component. Recompose Structure rows into a responsive grid without changing their draft, validation, or apply semantics.

**Tech Stack:** React 19, TypeScript, Vite PWA, Vitest, Testing Library, CSS, local PNG assets

## Global Constraints

- Existing customized, progressed, and legacy saved tournaments must never be overwritten.
- The timer continues running while Info is open; opening/closing Info changes no tournament state.
- Info and Director are mutually exclusive modal surfaces with background `inert`, focus trap, Escape, post-inert focus restoration, and StrictMode-safe cleanup.
- Prize defaults make no payout promise: `Prize structure will be announced by the Tournament Director before play begins.`
- General rules are local paraphrased guidance; `PPC house rules and Tournament Director decisions govern this event.`
- Sponsor images are bundled locally. No new runtime dependency, remote asset, backend, account, or network requirement is allowed.
- Unknown/custom sponsor names remain visible as text and are never replaced with an unrelated logo.
- Structure rows remain fully editable, validated, reorderable, deletable, keyboard-accessible, and at least 44 px high for direct controls.
- The public clock must retain timer accuracy, alerts, shortcuts, fullscreen, persistence, offline PWA behavior, and the true untimed terminal level.

---

### Task 1: Tournament information domain, reducer, persistence, and Director editor

**Files:**
- Create: `src/domain/tournamentInformation.ts`
- Create: `src/domain/tournamentInformation.test.ts`
- Create: `src/features/director/TournamentInformationEditor.tsx`
- Create: `src/features/director/TournamentInformationEditor.test.tsx`
- Modify: `src/domain/types.ts`
- Modify: `src/domain/sampleStructure.ts`
- Modify: `src/state/reducer.ts`
- Modify: `src/state/reducer.test.ts`
- Modify: `src/persistence/snapshot.ts`
- Modify: `src/persistence/snapshot.test.ts`
- Modify: `src/features/director/TournamentSettings.tsx`
- Modify: `src/styles/director.css`

**Interfaces:**
- Produces `TournamentInformation`, `DEFAULT_TOURNAMENT_INFORMATION`, `TOURNAMENT_RULE_SUMMARY`, `selectTournamentInformation(state)`, and `normalizeInformationLines(value)`.
- Produces reducer action `{ type: 'SET_INFORMATION'; information: TournamentInformation }`.
- Produces `<TournamentInformationEditor />` inside Director → Tournament.

- [ ] **Step 1: Write failing domain behavior tests**

Create tests with hand-authored expectations:

```ts
describe('tournament information', () => {
  it('ships the exact safe PPC information defaults', () => {
    const state = createInitialState()
    expect(selectTournamentInformation(state)).toEqual({
      chipLines: [
        '10 × 1-value chips',
        '8 × 5-value chips',
        '6 × 25-value chips',
        'Starting stack: 200 chips',
      ],
      prizeLines: [
        'Prize structure will be announced by the Tournament Director before play begins.',
      ],
      houseNotes: [
        'Big-blind ante begins at 10/20.',
        'Chip-ups occur during the scheduled breaks shown in the structure.',
      ],
    })
  })

  it('uses defaults for older state without an information block', () => {
    const state = createInitialState()
    delete state.information
    expect(selectTournamentInformation(state)).toEqual(DEFAULT_TOURNAMENT_INFORMATION)
  })

  it('normalizes newline input without persisting blank lines', () => {
    expect(normalizeInformationLines('  First line\n\nSecond line  ')).toEqual(['First line', 'Second line'])
  })
})
```

- [ ] **Step 2: Run the domain test and verify RED**

Run `npm test -- --run src/domain/tournamentInformation.test.ts`.

Expected: FAIL because the types/helpers/defaults do not exist.

- [ ] **Step 3: Add the optional information model and pure helpers**

Add:

```ts
export interface TournamentInformation {
  chipLines: string[]
  prizeLines: string[]
  houseNotes: string[]
}

export interface TournamentState {
  configuration: TournamentConfiguration
  structure: StructureEntry[]
  runtime: TournamentRuntime
  chipLedger: ChipContribution[]
  settings: TournamentSettings
  information?: TournamentInformation
}
```

`DEFAULT_TOURNAMENT_INFORMATION` uses the exact strings from Step 1 and is deeply readonly at the module boundary. `selectTournamentInformation` returns a fresh mutable clone so components cannot mutate the constant. `normalizeInformationLines` splits on newlines, trims each line, removes blank lines, caps output at 24 lines, and truncates each line to 160 characters.

Add eight concise paraphrased strings to `TOURNAMENT_RULE_SUMMARY` covering floor fairness, clear/in-turn action, one player to a hand, visible chips, live-hand device restrictions, all-in showdown, binding declarations, and clock calls.

- [ ] **Step 4: Add default information and atomic reducer tests**

Set `createInitialState().information` to the default clone. Add reducer coverage:

```ts
it('updates tournament information atomically', () => {
  const state = createInitialState()
  const information = {
    chipLines: ['1, 5, and 25-value chips'],
    prizeLines: ['1st — Trophy'],
    houseNotes: ['No late registration.'],
  }
  const result = tournamentReducer(state, { type: 'SET_INFORMATION', information })
  expect(result.information).toEqual(information)
  expect(result.structure).toEqual(state.structure)
  expect(result.runtime).toEqual(state.runtime)
})
```

- [ ] **Step 5: Run the reducer test and verify RED**

Run `npm test -- --run src/state/reducer.test.ts`.

Expected: FAIL because `SET_INFORMATION` is not a valid action.

- [ ] **Step 6: Implement `SET_INFORMATION`**

Extend `TournamentAction` and return a state copy with only `information` replaced by a structured clone. Do not normalize in the reducer; the Director editor owns text normalization and persistence parsing owns validation.

- [ ] **Step 7: Write failing snapshot compatibility and validation tests**

Cover:

```ts
it('loads an older valid snapshot without information', () => {
  const state = createInitialState()
  delete state.information
  saveRawSnapshot(storage, state)
  const result = loadSnapshot(storage, 1_000)
  expect(result.recovered).toBe(false)
  expect(selectTournamentInformation(result.state)).toEqual(DEFAULT_TOURNAMENT_INFORMATION)
})

it('round-trips configured tournament information', () => {
  const state = createInitialState()
  state.information = { chipLines: ['A'], prizeLines: ['B'], houseNotes: ['C'] }
  saveSnapshot(storage, state, 1_000)
  expect(loadSnapshot(storage, 1_000).state.information).toEqual(state.information)
})

it.each([
  { chipLines: [7], prizeLines: ['B'], houseNotes: ['C'] },
  { chipLines: ['A'], prizeLines: 'B', houseNotes: ['C'] },
  { chipLines: ['x'.repeat(161)], prizeLines: ['B'], houseNotes: ['C'] },
])('recovers safely from malformed information %#', (information) => {
  const state = createInitialState()
  const rawState = { ...state, information }
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ version: 1, savedAt: 1_000, state: rawState }))
  const result = loadSnapshot(localStorage, 1_000)
  expect(result.recovered).toBe(true)
  expect(result.state.runtime.currentEntryIndex).toBe(0)
})
```

- [ ] **Step 8: Run snapshot tests and verify RED**

Run `npm test -- --run src/persistence/snapshot.test.ts`.

Expected: malformed information is accepted or missing parsing behavior fails.

- [ ] **Step 9: Parse optional information strictly**

In `snapshot.ts`, accept absence. If present, require a record with exactly the three arrays; every item is a nonempty string of at most 160 characters and every array has at most 24 entries. Preserve the optional absence so exact historical-state matching is not broadened. `selectTournamentInformation` supplies display defaults.

- [ ] **Step 10: Write failing Director information editor tests**

Use a real Provider harness. Assert the three textareas are labeled `Chip denominations and starting stack`, `Prize structure`, and `House notes`; the default prize copy is visible; blank lines are removed when Save is clicked; and an entirely blank field restores its corresponding safe default.

- [ ] **Step 11: Run the editor tests and verify RED**

Run `npm test -- --run src/features/director/TournamentInformationEditor.test.tsx`.

Expected: FAIL because the editor does not exist.

- [ ] **Step 12: Implement the Director editor**

Create one focused card with three labeled textareas initialized from `selectTournamentInformation(state)`. Save builds each array using `normalizeInformationLines`; replace an empty result with the matching default array; dispatch one `SET_INFORMATION` action. Render it below the existing configuration form in `TournamentSettings` with heading `Public tournament information` and copy `Shown in the Info overlay on the tournament clock.` Textareas use at least 5 rows, 160-character line guidance, and existing premium form styles.

- [ ] **Step 13: Run Task 1 checks and commit**

Run:

```bash
npm test -- --run src/domain/tournamentInformation.test.ts src/state/reducer.test.ts src/persistence/snapshot.test.ts src/features/director/TournamentInformationEditor.test.tsx src/features/director/DirectorOverlay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit: `feat: add editable tournament information`

### Task 2: Supplied sponsor assets and responsive sponsor strip

**Files:**
- Create: `src/features/display/SponsorStrip.tsx`
- Create: `src/features/display/SponsorStrip.test.tsx`
- Create binary: `public/branding/jane-street.png`
- Create binary: `public/branding/susquehanna.png`
- Modify: `src/features/display/TournamentDisplay.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/features/director/TournamentSettings.tsx`
- Modify: `src/domain/sampleStructure.ts`
- Modify: `src/domain/structure.test.ts`
- Modify: `src/styles/display.css`

**Interfaces:**
- Produces `<SponsorStrip labels: string[] />`.
- Uses local URLs `/branding/jane-street.png` and `/branding/susquehanna.png`.

- [ ] **Step 1: Write failing sponsor rendering tests**

Assert:

```ts
it('renders the two supplied canonical sponsor marks', () => {
  render(<SponsorStrip labels={['Jane Street', 'Susquehanna']} />)
  expect(screen.getByRole('img', { name: 'Jane Street' })).toHaveAttribute('src', '/branding/jane-street.png')
  expect(screen.getByRole('img', { name: 'Susquehanna' })).toHaveAttribute('src', '/branding/susquehanna.png')
})

it('maps the two exact legacy placeholders by slot', () => {
  render(<SponsorStrip labels={['SPONSOR', 'SPONSOR']} />)
  expect(screen.getAllByRole('img')).toHaveLength(2)
})

it('keeps custom sponsors as text', () => {
  render(<SponsorStrip labels={['Princeton Alumni', 'Local Partner']} />)
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(screen.getByText('Princeton Alumni')).toBeVisible()
})
```

- [ ] **Step 2: Run sponsor tests and verify RED**

Run `npm test -- --run src/features/display/SponsorStrip.test.tsx`.

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Optimize and bundle the supplied PNGs**

Use the source files:

```text
/Users/michaelfang/Downloads/JS logo (1).png
/Users/michaelfang/Downloads/SIG logo (1).png
```

Copy Susquehanna without upscaling. Downscale Jane Street to at most 900 px wide using `sips --resampleWidth 900` into a temporary PNG, then place it at the exact public path. Verify both with `file` and `sips -g pixelWidth -g pixelHeight -g hasAlpha`.

- [ ] **Step 4: Implement `SponsorStrip` and new defaults**

Map case-insensitive trimmed `Jane Street` and `Susquehanna` labels to image marks. Map only exact `SPONSOR` placeholders by index zero/one for saved-state compatibility. Unknown labels render `<strong className="sponsor-text-mark">`. Set new initial state labels to `Jane Street` and `Susquehanna`; update the exact default test. Rename Director fields to `Sponsor display name one/two` and remove “neutral placeholder” wording.

- [ ] **Step 5: Replace the inline public footer and style it**

Use `<SponsorStrip labels={state.configuration.sponsorLabels} />` in `TournamentDisplay`. Jane Street receives `.sponsor-logo-card--jane-street` with an ivory plaque; Susquehanna stays transparent. Constrain both to 7.5rem wide and 2rem high on desktop, smaller at mobile, preserve aspect ratio, and keep the footer from growing the stage.

- [ ] **Step 6: Run Task 2 checks and commit**

Run:

```bash
npm test -- --run src/features/display/SponsorStrip.test.tsx src/features/display/TournamentDisplay.test.tsx src/domain/structure.test.ts src/features/director/DirectorOverlay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit: `feat: add PPC sponsor marks`

### Task 3: Public tournament Info overlay and control

**Files:**
- Create: `src/features/info/InfoOverlay.tsx`
- Create: `src/features/info/InfoOverlay.test.tsx`
- Create: `src/features/info/InfoStructure.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.integration.test.tsx`
- Modify: `src/features/display/TournamentDisplay.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/features/display/DisplayControls.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Produces `<InfoOverlay open onClose onAfterClose />` and read-only `<InfoStructure state />`.
- Extends `TournamentDisplayProps`/`DisplayControlsProps` with `onOpenInfo: () => void`.
- Consumes `selectTournamentInformation`, `TOURNAMENT_RULE_SUMMARY`, `durationLabel`, and current `TournamentState`.

- [ ] **Step 1: Write failing public control integration test**

Update the display harness to provide `onOpenInfo`. Assert the utility buttons appear in this DOM order:

```ts
const controls = within(screen.getByRole('navigation', { name: 'Tournament controls' }))
const info = controls.getByRole('button', { name: 'Open tournament information' })
const fullscreen = controls.getByRole('button', { name: 'Enter fullscreen' })
expect(info.compareDocumentPosition(fullscreen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
```

Clicking Info must call the callback once.

- [ ] **Step 2: Run the display test and verify RED**

Run `npm test -- --run src/features/display/TournamentDisplay.test.tsx`.

Expected: FAIL because no Info control exists.

- [ ] **Step 3: Thread the Info callback to the bottom rail**

Add a button with class `icon-button info-button`, accessible name `Open tournament information`, and visible label `Info`. Place it immediately before Full Screen. Do not dispatch tournament state.

- [ ] **Step 4: Write failing overlay content and lifecycle tests**

Render the App with real Provider/storage and assert:

- opening Info creates `dialog` named `Tournament information`;
- initial focus is `Close tournament information`;
- background `.tournament-shell` is inert;
- chip default, safe prize copy, all 19 structure entries, `Until end`, house notes, built-in rules, TDA reference link, and governing disclaimer are visible;
- the current entry has `aria-current="step"`;
- Tab/Shift+Tab wrap; Escape closes;
- after close the background is not inert and the Info button has focus;
- opening Info does not change runtime status/index/remaining time except normal elapsed countdown;
- StrictMode effect rehearsal does not call `onAfterClose` before an actual close.

- [ ] **Step 5: Run overlay tests and verify RED**

Run `npm test -- --run src/features/info/InfoOverlay.test.tsx src/app/App.integration.test.tsx`.

Expected: FAIL because the overlay and App state do not exist.

- [ ] **Step 6: Implement read-only `InfoStructure`**

Render a semantic ordered list. Poker rows show `Level N`, formatted blinds, ante/NO ANTE, `durationLabel`, and optional note. Breaks show configured label and duration. The current list item uses `aria-current="step"`, a `data-state="current"` hook, and a ref/effect that calls `scrollIntoView({ block: 'nearest' })` when the overlay opens/current changes.

- [ ] **Step 7: Implement `InfoOverlay` with the reviewed modal lifecycle**

Mirror the proven Director lifecycle:

- modal root is fixed and `role="dialog" aria-modal="true" aria-labelledby`;
- on mount, set `.tournament-shell.inert = true`, focus Close, and attach Escape/Tab handlers;
- on cleanup after an actual close request, remove inert before `onAfterClose`;
- guard StrictMode rehearsal with a close-request ref;
- prevent click propagation from the dialog panel and close on backdrop click;
- never dispatch or pause the tournament.

Use a two-column desktop grid: chips/prizes cards, full-width structure, full-width rules. At mobile use one column. The rules source is a normal external `<a href="https://www.pokertda.com/view-poker-tda-rules/" target="_blank" rel="noreferrer">2024 Poker TDA rules</a>`; all meaningful summary content is bundled locally.

- [ ] **Step 8: Coordinate App modal state and focus restoration**

Add `infoOpen` and an Info trigger ref. `openInfo` records the active element and opens Info only when Director is closed. Mount Info only while open, just as Director is mounted only while open. Closing uses the overlay cleanup callback to restore trigger focus after inert removal. Confirm the two overlays cannot coexist.

- [ ] **Step 9: Style the overlay and verify no public layout regression**

Add `.info-overlay`, `.info-panel`, `.info-grid`, `.info-card`, `.info-structure`, `.info-rules`, and focused current-row styles. Use the premium black/ivory/copper system. The panel owns vertical scrolling; the document and clock stage do not. Every button/link target is at least 44 px.

- [ ] **Step 10: Run Task 3 checks and commit**

Run:

```bash
npm test -- --run src/features/info/InfoOverlay.test.tsx src/features/display/TournamentDisplay.test.tsx src/app/App.integration.test.tsx src/services/shortcuts.test.ts
npm run typecheck
npm run lint
git diff --check
```

Commit: `feat: add tournament information overlay`

### Task 4: Compact responsive Structure editor rows

**Files:**
- Modify: `src/features/director/StructureEditor.tsx`
- Modify: `src/features/director/StructureEditor.test.tsx`
- Modify: `src/features/director/StructureRow.tsx`
- Modify: `src/styles/director.css`

**Interfaces:**
- Preserves the existing `StructureRowProps` interface and all draft/apply behavior.
- Produces CSS hooks `.structure-editor-columns`, `.structure-cell`, `.structure-cell-label`, and compact level/break grid variants.

- [ ] **Step 1: Add failing markup/behavior assertions**

Extend `StructureEditor.test.tsx` to assert:

- desktop column heading text `Level`, `Duration`, `Small`, `Big`, `Ante`, `Type`, `Note`, `Actions` exists once;
- every poker field remains editable and applying changes updates the live structure;
- break label/duration remain editable;
- `Until end`, validation, move, and delete behavior remain covered;
- no input loses its accessible label after visible labels become responsive-only.

- [ ] **Step 2: Run Structure tests and verify RED**

Run `npm test -- --run src/features/director/StructureEditor.test.tsx`.

Expected: column heading assertion fails.

- [ ] **Step 3: Add the shared desktop column header**

Insert an `aria-hidden="true"` `.structure-editor-columns` immediately before the list with the eight exact labels. Screen readers continue to use fieldset legends and form-control accessible names rather than the visual header.

- [ ] **Step 4: Recompose `StructureRow` without changing data flow**

Keep the fieldset/legend. Wrap each control in `.structure-cell` with `.structure-cell-label`; retain existing `aria-label` values. Move row actions into a normal final grid cell rather than absolutely positioning them. Duration contains the numeric input and a compact `Until end` label. A break spans appropriate columns and leaves unused columns absent rather than disabled.

- [ ] **Step 5: Replace large-card CSS with compact row grids**

Desktop poker grid:

```css
grid-template-columns: 5.25rem 5.75rem 4.75rem 4.75rem 4.75rem 7.5rem minmax(10rem, 1fr) 8.7rem;
```

Use `.structure-editor-row { display:grid; min-height:3.75rem; padding:.45rem .55rem; }`, compact 44 px inputs/actions, a narrow legend identity cell, and zero external absolute controls. Hide `.structure-cell-label` at desktop, show it below 1000 px. At 1000 px use a two-row grid; below 620 px use two columns with note/actions full-width. Break rows target one line desktop. Validation messages expand their cell only.

- [ ] **Step 6: Run focused and full Director checks and commit**

Run:

```bash
npm test -- --run src/features/director/StructureEditor.test.tsx src/features/director/DirectorOverlay.test.tsx src/features/director/ResetControls.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit: `feat: compact structure editing rows`

### Task 5: Full regression, production build, responsive QA, and feature assessment

**Files:**
- Modify only if verification exposes a defect.

**Interfaces:**
- Consumes completed Tasks 1–4.
- Produces an integration-ready branch and user-facing feature-gap report.

- [ ] **Step 1: Run the exact automated gate**

```bash
git diff --check
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

Expected: zero failures/errors; generated manifest and service worker.

- [ ] **Step 2: Inspect production artifacts**

Confirm the PPC logo, both sponsor PNGs, three PWA icons, manifest, service worker, and Workbox file exist. Manifest theme/background remains `#070705` with three icons.

- [ ] **Step 3: Browser QA at 1920×1080**

Verify compact Structure level rows are approximately 56–64 px without validation messages, all 19 rows scan cleanly, sponsor marks are crisp/aligned, Info sits before Full Screen, overlay content is balanced, current blind is highlighted, and no dock/content overlap or horizontal overflow exists.

- [ ] **Step 4: Browser QA at 1366×768**

Verify Structure rows use the intended concise wrapped layout, the Director content scrolls vertically without horizontal page overflow, the Info panel owns its scroll, sponsor logos do not crowd the clock, and the schedule/rules remain legible.

- [ ] **Step 5: Browser QA at 390×844**

Verify one-column Info layout, overlay focus trap/Escape/return focus, intentional internal scrolling, no document overflow, compact two-column Structure rows, editable textareas, and every operated target at least 44 px.

- [ ] **Step 6: Verify live-clock isolation and persistence**

Start a timed level, open Info, wait past a visible second boundary, close, and confirm the clock continued accurately. Edit prize/house text, reload, and confirm persistence. Load an older snapshot fixture with no information and confirm default overlay content. Confirm Level 17 displays `Until end` in Info.

- [ ] **Step 7: Request final whole-branch review**

Review against `docs/superpowers/specs/2026-08-12-tournament-information-and-compact-editor-design.md`. Fix every Critical/Important finding, perform one scoped re-review, and rerun the exact final gate on final HEAD.

- [ ] **Step 8: Report remaining professional-clock feature gaps**

The handoff should distinguish clock features already present from tournament-management features not yet built. Cite primary/current product and rules sources. Rank the next PPC phases:

1. randomized seating, table balancing, and redraws;
2. registration, buy-ins/re-entries/add-ons, prize-pool and payout calculation;
3. hand-for-hand/bubble mode;
4. synchronized remote control and multi-screen/player views;
5. player identities, elimination order, results, and league standings;
6. optional action clock/shot clock and announcements.

Do not implement those out-of-scope systems in this plan.
