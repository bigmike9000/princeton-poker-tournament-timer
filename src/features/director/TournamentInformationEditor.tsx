import { useState, type FormEvent } from 'react'
import { useTournament } from '../../app/useTournament'
import {
  DEFAULT_TOURNAMENT_INFORMATION,
  normalizeInformationLines,
  PROJECTOR_INFORMATION_BUDGETS,
  selectTournamentInformation,
  validateProjectorInformation,
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
  const information = {
    chipLines: normalizedOrDefault(chipLines, DEFAULT_TOURNAMENT_INFORMATION.chipLines),
    prizeLines: normalizedOrDefault(prizeLines, DEFAULT_TOURNAMENT_INFORMATION.prizeLines),
    houseNotes: normalizedOrDefault(houseNotes, DEFAULT_TOURNAMENT_INFORMATION.houseNotes),
  }
  const validation = validateProjectorInformation(information)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!validation.valid) return
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
          <textarea
            rows={5}
            value={chipLines}
            aria-label="Chip denominations and starting stack"
            aria-describedby={`information-line-guidance information-chip-budget${validation.fields.chipLines.error ? ' information-chip-error' : ''}`}
            aria-invalid={validation.fields.chipLines.error ? true : undefined}
            onChange={(event) => setChipLines(event.target.value)}
          />
          <small id="information-chip-budget" className="information-field-budget">
            {validation.fields.chipLines.lineCount} of {PROJECTOR_INFORMATION_BUDGETS.chipLines.maxLines} lines ·{' '}
            {validation.fields.chipLines.characterCount} of {PROJECTOR_INFORMATION_BUDGETS.chipLines.maxCharacters} characters
          </small>
          {validation.fields.chipLines.error && (
            <small id="information-chip-error" className="field-error" role="alert">
              {validation.fields.chipLines.error}
            </small>
          )}
        </label>
        <label>
          <span>Prize structure</span>
          <textarea
            rows={5}
            value={prizeLines}
            aria-label="Prize structure"
            aria-describedby={`information-line-guidance information-prize-budget${validation.fields.prizeLines.error ? ' information-prize-error' : ''}`}
            aria-invalid={validation.fields.prizeLines.error ? true : undefined}
            onChange={(event) => setPrizeLines(event.target.value)}
          />
          <small id="information-prize-budget" className="information-field-budget">
            {validation.fields.prizeLines.lineCount} of {PROJECTOR_INFORMATION_BUDGETS.prizeLines.maxLines} lines ·{' '}
            {validation.fields.prizeLines.characterCount} of {PROJECTOR_INFORMATION_BUDGETS.prizeLines.maxCharacters} characters
          </small>
          {validation.fields.prizeLines.error && (
            <small id="information-prize-error" className="field-error" role="alert">
              {validation.fields.prizeLines.error}
            </small>
          )}
        </label>
        <label>
          <span>House notes</span>
          <textarea
            rows={5}
            value={houseNotes}
            aria-label="House notes"
            aria-describedby={`information-line-guidance information-house-budget${validation.fields.houseNotes.error ? ' information-house-error' : ''}`}
            aria-invalid={validation.fields.houseNotes.error ? true : undefined}
            onChange={(event) => setHouseNotes(event.target.value)}
          />
          <small id="information-house-budget" className="information-field-budget">
            {validation.fields.houseNotes.lineCount} of {PROJECTOR_INFORMATION_BUDGETS.houseNotes.maxLines} lines ·{' '}
            {validation.fields.houseNotes.characterCount} of {PROJECTOR_INFORMATION_BUDGETS.houseNotes.maxCharacters} characters
          </small>
          {validation.fields.houseNotes.error && (
            <small id="information-house-error" className="field-error" role="alert">
              {validation.fields.houseNotes.error}
            </small>
          )}
        </label>
      </div>
      <div className="information-editor-actions">
        <p id="information-line-guidance">
          One item per line. Blank lines are removed; over-limit drafts stay here and are not saved.
        </p>
        <button type="submit" className="primary-action" disabled={!validation.valid}>
          Save tournament information
        </button>
      </div>
    </form>
  )
}
