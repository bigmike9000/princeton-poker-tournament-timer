import type { StructureEntry, TournamentState } from './types'
import { entryDurationMs } from './structure'
import { DEFAULT_TOURNAMENT_INFORMATION } from './tournamentInformation'

export const DEFAULT_STACK_ALLOCATION_LABEL = '10 × 1 · 8 × 5 · 6 × 25 = 200'

export const sampleStructure: StructureEntry[] = [
  { id: 'level-1', kind: 'level', durationSeconds: 720, smallBlind: 1, bigBlind: 2, ante: 0, anteType: 'none' },
  { id: 'level-2', kind: 'level', durationSeconds: 720, smallBlind: 2, bigBlind: 4, ante: 0, anteType: 'none' },
  { id: 'level-3', kind: 'level', durationSeconds: 720, smallBlind: 3, bigBlind: 6, ante: 0, anteType: 'none' },
  { id: 'level-4', kind: 'level', durationSeconds: 720, smallBlind: 5, bigBlind: 10, ante: 0, anteType: 'none' },
  { id: 'level-5', kind: 'level', durationSeconds: 720, smallBlind: 8, bigBlind: 16, ante: 0, anteType: 'none' },
  { id: 'break-1', kind: 'break', durationSeconds: 600, label: 'Count and stack white chips in stacks of 10' },
  { id: 'level-6', kind: 'level', durationSeconds: 900, smallBlind: 10, bigBlind: 20, ante: 20, anteType: 'big-blind' },
  { id: 'level-7', kind: 'level', durationSeconds: 900, smallBlind: 15, bigBlind: 30, ante: 30, anteType: 'big-blind' },
  { id: 'level-8', kind: 'level', durationSeconds: 900, smallBlind: 20, bigBlind: 40, ante: 40, anteType: 'big-blind' },
  { id: 'level-9', kind: 'level', durationSeconds: 900, smallBlind: 30, bigBlind: 60, ante: 60, anteType: 'big-blind' },
  { id: 'level-10', kind: 'level', durationSeconds: 900, smallBlind: 40, bigBlind: 80, ante: 80, anteType: 'big-blind' },
  { id: 'break-2', kind: 'break', durationSeconds: 600, label: 'Count and stack red chips in stacks of 10' },
  { id: 'level-11', kind: 'level', durationSeconds: 900, smallBlind: 50, bigBlind: 100, ante: 100, anteType: 'big-blind' },
  { id: 'level-12', kind: 'level', durationSeconds: 900, smallBlind: 75, bigBlind: 150, ante: 150, anteType: 'big-blind' },
  { id: 'level-13', kind: 'level', durationSeconds: 900, smallBlind: 100, bigBlind: 200, ante: 200, anteType: 'big-blind' },
  { id: 'level-150-300', kind: 'level', durationSeconds: 900, smallBlind: 150, bigBlind: 300, ante: 300, anteType: 'big-blind' },
  { id: 'level-14', kind: 'level', durationSeconds: 900, smallBlind: 200, bigBlind: 400, ante: 400, anteType: 'big-blind' },
  { id: 'level-15', kind: 'level', durationSeconds: 900, smallBlind: 300, bigBlind: 600, ante: 600, anteType: 'big-blind' },
  { id: 'level-16', kind: 'level', durationSeconds: 900, smallBlind: 400, bigBlind: 800, ante: 800, anteType: 'big-blind' },
  { id: 'level-17', kind: 'level', durationSeconds: null, smallBlind: 500, bigBlind: 1_000, ante: 1_000, anteType: 'big-blind' },
]

export function createInitialState(): TournamentState {
  const startingPlayers = 80
  const startingStack = 200
  const structure = structuredClone(sampleStructure)

  return {
    configuration: {
      organizationName: 'PRINCETON POKER CLUB',
      tournamentName: 'Princeton Poker Club Standard',
      startingPlayers,
      startingStack,
      sponsorLabels: ['Jane Street', 'Susquehanna'],
    },
    structure,
    runtime: {
      currentEntryIndex: 0,
      status: 'idle',
      remainingMs: entryDurationMs(structure[0]) ?? 0,
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
    information: {
      chipLines: [...DEFAULT_TOURNAMENT_INFORMATION.chipLines],
      prizeLines: [...DEFAULT_TOURNAMENT_INFORMATION.prizeLines],
      houseNotes: [...DEFAULT_TOURNAMENT_INFORMATION.houseNotes],
    },
  }
}
