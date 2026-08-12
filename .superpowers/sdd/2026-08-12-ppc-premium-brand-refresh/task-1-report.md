# Task 1 Report: Integrate the supplied PPC brand asset

## Implementation

- Copied the authorized 320x320 RGBA source PNG to `public/branding/ppc-logo.png` without modification. SHA-256 verification confirms it exactly matches `/Users/michaelfang/Downloads/PPC logo (1).png`.
- Added reusable `ClubLogo`, which renders the local asset with explicit square dimensions and the alt text `Princeton Poker Club logo`.
- Replaced the public display's synthetic `P` mark and the Tournament Director's `TD` monogram with `ClubLogo` while retaining the existing layouts.
- Replaced the 192px, 512px, and maskable 512px install icons using derived copies of the supplied brand asset. Each square icon has a dark `#071018` safe-area pad (29.7% on the standard icons, 40% on the maskable icon), preserving the source logo's aspect ratio without distortion.

## TDD evidence

### RED

1. Added public-display and open-director-overlay accessibility assertions for an image named `Princeton Poker Club logo`.
2. Ran:

   ```sh
   npm test -- src/features/display/TournamentDisplay.test.tsx src/features/director/DirectorOverlay.test.tsx
   ```

3. Result: expected failure — 2 failing assertions, each reporting that no image with the required role and accessible name existed. The remaining 12 focused tests passed.

### GREEN

1. Added `ClubLogo`, connected it to both headers, and added the local brand and icon files.
2. The initial GREEN run exposed the test query's intended scope: both the display and overlay logos are present when the overlay is open. Scoped the overlay assertion to the dialog with `within`.
3. Re-ran the focused suite:

   ```sh
   npm test -- src/features/display/TournamentDisplay.test.tsx src/features/director/DirectorOverlay.test.tsx
   ```

4. Result: 2 test files passed, 14 tests passed.

## Commands and results

```sh
npm test
```

Result: 18 test files passed; 69 tests passed.

```sh
npm run typecheck && npm run lint && npm run build
```

Result: TypeScript typecheck passed, ESLint passed, and Vite/PWA production build passed.

```sh
git diff --check
```

Result: no whitespace errors.

```sh
shasum -a 256 '/Users/michaelfang/Downloads/PPC logo (1).png' public/branding/ppc-logo.png
```

Result: both files have SHA-256 `9b565aa472d7541082828e732181cf7f475d9fceaf47f7585b63e552cd00bb94`.

## Files changed

- `public/branding/ppc-logo.png` (new, exact supplied asset copy)
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/maskable-512.png`
- `src/components/ClubLogo.tsx` (new)
- `src/features/display/TournamentDisplay.tsx`
- `src/features/director/DirectorOverlay.tsx`
- `src/features/display/TournamentDisplay.test.tsx`
- `src/features/director/DirectorOverlay.test.tsx`
- `src/styles/display.css`
- `src/styles/director.css`

## Self-review

An independent review found no findings. The review verified exact source-asset equality, explicit dimensions and alt text, removal of both synthetic marks, square padded icons, and no state/timer/persistence changes. The final diff check, test suite, typecheck, lint, and build are clean.

## Concerns

None. The derived icons intentionally use an opaque dark safe-area background because the local macOS `sips` utility does not accept an RGBA pad color; this preserves legibility and safe-area spacing while keeping all assets local.
