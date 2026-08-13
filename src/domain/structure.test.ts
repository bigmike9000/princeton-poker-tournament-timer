import { describe, expect, it } from 'vitest'
import { createInitialState, sampleStructure } from './sampleStructure'
import { durationLabel, entryDurationMs, isUntimedEntry } from './structure'

describe('PPC default structure', () => {
  it('matches every approved schedule entry exactly', () => {
    const state = createInitialState()

    expect(state.structure.map((entry) => entry.kind === 'break'
      ? ['break', entry.durationSeconds, entry.label]
      : [entry.smallBlind, entry.bigBlind, entry.ante, entry.anteType, entry.durationSeconds]
    )).toEqual([
      [1, 2, 0, 'none', 720], [2, 4, 0, 'none', 720], [3, 6, 0, 'none', 720],
      [5, 10, 0, 'none', 720], [8, 16, 0, 'none', 720],
      ['break', 600, 'Count and stack white chips in stacks of 10'],
      [10, 20, 20, 'big-blind', 900], [15, 30, 30, 'big-blind', 900],
      [20, 40, 40, 'big-blind', 900], [30, 60, 60, 'big-blind', 900],
      [40, 80, 80, 'big-blind', 900],
      ['break', 600, 'Count and stack red chips in stacks of 10'],
      [50, 100, 100, 'big-blind', 900], [75, 150, 150, 'big-blind', 900],
      [100, 200, 200, 'big-blind', 900], [150, 300, 300, 'big-blind', 900],
      [200, 400, 400, 'big-blind', 900],
      [300, 600, 600, 'big-blind', 900], [400, 800, 800, 'big-blind', 900],
      [500, 1000, 1000, 'big-blind', null],
    ])
    expect(state.configuration).toMatchObject({ startingPlayers: 80, startingStack: 200 })
    expect(state.chipLedger).toContainEqual({ id: 'initial-chips', kind: 'initial', chips: 16_000 })
  })

  it('uses the exact 80-player 200-chip configuration', () => {
    const state = createInitialState()
    expect(state.configuration.startingPlayers).toBe(80)
    expect(state.configuration.startingStack).toBe(200)
    expect(state.configuration.sponsorLabels).toEqual(['Jane Street', 'Susquehanna'])
    expect(state.chipLedger[0].chips).toBe(16_000)
  })

  it('contains 18 levels and two ten-minute breaks', () => {
    expect(sampleStructure.filter((entry) => entry.kind === 'level')).toHaveLength(18)
    expect(sampleStructure.filter((entry) => entry.kind === 'break')).toHaveLength(2)
    expect(sampleStructure).toHaveLength(20)
    expect(sampleStructure.filter((entry) => entry.kind === 'break').every((entry) => entry.durationSeconds === 600)).toBe(true)
  })

  it('keeps the inserted 150/300 level addressable by its stable ID', () => {
    expect(sampleStructure).toContainEqual(expect.objectContaining({
      id: 'level-150-300',
      kind: 'level',
      durationSeconds: 900,
      smallBlind: 150,
      bigBlind: 300,
      ante: 300,
      anteType: 'big-blind',
    }))
  })

  it('keeps bundled poker levels free of organizer-only notes', () => {
    const levels = sampleStructure.filter((entry) => entry.kind === 'level')

    expect(levels.every((entry) => entry.note === undefined)).toBe(true)
    expect(sampleStructure.filter((entry) => entry.kind === 'break').map((entry) => entry.label)).toEqual([
      'Count and stack white chips in stacks of 10',
      'Count and stack red chips in stacks of 10',
    ])
  })

  it('starts BBA at 10/20 and ends with an untimed 500/1000 level', () => {
    const levels = sampleStructure.filter((entry) => entry.kind === 'level')
    expect(levels.slice(0, 5).every((entry) => entry.anteType === 'none' && entry.ante === 0)).toBe(true)
    expect(levels[5]).toMatchObject({ smallBlind: 10, bigBlind: 20, ante: 20, anteType: 'big-blind' })
    expect(levels.at(-1)).toMatchObject({ smallBlind: 500, bigBlind: 1_000, ante: 1_000, durationSeconds: null })
  })

  it('exposes safe duration semantics', () => {
    const final = sampleStructure.at(-1)!
    expect(isUntimedEntry(final)).toBe(true)
    expect(entryDurationMs(final)).toBeNull()
    expect(durationLabel(final)).toBe('Until end')
    expect(durationLabel(sampleStructure[0])).toBe('12 min')
  })
})
