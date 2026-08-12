import type { TournamentInformation, TournamentState } from './types'

type ReadonlyTournamentInformation = {
  readonly chipLines: readonly string[]
  readonly prizeLines: readonly string[]
  readonly houseNotes: readonly string[]
}

export type TournamentInformationField = keyof ReadonlyTournamentInformation

export interface ProjectorInformationBudget {
  readonly maxLines: number
  readonly maxCharacters: number
}

export const PROJECTOR_INFORMATION_BUDGETS = {
  chipLines: { maxLines: 6, maxCharacters: 120 },
  prizeLines: { maxLines: 4, maxCharacters: 96 },
  houseNotes: { maxLines: 4, maxCharacters: 120 },
} as const satisfies Record<TournamentInformationField, ProjectorInformationBudget>

export interface ProjectorInformationFieldValidation {
  lineCount: number
  characterCount: number
  error: string | null
}

export interface ProjectorInformationValidation {
  valid: boolean
  fields: Record<TournamentInformationField, ProjectorInformationFieldValidation>
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

function validateInformationField(
  lines: readonly string[],
  budget: ProjectorInformationBudget,
): ProjectorInformationFieldValidation {
  const lineCount = lines.length
  const characterCount = lines.reduce((total, line) => total + line.length, 0)
  const tooManyLines = lineCount > budget.maxLines
  const tooManyCharacters = characterCount > budget.maxCharacters
  let error: string | null = null

  if (tooManyLines && tooManyCharacters) {
    error = `Use no more than ${budget.maxLines} lines and ${budget.maxCharacters} total characters ` +
      `(currently ${lineCount} lines and ${characterCount} characters).`
  } else if (tooManyLines) {
    error = `Use no more than ${budget.maxLines} lines (currently ${lineCount}).`
  } else if (tooManyCharacters) {
    error = `Use no more than ${budget.maxCharacters} total characters (currently ${characterCount}).`
  }

  return { lineCount, characterCount, error }
}

export function validateProjectorInformation(
  information: ReadonlyTournamentInformation,
): ProjectorInformationValidation {
  const fields = {
    chipLines: validateInformationField(information.chipLines, PROJECTOR_INFORMATION_BUDGETS.chipLines),
    prizeLines: validateInformationField(information.prizeLines, PROJECTOR_INFORMATION_BUDGETS.prizeLines),
    houseNotes: validateInformationField(information.houseNotes, PROJECTOR_INFORMATION_BUDGETS.houseNotes),
  }

  return {
    valid: Object.values(fields).every((field) => field.error === null),
    fields,
  }
}

export function normalizeInformationLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}
