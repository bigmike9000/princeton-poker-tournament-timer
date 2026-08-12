import { useEffect, useState, type Dispatch } from 'react'
import type { TournamentState } from '../../domain/types'
import { audioAlerts } from '../../services/audio'
import { toggleFullscreen } from '../../services/fullscreen'
import type { TournamentAction } from '../../state/reducer'

interface DisplayControlsProps {
  state: TournamentState
  dispatch: Dispatch<TournamentAction>
  onOpenDirector: () => void
}

export function DisplayControls({ state, dispatch, onOpenDirector }: DisplayControlsProps) {
  const running = state.runtime.status === 'running'
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement))
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)
  const now = () => Date.now()

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', updateFullscreen)
    return () => document.removeEventListener('fullscreenchange', updateFullscreen)
  }, [])

  const handleFullscreen = async () => {
    try {
      await toggleFullscreen(document)
      setFullscreen(Boolean(document.fullscreenElement))
      setFullscreenError(null)
    } catch {
      setFullscreenError('Fullscreen is unavailable in this browser.')
    }
  }

  return (
    <nav className="control-rail" aria-label="Tournament controls">
      <div className="control-group control-group--primary">
        <button
          className={running ? 'control-button control-button--pause' : 'control-button control-button--start'}
          onClick={() => {
            audioAlerts.unlock()
            dispatch({ type: running ? 'PAUSE' : 'START', now: now() })
          }}
          aria-label={running ? 'Pause tournament' : 'Start tournament'}
        >
          <span aria-hidden="true">{running ? 'Ⅱ' : '▶'}</span>
          {running ? 'Pause' : state.runtime.status === 'paused' ? 'Resume' : 'Start'}
        </button>
        <button
          className="control-button"
          disabled={state.runtime.currentEntryIndex === 0}
          onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex - 1, now: now() })}
          aria-label="Previous level"
        >
          <span aria-hidden="true">‹</span> Prev
        </button>
        <button
          className="control-button"
          disabled={state.runtime.currentEntryIndex === state.structure.length - 1}
          onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex + 1, now: now() })}
          aria-label="Next level"
        >
          Next <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="player-stepper" aria-label="Players remaining controls">
        <button
          onClick={() => dispatch({ type: 'ADJUST_PLAYERS', delta: -1 })}
          disabled={state.runtime.playersRemaining <= 1}
          aria-label="Eliminate player"
        >−</button>
        <div>
          <span>Players</span>
          <strong>{state.runtime.playersRemaining}</strong>
        </div>
        <button
          onClick={() => dispatch({ type: 'ADJUST_PLAYERS', delta: 1 })}
          disabled={state.runtime.playersRemaining >= state.configuration.startingPlayers}
          aria-label="Restore player"
        >+</button>
      </div>

      <div className="control-group control-group--utility">
        {fullscreenError && <span role="status" className="control-status">{fullscreenError}</span>}
        <button
          className="icon-button"
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={() => void handleFullscreen()}
        >{fullscreen ? 'Exit screen' : 'Full screen'}</button>
        <button
          className="icon-button"
          aria-pressed={state.settings.muted}
          aria-label={state.settings.muted ? 'Unmute alerts' : 'Mute alerts'}
          onClick={() => {
            audioAlerts.unlock()
            dispatch({ type: 'SET_SETTINGS', settings: { ...state.settings, muted: !state.settings.muted } })
          }}
        >{state.settings.muted ? 'Sound off' : 'Sound on'}</button>
        <button className="director-button" onClick={onOpenDirector} aria-label="Open Tournament Director">
          TD Controls <span aria-hidden="true">↗</span>
        </button>
      </div>
    </nav>
  )
}
