import { useTournament } from '../../app/useTournament'
import { ClubLogo } from '../../components/ClubLogo'
import { selectRemainingMs } from '../../state/selectors'
import { BlindStructure } from './BlindStructure'
import { Clock } from './Clock'
import { CurrentLevel } from './CurrentLevel'
import { DisplayControls } from './DisplayControls'
import { PlayerStats } from './PlayerStats'

export interface TournamentDisplayProps {
  onOpenDirector: () => void
  fullscreen: boolean
  fullscreenError: string | null
  onToggleFullscreen: () => Promise<void>
}

export function TournamentDisplay({
  onOpenDirector,
  fullscreen,
  fullscreenError,
  onToggleFullscreen,
}: TournamentDisplayProps) {
  const { state, now, dispatch, persistenceError } = useTournament()
  const remainingMs = selectRemainingMs(state, now)
  const running = state.runtime.status === 'running'

  return (
    <div className="tournament-shell">
      {persistenceError && <div role="alert" className="persistence-warning">{persistenceError}</div>}
      <main className="display-grid">
        <section className="tournament-stage">
          <header className="brand-header">
            <ClubLogo className="club-logo" size={56} />
            <div className="brand-copy">
              <p>{state.configuration.organizationName}</p>
              <h1>{state.configuration.tournamentName}</h1>
            </div>
            <div className={running ? 'status-pill status-pill--live' : 'status-pill'}>
              <i aria-hidden="true" />
              {running ? 'Clock running' : state.runtime.status === 'complete' ? 'Tournament complete' : 'Clock paused'}
            </div>
          </header>

          <div className="stage-content">
            <CurrentLevel state={state} />
            <Clock remainingMs={remainingMs} />
            <PlayerStats state={state} />
          </div>

          <footer className="sponsor-strip" aria-label="Tournament sponsors">
            <span>Presented with support from</span>
            {state.configuration.sponsorLabels.map((label, index) => (
              <strong key={`${label}-${index}`}>{label}</strong>
            ))}
          </footer>
        </section>

        <BlindStructure state={state} />
      </main>
      <DisplayControls
        state={state}
        dispatch={dispatch}
        onOpenDirector={onOpenDirector}
        fullscreen={fullscreen}
        fullscreenError={fullscreenError}
        onToggleFullscreen={onToggleFullscreen}
      />
    </div>
  )
}
