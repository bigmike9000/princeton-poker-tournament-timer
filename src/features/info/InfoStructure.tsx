import { durationLabel } from '../../domain/structure'
import { breakPresentation } from '../../domain/breakPresentation'
import type { PokerLevel, TournamentState } from '../../domain/types'
import { selectPokerLevelNumber } from '../../state/selectors'

const INFO_LEFT_COLUMN_COUNT = 11

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function visualBlinds(entry: PokerLevel): string {
  return [entry.smallBlind, entry.bigBlind].map(formatNumber).join(' / ')
}

function visualAnte(entry: PokerLevel): string | null {
  if (entry.anteType === 'none' || entry.ante === 0) return null
  const label = entry.anteType === 'big-blind' ? 'BBA' : 'ANTE'
  return `${label} ${formatNumber(entry.ante)}`
}

function accessibleAnte(entry: PokerLevel): string {
  if (entry.anteType === 'none' || entry.ante === 0) return 'no ante'
  return entry.anteType === 'big-blind'
    ? `big-blind ante ${formatNumber(entry.ante)}`
    : `ante ${formatNumber(entry.ante)}`
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
              data-column={index < INFO_LEFT_COLUMN_COUNT ? '1' : '2'}
              data-sequence={index + 1}
              className="info-structure-entry info-structure-entry--break"
            >
              <div className="info-entry-heading">
                <strong>{presentation.heading}</strong>
                {current && <span className="info-current-marker">CURRENT</span>}
              </div>
            </li>
          )
        }

        const levelNumber = selectPokerLevelNumber(state, index)
        const blinds = visualBlinds(entry)
        const visualAnteLabel = visualAnte(entry)
        const ante = accessibleAnte(entry)
        const duration = durationLabel(entry)
        const label = [
          `Level ${levelNumber}`,
          `small blind ${formatNumber(entry.smallBlind)}`,
          `big blind ${formatNumber(entry.bigBlind)}`,
          ante,
          duration,
        ].filter(Boolean).join(', ')

        return (
          <li
            key={entry.id}
            aria-current={current ? 'step' : undefined}
            aria-label={label}
            data-state={current ? 'current' : undefined}
            data-column={index < INFO_LEFT_COLUMN_COUNT ? '1' : '2'}
            data-sequence={index + 1}
            className="info-structure-entry"
          >
            <div className="info-entry-heading">
              <span className="info-entry-marker">Level {levelNumber}</span>
              {current && <span className="info-current-marker">CURRENT</span>}
            </div>
            <div className="info-entry-blinds">
              <strong>{blinds}</strong>
              {visualAnteLabel && <small>{visualAnteLabel}</small>}
            </div>
            <span className="info-entry-duration">{duration}</span>
          </li>
        )
      })}
    </ol>
  )
}
