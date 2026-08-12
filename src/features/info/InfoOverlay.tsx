import { useEffect, useRef } from 'react'
import { useTournament } from '../../app/useTournament'
import { ClubLogo } from '../../components/ClubLogo'
import {
  selectTournamentInformation,
  TOURNAMENT_RULE_SUMMARY,
} from '../../domain/tournamentInformation'
import { InfoStructure } from './InfoStructure'

interface InfoOverlayProps {
  open: boolean
  onClose: () => void
  onAfterClose: () => void
}

export function InfoOverlay({ open, onClose, onAfterClose }: InfoOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const closeRequestedRef = useRef(false)
  const overlayRef = useRef<HTMLElement>(null)
  const { state } = useTournament()
  const information = selectTournamentInformation(state)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const background = document.querySelector<HTMLElement>('.tournament-shell')
    document.body.style.overflow = 'hidden'
    background?.setAttribute('inert', '')
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      background?.removeAttribute('inert')
      if (closeRequestedRef.current) onAfterClose()
    }
  }, [onAfterClose, open])

  if (!open) return null

  const requestClose = () => {
    closeRequestedRef.current = true
    onClose()
  }

  return (
    <section
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-title"
      className="info-overlay"
      onClick={requestClose}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          event.preventDefault()
          requestClose()
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
      <article className="info-panel" onClick={(event) => event.stopPropagation()}>
        <header className="info-header">
          <div className="info-brand">
            <ClubLogo className="info-logo" size={52} />
            <div>
              <p>{state.configuration.organizationName}</p>
              <h1 id="info-title">Tournament information</h1>
              <h2>{state.configuration.tournamentName}</h2>
            </div>
          </div>
          <button
            ref={closeRef}
            className="info-close"
            type="button"
            onClick={requestClose}
            aria-label="Close tournament information"
          >Close <span aria-hidden="true">×</span></button>
        </header>

        <div className="info-grid">
          <section className="info-card" aria-labelledby="info-chips-title">
            <p className="info-kicker">At the table</p>
            <h2 id="info-chips-title">Chip denominations</h2>
            <ul>
              {information.chipLines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
            </ul>
          </section>

          <section className="info-card" aria-labelledby="info-prizes-title">
            <p className="info-kicker">Awards</p>
            <h2 id="info-prizes-title">Prize structure</h2>
            <ul>
              {information.prizeLines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
            </ul>
          </section>

          <section className="info-card info-structure" aria-labelledby="info-structure-title">
            <p className="info-kicker">Full schedule</p>
            <h2 id="info-structure-title">Blind structure</h2>
            <InfoStructure state={state} />
          </section>

          <section className="info-card info-rules" aria-labelledby="info-rules-title">
            <p className="info-kicker">Play well</p>
            <h2 id="info-rules-title">Tournament rules &amp; information</h2>
            <div className="info-rules-grid">
              <div>
                <h3>House notes</h3>
                <ul>
                  {information.houseNotes.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
                </ul>
              </div>
              <div>
                <h3>Rules summary</h3>
                <ul>
                  {TOURNAMENT_RULE_SUMMARY.map((rule) => <li key={rule}>{rule}</li>)}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <footer className="info-footer">
          <p>Reference: <a
            href="https://www.pokertda.com/view-poker-tda-rules/"
            target="_blank"
            rel="noreferrer"
          >2024 Poker TDA rules</a></p>
          <p>PPC house rules and Tournament Director decisions govern this event.</p>
        </footer>
      </article>
    </section>
  )
}
