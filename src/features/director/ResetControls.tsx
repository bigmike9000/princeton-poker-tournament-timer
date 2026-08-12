import { useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { Dialog } from '../../components/Dialog'
import { selectEntryLabel } from '../../state/selectors'

export function ResetControls() {
  const { state, dispatch } = useTournament()
  const [confirmation, setConfirmation] = useState<'current' | 'tournament' | null>(null)

  return (
    <>
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
          onConfirm={() => { dispatch({ type: 'RESET_TOURNAMENT', now: Date.now() }); setConfirmation(null) }}
        />
      )}
    </>
  )
}
