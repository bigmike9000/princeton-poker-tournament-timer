import { useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { selectRemainingMs } from '../../state/selectors'

export function TimeEditor() {
  const { state, now, dispatch } = useTournament()
  const remainingSeconds = Math.ceil(selectRemainingMs(state, now) / 1_000)
  const liveMinutes = String(Math.floor(remainingSeconds / 60))
  const liveSeconds = String(remainingSeconds % 60)
  const [draft, setDraft] = useState<{ minutes: string; seconds: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const minutes = draft?.minutes ?? liveMinutes
  const seconds = draft?.seconds ?? liveSeconds

  const applyTime = () => {
    const parsedMinutes = Number(minutes)
    const parsedSeconds = Number(seconds)
    if (!Number.isInteger(parsedMinutes) || parsedMinutes < 0 ||
        !Number.isInteger(parsedSeconds) || parsedSeconds < 0 || parsedSeconds > 59) {
      setError('Enter whole minutes and seconds from 0 to 59.')
      return
    }
    dispatch({
      type: 'SET_TIME',
      remainingMs: (parsedMinutes * 60 + parsedSeconds) * 1_000,
      now: Date.now(),
    })
    setDraft(null)
    setError(null)
  }

  const adjustTime = (deltaMs: number) => {
    dispatch({ type: 'ADJUST_TIME', deltaMs, now: Date.now() })
    setDraft(null)
    setError(null)
  }

  return (
    <section className="director-card time-editor" aria-labelledby="time-editor-title">
      <div className="director-card-heading">
        <div><span>Clock</span><h3 id="time-editor-title">Edit remaining time</h3></div>
        <div className="quick-time-actions">
          <button onClick={() => adjustTime(-60_000)} aria-label="Subtract one minute">− 1 min</button>
          <button onClick={() => adjustTime(60_000)} aria-label="Add one minute">+ 1 min</button>
        </div>
      </div>
      <div className="time-input-row">
        <label>
          <span>Minutes remaining</span>
          <input inputMode="numeric" type="number" min="0" value={minutes} onChange={(event) => setDraft({ minutes: event.target.value, seconds })} />
        </label>
        <b aria-hidden="true">:</b>
        <label>
          <span>Seconds remaining</span>
          <input inputMode="numeric" type="number" min="0" max="59" value={seconds} onChange={(event) => setDraft({ minutes, seconds: event.target.value })} />
        </label>
        <button className="primary-action" onClick={applyTime}>Apply time</button>
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
    </section>
  )
}
