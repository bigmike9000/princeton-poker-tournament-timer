import { useEffect, useRef } from 'react'
import { durationLabel } from '../../domain/structure'
import type { PokerLevel, TournamentState } from '../../domain/types'
import { selectPokerLevelNumber } from '../../state/selectors'

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function anteLabel(entry: PokerLevel): string {
  if (entry.anteType === 'none' || entry.ante === 0) return 'NO ANTE'
  const prefix = entry.anteType === 'big-blind' ? 'BIG BLIND ANTE' : 'ANTE'
  return `${prefix}: ${formatNumber(entry.ante)}`
}

interface InfoStructureProps {
  state: TournamentState
}

export function InfoStructure({ state }: InfoStructureProps) {
  const currentRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [state.runtime.currentEntryIndex])

  return (
    <ol className="info-structure-list" aria-label="Tournament blind structure">
      {state.structure.map((entry, index) => {
        const current = index === state.runtime.currentEntryIndex
        if (entry.kind === 'break') {
          const duration = durationLabel(entry)
          return (
            <li
              key={entry.id}
              ref={current ? currentRef : undefined}
              aria-current={current ? 'step' : undefined}
              aria-label={`Break ${entry.label}, ${duration}`}
              data-state={current ? 'current' : undefined}
              className="info-structure-entry info-structure-entry--break"
            >
              <span className="info-entry-marker">Break</span>
              <strong>{entry.label}</strong>
              <span className="info-entry-duration">{duration}</span>
            </li>
          )
        }

        const levelNumber = selectPokerLevelNumber(state, index)
        const blinds = `${formatNumber(entry.smallBlind)} / ${formatNumber(entry.bigBlind)}`
        const ante = anteLabel(entry)
        const duration = durationLabel(entry)
        const label = [
          `Level ${levelNumber}`,
          blinds,
          ante,
          duration,
          entry.note,
        ].filter(Boolean).join(', ')

        return (
          <li
            key={entry.id}
            ref={current ? currentRef : undefined}
            aria-current={current ? 'step' : undefined}
            aria-label={label}
            data-state={current ? 'current' : undefined}
            className="info-structure-entry"
          >
            <span className="info-entry-marker">Level {levelNumber}</span>
            <strong>{blinds}</strong>
            <span className="info-entry-ante">{ante}</span>
            <span className="info-entry-duration">{duration}</span>
            {entry.note && <small>{entry.note}</small>}
          </li>
        )
      })}
    </ol>
  )
}
