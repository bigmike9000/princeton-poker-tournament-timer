import { createInitialState } from '../domain/sampleStructure'
import { TournamentProvider } from './TournamentProvider'

export function App() {
  const state = createInitialState()

  return (
    <TournamentProvider>
      <main>
        <p>{state.configuration.organizationName}</p>
        <h1>{state.configuration.tournamentName}</h1>
      </main>
    </TournamentProvider>
  )
}
