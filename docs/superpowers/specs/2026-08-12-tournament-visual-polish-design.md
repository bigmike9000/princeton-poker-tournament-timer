# Tournament Visual Polish Design

**Date:** 2026-08-12

## Goal

Improve the projector-facing information, blind-structure composition, main PPC lockup, and Tournament Director structure editor so the program feels quieter, clearer, and more professional without weakening live-operation speed or saved-data compatibility.

## Design principles

- Preserve the established dark ink, ivory, copper, and orange visual language.
- Prefer grouped information and consistent alignment over decorative panels.
- Keep public text readable from an auditorium and keep every interactive target at least 44 by 44 CSS pixels.
- Do not add scrolling to projector-safe Tournament Info pages.
- Preserve all existing saved tournaments, custom presets, level notes, sponsor labels, and configured tournament information.

## Canonical default structure

`sampleStructure` remains the single canonical schedule for:

- New tournaments.
- Full tournament reset.
- The protected `Princeton Poker Club Standard` built-in preset.

The exact structure remains:

- 1/2, 2/4, 3/6, 5/10, and 8/16 for 12 minutes with no ante.
- A 10-minute break.
- 10/20 through 40/80 for 15 minutes with a big-blind ante.
- A 10-minute break.
- 50/100 through 400/800 for 15 minutes with a big-blind ante.
- 500/1000 with a big-blind ante, untimed until the tournament ends.

The 80-player, 200-chip starting configuration and 16,000 chips in play remain unchanged. Existing saved tournament progress is never overwritten merely because defaults are reaffirmed.

## Tournament Info overview

### Chip denominations

The chip card becomes a compact five-denomination rack:

| Value | Color | Supporting label |
|---:|---|---|
| 1 | White | 10 chips |
| 5 | Red | 8 chips |
| 25 | Green | 6 chips |
| 100 | Black | Color-up chip |
| 500 | Purple | Color-up chip |

The first three remain the 200-chip starting allocation. Black 100 and purple 500 are explicitly color-up denominations and do not imply that they are included in a starting stack.

Chip disks must have clearly distinguishable fills, borders, and high-contrast values. The black disk uses ivory value text and a subtle brass edge; the purple disk uses ivory value text and a distinct purple fill. Their accessible names are `Black 100-value chip` and `Purple 500-value chip`.

The existing live totals—Starting stack, Players, and Chips in play—remain.

### Prize and sponsors column

The right column retains the exact eight-place prize structure. Directly beneath it, a compact `Tournament sponsors` block renders the current configured sponsor labels with the same canonical Jane Street and Susquehanna image assets used on the main display. Custom sponsor labels remain text marks.

Sponsor rendering moves into one shared mark-list component consumed by the main sponsor strip and Tournament Info, so canonical mapping, fallback behavior, alt text, and contrast treatment cannot drift. Susquehanna retains its light contrast plaque.

The reminder `Keep chips visible and countable.` remains below the sponsor block. The default Overview must remain fixed and non-scrolling at 1920x1080, 1366x768, and 390x844.

## Tournament Info blind structure

The two-column schedule is deliberately split before the second break:

- Left column: entries 1–11, ending with Level 10 (40/80).
- Right column: entries 12–19, beginning with the second 10-minute break.

The grid uses 11 row tracks and explicit `data-column` values that match the visual split.

Breaks on the Info structure page display only `BREAK · 10 MIN`. Chip-up subtitles and chip-up wording are omitted from both visible copy and accessible names on this page. The main public clock and current-break hero continue to show operational chip-up descriptions.

The second Info page remains fixed and non-scrolling, with all 19 entries visible and the current marker preserved.

## Main PPC lockup

All three primary surfaces retain the shared semantic `ClubBrandLockup` hierarchy:

1. PPC logo.
2. Small orange uppercase organization name.
3. Prominent ivory heritage page title.

The main clock no longer reverses that hierarchy with an oversized heritage organization line and tiny uppercase tournament name. Its organization styling matches Info and Tournament Director; its configured tournament name becomes the prominent title. Surface modifiers may change responsive size and placement, but not the hierarchy, color relationship, or typography roles.

## Structure editor

### Information architecture

The editor changes from seven independent columns to five grouped blocks:

| Column | Contents |
|---|---|
| Level | Level or break identity |
| Minutes | Timed duration input or read-only untimed dash |
| Blinds | Paired Small and Big numeric fields |
| Ante | Ante type and ante amount grouped together |
| Actions | Move up, move down, delete |

Each field retains its existing accessible name. Visible compact sublabels use `SB`, `BB`, `Type`, and `Amount`; accessible labels remain `Small blind`, `Big blind`, `Ante type`, and `Ante`.

Break rows use the same five-column rhythm: identity, minutes, a Break label field spanning the Blinds and Ante groups, and Actions.

### Visual organization

- Use one restrained table surface rather than making each row look like a separate large card.
- Use a sticky five-column header with clearer hierarchy and less letter spacing.
- Use subtle row separators and restrained alternating tone instead of heavy gradients.
- Give break rows one copper left rule and a low-contrast warm tint.
- Use compact grouped field wells for Blinds and Ante so related controls read as one unit.
- Keep all inputs and action buttons at least 44px high.
- Reduce vertical gaps while keeping validation messages attached to the affected group.
- Keep the sticky draft-status/Cancel/Apply bar, but place it on a bounded surface with clearer state copy.
- Keep the live-entry/time editor above the schedule as a single compact operational band.

### Behavior and compatibility

- Reordering, deletion confirmation, draft cancellation, validation, atomic Apply, adding levels/breaks, and reset controls remain.
- Saved notes remain preserved but are not exposed as editor fields or public copy.
- The final untimed level remains read-only in Duration.
- New entries continue to insert before the terminal untimed level.
- The grouped layout collapses before horizontal overflow. At medium widths, labels become visible within each group. At 620px and below, the groups use a two-column card flow with identity and actions spanning full width.

## Accessibility

- Existing dialog names, focus traps, focus restoration, tab-arrow navigation, and inert-background behavior remain unchanged.
- Sponsor images retain accurate alt text; custom sponsors remain readable text.
- Info break accessible names omit hidden chip-up content.
- Grouped editor fields retain semantic fieldset/legend structure and explicit control labels.
- No control falls below 44 by 44 CSS pixels.
- Color is never the only marker: chip values and color names are rendered as text, breaks retain `BREAK`, and current rows retain their explicit marker.

## Testing and verification

Automated coverage must protect:

- The exact five chip denominations, labels, colors, and accessible names.
- Shared sponsor mapping on both main and Info surfaces.
- Info sponsors below prizes and the single reminder below sponsors.
- The 11/8 Info structure split, with Level 10 ending the left column and Break beginning the right.
- The absence of chip-up copy from Info structure and its continued presence on the main break surfaces.
- The exact canonical default structure and protected built-in preset.
- Shared main/Info/Director brand hierarchy and the main typography-role correction.
- Five grouped editor headers, grouped DOM hooks, unchanged accessible labels, break spanning behavior, responsive placement, draft operations, validation, and 44px controls.

Production browser QA covers:

- Main plus both Info pages at 1920x1080 and 1366x768.
- Both Info pages and the Director at 390x844.
- Director responsive boundaries at 821x900 and 800x900.
- No document overflow, no clipped required text, projector-safe Info pages with equal client/scroll dimensions, all 19 schedule entries, the correct 11/8 split, visible sponsor marks, correct chip colors, grouped editor containment, focus restoration, and zero console errors or warnings.
