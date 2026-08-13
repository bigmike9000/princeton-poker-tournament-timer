import { useTournament } from '../../app/useTournament'
import { ClubBrandLockup } from '../../components/ClubBrandLockup'
import { isUntimedEntry } from '../../domain/structure'
import { selectCurrentEntry, selectRemainingMs } from '../../state/selectors'
import { BlindStructure } from './BlindStructure'
import { BreakProcedure } from './BreakProcedure'
import { Clock } from './Clock'
import { CurrentLevel } from './CurrentLevel'
import { DisplayControls } from './DisplayControls'
import { PlayerStats } from './PlayerStats'
import { SponsorStrip } from './SponsorStrip'

export interface TournamentDisplayProps {
  onOpenDirector: () => void
  onOpenInfo: (trigger: HTMLButtonElement) => void
  fullscreen: boolean
  fullscreenError: string | null
  onToggleFullscreen: () => Promise<void>
}

export function TournamentDisplay({
  onOpenDirector,
  onOpenInfo,
  fullscreen,
  fullscreenError,
  onToggleFullscreen,
}: TournamentDisplayProps) {
  const { state, now, dispatch, persistenceError } = useTournament()
  const remainingMs = selectRemainingMs(state, now)
  const currentEntry = selectCurrentEntry(state)
  const running = state.runtime.status === 'running'

  return (
    <div className="tournament-shell">
      {persistenceError && <div role="alert" className="persistence-warning">{persistenceError}</div>}
      <main className="display-grid">
        <section className="tournament-stage">
          <header className="brand-header">
            <ClubBrandLockup
              className="brand-lockup--display"
              logoClassName="club-logo"
              logoSize={64}
              organizationName={state.configuration.organizationName}
              title={state.configuration.tournamentName}
            />
            <div className={running ? 'status-pill status-pill--live' : 'status-pill'}>
              <i aria-hidden="true" />
              {running ? 'Clock running' : state.runtime.status === 'complete' ? 'Tournament complete' : 'Clock paused'}
            </div>
          </header>

          <div className="stage-content">
            <CurrentLevel state={state} />
            <Clock remainingMs={remainingMs} untimed={isUntimedEntry(currentEntry)} />
            <PlayerStats state={state} />
            <BreakProcedure entry={currentEntry} />
          </div>

          <SponsorStrip labels={state.configuration.sponsorLabels} />
        </section>

        <BlindStructure
          state={state}
          onSelectEntry={(index) => dispatch({ type: 'GO_TO_ENTRY', index, now: Date.now() })}
        />
      </main>
      <DisplayControls
        state={state}
        dispatch={dispatch}
        onOpenDirector={onOpenDirector}
        onOpenInfo={onOpenInfo}
        fullscreen={fullscreen}
        fullscreenError={fullscreenError}
        onToggleFullscreen={onToggleFullscreen}
      />
    </div>
  )
}
