# Princeton Poker Tournament Timer — Design Specification

## Objective

Build a polished, desktop-first React PWA that the Princeton Poker Club can run locally and display on a television or projector during live tournaments. The first version must be dependable enough for real tournament use, work offline after installation, preserve progress locally, and keep the public display clean while exposing full Tournament Director controls in an overlay.

Reliability of the tournament clock takes priority over decorative features.

## Scope and assumptions

- The application runs entirely in one browser on one laptop; it has no backend and no multi-device synchronization.
- Tournament Director controls open as an overlay on the same display rather than in a second window.
- The app ships with one editable sample structure. No tournament values are permanent or locked.
- Re-entries and add-ons are not exposed in v1, but chip accounting uses a contribution model that can support them later.
- Branding consists of configurable text and neutral logo/sponsor placeholders. No third-party trademarks or remote assets are included.
- The application targets current evergreen desktop browsers and common 16:9 laptop, television, and projector resolutions.

## Technical approach

Use React, TypeScript, and Vite with a reducer-driven client-side architecture. Vitest and Testing Library cover domain and interaction tests. A lightweight PWA build integration supplies a manifest and generated service worker so the production build can be installed and used offline.

The app will not use a general-purpose state library. React context plus `useReducer` is sufficient because all state is local, the action model is explicit, and the domain operations are testable as pure functions.

Suggested source organization:

```text
src/
  app/             application shell, provider, routing-free view composition
  domain/          types, timer math, transitions, validation, derived statistics
  state/           reducer, actions, initial state, selectors
  persistence/     versioned snapshots, restoration, preset repository
  services/        audio alerts, fullscreen, PWA registration
  features/
    display/       public clock, current-level card, player stats, blind list
    director/      overlay, controls, editors, presets, settings, confirmations
  components/      shared buttons, fields, modal, segmented controls
  styles/          tokens, responsive layout, animation, print-free display styles
```

## Domain model

The root state contains:

- `configuration`: tournament name, organization name, starting players, starting stack, and editable branding placeholders.
- `structure`: ordered entries representing poker levels or breaks.
- `runtime`: current entry index, timer status, remaining-time baseline, baseline timestamp, player count, and whether the tournament has started.
- `chipLedger`: initial chip contribution plus a future-compatible list of additional contributions. Only the initial contribution is editable in v1.
- `settings`: automatic advancement, alert configuration, mute state, close behavior, display preferences, and shortcut visibility.
- `presets`: named, immutable-copy structure snapshots with stable identifiers.

A poker-level entry stores small blind, big blind, ante amount, ante type, and duration. A break entry stores its duration and optional label. Entry order determines tournament progression; displayed poker level numbers are derived sequentially so reordering cannot produce duplicates.

All state changes use typed reducer actions. Time-sensitive actions receive `now` explicitly rather than calling the system clock internally, which makes transition behavior deterministic in tests.

## Timer engine

The timer stores a remaining-time baseline and the wall-clock timestamp at which that baseline became active. While running, visible remaining time is derived as:

```text
baseline remaining − (current timestamp − baseline timestamp)
```

A short render interval updates the screen, but it is not the source of truth. Delayed callbacks therefore do not introduce cumulative drift.

When elapsed time reaches or exceeds the current entry duration, the engine advances using the exact overflow. It can traverse multiple levels or breaks if the page was backgrounded for a long period. With automatic advancement disabled, it clamps at zero and pauses. At the last entry it clamps at zero and pauses rather than wrapping.

Pause first resolves the exact remaining time at the supplied timestamp and then clears the active baseline timestamp. Resume establishes a fresh baseline timestamp without changing the remaining duration. Reset-current restores the current entry's configured duration. Previous, next, and jump actions load the chosen entry at its full configured duration and preserve the prior running/paused status unless the tournament has ended. Editing time while running first resolves the current time, applies the edit, and starts a new baseline at the same action timestamp.

## Persistence and restoration

The app writes a versioned localStorage snapshot after every meaningful reducer transition and periodically while the timer is running. A `pagehide` handler writes one final timestamped snapshot when the browser permits it.

For “Pause tournament when app closes,” restoration uses the saved remaining value as of the final persisted timestamp and restores the timer paused. Periodic snapshots bound the discrepancy if the browser terminates without firing `pagehide`.

For “Keep tournament clock running,” restoration replays elapsed wall-clock time from the stored baseline timestamp, including automatic transitions and break boundaries. If automatic advancement is disabled, restoration stops at zero on the saved entry.

Malformed, unknown-version, or partially invalid storage never crashes the display. The persistence layer validates the snapshot, uses safe defaults for recoverable fields, and offers a clear recovery action if the snapshot cannot be used. Preset writes are copy-based so later edits do not mutate saved structures.

## Main display

The main view uses a purpose-built broadcast layout rather than an admin-dashboard aesthetic.

- The left region presents the organization and tournament name, current level or `BREAK`, a dominant tabular-numeral countdown, current blinds and ante mode, and player/chip statistics.
- The right region contains the complete vertically scrollable structure. The current row is high-contrast and accented, completed rows are subdued, and upcoming rows remain legible. The active row scrolls into view after transitions and jumps.
- During a break, the left region replaces blinds with a prominent break state and shows the next poker level's blinds.
- A compact bottom control rail provides the frequent safe actions: start/pause, previous, next, player decrement/increment, mute, TD overlay, and fullscreen.
- Destructive reset operations live only in the TD overlay and require explicit confirmation.

The visual system uses a near-black blue background, warm ivory primary text, restrained Princeton-inspired orange accents without university marks, and cool neutral secondary text. Typography is large, condensed only where useful, and uses tabular numerals for timers and chip values. The timer gains a subtle warning treatment below one minute; animation stops or reduces under `prefers-reduced-motion`.

Responsive behavior preserves the two-column composition at television and normal laptop widths. At narrower widths, the structure column becomes narrower before the layout stacks. Main information always takes visual priority, and public-display controls remain large enough for deliberate operation.

## Tournament Director overlay

The TD panel is a large, opaque or strongly blurred overlay above the public display. Opening it pauses neither the tournament nor rendering. It is organized into focused sections rather than exposing every control at once:

1. `Run`: start/pause, previous/next/jump, exact time editing, add/subtract time, player count, and current tournament summary.
2. `Structure`: add, delete, reorder, and edit poker levels and breaks with inline validation.
3. `Presets`: load, save, duplicate, rename, and delete named structures.
4. `Tournament`: names, starting players, starting stack, and branding placeholder labels.
5. `Settings`: auto-advance, close behavior, alert thresholds, sound, display preferences, and keyboard shortcut reference.

Closing the overlay returns focus to the trigger control. Modal confirmations trap focus and support Escape to cancel. The overlay is keyboard navigable and uses semantic labels throughout.

## Structure editing and validation

The structure editor operates on a draft copy. Apply commits the validated draft atomically; Cancel leaves the running tournament unchanged. If the current entry is affected, applying the structure retains the current entry by stable identifier when possible and clamps remaining time to a valid nonnegative value. Deleting the current entry requires confirmation and moves to the nearest surviving entry.

Validation rules include:

- Duration must be a positive whole number of minutes for configured entries; runtime time edits may use minutes and seconds.
- Blinds and antes must be nonnegative whole chip amounts.
- Poker levels require a positive big blind and a small blind no greater than the big blind.
- `None` requires an ante of zero; traditional and big-blind ante modes require a positive ante.
- Breaks contain no blind or ante values.
- A structure must contain at least one poker level.
- Names are trimmed, nonempty, and length-limited; preset names must be unique case-insensitively.

Invalid drafts show field-level explanations and cannot be applied.

## Player and chip calculations

Starting chips equal starting players multiplied by starting stack. Total chips in play are derived from the chip ledger. Average stack is total chips divided by remaining players and rounded to a whole chip for display.

The quick minus control represents one elimination. The remaining count cannot fall below one through quick controls, cannot exceed starting entries in v1, and requires a deliberate TD edit for larger corrections. Changes update all visible statistics immediately.

## Audio alerts

Web Audio generates short local chimes, avoiding network dependencies and licensed audio assets. Alert settings independently control five-minute, one-minute, level-complete, break-beginning, and break-ending notifications. Threshold alerts fire once per traversal and are re-armed when a level is reset or its time is edited above the threshold. Transition alerts use distinct short patterns and never loop.

Browsers require user interaction before audio playback; the first start/resume or unmute action initializes the audio context. If audio is unavailable, timer operation continues unaffected. Mute is accessible from the main control rail and reflected in settings.

## Keyboard and fullscreen behavior

Global shortcuts apply only when focus is not in an input, select, textarea, editable region, or confirmation dialog:

- Space: start or pause.
- Right Arrow: next entry.
- Left Arrow: previous entry.
- `F`: enter or exit fullscreen.
- `M`: mute or unmute.

No shortcut resets tournament progress. Fullscreen requests originate from explicit user gestures, and failure produces a small nonblocking message rather than disrupting the clock.

## Error handling and safety

- Reset-current and reset-tournament actions require confirmation, with the full reset using stronger explanatory copy.
- Loading a preset during a progressed tournament requires confirmation because it replaces the active structure and resets level progress.
- Invalid inputs remain local drafts and never enter live state.
- Storage quota or write failures show a persistent warning that progress is no longer safely persisted while leaving the clock operational.
- Audio and fullscreen errors are nonfatal and use concise status messages.
- An application error boundary provides a recovery screen and preserves the last valid snapshot.

## Offline installation

The production build includes a web app manifest, installable icons created locally, and a service worker that precaches the application shell and local assets. Normal tournament operation makes no external network requests. Update activation is deferred while a tournament is running; an available update is presented as an optional action when safe.

## Testing strategy

Pure domain tests cover:

- start, pause, resume, current reset, full reset, and exact timestamp calculations;
- automatic and manual transitions, overflow across multiple entries, first/last boundaries, and jumps;
- break entry and exit behavior;
- editing and adding/subtracting time while paused or running;
- player count limits, total chips, and average-stack calculations;
- structure and preset validation;
- pause-on-close and keep-running restoration from versioned snapshots;
- edge cases at one second and zero seconds.

Reducer tests assert coordinated state changes. Component tests cover the primary control flow, TD overlay editing, confirmation gates, current-row visibility behavior, shortcuts, and accessible labels. Fake timers and fixed timestamps keep tests deterministic. A production build, TypeScript check, lint run, automated test suite, and manual browser review at representative 1920×1080 and laptop dimensions form the completion gate.

## Delivery criteria

The repository will contain the complete application, README instructions, development and production scripts, automated tests, and offline PWA assets. A fresh clone must support `npm install`, `npm run dev`, `npm test`, and `npm run build`. The final implementation will be reviewed in a browser for timer readability, overlay usability, structure editing, persistence restoration, fullscreen behavior, and obvious responsive defects.
