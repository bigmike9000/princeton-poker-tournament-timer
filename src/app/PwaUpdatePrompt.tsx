import { useEffect, useRef, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { Dialog } from '../components/Dialog'
import { useTournament } from './useTournament'

export interface UpdateRegistrationOptions {
  onNeedRefresh?: () => void
  onRegisterError?: (error: unknown) => void
}

export type UpdateRegistration = (
  options: UpdateRegistrationOptions,
) => (reloadPage?: boolean) => Promise<void>

export interface PwaUpdatePromptProps {
  registerUpdate?: UpdateRegistration
}

export function PwaUpdatePrompt({
  registerUpdate = registerSW,
}: PwaUpdatePromptProps) {
  const { state } = useTournament()
  const [updateReady, setUpdateReady] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activateRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null)
  const running = state.runtime.status === 'running'

  useEffect(() => {
    activateRef.current = registerUpdate({
      onNeedRefresh: () => setUpdateReady(true),
      onRegisterError: () => setError('The offline app update service is unavailable.'),
    })
  }, [registerUpdate])

  const installUpdate = () => {
    setConfirming(false)
    if (running || activateRef.current === null) return
    void activateRef.current(true).catch(() => {
      setError('The application update could not be installed. The current version remains active.')
    })
  }

  if (!updateReady && error === null) return null

  return (
    <>
      <aside className="update-banner" role="status" aria-live="polite">
        <div>
          <strong>{error ? 'Update service notice' : 'Application update ready'}</strong>
          <span>{error ?? (running
            ? 'Pause the clock to install the update safely.'
            : 'Install it when the tournament is safely paused.')}</span>
        </div>
        {!error && !running && (
          <button onClick={() => setConfirming(true)}>Review application update</button>
        )}
      </aside>
      {confirming && (
        <Dialog
          title="Update the application?"
          description="The latest offline version will activate and reload this display. Saved tournament progress and presets remain in this browser."
          confirmLabel="Install application update"
          onCancel={() => setConfirming(false)}
          onConfirm={installUpdate}
        />
      )}
    </>
  )
}
