# Premium Brand Refresh — Final Fix Report

## Scope

This wave addresses only the five final-review findings on branch `codex/premium-ppc-design` in the linked worktree at `/Users/michaelfang/Documents/ChatGPT/PPC/.worktrees/premium-ppc-design`.

## Findings and changes

### Important 1 — Start hover contrast

- Verified the root cause in `src/styles/display.css`: the generic `.control-button:hover` rule set ivory text and only `background-color`. The Start variant's orange gradient remained as its `background-image`, so the small ivory label stayed on the orange gradient.
- Added a later, Start-specific hover rule that keeps `var(--ink-950)` text and uses the `background` shorthand with `var(--orange-400)`. This explicitly clears the inherited gradient image.
- Added a Start-specific focus-visible color override. The existing global focus rule continues to provide a 3 px outline and 3 px offset; Start now uses warm ivory so the ring stays distinct from the orange surface.
- Browser-observed hover colors are `#070705` on `#f3a05a`, a calculated WCAG contrast ratio of `9.59:1`.

### Important 2 — operational text contrast

- Promoted only the four reviewer-cited operational groups from `var(--slate-500)` to `var(--slate-400)`:
  - `.player-stepper span` — Players label at `.55rem`.
  - `.director-nav-footer` — keyboard Start/Pause guidance at `.6rem`.
  - `.danger-zone p` — destructive-action explanation at `.7rem`.
  - `.structure-sticky-actions span` — structure readiness/issue status at `.68rem`.
- Inherited children in those exact groups already use stronger semantic colors (`--slate-300` or `--danger-400`), so no additional selector needed promotion.
- Did not change the `--slate-500` token globally. Remaining uses are borders/status dots, placeholders, sponsor/section labels, and preset/empty-state metadata outside the cited operational groups.

### Minor 1 — configured organization in Director overlay

- Added a scoped integration regression test that opens the Director, edits Organization name through the existing Tournament form, applies the configuration, and asserts the resulting text inside the dialog.
- Updated `DirectorOverlay` to consume the existing tournament context with `useTournament()` and render `state.configuration.organizationName` in its brand header.

### Minor 2 — warm PWA icon plates

- Established the existing generation geometry before changing the files. Replaying the original `sips` pipeline against `#071018` produced zero pixel differences at crest sizes 134 px (`icon-192.png`), 358 px (`icon-512.png`), and 307 px (`maskable-512.png`).
- Regenerated all three icons from `public/branding/ppc-logo.png` with the same crest sizes, centering, and canvas sizes, changing only the opaque pad to exact `#070705`.
- Verified dimensions, corner/background pixels, prior crest bounding boxes, absence of the old exact plate color, and the output SHA-256 hashes.
- Visually inspected the regenerated 512 px icon; the crest remains centered, undistorted, and surrounded by the intended safe area.

### Minor 3 — `ClubLogo` contract coverage

- Added focused `src/components/ClubLogo.test.tsx` characterization coverage for:
  - default `src="/branding/ppc-logo.png"`;
  - meaningful accessible name `Princeton Poker Club logo`;
  - explicit equal `width` and `height` driven by `size`.
- The contract already existed, so these tests passed immediately. This is characterization evidence, not a fabricated RED cycle. Existing display and Director integration tests remain intact.

## TDD evidence — configured organization

### RED

Test added before the production change:

```tsx
it('shows the configured organization name in the director header', async () => {
  const user = userEvent.setup()
  render(<App />)
  await openDirector(user)
  await user.click(screen.getByRole('button', { name: 'Tournament' }))

  await user.clear(screen.getByLabelText('Organization name'))
  await user.type(screen.getByLabelText('Organization name'), 'Garden State Poker Society')
  await user.click(screen.getByRole('button', { name: 'Apply tournament details' }))

  expect(within(screen.getByRole('dialog')).getByText('Garden State Poker Society')).toBeVisible()
})
```

Command and output:

```text
$ npm test -- --run src/features/director/DirectorOverlay.test.tsx

RUN  v4.1.10 /Users/michaelfang/Documents/ChatGPT/PPC/.worktrees/premium-ppc-design

❯ src/features/director/DirectorOverlay.test.tsx (10 tests | 1 failed) 1164ms
    × shows the configured organization name in the director header 193ms

FAIL  src/features/director/DirectorOverlay.test.tsx > DirectorOverlay > shows the configured organization name in the director header
TestingLibraryElementError: Unable to find an element with the text: Garden State Poker Society.

Test Files  1 failed (1)
Tests       1 failed | 9 passed (10)
Duration    2.25s
```

The rendered dialog in the failure contained `Princeton Poker Club`, confirming the test failed for the intended hardcoded-header defect while the configured input held `Garden State Poker Society`.

### GREEN

Minimal production change: import `useTournament`, read `state`, and render `state.configuration.organizationName` in the header.

```text
$ npm test -- --run src/features/director/DirectorOverlay.test.tsx

RUN  v4.1.10 /Users/michaelfang/Documents/ChatGPT/PPC/.worktrees/premium-ppc-design

Test Files  1 passed (1)
Tests       10 passed (10)
Duration    1.81s
```

## Characterization evidence — `ClubLogo`

The focused test was added without altering `ClubLogo` production code.

```text
$ npm test -- --run src/components/ClubLogo.test.tsx src/features/director/DirectorOverlay.test.tsx

RUN  v4.1.10 /Users/michaelfang/Documents/ChatGPT/PPC/.worktrees/premium-ppc-design

Test Files  2 passed (2)
Tests       13 passed (13)
Duration    1.96s
```

## Icon generation and verification

### Geometry reconstruction

The original cool-background images were reconstructed from the transparent brand asset with candidate `sips` sizes. Exact zero-pixel-difference matches were:

```text
public/icons/icon-192.png: i192-134.png — 0 differing pixels
public/icons/icon-512.png: i512-358.png — 0 differing pixels
public/icons/maskable-512.png: mask512-307.png — identical SHA-256
```

### Regeneration commands

```sh
cp public/branding/ppc-logo.png public/icons/icon-192.png
sips -Z 134 public/icons/icon-192.png
sips --padToHeightWidth 192 192 --padColor 070705 public/icons/icon-192.png

cp public/branding/ppc-logo.png public/icons/icon-512.png
sips -Z 358 public/icons/icon-512.png
sips --padToHeightWidth 512 512 --padColor 070705 public/icons/icon-512.png

cp public/branding/ppc-logo.png public/icons/maskable-512.png
sips -Z 307 public/icons/maskable-512.png
sips --padToHeightWidth 512 512 --padColor 070705 public/icons/maskable-512.png
```

### Pixel and size verification output

The verification script asserted each size, corner pixel, prior crest bounding box, and the absence of exact old plate pixels `(7, 16, 24, 255)`.

```text
public/icons/icon-192.png: size=(192, 192), corner=(7, 7, 5, 255), crest_bbox=(31, 31, 160, 160), warm_bg_pixels=23432
public/icons/icon-512.png: size=(512, 512), corner=(7, 7, 5, 255), crest_bbox=(81, 81, 430, 430), warm_bg_pixels=166076
public/icons/maskable-512.png: size=(512, 512), corner=(7, 7, 5, 255), crest_bbox=(105, 105, 406, 406), warm_bg_pixels=191009
```

```text
$ shasum -a 256 public/icons/icon-192.png public/icons/icon-512.png public/icons/maskable-512.png
6165276ecf7cdbec85146a92fdea61ca6acde58bd09dff406cc43f1c64517ef2  public/icons/icon-192.png
374997f2fcb04bead12ca65bfa3e19d180ec4f673c682cc6654410151cf16f36  public/icons/icon-512.png
e71f40d4f4c2f034759fb15cdf5af6fc820121ea21a8d16e06a13c03f97027a8  public/icons/maskable-512.png
```

## Browser verification — Start hover and focus

Ran the Vite development server at `http://127.0.0.1:5173/` and inspected the real rendered Start control in the in-app browser.

Default state:

```text
color: rgb(7, 7, 5)
background-image: linear-gradient(rgb(229, 147, 80), rgb(217, 121, 43))
```

Pointer hover state:

```text
hovered: true
color: rgb(7, 7, 5)
background: rgb(243, 160, 90) none repeat scroll 0% 0% / auto padding-box border-box
background-color: rgb(243, 160, 90)
background-image: none
border-color: rgb(243, 160, 90)
```

Keyboard focus-visible state:

```text
focused: true
focusVisible: true
outline: rgb(255, 249, 232) solid 3px
outline-color: rgb(255, 249, 232)
outline-offset: 3px
```

Calculated contrast:

```text
Start hover contrast #070705 on #f3a05a: 9.59:1
Focus #fff9e8 on surrounding #070705: 19.17:1
```

## Full verification commands and output

### Full test suite

```text
$ npm test -- --run

RUN  v4.1.10 /Users/michaelfang/Documents/ChatGPT/PPC/.worktrees/premium-ppc-design

Test Files  19 passed (19)
Tests       73 passed (73)
Duration    4.66s
```

### Typecheck, lint, and production build

```text
$ npm run typecheck && npm run lint && npm run build

> princeton-poker-tournament-timer@0.1.0 typecheck
> tsc -b --pretty false

> princeton-poker-tournament-timer@0.1.0 lint
> eslint .

> princeton-poker-tournament-timer@0.1.0 build
> npm run typecheck && vite build

> princeton-poker-tournament-timer@0.1.0 typecheck
> tsc -b --pretty false

vite v8.2.1 building client environment for production...
✓ 51 modules transformed.
dist/manifest.webmanifest                          0.51 kB
dist/index.html                                    0.97 kB │ gzip:  0.47 kB
dist/assets/index-V0HYOAIp.css                    36.41 kB │ gzip:  7.75 kB
dist/assets/workbox-window.prod.es5-Bd17z0YL.js    5.65 kB │ gzip:  2.20 kB
dist/assets/index-BTyoxJQj.js                    248.47 kB │ gzip: 74.77 kB
✓ built in 194ms

PWA v1.3.0
mode      generateSW
precache  13 entries (554.65 KiB)
files generated
  dist/sw.js
  dist/workbox-2fbc6a65.js
```

### Diff check

```text
$ git diff --check
[no output; exit 0]
```

### Final pre-commit rerun

After completing this report, the full verification chain was run again:

```text
$ npm test -- --run && npm run typecheck && npm run lint && npm run build && git diff --check
Test Files  19 passed (19)
Tests       73 passed (73)
TypeScript typecheck: exit 0
ESLint: exit 0
Vite production build: 51 modules transformed, built in 115ms
PWA generateSW: 13 precache entries; service worker files generated
git diff --check: no output; exit 0
```

## Self-review

- Re-read every final-review finding and mapped it to a changed selector, component, test, or icon.
- Confirmed the generic hover rule remains unchanged for dark controls, while the later Start-specific rule clears its gradient and retains dark text.
- Confirmed focus-visible remains visually independent of hover and does not remove the existing outline width/offset.
- Confirmed only the four cited operational text groups moved to `--slate-400`; the token itself and decorative `--slate-500` uses were not globally changed.
- Confirmed the overlay test asserts within the dialog, so the already-correct public display cannot satisfy it.
- Confirmed `ClubLogo` characterization tests exercise the real component and independently assert the requested contract.
- Confirmed icon dimensions and exact warm background values, and that all crest bounding boxes match the pre-change assets.
- Reviewed the complete source diff for scope. No timer logic, persistence behavior, PWA manifest values, or unrelated styling changed.

## Concerns

None.
