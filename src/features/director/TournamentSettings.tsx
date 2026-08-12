import { useState, type FormEvent } from 'react'
import { useTournament } from '../../app/useTournament'
import { DEFAULT_STACK_ALLOCATION_LABEL } from '../../domain/sampleStructure'
import { TournamentInformationEditor } from './TournamentInformationEditor'

export function TournamentSettings() {
  const { state, dispatch } = useTournament()
  const [organizationName, setOrganizationName] = useState(state.configuration.organizationName)
  const [tournamentName, setTournamentName] = useState(state.configuration.tournamentName)
  const [startingPlayers, setStartingPlayers] = useState(String(state.configuration.startingPlayers))
  const [startingStack, setStartingStack] = useState(String(state.configuration.startingStack))
  const [sponsorOne, setSponsorOne] = useState(state.configuration.sponsorLabels[0] ?? 'SPONSOR')
  const [sponsorTwo, setSponsorTwo] = useState(state.configuration.sponsorLabels[1] ?? 'SPONSOR')
  const [error, setError] = useState<string | null>(null)
  const draftPlayers = Number(startingPlayers)
  const draftStack = Number(startingStack)
  const validChipDraft = Number.isInteger(draftPlayers) && draftPlayers > 0
    && Number.isInteger(draftStack) && draftStack > 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const players = Number(startingPlayers)
    const stack = Number(startingStack)
    if (!organizationName.trim() || !tournamentName.trim() ||
        !Number.isInteger(players) || players < 1 ||
        !Number.isInteger(stack) || stack < 1) {
      setError('Names are required and chip/player values must be positive whole numbers.')
      return
    }
    dispatch({
      type: 'SET_CONFIGURATION',
      configuration: {
        organizationName: organizationName.trim().slice(0, 60),
        tournamentName: tournamentName.trim().slice(0, 80),
        startingPlayers: players,
        startingStack: stack,
        sponsorLabels: [sponsorOne.trim() || 'SPONSOR', sponsorTwo.trim() || 'SPONSOR'],
      },
    })
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
          <label className="field-wide"><span>Organization name</span><input value={organizationName} maxLength={60} onChange={(event) => setOrganizationName(event.target.value)} /></label>
          <label className="field-wide"><span>Tournament name</span><input value={tournamentName} maxLength={80} onChange={(event) => setTournamentName(event.target.value)} /></label>
          <label><span>Starting player count</span><input type="number" min="1" value={startingPlayers} onChange={(event) => setStartingPlayers(event.target.value)} /></label>
          <label><span>Starting chip stack</span><input type="number" min="1" value={startingStack} onChange={(event) => setStartingStack(event.target.value)} /></label>
          {validChipDraft && (
            <div className="field-wide tournament-chip-helper">
              <p>Starting chips in play: {(draftPlayers * draftStack).toLocaleString('en-US')}</p>
              {draftStack === 200 && <p>Default allocation: {DEFAULT_STACK_ALLOCATION_LABEL}</p>}
            </div>
          )}
        </section>
        <section className="director-card form-grid">
          <div className="field-wide director-card-heading"><div><span>Branding</span><h3>Neutral sponsor placeholders</h3></div></div>
          <label><span>Sponsor slot one</span><input value={sponsorOne} maxLength={30} onChange={(event) => setSponsorOne(event.target.value)} /></label>
          <label><span>Sponsor slot two</span><input value={sponsorTwo} maxLength={30} onChange={(event) => setSponsorTwo(event.target.value)} /></label>
        </section>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="sticky-form-actions"><button type="submit" className="primary-action">Apply tournament details</button></div>
      </form>
      <TournamentInformationEditor />
    </div>
  )
}
