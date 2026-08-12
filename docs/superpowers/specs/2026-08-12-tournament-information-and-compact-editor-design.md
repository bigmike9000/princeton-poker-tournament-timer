# Tournament Information Overlay and Compact Structure Editor Design

**Date:** 2026-08-12

## Goal

Make the Tournament Director's Structure page materially faster to scan and edit, add an accessible public tournament-information overlay, and replace generic sponsor placeholders with the supplied Jane Street and Susquehanna logos without weakening the clock's offline-first behavior.

## Approved product decisions

- The Structure editor uses compact responsive rows rather than large cards, a desktop-only spreadsheet, or collapsed accordions.
- A new `Info` control sits immediately before Full Screen in the public bottom rail.
- Info opens as a modal overlay over the running clock. Opening or closing it never pauses, resets, or changes the tournament.
- Prize information and event-specific house notes are editable in Director → Tournament.
- The app does not invent a payout schedule. The default prize message says the Tournament Director will announce it before play.
- General rules are a short built-in summary aligned with the current Poker TDA rules. They are guidance, not a replacement for house rules; the overlay states that Tournament Director decisions govern.
- The supplied sponsor logos are local bundled assets. No remote image or network dependency is introduced.
- Existing customized/progressed saved tournaments remain untouched. Missing information data receives read-time defaults rather than destructive snapshot replacement.

## Compact Structure editor

### Desktop layout

The editor renders a shared column heading followed by one dense row per entry. A poker level exposes:

1. level identity;
2. duration / `Until end`;
3. small blind;
4. big blind;
5. ante amount;
6. ante type;
7. optional note;
8. move/delete actions.

Each desktop row targets approximately 56–64 px height when it has no validation message. Inputs use the existing premium colors and numeric typography but reduce padding and label duplication. Column headings provide the visible context; every input retains its own accessible label.

Breaks use the same outer row rhythm with only label, duration, and order/delete actions. Their copper treatment remains visually distinct.

### Responsive behavior

- At medium widths, fields wrap into two concise lines while keeping actions together.
- Below 620 px, visible per-field labels return and the row becomes a compact two-column grid.
- Every directly operated target remains at least 44 px high/wide where applicable.
- Validation messages appear adjacent to the affected field and may expand only that row.
- Reordering, current-entry delete confirmation, sticky Apply, draft Cancel, notes, and terminal-only `Until end` validation retain their current behavior.

## Information data model

Add an optional top-level information block to `TournamentState`:

```ts
interface TournamentInformation {
  chipLines: string[]
  prizeLines: string[]
  houseNotes: string[]
}
```

The block is optional for backward compatibility. A pure selector returns defaults when it is absent. The initial state stores:

- `10 × 1-value chips`
- `8 × 5-value chips`
- `6 × 25-value chips`
- `Starting stack: 200 chips`

Default prize copy: `Prize structure will be announced by the Tournament Director before play begins.`

Default house notes mention that the big-blind ante begins at 10/20 and chip-ups occur during the scheduled breaks shown in the structure.

Director → Tournament edits the three collections as newline-separated textareas. Blank lines are removed on save; individual lines are trimmed; empty collections fall back to the safe defaults. A dedicated reducer action updates the complete information block atomically.

Snapshot parsing accepts an absent information block. If present, it must contain only arrays of bounded strings. The snapshot version remains compatible. Presets remain structure-only and require no schema change.

## Public Info overlay

### Interaction

- `Info` appears immediately to the left of Full Screen.
- The overlay uses `role="dialog"`, `aria-modal="true"`, a descriptive title, initial focus on Close, a focus trap, Escape-to-close, background `inert`, and focus restoration to the Info trigger after inert is removed.
- Director and Info cannot be open at the same time.
- Global clock shortcuts do not fire while focus is within the overlay.
- The timer continues running behind the overlay.

### Content

The overlay header repeats the PPC mark and tournament name. Its responsive content grid includes:

1. **Chip denominations** — configured chip lines plus the current starting stack.
2. **Prize structure** — configured prize lines or the safe announcement placeholder.
3. **Blind structure** — every current structure entry with duration, blinds, ante, break label, and notes; current entry highlighted and scrolled into view.
4. **Tournament rules & information** — configured house notes followed by a concise built-in rules summary.

The built-in summary paraphrases these operational principles:

- fairness and the best interest of the game guide floor decisions;
- players protect their hands, act in turn, and make actions clear;
- one player to a hand; no coaching during a live hand;
- chips remain visible and countable;
- electronic devices are not used while holding a live hand;
- all hands are tabled for an all-in showdown;
- clear verbal declarations are binding;
- the Tournament Director administers clock calls and final rulings.

The footer links to the 2024 Poker TDA rules and states: `PPC house rules and Tournament Director decisions govern this event.` The app ships the summary locally; the external link is optional reference material and is not required for offline operation.

## Sponsor presentation

Bundle optimized local assets:

- `/branding/jane-street.png`
- `/branding/susquehanna.png`

Set new initial sponsor labels to `Jane Street` and `Susquehanna`. A `SponsorStrip` component maps those canonical labels to the supplied images and renders text for unknown/custom labels. For compatibility with already-saved untouched placeholder state, the two exact `SPONSOR` placeholders map by slot to the supplied logos. Custom labels never get silently replaced.

The Jane Street asset appears on a restrained ivory plaque because its supplied black mark needs a light field. The Susquehanna mark retains its transparent blue artwork. Both use `object-fit: contain`, bounded dimensions, accurate alt text, and no stretching.

Director sponsor inputs remain editable and are renamed from neutral placeholders to sponsor display names.

## Error handling and safeguards

- Invalid information JSON causes the same safe snapshot recovery behavior as other malformed state.
- Text line counts and lengths are bounded to prevent pathological stored content and overlay overflow.
- Rendering uses text nodes only; no user-authored HTML is accepted.
- Closing the overlay never changes the timer, current level, player count, or settings.
- If a sponsor image cannot load, its accessible name and text fallback remain available.

## Verification

Automated coverage must prove:

- initial and fallback information defaults;
- information reducer and snapshot round-trip/backward compatibility;
- malformed information recovery;
- Director newline editor normalization;
- overlay content, current structure highlight, `Until end`, focus trap, Escape, focus restoration, and unchanged running state;
- Info button order before Full Screen;
- canonical sponsor image rendering and custom-label fallback;
- compact Structure rows preserve every edit/reorder/delete/apply behavior;
- no document-level overflow and 44 px controls at desktop, laptop, and mobile breakpoints.

The final gate is `git diff --check`, full tests, typecheck, lint, production build, PWA artifact inspection, and browser QA at 1920×1080, 1366×768, and 390×844.

## Future feature assessment (not in this implementation)

Modern tournament-management products commonly add capabilities beyond a clock: randomized seating and table balancing, registration/re-entry/add-on accounting, payout/prize-pool calculation, elimination order and results, hand-for-hand/bubble mode, synchronized remote displays and mobile controls, player-facing QR views, action clocks, and league standings. For an 80-player PPC event, the highest-value next phase is seating/table balancing, followed by registration/payout accounting and hand-for-hand mode. These are intentionally excluded here so the information overlay and editor-density work remain focused and offline-safe.
