import { useState } from 'react'
import { TournamentDisplay } from '../features/display/TournamentDisplay'
import { TournamentProvider } from './TournamentProvider'

function AppContent() {
  const [directorOpen, setDirectorOpen] = useState(false)

  return (
    <>
      <TournamentDisplay onOpenDirector={() => setDirectorOpen(true)} />
      {directorOpen && (
        <button className="temporary-director-close" onClick={() => setDirectorOpen(false)}>
          Close Tournament Director
        </button>
      )}
    </>
  )
}

export function App() {
  return <TournamentProvider><AppContent /></TournamentProvider>
}
