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

const formerBundledState: TournamentState = {
  configuration: {
    organizationName: 'PRINCETON POKER CLUB',
    tournamentName: 'Princeton Poker Club Standard',
    startingPlayers: 80,
    startingStack: 30_000,
    sponsorLabels: ['SPONSOR', 'SPONSOR'],
  },
  structure: formerBundledStructure,
  runtime: {
    currentEntryIndex: 0,
    status: 'idle',
    remainingMs: 1_200_000,
    baselineAt: null,
    playersRemaining: 80,
    alertedThresholds: [],
    transitionCause: null,
  },
  chipLedger: [
    { id: 'initial-chips', kind: 'initial', chips: 2_400_000 },
  ],
  settings: {
    autoAdvance: true,
    closeBehavior: 'pause',
    muted: false,
    alertAtFiveMinutes: true,
    alertAtOneMinute: true,
    alertLevelComplete: true,
    alertBreakBeginning: true,
    alertBreakEnding: true,
  },
}

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
  return deepEqual(state, formerBundledState)
}
