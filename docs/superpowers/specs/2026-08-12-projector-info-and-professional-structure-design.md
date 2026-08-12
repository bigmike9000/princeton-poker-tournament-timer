# Projector Info and Professional Structure Design

## Goal

Prepare the Princeton Poker Club timer for auditorium screen sharing by making operator controls dependable, public information readable without scrolling, and both public and Director surfaces visually quieter and more professional.

The delivered app must:

- preserve a break's exact remaining time when pausing;
- prevent reselecting the current schedule entry from resetting its timer;
- make the Space/arrow shortcuts dependable after a schedule row receives focus;
- show two manually selected, non-scrolling Info pages;
- make 1-, 5-, and 25-value chip colors unmistakable without relying on color alone;
- present breaks once, with a separate subtitle only when it conveys a real operation such as a chip-up;
- improve Susquehanna contrast on black/projector displays;
- refine the Structure editor without reducing its density or accessibility;
- ship the supplied 17-level/two-break structure as both the tournament default and the canonical built-in preset.

## Selected approach

Use a manual two-page Info presentation rather than auto-rotation, scrolling, or accordions.

1. **Overview** contains chips, field totals, prizes, house notes, and the short tournament-rules summary.
2. **Blind Structure** contains all 19 schedule entries in a compact two-column grid.

Persistent `Overview`, `Blind Structure`, and `Close` controls make the state obvious. Nothing advances automatically while the room is reading it.

## Break timing reliability

### Reproduced failure path

`GO_TO_ENTRY` currently reloads the configured duration even when its target is already the current entry. In a running break, clicking the highlighted break changes a partially elapsed value such as `08:44` back to `10:00`. A schedule row is also a button; when it retains focus, the operator's Space shortcut can be interpreted as row activation instead of the global start/pause command.

### Behavior

- `GO_TO_ENTRY` is a no-op when the requested index is already current.
- The explicit Reset Current control remains the only way to reload the current entry's full duration.
- Public schedule-row buttons opt into the tournament shortcuts. Space toggles start/pause and Left/Right navigate levels without also activating the focused row.
- Enter continues to activate a focused schedule row.
- Pausing a manually entered or automatically entered break resolves elapsed wall-clock time once and preserves that exact remainder through resume.

## Canonical tournament data

The bundled state and built-in preset use exactly:

- 80 players;
- 200 starting chips;
- 10 white 1-value chips, 8 red 5-value chips, and 6 green 25-value chips;
- 16,000 chips initially in play;
- 1/2, 2/4, 3/6, 5/10, and 8/16 for 12 minutes without an ante;
- a 10-minute break with `Chip up to 5s`;
- 10/20 through 500/1,000 using a big-blind ante equal to the big blind;
- 10/20 through 400/800 for 15 minutes;
- a second 10-minute break after 40/80 with `Chip up to 25s and 100s`;
- 500/1,000 until the tournament ends.

Poker levels contain no organizer-only notes. `BB ante begins` is public house information, not repeated inside a level row.

## Canonical built-in preset

`Princeton Poker Club Standard` is a stable built-in preset, always listed first and always backed by the canonical structure.

- It uses the stable ID `ppc-standard-v1` instead of a random seed ID.
- It can be loaded or duplicated but not renamed or deleted.
- Existing exact bundled-standard records are upgraded in place.
- Custom presets, including similarly named presets whose structures differ, are preserved.
- If the built-in preset is missing, the repository restores it without disturbing custom presets.

## Public clock and break presentation

Break rows use one primary label:

`BREAK · 10 MIN`

The second line appears only for meaningful operational copy such as `Chip up to 5s`. A blank label, `Break`, or a case-insensitive repetition of the primary label is omitted. The same formatter is shared by the public schedule, current-break presentation, and Info structure.

The current-break hero retains the next-level preview but removes redundant uses of the word `Break`.

## Info overlay

### Shared frame

- The modal retains the existing focus trap, Escape behavior, inert background, shortcut isolation, and focus restoration.
- Its panel is constrained to the viewport and does not vertically scroll at the verification sizes.
- The PPC identity, page tabs, `Page 1 of 2`/`Page 2 of 2`, and Close remain visible.
- Changing pages does not affect the clock or tournament state.
- Page selection resets to Overview each time the overlay opens.

### Page 1 — Overview

The projector composition uses a clear card grid:

- three chip cards with a rendered chip disk, numeric denomination, chip color name, and starting quantity;
- a field summary showing `Starting stack 200`, `80 players`, and `16,000 chips in play` from live configuration;
- prize structure;
- house notes;
- eight concise tournament rules split into two short columns.

Default chip colors are:

- 1-value: white/ivory with a dark outline;
- 5-value: red;
- 25-value: green.

Text and denomination numbers remain present so meaning never depends on color perception.

Configured free-form chip lines that are not one of the three canonical allocation lines remain visible as supplemental information. The live stack/field totals are derived from configuration and never duplicated from stale text.

### Page 2 — Blind Structure

- All 19 entries are visible at once in two ordered columns: entries 1–10 and 11–19.
- Poker rows show level number, blinds, `BBA` when active, and duration.
- Break rows show one break heading, duration, and meaningful chip-up copy.
- The active entry uses a high-contrast copper edge and `CURRENT` badge.
- Rows are compact projector strips rather than large cards.
- The semantic source remains one ordered schedule; visual columns do not change reading order.

At narrow widths the two columns remain, but typography and secondary ante copy compact so ten rows still fit without document or panel scrolling.

## Sponsor presentation

Both sponsor marks use bounded image containment. Susquehanna receives a quiet pale blue-gray plaque with a subtle blue border so the transparent blue artwork remains legible on black screens and projectors. Jane Street keeps its ivory plaque. Neither mark stretches, clips, or dominates the footer.

## Director Structure editor

Keep the compact row model and all draft/apply behavior, but refine its hierarchy:

- sticky desktop column headings within the Director content scroller;
- low-contrast alternating level rows;
- stronger copper-tinted break separators;
- consistent six-pixel corner treatment across row, inputs, and action group;
- a clearer `Level 01`/`Break 01` identity cell;
- a grouped action well with restrained move icons and a separated destructive action;
- aligned numeric inputs using tabular figures;
- lighter borders at rest and stronger orange focus/validation states;
- responsive field labels and full-width note/action cells retained below the existing breakpoints.

All directly operated targets remain at least 44 by 44 pixels. Fieldsets, legends, accessible names, validation, reordering, deletion confirmation, sticky Apply, Cancel, and Until End remain unchanged functionally.

## Data and component boundaries

- A pure break-presentation helper decides whether a subtitle is meaningful.
- A canonical preset descriptor owns the stable built-in identity and sample structure clone.
- Info page state is local UI state in `InfoOverlay`; it never enters persisted tournament state.
- Chip presentation derives known allocation cards from the canonical 10/8/6 distribution and current configuration; user-authored supplementary lines remain plain text.
- No network dependency, remote image, or user-authored HTML is introduced.

## Error and compatibility behavior

- Existing valid tournament snapshots continue to load.
- Existing custom structures are never replaced simply because the app has a new canonical preset.
- Existing exact bundled standard presets upgrade to the canonical structure.
- Malformed preset storage continues to be filtered safely.
- If a sponsor image cannot load, its accessible name remains available.
- If an optional information collection is empty, existing safe defaults still apply.

## Verification

Automated tests must prove:

- pausing/resuming a running break preserves its exact remainder;
- selecting the current entry does not reset it;
- Space/arrow shortcuts work from a focused schedule row without native row activation;
- break subtitles suppress generic/duplicate `Break` copy and retain chip-up operations;
- canonical structure, configuration, allocation, and built-in preset identity are exact;
- the built-in preset is first, non-renamable/non-deletable, self-restoring, and does not overwrite custom presets;
- two Info pages expose correct page state, full content, focus behavior, and no tournament mutation;
- chip cards expose color, value, and quantity accessibly;
- all 19 structure entries and the current marker appear on page 2;
- Susquehanna has the contrast plaque and both sponsor images remain contained;
- Structure editor semantics, fields, controls, validation, and compact responsive contracts survive the visual refactor.

Browser QA must cover 1920×1080 and 1366×768 projector/laptop views, the 800px Director transition, and 390×844 narrow view. At each size verify no document or Info-panel scrolling, no clipped text/actions/logos, readable contrast, and 44-pixel controls. The projector pass must also verify that all public-clock essentials remain visible with browser zoom at 100 percent.

## Non-goals

This phase does not add seating/table balancing, payout accounting, hand-for-hand mode, remote synchronization, elimination tracking, or an action clock. It does not auto-rotate Info pages or alter Director-configured custom poker-level notes.
