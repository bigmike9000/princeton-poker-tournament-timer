import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { DirectorOverlay } from '../features/director/DirectorOverlay'
import { TournamentDisplay } from '../features/display/TournamentDisplay'
import { InfoOverlay } from '../features/info/InfoOverlay'
import { audioAlerts } from '../services/audio'
import { toggleFullscreen } from '../services/fullscreen'
import { shortcutForEvent } from '../services/shortcuts'
import { TournamentProvider } from './TournamentProvider'
import { PwaUpdatePrompt } from './PwaUpdatePrompt'
import { useTournament } from './useTournament'

function AppContent() {
  const [directorOpen, setDirectorOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)
  const directorTrigger = useRef<HTMLElement | null>(null)
  const infoTrigger = useRef<HTMLElement | null>(null)
  const { state, dispatch } = useTournament()

  const handleFullscreen = useCallback(async () => {
    try {
      await toggleFullscreen(document)
      setFullscreen(Boolean(document.fullscreenElement))
      setFullscreenError(null)
    } catch {
      setFullscreenError('Fullscreen is unavailable in this browser.')
    }
  }, [])

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  useEffect(() => {
    const runShortcut = (event: KeyboardEvent) => {
      const shortcut = shortcutForEvent(event)
      if (shortcut === null) return
      event.preventDefault()
      const now = Date.now()

      if (shortcut === 'toggle-running') {
        audioAlerts.unlock()
        dispatch({ type: state.runtime.status === 'running' ? 'PAUSE' : 'START', now })
      } else if (shortcut === 'mute') {
        audioAlerts.unlock()
        dispatch({ type: 'SET_SETTINGS', settings: { ...state.settings, muted: !state.settings.muted } })
      } else {
        void handleFullscreen()
      }
    }

    window.addEventListener('keydown', runShortcut)
    return () => window.removeEventListener('keydown', runShortcut)
  }, [dispatch, handleFullscreen, state])

  const openDirector = () => {
    if (infoOpen) return
    directorTrigger.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setDirectorOpen(true)
  }

  const closeDirector = () => {
    setDirectorOpen(false)
  }

  const openInfo = (trigger: HTMLButtonElement) => {
    if (directorOpen) return
    infoTrigger.current = trigger
    setInfoOpen(true)
  }

  const closeInfo = () => {
    setInfoOpen(false)
  }

  const restoreDirectorFocus = useCallback(() => {
    directorTrigger.current?.focus()
  }, [])

  const restoreInfoFocus = useCallback(() => {
    infoTrigger.current?.focus()
  }, [])

  return (
    <>
      <div className="app-background">
        <TournamentDisplay
          onOpenDirector={openDirector}
          onOpenInfo={openInfo}
          fullscreen={fullscreen}
          fullscreenError={fullscreenError}
          onToggleFullscreen={handleFullscreen}
        />
        <PwaUpdatePrompt />
      </div>
      {directorOpen && !infoOpen && (
        <DirectorOverlay
          open
          onClose={closeDirector}
          onAfterClose={restoreDirectorFocus}
        />
      )}
      {infoOpen && !directorOpen && (
        <InfoOverlay
          open
          onClose={closeInfo}
          onAfterClose={restoreInfoFocus}
        />
      )}
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
