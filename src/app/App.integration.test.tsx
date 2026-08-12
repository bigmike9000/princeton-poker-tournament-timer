import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

describe('representative tournament flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T20:00:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('runs, pauses, tracks a player elimination, and restores the saved state', () => {
    const first = render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start tournament' }))
    act(() => vi.advanceTimersByTime(5_000))
    fireEvent.click(screen.getByRole('button', { name: 'Pause tournament' }))

    expect(screen.getByRole('timer')).toHaveTextContent('19:55')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminate player' }))
    expect(screen.getByText('79 / 80')).toBeVisible()

    first.unmount()
    render(<App />)

    expect(screen.getByRole('timer')).toHaveTextContent('19:55')
    expect(screen.getByText('79 / 80')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Start tournament' })).toHaveTextContent('Resume')
  })
})
