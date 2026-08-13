# Control, Editor, and Typography Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten the active-break message and public control rail, modernize the typography boundary, and turn the Structure editor from nested cards into a compact professional data grid.

**Architecture:** Preserve component behavior and accessibility contracts while changing only focused markup classes and CSS presentation. Introduce explicit offline-safe typography tokens, keep one stable break live region, add semantic modifier classes for public navigation buttons, and flatten existing Structure wrapper groups rather than restructuring editor state or validation logic.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS, Vite/PWA, in-app Browser QA.

## Global Constraints

- The active break message visibly contains only its instruction; it has no label, border, background, shadow, or framed card.
- The player stepper is exactly 3.4rem high like adjacent controls, while its editable input remains at least 44px high.
- Utility icon buttons are borderless and transparent at rest, remain at least 44 × 44px, and use a subtle circular hover/focus/active surface.
- Previous and Next are quiet ghost controls; Start/Pause remains the only strong orange action.
- The Structure editor removes outer table, field-group, and action-group boxes while preserving 44px controls, semantics, validation, draft behavior, and responsive containment.
- Serif typography is limited to brand/tournament identity and the public `LEVEL` / `BREAK` hero; operational headings use the interface sans; clocks and numeric data use the numeric stack.
- No external font files, network dependencies, timing changes, preset changes, or Tournament Info redesign.

---

## File Map

- `src/styles/tokens.css`: offline-safe heritage, interface, and numeric font tokens.
- `src/styles/index.css`: root interface font.
- `src/features/display/BreakProcedure.tsx`: instruction-only stable live region.
- `src/features/display/DisplayControls.tsx`: modifier classes for ghost navigation.
- `src/features/display/PlayerCountControl.tsx`: existing semantic player control; no behavior change.
- `src/styles/display.css`: flat message and polished control rail.
- `src/features/display/TournamentDisplay.test.tsx`: display DOM and CSS contracts.
- `src/features/display/PlayerCountControl.test.tsx`: equal-height/input-target contracts and editing behavior.
- `src/styles/director.css`: flat Structure data-grid presentation.
- `src/features/director/StructureEditor.test.tsx`: flattened layout, typography, accessibility, and responsive contracts.

### Task 1: Typography boundary and flat break message

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/index.css`
- Modify: `src/styles/brand.css`
- Modify: `src/styles/display.css`
- Modify: `src/features/display/BreakProcedure.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Produces CSS tokens `--font-interface`, refined `--font-heritage`, and refined `--font-numeric`.
- Preserves `BreakProcedure({ entry }: { entry: StructureEntry })` and its stable atomic status node.

- [ ] **Step 1: Write failing DOM tests for the plain message**

Require an active break status to contain the instruction but not the text `Break procedure`, while the same node identity remains stable across level-to-break navigation.

```ts
expect(status).toHaveTextContent('Count and stack white chips in stacks of 10')
expect(status).not.toHaveTextContent('Break procedure')
expect(updatedStatus).toBe(status)
```

- [ ] **Step 2: Write failing CSS/font contracts**

Require the new literal font stacks, `:root` application of `var(--font-interface)`, and a `.break-procedure` rule with no border/background/box-shadow and only minimal margin/text layout. Require the public hero and shared brand title to retain `var(--font-heritage)` while `.structure-header h2` uses `var(--font-interface)`.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx`

Expected: failures identify the visible `Break procedure` label, card styling, missing interface token, and operational serif heading.

- [ ] **Step 4: Implement the typography tokens and message**

Add:

```css
--font-interface: "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
--font-heritage: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
--font-numeric: "DIN Alternate", "Arial Narrow", "Aptos Narrow", "Roboto Condensed", ui-sans-serif, system-ui, sans-serif;
```

Remove the visible label from `BreakProcedure`; keep the stable empty status node, `role="status"`, and `aria-atomic="true"`. Flatten `.break-procedure` to a plain instruction line with no framed-surface declarations. Apply the interface token to root and operational schedule heading only; preserve brand/hero heritage usage.

- [ ] **Step 5: Run GREEN and mutation check**

Run the focused test. Temporarily restore the visible label and confirm the instruction-only test fails; restore and rerun GREEN.

- [ ] **Step 6: Commit**

Run: `npm run typecheck && npm run lint && git diff --check`

Commit: `style: flatten active break messaging`

### Task 2: Equal-height and quieter public controls

**Files:**
- Modify: `src/features/display/DisplayControls.tsx`
- Modify: `src/styles/display.css`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/features/display/PlayerCountControl.test.tsx`

**Interfaces:**
- Adds presentation-only class `control-button--nav` to Previous and Next.
- Preserves all labels, dispatch actions, editable player behavior, icon names, mute pressed state, and fullscreen error behavior.

- [ ] **Step 1: Write failing player-control contracts**

Require `.player-stepper` to declare `height: 3.4rem` and `min-height: 3.4rem`, its center wrapper to use positioned internal layout without vertical padding, and its input to fill the 3.4rem group while remaining at least 2.75rem/44px high. Preserve existing edit, Enter, Escape, eliminate, and restore behavior tests.

- [ ] **Step 2: Write failing public-control contracts**

Require Previous and Next to render `control-button--nav`. Require the nav rule and utility icon rule to be transparent/borderless at rest; require the utility rule to be 3.4rem square with `border-radius: 50%` for interaction geometry; require hover/focus/active rules to provide a subtle circular surface. Require no change to `.control-button--start` primary styling.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx src/features/display/PlayerCountControl.test.tsx`

Expected: failures show the 77px-generating stepper layout, missing nav modifiers, and bordered rectangular utilities.

- [ ] **Step 4: Implement equal-height player layout**

Set the outer group to an exact 3.4rem height. Make its center `div` positioned with no vertical padding; position `Players` at the top inside the group; keep the input full-height with top padding so its number remains visually centered beneath the label. Keep inset focus outlines and clipped outer corners.

- [ ] **Step 5: Implement ghost navigation and icon-only utilities**

Add `control-button--nav` to Previous/Next. Remove resting border/background/shadow from nav and utilities; retain disabled opacity and clear hover/focus states. Make utility buttons circular in interaction geometry, with no persistent circle/box at rest.

- [ ] **Step 6: Run GREEN and mutation checks**

Run focused tests. Temporarily remove exact player height and utility resting border removal one at a time; confirm each relevant contract fails; restore and rerun GREEN.

- [ ] **Step 7: Commit**

Run: `npm run typecheck && npm run lint && git diff --check`

Commit: `style: simplify public clock controls`

### Task 3: Flatten the Structure editor

**Files:**
- Modify: `src/styles/director.css`
- Modify: `src/features/director/StructureEditor.test.tsx`

**Interfaces:**
- No TypeScript component API or reducer changes.
- Preserves current `StructureEditor` and `StructureRow` DOM semantics; wrapper classes remain as layout hooks but lose card presentation.

- [ ] **Step 1: Write failing flat-grid CSS contracts**

Require:

```ts
expect(tableRule).toMatch(/border:\s*0/)
expect(tableRule).toMatch(/background:\s*transparent/)
expect(tableRule).not.toMatch(/box-shadow:/)
expect(groupRule).toMatch(/border:\s*0/)
expect(groupRule).toMatch(/background:\s*transparent/)
expect(groupRule).toMatch(/padding:\s*0/)
expect(actionRule).toMatch(/border:\s*0/)
expect(actionRule).toMatch(/background:\s*transparent/)
```

Also require rows to use a single bottom divider, inputs/actions to remain 2.75rem/44px, and operational headings/row identity to use `var(--font-interface)`.

- [ ] **Step 2: Write responsive and behavior preservation tests**

Protect the existing 1180/760/620 layout contracts, no absolute action positioning, fieldset/legend semantics, validation `aria-invalid` / `aria-describedby`, Cancel restoration, Add/Move/Delete/Apply behavior, and 44px action targets.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run src/features/director/StructureEditor.test.tsx src/features/director/DirectorOverlay.test.tsx`

Expected: flat wrapper/group/action and interface-font assertions fail against nested boxes.

- [ ] **Step 4: Flatten table, rows, groups, and actions**

Remove outer table border/background/shadow, boxed alternating rows, field-group shells, and action-group shell. Keep subtle row dividers, a restrained break tint/accent, compact gaps, 44px inputs/buttons, and current validation styles. Lighten the sticky action footer to a top divider and transparent/near-transparent background.

- [ ] **Step 5: Run GREEN and mutation check**

Run focused tests. Temporarily restore the field-group border and confirm the flat-grid contract fails; restore and rerun GREEN.

- [ ] **Step 6: Browser geometry check before commit**

On a development/preview build, measure desktop row height and verify the group wrappers report zero border and transparent background. At 968px, 800px, and 390px verify no horizontal document/editor overflow and no escaped actions. If browser access is unavailable, document the limitation; do not substitute standalone Playwright.

- [ ] **Step 7: Full implementation gate and commit**

Run:

```bash
npm test -- --run
npm run typecheck
npm run lint
git diff --check
```

Commit: `style: flatten tournament structure editor`

### Task 4: Independent review, release gate, and preview handoff

**Files:**
- Modify source/tests only if review or browser evidence exposes a real defect.

**Interfaces:**
- Produces a reviewed master build and refreshed user preview on port 4185.

- [ ] **Step 1: Request whole-branch review**

Use `superpowers:requesting-code-review` with the design/plan and complete branch diff. Fix every valid Critical/Important issue test-first in one fix wave and run one scoped re-review.

- [ ] **Step 2: Run the exact release gate**

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
test -s dist/manifest.webmanifest
test -s dist/sw.js
find dist -maxdepth 1 -name 'workbox-*.js' -type f -size +0c | grep -q .
rg -q 'precacheAndRoute' dist/sw.js
git diff --check
git status --short
```

- [ ] **Step 3: In-app Browser public-display QA**

At a projector viewport and 390×844, verify the active message has only instruction text and no box, player control height equals adjacent 3.4rem controls, utility icons have no resting border, all targets are at least 44px, Prev/Next are visually quiet, no horizontal overflow exists, and console warnings/errors are zero.

- [ ] **Step 4: In-app Browser Structure editor QA**

At 1280×720, 968×900, 800×900, and 390×844, verify flat table/group/action wrappers, compact readable rows, aligned headers/fields/actions, 44px inputs/buttons, validation and break-row distinction, no clipped text, and no horizontal overflow.

- [ ] **Step 5: Integrate and refresh preview**

Fast-forward `master`, rerun the merged-tree test suite, rebuild from master, restart the user-facing server on `0.0.0.0:4185`, open a fresh-origin deliverable tab, verify current hashed assets and core DOM contracts, and report the LAN URL.
