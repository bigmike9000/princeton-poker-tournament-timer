import { describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import { tournamentReducer } from './reducer'
import { selectCurrentEntry, selectEntryLabel, selectNextPokerLevel, selectRemainingMs } from './selectors'

describe('tournamentReducer', () => {
  it('starts, pauses, and resumes without losing exact time', () => {
    let state = createInitialState()
    state = tournamentReducer(state, { type: 'START', now: 1_000 })
    state = tournamentReducer(state, { type: 'PAUSE', now: 6_250 })
    const paused = state.runtime.remainingMs
    state = tournamentReducer(state, { type: 'START', now: 20_000 })

    expect(paused).toBe(1_194_750)
    expect(state.runtime.remainingMs).toBe(paused)
    expect(state.runtime.baselineAt).toBe(20_000)
    expect(state.runtime.status).toBe('running')
  })

  it('resets the current entry to its configured duration', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 30_000
    state.runtime.baselineAt = 5_000

    const result = tournamentReducer(state, { type: 'RESET_CURRENT', now: 10_000 })

    expect(result.runtime.remainingMs).toBe(1_200_000)
    expect(result.runtime.baselineAt).toBe(10_000)
    expect(result.runtime.status).toBe('running')
  })

  it('jumps to a level and preserves the running status', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.baselineAt = 1_000

    const result = tournamentReducer(state, { type: 'GO_TO_ENTRY', index: 5, now: 2_000 })

    expect(result.runtime.currentEntryIndex).toBe(5)
    expect(result.runtime.remainingMs).toBe(1_200_000)
    expect(result.runtime.baselineAt).toBe(2_000)
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
})

describe('selectors', () => {
  it('derives the current and next poker levels around a break', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 4

    expect(selectCurrentEntry(state).kind).toBe('break')
    expect(selectNextPokerLevel(state)?.id).toBe('level-5')
    expect(selectEntryLabel(state, 4)).toBe('BREAK')
    expect(selectEntryLabel(state, 5)).toBe('LEVEL 5')
  })

  it('derives remaining time between reducer ticks', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 10_000
    state.runtime.baselineAt = 1_000

    expect(selectRemainingMs(state, 3_500)).toBe(7_500)
  })
})
