# PPC Timer Premium Brand Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply a premium Heritage Broadcast visual system to the existing timer using the supplied PPC logo, without changing tournament behavior.

**Architecture:** Add one reusable presentational brand component and local image assets, then restyle the existing semantic component structure through the shared token, display, director, and shell stylesheets. Existing state, domain, persistence, and service architecture remains untouched.

**Tech Stack:** React 19, TypeScript, Vite PWA, CSS, Vitest, Testing Library

---

## Task 1: Integrate the supplied PPC brand asset

**Files:**
- Create: `public/branding/ppc-logo.png`
- Create: `src/components/ClubLogo.tsx`
- Modify: `src/features/display/TournamentDisplay.tsx`
- Modify: `src/features/director/DirectorOverlay.tsx`
- Modify: `src/features/display/TournamentDisplay.test.tsx`
- Modify: `src/features/director/DirectorOverlay.test.tsx`
- Replace: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`

- [ ] Add failing assertions that the public display and open director overlay expose an image named “Princeton Poker Club logo.”
- [ ] Run the focused tests and confirm the assertions fail because the logo is absent.
- [ ] Add a reusable `ClubLogo` component that uses the local brand asset with explicit dimensions and descriptive alt text.
- [ ] Replace the synthetic public mark and director monogram with the component.
- [ ] Copy the supplied logo into the PWA and generate square install icons with suitable safe area.
- [ ] Run focused tests and confirm they pass.

## Task 2: Build the premium public broadcast surface

**Files:**
- Modify: `src/features/display/TournamentDisplay.tsx`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/display.css`

- [ ] Add the “Official Tournament Clock” header eyebrow and the structural hooks needed for a crest lockup and broadcast framing.
- [ ] Retune the shared palette toward black felt, ink, copper, brass, and warm ivory while preserving accessible state colors.
- [ ] Replace generic grid/glass styling with restrained texture, keylines, inset depth, and an ornamental clock watermark built entirely in CSS.
- [ ] Refine the hierarchy and framing of current level, blinds, clock, stats, structure rail, sponsor strip, and live marker.
- [ ] Restyle the fixed control rail into a premium dock without changing labels, order, behavior, or touch targets.
- [ ] Tune the existing wide, short-height, tablet, and mobile breakpoints for the new crest and spacing.

## Task 3: Carry the system through operational surfaces

**Files:**
- Modify: `src/styles/director.css`
- Modify: `src/styles/index.css`
- Modify: `index.html`

- [ ] Restyle the Tournament Director header, navigation, form cards, buttons, inputs, confirmation dialogs, and sticky action bars with the same heritage system.
- [ ] Refine recovery and update surfaces so they belong to the branded application.
- [ ] Update document and PWA theme colors to the new ink-black value.
- [ ] Keep all focus, hover, danger, success, and reduced-motion states clear.

## Task 4: Verify behavior and presentation

**Files:**
- Modify only if verification exposes a defect.

- [ ] Run the full Vitest suite.
- [ ] Run TypeScript typecheck and ESLint.
- [ ] Produce the Vite production build and confirm the PWA includes the branding asset and icons.
- [ ] Inspect the main display and Tournament Director overlay in a real browser at 1920×1080 and 1366×768.
- [ ] Inspect a mobile-width layout and confirm there is no horizontal overflow.
- [ ] Confirm the crest is crisp, undistorted, readable, and does not displace operational data.
- [ ] Commit the implementation and integrate the verified branch.

