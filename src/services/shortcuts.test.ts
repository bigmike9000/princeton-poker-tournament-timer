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
    expect(shortcutForEvent(keyEvent('ArrowRight', document.body))).toBe('next')
    expect(shortcutForEvent(keyEvent('ArrowLeft', document.body))).toBe('previous')
    expect(shortcutForEvent(keyEvent('f', document.body))).toBe('fullscreen')
    expect(shortcutForEvent(keyEvent('M', document.body))).toBe('mute')
  })

  it('ignores editable targets and modified keys', () => {
    expect(shortcutForEvent(keyEvent(' ', document.createElement('input')))).toBeNull()
    expect(shortcutForEvent(keyEvent('ArrowRight', document.createElement('select')))).toBeNull()
    expect(shortcutForEvent(keyEvent('f', document.body, { metaKey: true }))).toBeNull()
  })

  it('allows schedule navigation keys only on opted-in schedule buttons', () => {
    const scheduleButton = document.createElement('button')
    scheduleButton.dataset.tournamentShortcuts = 'true'

    expect(shortcutForEvent(keyEvent(' ', scheduleButton))).toBe('toggle-running')
    expect(shortcutForEvent(keyEvent('ArrowRight', scheduleButton))).toBe('next')
    expect(shortcutForEvent(keyEvent('ArrowLeft', scheduleButton))).toBe('previous')
    expect(shortcutForEvent(keyEvent('Enter', scheduleButton))).toBeNull()
  })
})
