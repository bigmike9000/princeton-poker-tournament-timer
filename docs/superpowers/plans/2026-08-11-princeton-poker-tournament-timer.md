# Princeton Poker Tournament Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependable, installable, offline poker tournament clock with a room-readable public display and an on-screen Tournament Director overlay.

**Architecture:** A React context owns a typed reducer whose time-sensitive actions receive explicit timestamps. Pure domain functions handle timer advancement, structure validation, player calculations, and restoration; components render derived selectors and dispatch actions, while versioned localStorage snapshots preserve state.

**Tech Stack:** React 19, TypeScript 5, Vite 7, Vitest, Testing Library, ESLint, CSS, Web Audio, vite-plugin-pwa

## Global Constraints

- Normal tournament operation must make no network requests and must work offline after the production app is loaded or installed.
- The timer must derive elapsed time from timestamps instead of decrementing a counter.
- The public display is desktop-first, high contrast, readable from 20–30 feet, and optimized for 1920×1080, 2560×1440, and normal laptop screens.
- Tournament Director controls open in an overlay on the same display.
- All destructive resets and live-structure replacement require confirmation.
- Quick player controls never reduce players remaining below one.
- Branding uses neutral local placeholders and no Princeton University or sponsor trademarks.
- Dependencies remain local and minimal; there is no backend, account system, router, or remote asset service.

---

## Planned file map

```text
index.html                         Vite document shell and metadata
package.json                       scripts and pinned project dependencies
vite.config.ts                     React, Vitest, and PWA configuration
eslint.config.js                   TypeScript and React lint configuration
src/main.tsx                       application entry point
src/app/App.tsx                    public display and overlay composition
src/app/TournamentProvider.tsx     reducer lifecycle, ticks, persistence, alerts
src/domain/types.ts                shared domain contracts
src/domain/sampleStructure.ts      editable sample data and initial state factory
src/domain/calculations.ts          chip totals, average stack, formatting
src/domain/validation.ts           structure and preset validation
src/domain/timer.ts                timestamp-based timer resolution
src/state/reducer.ts               typed tournament actions and state transitions
src/state/selectors.ts             current/next entry and display projections
src/persistence/snapshot.ts        versioned save, load, and restoration
src/services/audio.ts              synthesized one-shot alert patterns
src/services/fullscreen.ts         fullscreen request/exit wrapper
src/services/shortcuts.ts          input-safe keyboard mapping
src/features/display/*             clock, level details, blind list, stats, controls
src/features/director/*            overlay sections, editors, confirmations
src/components/*                   reusable button, dialog, field, toast components
src/styles/*                       tokens, layout, controls, responsive rules
src/test/setup.ts                  DOM test setup and browser API stubs
public/icons/*                     locally created installable-app icons
README.md                          setup, operation, build, test, and offline usage
```

### Task 1: Project foundation and domain contracts

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `index.html`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/test/setup.ts`
- Create: `src/domain/types.ts`, `src/domain/sampleStructure.ts`, `src/domain/calculations.ts`
- Test: `src/domain/calculations.test.ts`, `src/app/App.test.tsx`

**Interfaces:**
- Produces: `TournamentState`, `StructureEntry`, `PokerLevel`, `BreakLevel`, `TournamentSettings`, `createInitialState()`, `totalChips(state)`, `averageStack(state)`, `formatChips(value)`.
- Consumes: none.

- [ ] **Step 1: Write failing domain and smoke tests**

```ts
// src/domain/calculations.test.ts
import { describe, expect, it } from 'vitest'
import { averageStack, formatChips, totalChips } from './calculations'
import { createInitialState } from './sampleStructure'

describe('chip calculations', () => {
  it('calculates total chips and average stack from the ledger', () => {
    const state = createInitialState()
    state.configuration.startingPlayers = 80
    state.configuration.startingStack = 30_000
    state.runtime.playersRemaining = 8
    expect(totalChips(state)).toBe(2_400_000)
    expect(averageStack(state)).toBe(300_000)
    expect(formatChips(2_400_000)).toBe('2,400,000')
  })
})

// src/app/App.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('shows the club and tournament name', () => {
    render(<App />)
    expect(screen.getByText('PRINCETON POKER CLUB')).toBeVisible()
    expect(screen.getByText('Princeton Poker Club Standard')).toBeVisible()
  })
})
```

- [ ] **Step 2: Install dependencies and run tests to verify failure**

Run: `npm install && npm test -- --run`

Expected: FAIL because the domain and app modules do not exist.

- [ ] **Step 3: Add the project configuration and concrete domain types**

```ts
export type AnteType = 'none' | 'traditional' | 'big-blind'

export interface PokerLevel {
  id: string
  kind: 'level'
  durationSeconds: number
  smallBlind: number
  bigBlind: number
  ante: number
  anteType: AnteType
}

export interface BreakLevel {
  id: string
  kind: 'break'
  durationSeconds: number
  label: string
}

export type StructureEntry = PokerLevel | BreakLevel
export type TimerStatus = 'idle' | 'running' | 'paused' | 'complete'

export interface TournamentSettings {
  autoAdvance: boolean
  closeBehavior: 'pause' | 'continue'
  muted: boolean
  alertAtFiveMinutes: boolean
  alertAtOneMinute: boolean
  alertLevelComplete: boolean
  alertBreakBeginning: boolean
  alertBreakEnding: boolean
}

export interface TournamentState {
  configuration: {
    organizationName: string
    tournamentName: string
    startingPlayers: number
    startingStack: number
    sponsorLabels: string[]
  }
  structure: StructureEntry[]
  runtime: {
    currentEntryIndex: number
    status: TimerStatus
    remainingMs: number
    baselineAt: number | null
    playersRemaining: number
    alertedThresholds: number[]
  }
  chipLedger: { id: string; kind: 'initial' | 'reentry' | 'addon'; chips: number }[]
  settings: TournamentSettings
}
```

Create a sample structure with at least eight poker levels and two breaks, 20-minute poker levels, 15-minute breaks, escalating blinds, and big-blind antes. `createInitialState()` must return a fresh deep copy with 80 players and a 30,000 starting stack.

- [ ] **Step 4: Implement calculations and the minimal application shell**

```ts
export const totalChips = (state: TournamentState): number =>
  state.configuration.startingPlayers * state.configuration.startingStack +
  state.chipLedger
    .filter((entry) => entry.kind !== 'initial')
    .reduce((sum, entry) => sum + entry.chips, 0)

export const averageStack = (state: TournamentState): number =>
  Math.round(totalChips(state) / Math.max(1, state.runtime.playersRemaining))

export const formatChips = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
```

Render the organization and tournament name in `App.tsx`, import a global `src/styles/index.css`, and configure `npm run dev`, `npm run build`, `npm run test`, `npm run typecheck`, and `npm run lint`.

- [ ] **Step 5: Run the focused tests and commit**

Run: `npm test -- --run src/domain/calculations.test.ts src/app/App.test.tsx`

Expected: PASS.

```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts eslint.config.js index.html src
git commit -m "feat: establish tournament timer foundation"
```

### Task 2: Timestamp timer engine and tournament reducer

**Files:**
- Create: `src/domain/timer.ts`, `src/domain/timer.test.ts`
- Create: `src/state/reducer.ts`, `src/state/reducer.test.ts`, `src/state/selectors.ts`

**Interfaces:**
- Consumes: `TournamentState`, `StructureEntry`, `createInitialState()`.
- Produces: `resolveTimer(state, now): TournamentState`, `tournamentReducer(state, action): TournamentState`, `TournamentAction`, `selectCurrentEntry(state)`, `selectNextPokerLevel(state)`, `selectRemainingMs(state, now)`.

- [ ] **Step 1: Write failing timer transition tests**

```ts
import { describe, expect, it } from 'vitest'
import { createInitialState } from './sampleStructure'
import { resolveTimer } from './timer'

describe('resolveTimer', () => {
  it('uses elapsed wall-clock time without interval drift', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000
    expect(resolveTimer(state, 11_250).runtime.remainingMs).toBe(49_750)
  })

  it('carries overflow into the next entry', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 10_000
    const nextDuration = state.structure[1].durationSeconds * 1000
    const result = resolveTimer(state, 12_500)
    expect(result.runtime.currentEntryIndex).toBe(1)
    expect(result.runtime.remainingMs).toBe(nextDuration - 1_500)
  })

  it('stops at zero when automatic advancement is disabled', () => {
    const state = createInitialState()
    state.settings.autoAdvance = false
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 5_000
    const result = resolveTimer(state, 8_000)
    expect(result.runtime.remainingMs).toBe(0)
    expect(result.runtime.status).toBe('paused')
  })
})
```

- [ ] **Step 2: Run the timer tests to verify failure**

Run: `npm test -- --run src/domain/timer.test.ts`

Expected: FAIL because `resolveTimer` does not exist.

- [ ] **Step 3: Implement pure timer resolution**

`resolveTimer` must clone only changed state, subtract `now - baselineAt`, walk entry durations while overflow remains, preserve the running status between entries, clear threshold alerts on each new entry, and clamp to `complete` at the final entry. With `autoAdvance: false`, it must return paused at zero. For a running result, set `baselineAt` to `now`; for a stopped result, set it to `null`.

```ts
export function resolveTimer(state: TournamentState, now: number): TournamentState {
  if (state.runtime.status !== 'running' || state.runtime.baselineAt === null) return state
  let remainingMs = state.runtime.remainingMs - Math.max(0, now - state.runtime.baselineAt)
  let currentEntryIndex = state.runtime.currentEntryIndex
  if (!state.settings.autoAdvance && remainingMs <= 0) {
    return withRuntime(state, { remainingMs: 0, baselineAt: null, status: 'paused' })
  }
  while (remainingMs <= 0 && currentEntryIndex < state.structure.length - 1) {
    currentEntryIndex += 1
    remainingMs += state.structure[currentEntryIndex].durationSeconds * 1000
  }
  const atEnd = remainingMs <= 0 && currentEntryIndex === state.structure.length - 1
  return withRuntime(state, {
    currentEntryIndex,
    remainingMs: Math.max(0, remainingMs),
    baselineAt: atEnd ? null : now,
    status: atEnd ? 'complete' : 'running',
    alertedThresholds: currentEntryIndex === state.runtime.currentEntryIndex
      ? state.runtime.alertedThresholds
      : [],
  })
}
```

- [ ] **Step 4: Write failing reducer tests for actions and player limits**

```ts
import { describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import { tournamentReducer } from './reducer'

describe('tournamentReducer', () => {
  it('pauses and resumes without losing exact time', () => {
    let state = createInitialState()
    state = tournamentReducer(state, { type: 'START', now: 1_000 })
    state = tournamentReducer(state, { type: 'PAUSE', now: 6_250 })
    const paused = state.runtime.remainingMs
    state = tournamentReducer(state, { type: 'START', now: 20_000 })
    expect(state.runtime.remainingMs).toBe(paused)
    expect(state.runtime.baselineAt).toBe(20_000)
  })

  it('never eliminates the final player', () => {
    const state = createInitialState()
    state.runtime.playersRemaining = 1
    const result = tournamentReducer(state, { type: 'ADJUST_PLAYERS', delta: -1 })
    expect(result.runtime.playersRemaining).toBe(1)
  })
})
```

- [ ] **Step 5: Implement reducer actions and selectors**

```ts
export type TournamentAction =
  | { type: 'TICK'; now: number }
  | { type: 'START'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESET_CURRENT'; now: number }
  | { type: 'RESET_TOURNAMENT'; now: number }
  | { type: 'GO_TO_ENTRY'; index: number; now: number }
  | { type: 'ADJUST_TIME'; deltaMs: number; now: number }
  | { type: 'SET_TIME'; remainingMs: number; now: number }
  | { type: 'ADJUST_PLAYERS'; delta: number }
  | { type: 'SET_PLAYERS'; players: number }
  | { type: 'SET_CONFIGURATION'; configuration: TournamentState['configuration'] }
  | { type: 'SET_STRUCTURE'; structure: StructureEntry[]; now: number }
  | { type: 'SET_SETTINGS'; settings: TournamentSettings }
  | { type: 'RESTORE'; state: TournamentState }
  | { type: 'MARK_ALERTED'; thresholdMs: number }
```

Navigation clamps to the first and last entries. `SET_TIME` clamps at zero. `ADJUST_PLAYERS` clamps between one and starting players. `RESET_TOURNAMENT` returns a fresh runtime while retaining the current configuration, structure, presets repository, and settings.

- [ ] **Step 6: Run timer/reducer tests and commit**

Run: `npm test -- --run src/domain/timer.test.ts src/state/reducer.test.ts`

Expected: PASS, including one-second, zero, first-entry, last-entry, break-overflow, and running-time-edit cases.

```bash
git add src/domain/timer* src/state
git commit -m "feat: add drift-resistant tournament engine"
```

### Task 3: Versioned persistence and application provider

**Files:**
- Create: `src/persistence/snapshot.ts`, `src/persistence/snapshot.test.ts`
- Create: `src/app/TournamentProvider.tsx`, `src/app/useTournament.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `resolveTimer`, `tournamentReducer`, `createInitialState()`.
- Produces: `saveSnapshot(storage, state, savedAt)`, `loadSnapshot(storage, now)`, `TournamentProvider`, `useTournament()` returning `{ state, now, dispatch, persistenceError }`.

- [ ] **Step 1: Write failing restoration tests**

```ts
import { describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import { loadSnapshot, saveSnapshot } from './snapshot'

describe('snapshot restoration', () => {
  it('restores a running clock paused under the safe close policy', () => {
    const storage = localStorage
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000
    saveSnapshot(storage, state, 11_000)
    const restored = loadSnapshot(storage, 31_000)
    expect(restored.state.runtime.status).toBe('paused')
    expect(restored.state.runtime.remainingMs).toBe(50_000)
  })

  it('replays elapsed time under the continue policy', () => {
    const storage = localStorage
    const state = createInitialState()
    state.settings.closeBehavior = 'continue'
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000
    saveSnapshot(storage, state, 11_000)
    const restored = loadSnapshot(storage, 31_000)
    expect(restored.state.runtime.remainingMs).toBe(30_000)
    expect(restored.state.runtime.status).toBe('running')
  })
})
```

- [ ] **Step 2: Run persistence tests to verify failure**

Run: `npm test -- --run src/persistence/snapshot.test.ts`

Expected: FAIL because the snapshot module does not exist.

- [ ] **Step 3: Implement schema validation and restore policy**

Store `{ version: 1, savedAt, state }` under `ppc-tournament:v1`. Before serialization, resolve a running timer at `savedAt`. On load, validate required object shapes, entry discriminators, numeric ranges, and structure presence. Return `{ state: createInitialState(), recovered: false }` for absent storage and `{ state: createInitialState(), recovered: true, error }` for malformed storage. Pause-policy snapshots restore paused at the saved resolved time; continue-policy snapshots call `resolveTimer` again at `now`.

```ts
const SNAPSHOT_KEY = 'ppc-tournament:v1'

export function saveSnapshot(storage: Storage, state: TournamentState, savedAt: number): void {
  const resolved = resolveTimer(state, savedAt)
  storage.setItem(SNAPSHOT_KEY, JSON.stringify({ version: 1, savedAt, state: resolved }))
}

export function loadSnapshot(storage: Storage, now: number): LoadResult {
  const raw = storage.getItem(SNAPSHOT_KEY)
  if (raw === null) return { state: createInitialState(), recovered: false }
  try {
    const snapshot = parseSnapshot(JSON.parse(raw))
    if (snapshot.state.settings.closeBehavior === 'continue') {
      return { state: resolveTimer(snapshot.state, now), recovered: false }
    }
    return {
      state: withRuntime(snapshot.state, { status: 'paused', baselineAt: null }),
      recovered: false,
    }
  } catch (error) {
    return { state: createInitialState(), recovered: true, error: String(error) }
  }
}
```

- [ ] **Step 4: Implement the provider lifecycle**

The provider must initialize from `loadSnapshot(localStorage, Date.now())`, dispatch `TICK` every 250 ms while running, save after state transitions, save a resolved snapshot every second while running, and save on `pagehide`. Catch storage exceptions and expose a persistent warning string. Keep display time in a separate `now` value so sub-second rendering does not require mutating the persisted state on every frame.

```tsx
const [state, dispatch] = useReducer(tournamentReducer, undefined, () =>
  loadSnapshot(localStorage, Date.now()).state,
)
const [now, setNow] = useState(Date.now())

useEffect(() => {
  if (state.runtime.status !== 'running') return
  const id = window.setInterval(() => {
    const tickAt = Date.now()
    setNow(tickAt)
    dispatch({ type: 'TICK', now: tickAt })
  }, 250)
  return () => window.clearInterval(id)
}, [state.runtime.status])

useEffect(() => {
  try { saveSnapshot(localStorage, state, Date.now()) }
  catch (error) { setPersistenceError(String(error)) }
}, [state])
```

- [ ] **Step 5: Test the provider and commit**

Run: `npm test -- --run src/persistence/snapshot.test.ts src/app/App.test.tsx`

Expected: PASS with fake timers proving that a delayed provider tick resolves against the current timestamp.

```bash
git add src/persistence src/app
git commit -m "feat: persist and restore tournament progress"
```

### Task 4: Broadcast-style main tournament display

**Files:**
- Create: `src/features/display/TournamentDisplay.tsx`, `Clock.tsx`, `CurrentLevel.tsx`, `PlayerStats.tsx`, `BlindStructure.tsx`, `DisplayControls.tsx`
- Create: `src/styles/index.css`, `src/styles/tokens.css`, `src/styles/display.css`, `src/styles/controls.css`
- Modify: `src/app/App.tsx`
- Test: `src/features/display/TournamentDisplay.test.tsx`

**Interfaces:**
- Consumes: `useTournament()`, selectors, calculations, reducer actions.
- Produces: `TournamentDisplay({ onOpenDirector }): JSX.Element`.

- [ ] **Step 1: Write failing display tests**

```ts
it('shows the dominant timer, current blinds, and player statistics', () => {
  renderDisplay()
  expect(screen.getByRole('timer')).toHaveTextContent('20:00')
  expect(screen.getByText('100 / 200')).toBeVisible()
  expect(screen.getByText('BIG BLIND ANTE: 200')).toBeVisible()
  expect(screen.getByText('80 / 80')).toBeVisible()
  expect(screen.getByText('2,400,000')).toBeVisible()
})

it('renders breaks and the next poker level', () => {
  renderDisplay({ currentEntryIndex: 4 })
  expect(screen.getByText('BREAK')).toBeVisible()
  expect(screen.getByText(/Next: Level 5/)).toBeVisible()
})
```

- [ ] **Step 2: Run display tests to verify failure**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx`

Expected: FAIL because the display components do not exist.

- [ ] **Step 3: Build focused display components**

`Clock` formats `Math.max(0, selectRemainingMs(state, now))` as `MM:SS`, uses `role="timer"`, and adds `clock--urgent` below 60 seconds. `CurrentLevel` derives poker level numbers by counting preceding poker entries and switches to a break presentation with the next poker level. `BlindStructure` renders every entry, marks completed/current/upcoming rows, and calls `scrollIntoView({ block: 'nearest' })` on the current row after the index changes.

```tsx
export function Clock({ remainingMs }: { remainingMs: number }) {
  const seconds = Math.ceil(Math.max(0, remainingMs) / 1000)
  const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  return <div role="timer" className={seconds <= 60 ? 'clock clock--urgent' : 'clock'}>{label}</div>
}

export function BlindStructure({ entries, currentIndex, onJump }: Props) {
  const currentRef = useRef<HTMLButtonElement>(null)
  useEffect(() => currentRef.current?.scrollIntoView({ block: 'nearest' }), [currentIndex])
  return entries.map((entry, index) => (
    <button
      key={entry.id}
      ref={index === currentIndex ? currentRef : undefined}
      className={`structure-row structure-row--${index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming'}`}
      onClick={() => onJump(index)}
    >
      {entryLabel(entries, index)}
    </button>
  ))
}
```

- [ ] **Step 4: Apply the visual and responsive system**

Define CSS tokens for `#071018` background, `#f5f0e6` text, `#f58025` accent, `#99a8b5` secondary text, and bordered elevated surfaces. Use a two-column grid around `minmax(0, 1.6fr) minmax(22rem, .8fr)`, `clamp()` typography, tabular numerals, a sticky bottom control rail, a 60-second warning glow, and an `@media (max-width: 900px)` stacked fallback. Respect `prefers-reduced-motion`.

```css
:root { --bg: #071018; --text: #f5f0e6; --accent: #f58025; --muted: #99a8b5; }
.display-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(22rem, .8fr); min-height: 100dvh; }
.clock { font-size: clamp(7rem, 16vw, 17rem); font-variant-numeric: tabular-nums; line-height: .82; }
.clock--urgent { color: #ffad66; animation: urgent-pulse 1.4s ease-in-out infinite; }
@media (max-width: 900px) { .display-grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; } }
```

- [ ] **Step 5: Run display tests and commit**

Run: `npm test -- --run src/features/display/TournamentDisplay.test.tsx`

Expected: PASS.

```bash
git add src/features/display src/styles src/app/App.tsx
git commit -m "feat: create room-readable tournament display"
```

### Task 5: Tournament Director run controls and safety dialogs

**Files:**
- Create: `src/components/Dialog.tsx`, `src/components/Toast.tsx`
- Create: `src/features/director/DirectorOverlay.tsx`, `DirectorRun.tsx`, `TournamentSettings.tsx`, `TimeEditor.tsx`, `ConfirmResetDialog.tsx`
- Modify: `src/app/App.tsx`, `src/features/display/DisplayControls.tsx`
- Test: `src/features/director/DirectorOverlay.test.tsx`

**Interfaces:**
- Consumes: `useTournament()` and all runtime/configuration reducer actions.
- Produces: `DirectorOverlay({ open, onClose })` with `run`, `structure`, `presets`, `tournament`, and `settings` tabs.

- [ ] **Step 1: Write failing overlay interaction tests**

```ts
it('edits remaining time and player count from the run panel', async () => {
  const user = userEvent.setup()
  renderApp()
  await user.click(screen.getByRole('button', { name: /tournament director/i }))
  await user.clear(screen.getByLabelText('Minutes remaining'))
  await user.type(screen.getByLabelText('Minutes remaining'), '12')
  await user.clear(screen.getByLabelText('Seconds remaining'))
  await user.type(screen.getByLabelText('Seconds remaining'), '30')
  await user.click(screen.getByRole('button', { name: 'Apply time' }))
  expect(screen.getByRole('timer')).toHaveTextContent('12:30')
})

it('requires confirmation before resetting the tournament', async () => {
  const user = userEvent.setup()
  renderApp()
  await openDirector(user)
  await user.click(screen.getByRole('button', { name: 'Reset tournament' }))
  expect(screen.getByRole('alertdialog')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Confirm full reset' })).toBeVisible()
})
```

- [ ] **Step 2: Run overlay tests to verify failure**

Run: `npm test -- --run src/features/director/DirectorOverlay.test.tsx`

Expected: FAIL because the overlay does not exist.

- [ ] **Step 3: Implement accessible overlay navigation and run controls**

Use a labelled `role="dialog"`, tab buttons, Escape-to-close behavior outside nested confirmations, focus restoration to the TD trigger, and input-safe form submission. Run controls provide start/pause, previous/next, jump select, reset current, full reset, exact `MM:SS`, ±60 seconds, player editing, tournament name, organization name, starting players, and starting stack.

```tsx
export function DirectorOverlay({ open, onClose }: DirectorOverlayProps) {
  const [tab, setTab] = useState<DirectorTab>('run')
  if (!open) return null
  return (
    <section role="dialog" aria-modal="true" aria-labelledby="director-title" className="director-overlay">
      <header><h2 id="director-title">Tournament Director</h2><button onClick={onClose}>Close</button></header>
      <nav aria-label="Director sections">
        {DIRECTOR_TABS.map((item) => <button aria-pressed={tab === item.id} onClick={() => setTab(item.id)} key={item.id}>{item.label}</button>)}
      </nav>
      {tab === 'run' && <DirectorRun />}
      {tab === 'structure' && <StructureEditor />}
      {tab === 'presets' && <PresetManager />}
      {tab === 'tournament' && <TournamentSettings />}
      {tab === 'settings' && <DirectorSettings />}
    </section>
  )
}
```

- [ ] **Step 4: Implement confirmation and validation boundaries**

Full reset copy must state that level, clock, and player progress are reset while configuration is retained. Current reset must name the current level. Starting players and stack accept positive whole numbers; changing starting players clamps current players only after explicit form submission. Dialog confirmation buttons use action-specific names rather than a generic `OK`.

```tsx
<Dialog
  role="alertdialog"
  title="Reset the entire tournament?"
  description="This resets the level, clock, and player progress. Your structure and settings are retained."
  confirmLabel="Confirm full reset"
  onConfirm={() => dispatch({ type: 'RESET_TOURNAMENT', now: Date.now() })}
  onCancel={() => setConfirmReset(false)}
/>
```

- [ ] **Step 5: Run overlay and existing tests, then commit**

Run: `npm test -- --run src/features/director/DirectorOverlay.test.tsx src/features/display/TournamentDisplay.test.tsx`

Expected: PASS.

```bash
git add src/components src/features/director src/features/display/DisplayControls.tsx src/app/App.tsx
git commit -m "feat: add tournament director run controls"
```

### Task 6: Blind structure editor and named presets

**Files:**
- Create: `src/domain/validation.ts`, `src/domain/validation.test.ts`
- Create: `src/persistence/presets.ts`, `src/persistence/presets.test.ts`
- Create: `src/features/director/StructureEditor.tsx`, `StructureRow.tsx`, `PresetManager.tsx`
- Modify: `src/features/director/DirectorOverlay.tsx`
- Test: `src/features/director/StructureEditor.test.tsx`

**Interfaces:**
- Consumes: `StructureEntry`, `SET_STRUCTURE`, localStorage.
- Produces: `validateStructure(entries): ValidationResult`, `PresetRepository` with `list`, `save`, `duplicate`, `rename`, `remove`, `load`, plus draft-based editor UI.

- [ ] **Step 1: Write failing validation and preset tests**

```ts
it('rejects malformed blinds and ante modes', () => {
  const result = validateStructure([{
    id: 'bad', kind: 'level', durationSeconds: 1200,
    smallBlind: 500, bigBlind: 400, ante: 0, anteType: 'big-blind',
  }])
  expect(result.valid).toBe(false)
  expect(result.issues.map((issue) => issue.field)).toEqual(
    expect.arrayContaining(['smallBlind', 'ante']),
  )
})

it('duplicates presets without sharing entry references', () => {
  const repository = createPresetRepository(localStorage)
  const original = repository.save('Standard', createInitialState().structure)
  const copy = repository.duplicate(original.id, 'Standard Copy')
  copy.structure[0].durationSeconds = 60
  expect(repository.load(original.id).structure[0].durationSeconds).toBe(1200)
})
```

- [ ] **Step 2: Run structure tests to verify failure**

Run: `npm test -- --run src/domain/validation.test.ts src/persistence/presets.test.ts`

Expected: FAIL because validation and preset modules do not exist.

- [ ] **Step 3: Implement validation and copy-safe preset storage**

Return issues shaped as `{ entryId, field, message }`. Enforce positive whole durations, whole nonnegative chip values, positive big blinds, small blind ≤ big blind, ante consistency, break-only fields, at least one poker level, and unique trimmed preset names limited to 60 characters. Store presets at `ppc-presets:v1` as `{ id, name, structure, createdAt, updatedAt }[]`; all inputs and outputs use `structuredClone`.

```ts
export function validateStructure(entries: StructureEntry[]): ValidationResult {
  const issues: ValidationIssue[] = []
  if (!entries.some((entry) => entry.kind === 'level')) {
    issues.push({ entryId: 'structure', field: 'structure', message: 'Add at least one poker level.' })
  }
  for (const entry of entries) {
    if (!Number.isInteger(entry.durationSeconds) || entry.durationSeconds <= 0) {
      issues.push({ entryId: entry.id, field: 'durationSeconds', message: 'Enter a positive whole duration.' })
    }
    if (entry.kind === 'level' && entry.smallBlind > entry.bigBlind) {
      issues.push({ entryId: entry.id, field: 'smallBlind', message: 'Small blind cannot exceed big blind.' })
    }
    if (entry.kind === 'level' && entry.anteType !== 'none' && entry.ante <= 0) {
      issues.push({ entryId: entry.id, field: 'ante', message: 'This ante mode requires a positive ante.' })
    }
  }
  return { valid: issues.length === 0, issues }
}
```

- [ ] **Step 4: Write the failing structure editor interaction test**

```ts
it('adds a break, reorders it, and applies the draft atomically', async () => {
  const user = userEvent.setup()
  renderApp()
  await openStructureTab(user)
  await user.click(screen.getByRole('button', { name: 'Insert break' }))
  const breakRow = screen.getByRole('group', { name: /break/i })
  await user.clear(within(breakRow).getByLabelText('Duration minutes'))
  await user.type(within(breakRow).getByLabelText('Duration minutes'), '10')
  await user.click(within(breakRow).getByRole('button', { name: 'Move up' }))
  await user.click(screen.getByRole('button', { name: 'Apply structure' }))
  expect(screen.getByText('BREAK — 10 MIN')).toBeVisible()
})
```

- [ ] **Step 5: Implement draft editing and preset management**

Structure rows support level/break creation, delete, up/down reorder, duration, blind, ante, and ante-type editing. Disable Apply while issues exist and show each issue beside its field. Loading a preset after progress opens a confirmation, then replaces the live structure and resets to its first entry. Preset actions expose save, load, duplicate, rename, and delete; delete and active-structure replacement require confirmation.

```tsx
const [draft, setDraft] = useState(() => structuredClone(state.structure))
const validation = validateStructure(draft)

function moveEntry(index: number, delta: -1 | 1) {
  setDraft((current) => {
    const next = structuredClone(current)
    const target = Math.max(0, Math.min(next.length - 1, index + delta))
    const [entry] = next.splice(index, 1)
    next.splice(target, 0, entry)
    return next
  })
}

<button
  disabled={!validation.valid}
  onClick={() => dispatch({ type: 'SET_STRUCTURE', structure: draft, now: Date.now() })}
>Apply structure</button>
```

- [ ] **Step 6: Run editor tests and commit**

Run: `npm test -- --run src/domain/validation.test.ts src/persistence/presets.test.ts src/features/director/StructureEditor.test.tsx`

Expected: PASS.

```bash
git add src/domain/validation* src/persistence/presets* src/features/director
git commit -m "feat: add structure editor and presets"
```

### Task 7: Alerts, settings, shortcuts, and fullscreen

**Files:**
- Create: `src/services/audio.ts`, `src/services/audio.test.ts`
- Create: `src/services/shortcuts.ts`, `src/services/shortcuts.test.ts`
- Create: `src/services/fullscreen.ts`
- Create: `src/features/director/DirectorSettings.tsx`
- Modify: `src/app/TournamentProvider.tsx`, `src/features/display/DisplayControls.tsx`, `src/features/director/DirectorOverlay.tsx`

**Interfaces:**
- Consumes: `TournamentSettings`, state transitions, current/previous entry kind.
- Produces: `createAudioAlerts()`, `shortcutForEvent(event)`, `toggleFullscreen(document)`, settings UI.

- [ ] **Step 1: Write failing shortcut and alert-policy tests**

```ts
it('maps safe keys and ignores editable targets', () => {
  expect(shortcutForEvent(keyEvent(' ', document.body))).toBe('toggle-running')
  expect(shortcutForEvent(keyEvent('ArrowRight', document.body))).toBe('next')
  expect(shortcutForEvent(keyEvent('f', document.body))).toBe('fullscreen')
  expect(shortcutForEvent(keyEvent('m', document.body))).toBe('mute')
  expect(shortcutForEvent(keyEvent(' ', document.createElement('input')))).toBeNull()
})

it('fires the one-minute alert only once per entry traversal', () => {
  const result = thresholdsCrossed(61_000, 59_000, [], settings)
  expect(result).toEqual([60_000])
  expect(thresholdsCrossed(59_000, 58_000, result, settings)).toEqual([])
})
```

- [ ] **Step 2: Run service tests to verify failure**

Run: `npm test -- --run src/services/shortcuts.test.ts src/services/audio.test.ts`

Expected: FAIL because the service modules do not exist.

- [ ] **Step 3: Implement browser services**

`shortcutForEvent` returns `toggle-running`, `next`, `previous`, `fullscreen`, `mute`, or `null` and ignores modifier keys and editable targets. `createAudioAlerts` lazily creates an `AudioContext` and plays short oscillator/gain-envelope patterns for threshold, complete, break-begin, and break-end events. `toggleFullscreen` calls `document.documentElement.requestFullscreen()` or `document.exitFullscreen()` and returns a rejected promise to the caller for nonblocking status display.

```ts
export function shortcutForEvent(event: KeyboardEvent): Shortcut | null {
  const target = event.target as HTMLElement | null
  if (event.metaKey || event.ctrlKey || event.altKey || target?.isContentEditable ||
      ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target?.tagName ?? '')) return null
  const key = event.key.toLowerCase()
  if (key === ' ') return 'toggle-running'
  if (key === 'arrowright') return 'next'
  if (key === 'arrowleft') return 'previous'
  if (key === 'f') return 'fullscreen'
  if (key === 'm') return 'mute'
  return null
}

export async function toggleFullscreen(doc: Document): Promise<void> {
  if (doc.fullscreenElement) await doc.exitFullscreen()
  else await doc.documentElement.requestFullscreen()
}
```

- [ ] **Step 4: Wire alerts and settings into the provider and overlay**

Compare the prior and current derived remaining time on ticks to detect five-minute and one-minute crossings. Dispatch `MARK_ALERTED` before playing. Detect entry-kind transitions for level complete, break beginning, and break ending. Settings expose each alert, mute, automatic advancement, close behavior, and the shortcut reference. Main controls expose mute and fullscreen with accessible pressed states.

```tsx
useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    const shortcut = shortcutForEvent(event)
    if (shortcut === null) return
    event.preventDefault()
    if (shortcut === 'toggle-running') dispatch({ type: state.runtime.status === 'running' ? 'PAUSE' : 'START', now: Date.now() })
    if (shortcut === 'next') dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex + 1, now: Date.now() })
    if (shortcut === 'previous') dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex - 1, now: Date.now() })
    if (shortcut === 'mute') dispatch({ type: 'SET_SETTINGS', settings: { ...state.settings, muted: !state.settings.muted } })
    if (shortcut === 'fullscreen') void toggleFullscreen(document).catch(setStatusMessage)
  }
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [dispatch, state])
```

- [ ] **Step 5: Run service and interaction tests, then commit**

Run: `npm test -- --run src/services src/features/director/DirectorOverlay.test.tsx`

Expected: PASS, with AudioContext and fullscreen APIs stubbed in `src/test/setup.ts`.

```bash
git add src/services src/app/TournamentProvider.tsx src/features/director src/features/display/DisplayControls.tsx src/test/setup.ts
git commit -m "feat: add alerts shortcuts and fullscreen"
```

### Task 8: PWA packaging, UX hardening, documentation, and final verification

**Files:**
- Modify: `vite.config.ts`, `index.html`, `src/app/App.tsx`, `src/styles/*.css`, `package.json`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`
- Create: `src/components/ErrorBoundary.tsx`, `src/app/App.integration.test.tsx`
- Create: `README.md`

**Interfaces:**
- Consumes: the complete application.
- Produces: installable offline production build, recovery UI, end-to-end interaction coverage, operator documentation.

- [ ] **Step 1: Write the failing integration test**

```ts
it('runs a representative tournament flow and restores it', async () => {
  const user = userEvent.setup()
  const first = renderApp()
  await user.click(screen.getByRole('button', { name: 'Start tournament' }))
  vi.advanceTimersByTime(5_000)
  await user.click(screen.getByRole('button', { name: 'Pause tournament' }))
  expect(screen.getByRole('timer')).toHaveTextContent('19:55')
  await user.click(screen.getByRole('button', { name: 'Eliminate player' }))
  expect(screen.getByText('79 / 80')).toBeVisible()
  first.unmount()
  renderApp()
  expect(screen.getByRole('timer')).toHaveTextContent('19:55')
  expect(screen.getByText('79 / 80')).toBeVisible()
})
```

- [ ] **Step 2: Run the integration test to verify failure**

Run: `npm test -- --run src/app/App.integration.test.tsx`

Expected: FAIL until the complete provider and control flow satisfy the scenario.

- [ ] **Step 3: Add PWA metadata and locally generated icons**

Configure `VitePWA` with `registerType: 'prompt'`, `display: 'standalone'`, theme/background `#071018`, start URL `/`, and 192px, 512px, and maskable icon entries. Precache local build assets, exclude development files, and make no runtime-caching entries for external origins. Create simple orange-on-navy chip/clock icons locally without third-party marks.

```ts
VitePWA({
  registerType: 'prompt',
  manifest: {
    name: 'Princeton Poker Tournament Timer',
    short_name: 'PPC Timer',
    start_url: '/',
    display: 'standalone',
    background_color: '#071018',
    theme_color: '#071018',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
})
```

- [ ] **Step 4: Add recovery and operator documentation**

Wrap the app in `ErrorBoundary`, preserving stored data and offering `Reload application` plus `Start with safe defaults` after explicit confirmation. README sections must cover prerequisites, `npm install`, `npm run dev`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run preview`, PWA installation, offline use, keyboard shortcuts, local persistence behavior, browser audio permission, fullscreen, and safe tournament operation.

```tsx
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error === null) return this.props.children
    return <main className="recovery"><h1>The display encountered an error</h1><p>Your last saved tournament remains in this browser.</p><button onClick={() => location.reload()}>Reload application</button></main>
  }
}
```

- [ ] **Step 5: Run the complete automated quality gate**

Run: `npm test -- --run && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit zero and the build output includes `dist/manifest.webmanifest` plus service-worker assets.

- [ ] **Step 6: Perform browser UX verification**

Run: `npm run dev -- --host 127.0.0.1`

Verify at 1920×1080 and 1366×768: dominant timer readability, two-column balance, active-row auto-scroll, break presentation, TD overlay focus/scrolling, structure validation, preset confirmations, player floor, timer restoration after reload, mute, shortcuts, fullscreen request, and no horizontal overflow. Fix any observed defect and rerun the quality gate.

- [ ] **Step 7: Commit the finished application**

```bash
git add README.md index.html package.json package-lock.json vite.config.ts public src
git commit -m "feat: deliver offline Princeton poker timer"
```

## Completion gate

- [ ] The complete suite, typecheck, lint, and production build exit zero.
- [ ] The timer survives delayed callbacks and reload restoration without counter drift.
- [ ] The running app has been visually inspected at television and laptop viewports.
- [ ] Destructive operations and preset replacement are confirmation-gated.
- [ ] The production build is installable and performs normal operation without a network.
- [ ] README commands match the scripts in `package.json`.
