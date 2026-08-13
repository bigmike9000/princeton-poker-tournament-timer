# Tournament Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five clear chip denominations and sponsor marks to Tournament Info, rebalance the Info schedule, align the main PPC lockup, and replace the structure editor’s seven loose fields with a professional five-group table.

**Architecture:** Extract sponsor mark rendering into a shared component, while each surface owns its surrounding semantics and layout. Keep `sampleStructure` as the only default/preset schedule source. Recompose StructureRow into grouped Blinds and Ante units without changing its public callbacks or the domain/persistence format.

**Tech Stack:** React 19, TypeScript 6, CSS, Vitest 4, Testing Library, Vite 8/PWA.

## Global Constraints

- Preserve the established dark ink, ivory, copper, and orange visual language.
- Keep public text readable from an auditorium and every interactive target at least 44 by 44 CSS pixels.
- Do not add scrolling to projector-safe Tournament Info pages.
- Preserve existing saved tournaments, custom presets, level notes, sponsor labels, and configured tournament information.
- Black 100 and purple 500 are color-up denominations, not part of the 200-chip starting allocation.
- Tournament Info break rows display only `BREAK · 10 MIN`; main clock break surfaces keep chip-up descriptions.
- Info’s left structure column contains entries 1–11 through Level 10; the right begins with the second break.
- The main, Info, and Director lockups use logo → small orange uppercase organization → prominent ivory heritage title.
- The editor uses five groups: Level, Minutes, Blinds, Ante, Actions.
- `sampleStructure` remains the exact canonical new/reset/built-in schedule; existing progress is never overwritten merely to reaffirm defaults.

---

## File map

- Create `src/components/SponsorMarks.tsx`: canonical sponsor mapping plus custom text fallback.
- Create `src/components/SponsorMarks.test.tsx`: shared mark behavior independent of either surface.
- Modify `src/features/display/SponsorStrip.tsx`: retain footer semantics while consuming shared marks.
- Modify `src/features/info/ChipDenominations.tsx`: five chip definitions and color-up labels.
- Modify `src/features/info/InfoOverview.tsx`: sponsor block under prizes.
- Modify `src/features/info/InfoStructure.tsx`: 11/8 split and Info-only concise breaks.
- Modify `src/features/director/StructureEditor.tsx`: five headers and table wrapper.
- Modify `src/features/director/StructureRow.tsx`: grouped Blinds/Ante DOM.
- Modify `src/styles/brand.css`: main lockup typography-role correction.
- Modify `src/styles/display.css`: five-chip, Info sponsor, and 11-row schedule layouts.
- Modify `src/styles/director.css`: grouped table/editor polish and responsive geometry.
- Modify colocated tests for observable behavior and CSS contracts.

---

### Task 1: Five-chip Info rack and shared sponsor marks

**Files:**
- Create: `src/components/SponsorMarks.tsx`
- Create: `src/components/SponsorMarks.test.tsx`
- Modify: `src/features/display/SponsorStrip.tsx`
- Modify: `src/features/display/SponsorStrip.test.tsx`
- Modify: `src/features/info/ChipDenominations.tsx`
- Modify: `src/features/info/InfoOverview.tsx`
- Modify: `src/features/info/InfoOverlay.test.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Consumes: `labels: readonly string[]` from `TournamentState.configuration.sponsorLabels`.
- Produces: `SponsorMarks({ labels, className? }: { labels: readonly string[]; className?: string }): JSX.Element`.
- Preserves: canonical placeholder-by-slot mapping for `SPONSOR`, custom-label text fallback, and existing sponsor image paths.

- [ ] **Step 1: Write failing chip and sponsor behavior tests**

In `InfoOverlay.test.tsx`, assert five denomination groups and their independent literal copy:

```tsx
expect(overlay.getByRole('group', { name: '10 white 1-value chips' })).toBeVisible()
expect(overlay.getByRole('group', { name: '8 red 5-value chips' })).toBeVisible()
expect(overlay.getByRole('group', { name: '6 green 25-value chips' })).toBeVisible()
expect(overlay.getByRole('group', { name: 'Black 100-value chip' })).toHaveTextContent('Color-up chip')
expect(overlay.getByRole('group', { name: 'Purple 500-value chip' })).toHaveTextContent('Color-up chip')
```

Assert a `Tournament sponsors` region follows the prize region in document order, contains Jane Street and Susquehanna images, and precedes `Keep chips visible and countable.`. Add shared component tests for canonical image paths, two `SPONSOR` placeholders, and custom text labels.

- [ ] **Step 2: Run focused tests and capture RED**

```bash
npm test -- --run src/components/SponsorMarks.test.tsx src/features/display/SponsorStrip.test.tsx src/features/info/InfoOverlay.test.tsx
```

Expected: SponsorMarks module is missing; Info has only three chips and no sponsor region.

- [ ] **Step 3: Extract sponsor rendering**

Move canonical sponsor lookup from `SponsorStrip` into `SponsorMarks`. Return one `.sponsor-marks` wrapper containing `.sponsor-logo-card` image cards or `.sponsor-text-mark` text fallbacks. Keep keys stable by label/index and retain accurate alt text.

Change `SponsorStrip` to render its existing `Presented with support from` label plus `SponsorMarks` inside the existing footer.

- [ ] **Step 4: Add the two color-up chip definitions**

Change the chip model to support either `quantity` or `supportingLabel`:

```ts
const CHIPS = [
  { value: 1, color: 'White', supportingLabel: '10 chips', accessibleLabel: '10 white 1-value chips', className: 'chip--white' },
  { value: 5, color: 'Red', supportingLabel: '8 chips', accessibleLabel: '8 red 5-value chips', className: 'chip--red' },
  { value: 25, color: 'Green', supportingLabel: '6 chips', accessibleLabel: '6 green 25-value chips', className: 'chip--green' },
  { value: 100, color: 'Black', supportingLabel: 'Color-up chip', accessibleLabel: 'Black 100-value chip', className: 'chip--black' },
  { value: 500, color: 'Purple', supportingLabel: 'Color-up chip', accessibleLabel: 'Purple 500-value chip', className: 'chip--purple' },
] as const
```

Render the literal `accessibleLabel` and `supportingLabel` values so no starting quantity is inferred for 100/500.

- [ ] **Step 5: Add Info sponsor composition and CSS**

In `InfoOverview`, add a section after the Prize structure section:

```tsx
<section className="info-sponsors" aria-labelledby="info-sponsors-title">
  <p className="info-kicker">Presented by</p>
  <h2 id="info-sponsors-title">Tournament sponsors</h2>
  <SponsorMarks labels={state.configuration.sponsorLabels} className="sponsor-marks--info" />
</section>
```

Keep the reminder after the sponsor section. Add black/purple disk fills and high-contrast text. Make the chip rack and sponsor marks compact at base and `max-width: 640px`, retaining Info’s fixed-height/non-scrolling composition and Susquehanna plaque.

- [ ] **Step 6: Run GREEN and regression gates**

```bash
npm test -- --run src/components/SponsorMarks.test.tsx src/features/display/SponsorStrip.test.tsx src/features/display/TournamentDisplay.test.tsx src/features/info/InfoOverlay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Expected: all pass with no warnings.

- [ ] **Step 7: Mutation-check and commit**

Temporarily remove the black chip and bypass `SponsorMarks` in Info; confirm the exact focused tests fail, then restore. Commit:

```bash
git add src/components/SponsorMarks.tsx src/components/SponsorMarks.test.tsx src/features/display/SponsorStrip.tsx src/features/display/SponsorStrip.test.tsx src/features/info/ChipDenominations.tsx src/features/info/InfoOverview.tsx src/features/info/InfoOverlay.test.tsx src/styles/display.css
git commit -m "feat: add info chips and sponsor marks"
```

---

### Task 2: Rebalanced Info structure and protected default schedule

**Files:**
- Modify: `src/features/info/InfoStructure.tsx`
- Modify: `src/features/info/InfoOverlay.test.tsx`
- Modify: `src/styles/display.css`
- Test: `src/domain/structure.test.ts`
- Test: `src/persistence/presets.test.ts`
- Test: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Consumes: unchanged `TournamentState.structure` with break labels preserved.
- Produces: Info-only break presentation with `aria-label="Break, 10 min"` and no subtitle.
- Preserves: main `breakPresentation()` behavior and `sampleStructure` as the built-in preset source.

- [ ] **Step 1: Write failing Info split/copy tests**

Update the Info structure test to assert:

```ts
expect(entries.slice(0, 11).every((entry) => entry.dataset.column === '1')).toBe(true)
expect(entries.slice(11).every((entry) => entry.dataset.column === '2')).toBe(true)
expect(entries[10]).toHaveTextContent('Level 10')
expect(entries[11]).toHaveAccessibleName('Break, 10 min')
expect(entries[11]).toHaveTextContent('BREAK · 10 MIN')
expect(entries[11]).not.toHaveTextContent(/chip up/i)
```

Assert no `Chip up to 5s` or `Chip up to 25s and 100s` appears anywhere on the Info structure tab, while the existing main display break tests still require both descriptions.

- [ ] **Step 2: Run focused tests and capture RED**

```bash
npm test -- --run src/features/info/InfoOverlay.test.tsx src/features/display/TournamentDisplay.test.tsx
```

Expected: the left column has 10 entries, the right begins with Level 10, and Info break subtitles/accessibility still expose chip-up text.

- [ ] **Step 3: Implement the Info-only break presentation and split**

In `InfoStructure`, set `const INFO_LEFT_COLUMN_COUNT = 11`. Use it for `data-column`. For a break, derive minutes from `entry.durationSeconds` and render only:

```tsx
<strong>BREAK · {entry.durationSeconds / 60} MIN</strong>
```

Use accessible name `Break, ${entry.durationSeconds / 60} min`; do not call `breakPresentation()` in this component and do not render a subtitle.

Set `.info-structure-list` to `grid-template-rows: repeat(11, minmax(0, 1fr))`. Remove Info-only subtitle selectors that no longer have a consumer, without touching main break CSS.

- [ ] **Step 4: Strengthen canonical-default regression coverage**

Keep the existing exact 19-entry `structure.test.ts` literal. In `presets.test.ts`, assert the protected built-in’s `structure` deep-equals `sampleStructure`, begins with `{ smallBlind: 1, bigBlind: 2, anteType: 'none' }`, and ends with `{ smallBlind: 500, bigBlind: 1000, durationSeconds: null }`. These are compatibility regressions, not a second structure definition.

- [ ] **Step 5: Run GREEN and full domain/persistence gates**

```bash
npm test -- --run src/features/info/InfoOverlay.test.tsx src/features/display/TournamentDisplay.test.tsx src/domain/structure.test.ts src/persistence/presets.test.ts
npm run typecheck
npm run lint
git diff --check
```

Expected: all pass.

- [ ] **Step 6: Mutation-check and commit**

Temporarily restore the split threshold to 10 and restore the subtitle; confirm the Info tests fail independently, then restore. Commit:

```bash
git add src/features/info/InfoStructure.tsx src/features/info/InfoOverlay.test.tsx src/styles/display.css src/domain/structure.test.ts src/persistence/presets.test.ts src/features/display/TournamentDisplay.test.tsx
git commit -m "feat: rebalance tournament info structure"
```

---

### Task 3: Main PPC hierarchy alignment

**Files:**
- Modify: `src/styles/brand.css`
- Modify: `src/components/ClubBrandLockup.test.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Consumes: existing `ClubBrandLockup` DOM and `brand-lockup--display` modifier.
- Produces: a display modifier that changes only scale/placement, not organization/title typography roles.

- [ ] **Step 1: Add failing typography-role tests**

Extend the raw CSS test to require the main organization line to remain small, orange, uppercase, and sans-serif/inherited rather than `var(--font-heritage)`. Require the main title to use `var(--font-heritage)`, ivory, a larger clamp floor than the organization line, and no uppercase transform.

Add a real display assertion that `.brand-lockup--display` contains the configured organization before the configured tournament-name `h1`.

- [ ] **Step 2: Run focused tests and capture RED**

```bash
npm test -- --run src/components/ClubBrandLockup.test.tsx src/features/display/TournamentDisplay.test.tsx
```

Expected: raw CSS assertions fail because the main modifier currently makes the organization large/heritage and the title small/slate/uppercase.

- [ ] **Step 3: Correct only the display modifier roles**

Remove the heritage family and large clamp from `.brand-lockup--display .club-brand-organization`; keep it close to the shared organization scale with a modest projector increase. Change `.brand-lockup--display h1` to prominent ivory heritage text using a clamp comparable to Info’s title. Preserve ellipsis/nowrap only as overflow protection for long tournament names; remove `text-transform: uppercase`.

Update the narrow rule so the organization remains smaller than the title at `max-width: 640px`.

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- --run src/components/ClubBrandLockup.test.tsx src/features/display/TournamentDisplay.test.tsx
npm run typecheck
npm run lint
git diff --check
git add src/styles/brand.css src/components/ClubBrandLockup.test.tsx src/features/display/TournamentDisplay.test.tsx
git commit -m "style: align main ppc lockup hierarchy"
```

---

### Task 4: Professional grouped structure editor

**Files:**
- Modify: `src/features/director/StructureEditor.tsx`
- Modify: `src/features/director/StructureRow.tsx`
- Modify: `src/features/director/StructureEditor.test.tsx`
- Modify: `src/styles/director.css`

**Interfaces:**
- Consumes: unchanged `StructureRowProps`, `StructureEntry`, and `ValidationIssue` types.
- Produces: `.structure-editor-table`, five headers, `.structure-blinds-group`, and `.structure-ante-group` DOM hooks.
- Preserves: control accessible names and every callback payload.

- [ ] **Step 1: Write failing grouped-DOM tests**

Replace seven-header expectations with:

```ts
expect(within(columns).getAllByText(/.+/).map((node) => node.textContent)).toEqual([
  'Level', 'Minutes', 'Blinds', 'Ante', 'Actions',
])
```

For a poker level, assert `.structure-blinds-group` contains spinbuttons named `Small blind` and `Big blind`, with visible sublabels `SB` and `BB`. Assert `.structure-ante-group` contains combobox `Ante type` and spinbutton `Ante`, with `Type` and `Amount`. Assert no Note or Until end control. For a break, assert no blinds/ante group, a Break label spanning hook, minutes, and actions.

Assert the header and list share one `.structure-editor-table` ancestor. Keep existing real behavior tests for Apply, Cancel, validation, insert/reorder/delete, and hidden-data preservation.

- [ ] **Step 2: Add failing CSS contracts**

Require the desktop header and row to share this five-column template:

```css
5.25rem 5.75rem minmax(12rem, 1fr) minmax(13rem, 1.05fr) 8.7rem
```

Require grouped controls to use two-column grids, break label to span columns 3/5, actions in column 5, the table wrapper to own the border/background/radius, rows to use separators rather than independent rounded cards, and every input/action/untimed marker to retain 2.75rem minimum height.

- [ ] **Step 3: Run the editor suite and capture RED**

```bash
npm test -- --run src/features/director/StructureEditor.test.tsx
```

Expected: seven headers, ungrouped controls, missing table wrapper/hooks, and old CSS contracts fail.

- [ ] **Step 4: Implement grouped StructureRow markup**

Render the duration cell unchanged. Replace the three blind/ante labels plus type label with:

```tsx
<div className="structure-field-group structure-blinds-group">
  <label className="structure-compact-field">
    <span aria-hidden="true">SB</span>
    <input aria-label="Small blind" ... />
  </label>
  <label className="structure-compact-field">
    <span aria-hidden="true">BB</span>
    <input aria-label="Big blind" ... />
  </label>
</div>
<div className="structure-field-group structure-ante-group">
  <label className="structure-compact-field">
    <span aria-hidden="true">Type</span>
    <select aria-label="Ante type" ... />
  </label>
  <label className="structure-compact-field">
    <span aria-hidden="true">Amount</span>
    <input aria-label="Ante" ... />
  </label>
</div>
```

Keep `FieldIssue` associated with the corresponding grouped control and preserve the existing ante-type change behavior exactly.

- [ ] **Step 5: Wrap the table and change headers**

In `StructureEditor`, wrap `.structure-editor-columns` and `.structure-editor-list` in `.structure-editor-table`. Render five headers. Do not change draft state, add/move/delete/apply functions, or ResetControls.

- [ ] **Step 6: Implement the professional table CSS**

Make `.structure-editor-table` the bounded surface. Give `.structure-editor-columns` and `.structure-row-grid` the same five-column template. Remove per-row outer radius/heavy gradients; use low-contrast alternating fills and one-pixel separators. Use grouped field wells with two subcolumns, a restrained warm break row, actions in column 5, and break label spanning columns 3/5.

Compact `.structure-live-tools`, editor heading, add buttons, and sticky action surface without changing their DOM behavior. At `max-width: 1180px`, keep the five-group row contained with reduced group minima and visible sublabels. At `max-width: 620px`, use two columns with identity/actions full width and Blinds/Ante each contained. No horizontal overflow at 821 or 800 CSS pixels.

- [ ] **Step 7: Run GREEN and mutation checks**

```bash
npm test -- --run src/features/director/StructureEditor.test.tsx src/features/director/DirectorOverlay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

Temporarily move Actions back to column 7 and ungroup one blind input; confirm independent tests fail, then restore.

- [ ] **Step 8: Run full suite, self-review, and commit**

```bash
npm test -- --run
git add src/features/director/StructureEditor.tsx src/features/director/StructureRow.tsx src/features/director/StructureEditor.test.tsx src/styles/director.css
git commit -m "style: organize the structure editor"
```

Review accessible names, error placement, break rows, untimed duration, insert-before-final behavior, 44px targets, and responsive selectors before committing.

---

### Task 5: Integrated projector and release verification

**Files:**
- Modify only files above if a verified defect is found.
- Create: `.superpowers/sdd/2026-08-12-tournament-visual-polish/task-5-report.md`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: automated, production-browser, accessibility, compatibility, and review evidence.

- [ ] **Step 1: Run the exact automated gate**

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: all commands exit zero and the build emits `dist/manifest.webmanifest`, `dist/sw.js`, and a Workbox bundle.

- [ ] **Step 2: Verify production projectors**

Use the in-app browser against a production preview. At 1920x1080 and 1366x768 verify the main display and both Info pages: corrected main lockup, five distinguishable chips, exact labels, both sponsor logos below prizes, single reminder, no Info scroll, all 19 entries, left Level 10, right Break, no Info chip-up text, and main chip-up text retained.

- [ ] **Step 3: Verify narrow and Director layouts**

At 390x844 verify both Info pages are fixed and non-scrolling, all five chip cards and sponsor marks are contained/readable, all structure entries are visible, and controls are at least 44px. At 821x900 and 800x900 verify the grouped five-column Director has no document/content/row horizontal overflow, all controls remain contained, and Break/Level rows are visually distinct. At 390x844 verify the mobile two-column editor flow.

- [ ] **Step 4: Verify interaction and compatibility**

Verify Info tab arrows, Info/Director Escape close, trigger focus restoration, click-to-jump, saved tournament preservation across production load, built-in preset exactness, and zero console warnings/errors.

- [ ] **Step 5: Conduct scoped and whole-branch reviews**

Review each task against the design, then review the complete branch against its merge base. Treat data loss, incorrect default migration, inaccessible controls, clipped projector content, scroll regressions, chip ambiguity, sponsor mapping drift, and editor workflow regression as blocking. Fix verified defects test-first and rerun affected browser/gates.

- [ ] **Step 6: Write the evidence report and finish**

Record exact command outputs, viewport/client-scroll metrics, focus/console results, current commit hashes, and concerns in the report. Run one final exact gate on the reviewed tree before invoking the branch-finishing workflow.
