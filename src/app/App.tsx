import { useRef, useState } from 'react'
import { DirectorOverlay } from '../features/director/DirectorOverlay'
import { TournamentDisplay } from '../features/display/TournamentDisplay'
import { TournamentProvider } from './TournamentProvider'

function AppContent() {
  const [directorOpen, setDirectorOpen] = useState(false)
  const directorTrigger = useRef<HTMLElement | null>(null)

  const openDirector = () => {
    directorTrigger.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setDirectorOpen(true)
  }

  const closeDirector = () => {
    setDirectorOpen(false)
    directorTrigger.current?.focus()
  }

  return (
    <>
      <TournamentDisplay onOpenDirector={openDirector} />
      <DirectorOverlay open={directorOpen} onClose={closeDirector} />
    </>
  )
}

export function App() {
  return <TournamentProvider><AppContent /></TournamentProvider>
}
