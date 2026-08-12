import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../app/App'
import { TournamentProvider } from '../../app/TournamentProvider'
import { InfoOverlay } from './InfoOverlay'

const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
)

function openInfo() {
  const trigger = screen.getByRole('button', { name: 'Open tournament information' })
  fireEvent.click(trigger)
  return {
    dialog: screen.getByRole('dialog', { name: 'Tournament information' }),
    trigger,
  }
}

describe('InfoOverlay', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    scrollIntoView.mockReset()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
  })

  afterEach(() => {
    if (originalScrollIntoView === undefined) {
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView
    } else {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView)
    }
  })

  it('shows the complete read-only tournament information and schedule', () => {
    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)

    expect(overlay.getByRole('img', { name: 'Princeton Poker Club logo' })).toBeVisible()
    expect(overlay.getByRole('heading', { name: 'Princeton Poker Club Standard' })).toBeVisible()
    expect(overlay.getByText('10 × 1-value chips')).toBeVisible()
    expect(overlay.getByText('Starting stack: 200 chips')).toBeVisible()
    expect(overlay.getByText(
      'Prize structure will be announced by the Tournament Director before play begins.',
    )).toBeVisible()
    expect(overlay.getByText('Big-blind ante begins at 10/20.')).toBeVisible()
    expect(overlay.getByText(
      'Chip-ups occur during the scheduled breaks shown in the structure.',
    )).toBeVisible()

    const structure = overlay.getByRole('list', { name: 'Tournament blind structure' })
    const entries = within(structure).getAllByRole('listitem')
    expect(entries).toHaveLength(19)
    expect(entries[0]).toHaveAttribute('aria-current', 'step')
    expect(entries[0]).toHaveAttribute('data-state', 'current')
    expect(entries[0]).toHaveTextContent('Level 1')
    expect(entries[0]).toHaveTextContent('1 / 2')
    expect(entries[0]).toHaveTextContent('NO ANTE')
    expect(entries[0]).toHaveTextContent('12 min')
    expect(entries[5]).toHaveTextContent('Chip up to 5s')
    expect(entries[5]).toHaveTextContent('10 min')
    expect(entries[18]).toHaveTextContent('Level 17')
    expect(entries[18]).toHaveTextContent('500 / 1,000')
    expect(entries[18]).toHaveTextContent('BIG BLIND ANTE: 1,000')
    expect(entries[18]).toHaveTextContent('Until end')
    expect(entries[18]).toHaveTextContent('Final level')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })

    const rules = [
      'The floor may make fair decisions in the best interest of the game.',
      'Act clearly and in turn; out-of-turn action may be binding.',
      'Only one player may play a hand.',
      'Keep chips visible and higher denominations identifiable.',
      'Do not use devices while holding a live hand.',
      'All hands must be tabled face up at an all-in showdown.',
      'Verbal declarations made in turn are binding.',
      'Call the clock only after a reasonable amount of time.',
    ]
    rules.forEach((rule) => expect(overlay.getByText(rule)).toBeVisible())

    expect(overlay.getByRole('link', { name: '2024 Poker TDA rules' })).toHaveAttribute(
      'href',
      'https://www.pokertda.com/view-poker-tda-rules/',
    )
    expect(overlay.getByRole('link', { name: '2024 Poker TDA rules' })).toHaveAttribute(
      'target',
      '_blank',
    )
    expect(overlay.getByText(
      'PPC house rules and Tournament Director decisions govern this event.',
    )).toBeVisible()
  })

  it('traps focus and restores the Info trigger after Escape removes inert', async () => {
    const nativeFocus = HTMLElement.prototype.focus
    const focus = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.closest('[inert]')) return
      nativeFocus.call(this)
    })
    const user = userEvent.setup()

    try {
      render(<App />)
      const trigger = screen.getByRole('button', { name: 'Open tournament information' })
      await user.click(trigger)
      const dialog = screen.getByRole('dialog', { name: 'Tournament information' })
      const close = within(dialog).getByRole('button', { name: 'Close tournament information' })
      const rulesLink = within(dialog).getByRole('link', { name: '2024 Poker TDA rules' })

      expect(document.querySelector('.tournament-shell')).toHaveAttribute('inert')
      expect(close).toHaveFocus()
      fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
      expect(rulesLink).toHaveFocus()
      fireEvent.keyDown(rulesLink, { key: 'Tab' })
      expect(close).toHaveFocus()
      fireEvent.keyDown(close, { key: 'Escape' })

      expect(screen.queryByRole('dialog', { name: 'Tournament information' })).not.toBeInTheDocument()
      expect(document.querySelector('.tournament-shell')).not.toHaveAttribute('inert')
      expect(trigger).toHaveFocus()
    } finally {
      focus.mockRestore()
    }
  })

  it('closes from the backdrop but not from the information panel', () => {
    render(<App />)
    const { dialog } = openInfo()
    const panel = dialog.querySelector('.info-panel')
    expect(panel).not.toBeNull()

    fireEvent.click(panel as HTMLElement)
    expect(screen.getByRole('dialog', { name: 'Tournament information' })).toBeVisible()
    fireEvent.click(dialog)
    expect(screen.queryByRole('dialog', { name: 'Tournament information' })).not.toBeInTheDocument()
  })

  it('blocks clock shortcuts and prevents Info and Director from coexisting', () => {
    render(<App />)
    const infoTrigger = screen.getByRole('button', { name: 'Open tournament information' })
    const directorTrigger = screen.getByRole('button', { name: 'Open Tournament Director' })

    fireEvent.click(infoTrigger)
    const infoDialog = screen.getByRole('dialog', { name: 'Tournament information' })
    const structure = within(infoDialog).getByRole('list', { name: 'Tournament blind structure' })
    const firstEntry = within(structure).getAllByRole('listitem')[0]
    const rulesLink = within(infoDialog).getByRole('link', { name: '2024 Poker TDA rules' })
    fireEvent.keyDown(rulesLink, { key: 'ArrowRight' })
    fireEvent.keyDown(rulesLink, { key: ' ' })
    fireEvent.click(directorTrigger)

    expect(firstEntry).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'Start tournament' })).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Tournament Director' })).not.toBeInTheDocument()
    fireEvent.click(within(infoDialog).getByRole('button', { name: 'Close tournament information' }))

    fireEvent.click(directorTrigger)
    fireEvent.click(infoTrigger)
    expect(screen.getByRole('dialog', { name: 'Tournament Director' })).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Tournament information' })).not.toBeInTheDocument()
  })

  it('does not report a close during StrictMode effect rehearsal', () => {
    const onAfterClose = vi.fn()

    render(
      <StrictMode>
        <TournamentProvider>
          <InfoOverlay open onClose={vi.fn()} onAfterClose={onAfterClose} />
        </TournamentProvider>
      </StrictMode>,
    )

    expect(onAfterClose).not.toHaveBeenCalled()
  })
})
