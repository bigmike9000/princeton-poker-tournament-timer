import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../../app/App'

async function openDirector(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Open Tournament Director' }))
  expect(screen.getByRole('dialog', { name: 'Tournament Director' })).toBeVisible()
}

describe('DirectorOverlay', () => {
  it('edits remaining time and players from the run panel', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)

    await user.clear(screen.getByLabelText('Minutes remaining'))
    await user.type(screen.getByLabelText('Minutes remaining'), '12')
    await user.clear(screen.getByLabelText('Seconds remaining'))
    await user.type(screen.getByLabelText('Seconds remaining'), '30')
    await user.click(screen.getByRole('button', { name: 'Apply time' }))

    expect(screen.getByRole('timer')).toHaveTextContent('12:30')

    await user.clear(screen.getByLabelText('Players remaining'))
    await user.type(screen.getByLabelText('Players remaining'), '53')
    await user.click(screen.getByRole('button', { name: 'Apply player count' }))
    expect(screen.getAllByText('53 / 80').length).toBeGreaterThan(0)
  })

  it('jumps directly to a chosen tournament entry', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)

    await user.selectOptions(screen.getByLabelText('Choose level or break'), '5')

    expect(screen.getAllByText('LEVEL 5').length).toBeGreaterThan(0)
    expect(screen.getByRole('timer')).toHaveTextContent('20:00')
  })

  it('refreshes the time draft when moving to an entry with another duration', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)

    expect(screen.getByLabelText('Minutes remaining')).toHaveValue(20)
    await user.selectOptions(screen.getByLabelText('Choose level or break'), '4')

    expect(screen.getByLabelText('Minutes remaining')).toHaveValue(15)
    await user.click(screen.getByRole('button', { name: 'Subtract one minute' }))
    expect(screen.getByLabelText('Minutes remaining')).toHaveValue(14)
    await user.click(screen.getByRole('button', { name: 'Apply time' }))
    expect(screen.getByRole('timer')).toHaveTextContent('14:00')
  })

  it('requires explicit confirmation before resetting the current level', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)

    await user.click(screen.getByRole('button', { name: 'Subtract one minute' }))
    expect(screen.getByRole('timer')).toHaveTextContent('19:00')
    await user.click(screen.getByRole('button', { name: 'Reset current level' }))

    expect(screen.getByRole('alertdialog', { name: 'Reset current level?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Confirm level reset' }))
    expect(screen.getByRole('timer')).toHaveTextContent('20:00')
  })

  it('requires stronger confirmation before resetting the tournament', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    await user.click(screen.getByRole('button', { name: 'Next level' }))
    await user.click(screen.getByRole('button', { name: 'Reset tournament' }))

    const confirmation = screen.getByRole('alertdialog', { name: 'Reset the entire tournament?' })
    expect(confirmation).toHaveTextContent('level, clock, and player progress')
    await user.click(screen.getByRole('button', { name: 'Confirm full reset' }))

    expect(screen.getAllByText('LEVEL 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('80 / 80').length).toBeGreaterThan(0)
  })

  it('updates tournament information atomically', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    await user.click(screen.getByRole('button', { name: 'Tournament' }))

    await user.clear(screen.getByLabelText('Tournament name'))
    await user.type(screen.getByLabelText('Tournament name'), 'Fall Championship')
    await user.clear(screen.getByLabelText('Starting player count'))
    await user.type(screen.getByLabelText('Starting player count'), '100')
    await user.clear(screen.getByLabelText('Starting chip stack'))
    await user.type(screen.getByLabelText('Starting chip stack'), '50000')
    await user.click(screen.getByRole('button', { name: 'Apply tournament details' }))

    expect(screen.getByText('Fall Championship')).toBeVisible()
    expect(screen.getByText('80 / 100')).toBeVisible()
    expect(screen.getByText('5,000,000')).toBeVisible()
  })

  it('returns focus to the director trigger when closed', async () => {
    const user = userEvent.setup()
    render(<App />)
    const trigger = screen.getByRole('button', { name: 'Open Tournament Director' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Close Tournament Director' }))

    expect(trigger).toHaveFocus()
  })

  it('contains keyboard focus inside the modal overlay', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    const close = screen.getByRole('button', { name: 'Close Tournament Director' })

    expect(document.querySelector('.tournament-shell')).toHaveAttribute('inert')
    expect(close).toHaveFocus()
    const last = screen.getByRole('button', { name: 'Reset tournament' })
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(close).toHaveFocus()
  })
})
