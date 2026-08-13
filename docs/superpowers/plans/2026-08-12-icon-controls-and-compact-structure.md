# Icon Controls and Compact Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace four text-heavy public utility controls with crisp accessible icons and compact Tournament Info level rows into SB/BB/Ante notation.

**Architecture:** Add a small presentation-only `ControlIcon` component that owns the six required inline SVG variants while `DisplayControls` retains every callback and accessible name. Keep Info notation pure inside `InfoStructure`: derive one visual numeric string and a separate explicit accessible description from each saved poker level, with a single notation key in the page heading.

**Tech Stack:** React 19, TypeScript 6, inline SVG, CSS, Vitest, Testing Library, Vite/PWA.

## Global Constraints

- Do not add a runtime package, network asset, font icon, or image dependency.
- Info, fullscreen, alerts, and Tournament Director remain in their existing order and retain existing accessible names and actions.
- Each public utility button remains at least 44 by 44 CSS pixels.
- No-ante Info levels show two numbers; ante levels show three numbers under one `SB / BB / ANTE` key.
- Visible Info rows do not contain `NO ANTE`, `BBA`, or `ANTE`; accessible row names remain explicit.
- Break copy, the 11/8 Info split, main-clock structure copy, timer state, persistence, presets, and saved structures remain unchanged.

---

### Task 1: Public utility icon controls

**Files:**
- Create: `src/features/display/ControlIcon.tsx`
- Modify: `src/features/display/DisplayControls.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Produces: `type ControlIconName = 'info' | 'fullscreen-enter' | 'fullscreen-exit' | 'sound-on' | 'sound-off' | 'settings'` and `ControlIcon({ name }: { name: ControlIconName }): JSX.Element`.
- Preserves: `DisplayControlsProps`, utility button order, callback behavior, ARIA labels, `aria-pressed`, and the Info trigger element passed to `onOpenInfo`.

- [ ] **Step 1: Write the failing utility-control tests**

Add real `TournamentDisplay` assertions that:

```tsx
const utility = container.querySelector('.control-group--utility') as HTMLElement
const buttons = within(utility).getAllByRole('button')
expect(buttons).toHaveLength(4)
expect(within(utility).queryByText(/Info|Full screen|Exit screen|Sound on|Sound off|TD Controls/)).not.toBeInTheDocument()
expect(within(utility).getByRole('button', { name: 'Open tournament information' }).querySelector('.control-icon--info')).not.toBeNull()
expect(within(utility).getByRole('button', { name: 'Enter fullscreen' }).querySelector('.control-icon--fullscreen-enter')).not.toBeNull()
expect(within(utility).getByRole('button', { name: 'Mute alerts' }).querySelector('.control-icon--sound-on')).not.toBeNull()
expect(within(utility).getByRole('button', { name: 'Open Tournament Director' }).querySelector('.control-icon--settings')).not.toBeNull()
```

Render a fullscreen display and click the sound control to require `.control-icon--fullscreen-exit` and `.control-icon--sound-off` while preserving the corresponding accessible names.

Add CSS behavior assertions requiring `.utility-icon-button` to have equal `width`/`height` of at least `2.75rem`, zero inline padding, and `.control-icon` to have bounded width/height.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --run src/features/display/TournamentDisplay.test.tsx
```

Expected: FAIL only because text labels and icon hooks still use the old controls.

- [ ] **Step 3: Implement the SVG icon component and icon-only buttons**

Create `ControlIcon.tsx` with one `aria-hidden="true"`, `focusable="false"`, `viewBox="0 0 24 24"` SVG. Use `fill="none"`, `stroke="currentColor"`, round caps/joins, and variant-specific paths:

- `info`: circle plus vertical stem and dot.
- `fullscreen-enter`: four outward corner strokes.
- `fullscreen-exit`: four inward corner strokes.
- `sound-on`: speaker polygon plus two wave paths.
- `sound-off`: speaker polygon plus a diagonal cross stroke.
- `settings`: gear outline plus center circle.

Update the four utility buttons to:

```tsx
<button className="icon-button utility-icon-button" aria-label="...">
  <ControlIcon name="..." />
</button>
```

Keep the Info-specific `info-button` class if existing focus-restoration or tests consume it. Apply `utility-icon-button--active` to the muted state without changing `aria-pressed`.

- [ ] **Step 4: Run focused GREEN and mutation checks**

Run the focused test. Then temporarily restore one legacy text label and temporarily map muted audio to `sound-on`; confirm each mutation fails the exact new tests independently, restore, and rerun GREEN.

- [ ] **Step 5: Verify and commit Task 1**

Run:

```bash
npm test -- --run src/features/display/TournamentDisplay.test.tsx src/features/info/InfoOverlay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit:

```bash
git add src/features/display/ControlIcon.tsx src/features/display/DisplayControls.tsx src/features/display/TournamentDisplay.test.tsx src/styles/display.css
git commit -m "style: replace public utility labels with icons"
```

---

### Task 2: Compact Tournament Info level notation

**Files:**
- Modify: `src/features/info/InfoOverlay.tsx`
- Modify: `src/features/info/InfoStructure.tsx`
- Modify: `src/features/info/InfoOverlay.test.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Produces internally: `visualLevel(entry: PokerLevel): string` and `accessibleAnte(entry: PokerLevel): string`.
- Visual examples: no ante `1 / 2`; big-blind ante `10 / 20 / 20`; traditional ante `10 / 20 / 5`.
- Accessible example: `Level 6, small blind 10, big blind 20, big-blind ante 20, 15 min`.

- [ ] **Step 1: Write failing notation tests**

In the real Info overlay, switch to Blind structure and assert:

```tsx
expect(overlay.getByText('SB / BB / ANTE')).toBeVisible()
expect(overlay.getByRole('listitem', {
  name: 'Level 1, small blind 1, big blind 2, no ante, 12 min',
})).toHaveTextContent('1 / 2')
expect(overlay.getByRole('listitem', {
  name: 'Level 6, small blind 10, big blind 20, big-blind ante 20, 15 min',
})).toHaveTextContent('10 / 20 / 20')
expect(overlay.getByRole('tabpanel')).not.toHaveTextContent(/NO ANTE|BBA|ANTE \d/i)
```

Save a structure containing a traditional ante and require its visible `2 / 5 / 1` plus explicit accessible name. Retain existing assertions for 19 entries, `data-column` 11/8, Level 10 at the end of column one, right-column Break, no chip-up copy, and current entry.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- --run src/features/info/InfoOverlay.test.tsx
```

Expected: FAIL because rows still expose separate `NO ANTE`/`BBA` text and no notation key exists.

- [ ] **Step 3: Implement compact visual and explicit accessible formatting**

Add the key to `.info-structure-heading` with an explicit accessible label:

```tsx
<p className="info-structure-key" aria-label="Blind values are shown as small blind, big blind, ante">
  SB / BB / ANTE
</p>
```

In `InfoStructure`, replace `anteLabel()` with:

```ts
function visualLevel(entry: PokerLevel): string {
  return [entry.smallBlind, entry.bigBlind, ...(entry.anteType === 'none' || entry.ante === 0 ? [] : [entry.ante])]
    .map(formatNumber)
    .join(' / ')
}

function accessibleAnte(entry: PokerLevel): string {
  if (entry.anteType === 'none' || entry.ante === 0) return 'no ante'
  return entry.anteType === 'big-blind'
    ? `big-blind ante ${formatNumber(entry.ante)}`
    : `ante ${formatNumber(entry.ante)}`
}
```

Render only the combined value in the numeric `<strong>`. Build the list-item name from explicit small blind, big blind, accessible ante, and duration. Remove `.info-entry-ante` markup.

Simplify the row to one vertical track while preserving the three horizontal regions: level/current marker, numeric values, duration. Style `.info-structure-key` as quiet brass uppercase metadata. Update narrow selectors so metadata remains at or above the current readable floor.

- [ ] **Step 4: Run focused GREEN and mutation checks**

Run the Info test. Temporarily append a zero ante to no-ante visuals and temporarily return the BBA abbreviation from `accessibleAnte`; confirm the exact tests fail independently, restore, and rerun GREEN.

- [ ] **Step 5: Verify and commit Task 2**

Run:

```bash
npm test -- --run src/features/info/InfoOverlay.test.tsx src/features/display/TournamentDisplay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Commit:

```bash
git add src/features/info/InfoOverlay.tsx src/features/info/InfoStructure.tsx src/features/info/InfoOverlay.test.tsx src/styles/display.css
git commit -m "style: compact tournament info blind notation"
```

---

### Task 3: Integrated visual and release verification

**Files:**
- Modify only the Task 1–2 files if browser QA proves a defect.
- Create: `.superpowers/sdd/2026-08-12-icon-controls-and-compact-structure/release-report.md`

**Interfaces:**
- Consumes the completed public control and Info notation contracts.
- Produces release, responsive-browser, accessibility, and review evidence.

- [ ] **Step 1: Run the exact automated gate**

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
git diff --check
```

Verify `dist/manifest.webmanifest`, `dist/sw.js`, and the Workbox runtime are non-empty.

- [ ] **Step 2: Run production browser QA**

At `1920 × 1080` and `1366 × 768`, verify the main document has no overflow, all four icons are visible and distinct, buttons are square and at least 44px, sound/fullscreen states change icons and accessible names, Info opens/restores focus, and console warnings/errors are zero.

At `1366 × 768` and `390 × 844`, verify both Info pages have equal client/scroll dimensions, structure rows show one key plus two/three-value notation, no visible ante words occur inside rows, explicit list-item names remain correct, all 19 entries remain contained, and controls remain at least 44px.

- [ ] **Step 3: Review the complete feature diff**

Review from `e615efc` through feature HEAD against the design and plan. Treat semantic SVG problems, missing focus, ambiguous icon state, loss of accessible ante type, projector overflow, row-count/split drift, or main-display copy changes as blocking. Fix verified issues test-first and repeat affected browser checks.

- [ ] **Step 4: Write evidence and run the final gate**

Record RED/GREEN/mutation evidence, exact test counts, PWA artifacts, browser measurements, console output, and review findings. Run the exact automated gate once more on the reviewed committed tree before invoking the branch-finishing workflow.
