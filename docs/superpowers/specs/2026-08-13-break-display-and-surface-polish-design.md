# Break Display and Surface Polish Design

## Goal

Make the public tournament clock easier to scan from an auditorium while removing schedule clutter and giving the main controls and player statistics a more finished, professional visual system.

## Approved Behavior

### Blind structure

- Every public break row uses the single visible label `BREAK — 10 MIN`.
- Public break rows contain no chip-stacking instruction, subtitle, or duplicate break label.
- Public break-row accessible names are limited to `Break, 10 min`; chip-stacking instructions are not exposed from inactive schedule rows.
- The Tournament Info blind structure uses the same visible and accessible break wording.
- The default structure adds a 15-minute `150 / 300 / 300` big-blind-ante level after `100 / 200 / 200` and before `200 / 400 / 400`.
- Existing default-entry IDs remain stable; the new entry uses its own stable ID so saved presets and migrations do not silently reassign old levels.

### Active break presentation

- The current-level hero says only `BREAK` during a break.
- The current break's saved label is rendered only in a dedicated `Break procedure` notice below the player and average-stack statistics.
- The first default break displays `Count and stack white chips in stacks of 10`.
- The second default break displays `Count and stack red chips`.
- The notice is absent during poker levels and for generic break labels that do not provide a meaningful instruction.
- The next-level preview remains visible during breaks.

## Visual System

The approved direction is “soft architectural,” not pill-shaped or consumer-dashboard styling.

- Main controls and compact inputs use a 6px radius.
- Major grouped surfaces, including player statistics and the break-procedure notice, use an 8px radius.
- Schedule rows and small utility badges use restrained 4px corners where rounding improves containment without weakening the dense tournament-clock hierarchy.
- Borders remain thin and brass/orange accents remain limited to active or primary elements.
- The player statistics become one cohesive two-column module with clearer internal padding, consistent label/value spacing, and a clipped outer radius.
- The player stepper becomes a contained control group with rounded outer corners, clipped child backgrounds, and a more balanced central value area.
- Focus rings, minimum 44px targets, numeric readability, and current responsive behavior are preserved.

## Architecture

- `breakPresentation` remains the single source for normalizing legacy/default break labels into an optional meaningful instruction.
- `BlindStructure` and `InfoStructure` render schedule-safe break copy only.
- A focused `BreakProcedure` display component receives the current entry, renders only meaningful break instructions, and owns the semantic live-region/label contract.
- `TournamentDisplay` places `BreakProcedure` immediately after `PlayerStats` so the notice appears under both counts.
- The default structure is extended without renumbering existing entry IDs.
- Styling stays in the established public-display stylesheet and introduces no dependency or new visual framework.

## Accessibility

- Break schedule buttons continue to be keyboard-operable and clickable but announce only the break duration.
- The active procedure notice uses a labeled status region so the instruction is available when it becomes relevant.
- Decorative schedule rules remain hidden from assistive technology.
- Interactive elements retain visible focus treatment and at least 44px hit targets.

## Testing and Verification

- Domain tests prove the exact 20-entry default structure, 18 poker levels, two ten-minute breaks, and the position/value/duration of `150 / 300 / 300`.
- Display tests prove inactive schedule rows contain no procedure text and active breaks place the correct procedure below the statistics, not in the hero.
- Info tests prove the same compact break wording and the new total/ordering.
- CSS contract tests protect the 6px/8px corner system, grouped stat geometry, contained player stepper, and responsive rules.
- The final gate includes the full test suite, typecheck, lint, production/PWA build, diff checks, and in-app-browser projector QA at 1366×768 plus a narrow responsive smoke check.

## Out of Scope

- Changing the wording of the two approved chip-stacking instructions.
- Adding new break actions, acknowledgements, or operator workflows.
- Reworking the Tournament Director structure editor.
- Converting the overall design to highly rounded cards or pill controls.
