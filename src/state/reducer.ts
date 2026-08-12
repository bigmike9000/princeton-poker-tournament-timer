import { resolveTimer } from '../domain/timer'
import type {
  StructureEntry,
  TournamentConfiguration,
  TournamentSettings,
  TournamentState,
} from '../domain/types'

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
  | { type: 'SET_CONFIGURATION'; configuration: TournamentConfiguration }
  | { type: 'SET_STRUCTURE'; structure: StructureEntry[]; now: number }
  | { type: 'SET_SETTINGS'; settings: TournamentSettings }
  | { type: 'RESTORE'; state: TournamentState }
  | { type: 'MARK_ALERTED'; thresholdMs: number }

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function updateTime(state: TournamentState, remainingMs: number, now: number): TournamentState {
  const wasRunning = state.runtime.status === 'running'
  const resolved = resolveTimer(state, now)
  const nextRemaining = Math.max(0, Math.round(remainingMs))
  const running = wasRunning && nextRemaining > 0

  return {
    ...resolved,
    runtime: {
      ...resolved.runtime,
      remainingMs: nextRemaining,
      baselineAt: running ? now : null,
      status: running ? 'running' : 'paused',
      alertedThresholds: resolved.runtime.alertedThresholds.filter((threshold) => threshold > nextRemaining),
      transitionCause: null,
    },
  }
}

export function tournamentReducer(state: TournamentState, action: TournamentAction): TournamentState {
  switch (action.type) {
    case 'TICK':
      return resolveTimer(state, action.now)
    case 'START':
      if (state.runtime.status === 'running' || state.runtime.status === 'complete') return state
      return {
        ...state,
        runtime: {
          ...state.runtime,
          status: 'running',
          baselineAt: action.now,
          transitionCause: null,
        },
      }
    case 'PAUSE': {
      const resolved = resolveTimer(state, action.now)
      if (resolved.runtime.status !== 'running') return resolved
      return {
        ...resolved,
        runtime: { ...resolved.runtime, status: 'paused', baselineAt: null, transitionCause: null },
      }
    }
    case 'RESET_CURRENT': {
      const duration = state.structure[state.runtime.currentEntryIndex].durationSeconds * 1_000
      const running = state.runtime.status === 'running'
      return {
        ...state,
        runtime: {
          ...state.runtime,
          status: running ? 'running' : 'paused',
          remainingMs: duration,
          baselineAt: running ? action.now : null,
          alertedThresholds: [],
          transitionCause: null,
        },
      }
    }
    case 'RESET_TOURNAMENT': {
      return {
        ...state,
        runtime: {
          currentEntryIndex: 0,
          status: 'idle',
          remainingMs: state.structure[0].durationSeconds * 1_000,
          baselineAt: null,
          playersRemaining: state.configuration.startingPlayers,
          alertedThresholds: [],
          transitionCause: null,
        },
        chipLedger: [{
          id: 'initial-chips',
          kind: 'initial',
          chips: state.configuration.startingPlayers * state.configuration.startingStack,
        }],
      }
    }
    case 'GO_TO_ENTRY': {
      const index = clamp(Math.round(action.index), 0, state.structure.length - 1)
      const running = state.runtime.status === 'running'
      return {
        ...state,
        runtime: {
          ...state.runtime,
          currentEntryIndex: index,
          remainingMs: state.structure[index].durationSeconds * 1_000,
          baselineAt: running ? action.now : null,
          status: running ? 'running' : state.runtime.status === 'idle' ? 'idle' : 'paused',
          alertedThresholds: [],
          transitionCause: 'manual',
        },
      }
    }
    case 'ADJUST_TIME': {
      const resolved = resolveTimer(state, action.now)
      return updateTime(resolved, resolved.runtime.remainingMs + action.deltaMs, action.now)
    }
    case 'SET_TIME':
      return updateTime(state, action.remainingMs, action.now)
    case 'ADJUST_PLAYERS':
      return tournamentReducer(state, {
        type: 'SET_PLAYERS',
        players: state.runtime.playersRemaining + action.delta,
      })
    case 'SET_PLAYERS':
      return {
        ...state,
        runtime: {
          ...state.runtime,
          playersRemaining: clamp(
            Math.round(action.players),
            1,
            state.configuration.startingPlayers,
          ),
        },
      }
    case 'SET_CONFIGURATION': {
      const startingPlayers = Math.max(1, Math.round(action.configuration.startingPlayers))
      const startingStack = Math.max(1, Math.round(action.configuration.startingStack))
      const configuration = { ...action.configuration, startingPlayers, startingStack }
      return {
        ...state,
        configuration,
        runtime: {
          ...state.runtime,
          playersRemaining: clamp(state.runtime.playersRemaining, 1, startingPlayers),
        },
        chipLedger: state.chipLedger.map((entry) => entry.kind === 'initial'
          ? { ...entry, chips: startingPlayers * startingStack }
          : entry),
      }
    }
    case 'SET_STRUCTURE': {
      if (action.structure.length === 0) return state
      const resolved = resolveTimer(state, action.now)
      const currentId = resolved.structure[resolved.runtime.currentEntryIndex]?.id
      const matchingIndex = action.structure.findIndex((entry) => entry.id === currentId)
      const index = matchingIndex >= 0
        ? matchingIndex
        : clamp(resolved.runtime.currentEntryIndex, 0, action.structure.length - 1)
      const running = resolved.runtime.status === 'running'
      return {
        ...resolved,
        structure: structuredClone(action.structure),
        runtime: {
          ...resolved.runtime,
          currentEntryIndex: index,
          remainingMs: Math.min(
            resolved.runtime.remainingMs,
            action.structure[index].durationSeconds * 1_000,
          ),
          baselineAt: running ? action.now : null,
          alertedThresholds: [],
          transitionCause: null,
        },
      }
    }
    case 'SET_SETTINGS':
      return { ...state, settings: { ...action.settings } }
    case 'RESTORE':
      return structuredClone(action.state)
    case 'MARK_ALERTED':
      if (state.runtime.alertedThresholds.includes(action.thresholdMs)) return state
      return {
        ...state,
        runtime: {
          ...state.runtime,
          alertedThresholds: [...state.runtime.alertedThresholds, action.thresholdMs],
        },
      }
  }
}
