export type AnteType = 'none' | 'traditional' | 'big-blind'

export interface PokerLevel {
  id: string
  kind: 'level'
  durationSeconds: number
  smallBlind: number
  bigBlind: number
  ante: number
  anteType: AnteType
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

export interface TournamentRuntime {
  currentEntryIndex: number
  status: TimerStatus
  remainingMs: number
  baselineAt: number | null
  playersRemaining: number
  alertedThresholds: number[]
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
}
