# Icon Controls and Compact Structure Design

**Date:** 2026-08-12

## Goal

Reduce visual clutter on the public tournament clock by replacing four text-heavy utility controls with familiar icons and by expressing Tournament Info blind levels in standard compact poker notation.

## Public utility controls

The Info, fullscreen, sound, and Tournament Director controls become a uniform group of square icon buttons. Icons are local inline SVGs so they render consistently on projector computers without adding a package or network dependency.

| Control | Visible icon | Accessible behavior |
|---|---|---|
| Tournament Info | Circled lowercase `i` | `Open tournament information` |
| Fullscreen | Four outward corners; inward corners while fullscreen | `Enter fullscreen` / `Exit fullscreen` |
| Alerts | Speaker with sound waves; speaker crossed when muted | `Mute alerts` / `Unmute alerts`, with current pressed-state behavior preserved |
| Tournament Director | Gear | `Open Tournament Director` |

Every button remains at least 44 by 44 CSS pixels. Hover, focus-visible, pressed, and muted states use the existing ivory/orange/brass visual language. No action order, callback, keyboard behavior, or focus-restoration behavior changes.

## Tournament Info structure notation

The structure page displays one compact key: `SB / BB / ANTE`.

- A no-ante level displays two values, such as `1 / 2`.
- A big-blind-ante level displays three values, such as `10 / 20 / 20`.
- A traditional-ante level also displays three values, such as `10 / 20 / 5`.
- No visual row writes `NO ANTE`, `BBA`, or `ANTE`.
- Accessible row names remain explicit, for example `Level 6, small blind 10, big blind 20, big-blind ante 20, 15 min`.

Break rows remain `BREAK · 10 MIN`, retain no chip-up copy on Tournament Info, and preserve the existing 11/8 column split. Main-clock structure rows and the current-level hero are unchanged.

The combined numeric value occupies the existing blinds area and the former per-row ante line is removed, giving each level more whitespace without shrinking type.

## Testing and verification

- Component tests require four icon-only utility buttons, exact accessible names, SVG hooks, sound/fullscreen state changes, and no legacy utility text.
- Info tests require the single notation key, exact two-value and three-value examples, absence of visible ante words, and explicit accessible labels.
- CSS contracts require uniform square utility targets of at least 44 pixels and stable icon sizing.
- Browser QA covers the main footer at 1920×1080 and 1366×768 plus both Info viewports at 1366×768 and 390×844, checking containment, legibility, focus, and console output.

## Compatibility

No tournament state, persistence schema, preset, timer, or configuration changes. Existing saved structures render through the same pure formatting rules, including traditional antes and untimed levels.
