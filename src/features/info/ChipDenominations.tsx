import { formatChips } from '../../domain/calculations'
import type { TournamentState } from '../../domain/types'
import { selectSupplementalChipLines } from './selectSupplementalChipLines'

const CHIPS = [
  { value: 1, color: 'White', supportingLabel: '10 chips', accessibleLabel: '10 white 1-value chips', className: 'chip--white' },
  { value: 5, color: 'Red', supportingLabel: '8 chips', accessibleLabel: '8 red 5-value chips', className: 'chip--red' },
  { value: 25, color: 'Green', supportingLabel: '6 chips', accessibleLabel: '6 green 25-value chips', className: 'chip--green' },
  { value: 100, color: 'Black', supportingLabel: 'Color-up chip', accessibleLabel: 'Black 100-value chip', className: 'chip--black' },
  { value: 500, color: 'Purple', supportingLabel: 'Color-up chip', accessibleLabel: 'Purple 500-value chip', className: 'chip--purple' },
] as const

interface ChipDenominationsProps {
  state: TournamentState
  chipLines: readonly string[]
}

export function ChipDenominations({ state, chipLines }: ChipDenominationsProps) {
  const supplementalLines = selectSupplementalChipLines(chipLines)
  const { startingPlayers, startingStack } = state.configuration

  return (
    <section className="info-card info-chips" aria-labelledby="info-chips-title">
      <p className="info-kicker">At the table</p>
      <h2 id="info-chips-title">Chip denominations</h2>
      <div className="info-chip-grid">
        {CHIPS.map((chip) => (
          <div
            key={chip.value}
            className="info-chip-card"
            role="group"
            aria-label={chip.accessibleLabel}
          >
            <span className={`info-chip-disk ${chip.className}`} aria-hidden="true">
              {chip.value}
            </span>
            <span className="info-chip-copy">
              <strong>{chip.color}</strong>
              <span>{chip.supportingLabel}</span>
            </span>
          </div>
        ))}
      </div>
      {supplementalLines.length > 0 && (
        <ul className="info-chip-supplemental">
          {supplementalLines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
        </ul>
      )}
      <dl className="info-totals">
        <div>
          <dt>Starting stack</dt>
          <dd>{formatChips(startingStack)}</dd>
        </div>
        <div>
          <dt>Players</dt>
          <dd>{formatChips(startingPlayers)}</dd>
        </div>
        <div>
          <dt>Chips in play</dt>
          <dd>{formatChips(startingPlayers * startingStack)}</dd>
        </div>
      </dl>
    </section>
  )
}
