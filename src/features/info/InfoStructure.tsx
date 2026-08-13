import { durationLabel } from '../../domain/structure'
import type { PokerLevel, TournamentState } from '../../domain/types'
import { selectPokerLevelNumber } from '../../state/selectors'

const INFO_LEFT_COLUMN_COUNT = 11

function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

function visualLevel(entry: PokerLevel): string {
  const ante = entry.anteType === 'none' || entry.ante === 0 ? [] : [entry.ante]
  return [entry.smallBlind, entry.bigBlind, ...ante].map(formatNumber).join(' / ')
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
          const minutes = entry.durationSeconds / 60
          return (
            <li
              key={entry.id}
              aria-current={current ? 'step' : undefined}
              aria-label={`Break, ${minutes} min`}
              data-state={current ? 'current' : undefined}
              data-column={index < INFO_LEFT_COLUMN_COUNT ? '1' : '2'}
              data-sequence={index + 1}
              className="info-structure-entry info-structure-entry--break"
            >
              <div className="info-entry-heading">
                <strong>BREAK · {minutes} MIN</strong>
                {current && <span className="info-current-marker">CURRENT</span>}
              </div>
            </li>
          )
        }

        const levelNumber = selectPokerLevelNumber(state, index)
        const values = visualLevel(entry)
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
            <strong>{values}</strong>
            <span className="info-entry-duration">{duration}</span>
          </li>
        )
      })}
    </ol>
  )
}
