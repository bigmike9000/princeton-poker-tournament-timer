import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { audioAlerts } from '../services/audio'
import { selectRemainingMs } from '../state/selectors'
import { TournamentProvider } from './TournamentProvider'
import { useTournament } from './useTournament'

function Harness() {
  const { state, now, dispatch } = useTournament()
  const seconds = Math.ceil(selectRemainingMs(state, now) / 1_000)

  return (
    <div>
      <output aria-label="Remaining seconds">{seconds}</output>
      <button onClick={() => dispatch({ type: 'START', now: Date.now() })}>Start</button>
      <button onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.structure.length - 1, now: Date.now() })}>Final level</button>
      <button onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: 0, now: Date.now() })}>First level</button>
      <button onClick={() => {
        const structure = structuredClone(state.structure)
        const final = structure.at(-1)!
        if (final.kind !== 'level') throw new Error('Expected a poker level.')
        final.durationSeconds = 600
        dispatch({ type: 'SET_STRUCTURE', structure, now: Date.now() })
      }}>Make final timed</button>
      <button onClick={() => {
        const structure = structuredClone(state.structure)
        const final = structure.at(-1)!
        if (final.kind !== 'level') throw new Error('Expected a poker level.')
        final.durationSeconds = null
        dispatch({ type: 'SET_STRUCTURE', structure, now: Date.now() })
      }}>Make final untimed</button>
    </div>
  )
}

describe('TournamentProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T20:00:00Z'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('ticks against the real timestamp and persists progress', () => {
    render(<TournamentProvider><Harness /></TournamentProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    act(() => vi.advanceTimersByTime(5_000))

    expect(screen.getByLabelText('Remaining seconds')).toHaveTextContent('715')
    expect(localStorage.getItem('ppc-tournament:v1')).not.toBeNull()
  })

  it('does not poll while a running untimed level is active and restarts on a timed level', () => {
    const setInterval = vi.spyOn(window, 'setInterval')
    const clearInterval = vi.spyOn(window, 'clearInterval')
    render(<TournamentProvider><Harness /></TournamentProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(setInterval).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Final level' }))
    expect(clearInterval).toHaveBeenCalledTimes(1)
    expect(setInterval).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'First level' }))
    expect(setInterval).toHaveBeenCalledTimes(2)
  })

  it('does not play countdown alerts when the live entry becomes untimed', () => {
    const play = vi.spyOn(audioAlerts, 'play')
    render(<TournamentProvider><Harness /></TournamentProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Make final timed' }))
    fireEvent.click(screen.getByRole('button', { name: 'Final level' }))
    play.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Make final untimed' }))

    expect(play).not.toHaveBeenCalled()
  })
})
