import { useEffect, useRef } from 'react'
import { formatChips } from '../../domain/calculations'
import { breakPresentation } from '../../domain/breakPresentation'
import { durationLabel } from '../../domain/structure'
import type { TournamentState } from '../../domain/types'
import { selectPokerLevelNumber } from '../../state/selectors'
import { anteLabel } from './format'

interface BlindStructureProps {
  state: TournamentState
  onSelectEntry: (index: number) => void
}

export function BlindStructure({ state, onSelectEntry }: BlindStructureProps) {
  const currentRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [state.runtime.currentEntryIndex])

  return (
    <aside className="structure-panel" aria-labelledby="structure-title">
      <header className="structure-header">
        <div>
          <p className="eyebrow">Tournament schedule</p>
          <h2 id="structure-title">Blind Structure</h2>
        </div>
        <span className="structure-count">{state.runtime.currentEntryIndex + 1} / {state.structure.length}</span>
      </header>
      <ol className="structure-list">
        {state.structure.map((entry, index) => {
          const current = index === state.runtime.currentEntryIndex
          const rowState = index < state.runtime.currentEntryIndex
            ? 'complete'
            : current ? 'current' : 'upcoming'

          if (entry.kind === 'break') {
            const presentation = breakPresentation(entry)
            return (
              <li
                key={entry.id}
                ref={current ? currentRef : undefined}
                className={`structure-row structure-row--break structure-row--${rowState}`}
                data-state={rowState}
                aria-current={current ? 'step' : undefined}
                aria-label={presentation.heading}
              >
                <button
                  type="button"
                  className="structure-row-button"
                  data-tournament-shortcuts="true"
                  aria-label={presentation.accessibleLabel}
                  onClick={() => onSelectEntry(index)}
                >
                  <span className="break-rule" aria-hidden="true" />
                  <span className="structure-break-copy">
                    <strong>{presentation.heading}</strong>
                    {presentation.subtitle && <small>{presentation.subtitle}</small>}
                  </span>
                  <span className="break-rule" aria-hidden="true" />
                </button>
              </li>
            )
          }

          const levelNumber = selectPokerLevelNumber(state, index)
          const label = [
            `Level ${levelNumber} ${formatChips(entry.smallBlind)} / ${formatChips(entry.bigBlind)}`,
            anteLabel(entry.anteType, entry.ante),
            durationLabel(entry),
            entry.note,
          ].filter(Boolean).join(', ')
          return (
            <li
              key={entry.id}
              ref={current ? currentRef : undefined}
              className={`structure-row structure-row--${rowState}`}
              data-state={rowState}
              aria-current={current ? 'step' : undefined}
              aria-label={label}
            >
              <button
                type="button"
                className="structure-row-button"
                data-tournament-shortcuts="true"
                aria-label={label}
                onClick={() => onSelectEntry(index)}
              >
                <span className="level-index">{String(levelNumber).padStart(2, '0')}</span>
                <span className="structure-blinds">
                  <strong>{formatChips(entry.smallBlind)} / {formatChips(entry.bigBlind)}</strong>
                  <small>{anteLabel(entry.anteType, entry.ante)}</small>
                  {entry.note && <small className="structure-note">{entry.note}</small>}
                </span>
                <span className="level-duration">{durationLabel(entry)}</span>
                {current && <span className="live-marker">LIVE</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
