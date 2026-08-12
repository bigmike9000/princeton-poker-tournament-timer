import type { StructureEntry, TournamentState } from './types'

export const sampleStructure: StructureEntry[] = [
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

export function createInitialState(): TournamentState {
  const startingPlayers = 80
  const startingStack = 30_000
  const structure = structuredClone(sampleStructure)

  return {
    configuration: {
      organizationName: 'PRINCETON POKER CLUB',
      tournamentName: 'Princeton Poker Club Standard',
      startingPlayers,
      startingStack,
      sponsorLabels: ['SPONSOR', 'SPONSOR'],
    },
    structure,
    runtime: {
      currentEntryIndex: 0,
      status: 'idle',
      remainingMs: structure[0].durationSeconds * 1_000,
      baselineAt: null,
      playersRemaining: startingPlayers,
      alertedThresholds: [],
      transitionCause: null,
    },
    chipLedger: [
      { id: 'initial-chips', kind: 'initial', chips: startingPlayers * startingStack },
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
}
