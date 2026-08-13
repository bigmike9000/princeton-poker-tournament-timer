import { useState, type FormEvent } from 'react'
import { useTournament } from '../../app/useTournament'
import {
  normalizeInformationLines,
  PROJECTOR_INFORMATION_BUDGETS,
  selectTournamentInformation,
  validateProjectorInformation,
} from '../../domain/tournamentInformation'

export function TournamentSettings() {
  const { state, dispatch } = useTournament()
  const [tournamentName, setTournamentName] = useState(state.configuration.tournamentName)
  const [startingPlayers, setStartingPlayers] = useState(String(state.configuration.startingPlayers))
  const [startingStack, setStartingStack] = useState(String(state.configuration.startingStack))
  const [sponsorOne, setSponsorOne] = useState(state.configuration.sponsorLabels[0] ?? 'SPONSOR')
  const [sponsorTwo, setSponsorTwo] = useState(state.configuration.sponsorLabels[1] ?? 'SPONSOR')
  const [initialInformation] = useState(() => selectTournamentInformation(state))
  const [prizeLines, setPrizeLines] = useState(initialInformation.prizeLines.join('\n'))
  const [error, setError] = useState<string | null>(null)
  const normalizedPrizes = normalizeInformationLines(prizeLines)
  const information = {
    ...initialInformation,
    prizeLines: normalizedPrizes.length > 0 ? normalizedPrizes : initialInformation.prizeLines,
  }
  const informationValidation = validateProjectorInformation(information)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const players = Number(startingPlayers)
    const stack = Number(startingStack)
    if (!tournamentName.trim() ||
        !Number.isInteger(players) || players < 1 ||
        !Number.isInteger(stack) || stack < 1 || !informationValidation.valid) {
      setError('Tournament name, player count, starting stack, and prize structure must be valid.')
      return
    }
    dispatch({
      type: 'SET_CONFIGURATION',
      configuration: {
        organizationName: state.configuration.organizationName,
        tournamentName: tournamentName.trim().slice(0, 80),
        startingPlayers: players,
        startingStack: stack,
        sponsorLabels: [sponsorOne.trim() || 'SPONSOR', sponsorTwo.trim() || 'SPONSOR'],
      },
    })
    dispatch({ type: 'SET_INFORMATION', information })
    setPrizeLines(information.prizeLines.join('\n'))
    setError(null)
  }

  return (
    <div className="director-section settings-form">
      <form className="tournament-configuration-form" onSubmit={submit} noValidate>
        <div className="section-intro">
          <span className="section-kicker">Tournament identity</span>
          <h2>Event details</h2>
          <p>Changes appear on the public display immediately after they are applied.</p>
        </div>
        <section className="director-card form-grid">
          <label className="field-wide"><span>Tournament name</span><input value={tournamentName} maxLength={80} onChange={(event) => setTournamentName(event.target.value)} /></label>
          <label><span>Starting player count</span><input type="number" min="1" value={startingPlayers} onChange={(event) => setStartingPlayers(event.target.value)} /></label>
          <label><span>Starting chip stack</span><input type="number" min="1" value={startingStack} onChange={(event) => setStartingStack(event.target.value)} /></label>
          <label className="field-wide tournament-prize-field">
            <span>Prize structure</span>
            <textarea
              rows={5}
              value={prizeLines}
              aria-label="Prize structure"
              aria-invalid={informationValidation.fields.prizeLines.error ? true : undefined}
              onChange={(event) => setPrizeLines(event.target.value)}
            />
            <small className="information-field-budget">
              {informationValidation.fields.prizeLines.lineCount} of {PROJECTOR_INFORMATION_BUDGETS.prizeLines.maxLines} lines ·{' '}
              {informationValidation.fields.prizeLines.characterCount} of {PROJECTOR_INFORMATION_BUDGETS.prizeLines.maxCharacters} characters
            </small>
            {informationValidation.fields.prizeLines.error && <small className="field-error" role="alert">{informationValidation.fields.prizeLines.error}</small>}
          </label>
        </section>
        <section className="director-card form-grid">
          <div className="field-wide director-card-heading"><div><span>Branding</span><h3>Sponsors</h3></div></div>
          <label><span>Sponsor display name one</span><input value={sponsorOne} maxLength={30} onChange={(event) => setSponsorOne(event.target.value)} /></label>
          <label><span>Sponsor display name two</span><input value={sponsorTwo} maxLength={30} onChange={(event) => setSponsorTwo(event.target.value)} /></label>
        </section>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="sticky-form-actions"><button type="submit" className="primary-action" disabled={!informationValidation.valid}>Apply tournament details</button></div>
      </form>
    </div>
  )
}
