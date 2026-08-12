import { describe, expect, it } from 'vitest'
import { breakPresentation } from './breakPresentation'

describe('breakPresentation', () => {
  it.each(['', 'Break', ' break ', 'BREAK · 10 MIN', 'Break - 10 mins'])(
    'suppresses generic or repeated subtitle %j',
    (label) => expect(breakPresentation({ id: 'break', kind: 'break', durationSeconds: 600, label })).toEqual({
      heading: 'BREAK · 10 MIN',
      subtitle: null,
      accessibleLabel: 'Break, 10 min',
    }),
  )

  it('retains operational chip-up copy once', () => {
    expect(breakPresentation({ id: 'break', kind: 'break', durationSeconds: 600, label: 'Chip up to 5s' })).toEqual({
      heading: 'BREAK · 10 MIN',
      subtitle: 'Chip up to 5s',
      accessibleLabel: 'Break, 10 min, Chip up to 5s',
    })
  })
})
