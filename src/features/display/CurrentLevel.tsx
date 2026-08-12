import { formatChips } from '../../domain/calculations'
import { breakPresentation } from '../../domain/breakPresentation'
import type { TournamentState } from '../../domain/types'
import { selectCurrentEntry, selectNextPokerLevel, selectPokerLevelNumber } from '../../state/selectors'
import { anteLabel } from './format'

export function CurrentLevel({ state }: { state: TournamentState }) {
  const entry = selectCurrentEntry(state)

  if (entry.kind === 'break') {
    const presentation = breakPresentation(entry)
    const nextLevel = selectNextPokerLevel(state)
    const nextIndex = nextLevel
      ? state.structure.findIndex((candidate) => candidate.id === nextLevel.id)
      : -1
    const nextNumber = nextIndex >= 0 ? selectPokerLevelNumber(state, nextIndex) : null

    return (
      <section className="current-level current-level--break" aria-label="Current break">
        <p className="eyebrow eyebrow--accent">Tournament break</p>
        <h2 className="level-heading">{presentation.heading}</h2>
        {presentation.subtitle && <p className="current-level-note current-level-note--break">{presentation.subtitle}</p>}
        {nextLevel && nextNumber !== null ? (
          <div className="next-level-card">
            <span>Next: Level {nextNumber}</span>
            <strong>{formatChips(nextLevel.smallBlind)} / {formatChips(nextLevel.bigBlind)}</strong>
            <small>{anteLabel(nextLevel.anteType, nextLevel.ante)}</small>
          </div>
        ) : (
          <p className="next-level-card">Final break</p>
        )}
      </section>
    )
  }

  const levelNumber = selectPokerLevelNumber(state, state.runtime.currentEntryIndex)

  return (
    <section className="current-level" aria-label="Current poker level">
      <p className="eyebrow">Current level</p>
      <h2 className="level-heading">LEVEL {levelNumber}</h2>
      <div className="blind-display">
        <strong>{formatChips(entry.smallBlind)} / {formatChips(entry.bigBlind)}</strong>
        <span>{anteLabel(entry.anteType, entry.ante)}</span>
        {entry.note && <small className="current-level-note">{entry.note}</small>}
      </div>
    </section>
  )
}
