# Control, Editor, and Typography Cleanup Design

## Goal

Reduce visual weight on the tournament clock and Tournament Director without losing projector readability, touch-target size, keyboard access, or Princeton identity.

## Design Direction

The approved direction is **modern institutional**.

- Preserve a refined serif for the Princeton brand lockup, tournament name, and the large `LEVEL` / `BREAK` hero.
- Use a clean system sans-serif for operational headings, schedules, controls, and settings.
- Use a condensed DIN-style numeric stack for the timer, blinds, chip values, and editable numeric fields.
- Keep the design offline-safe by using installed/system fonts with fallbacks rather than fetching web fonts.

The existing font selection was inspired by Princeton’s editorial heritage (Georgia) combined with a broadcast scoreboard (Arial/Aptos Narrow). The refinement keeps that concept but narrows the serif’s role so operational surfaces feel cleaner and less dated.

## Active-Break Message

- The active break message contains only the instruction, such as `Count and stack white chips in stacks of 10`.
- The visible words `Break procedure` are removed.
- The message has no border, background, box shadow, card fill, or framed container.
- It appears as a plain message directly below the player and average-stack statistics.
- It retains one stable, atomic `role="status"` node across level-to-break transitions so assistive technology receives the update reliably.
- The empty live region remains visually hidden and occupies no layout space outside meaningful breaks.

## Bottom Control Rail

### Player control

- The player stepper is exactly the same 3.4rem / approximately 54px height as the adjacent primary and navigation buttons.
- Minus, editable player value, and plus share the same outer height.
- The label `Players` is positioned inside the center control without increasing total height.
- The numeric input itself remains at least 44px high and keyboard-editable.
- The group retains a restrained 6px outer radius and inset focus treatment.

### Utility icons

- Info, fullscreen, sound, and Tournament Director buttons have no visible outer border or rectangular box at rest.
- Each button remains at least 44 × 44px.
- Hover, active, and focus states use a subtle circular background/focus surface; the resting control is the icon itself.
- Native icon shapes remain recognizable, including the conventional circled `i` within the information glyph.

### Previous and next

- Previous and next become low-emphasis ghost navigation controls.
- Their backgrounds and borders are removed at rest, while disabled, hover, and focus states remain clear.
- Chevrons and labels retain explicit accessible names and 44px minimum height.
- Start/Pause remains the single strong orange primary action.

## Structure Editor

The Structure editor becomes a flat data grid rather than a stack of nested cards.

- Remove the visible outer table box, heavy table fill, and drop shadow.
- Keep one compact sticky column header with a single divider.
- Rows use a transparent/near-transparent background and one subtle bottom divider; alternating boxed fills are removed.
- Break rows retain a small orange left accent and a very light tint for fast recognition.
- Remove borders, backgrounds, padding shells, and shadows from the `Blinds`, `Ante`, and row-action group wrappers.
- Keep individual inputs/selects at least 44px high with a single restrained border and 4–6px radius.
- Keep compact field labels above inputs, but reduce redundant padding and vertical gaps.
- Remove the outer action-group box; three 44px icon buttons sit directly in the Actions column with small gaps.
- Keep validation errors adjacent to their fields, `aria-invalid`, `aria-describedby`, fieldset/legend semantics, reordering, deletion confirmation, draft cancellation, and Apply behavior unchanged.
- The sticky footer becomes a lighter single-divider action bar rather than another boxed surface.
- Responsive layouts at 968px, 760px, and narrow mobile widths remain contained with no horizontal overflow.

## Typography Tokens and Usage

- Add `--font-interface: "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif`.
- Refine `--font-heritage` to `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`.
- Refine `--font-numeric` to `"DIN Alternate", "Arial Narrow", "Aptos Narrow", "Roboto Condensed", ui-sans-serif, system-ui, sans-serif`.
- Apply `--font-interface` to the root application, Blind Structure title, Tournament Director section headings, Structure editor identity labels, and other operational headings touched by this change.
- Preserve `--font-heritage` for the shared brand title, tournament name, and public `LEVEL` / `BREAK` hero.
- Preserve numeric font usage for clocks, blinds, stacks, durations, and number inputs.

## Accessibility and Interaction

- All controls and inputs remain at least 44px in both interactive dimensions.
- Focus-visible treatment remains visible even where parent controls clip rounded corners.
- Icon-only buttons retain descriptive accessible names and pressed state where applicable.
- The active-break live region remains stable, atomic, and free of duplicate spoken labels.
- Structure editor semantic groups, field labels, validation binding, keyboard focus, and button ordering remain intact.

## Testing and Verification

- Component tests prove the active-break status contains only the instruction and retains node identity.
- Player-control tests and CSS contracts prove equal 3.4rem height and a 44px editable input target.
- Display CSS contracts protect borderless utility icons, circular interaction states, ghost Prev/Next treatment, and minimum target sizes.
- Structure editor tests protect the flat wrapper/group/action rules, 44px inputs/buttons, responsive containment, validation semantics, and unchanged draft behavior.
- Typography tests protect token definitions and the operational-versus-heritage usage boundary.
- Final verification includes the full test suite, typecheck, lint, production/PWA build, diff checks, independent review, and in-app Browser QA on main/break views and the Structure editor at projector, breakpoint, and narrow widths.

## Out of Scope

- Replacing the existing icon artwork.
- Adding external font files or network dependencies.
- Changing tournament timing, structure, prizes, sponsors, or preset behavior.
- Redesigning Tournament Info content or navigation.
