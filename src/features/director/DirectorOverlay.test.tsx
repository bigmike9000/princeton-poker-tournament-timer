import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { App } from '../../app/App'
import { TournamentProvider } from '../../app/TournamentProvider'
import { DirectorOverlay } from './DirectorOverlay'

async function openDirector(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Open Tournament Director' }))
  expect(screen.getByRole('dialog', { name: 'Tournament Director' })).toBeVisible()
}

describe('DirectorOverlay', () => {
  it('shows the Princeton Poker Club logo when open', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)

    expect(within(screen.getByRole('dialog')).getByRole('img', { name: 'Princeton Poker Club logo' })).toBeVisible()
  })

  it('shows the configured organization name in the director header', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    await user.click(screen.getByRole('button', { name: 'Tournament' }))

    await user.clear(screen.getByLabelText('Organization name'))
    await user.type(screen.getByLabelText('Organization name'), 'Garden State Poker Society')
    await user.click(screen.getByRole('button', { name: 'Apply tournament details' }))

    expect(within(screen.getByRole('dialog')).getByText('Garden State Poker Society')).toBeVisible()
  })

  it('opens on Structure with integrated clock and reset controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)

    expect(within(screen.getByRole('navigation', { name: 'Tournament Director sections' })).getAllByRole('button')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Structure' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument()
    expect(screen.queryByText('Progression')).not.toBeInTheDocument()
    expect(screen.queryByText('Field')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit remaining time' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Reset current level' })).toBeVisible()
  })

  it('returns to Structure after another tab is selected and the Director is reopened', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    await user.click(screen.getByRole('button', { name: 'Tournament' }))
    expect(screen.getByRole('button', { name: 'Tournament' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Close Tournament Director' }))
    await openDirector(user)

    expect(screen.getByRole('button', { name: 'Structure' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Edit remaining time' })).toBeVisible()
  })

  it('does not report a close during StrictMode effect rehearsal', () => {
    const onAfterClose = vi.fn()

    render(
      <StrictMode>
        <TournamentProvider>
          <DirectorOverlay open onClose={vi.fn()} onAfterClose={onAfterClose} />
        </TournamentProvider>
      </StrictMode>,
    )

    expect(onAfterClose).not.toHaveBeenCalled()
  })

  it('edits remaining time from Structure', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    const director = within(screen.getByRole('dialog', { name: 'Tournament Director' }))

    await user.clear(director.getByLabelText('Minutes remaining'))
    await user.type(director.getByLabelText('Minutes remaining'), '12')
    await user.clear(director.getByLabelText('Seconds remaining'))
    await user.type(director.getByLabelText('Seconds remaining'), '30')
    await user.click(director.getByRole('button', { name: 'Apply time' }))

    expect(screen.getByRole('timer')).toHaveTextContent('12:30')
  })

  it('requires explicit confirmation before resetting the current level', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)

    await user.click(screen.getByRole('button', { name: 'Subtract one minute' }))
    expect(screen.getByRole('timer')).toHaveTextContent('11:00')
    await user.click(screen.getByRole('button', { name: 'Reset current level' }))

    expect(screen.getByRole('alertdialog', { name: 'Reset current level?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Confirm level reset' }))
    expect(screen.getByRole('timer')).toHaveTextContent('12:00')
  })

  it('requires stronger confirmation before resetting the tournament', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    await user.click(screen.getByRole('button', { name: 'Subtract one minute' }))
    await user.click(screen.getByRole('button', { name: 'Reset tournament' }))

    const confirmation = screen.getByRole('alertdialog', { name: 'Reset the entire tournament?' })
    expect(confirmation).toHaveTextContent('level, clock, and player progress')
    await user.click(screen.getByRole('button', { name: 'Confirm full reset' }))

    expect(screen.getAllByText('LEVEL 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('80 / 80').length).toBeGreaterThan(0)
    expect(screen.getByRole('timer')).toHaveTextContent('12:00')
  })

  it('updates tournament information atomically', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    await user.click(screen.getByRole('button', { name: 'Tournament' }))

    expect(screen.getByText('Starting chips in play: 16,000')).toBeVisible()
    expect(screen.getByText('Default allocation: 10 × 1 · 8 × 5 · 6 × 25 = 200')).toBeVisible()

    await user.clear(screen.getByLabelText('Tournament name'))
    await user.type(screen.getByLabelText('Tournament name'), 'Fall Championship')
    await user.clear(screen.getByLabelText('Starting player count'))
    await user.type(screen.getByLabelText('Starting player count'), '100')
    await user.clear(screen.getByLabelText('Starting chip stack'))
    await user.type(screen.getByLabelText('Starting chip stack'), '50000')
    await user.click(screen.getByRole('button', { name: 'Apply tournament details' }))

    expect(screen.getByText('Fall Championship')).toBeVisible()
    expect(screen.getByText('80 / 100')).toBeVisible()
    expect(screen.getByText('Starting chips in play: 5,000,000')).toBeVisible()
    expect(screen.queryByText('Default allocation: 10 × 1 · 8 × 5 · 6 × 25 = 200')).not.toBeInTheDocument()
  })

  it('returns focus only after the director background is no longer inert', async () => {
    const nativeFocus = HTMLElement.prototype.focus
    const focus = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (this: HTMLElement) {
      if (this.closest('[inert]')) return
      nativeFocus.call(this)
    })
    const user = userEvent.setup()
    try {
      render(<App />)
      const trigger = screen.getByRole('button', { name: 'Open Tournament Director' })
      await user.click(trigger)
      await user.click(screen.getByRole('button', { name: 'Close Tournament Director' }))

      expect(document.querySelector('.app-background')).not.toHaveAttribute('inert')
      expect(trigger).toHaveFocus()
    } finally {
      focus.mockRestore()
    }
  })

  it('contains keyboard focus inside the modal overlay', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openDirector(user)
    const close = screen.getByRole('button', { name: 'Close Tournament Director' })

    expect(document.querySelector('.app-background')).toHaveAttribute('inert')
    expect(close).toHaveFocus()
    const last = screen.getByRole('button', { name: 'Reset tournament' })
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(close).toHaveFocus()
  })
})
