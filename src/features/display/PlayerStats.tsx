import { averageStack, formatChips } from '../../domain/calculations'
import type { TournamentState } from '../../domain/types'

export function PlayerStats({ state }: { state: TournamentState }) {
  return (
    <section className="stats-grid" aria-label="Tournament statistics">
      <article className="stat-card stat-card--players">
        <span>Players remaining</span>
        <strong>{state.runtime.playersRemaining} / {state.configuration.startingPlayers}</strong>
      </article>
      <article className="stat-card">
        <span>Average stack</span>
        <strong>{formatChips(averageStack(state))}</strong>
      </article>
    </section>
  )
}
