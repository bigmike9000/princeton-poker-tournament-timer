import { describe, expect, it } from 'vitest'
import { createInitialState } from './sampleStructure'
import { validatePresetName, validateStructure } from './validation'

describe('validateStructure', () => {
  it('accepts the sample tournament structure', () => {
    expect(validateStructure(createInitialState().structure)).toEqual({ valid: true, issues: [] })
  })

  it('rejects malformed blinds and ante modes', () => {
    const result = validateStructure([{
      id: 'bad',
      kind: 'level',
      durationSeconds: 1_200,
      smallBlind: 500,
      bigBlind: 400,
      ante: 0,
      anteType: 'big-blind',
    }])

    expect(result.valid).toBe(false)
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['smallBlind', 'ante']),
    )
  })

  it('requires positive whole-minute durations and at least one poker level', () => {
    const result = validateStructure([
      { id: 'break-only', kind: 'break', durationSeconds: 61, label: 'Break' },
    ])

    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['durationSeconds', 'structure']),
    )
  })

  it('requires none antes to be zero and rejects duplicate entry ids', () => {
    const level = createInitialState().structure[0]
    if (level.kind !== 'level') throw new Error('Expected a poker level.')
    const result = validateStructure([
      { ...level, anteType: 'none', ante: 100 },
      { ...level },
    ])

    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['ante', 'id']),
    )
  })
})

describe('validatePresetName', () => {
  it('enforces nonempty unique names case-insensitively', () => {
    expect(validatePresetName(' ', [])).toMatch(/required/i)
    expect(validatePresetName('standard', ['Standard'])).toMatch(/already exists/i)
    expect(validatePresetName('Championship', ['Standard'])).toBeNull()
  })
})
