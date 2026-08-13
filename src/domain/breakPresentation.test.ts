import { describe, expect, it } from 'vitest'
import { breakPresentation } from './breakPresentation'

describe('breakPresentation', () => {
  it.each(['', 'Break', ' break ', 'BREAK · 10 MIN', 'Break - 10 mins'])(
    'suppresses generic or repeated subtitle %j',
    (label) => expect(breakPresentation({ id: 'break', kind: 'break', durationSeconds: 600, label })).toEqual({
      heading: 'BREAK — 10 MIN',
      subtitle: null,
      accessibleLabel: 'Break, 10 min',
    }),
  )

  it.each([
    ['Chip up to 5s', 'Count and stack white chips in stacks of 10'],
    ['Chip up to 25s and 100s', 'Count and stack red chips'],
  ])('updates former bundled instruction %j for saved tournaments', (label, subtitle) => {
    expect(breakPresentation({ id: 'break', kind: 'break', durationSeconds: 600, label })).toEqual({
      heading: 'BREAK — 10 MIN',
      subtitle,
      accessibleLabel: 'Break, 10 min',
    })
  })

  it('retains customized operational copy once', () => {
    expect(breakPresentation({ id: 'break', kind: 'break', durationSeconds: 600, label: 'Color up blue chips' })).toEqual({
      heading: 'BREAK — 10 MIN',
      subtitle: 'Color up blue chips',
      accessibleLabel: 'Break, 10 min',
    })
  })
})
