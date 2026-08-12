import { useEffect, useRef, useState } from 'react'
import { DirectorRun } from './DirectorRun'
import { DirectorSettings } from './DirectorSettings'
import { PresetManager } from './PresetManager'
import { StructureEditor } from './StructureEditor'
import { TournamentSettings } from './TournamentSettings'

export type DirectorTab = 'run' | 'structure' | 'presets' | 'tournament' | 'settings'

const tabs: { id: DirectorTab; label: string; marker: string }[] = [
  { id: 'run', label: 'Run', marker: '01' },
  { id: 'structure', label: 'Structure', marker: '02' },
  { id: 'presets', label: 'Presets', marker: '03' },
  { id: 'tournament', label: 'Tournament', marker: '04' },
  { id: 'settings', label: 'Settings', marker: '05' },
]

interface DirectorOverlayProps {
  open: boolean
  onClose: () => void
}

export function DirectorOverlay({ open, onClose }: DirectorOverlayProps) {
  const [tab, setTab] = useState<DirectorTab>('run')
  const closeRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLElement>(null)

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
    }
  }, [open])

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
        <div className="director-brand"><span className="director-monogram">TD</span><div><p>Princeton Poker Club</p><h1 id="director-title">Tournament Director</h1></div></div>
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
          {tab === 'run' && <DirectorRun />}
          {tab === 'structure' && <StructureEditor />}
          {tab === 'presets' && <PresetManager />}
          {tab === 'tournament' && <TournamentSettings />}
          {tab === 'settings' && <DirectorSettings />}
        </div>
      </div>
    </section>
  )
}
