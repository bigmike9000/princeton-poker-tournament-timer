# Break Operations and Sponsor Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show concise, operational break instructions on the public clock and make main-screen sponsor logos more visible without compromising projector containment.

**Architecture:** Keep schedule duration copy in the existing `breakPresentation` boundary while giving the CurrentLevel hero a concise literal heading. Store the new instructions in bundled break labels and translate only the two exact former bundled labels at presentation time for saved-state compatibility. Add a main-only SponsorMarks modifier so Info-page and mobile sizing remain isolated.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, Vite PWA.

## Global Constraints

- The large current-entry heading is exactly `BREAK`; the main schedule retains `BREAK · 10 MIN`.
- First-break copy is exactly `COUNT AND STACK WHITE CHIPS IN STACKS OF 10` in the rendered public UI.
- Second-break copy is exactly `COUNT AND STACK RED CHIPS` in the rendered public UI.
- Existing saved labels `Chip up to 5s` and `Chip up to 25s and 100s` translate exactly; other custom labels remain unchanged.
- Timer duration, pause/resume, level order, Info structure, Director editing, and accessible duration/message semantics are unchanged.
- Sponsor scaling applies to the main display only and must remain contained at 1920×1080, 1366×768, and 390×844.

---

### Task 1: Concise break hero and operational defaults

**Files:**
- Modify: `src/domain/breakPresentation.ts`
- Modify: `src/domain/breakPresentation.test.ts`
- Modify: `src/domain/sampleStructure.ts`
- Modify: `src/domain/structure.test.ts`
- Modify: `src/features/display/CurrentLevel.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Consumes: `breakPresentation(entry: BreakLevel): BreakPresentation` and bundled `sampleStructure`.
- Produces: presentation-compatible operational subtitles; the public current-break hero renders literal `BREAK`.

- [ ] **Step 1: Write failing domain/default tests**

Add exact assertions that the two former labels normalize to the new sentence-case operational subtitles and full accessible labels, custom copy is preserved, and `sampleStructure` stores the new messages.

```ts
expect(breakPresentation(legacyWhiteBreak)).toMatchObject({
  heading: 'BREAK · 10 MIN',
  subtitle: 'Count and stack white chips in stacks of 10',
  accessibleLabel: 'Break, 10 min, Count and stack white chips in stacks of 10',
})
expect(defaultBreakLabels).toEqual([
  'Count and stack white chips in stacks of 10',
  'Count and stack red chips',
])
```

- [ ] **Step 2: Write failing display tests**

Persist each break as current and assert the hero contains exactly one `BREAK` heading, excludes `BREAK · 10 MIN`, contains the appropriate operational message, and leaves the schedule row duration visible.

```ts
const hero = within(screen.getByRole('region', { name: 'Current break' }))
expect(hero.getByRole('heading', { name: 'BREAK' })).toBeVisible()
expect(hero.queryByText('BREAK · 10 MIN')).not.toBeInTheDocument()
expect(hero).toHaveTextContent('Count and stack white chips in stacks of 10')
expect(within(schedule).getByText('BREAK · 10 MIN')).toBeVisible()
```

- [ ] **Step 3: Run RED tests**

Run: `npm test -- --run src/domain/breakPresentation.test.ts src/domain/structure.test.ts src/features/display/TournamentDisplay.test.tsx`

Expected: failures for old bundled labels, absent legacy translations, and the duration-bearing hero heading.

- [ ] **Step 4: Implement exact legacy translation and defaults**

In `breakPresentation.ts`, map only the two exact trimmed former labels before generic-label detection:

```ts
const formerBundledMessages: Readonly<Record<string, string>> = {
  'Chip up to 5s': 'Count and stack white chips in stacks of 10',
  'Chip up to 25s and 100s': 'Count and stack red chips',
}
const candidate = formerBundledMessages[entry.label.trim()] ?? entry.label.trim()
```

Update bundled break labels to the new sentence-case strings, and render `<h2 className="level-heading">BREAK</h2>` only in `CurrentLevel`'s break branch.

- [ ] **Step 5: Run GREEN and mutation checks**

Run the focused command from Step 3. Temporarily bypass one legacy mapping and restore the duration-bearing hero heading; confirm the respective focused assertions fail, then restore production behavior and rerun GREEN.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/domain/breakPresentation.ts src/domain/breakPresentation.test.ts src/domain/sampleStructure.ts src/domain/structure.test.ts src/features/display/CurrentLevel.tsx src/features/display/TournamentDisplay.test.tsx
git commit -m "feat: add operational break messages"
```

### Task 2: Main-only sponsor scale

**Files:**
- Modify: `src/features/display/SponsorStrip.tsx`
- Modify: `src/features/display/SponsorStrip.test.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/styles/display.css`

**Interfaces:**
- Consumes: `SponsorMarks({ labels, className })`.
- Produces: `.sponsor-marks--display` on the main SponsorStrip and responsive card dimensions protected by CSS contracts.

- [ ] **Step 1: Write failing markup and CSS tests**

Require `SponsorStrip` to render `.sponsor-marks--display`. Require its full-size cards to be 8.5rem × 2.25rem and its max-height-820 cards to be at least 7rem × 1.8rem, while `.sponsor-marks--info` declarations remain unchanged.

```ts
expect(container.querySelector('.sponsor-marks--display')).not.toBeNull()
expect(cssRule(displayCss, '.sponsor-marks--display .sponsor-logo-card')).toMatch(/width:\s*8\.5rem/)
expect(shortHeightRule).toMatch(/width:\s*7\.25rem/)
```

- [ ] **Step 2: Run RED tests**

Run: `npm test -- --run src/features/display/SponsorStrip.test.tsx src/features/display/TournamentDisplay.test.tsx`

Expected: failures for the absent display modifier and size rules.

- [ ] **Step 3: Implement the display modifier and dimensions**

Pass `className="sponsor-marks--display"` from SponsorStrip. Add main-only base dimensions of 8.5rem × 2.25rem and max-height-820 dimensions of 7.25rem × 1.85rem. Keep existing Info and phone-specific dimensions unchanged.

- [ ] **Step 4: Run GREEN and mutation checks**

Run the focused command from Step 2. Temporarily remove the display modifier and revert the short-height width; confirm each exact assertion fails, restore, and rerun GREEN.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/features/display/SponsorStrip.tsx src/features/display/SponsorStrip.test.tsx src/features/display/TournamentDisplay.test.tsx src/styles/display.css
git commit -m "style: enlarge main sponsor marks"
```

### Task 3: Integrated projector release gate

**Files:**
- Create: `.superpowers/sdd/2026-08-13-break-operations-and-sponsor-scale/release-report.md`
- Verify: all Task 1 and Task 2 files.

**Interfaces:**
- Consumes: committed Task 1 and Task 2 behavior.
- Produces: browser evidence, review disposition, and a clean release-ready branch.

- [ ] **Step 1: Run focused and static verification**

```bash
npm test -- --run src/domain/breakPresentation.test.ts src/domain/structure.test.ts src/features/display/SponsorStrip.test.tsx src/features/display/TournamentDisplay.test.tsx
npm run typecheck
npm run lint
git diff --check
```

- [ ] **Step 2: Build and run the production preview**

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4184
```

- [ ] **Step 3: Perform in-app browser QA**

At 1920×1080 and 1366×768, verify both breaks show hero `BREAK`, the correct operational message, timer/next-level content, enlarged sponsor logos, no clipped controls, and document client/scroll dimensions match. At 390×844 verify containment and readable break copy. Confirm no console warnings/errors.

- [ ] **Step 4: Request independent review**

Review the diff against the design, focusing on exact copy, existing-snapshot compatibility, custom-label preservation, accessible naming, projector containment, and Info sponsor isolation. Address any Critical or Important finding test-first.

- [ ] **Step 5: Run the exact release gate**

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
test -s dist/manifest.webmanifest
test -s dist/sw.js
test -s dist/workbox-2fbc6a65.js
grep -q "precacheAndRoute" dist/sw.js
git diff --check
git show --check --oneline HEAD
git status --short
```

Expected: all tests and commands pass; PWA artifacts are non-empty; tracked worktree is clean.

- [ ] **Step 6: Write the release report and present branch integration options**

Record RED/GREEN evidence, mutation results, browser dimensions, review disposition, final gate totals, commit hashes, and any environment limitation. Then invoke `superpowers:finishing-a-development-branch`.

