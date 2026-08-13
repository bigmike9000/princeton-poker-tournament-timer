import { breakPresentation } from '../../domain/breakPresentation'
import { durationLabel } from '../../domain/structure'
import type { PokerLevel, TournamentState } from '../../domain/types'
import { selectPokerLevelNumber } from '../../state/selectors'

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function anteLabel(entry: PokerLevel): string {
  if (entry.anteType === 'none' || entry.ante === 0) return 'NO ANTE'
  const prefix = entry.anteType === 'big-blind' ? 'BBA' : 'ANTE'
  return `${prefix} ${formatNumber(entry.ante)}`
}

interface InfoStructureProps {
  state: TournamentState
}

export function InfoStructure({ state }: InfoStructureProps) {
  return (
    <ol className="info-structure-list" aria-label="Tournament blind structure">
      {state.structure.map((entry, index) => {
        const current = index === state.runtime.currentEntryIndex
        if (entry.kind === 'break') {
          const presentation = breakPresentation(entry)
          return (
            <li
              key={entry.id}
              aria-current={current ? 'step' : undefined}
              aria-label={presentation.accessibleLabel}
              data-state={current ? 'current' : undefined}
              data-column={index < 10 ? '1' : '2'}
              data-sequence={index + 1}
              className="info-structure-entry info-structure-entry--break"
            >
              <div className="info-entry-heading">
                <strong>{presentation.heading}</strong>
                {current && <span className="info-current-marker">CURRENT</span>}
              </div>
              {presentation.subtitle && (
                <span className="info-break-subtitle">{presentation.subtitle}</span>
              )}
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
        ].filter(Boolean).join(', ')

        return (
          <li
            key={entry.id}
            aria-current={current ? 'step' : undefined}
            aria-label={label}
            data-state={current ? 'current' : undefined}
            data-column={index < 10 ? '1' : '2'}
            data-sequence={index + 1}
            className="info-structure-entry"
          >
            <div className="info-entry-heading">
              <span className="info-entry-marker">Level {levelNumber}</span>
              {current && <span className="info-current-marker">CURRENT</span>}
            </div>
            <strong>{blinds}</strong>
            <span className="info-entry-ante">{ante}</span>
            <span className="info-entry-duration">{duration}</span>
          </li>
        )
      })}
    </ol>
  )
}
