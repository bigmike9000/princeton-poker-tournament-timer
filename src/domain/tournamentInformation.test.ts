import { describe, expect, it } from 'vitest'
import { createInitialState } from './sampleStructure'
import {
  DEFAULT_TOURNAMENT_INFORMATION,
  normalizeInformationLines,
  selectTournamentInformation,
  TOURNAMENT_RULE_SUMMARY,
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
        'Prize structure will be announced by the Tournament Director before play begins.',
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

  it('caps normalized input at 24 lines and 160 characters per line', () => {
    const value = Array.from({ length: 25 }, (_, index) => `${index}:${'x'.repeat(200)}`).join('\n')
    const result = normalizeInformationLines(value)

    expect(result).toHaveLength(24)
    expect(result[0]).toHaveLength(160)
    expect(result.at(-1)).toMatch(/^23:/)
  })
})
