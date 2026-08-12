import { describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import { thresholdsCrossed } from './audio'

describe('thresholdsCrossed', () => {
  it('fires enabled thresholds once per entry traversal', () => {
    const settings = createInitialState().settings

    expect(thresholdsCrossed(301_000, 299_000, [], settings)).toEqual([300_000])
    expect(thresholdsCrossed(299_000, 298_000, [300_000], settings)).toEqual([])
    expect(thresholdsCrossed(61_000, 59_000, [], settings)).toEqual([60_000])
  })

  it('does not fire disabled alerts', () => {
    const settings = createInitialState().settings
    settings.alertAtFiveMinutes = false
    settings.alertAtOneMinute = false

    expect(thresholdsCrossed(301_000, 59_000, [], settings)).toEqual([])
  })
})
