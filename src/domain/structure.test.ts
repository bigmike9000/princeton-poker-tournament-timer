import { describe, expect, it } from 'vitest'
import { createInitialState, sampleStructure } from './sampleStructure'
import { durationLabel, entryDurationMs, isUntimedEntry } from './structure'

describe('PPC default structure', () => {
  it('matches every approved schedule entry exactly', () => {
    expect(sampleStructure).toEqual([
      { id: 'level-1', kind: 'level', durationSeconds: 720, smallBlind: 1, bigBlind: 2, ante: 0, anteType: 'none' },
      { id: 'level-2', kind: 'level', durationSeconds: 720, smallBlind: 2, bigBlind: 4, ante: 0, anteType: 'none' },
      { id: 'level-3', kind: 'level', durationSeconds: 720, smallBlind: 3, bigBlind: 6, ante: 0, anteType: 'none' },
      { id: 'level-4', kind: 'level', durationSeconds: 720, smallBlind: 5, bigBlind: 10, ante: 0, anteType: 'none' },
      { id: 'level-5', kind: 'level', durationSeconds: 720, smallBlind: 8, bigBlind: 16, ante: 0, anteType: 'none' },
      { id: 'break-1', kind: 'break', durationSeconds: 600, label: 'Chip up to 5s' },
      { id: 'level-6', kind: 'level', durationSeconds: 900, smallBlind: 10, bigBlind: 20, ante: 20, anteType: 'big-blind', note: 'BB ante begins' },
      { id: 'level-7', kind: 'level', durationSeconds: 900, smallBlind: 15, bigBlind: 30, ante: 30, anteType: 'big-blind' },
      { id: 'level-8', kind: 'level', durationSeconds: 900, smallBlind: 20, bigBlind: 40, ante: 40, anteType: 'big-blind' },
      { id: 'level-9', kind: 'level', durationSeconds: 900, smallBlind: 30, bigBlind: 60, ante: 60, anteType: 'big-blind' },
      { id: 'level-10', kind: 'level', durationSeconds: 900, smallBlind: 40, bigBlind: 80, ante: 80, anteType: 'big-blind' },
      { id: 'break-2', kind: 'break', durationSeconds: 600, label: 'Chip up to 25s and 100s' },
      { id: 'level-11', kind: 'level', durationSeconds: 900, smallBlind: 50, bigBlind: 100, ante: 100, anteType: 'big-blind' },
      { id: 'level-12', kind: 'level', durationSeconds: 900, smallBlind: 75, bigBlind: 150, ante: 150, anteType: 'big-blind' },
      { id: 'level-13', kind: 'level', durationSeconds: 900, smallBlind: 100, bigBlind: 200, ante: 200, anteType: 'big-blind', note: 'Final table target · chip up to 100s and 500s' },
      { id: 'level-14', kind: 'level', durationSeconds: 900, smallBlind: 200, bigBlind: 400, ante: 400, anteType: 'big-blind' },
      { id: 'level-15', kind: 'level', durationSeconds: 900, smallBlind: 300, bigBlind: 600, ante: 600, anteType: 'big-blind', note: 'Expected finish' },
      { id: 'level-16', kind: 'level', durationSeconds: 900, smallBlind: 400, bigBlind: 800, ante: 800, anteType: 'big-blind' },
      { id: 'level-17', kind: 'level', durationSeconds: null, smallBlind: 500, bigBlind: 1_000, ante: 1_000, anteType: 'big-blind', note: 'Final level' },
    ])
  })

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
