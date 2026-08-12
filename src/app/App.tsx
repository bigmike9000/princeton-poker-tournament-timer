import { createInitialState } from '../domain/sampleStructure'

export function App() {
  const state = createInitialState()

  return (
    <main>
      <p>{state.configuration.organizationName}</p>
      <h1>{state.configuration.tournamentName}</h1>
    </main>
  )
}
