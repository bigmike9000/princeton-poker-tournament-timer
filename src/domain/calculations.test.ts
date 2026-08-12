import { describe, expect, it } from 'vitest'
import { averageStack, formatChips, totalChips } from './calculations'
import { createInitialState } from './sampleStructure'

describe('chip calculations', () => {
  it('calculates total chips and average stack from the ledger', () => {
    const state = createInitialState()
    state.configuration.startingPlayers = 80
    state.configuration.startingStack = 30_000
    state.runtime.playersRemaining = 8

    expect(totalChips(state)).toBe(2_400_000)
    expect(averageStack(state)).toBe(300_000)
    expect(formatChips(2_400_000)).toBe('2,400,000')
  })

  it('includes future chip contributions in total chips', () => {
    const state = createInitialState()
    state.chipLedger.push({ id: 'addon-1', kind: 'addon', chips: 50_000 })

    expect(totalChips(state)).toBe(2_450_000)
  })
})
