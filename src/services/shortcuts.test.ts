import { describe, expect, it } from 'vitest'
import { shortcutForEvent } from './shortcuts'

function keyEvent(key: string, target: EventTarget, options: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, ...options })
  Object.defineProperty(event, 'target', { value: target })
  return event
}

describe('shortcutForEvent', () => {
  it('maps safe Tournament Director keys', () => {
    expect(shortcutForEvent(keyEvent(' ', document.body))).toBe('toggle-running')
    expect(shortcutForEvent(keyEvent('ArrowRight', document.body))).toBeNull()
    expect(shortcutForEvent(keyEvent('ArrowLeft', document.body))).toBeNull()
    expect(shortcutForEvent(keyEvent('f', document.body))).toBe('fullscreen')
    expect(shortcutForEvent(keyEvent('M', document.body))).toBe('mute')
  })

  it('ignores editable targets and modified keys', () => {
    expect(shortcutForEvent(keyEvent(' ', document.createElement('input')))).toBeNull()
    expect(shortcutForEvent(keyEvent('ArrowRight', document.createElement('select')))).toBeNull()
    expect(shortcutForEvent(keyEvent('f', document.body, { metaKey: true }))).toBeNull()
  })

  it('allows only the clock toggle on opted-in schedule buttons', () => {
    const scheduleButton = document.createElement('button')
    scheduleButton.dataset.tournamentShortcuts = 'true'

    expect(shortcutForEvent(keyEvent(' ', scheduleButton))).toBe('toggle-running')
    expect(shortcutForEvent(keyEvent('ArrowRight', scheduleButton))).toBeNull()
    expect(shortcutForEvent(keyEvent('ArrowLeft', scheduleButton))).toBeNull()
    expect(shortcutForEvent(keyEvent('Enter', scheduleButton))).toBeNull()
  })
})
