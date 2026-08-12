import { useEffect, useRef, useState } from 'react'
import { DirectorRun } from './DirectorRun'
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

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  if (!open) return null

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="director-title"
      className="director-overlay"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
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
          {tab === 'structure' && <div className="section-intro"><span className="section-kicker">Blind schedule</span><h2>Structure editor</h2><p>Level editing controls are available in the next section of this build.</p></div>}
          {tab === 'presets' && <div className="section-intro"><span className="section-kicker">Saved structures</span><h2>Presets</h2><p>Preset management is available in the next section of this build.</p></div>}
          {tab === 'tournament' && <TournamentSettings />}
          {tab === 'settings' && <div className="section-intro"><span className="section-kicker">Application</span><h2>Settings</h2><p>Audio, clock, and display preferences are available in the final controls section.</p></div>}
        </div>
      </div>
    </section>
  )
}
