# Princeton Poker Tournament Timer

A desktop-first, installable poker tournament clock for Princeton Poker Club events. It runs entirely in the browser, stores tournament progress on the local device, and makes no network requests during normal tournament operation.

The public display is optimized for a laptop connected to a TV or projector. Tournament Director controls open as an overlay on the same screen.

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- A current desktop browser with local storage enabled

## Install and run for development

```bash
npm install
npm run dev
```

Open the local address printed by Vite. Development mode does not install the offline service worker.

## Production build

```bash
npm run build
npm run preview
```

The production files are written to `dist/`. `npm run preview` serves that build locally so the install and offline behavior can be tested. For a permanent installation, serve `dist/` from any static HTTPS host or from `localhost`; the application does not need a backend.

## Quality checks

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

For watch mode while developing, run `npm test`.

## Install as an app and use offline

1. Build and open the production app with `npm run preview`.
2. Load it once while the local server is available so the service worker can cache the application shell.
3. Use the browser’s install-app action, if offered.
4. Launch the installed app once and verify the tournament display appears before relying on it without a connection.

The installed production app precaches its HTML, JavaScript, CSS, manifest, and local icons. It does not depend on remote fonts, images, analytics, ads, accounts, or APIs.

When a new production version is available, the app shows an update notice. A running tournament must be paused before installation, and activation requires explicit confirmation so an update cannot unexpectedly reload the live clock.

Keep the production server or installed app available on the tournament laptop. Opening the raw `index.html` file directly is not supported because browser service workers require a secure origin such as HTTPS or `localhost`.

## Tournament operation

- Use the bottom rail for Start/Pause, previous or next level, player eliminations, mute, fullscreen, and Tournament Director controls.
- Open **Tournament Director** for precise time edits, direct level navigation, current-level and full-tournament resets, blind-structure editing, presets, tournament details, and settings.
- Reset and live-structure replacement actions require confirmation.
- The player-minus control never reduces the field below one player.
- The highlighted blind-structure row follows the active level automatically.

For a tournament, connect the laptop to the display, choose the correct mirrored or extended display, open the app, select **Full screen**, confirm audio works, and keep the laptop connected to power. Avoid clearing browser site data during an event.

## Keyboard shortcuts

Shortcuts work outside text fields, selects, and buttons:

| Key | Action |
| --- | --- |
| Space | Start or pause the clock |
| M | Mute or unmute alerts |
| F | Enter or exit fullscreen |

Left and right arrows never change the live blind level. While Tournament Info is open, they switch only between Overview and Blind Structure. The same shortcut reference appears in **Tournament Director → Settings**.

## Persistence and recovery

Tournament progress and preferences are saved in browser local storage under `ppc-tournament:v1`. Structure presets are stored separately under `ppc-presets:v1`.

The default close behavior is safe pause: if the app closes while the clock is running, it restores at the last persisted remaining time in a paused state. In **TD Controls → Settings**, the Tournament Director can instead choose to keep the tournament clock running; restoration then applies the elapsed wall-clock time and advances levels when necessary.

If saved progress is malformed, the app loads safe defaults and shows a warning. If the interface itself encounters an unexpected error, the recovery screen first offers to reload without touching stored data. **Start with safe defaults** requires explicit confirmation and removes only tournament progress; saved structure presets remain available.

Local storage belongs to the exact browser profile and site origin. It does not sync between devices or browsers. Browser private modes and storage-clearing policies may remove it.

## Audio and fullscreen

Alerts are short tones synthesized locally with the Web Audio API. No audio files or external services are used. Most browsers require a user gesture before allowing sound, so press Start or toggle sound once before the tournament begins. Alert types and mute state are configurable in **TD Controls → Settings**.

Fullscreen also requires a direct user action and may be limited by browser or operating-system policy. Use the bottom-rail button or press `F`.

## Technology

- React and TypeScript
- Vite
- Vitest and Testing Library
- Plain responsive CSS
- Web Audio and Fullscreen browser APIs
- Versioned local storage
- Workbox service worker generated by `vite-plugin-pwa`

All tournament timing is derived from timestamps. Display updates may be delayed by browser scheduling, but elapsed time is calculated from the clock baseline rather than by decrementing a counter, preventing accumulated interval drift.
