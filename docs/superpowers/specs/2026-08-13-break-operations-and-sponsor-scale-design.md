# Break Operations and Sponsor Scale Design

## Goal

Make the public break screen more useful and less repetitive while increasing sponsor visibility on auditorium projectors.

## Public break presentation

- The large current-entry heading reads `BREAK` with no duration because the countdown directly below already communicates the remaining break time.
- The main blind-structure sidebar keeps `BREAK · 10 MIN`; duration remains useful when scanning the full schedule.
- The first bundled break displays `COUNT AND STACK WHITE CHIPS IN STACKS OF 10` beneath the hero heading.
- The second bundled break displays `COUNT AND STACK RED CHIPS` beneath the hero heading.
- The same operational message remains visible in the corresponding main schedule row so operators can preview it.
- Break accessibility continues to announce the duration and operational message, for example `Break, 10 min, Count and stack white chips in stacks of 10`.

## Defaults and compatibility

- The bundled structure and built-in preset store the new operational messages as their break labels.
- Public break presentation translates only the two exact former bundled labels (`Chip up to 5s` and `Chip up to 25s and 100s`) to the new messages. This makes existing saved tournaments immediately display the new instructions without replacing custom labels.
- Customized break names remain unchanged.
- Timer duration, pause/resume behavior, level order, Info structure copy, and Director editing behavior do not change.

## Sponsor presentation

- The main SponsorStrip passes a dedicated display modifier to the shared SponsorMarks component.
- Main sponsor cards are enlarged at full projector sizes.
- The existing short-height breakpoint receives a proportional main-only size so the logos remain larger than before without displacing the timer and statistics.
- Phone sizing and Tournament Info sponsor sizing remain independently controlled and unchanged unless containment requires a display-specific cap.

## Accessibility and responsive behavior

- The current-break region retains its semantic `Current break` label.
- Schedule rows remain buttons with complete accessible names.
- Sponsor images retain their existing alt text.
- The 1920×1080 and 1366×768 main layouts must have no document overflow or clipped sponsor marks. A 390×844 smoke check must remain contained.

## Testing

- Domain tests cover generic labels, both exact legacy translations, operational copy, and accessible labels.
- Display tests cover the hero-only `BREAK`, both default break messages, schedule duration retention, and the sponsor display modifier.
- CSS contract tests protect the full-size and short-height sponsor dimensions.
- Browser QA verifies both break states and sponsor containment at projector sizes.
- The full unit, typecheck, lint, production/PWA build, and Git integrity gates run before completion.

