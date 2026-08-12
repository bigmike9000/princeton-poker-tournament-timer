import { describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import { tournamentReducer } from './reducer'
import { selectCurrentEntry, selectEntryLabel, selectNextPokerLevel, selectRemainingMs } from './selectors'

describe('tournamentReducer', () => {
  it('updates tournament information atomically', () => {
    const state = createInitialState()
    const information = {
      chipLines: ['1, 5, and 25-value chips'],
      prizeLines: ['1st — Trophy'],
      houseNotes: ['No late registration.'],
    }

    const result = tournamentReducer(state, { type: 'SET_INFORMATION', information })

    expect(result.information).toEqual(information)
    expect(result.information).not.toBe(information)
    expect(result.structure).toEqual(state.structure)
    expect(result.runtime).toEqual(state.runtime)
  })

  it('starts, pauses, and resumes without losing exact time', () => {
    let state = createInitialState()
    state = tournamentReducer(state, { type: 'START', now: 1_000 })
    state = tournamentReducer(state, { type: 'PAUSE', now: 6_250 })
    const paused = state.runtime.remainingMs
    state = tournamentReducer(state, { type: 'START', now: 20_000 })

    expect(paused).toBe(714_750)
    expect(state.runtime.remainingMs).toBe(paused)
    expect(state.runtime.baselineAt).toBe(20_000)
    expect(state.runtime.status).toBe('running')
  })

  it('does not reload the current break when that schedule entry is selected again', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 5
    state.runtime.status = 'running'
    state.runtime.remainingMs = 524_000
    state.runtime.baselineAt = 10_000

    const result = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: 5, now: 20_000 })

    expect(result).toBe(state)
    expect(result.runtime.remainingMs).toBe(524_000)
    expect(result.runtime.baselineAt).toBe(10_000)
  })

  it('pauses and resumes a running break at the exact resolved remainder', () => {
    let state = createInitialState()
    state = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: 5, now: 1_000 })
    state = tournamentReducer(state, { type: 'START', now: 1_000 })
    state = tournamentReducer(state, { type: 'PAUSE', now: 16_250 })
    expect(state.runtime).toMatchObject({ status: 'paused', remainingMs: 584_750, baselineAt: null })

    state = tournamentReducer(state, { type: 'START', now: 40_000 })
    expect(state.runtime).toMatchObject({ status: 'running', remainingMs: 584_750, baselineAt: 40_000 })
  })

  it('pauses an automatically entered break without reloading its duration', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 4
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 20_000

    const result = tournamentReducer(state, { type: 'PAUSE', now: 22_500 })

    expect(result.runtime).toMatchObject({
      currentEntryIndex: 5,
      status: 'paused',
      remainingMs: 598_500,
      baselineAt: null,
      transitionCause: null,
    })
  })

  it('resets the current entry to its configured duration', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 30_000
    state.runtime.baselineAt = 5_000

    const result = tournamentReducer(state, { type: 'RESET_CURRENT', now: 10_000 })

    expect(result.runtime.remainingMs).toBe(720_000)
    expect(result.runtime.baselineAt).toBe(10_000)
    expect(result.runtime.status).toBe('running')
  })

  it('jumps to a level and preserves the running status', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.baselineAt = 1_000

    const result = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: 6, now: 2_000 })

    expect(result.runtime.currentEntryIndex).toBe(6)
    expect(result.runtime.remainingMs).toBe(900_000)
    expect(result.runtime.baselineAt).toBe(2_000)
    expect(result.runtime.transitionCause).toBe('manual')
  })

  it('jumps to an untimed final level without a countdown baseline', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    const result = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: state.structure.length - 1, now: 5_000 })
    expect(result.runtime).toMatchObject({ remainingMs: 0, baselineAt: null, status: 'running', transitionCause: 'manual' })
  })

  it('resets an untimed current level without completing', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = 'paused'
    const result = tournamentReducer(state, { type: 'RESET_CURRENT', now: 5_000 })
    expect(result.runtime).toMatchObject({ remainingMs: 0, baselineAt: null, status: 'paused' })
  })

  it('starts and pauses an untimed level without creating a countdown baseline', () => {
    const paused = createInitialState()
    paused.runtime.currentEntryIndex = paused.structure.length - 1
    paused.runtime.status = 'paused'
    paused.runtime.remainingMs = 0
    paused.runtime.baselineAt = null

    const running = tournamentReducer(paused, { type: 'START', now: 5_000 })
    expect(running.runtime).toMatchObject({ remainingMs: 0, baselineAt: null, status: 'running' })

    const result = tournamentReducer(running, { type: 'PAUSE', now: 8_000 })
    expect(result.runtime).toMatchObject({ remainingMs: 0, baselineAt: null, status: 'paused' })
  })

  it('applies a replacement structure while preserving an active untimed level', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = 'running'
    state.runtime.remainingMs = 0
    state.runtime.baselineAt = null
    const structure = structuredClone(state.structure)
    const final = structure.at(-1)!
    if (final.kind !== 'level') throw new Error('Expected a poker level.')
    final.note = 'Replacement final level'

    const result = tournamentReducer(state, { type: 'SET_STRUCTURE', structure, now: 5_000 })

    expect(result.structure.at(-1)).toMatchObject({ note: 'Replacement final level' })
    expect(result.runtime).toMatchObject({
      currentEntryIndex: structure.length - 1,
      remainingMs: 0,
      baselineAt: null,
      status: 'running',
    })
  })

  it.each([
    ['running', 5_000],
    ['paused', null],
  ] as const)('loads the configured duration when a %s untimed level becomes timed', (status, baselineAt) => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = status
    state.runtime.remainingMs = 0
    state.runtime.baselineAt = null
    const structure = structuredClone(state.structure)
    const final = structure.at(-1)!
    if (final.kind !== 'level') throw new Error('Expected a poker level.')
    final.durationSeconds = 600

    const result = tournamentReducer(state, { type: 'SET_STRUCTURE', structure, now: 5_000 })

    expect(result.runtime).toMatchObject({
      currentEntryIndex: structure.length - 1,
      remainingMs: 600_000,
      baselineAt,
      status,
    })
  })

  it('keeps a running level active without a baseline when it becomes untimed', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = 'running'
    state.runtime.remainingMs = 420_000
    state.runtime.baselineAt = 1_000
    const current = state.structure.at(-1)!
    if (current.kind !== 'level') throw new Error('Expected a poker level.')
    current.durationSeconds = 600
    const structure = structuredClone(state.structure)
    const final = structure.at(-1)!
    if (final.kind !== 'level') throw new Error('Expected a poker level.')
    final.durationSeconds = null

    const result = tournamentReducer(state, { type: 'SET_STRUCTURE', structure, now: 5_000 })

    expect(result.runtime).toMatchObject({
      currentEntryIndex: structure.length - 1,
      remainingMs: 0,
      baselineAt: null,
      status: 'running',
    })
  })

  it('makes a completed timed level resumable when it becomes untimed', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = 'complete'
    state.runtime.remainingMs = 0
    state.runtime.baselineAt = null
    const current = state.structure.at(-1)!
    if (current.kind !== 'level') throw new Error('Expected a poker level.')
    current.durationSeconds = 600
    const structure = structuredClone(state.structure)
    const final = structure.at(-1)!
    if (final.kind !== 'level') throw new Error('Expected a poker level.')
    final.durationSeconds = null

    const result = tournamentReducer(state, { type: 'SET_STRUCTURE', structure, now: 5_000 })

    expect(result.runtime).toMatchObject({
      currentEntryIndex: structure.length - 1,
      remainingMs: 0,
      baselineAt: null,
      status: 'paused',
    })
    expect(tournamentReducer(result, { type: 'START', now: 6_000 }).runtime.status).toBe('running')
  })

  it('ignores direct time edits while the current level is untimed', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = 'running'
    state.runtime.remainingMs = 0
    state.runtime.baselineAt = null

    expect(tournamentReducer(state, { type: 'SET_TIME', remainingMs: 60_000, now: 5_000 })).toBe(state)
    expect(tournamentReducer(state, { type: 'ADJUST_TIME', deltaMs: 60_000, now: 5_000 })).toBe(state)
  })

  it('ignores SET_TIME when its timestamp advances into the untimed final level', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 2
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 10_000

    const result = tournamentReducer(state, { type: 'SET_TIME', remainingMs: 60_000, now: 12_000 })

    expect(result.runtime.currentEntryIndex).toBe(state.structure.length - 1)
    expect(result.runtime).toMatchObject({ remainingMs: 0, baselineAt: null, status: 'running' })
  })

  it('clamps navigation at the first and last entries', () => {
    const first = createInitialState()
    const beforeFirst = tournamentReducer(first, { type: 'GO_TO_ENTRY', index: -1, now: 0 })
    expect(beforeFirst.runtime.currentEntryIndex).toBe(0)

    const afterLast = tournamentReducer(first, { type: 'GO_TO_ENTRY', index: 100, now: 0 })
    expect(afterLast.runtime.currentEntryIndex).toBe(first.structure.length - 1)
  })

  it('edits a running clock from the action timestamp', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000

    const result = tournamentReducer(state, { type: 'ADJUST_TIME', deltaMs: 30_000, now: 11_000 })

    expect(result.runtime.remainingMs).toBe(80_000)
    expect(result.runtime.baselineAt).toBe(11_000)
  })

  it('never eliminates the final player or exceeds starting players', () => {
    const state = createInitialState()
    state.runtime.playersRemaining = 1
    const atOne = tournamentReducer(state, { type: 'ADJUST_PLAYERS', delta: -1 })
    expect(atOne.runtime.playersRemaining).toBe(1)

    state.runtime.playersRemaining = state.configuration.startingPlayers
    const atStart = tournamentReducer(state, { type: 'ADJUST_PLAYERS', delta: 1 })
    expect(atStart.runtime.playersRemaining).toBe(state.configuration.startingPlayers)
  })

  it('resets progress while retaining the active configuration and settings', () => {
    const state = createInitialState()
    state.configuration.tournamentName = 'Championship'
    state.settings.muted = true
    state.runtime.currentEntryIndex = 5
    state.runtime.playersRemaining = 42

    const result = tournamentReducer(state, { type: 'RESET_TOURNAMENT', now: 30_000 })

    expect(result.configuration.tournamentName).toBe('Championship')
    expect(result.settings.muted).toBe(true)
    expect(result.runtime.currentEntryIndex).toBe(0)
    expect(result.runtime.playersRemaining).toBe(result.configuration.startingPlayers)
    expect(result.runtime.status).toBe('idle')
  })

  it('resets to the first entry duration from the active structure', () => {
    const state = createInitialState()
    state.structure[0] = {
      id: 'opening-break',
      kind: 'break',
      durationSeconds: 600,
      label: 'Opening break',
    }
    state.runtime.currentEntryIndex = 3
    state.runtime.remainingMs = 12_000

    const result = tournamentReducer(state, { type: 'RESET_TOURNAMENT', now: 30_000 })

    expect(result.structure[0].id).toBe('opening-break')
    expect(result.runtime.currentEntryIndex).toBe(0)
    expect(result.runtime.remainingMs).toBe(600_000)
  })
})

describe('selectors', () => {
  it('derives the current and next poker levels around a break', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 5

    expect(selectCurrentEntry(state).kind).toBe('break')
    expect(selectNextPokerLevel(state)?.id).toBe('level-6')
    expect(selectEntryLabel(state, 5)).toBe('BREAK')
    expect(selectEntryLabel(state, 6)).toBe('LEVEL 6')
  })

  it('derives remaining time between reducer ticks', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 10_000
    state.runtime.baselineAt = 1_000

    expect(selectRemainingMs(state, 3_500)).toBe(7_500)
  })
})
