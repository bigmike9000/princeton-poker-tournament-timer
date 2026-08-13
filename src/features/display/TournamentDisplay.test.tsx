import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TournamentProvider } from '../../app/TournamentProvider'
import { createInitialState } from '../../domain/sampleStructure'
import { entryDurationMs } from '../../domain/structure'
import { saveSnapshot } from '../../persistence/snapshot'
import displayCss from '../../styles/display.css?raw'
import { TournamentDisplay } from './TournamentDisplay'

function renderDisplay(onOpenDirector = vi.fn(), onOpenInfo = vi.fn()) {
  return render(
    <TournamentProvider>
      <TournamentDisplay
        onOpenDirector={onOpenDirector}
        onOpenInfo={onOpenInfo}
        fullscreen={false}
        fullscreenError={null}
        onToggleFullscreen={vi.fn().mockResolvedValue(undefined)}
      />
    </TournamentProvider>,
  )
}

function cssRule(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('TournamentDisplay', () => {
  it('shows the Princeton Poker Club logo', () => {
    renderDisplay()

    expect(screen.getByRole('img', { name: 'Princeton Poker Club logo' })).toBeVisible()
  })

  it('renders the main brand as a shared semantic lockup', () => {
    const state = createInitialState()
    state.configuration.organizationName = 'Princeton Poker Club'
    state.configuration.tournamentName = 'Test 1'
    saveSnapshot(localStorage, state, Date.now())

    const { container } = renderDisplay()
    const lockup = container.querySelector('.club-brand-lockup')

    expect(lockup).not.toBeNull()
    expect(lockup?.firstElementChild).toHaveAttribute('alt', 'Princeton Poker Club logo')
    expect(within(lockup as HTMLElement).getByText('Princeton Poker Club')).toHaveClass('club-brand-organization')
    expect(within(lockup as HTMLElement).getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(within(lockup as HTMLElement).getByRole('heading', { level: 1 })).toHaveTextContent('Test 1')
  })

  it('renders the default sponsor marks in the public footer', () => {
    renderDisplay()

    expect(screen.getByRole('img', { name: 'Jane Street' })).toHaveAttribute('src', '/branding/jane-street.png')
    expect(screen.getByRole('img', { name: 'Susquehanna' })).toHaveAttribute('src', '/branding/susquehanna.png')
  })

  it('shows the dominant timer, current blinds, and player statistics', () => {
    renderDisplay()

    expect(screen.getByRole('timer')).toHaveTextContent('12:00')
    expect(screen.getByText('LEVEL 1')).toBeVisible()
    expect(screen.getAllByText('1 / 2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NO ANTE').length).toBeGreaterThan(0)
    expect(screen.getByText('80 / 80')).toBeVisible()
    expect(screen.getByText('200')).toBeVisible()
    expect(screen.queryByText('Official Tournament Clock')).not.toBeInTheDocument()
    expect(screen.queryByText('Total chips')).not.toBeInTheDocument()
    expect(screen.queryByText('16,000')).not.toBeInTheDocument()
  })

  it('renders a break and previews the next poker level', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 5
    state.runtime.remainingMs = entryDurationMs(state.structure[5]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    expect(screen.getAllByText('BREAK · 10 MIN').length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Current break' })).toHaveTextContent('Chip up to 5s')
    expect(screen.getByText(/Next: Level 6/)).toBeVisible()
    expect(screen.getAllByText(/10 \/ 20/).length).toBeGreaterThan(0)
  })

  it('renders a generic break label once and opts its current schedule row into shortcuts', () => {
    const state = createInitialState()
    state.structure[5] = { ...state.structure[5], kind: 'break', durationSeconds: 600, label: 'Break' }
    state.runtime.currentEntryIndex = 5
    state.runtime.remainingMs = entryDurationMs(state.structure[5]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    const currentBreak = within(screen.getByRole('region', { name: 'Current break' }))
    expect(currentBreak.getAllByText('BREAK · 10 MIN')).toHaveLength(1)
    expect(currentBreak.queryByText('Break', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Break, 10 min' })).toHaveAttribute('data-tournament-shortcuts', 'true')
  })

  it('highlights the current structure row and lists completed levels', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 2
    state.runtime.remainingMs = entryDurationMs(state.structure[2]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    expect(screen.getByRole('listitem', { name: /^Level 3 / })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('listitem', { name: /^Level 1 / })).toHaveAttribute('data-state', 'complete')
  })

  it('jumps to a schedule entry from the main display', async () => {
    const user = userEvent.setup()
    renderDisplay()

    await user.click(screen.getByRole('button', { name: /^Level 2 2 \/ 4/ }))

    expect(screen.getByText('LEVEL 2')).toBeVisible()
    expect(screen.getByRole('timer')).toHaveTextContent('12:00')
  })

  it('keeps break descriptions but hides saved organizer level notes from the public schedule', async () => {
    const user = userEvent.setup()
    const state = createInitialState()
    const notedLevel = state.structure.find((entry) => entry.id === 'level-13')
    if (notedLevel?.kind !== 'level') throw new Error('Missing test level')
    notedLevel.note = 'Director-only final table setup'
    saveSnapshot(localStorage, state, Date.now())
    renderDisplay()
    const schedule = screen.getByRole('complementary', { name: 'Blind Structure' })

    expect(within(schedule).getByText(/Chip up to 5s/)).toBeVisible()
    expect(within(schedule).getByText(/Chip up to 25s and 100s/)).toBeVisible()
    expect(within(schedule).queryByText('Director-only final table setup')).not.toBeInTheDocument()
    expect(within(schedule).queryByRole('button', { name: /Director-only final table setup/ })).not.toBeInTheDocument()
    expect(within(schedule).getByRole('button', { name: 'Break, 10 min, Chip up to 5s' })).toBeVisible()
    expect(within(schedule).getByRole('button', {
      name: 'Level 13 100 / 200, BIG BLIND ANTE: 200, 15 min',
    })).toBeVisible()

    await user.click(within(schedule).getByRole('button', { name: /^Level 17 500 \/ 1,000/ }))

    expect(screen.getByRole('region', { name: 'Current poker level' })).toHaveTextContent('LEVEL 17')
    expect(screen.getByRole('region', { name: 'Current poker level' })).not.toHaveTextContent('Final level')
    expect(screen.getByRole('timer')).toHaveTextContent('UNTIL END')
  })

  it('keeps the public blind schedule compact without shrinking its buttons below their row height', () => {
    expect(cssRule(displayCss, '.structure-header')).toMatch(/min-height:\s*5\.6rem/)
    expect(cssRule(displayCss, '.structure-row')).toMatch(/min-height:\s*3\.25rem/)
    expect(cssRule(displayCss, '.structure-row--break')).toMatch(/min-height:\s*2\.75rem/)
    expect(cssRule(displayCss, '.structure-row-button')).toMatch(/min-height:\s*inherit/)
    expect(cssRule(displayCss, '.structure-row-button')).toMatch(/padding:\s*\.4rem\s+\.75rem/)
  })

  it('runs safe main-display controls and opens the director overlay', () => {
    const onOpenDirector = vi.fn()
    renderDisplay(onOpenDirector)

    fireEvent.click(screen.getByRole('button', { name: 'Start tournament' }))
    expect(screen.getByRole('button', { name: 'Pause tournament' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Eliminate player' }))
    expect(screen.getByText('79 / 80')).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Open Tournament Director' }))
    expect(onOpenDirector).toHaveBeenCalledOnce()
  })

  it('opens public tournament information immediately before fullscreen', () => {
    const onOpenInfo = vi.fn()
    renderDisplay(vi.fn(), onOpenInfo)
    const controls = within(screen.getByRole('navigation', { name: 'Tournament controls' }))
    const info = controls.getByRole('button', { name: 'Open tournament information' })
    const fullscreen = controls.getByRole('button', { name: 'Enter fullscreen' })

    expect(info.compareDocumentPosition(fullscreen) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(info)
    expect(onOpenInfo).toHaveBeenCalledOnce()
    expect(onOpenInfo).toHaveBeenCalledWith(info)
  })

  it('updates player statistics from the editable player count', async () => {
    const user = userEvent.setup()
    renderDisplay()
    const input = screen.getByRole('spinbutton', { name: 'Players remaining' })

    await user.clear(input)
    await user.type(input, '53{Enter}')

    expect(screen.getByText('53 / 80')).toBeVisible()
    expect(screen.getByText('302')).toBeVisible()
  })
})
