import { useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { selectRemainingMs } from '../../state/selectors'

export function TimeEditor() {
  const { state, now, dispatch } = useTournament()
  const remainingSeconds = Math.ceil(selectRemainingMs(state, now) / 1_000)
  const [minutes, setMinutes] = useState(String(Math.floor(remainingSeconds / 60)))
  const [seconds, setSeconds] = useState(String(remainingSeconds % 60))
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
  }

  return (
    <section className="director-card time-editor" aria-labelledby="time-editor-title">
      <div className="director-card-heading">
        <div><span>Clock</span><h3 id="time-editor-title">Edit remaining time</h3></div>
        <div className="quick-time-actions">
          <button onClick={() => dispatch({ type: 'ADJUST_TIME', deltaMs: -60_000, now: Date.now() })} aria-label="Subtract one minute">− 1 min</button>
          <button onClick={() => dispatch({ type: 'ADJUST_TIME', deltaMs: 60_000, now: Date.now() })} aria-label="Add one minute">+ 1 min</button>
        </div>
      </div>
      <div className="time-input-row">
        <label>
          <span>Minutes remaining</span>
          <input inputMode="numeric" type="number" min="0" value={minutes} onChange={(event) => setMinutes(event.target.value)} />
        </label>
        <b aria-hidden="true">:</b>
        <label>
          <span>Seconds remaining</span>
          <input inputMode="numeric" type="number" min="0" max="59" value={seconds} onChange={(event) => setSeconds(event.target.value)} />
        </label>
        <button className="primary-action" onClick={applyTime}>Apply time</button>
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
    </section>
  )
}
