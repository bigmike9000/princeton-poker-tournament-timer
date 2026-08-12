import type { StructureEntry, TournamentState } from '../domain/types'

const formerBundledStructure: StructureEntry[] = [
  { id: 'level-1', kind: 'level', durationSeconds: 1_200, smallBlind: 100, bigBlind: 200, ante: 200, anteType: 'big-blind' },
  { id: 'level-2', kind: 'level', durationSeconds: 1_200, smallBlind: 100, bigBlind: 300, ante: 300, anteType: 'big-blind' },
  { id: 'level-3', kind: 'level', durationSeconds: 1_200, smallBlind: 200, bigBlind: 400, ante: 400, anteType: 'big-blind' },
  { id: 'level-4', kind: 'level', durationSeconds: 1_200, smallBlind: 300, bigBlind: 600, ante: 600, anteType: 'big-blind' },
  { id: 'break-1', kind: 'break', durationSeconds: 900, label: 'Break' },
  { id: 'level-5', kind: 'level', durationSeconds: 1_200, smallBlind: 400, bigBlind: 800, ante: 800, anteType: 'big-blind' },
  { id: 'level-6', kind: 'level', durationSeconds: 1_200, smallBlind: 500, bigBlind: 1_000, ante: 1_000, anteType: 'big-blind' },
  { id: 'level-7', kind: 'level', durationSeconds: 1_200, smallBlind: 600, bigBlind: 1_200, ante: 1_200, anteType: 'big-blind' },
  { id: 'level-8', kind: 'level', durationSeconds: 1_200, smallBlind: 800, bigBlind: 1_600, ante: 1_600, anteType: 'big-blind' },
  { id: 'break-2', kind: 'break', durationSeconds: 900, label: 'Break' },
  { id: 'level-9', kind: 'level', durationSeconds: 1_200, smallBlind: 1_000, bigBlind: 2_000, ante: 2_000, anteType: 'big-blind' },
  { id: 'level-10', kind: 'level', durationSeconds: 1_200, smallBlind: 1_500, bigBlind: 3_000, ante: 3_000, anteType: 'big-blind' },
]

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (typeof left !== 'object' || left === null ||
      typeof right !== 'object' || right === null) return false

  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => deepEqual(value, right[index]))
  }

  const leftRecord = left as Record<string, unknown>
  const rightRecord = right as Record<string, unknown>
  const leftKeys = Object.keys(leftRecord).sort()
  const rightKeys = Object.keys(rightRecord).sort()
  return deepEqual(leftKeys, rightKeys) &&
    leftKeys.every((key) => deepEqual(leftRecord[key], rightRecord[key]))
}

export function isFormerBundledStructure(structure: StructureEntry[]): boolean {
  return deepEqual(structure, formerBundledStructure)
}

export function isUntouchedFormerDefault(state: TournamentState): boolean {
  return state.configuration.startingPlayers === 80 &&
    state.configuration.startingStack === 30_000 &&
    state.configuration.organizationName === 'PRINCETON POKER CLUB' &&
    state.configuration.tournamentName === 'Princeton Poker Club Standard' &&
    state.runtime.status === 'idle' &&
    state.runtime.currentEntryIndex === 0 &&
    state.runtime.playersRemaining === 80 &&
    isFormerBundledStructure(state.structure)
}
