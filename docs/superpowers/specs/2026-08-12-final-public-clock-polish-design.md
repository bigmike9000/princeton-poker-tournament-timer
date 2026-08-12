# Final Public Clock Polish Design

**Date:** 2026-08-12

## Goal

Make the public clock and Tournament Info feel like one professional PPC product, simplify live structure editing, and present only the tournament information players need from an auditorium screen.

## Brand hierarchy

The main clock, Tournament Info, and Tournament Director use one shared two-line brand lockup:

- PPC logo at left.
- Orange organization name on the first line, sourced from `configuration.organizationName`.
- A prominent page title on the second line.

The main clock title is the live tournament name from `configuration.tournamentName`. Tournament Info uses the fixed title `Tournament Info`. Tournament Director retains `Tournament Director`.

The Info header no longer displays the tournament name as a third line. Responsive variants may change logo and type size, but not the hierarchy or copy.

## Structure editor

The desktop editor uses seven clear columns: Level, Duration, Small, Big, Ante, Type, and Actions.

- The level-note input and Note column are removed from the interface.
- Existing `note` values remain in the draft and are preserved when the structure is applied. The domain and persistence formats are unchanged.
- The `Until end` checkbox and visible wording are removed.
- Timed levels retain an editable duration input.
- An existing untimed level remains untimed and displays a quiet read-only em dash in the duration cell with the accessible label `Untimed level`.
- The editor does not add a timed/untimed conversion control. New levels continue to use a timed duration.
- Break rows continue to expose duration, label, and actions.

The reduced column count is used to improve spacing, alignment, responsive wrapping, and visual grouping. All interactive targets remain at least 44 by 44 CSS pixels.

## Public blind-structure column

The main clock's blind schedule becomes denser without becoming small or hard to operate:

- Standard level rows target a 52px minimum height.
- Break rows target the 44px minimum interactive height.
- Header height, row padding, index markers, and internal gaps are tightened proportionally.
- The current row, LIVE marker, blind values, duration, ante information, completion state, and click-to-jump behavior remain clear.
- The schedule remains internally scrollable when the full structure cannot fit, with no document-level overflow.

## Tournament Info overview

The Overview page contains only:

1. Chip denominations and the existing live tournament totals.
2. A compact eight-place Prize structure.
3. One concise reminder: `Keep chips visible and countable.`

There is no rules section, house-notes section, rules reference link, or Tournament Director rulings footer on the public Info overlay. The Blind structure remains the second Info page.

The default prize lines are stored exactly as:

```text
1: 300
2: 200
3: 140
4: 100
5: 80
6: 70
7: 60
8: 50
```

They are rendered as aligned rank/value rows without inferring a currency symbol. The prize projector budget increases from four to eight lines while retaining the existing total-character limit. The layout must fit all eight default rows without scrolling at the approved projector and narrow-screen viewports.

`houseNotes` remain in persisted data and in the Tournament Director information editor for backward compatibility, but are not shown publicly. Hidden house-note content does not determine whether the public Overview uses its fixed projector layout or its legacy oversize fallback; only publicly rendered chip and prize content does.

## Accessibility and interaction

- Existing dialog, focus trap, close restoration, tabs, arrow-key tab switching, and inert-background behavior remain unchanged.
- The shared lockup retains one page-specific `h1` and the existing dialog labelling relationship.
- The untimed duration placeholder has an explicit accessible label.
- Structure rows remain keyboard accessible and meet the 44px target minimum.
- The reminder is presented as ordinary readable text, not an interactive control or a separate rules landmark.

## Compatibility

- No saved notes or house notes are deleted or migrated.
- Existing snapshots and presets continue to load.
- Custom prize content remains editable within the new eight-line projector limit.
- Legacy oversize behavior remains available for public chip/prize content that exceeds the safe budgets.

## Verification

Automated coverage will protect:

- Exact shared header hierarchy and titles on all three surfaces.
- Removal of the visible Note and Until end editor controls while preserving hidden data.
- Timed and untimed duration rendering.
- Seven-column desktop and responsive editor contracts.
- Compact main schedule size contracts and 44px row targets.
- Exact eight-line prize defaults and eight-line validation budget.
- Removal of public rules/house-note/footer content and presence of the single reminder.
- Public-only projector-safety classification.

Browser QA will cover the main clock and both Info pages at 1920x1080 and 1366x768, Tournament Info and Director at 390x844, and the Director structure editor near its responsive transition widths (821x900 and 800x900). Checks include text containment, zero page overflow, no overlay scrolling for safe defaults, all 19 schedule entries on Info page two, and 44px minimum controls.
