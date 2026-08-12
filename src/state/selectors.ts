import { resolveTimer } from '../domain/timer'
import type { PokerLevel, StructureEntry, TournamentState } from '../domain/types'

export function selectCurrentEntry(state: TournamentState): StructureEntry {
  return state.structure[state.runtime.currentEntryIndex]
}

export function selectNextPokerLevel(state: TournamentState): PokerLevel | null {
  for (let index = state.runtime.currentEntryIndex + 1; index < state.structure.length; index += 1) {
    const entry = state.structure[index]
    if (entry.kind === 'level') return entry
  }
  return null
}

export function selectRemainingMs(state: TournamentState, now: number): number {
  return resolveTimer(state, now).runtime.remainingMs
}

export function selectPokerLevelNumber(state: TournamentState, entryIndex: number): number | null {
  if (state.structure[entryIndex]?.kind !== 'level') return null
  return state.structure
    .slice(0, entryIndex + 1)
    .filter((entry) => entry.kind === 'level')
    .length
}

export function selectEntryLabel(state: TournamentState, entryIndex: number): string {
  const levelNumber = selectPokerLevelNumber(state, entryIndex)
  return levelNumber === null ? 'BREAK' : `LEVEL ${levelNumber}`
}
