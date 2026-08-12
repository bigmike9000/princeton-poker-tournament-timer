import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    </div>
  )
}

describe('TournamentProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T20:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('ticks against the real timestamp and persists progress', () => {
    render(<TournamentProvider><Harness /></TournamentProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    act(() => vi.advanceTimersByTime(5_000))

    expect(screen.getByLabelText('Remaining seconds')).toHaveTextContent('715')
    expect(localStorage.getItem('ppc-tournament:v1')).not.toBeNull()
  })
})
