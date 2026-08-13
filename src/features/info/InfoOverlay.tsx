import { useEffect, useRef, useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { ClubBrandLockup } from '../../components/ClubBrandLockup'
import {
  selectTournamentInformation,
  validateProjectorInformation,
} from '../../domain/tournamentInformation'
import { InfoOverview } from './InfoOverview'
import { InfoStructure } from './InfoStructure'

interface InfoOverlayProps {
  open: boolean
  onClose: () => void
  onAfterClose: () => void
}

export function InfoOverlay({ open, onClose, onAfterClose }: InfoOverlayProps) {
  const [page, setPage] = useState<'overview' | 'structure'>('overview')
  const closeRef = useRef<HTMLButtonElement>(null)
  const overviewTabRef = useRef<HTMLButtonElement>(null)
  const structureTabRef = useRef<HTMLButtonElement>(null)
  const closeRequestedRef = useRef(false)
  const overlayRef = useRef<HTMLElement>(null)
  const { state } = useTournament()
  const information = selectTournamentInformation(state)
  const projectorSafeInformation = validateProjectorInformation(information).valid

  useEffect(() => {
    // The overlay persists while closed, so each open cycle deliberately starts on page one.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setPage('overview')
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const background = document.querySelector<HTMLElement>('.app-background')
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
          .filter((element) => element.tabIndex >= 0)
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
          <ClubBrandLockup
            className="info-brand"
            logoClassName="info-logo"
            organizationName={state.configuration.organizationName}
            title="Tournament Info"
            titleId="info-title"
          />
          <button
            ref={closeRef}
            className="info-close"
            type="button"
            onClick={requestClose}
            aria-label="Close tournament information"
          >Close <span aria-hidden="true">×</span></button>
          <div className="info-navigation">
            <div className="info-tabs" role="tablist" aria-label="Tournament information pages">
              <button
                ref={overviewTabRef}
                id="info-overview-tab"
                type="button"
                role="tab"
                aria-selected={page === 'overview'}
                aria-controls="info-overview-panel"
                tabIndex={page === 'overview' ? 0 : -1}
                onClick={() => setPage('overview')}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                  event.preventDefault()
                  setPage('structure')
                  structureTabRef.current?.focus()
                }}
              >Overview</button>
              <button
                ref={structureTabRef}
                id="info-structure-tab"
                type="button"
                role="tab"
                aria-selected={page === 'structure'}
                aria-controls="info-structure-panel"
                tabIndex={page === 'structure' ? 0 : -1}
                onClick={() => setPage('structure')}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
                  event.preventDefault()
                  setPage('overview')
                  overviewTabRef.current?.focus()
                }}
              >Blind structure</button>
            </div>
            <span className="info-page-count">Page {page === 'overview' ? 1 : 2} of 2</span>
          </div>
        </header>

        {page === 'overview' ? (
          <div
            id="info-overview-panel"
            className={`info-page info-page--overview ${projectorSafeInformation
              ? 'info-page--projector-safe'
              : 'info-page--legacy-oversize'}`}
            role="tabpanel"
            aria-labelledby="info-overview-tab"
          >
            {!projectorSafeInformation && (
              <p className="info-legacy-notice" role="status">
                <strong>Legacy information exceeds projector layout</strong>
                All saved content remains available below. Shorten it in Tournament Director to restore the non-scrolling projector view.
              </p>
            )}
            <InfoOverview
              state={state}
              chipLines={information.chipLines}
              prizeLines={information.prizeLines}
              houseNotes={information.houseNotes}
            />
          </div>
        ) : (
          <section
            id="info-structure-panel"
            className="info-page info-page--structure"
            role="tabpanel"
            aria-labelledby="info-structure-tab"
          >
            <div className="info-structure-heading">
              <p className="info-kicker">Full schedule</p>
              <h2 id="info-structure-title">Blind structure</h2>
            </div>
            <InfoStructure state={state} />
          </section>
        )}
      </article>
    </section>
  )
}
