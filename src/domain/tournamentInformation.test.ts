import { describe, expect, it } from 'vitest'
import { createInitialState } from './sampleStructure'
import {
  DEFAULT_TOURNAMENT_INFORMATION,
  normalizeInformationLines,
  PROJECTOR_INFORMATION_BUDGETS,
  selectTournamentInformation,
  TOURNAMENT_RULE_SUMMARY,
  validateProjectorInformation,
} from './tournamentInformation'

describe('tournament information', () => {
  it('ships the eight operational rules required for offline tournament play', () => {
    expect(TOURNAMENT_RULE_SUMMARY).toEqual([
      'Fairness and the best interest of the game guide floor decisions.',
      'Protect your hand, act in turn, and make actions clear.',
      'One player to a hand; no coaching during a live hand.',
      'Keep chips visible and countable.',
      'Do not use electronic devices while holding a live hand.',
      'Table all hands face up at an all-in showdown.',
      'Clear verbal declarations made in turn are binding.',
      'The Tournament Director administers clock calls and makes final rulings.',
    ])
  })

  it('ships the exact safe PPC information defaults', () => {
    const state = createInitialState()
    expect(selectTournamentInformation(state)).toEqual({
      chipLines: [
        '10 × 1-value chips',
        '8 × 5-value chips',
        '6 × 25-value chips',
        'Starting stack: 200 chips',
      ],
      prizeLines: [
        '1: 300',
        '2: 200',
        '3: 140',
        '4: 100',
        '5: 80',
        '6: 70',
        '7: 60',
        '8: 50',
      ],
      houseNotes: [
        'Big-blind ante begins at 10/20.',
        'Chip-ups occur during the scheduled breaks shown in the structure.',
      ],
    })
  })

  it('uses defaults for older state without an information block', () => {
    const state = createInitialState()
    delete state.information
    expect(selectTournamentInformation(state)).toEqual(DEFAULT_TOURNAMENT_INFORMATION)
  })

  it('gives new tournaments their own default information block', () => {
    const state = createInitialState()

    expect(state.information).toEqual(DEFAULT_TOURNAMENT_INFORMATION)
    expect(state.information).not.toBe(DEFAULT_TOURNAMENT_INFORMATION)
  })

  it('returns a mutable clone that cannot change the safe defaults', () => {
    const state = createInitialState()
    delete state.information
    const selected = selectTournamentInformation(state)

    selected.chipLines[0] = 'Changed'

    expect(DEFAULT_TOURNAMENT_INFORMATION.chipLines[0]).toBe('10 × 1-value chips')
    expect(selectTournamentInformation(state).chipLines[0]).toBe('10 × 1-value chips')
  })

  it('normalizes newline input without persisting blank lines', () => {
    expect(normalizeInformationLines('  First line\n\nSecond line  ')).toEqual(['First line', 'Second line'])
  })

  it('normalizes without silently truncating an over-budget editor draft', () => {
    const value = Array.from({ length: 25 }, (_, index) => `${index}:${'x'.repeat(200)}`).join('\n')
    const result = normalizeInformationLines(value)

    expect(result).toHaveLength(25)
    expect(result[0]).toHaveLength(202)
    expect(result.at(-1)).toMatch(/^24:/)
  })

  it('accepts the exact measured projector-safe boundary for every collection', () => {
    expect(PROJECTOR_INFORMATION_BUDGETS).toEqual({
      chipLines: { maxLines: 6, maxCharacters: 120 },
      prizeLines: { maxLines: 8, maxCharacters: 96 },
      houseNotes: { maxLines: 4, maxCharacters: 120 },
    })
    const information = {
      chipLines: Array.from({ length: 6 }, () => 'x'.repeat(20)),
      prizeLines: Array.from({ length: 8 }, () => 'x'.repeat(12)),
      houseNotes: Array.from({ length: 4 }, () => 'x'.repeat(30)),
    }

    expect(validateProjectorInformation(information)).toEqual({
      valid: true,
      fields: {
        chipLines: { lineCount: 6, characterCount: 120, error: null },
        prizeLines: { lineCount: 8, characterCount: 96, error: null },
        houseNotes: { lineCount: 4, characterCount: 120, error: null },
      },
    })
  })

  it('accepts the measured budget even when each collection uses one maximum-total line', () => {
    const information = {
      chipLines: ['x'.repeat(120)],
      prizeLines: ['x'.repeat(96)],
      houseNotes: ['x'.repeat(120)],
    }

    expect(validateProjectorInformation(information)).toMatchObject({ valid: true })
  })

  it('rejects a line or total-character count one beyond its collection budget', () => {
    const tooManyChipLines = validateProjectorInformation({
      chipLines: Array.from({ length: 7 }, () => 'x'),
      prizeLines: ['Prize'],
      houseNotes: ['House'],
    })
    const tooManyPrizeCharacters = validateProjectorInformation({
      chipLines: ['Chips'],
      prizeLines: ['x'.repeat(97)],
      houseNotes: ['House'],
    })
    const tooManyHouseCharacters = validateProjectorInformation({
      chipLines: ['Chips'],
      prizeLines: ['Prize'],
      houseNotes: ['x'.repeat(121)],
    })

    expect(tooManyChipLines.fields.chipLines).toEqual({
      lineCount: 7,
      characterCount: 7,
      error: 'Use no more than 6 lines (currently 7).',
    })
    expect(tooManyPrizeCharacters.fields.prizeLines).toEqual({
      lineCount: 1,
      characterCount: 97,
      error: 'Use no more than 96 total characters (currently 97).',
    })
    expect(tooManyHouseCharacters.fields.houseNotes).toEqual({
      lineCount: 1,
      characterCount: 121,
      error: 'Use no more than 120 total characters (currently 121).',
    })
    expect(tooManyChipLines.valid).toBe(false)
    expect(tooManyPrizeCharacters.valid).toBe(false)
    expect(tooManyHouseCharacters.valid).toBe(false)
  })

  it('keeps the shipped defaults inside the projector-safe budget', () => {
    expect(validateProjectorInformation(DEFAULT_TOURNAMENT_INFORMATION).valid).toBe(true)
  })
})
