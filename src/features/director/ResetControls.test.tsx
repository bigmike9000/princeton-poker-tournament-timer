import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ComponentType } from 'react'
import { TournamentProvider } from '../../app/TournamentProvider'
import { useTournament } from '../../app/useTournament'
import { ResetControls } from './ResetControls'

function ResetHarness({ Controls }: { Controls: ComponentType }) {
  const { state, dispatch } = useTournament()

  return (
    <>
      <Controls />
      <output aria-label="Current entry">{state.runtime.currentEntryIndex + 1}</output>
      <output aria-label="Remaining time">{state.runtime.remainingMs}</output>
      <output aria-label="Players remaining">{state.runtime.playersRemaining}</output>
      <button onClick={() => dispatch({ type: 'SET_TIME', remainingMs: 60_000, now: Date.now() })}>Shorten clock</button>
      <button onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: 1, now: Date.now() })}>Advance entry</button>
      <button onClick={() => dispatch({ type: 'GO_TO_ENTRY', index: state.structure.length - 1, now: Date.now() })}>Final level</button>
      <button onClick={() => dispatch({ type: 'SET_PLAYERS', players: 40 })}>Reduce field</button>
    </>
  )
}

function renderControls() {
  render(<TournamentProvider><ResetHarness Controls={ResetControls} /></TournamentProvider>)
}

describe('ResetControls', () => {
  it('confirms resetting the current level before restoring its duration', async () => {
    const user = userEvent.setup()
    renderControls()
    await user.click(screen.getByRole('button', { name: 'Shorten clock' }))
    expect(screen.getByLabelText('Remaining time')).toHaveTextContent('60000')

    const resetCurrent = screen.getByRole('button', { name: 'Reset current level' })
    await user.click(resetCurrent)
    expect(screen.getByRole('alertdialog', { name: 'Reset current level?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Confirm level reset' }))

    expect(screen.getByLabelText('Remaining time')).toHaveTextContent('720000')
    expect(resetCurrent).toHaveFocus()
  })

  it('returns focus to Reset current level after cancellation', async () => {
    const user = userEvent.setup()
    renderControls()
    const resetCurrent = screen.getByRole('button', { name: 'Reset current level' })

    await user.click(resetCurrent)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(resetCurrent).toHaveFocus()
  })

  it('describes an untimed current-level reset without promising a duration', async () => {
    const user = userEvent.setup()
    renderControls()
    await user.click(screen.getByRole('button', { name: 'Final level' }))
    await user.click(screen.getByRole('button', { name: 'Reset current level' }))

    const confirmation = screen.getByRole('alertdialog', { name: 'Reset current level?' })
    expect(confirmation).toHaveTextContent(/remain untimed/i)
    expect(confirmation).not.toHaveTextContent(/full configured duration/i)
  })

  it('uses stronger confirmation before resetting all tournament progress', async () => {
    const user = userEvent.setup()
    renderControls()
    await user.click(screen.getByRole('button', { name: 'Advance entry' }))
    await user.click(screen.getByRole('button', { name: 'Reduce field' }))

    const resetTournament = screen.getByRole('button', { name: 'Reset tournament' })
    await user.click(resetTournament)
    const confirmation = screen.getByRole('alertdialog', { name: 'Reset the entire tournament?' })
    expect(confirmation).toHaveTextContent('level, clock, and player progress')
    await user.click(screen.getByRole('button', { name: 'Confirm full reset' }))

    expect(screen.getByLabelText('Current entry')).toHaveTextContent('1')
    expect(screen.getByLabelText('Remaining time')).toHaveTextContent('720000')
    expect(screen.getByLabelText('Players remaining')).toHaveTextContent('80')
    expect(resetTournament).toHaveFocus()
  })
})
