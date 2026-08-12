import { act, fireEvent, render, screen, within } from '@testing-library/react'
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

    expect(screen.getByRole('timer')).toHaveTextContent('11:55')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminate player' }))
    expect(screen.getByText('79 / 80')).toBeVisible()

    first.unmount()
    render(<App />)

    expect(screen.getByRole('timer')).toHaveTextContent('11:55')
    expect(screen.getByText('79 / 80')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Start tournament' })).toHaveTextContent('Resume')
  })

  it('keeps the same running level while Info is open and only elapsed time changes', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Next level' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start tournament' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open tournament information' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Blind structure' }))
    const structure = screen.getByRole('list', { name: 'Tournament blind structure' })
    expect(within(structure).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step')

    act(() => vi.advanceTimersByTime(3_000))

    expect(screen.getByRole('timer')).toHaveTextContent('11:57')
    expect(screen.getByRole('button', { name: 'Pause tournament' })).toBeVisible()
    expect(within(structure).getAllByRole('listitem')[1]).toHaveAttribute('aria-current', 'step')
    fireEvent.click(screen.getByRole('button', { name: 'Close tournament information' }))

    expect(screen.getByRole('timer')).toHaveTextContent('11:57')
    expect(screen.getByRole('button', { name: 'Pause tournament' })).toBeVisible()
    expect(screen.getByRole('region', { name: 'Current poker level' })).toHaveTextContent('LEVEL 2')
  })
})
