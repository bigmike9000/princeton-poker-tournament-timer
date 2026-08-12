import { entryDurationMs } from './structure'
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
    remainingMs += entryDurationMs(state.structure[currentEntryIndex]) ?? 0
    changedEntry = true
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
