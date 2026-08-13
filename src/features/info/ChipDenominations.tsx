import { formatChips } from '../../domain/calculations'
import type { TournamentState } from '../../domain/types'
import { selectSupplementalChipLines } from './selectSupplementalChipLines'

const CHIPS = [
  { value: 1, color: 'White', quantity: 10, className: 'chip--white' },
  { value: 5, color: 'Red', quantity: 8, className: 'chip--red' },
  { value: 25, color: 'Green', quantity: 6, className: 'chip--green' },
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
            aria-label={`${chip.quantity} ${chip.color.toLowerCase()} ${chip.value}-value chips`}
          >
            <span className={`info-chip-disk ${chip.className}`} aria-hidden="true">
              {chip.value}
            </span>
            <span className="info-chip-copy">
              <strong>{chip.color}</strong>
              <span>{chip.quantity} chips</span>
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
