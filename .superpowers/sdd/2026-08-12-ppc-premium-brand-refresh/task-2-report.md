# Task 2 Report: Build the premium public broadcast surface

## Implementation

- Added the exact `Official Tournament Clock` eyebrow and introduced a `club-mark` crest frame around the existing local `ClubLogo` component. The organization and tournament names remain live configuration values, and the running/paused/complete status text is unchanged.
- Retuned the shared design tokens from cool blue-gray to black felt, warm ink, copper, antique brass, warm ivory, sage, and coral. Added system-only heritage serif and narrow tabular numeric stacks; no remote font or asset dependency was introduced.
- Rebuilt the public stage treatment with subtle CSS-only woven texture, a copper top rule, layered brass keylines, inset depth, and an ornamental clock-face watermark made from radial and repeating conic gradients.
- Refined the current level, blinds, clock, break preview, stats instrument panel, sponsor strip, structure folio, current-level plaque, live marker, and completed/upcoming row hierarchy without changing their content or ordering.
- Restyled the fixed control rail as a tailored ink dock with a copper top edge, a clear copper start/pause treatment, and an outlined Tournament Director action. Existing labels, actions, shortcuts, disabled states, and minimum control heights are unchanged.
- Tuned the short-height, 1100px, 900px, 640px, and 430px layouts for crest scale, decoration, spacing, structure scrolling, status wrapping, and mobile hierarchy. At short desktop heights the structure list now scrolls inside its fixed broadcast frame instead of increasing the page height.

## Commands and results

```sh
npm test -- --run
```

Baseline result: 18 test files passed; 69 tests passed.

```sh
git diff --check && npm run typecheck && npm run lint && npm test -- --run && npm run build
```

Result: no whitespace errors; TypeScript typecheck passed; ESLint passed; 18 test files and all 69 tests passed; the Vite/PWA production build completed successfully with 51 transformed modules and 13 precache entries.

Browser QA used the local Vite application at the required 1920x1080 and 1366x768 desktop targets plus a 390x844 mobile target. Results:

- 1920x1080: two-column broadcast frame, dominant clock, crest lockup, structure rail, and fixed control dock fit with zero horizontal overflow.
- 1366x768: the stage and structure rail end exactly at the 676px dock boundary; the structure list scrolls internally; document width and height match the viewport; all controls fit.
- 390x844: zero horizontal overflow; crest, configured names, and status flag wrap cleanly; the timer remains dominant; all eight control buttons measure 54.4px high.
- Browser console: zero warnings and zero errors.

No snapshot tests were added, as directed by the Task 2 brief for this CSS/presentational work.

## Files changed

- `src/features/display/TournamentDisplay.tsx`
- `src/styles/tokens.css`
- `src/styles/display.css`
- `.superpowers/sdd/2026-08-12-ppc-premium-brand-refresh/task-2-report.md`

## Self-review

- Confirmed the new eyebrow uses the required text verbatim and the existing `ClubLogo` retains its meaningful alternative text and undistorted `object-fit: contain` treatment.
- Confirmed the only TSX changes are presentational header structure; timer state, selectors, dispatches, persistence, services, labels, control order, and actions are untouched.
- Confirmed all visible numeric operating data uses the shared narrow, tabular system stack, while selected identity and section headings use a local system serif stack.
- Confirmed orange is reserved for emphasized labels, rules, current state, and controls; primary body and numeric text use high-contrast warm ivory.
- Confirmed the CSS texture and clock watermark are non-interactive pseudo-elements beneath live content, reduced-motion behavior remains present, and focus visibility remains a 3px outline.
- Confirmed every public control remains above the 44px touch-target requirement and responsive browser checks show no horizontal overflow at the requested targets.
- Reviewed the final diff for unrelated behavior changes and found none.

## Concerns

None. Browsers without CSS masking support will simply render less of the decorative watermark/texture treatment; all content, contrast, layout, and behavior remain intact.

## Fix Round 1

### Review finding addressed

The upcoming-row ante and level-duration values were using `--slate-500` at `.59rem` and `.69rem`, respectively. Updated both operational metadata rules to `--slate-400` and restored their prior minimum sizes: `.61rem` for ante text and `.7rem` for level duration. The current-row orange ante override remains unchanged. No unrelated styling was modified.

### Exact command and output

```sh
git diff --check && npm run lint && npm run build && npm test -- --run src/features/display/TournamentDisplay.test.tsx
```

```text
git diff --check produced no output and exited 0.

> princeton-poker-tournament-timer@0.1.0 lint
> eslint .

> princeton-poker-tournament-timer@0.1.0 build
> npm run typecheck && vite build

> princeton-poker-tournament-timer@0.1.0 typecheck
> tsc -b --pretty false

vite v8.2.1 building client environment for production...
transforming...✓ 51 modules transformed.
rendering chunks...
computing gzip size...
dist/manifest.webmanifest                          0.51 kB
dist/index.html                                    0.97 kB │ gzip:  0.47 kB
dist/assets/index-BrL2gnhi.css                    32.07 kB │ gzip:  7.29 kB
dist/assets/workbox-window.prod.es5-Bd17z0YL.js    5.65 kB │ gzip:  2.20 kB
dist/assets/index-NwwR7x0B.js                    248.44 kB │ gzip: 74.77 kB

✓ built in 121ms

PWA v1.3.0
mode      generateSW
precache  13 entries (551.24 KiB)
files generated
  dist/sw.js
  dist/workbox-2fbc6a65.js

> princeton-poker-tournament-timer@0.1.0 test
> vitest --run src/features/display/TournamentDisplay.test.tsx

 RUN  v4.1.10 /Users/michaelfang/Documents/ChatGPT/PPC/.worktrees/premium-ppc-design

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  755ms
```

### Fix self-review

- Confirmed the diff contains only the two requested color/size corrections plus this report entry.
- Confirmed upcoming operational metadata now uses the higher-contrast `--slate-400` token.
- Confirmed neither value is smaller than its pre-refresh size.
- Confirmed current-level state emphasis, content, behavior, and responsive rules are unchanged.

### Fix concerns

None.
