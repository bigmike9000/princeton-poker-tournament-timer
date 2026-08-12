# PPC Timer — Tournament Operations Refresh Design

## Objective

Refocus the main display and Tournament Director around the controls used during the Princeton Poker Club's 200-chip tournament. Remove redundant public information, make the two most frequent live corrections directly editable on the main screen, simplify the Director navigation, and make the supplied blind schedule the product default.

## Selected approach

Extend the structure model to represent the schedule faithfully rather than approximating it. Poker levels may carry an optional operational note, and the last poker level may be untimed. This preserves “500/1000 until end,” the chip-up instructions, and the expected final-table/end notes without inventing an arbitrary duration.

Rejected alternatives:

- Assigning 15 minutes to the final level would contradict “until end.”
- Labeling a long hidden countdown as untimed would make the display misleading.
- Dropping the parenthetical notes would discard operational information supplied with the schedule.

## Default tournament configuration

- Organization: `PRINCETON POKER CLUB`
- Tournament: `Princeton Poker Club Standard`
- Starting players: `80`
- Starting stack: `200`
- Default allocation note: `10 × 1 · 8 × 5 · 6 × 25 = 200`
- Initial chips in play: `16,000`

The public display will not show total chips. The Tournament Director's Event Details page will show the allocation note when the starting stack is 200 and will always show the computed starting chips in play beside the player/stack inputs.

Existing saved tournaments remain authoritative and will not be silently overwritten. The new configuration and schedule apply to fresh state and the bundled standard preset. A saved state migrates automatically only when it exactly matches the former bundled configuration and structure and remains idle at its first entry with all 80 players. Active, progressed, or customized tournaments remain unchanged.

## Default blind schedule

Levels 1–5 have no ante. Big-blind ante begins at 10/20 and equals the big blind for every subsequent timed or untimed level.

| Entry | Blinds / label | Duration | Ante | Operational note |
| --- | --- | ---: | ---: | --- |
| Level 1 | 1 / 2 | 12 min | None | |
| Level 2 | 2 / 4 | 12 min | None | |
| Level 3 | 3 / 6 | 12 min | None | |
| Level 4 | 5 / 10 | 12 min | None | |
| Level 5 | 8 / 16 | 12 min | None | |
| Break 1 | Break | 10 min | — | Chip up to 5s |
| Level 6 | 10 / 20 | 15 min | BBA 20 | BB ante begins |
| Level 7 | 15 / 30 | 15 min | BBA 30 | |
| Level 8 | 20 / 40 | 15 min | BBA 40 | |
| Level 9 | 30 / 60 | 15 min | BBA 60 | |
| Level 10 | 40 / 80 | 15 min | BBA 80 | |
| Break 2 | Break | 10 min | — | Chip up to 25s and 100s |
| Level 11 | 50 / 100 | 15 min | BBA 100 | |
| Level 12 | 75 / 150 | 15 min | BBA 150 | |
| Level 13 | 100 / 200 | 15 min | BBA 200 | Final table target · chip up to 100s and 500s |
| Level 14 | 200 / 400 | 15 min | BBA 400 | |
| Level 15 | 300 / 600 | 15 min | BBA 600 | Expected finish |
| Level 16 | 400 / 800 | 15 min | BBA 800 | |
| Level 17 | 500 / 1,000 | Until end | BBA 1,000 | Final level |

Break labels and poker-level notes remain editable in the Structure editor. Notes are concise text with an 80-character maximum.

## Untimed terminal level

`PokerLevel.durationSeconds` becomes `number | null`; `null` means “until end.” Breaks always retain a positive timed duration.

Only the final structure entry may be untimed, and it must be a poker level. Structure validation rejects an untimed break, an untimed non-final level, or more than one untimed entry.

When the clock automatically advances into the untimed terminal level:

- the current entry changes normally and the level-complete alert may fire;
- the clock displays `UNTIL END` instead of `00:00`;
- no completion or threshold alert is generated for the untimed entry;
- elapsed time no longer changes `remainingMs`, and no 250 ms render interval is needed;
- Start/Pause may still mark the live tournament active or paused, but no countdown baseline is stored;
- reset-current and direct navigation set the untimed level to a zero remaining baseline without treating the tournament as complete.

Existing timed snapshots and presets remain valid. Snapshot validation accepts `null` only for a terminal poker level whose whole structure passes validation.

## Main display changes

### Header and statistics

- Remove the “Official Tournament Clock” eyebrow.
- Keep the configured organization and tournament names beside the PPC logo.
- Remove the Total Chips stat card.
- Rebalance the stats instrument panel to two columns: Players Remaining and Average Stack.

### Direct structure navigation

Every poker level and break in the right schedule rail becomes a real button inside its list item. Clicking or keyboard-activating a row dispatches the existing `GO_TO_ENTRY` action with the current timestamp. Navigation is immediate, loads that entry's full configured duration (or untimed state), preserves the current running/paused/idle mode, marks the transition manual, and scrolls the selected row into view.

The current row keeps its `aria-current="step"` state. Hover and focus treatments must be visible without sacrificing the existing completed/current/upcoming hierarchy. Direct navigation never requires confirmation.

### Editable player count

Replace the read-only number in the bottom player stepper with a numeric input labeled `Players remaining`.

- Clicking permits direct text selection/editing.
- Enter or blur commits through `SET_PLAYERS`.
- Escape restores the live value without committing.
- Empty, fractional, below-one, and above-starting-player values normalize through the existing reducer clamp.
- Minus/plus controls remain and update the input immediately.
- External player changes resynchronize the draft when the input is not actively being edited.

## Tournament Director information architecture

Remove the Run tab and delete the standalone Run page. The tabs become:

1. Structure
2. Presets
3. Tournament
4. Settings

Structure is selected whenever the Director first opens.

The old Progression and Field cards are removed because their live actions move to the main display. The Structure page contains, in order:

1. Edit Remaining Time for the current timed entry. For an untimed entry, show a short `Untimed final level` explanation instead of editable minute/second fields.
2. The existing draft Structure editor, extended with an `Until end` control and optional level-note field.
3. Reset Controls, with the existing confirmations for Reset Current Level and Reset Tournament.

Start/Pause, previous/next, and player editing remain available on the main control dock and through existing keyboard shortcuts.

## Component and domain boundaries

- `domain/structure.ts` owns duration helpers and untimed predicates so timer, reducer, UI, and persistence do not duplicate null handling.
- `BlindStructure` remains a presentational list and receives an `onSelectEntry(index)` callback from `TournamentDisplay`.
- A focused editable player-count control owns only local draft/commit keyboard behavior and dispatches existing player actions.
- `ResetControls` owns confirmation state and reset dialogs after the Run page is removed.
- `StructureEditor` composes `TimeEditor`, draft editing, and `ResetControls` without absorbing their internal behavior.

## Error handling and persistence

- Invalid player text never enters state; committed numeric values are clamped to 1…starting players.
- Invalid structures cannot be applied or saved as presets.
- Untimed entries never create `NaN`, negative time, or a fake completion state.
- Existing storage failure handling remains nonfatal.
- Active or customized saved tournaments are never auto-replaced by the new defaults.

## Testing and acceptance criteria

- Unit tests cover the exact 17-level/two-break default, 80 × 200 = 16,000, no ante before 10/20, BBA values from 10/20 onward, schedule notes, and the untimed final level.
- Timer/reducer tests cover automatic and manual entry into the untimed level, pause/resume, reset, direct navigation, structure replacement, and persistence round trips.
- Display tests prove removal of the eyebrow and Total Chips, direct row navigation, editable player commit/clamp/cancel behavior, two-stat rendering, break notes, level notes, and `UNTIL END`.
- Director tests prove Structure is first, Run/Progression/Field are absent, time editing and reset controls live on Structure, and the untimed explanatory state replaces time inputs.
- Structure-editor tests cover note editing, `Until end`, and validation that untimed is terminal-only.
- The full automated suite, typecheck, lint, and production PWA build pass.
- Browser QA at 1920×1080, 1366×768, and 390×844 confirms no horizontal overflow, no hidden operational data, usable schedule buttons, and a main player input at least 44 px high.
