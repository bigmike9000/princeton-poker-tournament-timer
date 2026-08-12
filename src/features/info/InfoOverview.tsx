import { TOURNAMENT_RULE_SUMMARY } from '../../domain/tournamentInformation'
import type { TournamentState } from '../../domain/types'
import { ChipDenominations } from './ChipDenominations'

interface InfoOverviewProps {
  state: TournamentState
  chipLines: readonly string[]
  prizeLines: readonly string[]
  houseNotes: readonly string[]
}

export function InfoOverview({
  state,
  chipLines,
  prizeLines,
  houseNotes,
}: InfoOverviewProps) {
  return (
    <>
      <div className="info-overview-grid">
        <ChipDenominations state={state} chipLines={chipLines} />

        <div className="info-overview-details">
          <section className="info-card info-prizes" aria-labelledby="info-prizes-title">
            <p className="info-kicker">Awards</p>
            <h2 id="info-prizes-title">Prize structure</h2>
            <ul>
              {prizeLines.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
            </ul>
          </section>

          <section className="info-card info-rules" aria-labelledby="info-rules-title">
            <p className="info-kicker">Play well</p>
            <h2 id="info-rules-title">Tournament rules &amp; information</h2>
            <div className="info-house-notes">
              <h3>House notes</h3>
              <ul>
                {houseNotes.map((line, index) => <li key={`${line}-${index}`}>{line}</li>)}
              </ul>
            </div>
            <div className="info-rules-grid">
              <ul>
                {TOURNAMENT_RULE_SUMMARY.slice(0, 4).map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
              <ul>
                {TOURNAMENT_RULE_SUMMARY.slice(4).map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            </div>
          </section>
        </div>
      </div>

      <footer className="info-footer">
        <p>Reference: <a
          href="https://www.pokertda.com/view-poker-tda-rules/"
          target="_blank"
          rel="noreferrer"
        >2024 Poker TDA rules</a></p>
        <p>PPC house rules and Tournament Director decisions govern this event.</p>
      </footer>
    </>
  )
}
