import { useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { Dialog } from '../../components/Dialog'
import { durationLabel } from '../../domain/structure'
import { selectEntryLabel } from '../../state/selectors'
import { TimeEditor } from './TimeEditor'

export function DirectorRun() {
  const { state, dispatch } = useTournament()
  const [players, setPlayers] = useState(String(state.runtime.playersRemaining))
  const [confirmation, setConfirmation] = useState<'current' | 'tournament' | null>(null)
  const running = state.runtime.status === 'running'

  const applyPlayers = () => {
    const parsed = Number(players)
    if (Number.isInteger(parsed)) dispatch({ type: 'SET_PLAYERS', players: parsed })
    setPlayers(String(Math.min(state.configuration.startingPlayers, Math.max(1, Math.round(parsed || 1)))))
  }

  return (
    <div className="director-section">
      <section className="run-hero">
        <div>
          <span className="section-kicker">Live tournament</span>
          <h2>{selectEntryLabel(state, state.runtime.currentEntryIndex)}</h2>
          <p>{running ? 'Clock is running' : 'Clock is paused'} · Entry {state.runtime.currentEntryIndex + 1} of {state.structure.length}</p>
        </div>
        <button
          className={running ? 'hero-action hero-action--pause' : 'hero-action'}
          onClick={() => dispatch({ type: running ? 'PAUSE' : 'START', now: Date.now() })}
        >{running ? 'Pause clock' : state.runtime.status === 'idle' ? 'Start clock' : 'Resume clock'}</button>
      </section>

      <section className="director-card navigation-card">
        <div className="director-card-heading"><div><span>Progression</span><h3>Move through the structure</h3></div></div>
        <div className="level-navigation">
          <button
            disabled={state.runtime.currentEntryIndex === 0}
            onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex - 1, now: Date.now() })}
            aria-label="Go to previous level"
          >← Previous</button>
          <label>
            <span>Choose level or break</span>
            <select
              value={state.runtime.currentEntryIndex}
              onChange={(event) => dispatch({ type: 'GO_TO_ENTRY', index: Number(event.target.value), now: Date.now() })}
            >
              {state.structure.map((entry, index) => (
                <option key={entry.id} value={index}>
                  {selectEntryLabel(state, index)} · {durationLabel(entry)}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={state.runtime.currentEntryIndex === state.structure.length - 1}
            onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.runtime.currentEntryIndex + 1, now: Date.now() })}
            aria-label="Go to next level"
          >Next →</button>
        </div>
      </section>

      <TimeEditor key={state.structure[state.runtime.currentEntryIndex].id} />

      <section className="director-card player-editor">
        <div className="director-card-heading"><div><span>Field</span><h3>Players remaining</h3></div><strong>{state.runtime.playersRemaining} / {state.configuration.startingPlayers}</strong></div>
        <div className="player-edit-row">
          <button onClick={() => { dispatch({ type: 'ADJUST_PLAYERS', delta: -1 }); setPlayers(String(Math.max(1, state.runtime.playersRemaining - 1))) }} disabled={state.runtime.playersRemaining <= 1}>Eliminate one</button>
          <label><span>Players remaining</span><input type="number" min="1" max={state.configuration.startingPlayers} value={players} onChange={(event) => setPlayers(event.target.value)} /></label>
          <button className="primary-action" onClick={applyPlayers}>Apply player count</button>
          <button onClick={() => { dispatch({ type: 'ADJUST_PLAYERS', delta: 1 }); setPlayers(String(Math.min(state.configuration.startingPlayers, state.runtime.playersRemaining + 1))) }} disabled={state.runtime.playersRemaining >= state.configuration.startingPlayers}>Restore one</button>
        </div>
      </section>

      <section className="danger-zone">
        <div><span>Reset controls</span><p>These actions discard current progress and require confirmation.</p></div>
        <button onClick={() => setConfirmation('current')}>Reset current level</button>
        <button className="danger-outline" onClick={() => setConfirmation('tournament')}>Reset tournament</button>
      </section>

      {confirmation === 'current' && (
        <Dialog
          title="Reset current level?"
          description={`The ${selectEntryLabel(state, state.runtime.currentEntryIndex).toLowerCase()} clock will return to its full configured duration.`}
          confirmLabel="Confirm level reset"
          onCancel={() => setConfirmation(null)}
          onConfirm={() => { dispatch({ type: 'RESET_CURRENT', now: Date.now() }); setConfirmation(null) }}
        />
      )}
      {confirmation === 'tournament' && (
        <Dialog
          title="Reset the entire tournament?"
          description="This resets the level, clock, and player progress. Your blind structure and settings are retained."
          confirmLabel="Confirm full reset"
          destructive
          onCancel={() => setConfirmation(null)}
          onConfirm={() => { dispatch({ type: 'RESET_TOURNAMENT', now: Date.now() }); setPlayers(String(state.configuration.startingPlayers)); setConfirmation(null) }}
        />
      )}
    </div>
  )
}
