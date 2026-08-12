import { useEffect, useRef, useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { ClubLogo } from '../../components/ClubLogo'
import { DirectorSettings } from './DirectorSettings'
import { PresetManager } from './PresetManager'
import { StructureEditor } from './StructureEditor'
import { TournamentSettings } from './TournamentSettings'

export type DirectorTab = 'structure' | 'presets' | 'tournament' | 'settings'

const tabs = [
  { id: 'structure', label: 'Structure', marker: '01' },
  { id: 'presets', label: 'Presets', marker: '02' },
  { id: 'tournament', label: 'Tournament', marker: '03' },
  { id: 'settings', label: 'Settings', marker: '04' },
] satisfies { id: DirectorTab; label: string; marker: string }[]

interface DirectorOverlayProps {
  open: boolean
  onClose: () => void
  onAfterClose: () => void
}

export function DirectorOverlay({ open, onClose, onAfterClose }: DirectorOverlayProps) {
  const [tab, setTab] = useState<DirectorTab>('structure')
  const closeRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLElement>(null)
  const { state } = useTournament()

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    const background = document.querySelector<HTMLElement>('.tournament-shell')
    document.body.style.overflow = 'hidden'
    background?.setAttribute('inert', '')
    return () => {
      document.body.style.overflow = previousOverflow
      background?.removeAttribute('inert')
      onAfterClose()
    }
  }, [onAfterClose, open])

  if (!open) return null

  return (
    <section
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="director-title"
      className="director-overlay"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
          return
        }
        if (event.key !== 'Tab') return
        const focusable = Array.from(overlayRef.current?.querySelectorAll<HTMLElement>('*') ?? [])
          .filter((element) => element.matches(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
          ))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <header className="director-header">
        <div className="director-brand"><ClubLogo className="director-logo" size={46} /><div><p>{state.configuration.organizationName}</p><h1 id="director-title">Tournament Director</h1></div></div>
        <div className="director-header-note"><i aria-hidden="true" />Changes update the live display</div>
        <button ref={closeRef} className="director-close" onClick={onClose} aria-label="Close Tournament Director">Close <span aria-hidden="true">×</span></button>
      </header>

      <div className="director-layout">
        <nav className="director-nav" aria-label="Tournament Director sections">
          <p>Control panel</p>
          {tabs.map((item) => (
            <button
              key={item.id}
              aria-pressed={tab === item.id}
              aria-label={item.label}
              className={tab === item.id ? 'director-tab director-tab--active' : 'director-tab'}
              onClick={() => setTab(item.id)}
            ><span>{item.marker}</span>{item.label}</button>
          ))}
          <div className="director-nav-footer"><span>Keyboard</span><strong>Space</strong> Start / Pause</div>
        </nav>

        <div className="director-content">
          {tab === 'structure' && <StructureEditor />}
          {tab === 'presets' && <PresetManager />}
          {tab === 'tournament' && <TournamentSettings />}
          {tab === 'settings' && <DirectorSettings />}
        </div>
      </div>
    </section>
  )
}
