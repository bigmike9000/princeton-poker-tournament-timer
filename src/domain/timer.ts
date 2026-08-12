import { entryDurationMs, isUntimedEntry } from './structure'
import type { TournamentRuntime, TournamentState } from './types'

function withRuntime(state: TournamentState, runtime: Partial<TournamentRuntime>): TournamentState {
  return {
    ...state,
    runtime: {
      ...state.runtime,
      ...runtime,
    },
  }
}

export function resolveTimer(state: TournamentState, now: number): TournamentState {
  const currentEntry = state.structure[state.runtime.currentEntryIndex]
  if (state.runtime.status === 'running' && isUntimedEntry(currentEntry)) {
    return state
  }

  if (state.runtime.status !== 'running' || state.runtime.baselineAt === null) {
    return state
  }

  const elapsed = Math.max(0, now - state.runtime.baselineAt)
  let remainingMs = state.runtime.remainingMs - elapsed
  let currentEntryIndex = state.runtime.currentEntryIndex
  let changedEntry = false

  if (!state.settings.autoAdvance && remainingMs <= 0) {
    return withRuntime(state, {
      remainingMs: 0,
      baselineAt: null,
      status: 'paused',
      transitionCause: null,
    })
  }

  while (remainingMs <= 0 && currentEntryIndex < state.structure.length - 1) {
    currentEntryIndex += 1
    const durationMs = entryDurationMs(state.structure[currentEntryIndex])
    changedEntry = true
    if (durationMs === null) {
      return withRuntime(state, {
        currentEntryIndex,
        remainingMs: 0,
        baselineAt: null,
        status: 'running',
        alertedThresholds: [],
        transitionCause: 'automatic',
      })
    }
    remainingMs += durationMs
  }

  const complete = remainingMs <= 0 && currentEntryIndex === state.structure.length - 1

  return withRuntime(state, {
    currentEntryIndex,
    remainingMs: Math.max(0, remainingMs),
    baselineAt: complete ? null : now,
    status: complete ? 'complete' : 'running',
    alertedThresholds: changedEntry ? [] : state.runtime.alertedThresholds,
    transitionCause: changedEntry ? 'automatic' : null,
  })
}
