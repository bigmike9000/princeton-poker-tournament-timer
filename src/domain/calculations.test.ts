import { describe, expect, it } from 'vitest'
import { averageStack, formatChips, totalChips } from './calculations'
import { createInitialState } from './sampleStructure'

describe('chip calculations', () => {
  it('calculates total chips and average stack from the ledger', () => {
    const state = createInitialState()

    expect(totalChips(state)).toBe(16_000)
    expect(averageStack(state)).toBe(200)
    expect(formatChips(16_000)).toBe('16,000')
  })

  it('includes future chip contributions in total chips', () => {
    const state = createInitialState()
    state.chipLedger.push({ id: 'addon-1', kind: 'addon', chips: 50_000 })

    expect(totalChips(state)).toBe(66_000)
  })
})
