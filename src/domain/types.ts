export type AnteType = 'none' | 'traditional' | 'big-blind'

export interface PokerLevel {
  id: string
  kind: 'level'
  durationSeconds: number | null
  smallBlind: number
  bigBlind: number
  ante: number
  anteType: AnteType
  note?: string
}

export interface BreakLevel {
  id: string
  kind: 'break'
  durationSeconds: number
  label: string
}

export type StructureEntry = PokerLevel | BreakLevel
export type TimerStatus = 'idle' | 'running' | 'paused' | 'complete'

export interface TournamentSettings {
  autoAdvance: boolean
  closeBehavior: 'pause' | 'continue'
  muted: boolean
  alertAtFiveMinutes: boolean
  alertAtOneMinute: boolean
  alertLevelComplete: boolean
  alertBreakBeginning: boolean
  alertBreakEnding: boolean
}

export interface TournamentConfiguration {
  organizationName: string
  tournamentName: string
  startingPlayers: number
  startingStack: number
  sponsorLabels: string[]
}

export interface TournamentInformation {
  chipLines: string[]
  prizeLines: string[]
  houseNotes: string[]
}

export interface TournamentRuntime {
  currentEntryIndex: number
  status: TimerStatus
  remainingMs: number
  baselineAt: number | null
  playersRemaining: number
  alertedThresholds: number[]
  transitionCause: 'automatic' | 'manual' | null
}

export interface ChipContribution {
  id: string
  kind: 'initial' | 'reentry' | 'addon'
  chips: number
}

export interface TournamentState {
  configuration: TournamentConfiguration
  structure: StructureEntry[]
  runtime: TournamentRuntime
  chipLedger: ChipContribution[]
  settings: TournamentSettings
  information?: TournamentInformation
}
