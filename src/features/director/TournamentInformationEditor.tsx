import { useState, type FormEvent } from 'react'
import { useTournament } from '../../app/useTournament'
import {
  DEFAULT_TOURNAMENT_INFORMATION,
  normalizeInformationLines,
  selectTournamentInformation,
} from '../../domain/tournamentInformation'

function normalizedOrDefault(value: string, fallback: readonly string[]): string[] {
  const lines = normalizeInformationLines(value)
  return lines.length > 0 ? lines : [...fallback]
}

export function TournamentInformationEditor() {
  const { state, dispatch } = useTournament()
  const [initialInformation] = useState(() => selectTournamentInformation(state))
  const [chipLines, setChipLines] = useState(initialInformation.chipLines.join('\n'))
  const [prizeLines, setPrizeLines] = useState(initialInformation.prizeLines.join('\n'))
  const [houseNotes, setHouseNotes] = useState(initialInformation.houseNotes.join('\n'))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const information = {
      chipLines: normalizedOrDefault(chipLines, DEFAULT_TOURNAMENT_INFORMATION.chipLines),
      prizeLines: normalizedOrDefault(prizeLines, DEFAULT_TOURNAMENT_INFORMATION.prizeLines),
      houseNotes: normalizedOrDefault(houseNotes, DEFAULT_TOURNAMENT_INFORMATION.houseNotes),
    }
    dispatch({ type: 'SET_INFORMATION', information })
    setChipLines(information.chipLines.join('\n'))
    setPrizeLines(information.prizeLines.join('\n'))
    setHouseNotes(information.houseNotes.join('\n'))
  }

  return (
    <form className="director-card tournament-information-editor" onSubmit={submit}>
      <div className="director-card-heading">
        <div><span>Public display</span><h3>Public tournament information</h3></div>
      </div>
      <p className="information-editor-copy">Shown in the Info overlay on the tournament clock.</p>
      <div className="information-fields">
        <label>
          <span>Chip denominations and starting stack</span>
          <textarea rows={5} value={chipLines} aria-describedby="information-line-guidance" onChange={(event) => setChipLines(event.target.value)} />
        </label>
        <label>
          <span>Prize structure</span>
          <textarea rows={5} value={prizeLines} aria-describedby="information-line-guidance" onChange={(event) => setPrizeLines(event.target.value)} />
        </label>
        <label>
          <span>House notes</span>
          <textarea rows={5} value={houseNotes} aria-describedby="information-line-guidance" onChange={(event) => setHouseNotes(event.target.value)} />
        </label>
      </div>
      <div className="information-editor-actions">
        <p id="information-line-guidance">One item per line. Up to 160 characters per line.</p>
        <button type="submit" className="primary-action">Save tournament information</button>
      </div>
    </form>
  )
}
