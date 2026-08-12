import { describe, expect, it } from 'vitest'
import { createInitialState, sampleStructure } from './sampleStructure'
import { durationLabel, entryDurationMs, isUntimedEntry } from './structure'

describe('PPC default structure', () => {
  it('uses the exact 80-player 200-chip configuration', () => {
    const state = createInitialState()
    expect(state.configuration.startingPlayers).toBe(80)
    expect(state.configuration.startingStack).toBe(200)
    expect(state.chipLedger[0].chips).toBe(16_000)
  })

  it('contains 17 levels and two ten-minute breaks', () => {
    expect(sampleStructure.filter((entry) => entry.kind === 'level')).toHaveLength(17)
    expect(sampleStructure.filter((entry) => entry.kind === 'break')).toHaveLength(2)
    expect(sampleStructure.filter((entry) => entry.kind === 'break').every((entry) => entry.durationSeconds === 600)).toBe(true)
  })

  it('starts BBA at 10/20 and ends with an untimed 500/1000 level', () => {
    const levels = sampleStructure.filter((entry) => entry.kind === 'level')
    expect(levels.slice(0, 5).every((entry) => entry.anteType === 'none' && entry.ante === 0)).toBe(true)
    expect(levels[5]).toMatchObject({ smallBlind: 10, bigBlind: 20, ante: 20, anteType: 'big-blind', note: 'BB ante begins' })
    expect(levels.at(-1)).toMatchObject({ smallBlind: 500, bigBlind: 1_000, ante: 1_000, durationSeconds: null, note: 'Final level' })
  })

  it('exposes safe duration semantics', () => {
    const final = sampleStructure.at(-1)!
    expect(isUntimedEntry(final)).toBe(true)
    expect(entryDurationMs(final)).toBeNull()
    expect(durationLabel(final)).toBe('Until end')
    expect(durationLabel(sampleStructure[0])).toBe('12 min')
  })
})
