export type TournamentShortcut =
  | 'toggle-running'
  | 'next'
  | 'previous'
  | 'fullscreen'
  | 'mute'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)
}

export function shortcutForEvent(event: KeyboardEvent): TournamentShortcut | null {
  if (event.metaKey || event.ctrlKey || event.altKey || isEditableTarget(event.target)) return null

  switch (event.key) {
    case ' ':
      return 'toggle-running'
    case 'ArrowRight':
      return 'next'
    case 'ArrowLeft':
      return 'previous'
    default: {
      const key = event.key.toLowerCase()
      if (key === 'f') return 'fullscreen'
      if (key === 'm') return 'mute'
      return null
    }
  }
}
