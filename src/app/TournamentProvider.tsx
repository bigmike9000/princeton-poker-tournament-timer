import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { loadSnapshot, saveSnapshot } from '../persistence/snapshot'
import { tournamentReducer } from '../state/reducer'
import { TournamentContext } from './useTournament'

export function TournamentProvider({ children }: PropsWithChildren) {
  const [initialLoad] = useState(() => loadSnapshot(localStorage, Date.now()))
  const [state, dispatch] = useReducer(tournamentReducer, initialLoad.state)
  const [now, setNow] = useState(Date.now())
  const [persistenceError, setPersistenceError] = useState<string | null>(
    initialLoad.error ?? null,
  )
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (state.runtime.status !== 'running') return

    const interval = window.setInterval(() => {
      const tickAt = Date.now()
      setNow(tickAt)
      dispatch({ type: 'TICK', now: tickAt })
    }, 250)

    return () => window.clearInterval(interval)
  }, [state.runtime.status])

  useEffect(() => {
    try {
      saveSnapshot(localStorage, state, Date.now())
      setPersistenceError(null)
    } catch {
      setPersistenceError('Tournament progress cannot currently be saved in this browser.')
    }
  }, [state])

  useEffect(() => {
    const saveOnPageHide = () => {
      try {
        saveSnapshot(localStorage, stateRef.current, Date.now())
      } catch {
        setPersistenceError('Tournament progress cannot currently be saved in this browser.')
      }
    }

    window.addEventListener('pagehide', saveOnPageHide)
    return () => window.removeEventListener('pagehide', saveOnPageHide)
  }, [])

  const value = useMemo(() => ({ state, now, dispatch, persistenceError }), [
    state,
    now,
    persistenceError,
  ])

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
}
