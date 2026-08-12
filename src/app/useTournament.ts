import { createContext, useContext, type Dispatch } from 'react'
import type { TournamentState } from '../domain/types'
import type { TournamentAction } from '../state/reducer'

export interface TournamentContextValue {
  state: TournamentState
  now: number
  dispatch: Dispatch<TournamentAction>
  persistenceError: string | null
}

export const TournamentContext = createContext<TournamentContextValue | null>(null)

export function useTournament(): TournamentContextValue {
  const context = useContext(TournamentContext)
  if (context === null) {
    throw new Error('useTournament must be used inside TournamentProvider.')
  }
  return context
}
