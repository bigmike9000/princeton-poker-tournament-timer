import type { TournamentState } from './types'

export const totalChips = (state: TournamentState): number =>
  state.configuration.startingPlayers * state.configuration.startingStack +
  state.chipLedger
    .filter((entry) => entry.kind !== 'initial')
    .reduce((sum, entry) => sum + entry.chips, 0)

export const averageStack = (state: TournamentState): number =>
  Math.round(totalChips(state) / Math.max(1, state.runtime.playersRemaining))

export const formatChips = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
