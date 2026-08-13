import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useTournament } from '../../app/useTournament'
import { Dialog } from '../../components/Dialog'
import { isUntimedEntry } from '../../domain/structure'
import { selectEntryLabel } from '../../state/selectors'

export function ResetControls() {
  const { state, dispatch } = useTournament()
  const [confirmation, setConfirmation] = useState<'current' | 'tournament' | null>(null)
  const invokerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (confirmation !== null || invokerRef.current === null) return
    invokerRef.current.focus()
    invokerRef.current = null
  }, [confirmation])

  const openConfirmation = (
    event: MouseEvent<HTMLButtonElement>,
    target: 'current' | 'tournament',
  ) => {
    invokerRef.current = event.currentTarget
    setConfirmation(target)
  }

  const closeConfirmation = () => setConfirmation(null)
  const currentEntry = state.structure[state.runtime.currentEntryIndex]
  const currentLabel = selectEntryLabel(state, state.runtime.currentEntryIndex).toLowerCase()
  const currentResetDescription = isUntimedEntry(currentEntry)
    ? `The ${currentLabel} clock will remain untimed and ready to run until the tournament ends.`
    : `The ${currentLabel} clock will return to its full configured duration.`

  return (
    <>
      <section className="danger-zone">
        <div><span>Reset controls</span><p>These actions discard current progress and require confirmation.</p></div>
        <button onClick={(event) => openConfirmation(event, 'current')}>Reset current level</button>
        <button className="danger-outline" onClick={(event) => openConfirmation(event, 'tournament')}>Reset tournament</button>
      </section>

      {confirmation === 'current' && (
        <Dialog
          title="Reset current level?"
          description={currentResetDescription}
          confirmLabel="Confirm level reset"
          onCancel={closeConfirmation}
          onConfirm={() => { dispatch({ type: 'RESET_CURRENT', now: Date.now() }); closeConfirmation() }}
        />
      )}
      {confirmation === 'tournament' && (
        <Dialog
          title="Reset the entire tournament?"
          description="This resets the level, clock, and player progress. The blind structure returns to Princeton Poker Club Standard; tournament details and settings are retained."
          confirmLabel="Confirm full reset"
          destructive
          onCancel={closeConfirmation}
          onConfirm={() => { dispatch({ type: 'RESET_TOURNAMENT', now: Date.now() }); closeConfirmation() }}
        />
      )}
    </>
  )
}
