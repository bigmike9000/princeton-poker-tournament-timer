# Final Public Clock Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify PPC page branding, simplify structure editing and the public schedule, and reduce Tournament Info to chips, exact prizes, and one chip-visibility reminder.

**Architecture:** Add a shared semantic brand-lockup component and retain surface-specific sizing through modifier classes. Simplify only the structure editor presentation while preserving domain data. Treat Info projector safety as a function of publicly rendered chip/prize data and keep hidden house-note persistence compatible.

**Tech Stack:** React 19, TypeScript 6, CSS, Vitest 4, Testing Library, Vite 8/PWA.

## Global Constraints

- The main, Info, and Director headers show orange `Princeton Poker Club` above one page-specific title.
- The main title is the live tournament name; Info is exactly `Tournament Info`; Director remains `Tournament Director`.
- No visible `Note` or `Until end` editor control; saved `note` values and untimed durations must survive Apply unchanged.
- All interactive targets remain at least 44 by 44 CSS pixels.
- Public Info shows chips, eight prizes, and only `Keep chips visible and countable.`; no rules or house-notes section/footer.
- Default prize lines are exactly `1: 300`, `2: 200`, `3: 140`, `4: 100`, `5: 80`, `6: 70`, `7: 60`, `8: 50`.
- No saved notes or house notes are deleted or migrated.
- Existing snapshots and presets continue to load.

---

## File map

- Create `src/components/ClubBrandLockup.tsx`: shared logo, organization, and page-title semantics.
- Create `src/styles/brand.css`: shared lockup hierarchy and typography contract.
- Modify `src/styles/index.css`: load shared brand styles before surface styles.
- Modify `src/features/display/TournamentDisplay.tsx`: consume shared lockup with tournament title.
- Modify `src/features/info/InfoOverlay.tsx`: consume shared lockup with fixed Info title and public-only safety decision.
- Modify `src/features/director/DirectorOverlay.tsx`: consume shared lockup without changing Director behavior.
- Modify `src/features/director/StructureRow.tsx`: remove note/toggle controls and show an accessible untimed placeholder.
- Modify `src/features/director/StructureEditor.tsx`: reduce column headings and stop deleting hidden notes.
- Modify `src/features/info/InfoOverview.tsx`: render prizes plus one reminder and remove public rules/footer/house notes.
- Modify `src/domain/tournamentInformation.ts`: exact prize defaults and eight-line prize budget.
- Modify `src/styles/display.css`: shared public lockup variants, denser blind rows, compact prize/reminder layout.
- Modify `src/styles/director.css`: shared Director lockup variant and seven-column responsive editor.
- Modify existing colocated tests for each feature; do not create a separate integration-test directory.

---

### Task 1: Shared PPC brand lockup

**Files:**
- Create: `src/components/ClubBrandLockup.tsx`
- Create: `src/styles/brand.css`
- Modify: `src/styles/index.css`
- Modify: `src/features/display/TournamentDisplay.tsx`
- Modify: `src/features/info/InfoOverlay.tsx`
- Modify: `src/features/director/DirectorOverlay.tsx`
- Modify: `src/styles/display.css`
- Modify: `src/styles/director.css`
- Test: `src/features/display/TournamentDisplay.test.tsx`
- Test: `src/features/info/InfoOverlay.test.tsx`
- Test: `src/features/director/DirectorOverlay.test.tsx`

**Interfaces:**
- Consumes: `ClubLogo`, `organizationName: string`, `title: string`.
- Produces: `ClubBrandLockup({ organizationName, title, titleId?, className?, logoClassName?, logoSize? }): JSX.Element`.

- [ ] **Step 1: Add failing hierarchy tests**

Assert each surface has a `.club-brand-lockup` containing, in order, the PPC logo, organization paragraph, and one `h1`. Main must use a snapshot-loaded tournament name such as `Test 1`; Info must expose dialog name `Tournament Info` and must not render the tournament name inside `.info-brand`; Director must remain `Tournament Director`.

```tsx
const lockup = container.querySelector('.club-brand-lockup')
expect(lockup).not.toBeNull()
expect(within(lockup as HTMLElement).getByText('Princeton Poker Club')).toHaveClass('club-brand-organization')
expect(within(lockup as HTMLElement).getByRole('heading', { level: 1 })).toHaveTextContent('Test 1')
```

- [ ] **Step 2: Run the focused tests and capture RED**

Run:

```bash
npm test -- --run src/features/display/TournamentDisplay.test.tsx src/features/info/InfoOverlay.test.tsx src/features/director/DirectorOverlay.test.tsx
```

Expected: hierarchy/class assertions fail because the shared component and fixed Info title do not exist.

- [ ] **Step 3: Implement the shared component**

Create a small semantic component with this contract:

```tsx
interface ClubBrandLockupProps {
  organizationName: string
  title: string
  titleId?: string
  className?: string
  logoClassName?: string
  logoSize?: number
}

export function ClubBrandLockup(props: ClubBrandLockupProps) {
  return (
    <div className={`club-brand-lockup ${props.className ?? ''}`.trim()}>
      <ClubLogo className={props.logoClassName} size={props.logoSize ?? 52} />
      <div>
        <p className="club-brand-organization">{props.organizationName}</p>
        <h1 id={props.titleId}>{props.title}</h1>
      </div>
    </div>
  )
}
```

Replace the duplicated header markup on all three surfaces. Use `titleId="info-title"` with title `Tournament Info`, `titleId="director-title"` with title `Tournament Director`, and the configured tournament name on the main clock. Retain surface modifier classes only for responsive size and placement.

- [ ] **Step 4: Align CSS without changing header controls**

Put shared flex, zero-margin, organization color/uppercase, and title hierarchy declarations in `brand.css`, using selectors that begin with `.club-brand-lockup`; import it after `tokens.css` and before `display.css`. Keep `.brand-header`, `.info-header`, and `.director-header` layout rules surface-specific. Remove obsolete `.club-mark`, `.brand-copy`, tertiary `.info-brand h2`, and duplicated Director brand declarations.

- [ ] **Step 5: Run GREEN checks**

Run the Task 1 focused test command, then:

```bash
npm run typecheck && npm run lint && git diff --check
```

Expected: all pass.

- [ ] **Step 6: Review and commit**

Verify one `h1` per surface, no Info tournament-name third line, and no lost close/status behavior. Commit:

```bash
git add src/components/ClubBrandLockup.tsx src/features/display/TournamentDisplay.tsx src/features/info/InfoOverlay.tsx src/features/director/DirectorOverlay.tsx src/styles/brand.css src/styles/index.css src/styles/display.css src/styles/director.css src/features/display/TournamentDisplay.test.tsx src/features/info/InfoOverlay.test.tsx src/features/director/DirectorOverlay.test.tsx
git commit -m "feat: unify ppc page branding"
```

---

### Task 2: Cleaner structure editor

**Files:**
- Modify: `src/features/director/StructureRow.tsx`
- Modify: `src/features/director/StructureEditor.tsx`
- Modify: `src/styles/director.css`
- Test: `src/features/director/StructureEditor.test.tsx`

**Interfaces:**
- Consumes: unchanged `StructureEntry` values, including optional `PokerLevel.note` and nullable `durationSeconds`.
- Produces: the same `SET_STRUCTURE` payload shape with hidden values preserved.

- [ ] **Step 1: Replace obsolete behavior tests with failing preservation tests**

Add assertions that the column headings are exactly:

```ts
['Level', 'Duration', 'Small', 'Big', 'Ante', 'Type', 'Actions']
```

For a timed row, assert Duration, Small, Big, Ante, Type, and Actions hooks but no textbox named `Level note`, no checkbox named `Until end`, and no visible `Note`/`Until end` copy. For an untimed row, assert a `.structure-untimed-duration` element with accessible name `Untimed level` and text `—` and no duration spinbutton.

Update the state harness to seed a level note, edit another field, click Apply, and assert the seeded note remains unchanged in the applied structure.

- [ ] **Step 2: Run the StructureEditor suite and capture RED**

Run:

```bash
npm test -- --run src/features/director/StructureEditor.test.tsx
```

Expected: failures show the old Note column, level-note field, Until end checkbox, and eight-column CSS.

- [ ] **Step 3: Remove the two controls without mutating hidden data**

In `StructureRow`, render timed duration as the existing number input; otherwise render:

```tsx
<span className="structure-untimed-duration" aria-label="Untimed level">—</span>
```

Remove the level-note label/input entirely. In `StructureEditor`, remove the Note header and change `applyStructure` to dispatch `structuredClone(draft)` directly; do not normalize, trim, or delete `note`.

- [ ] **Step 4: Convert editor CSS to seven columns**

Use a desktop grid equivalent to:

```css
grid-template-columns: 5.25rem 5.75rem 4.75rem 4.75rem 4.75rem minmax(7.5rem, 1fr) 8.7rem;
```

Give `.structure-untimed-duration` a 44px minimum height, centered alignment, muted numeric styling, and no interactive cursor. Update the 1180px grid and placements so Type can span the available middle columns and Actions occupy the final column. Remove every `.structure-level-note` and `.structure-until-end` rule. Retain the two-column mobile grid, making identity and actions full width.

- [ ] **Step 5: Run GREEN checks**

Run the StructureEditor suite, then:

```bash
npm test -- --run src/features/director/DirectorOverlay.test.tsx src/features/director/StructureEditor.test.tsx
npm run typecheck && npm run lint && git diff --check
```

Expected: all pass.

- [ ] **Step 6: Review and commit**

Mutation-check that removing the preservation assertion would be the only way a hidden note could be lost. Confirm break inputs and actions remain usable. Commit:

```bash
git add src/features/director/StructureRow.tsx src/features/director/StructureEditor.tsx src/styles/director.css src/features/director/StructureEditor.test.tsx
git commit -m "feat: simplify structure editing"
```

---

### Task 3: Denser public blind schedule

**Files:**
- Modify: `src/styles/display.css`
- Test: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Consumes: unchanged `BlindStructure` DOM and click-to-jump behavior.
- Produces: compact CSS sizing contracts only; no reducer or schedule-data changes.

- [ ] **Step 1: Add failing raw-CSS density contracts**

Import `display.css?raw`, extract rules, and assert:

```ts
expect(cssRule(displayCss, '.structure-row')).toMatch(/min-height:\s*3\.25rem/)
expect(cssRule(displayCss, '.structure-row--break')).toMatch(/min-height:\s*2\.75rem/)
expect(cssRule(displayCss, '.structure-row-button')).toMatch(/min-height:\s*inherit/)
```

Also protect the tightened header maximum, reduced vertical button padding, and unchanged button click behavior.

- [ ] **Step 2: Run the display suite and capture RED**

Run:

```bash
npm test -- --run src/features/display/TournamentDisplay.test.tsx
```

Expected: density contracts fail against the existing 4.35rem/3rem rows.

- [ ] **Step 3: Tighten schedule geometry**

Set standard rows to `min-height: 3.25rem`, breaks to `2.75rem`, reduce row-button vertical padding and internal gaps, shrink the index marker proportionally, and reduce the structure-header minimum height to about `5.6rem`. Keep blind values, duration, ante text, LIVE marker, current highlighting, and focus outline readable. Do not reduce any clickable schedule button below 44px.

- [ ] **Step 4: Run GREEN checks**

Run the display suite plus:

```bash
npm run typecheck && npm run lint && git diff --check
```

Expected: all pass.

- [ ] **Step 5: Review and commit**

Confirm no DOM/reducer files changed, all schedule buttons remain keyboard reachable, and existing click-to-jump test still passes. Commit:

```bash
git add src/styles/display.css src/features/display/TournamentDisplay.test.tsx
git commit -m "style: compact the public blind schedule"
```

---

### Task 4: Minimal public Info and exact prizes

**Files:**
- Modify: `src/domain/tournamentInformation.ts`
- Modify: `src/domain/tournamentInformation.test.ts`
- Modify: `src/features/info/InfoOverlay.tsx`
- Modify: `src/features/info/InfoOverview.tsx`
- Modify: `src/features/info/InfoOverlay.test.tsx`
- Modify: `src/features/director/TournamentInformationEditor.test.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Consumes: `selectTournamentInformation(state)` and `validateProjectorInformation(information)`.
- Produces: eight exact default prize lines and a public-safe decision equal to `chipLines.error === null && prizeLines.error === null`.

- [ ] **Step 1: Add failing domain tests**

Assert `PROJECTOR_INFORMATION_BUDGETS.prizeLines.maxLines === 8`, the exact eight default lines, and that eight short prize lines validate. Retain a test proving over-budget house notes still report an editor validation error.

- [ ] **Step 2: Add failing public Info tests**

On Overview assert:

```tsx
expect(overlay.getByText('Keep chips visible and countable.')).toBeVisible()
expect(overlay.getAllByRole('listitem', { name: /place prize/i })).toHaveLength(8)
expect(overlay.queryByRole('heading', { name: /rules/i })).not.toBeInTheDocument()
expect(overlay.queryByText('House notes')).not.toBeInTheDocument()
expect(overlay.queryByRole('link', { name: '2024 Poker TDA rules' })).not.toBeInTheDocument()
```

Create a snapshot with safe chips/prizes and over-budget house notes. Assert Overview still has `info-page--projector-safe` and does not render the hidden house note. Keep a separate oversize-chip fixture proving the legacy fallback remains reachable.

- [ ] **Step 3: Run focused tests and capture RED**

Run:

```bash
npm test -- --run src/domain/tournamentInformation.test.ts src/features/info/InfoOverlay.test.tsx src/features/director/TournamentInformationEditor.test.tsx
```

Expected: failures show the four-line prize limit, placeholder default prize, old rules/house/footer content, and hidden house notes affecting public fallback.

- [ ] **Step 4: Implement exact defaults and public-only safety**

Set `prizeLines.maxLines` to 8 and the default lines to the exact user values. In `InfoOverlay`, keep full validation for editor use but compute public safety from only `validation.fields.chipLines.error` and `validation.fields.prizeLines.error`. Remove `houseNotes` from the `InfoOverview` props.

- [ ] **Step 5: Replace public rules with prizes and one reminder**

Render prizes as a semantic list. For lines with a colon, split the first colon into rank and value spans; for custom unsplit lines, render the full line in a span that crosses both columns. Give each default row an accessible label such as `1 place prize, 300`. Add:

```tsx
<p className="info-chip-reminder">Keep chips visible and countable.</p>
```

Remove the rules section, house notes, `TOURNAMENT_RULE_SUMMARY` import, and footer from `InfoOverview`.

- [ ] **Step 6: Create compact projector CSS**

Make `.info-prize-list` an eight-row rank/value grid with tabular values and restrained dividers. Place `.info-chip-reminder` as a small high-contrast callout below the prize card. Change `.info-overview-details` to fit the prize card plus reminder without scroll at narrow and projector sizes. Delete obsolete public `.info-house-notes`, `.info-rules-grid`, and `.info-footer` styles.

- [ ] **Step 7: Run GREEN checks**

Run the focused Task 4 command, then:

```bash
npm test -- --run src/features/info/InfoOverlay.test.tsx src/features/display/TournamentDisplay.test.tsx src/domain/tournamentInformation.test.ts
npm run typecheck && npm run lint && git diff --check
```

Expected: all pass.

- [ ] **Step 8: Review and commit**

Confirm no currency symbol was inferred, hidden house notes remain in state/editor tests, all eight prizes render, and only public chip/prize overflow changes the Info fallback. Commit:

```bash
git add src/domain/tournamentInformation.ts src/domain/tournamentInformation.test.ts src/features/info/InfoOverlay.tsx src/features/info/InfoOverview.tsx src/features/info/InfoOverlay.test.tsx src/features/director/TournamentInformationEditor.test.tsx src/styles/display.css
git commit -m "feat: focus tournament info on prizes"
```

---

### Task 5: Integrated projector verification

**Files:**
- Modify only if a verified defect is found in the files already named above.
- Create: `.superpowers/sdd/2026-08-12-final-public-clock-polish/task-5-report.md`

**Interfaces:**
- Consumes: all four task commits.
- Produces: evidence that the integrated app satisfies the approved design with no regression.

- [ ] **Step 1: Run the exact automated gate**

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: every command exits zero and the Vite build emits PWA artifacts.

- [ ] **Step 2: Run production browser QA**

Build and preview the production bundle. At 1920x1080 and 1366x768 verify main and both Info pages: correct two-line titles, compact clickable schedule, no document overflow, fixed safe Info page, all eight prizes, one reminder, and all 19 structure entries. At 390x844 verify both Info pages contain all text with no scrolling/clipping and controls at least 44px. At 821x900 and 800x900 verify Director has no horizontal overflow, no Note/Until end controls, an untimed dash, aligned break rows, and contained 44px actions.

- [ ] **Step 3: Inspect console and focus behavior**

Open/close Info and Director by keyboard, switch Info tabs with arrows, confirm focus returns to the trigger, and record zero browser console errors/warnings.

- [ ] **Step 4: Conduct scoped and whole-branch review**

Review the diff against `docs/superpowers/specs/2026-08-12-final-public-clock-polish-design.md`, then review the entire feature branch against master. Treat any correctness, accessibility, compatibility, clipping, or projector-overflow issue as blocking. Fix verified defects test-first and rerun the exact gate.

- [ ] **Step 5: Write the final evidence report and commit verified fixes**

Record command outputs, viewport measurements, focus/console findings, and final commit hashes in the report. If code changed during QA, commit it with a narrow message such as:

```bash
git add <verified-files>
git commit -m "fix: close final projector polish gaps"
```
