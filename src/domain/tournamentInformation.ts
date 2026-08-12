import type { TournamentInformation, TournamentState } from './types'

type ReadonlyTournamentInformation = {
  readonly chipLines: readonly string[]
  readonly prizeLines: readonly string[]
  readonly houseNotes: readonly string[]
}

export const DEFAULT_TOURNAMENT_INFORMATION: ReadonlyTournamentInformation = {
  chipLines: [
    '10 × 1-value chips',
    '8 × 5-value chips',
    '6 × 25-value chips',
    'Starting stack: 200 chips',
  ],
  prizeLines: [
    'Prize structure will be announced by the Tournament Director before play begins.',
  ],
  houseNotes: [
    'Big-blind ante begins at 10/20.',
    'Chip-ups occur during the scheduled breaks shown in the structure.',
  ],
}

export const TOURNAMENT_RULE_SUMMARY = [
  'Fairness and the best interest of the game guide floor decisions.',
  'Protect your hand, act in turn, and make actions clear.',
  'One player to a hand; no coaching during a live hand.',
  'Keep chips visible and countable.',
  'Do not use electronic devices while holding a live hand.',
  'Table all hands face up at an all-in showdown.',
  'Clear verbal declarations made in turn are binding.',
  'The Tournament Director administers clock calls and makes final rulings.',
] as const

function cloneInformation(information: ReadonlyTournamentInformation): TournamentInformation {
  return {
    chipLines: [...information.chipLines],
    prizeLines: [...information.prizeLines],
    houseNotes: [...information.houseNotes],
  }
}

export function selectTournamentInformation(state: TournamentState): TournamentInformation {
  return cloneInformation(state.information ?? DEFAULT_TOURNAMENT_INFORMATION)
}

export function normalizeInformationLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 24)
    .map((line) => line.slice(0, 160))
}
