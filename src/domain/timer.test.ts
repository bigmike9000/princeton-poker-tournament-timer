import { describe, expect, it } from 'vitest'
import { createInitialState } from './sampleStructure'
import { entryDurationMs } from './structure'
import { resolveTimer } from './timer'

describe('resolveTimer', () => {
  it('uses elapsed wall-clock time without interval drift', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000

    expect(resolveTimer(state, 11_250).runtime.remainingMs).toBe(49_750)
  })

  it('carries exact overflow into the next entry', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 10_000
    const nextDuration = entryDurationMs(state.structure[1]) ?? 0

    const result = resolveTimer(state, 12_500)

    expect(result.runtime.currentEntryIndex).toBe(1)
    expect(result.runtime.remainingMs).toBe(nextDuration - 1_500)
    expect(result.runtime.baselineAt).toBe(12_500)
    expect(result.runtime.transitionCause).toBe('automatic')
  })

  it('automatically enters a break and carries overflow', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 4
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 20_000

    const result = resolveTimer(state, 22_500)

    expect(result.structure[result.runtime.currentEntryIndex].kind).toBe('break')
    expect(result.runtime.remainingMs).toBe(598_500)
  })

  it('can advance across multiple entries after a delayed callback', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 1_000
    const secondDuration = entryDurationMs(state.structure[1]) ?? 0
    const thirdDuration = entryDurationMs(state.structure[2]) ?? 0

    const result = resolveTimer(state, 1_000 + 1_000 + secondDuration + 5_000)

    expect(result.runtime.currentEntryIndex).toBe(2)
    expect(result.runtime.remainingMs).toBe(thirdDuration - 5_000)
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
    expect(result.runtime.baselineAt).toBeNull()
  })

  it('completes without wrapping after the final entry', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 10_000

    const result = resolveTimer(state, 12_000)

    expect(result.runtime.currentEntryIndex).toBe(state.structure.length - 1)
    expect(result.runtime.remainingMs).toBe(0)
    expect(result.runtime.status).toBe('complete')
  })
})
