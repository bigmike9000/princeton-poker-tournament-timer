# PPC Timer — Premium Brand Refresh Design

## Objective

Elevate the existing Princeton Poker Club tournament timer from a capable dark dashboard into a distinctive, premium club broadcast surface. The supplied PPC chip logo is the visual anchor. Tournament information must remain immediately readable across a room, and the application must retain all existing behavior, accessibility, responsiveness, and offline operation.

## Selected direction: Heritage Broadcast

The refresh combines the gravity of an Ivy club program with the clarity of a live sports broadcast. It uses near-black ink and felt tones, burnished copper-orange, warm ivory, and restrained brass keylines. The effect should feel tailored and established rather than glossy, theatrical, or casino-themed.

Two alternatives were rejected:

- **Casino Luxury:** black, bright gold, gloss, and dramatic bloom would be visually familiar but generic and less specific to PPC.
- **Ivy Editorial:** parchment, forest green, and book-like typography would feel collegiate but lose contrast in a dim tournament room.

## Brand asset treatment

- Include the user-supplied PPC logo as a local application asset; never fetch it remotely.
- Render the logo without cropping or distortion in the public display header and Tournament Director header.
- Give the public logo a subtle inset halo and fine circular keyline so its orange chip silhouette reads against the dark surface.
- Keep the organization and event names as live configuration values.
- Replace the existing generic P/diamond mark. Use the supplied mark for install icons as well, with enough dark safe area for maskable platforms.
- Provide meaningful image alternative text where the brand identifies the application.

## Visual system

### Palette

- **Black felt:** the dominant background, with extremely subtle radial depth and a low-contrast woven texture made in CSS.
- **Ink:** panel and dock surfaces with warmer undertones than the current blue-gray UI.
- **PPC orange / copper:** primary emphasis, active states, and status details; avoid coating entire surfaces in orange.
- **Antique brass:** quiet borders and separators, used sparingly.
- **Warm ivory:** primary text and timer digits.
- **Sage and coral:** live/success and destructive states, tuned to remain accessible against ink.

### Typography

- Use a local-first heritage serif stack for club identity, section titles, and a few editorial labels.
- Keep the large timer and all numeric operating data in a narrow, tabular sans-serif stack for room readability.
- Increase typographic contrast through scale, tracking, and weight rather than adding fonts or network dependencies.

### Shape and depth

- Prefer crisp, thin frames with small corner cuts or restrained radii over generic floating cards.
- Use inset highlights, layered 1px rules, and modest shadows instead of heavy glassmorphism.
- Introduce a subtle top-edge copper line and a broad watermark ring behind the clock to create depth without competing with data.

## Public display

### Header

- Increase the header's ceremonial presence with the PPC crest, a small “Official Tournament Clock” eyebrow, and configured club/tournament names.
- Preserve the live/paused state at the far edge, but restyle it as a compact broadcast status flag.

### Main clock stage

- Keep the level/blind block above the dominant timer.
- Give the timer a warmer ivory treatment, fine orange rule, and restrained glow only in urgent states.
- Reframe statistics as a single instrument panel with distinct cells and more intentional label/number hierarchy.
- Keep sponsor labels understated and configurable.

### Structure rail

- Treat the right column as a tournament program: serif title, small “schedule” folio, hairline dividers, and a more pronounced current-level plaque.
- Completed levels remain quiet, current and future levels stay easily scannable.

### Control dock

- Preserve every action and shortcut.
- Consolidate the visual treatment into a tailored dark dock with a copper top rule, clear primary start/pause action, and a premium outlined Tournament Director button.

## Tournament Director overlay

- Carry the same crest, heritage serif titles, copper edge accents, and warm card surfaces into the overlay.
- Make navigation feel like a control console: cleaner active state, small numeric folios, and precise hover/focus treatments.
- Keep current density and responsive behavior so editing workflows remain efficient.

## Responsive behavior

- Preserve the two-column broadcast layout on wide screens and existing single-column fallback below 900px.
- At short desktop heights, reduce decoration before reducing information size.
- On mobile, scale the crest and title, allow the status flag to wrap, keep the timer dominant, and retain touch targets of at least 44px.

## Accessibility and operational constraints

- Maintain semantic landmarks, status text, focus visibility, keyboard shortcuts, dialog focus trapping, and reduced-motion support.
- The logo cannot be the sole representation of state or instruction.
- Avoid low-contrast copper body copy; orange is reserved for sufficiently large or emphasized text.
- No functionality, data model, timer logic, persistence, or PWA behavior changes are part of this refresh.
- The final production build must remain fully local and installable.

## Acceptance criteria

- The actual PPC logo is visible and undistorted in the main header and Tournament Director overlay.
- The synthetic diamond monogram is removed.
- The display feels visually coherent at 1920×1080, 1366×768, and mobile width without clipped controls or hidden tournament data.
- Existing tests pass, new brand integration tests pass, and typecheck, lint, and production build succeed.
- Browser QA confirms the main display and overlay have no horizontal overflow at target sizes.

