import type { Dispatch } from 'react'
import type { TournamentState } from '../../domain/types'
import { audioAlerts } from '../../services/audio'
import type { TournamentAction } from '../../state/reducer'
import { ControlIcon } from './ControlIcon'
import { PlayerCountControl } from './PlayerCountControl'

interface DisplayControlsProps {
  state: TournamentState
  dispatch: Dispatch<TournamentAction>
  onOpenDirector: () => void
  onOpenInfo: (trigger: HTMLButtonElement) => void
  fullscreen: boolean
  fullscreenError: string | null
  onToggleFullscreen: () => Promise<void>
}

export function DisplayControls({
  state,
  dispatch,
  onOpenDirector,
  onOpenInfo,
  fullscreen,
  fullscreenError,
  onToggleFullscreen,
}: DisplayControlsProps) {
  const running = state.runtime.status === 'running'
  const now = () => Date.now()

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
          className="control-button control-button--nav"
          disabled={state.runtime.currentEntryIndex === 0}
          onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex - 1, now: now() })}
          aria-label="Previous level"
        >
          <span aria-hidden="true">‹</span> Prev
        </button>
        <button
          className="control-button control-button--nav"
          disabled={state.runtime.currentEntryIndex === state.structure.length - 1}
          onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex + 1, now: now() })}
          aria-label="Next level"
        >
          Next <span aria-hidden="true">›</span>
        </button>
      </div>

      <PlayerCountControl
        playersRemaining={state.runtime.playersRemaining}
        startingPlayers={state.configuration.startingPlayers}
        onSetPlayers={(players) => dispatch({ type: 'SET_PLAYERS', players })}
        onAdjustPlayers={(delta) => dispatch({ type: 'ADJUST_PLAYERS', delta })}
      />

      <div className="control-group control-group--utility">
        {fullscreenError && <span role="status" className="control-status">{fullscreenError}</span>}
        <button
          className="icon-button utility-icon-button info-button"
          aria-label="Open tournament information"
          onClick={(event) => onOpenInfo(event.currentTarget)}
        ><ControlIcon name="info" /></button>
        <button
          className="icon-button utility-icon-button"
          aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          onClick={() => void onToggleFullscreen()}
        ><ControlIcon name={fullscreen ? 'fullscreen-exit' : 'fullscreen-enter'} /></button>
        <button
          className={state.settings.muted
            ? 'icon-button utility-icon-button utility-icon-button--active'
            : 'icon-button utility-icon-button'}
          aria-pressed={state.settings.muted}
          aria-label={state.settings.muted ? 'Unmute alerts' : 'Mute alerts'}
          onClick={() => {
            audioAlerts.unlock()
            dispatch({ type: 'SET_SETTINGS', settings: { ...state.settings, muted: !state.settings.muted } })
          }}
        ><ControlIcon name={state.settings.muted ? 'sound-off' : 'sound-on'} /></button>
        <button className="icon-button utility-icon-button" onClick={onOpenDirector} aria-label="Open Tournament Director">
          <ControlIcon name="settings" />
        </button>
      </div>
    </nav>
  )
}
