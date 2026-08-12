import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import { loadSnapshot, saveSnapshot, SNAPSHOT_KEY } from './snapshot'

describe('snapshot persistence', () => {
  beforeEach(() => localStorage.clear())

  it('restores a running clock paused under the safe close policy', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000

    saveSnapshot(localStorage, state, 11_000)
    const restored = loadSnapshot(localStorage, 31_000)

    expect(restored.state.runtime.status).toBe('paused')
    expect(restored.state.runtime.baselineAt).toBeNull()
    expect(restored.state.runtime.remainingMs).toBe(50_000)
    expect(restored.recovered).toBe(false)
  })

  it('replays elapsed wall-clock time under the continue policy', () => {
    const state = createInitialState()
    state.settings.closeBehavior = 'continue'
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000

    saveSnapshot(localStorage, state, 11_000)
    const restored = loadSnapshot(localStorage, 31_000)

    expect(restored.state.runtime.remainingMs).toBe(30_000)
    expect(restored.state.runtime.baselineAt).toBe(31_000)
    expect(restored.state.runtime.status).toBe('running')
  })

  it('continues through a level boundary while the app is closed', () => {
    const state = createInitialState()
    state.settings.closeBehavior = 'continue'
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 1_000

    saveSnapshot(localStorage, state, 1_000)
    const restored = loadSnapshot(localStorage, 3_500)

    expect(restored.state.runtime.currentEntryIndex).toBe(1)
    expect(restored.state.runtime.remainingMs).toBe(1_198_500)
  })

  it('returns safe defaults and a recovery warning for malformed storage', () => {
    localStorage.setItem(SNAPSHOT_KEY, '{not-json')

    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(true)
    expect(restored.error).toMatch(/saved tournament/i)
    expect(restored.state.runtime.currentEntryIndex).toBe(0)
  })

  it('returns fresh state when no snapshot exists', () => {
    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state.configuration.tournamentName).toBe('Princeton Poker Club Standard')
  })
})
