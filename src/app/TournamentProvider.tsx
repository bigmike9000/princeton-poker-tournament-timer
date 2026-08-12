import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { loadSnapshot, saveSnapshot } from '../persistence/snapshot'
import { audioAlerts, thresholdsCrossed } from '../services/audio'
import { tournamentReducer } from '../state/reducer'
import { TournamentContext } from './useTournament'

export function TournamentProvider({ children }: PropsWithChildren) {
  const [initialLoad] = useState(() => loadSnapshot(localStorage, Date.now()))
  const [state, dispatch] = useReducer(tournamentReducer, initialLoad.state)
  const [now, setNow] = useState(() => Date.now())
  const [persistenceError, setPersistenceError] = useState<string | null>(
    initialLoad.error ?? null,
  )
  const stateRef = useRef(state)
  const previousAudioStateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

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
    const previous = previousAudioStateRef.current
    previousAudioStateRef.current = state

    if (state.settings.muted) return

    if (previous.runtime.currentEntryIndex === state.runtime.currentEntryIndex) {
      const crossed = thresholdsCrossed(
        previous.runtime.remainingMs,
        state.runtime.remainingMs,
        state.runtime.alertedThresholds,
        state.settings,
      )
      crossed.forEach((threshold) => {
        dispatch({ type: 'MARK_ALERTED', thresholdMs: threshold })
        audioAlerts.play(threshold === 300_000 ? 'five-minute' : 'one-minute')
      })
      return
    }

    if (state.runtime.transitionCause !== 'automatic') return
    const previousEntry = previous.structure[previous.runtime.currentEntryIndex]
    const currentEntry = state.structure[state.runtime.currentEntryIndex]

    if (previousEntry?.kind === 'level' && state.settings.alertLevelComplete) {
      audioAlerts.play('level-complete')
    }
    if (currentEntry?.kind === 'break' && state.settings.alertBreakBeginning) {
      audioAlerts.play('break-beginning')
    }
    if (previousEntry?.kind === 'break' && state.settings.alertBreakEnding) {
      audioAlerts.play('break-ending')
    }
  }, [state])

  useEffect(() => {
    let active = true
    try {
      saveSnapshot(localStorage, state, Date.now())
      queueMicrotask(() => { if (active) setPersistenceError(null) })
    } catch {
      queueMicrotask(() => {
        if (active) setPersistenceError('Tournament progress cannot currently be saved in this browser.')
      })
    }
    return () => { active = false }
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
