import { useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { DirectorOverlay } from '../features/director/DirectorOverlay'
import { TournamentDisplay } from '../features/display/TournamentDisplay'
import { audioAlerts } from '../services/audio'
import { toggleFullscreen } from '../services/fullscreen'
import { shortcutForEvent } from '../services/shortcuts'
import { TournamentProvider } from './TournamentProvider'
import { useTournament } from './useTournament'

function AppContent() {
  const [directorOpen, setDirectorOpen] = useState(false)
  const directorTrigger = useRef<HTMLElement | null>(null)
  const { state, dispatch } = useTournament()

  useEffect(() => {
    const runShortcut = (event: KeyboardEvent) => {
      const shortcut = shortcutForEvent(event)
      if (shortcut === null) return
      event.preventDefault()
      const now = Date.now()

      if (shortcut === 'toggle-running') {
        audioAlerts.unlock()
        dispatch({ type: state.runtime.status === 'running' ? 'PAUSE' : 'START', now })
      } else if (shortcut === 'next') {
        dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex + 1, now })
      } else if (shortcut === 'previous') {
        dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex - 1, now })
      } else if (shortcut === 'mute') {
        audioAlerts.unlock()
        dispatch({ type: 'SET_SETTINGS', settings: { ...state.settings, muted: !state.settings.muted } })
      } else {
        void toggleFullscreen(document)
      }
    }

    window.addEventListener('keydown', runShortcut)
    return () => window.removeEventListener('keydown', runShortcut)
  }, [dispatch, state])

  const openDirector = () => {
    directorTrigger.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setDirectorOpen(true)
  }

  const closeDirector = () => {
    setDirectorOpen(false)
    directorTrigger.current?.focus()
  }

  return (
    <>
      <TournamentDisplay onOpenDirector={openDirector} />
      <DirectorOverlay open={directorOpen} onClose={closeDirector} />
    </>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <TournamentProvider><AppContent /></TournamentProvider>
    </ErrorBoundary>
  )
}
