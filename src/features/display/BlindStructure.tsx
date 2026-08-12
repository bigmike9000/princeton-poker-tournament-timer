import { useEffect, useRef } from 'react'
import { formatChips } from '../../domain/calculations'
import { durationLabel } from '../../domain/structure'
import type { TournamentState } from '../../domain/types'
import { selectPokerLevelNumber } from '../../state/selectors'
import { anteLabel } from './format'

export function BlindStructure({ state }: { state: TournamentState }) {
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
            const label = `BREAK — ${durationLabel(entry).toUpperCase()}`
            return (
              <li
                key={entry.id}
                ref={current ? currentRef : undefined}
                className={`structure-row structure-row--break structure-row--${rowState}`}
                data-state={rowState}
                aria-current={current ? 'step' : undefined}
                aria-label={label}
              >
                <span className="break-rule" aria-hidden="true" />
                <strong>{label}</strong>
                <span className="break-rule" aria-hidden="true" />
              </li>
            )
          }

          const levelNumber = selectPokerLevelNumber(state, index)
          const label = `Level ${levelNumber} ${formatChips(entry.smallBlind)} / ${formatChips(entry.bigBlind)}`
          return (
            <li
              key={entry.id}
              ref={current ? currentRef : undefined}
              className={`structure-row structure-row--${rowState}`}
              data-state={rowState}
              aria-current={current ? 'step' : undefined}
              aria-label={label}
            >
              <span className="level-index">{String(levelNumber).padStart(2, '0')}</span>
              <div className="structure-blinds">
                <strong>{formatChips(entry.smallBlind)} / {formatChips(entry.bigBlind)}</strong>
                <small>{anteLabel(entry.anteType, entry.ante)}</small>
              </div>
              <span className="level-duration">{durationLabel(entry)}</span>
              {current && <span className="live-marker">LIVE</span>}
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
