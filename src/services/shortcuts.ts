export type TournamentShortcut =
  | 'toggle-running'
  | 'fullscreen'
  | 'mute'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)
}

function isScheduleShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('[data-tournament-shortcuts="true"]') !== null
}

export function shortcutForEvent(event: KeyboardEvent): TournamentShortcut | null {
  if (event.metaKey || event.ctrlKey || event.altKey) return null
  const clockKey = event.key === ' '
  if (isEditableTarget(event.target) && !(clockKey && isScheduleShortcutTarget(event.target))) return null

  switch (event.key) {
    case ' ':
      return 'toggle-running'
    default: {
      const key = event.key.toLowerCase()
      if (key === 'f') return 'fullscreen'
      if (key === 'm') return 'mute'
      return null
    }
  }
}
