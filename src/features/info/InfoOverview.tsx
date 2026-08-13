import type { TournamentState } from '../../domain/types'
import { ChipDenominations } from './ChipDenominations'

interface InfoOverviewProps {
  state: TournamentState
  chipLines: readonly string[]
  prizeLines: readonly string[]
}

export function InfoOverview({
  state,
  chipLines,
  prizeLines,
}: InfoOverviewProps) {
  return (
    <>
      <div className="info-overview-grid">
        <ChipDenominations state={state} chipLines={chipLines} />

        <div className="info-overview-details">
          <section className="info-card info-prizes" aria-labelledby="info-prizes-title">
            <p className="info-kicker">Awards</p>
            <h2 id="info-prizes-title">Prize structure</h2>
            <ul className="info-prize-list" aria-labelledby="info-prizes-title">
              {prizeLines.map((line, index) => {
                const separatorIndex = line.indexOf(':')
                if (separatorIndex === -1) {
                  return (
                    <li key={`${line}-${index}`} aria-label={line}>
                      <span className="info-prize-line--custom">{line}</span>
                    </li>
                  )
                }

                const rank = line.slice(0, separatorIndex).trim()
                const value = line.slice(separatorIndex + 1).trim()
                return (
                  <li key={`${line}-${index}`} aria-label={`${rank} place prize, ${value}`}>
                    <span className="info-prize-rank" aria-hidden="true">{rank}</span>
                    <span className="info-prize-value" aria-hidden="true">{value}</span>
                  </li>
                )
              })}
            </ul>
          </section>
          <p className="info-chip-reminder">Keep chips visible and countable.</p>
        </div>
      </div>
    </>
  )
}
