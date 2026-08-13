import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TournamentProvider } from '../../app/TournamentProvider'
import { createInitialState } from '../../domain/sampleStructure'
import { entryDurationMs } from '../../domain/structure'
import { saveSnapshot } from '../../persistence/snapshot'
import brandCss from '../../styles/brand.css?raw'
import displayCss from '../../styles/display.css?raw'
import indexCss from '../../styles/index.css?raw'
import tokensCss from '../../styles/tokens.css?raw'
import { TournamentDisplay } from './TournamentDisplay'

function renderDisplay(onOpenDirector = vi.fn(), onOpenInfo = vi.fn(), fullscreen = false) {
  return render(
    <TournamentProvider>
      <TournamentDisplay
        onOpenDirector={onOpenDirector}
        onOpenInfo={onOpenInfo}
        fullscreen={fullscreen}
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
    const lockup = container.querySelector('.club-brand-lockup.brand-lockup--display')

    expect(lockup).not.toBeNull()
    expect(lockup).toHaveClass('director-brand')
    expect(lockup?.firstElementChild).toHaveAttribute('alt', 'Princeton Poker Club logo')
    expect(lockup?.firstElementChild).toHaveClass('director-logo')
    const organization = within(lockup as HTMLElement).getByText('Princeton Poker Club')
    expect(organization).toHaveClass('club-brand-organization')
    expect(within(lockup as HTMLElement).getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const tournamentName = within(lockup as HTMLElement).getByRole('heading', { level: 1 })
    expect(tournamentName).toHaveTextContent('Test 1')
    expect(organization.compareDocumentPosition(tournamentName) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
    const savedBreak = state.structure[5]
    if (savedBreak?.kind !== 'break') throw new Error('Missing first break')
    savedBreak.label = 'Chip up to 5s'
    state.runtime.currentEntryIndex = 5
    state.runtime.remainingMs = entryDurationMs(state.structure[5]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    const currentBreak = screen.getByRole('region', { name: 'Current break' })
    expect(within(currentBreak).getByRole('heading', { name: 'BREAK' })).toBeVisible()
    expect(currentBreak).not.toHaveTextContent('Count and stack white chips')
    const procedure = screen.getByRole('status')
    expect(procedure).toHaveAttribute('aria-atomic', 'true')
    expect(procedure).not.toHaveAttribute('aria-label')
    expect(procedure).toHaveTextContent('Count and stack white chips in stacks of 10')
    expect(procedure).not.toHaveTextContent('Break procedure')
    expect(
      procedure.compareDocumentPosition(screen.getByLabelText('Tournament statistics')) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy()
    const schedule = within(screen.getByRole('complementary', { name: 'Blind Structure' }))
    const scheduledBreaks = schedule.getAllByRole('button', { name: 'Break, 10 min' })
    expect(scheduledBreaks).toHaveLength(2)
    for (const scheduledBreak of scheduledBreaks) {
      expect(scheduledBreak).toHaveTextContent('BREAK — 10 MIN')
      expect(scheduledBreak).not.toHaveTextContent(/Count and stack (white|red) chips/)
    }
    const currentBreakRow = scheduledBreaks[0].closest('li')
    expect(currentBreakRow).not.toHaveAttribute('aria-label')
    expect(currentBreakRow).not.toHaveAttribute('aria-current')
    expect(scheduledBreaks[0]).toHaveAttribute('aria-current', 'step')
    expect(scheduledBreaks[1]).not.toHaveAttribute('aria-current')
    expect(screen.getByText(/Next: Level 6/)).toBeVisible()
    expect(screen.getAllByText(/10 \/ 20/).length).toBeGreaterThan(0)
  })

  it('shows the red-chip instruction during the second bundled break', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 11
    state.runtime.remainingMs = entryDurationMs(state.structure[11]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    const currentBreak = screen.getByRole('region', { name: 'Current break' })
    expect(within(currentBreak).getByRole('heading', { name: 'BREAK' })).toBeVisible()
    expect(currentBreak).not.toHaveTextContent('Count and stack red chips')
    const procedure = screen.getByRole('status')
    expect(procedure).toHaveTextContent('Count and stack red chips in stacks of 10')
    expect(procedure).not.toHaveTextContent('Break procedure')
  })

  it('announces a break procedure by updating the status node mounted during poker levels', async () => {
    const user = userEvent.setup()
    renderDisplay()

    const levelStatus = screen.getByRole('status')
    expect(levelStatus).toHaveAttribute('aria-atomic', 'true')
    expect(levelStatus).toHaveClass('break-procedure--empty')
    expect(levelStatus).toBeEmptyDOMElement()

    const schedule = screen.getByRole('complementary', { name: 'Blind Structure' })
    await user.click(within(schedule).getAllByRole('button', { name: 'Break, 10 min' })[0])

    const breakStatus = screen.getByRole('status')
    expect(breakStatus).toBe(levelStatus)
    expect(breakStatus).not.toHaveClass('break-procedure--empty')
    expect(breakStatus).not.toHaveAttribute('aria-label')
    expect(within(breakStatus).getByText('Count and stack white chips in stacks of 10')).toBeVisible()
    expect(breakStatus).not.toHaveTextContent('Break procedure')
  })

  it('renders a generic break label once and opts its current schedule row into shortcuts', () => {
    const state = createInitialState()
    state.structure[5] = { ...state.structure[5], kind: 'break', durationSeconds: 600, label: 'Break' }
    state.runtime.currentEntryIndex = 5
    state.runtime.remainingMs = entryDurationMs(state.structure[5]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    const currentBreak = screen.getByRole('region', { name: 'Current break' })
    expect(within(currentBreak).getByRole('heading', { name: 'BREAK' })).toBeVisible()
    expect(currentBreak).not.toHaveTextContent('Break procedure')
    expect(screen.getByRole('status')).toHaveClass('break-procedure--empty')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    const schedule = screen.getByRole('complementary', { name: 'Blind Structure' })
    const currentScheduleBreak = within(schedule).getAllByRole('listitem')[5]
    const currentBreakButton = within(currentScheduleBreak).getByRole('button', { name: 'Break, 10 min' })
    expect(currentScheduleBreak).not.toHaveAttribute('aria-label')
    expect(currentScheduleBreak).not.toHaveAttribute('aria-current')
    expect(currentBreakButton).toHaveAttribute('aria-current', 'step')
    expect(currentBreakButton).toHaveAttribute('data-tournament-shortcuts', 'true')
  })

  it('highlights the current structure row and lists completed levels', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 2
    state.runtime.remainingMs = entryDurationMs(state.structure[2]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    const schedule = screen.getByRole('complementary', { name: 'Blind Structure' })
    const rows = within(schedule).getAllByRole('listitem')
    const currentLevelButton = within(rows[2]).getByRole('button', { name: /^Level 3 / })
    expect(rows[2]).not.toHaveAttribute('aria-label')
    expect(rows[2]).not.toHaveAttribute('aria-current')
    expect(currentLevelButton).toHaveAttribute('aria-current', 'step')
    expect(rows[0]).not.toHaveAttribute('aria-label')
    expect(rows[0]).toHaveAttribute('data-state', 'complete')
  })

  it('jumps to a schedule entry from the main display', async () => {
    const user = userEvent.setup()
    renderDisplay()

    await user.click(screen.getByRole('button', { name: /^Level 2 2 \/ 4/ }))

    expect(screen.getByText('LEVEL 2')).toBeVisible()
    expect(screen.getByRole('timer')).toHaveTextContent('12:00')
  })

  it('keeps break procedures out of poker levels and hides saved organizer level notes from the public schedule', async () => {
    const user = userEvent.setup()
    const state = createInitialState()
    const notedLevel = state.structure.find((entry) => entry.id === 'level-13')
    if (notedLevel?.kind !== 'level') throw new Error('Missing test level')
    notedLevel.note = 'Director-only final table setup'
    saveSnapshot(localStorage, state, Date.now())
    renderDisplay()
    const schedule = screen.getByRole('complementary', { name: 'Blind Structure' })

    expect(within(schedule).queryByText(/Count and stack white chips in stacks of 10/)).not.toBeInTheDocument()
    expect(within(schedule).queryByText(/Count and stack red chips/)).not.toBeInTheDocument()
    expect(within(schedule).queryByText('Director-only final table setup')).not.toBeInTheDocument()
    expect(within(schedule).queryByRole('button', { name: /Director-only final table setup/ })).not.toBeInTheDocument()
    const scheduledBreaks = within(schedule).getAllByRole('button', { name: 'Break, 10 min' })
    expect(scheduledBreaks).toHaveLength(2)
    for (const scheduledBreak of scheduledBreaks) {
      expect(scheduledBreak).toHaveTextContent('BREAK — 10 MIN')
      expect(scheduledBreak).not.toHaveTextContent(/Count and stack (white|red) chips/)
    }
    expect(within(schedule).getByRole('button', {
      name: 'Level 13 100 / 200, BIG BLIND ANTE: 200, 15 min',
    })).toBeVisible()

    await user.click(within(schedule).getByRole('button', { name: /^Level 18 500 \/ 1,000/ }))

    expect(screen.getByRole('region', { name: 'Current poker level' })).toHaveTextContent('LEVEL 18')
    expect(screen.getByRole('region', { name: 'Current poker level' })).not.toHaveTextContent('Final level')
    expect(screen.getByRole('status')).toHaveClass('break-procedure--empty')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getByRole('timer')).toHaveTextContent('UNTIL END')
  })

  it('hides a saved organizer note when its poker level is current', () => {
    const state = createInitialState()
    const currentLevelIndex = state.structure.findIndex((entry) => entry.id === 'level-13')
    const currentLevel = state.structure[currentLevelIndex]
    if (currentLevel?.kind !== 'level') throw new Error('Missing test level')
    currentLevel.note = 'Public display must not reveal this saved organizer note'
    state.runtime.currentEntryIndex = currentLevelIndex
    state.runtime.remainingMs = entryDurationMs(currentLevel) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    const { container } = renderDisplay()
    const currentHero = screen.getByRole('region', { name: 'Current poker level' })

    expect(currentHero).toHaveTextContent('LEVEL 13')
    expect(currentHero).not.toHaveTextContent('Public display must not reveal this saved organizer note')
    expect(container.querySelector('.tournament-shell')).not.toHaveTextContent(
      'Public display must not reveal this saved organizer note',
    )
  })

  it('keeps the public blind schedule compact without shrinking its buttons below their row height', () => {
    expect(cssRule(displayCss, '.structure-header')).toMatch(/min-height:\s*5\.6rem/)
    expect(cssRule(displayCss, '.structure-row')).toMatch(/min-height:\s*3\.25rem/)
    expect(cssRule(displayCss, '.structure-row--break')).toMatch(/min-height:\s*2\.75rem/)
    expect(cssRule(displayCss, '.structure-row-button')).toMatch(/min-height:\s*inherit/)
    expect(cssRule(displayCss, '.structure-row-button')).toMatch(/padding:\s*\.4rem\s+\.75rem/)
  })

  it('visually hides the empty procedure status without removing its live-region semantics', () => {
    const emptyProcedureRule = cssRule(displayCss, '.break-procedure--empty')

    expect(emptyProcedureRule).toMatch(/position:\s*absolute/)
    expect(emptyProcedureRule).toMatch(/width:\s*1px/)
    expect(emptyProcedureRule).toMatch(/height:\s*1px/)
    expect(emptyProcedureRule).toMatch(/overflow:\s*hidden/)
    expect(emptyProcedureRule).not.toMatch(/display:\s*none|visibility:\s*hidden/)
  })

  it('uses interface typography for operational surfaces while preserving heritage branding', () => {
    const tokenRoot = cssRule(tokensCss, ':root')

    expect(tokenRoot).toMatch(/--font-interface:\s*"Avenir Next",\s*Avenir,\s*"Segoe UI",\s*ui-sans-serif,\s*system-ui,\s*sans-serif/)
    expect(tokenRoot).toMatch(/--font-heritage:\s*Baskerville,\s*"Iowan Old Style",\s*"Palatino Linotype",\s*Palatino,\s*Georgia,\s*serif/)
    expect(tokenRoot).toMatch(/--font-numeric:\s*"Avenir Next Condensed",\s*"Arial Narrow",\s*"Roboto Condensed",\s*"Segoe UI",\s*sans-serif/)
    expect(cssRule(indexCss, ':root')).toMatch(/font-family:\s*var\(--font-interface\)/)
    expect(displayCss).toMatch(/\.structure-header h2\s*\{[^}]*font-family:\s*var\(--font-interface\)/)
    expect(cssRule(displayCss, '.level-heading')).toMatch(/font-family:\s*var\(--font-heritage\)/)
    expect(brandCss).toMatch(/\.club-brand-lockup h1\s*\{[^}]*font-family:\s*var\(--font-heritage\)/)
  })

  it('renders active break instructions as a plain text line', () => {
    const procedureRule = cssRule(displayCss, '.break-procedure')

    expect(procedureRule).toMatch(/margin:\s*\.55rem\s+0\s+0/)
    expect(procedureRule).toMatch(/font-size:\s*clamp\(1rem,\s*1\.3vw,\s*1\.3rem\)/)
    expect(procedureRule).toMatch(/font-weight:\s*600/)
    expect(procedureRule).toMatch(/line-height:\s*1\.3/)
    expect(procedureRule).not.toMatch(/border\s*:|background\s*:|box-shadow\s*:/)
  })

  it('uses restrained radii and clips grouped public surfaces', () => {
    const tokenRoot = cssRule(tokensCss, ':root')
    expect(tokenRoot).toMatch(/--radius-compact:\s*\.375rem/)
    expect(tokenRoot).toMatch(/--radius-control:\s*\.625rem/)
    expect(tokenRoot).toMatch(/--radius-card:\s*\.75rem/)

    expect(cssRule(displayCss, '.stats-grid')).toMatch(/border-radius:\s*var\(--radius-card\)/)
    expect(cssRule(displayCss, '.stats-grid')).toMatch(/overflow:\s*hidden/)
    expect(cssRule(displayCss, '.player-stepper')).toMatch(/border-radius:\s*var\(--radius-control\)/)
    expect(cssRule(displayCss, '.player-stepper')).toMatch(/overflow:\s*hidden/)
    expect(cssRule(displayCss, '.player-stepper button:focus-visible')).toMatch(/outline-offset:\s*-3px/)

    expect(cssRule(displayCss, '.control-button,\n.icon-button,\n.director-button')).toMatch(
      /border-radius:\s*var\(--radius-control\)/,
    )

    for (const selector of [
      '.status-pill',
      '.structure-count',
      '.structure-row',
      '.structure-row-button',
      '.level-index',
      '.live-marker',
    ]) {
      expect(cssRule(displayCss, selector), selector).toMatch(/border-radius:\s*var\(--radius-compact\)/)
    }
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

  it('uses icon-only public utility controls without changing their accessible actions', () => {
    const { container } = renderDisplay()
    const utility = container.querySelector('.control-group--utility')

    expect(utility).not.toBeNull()
    const controls = within(utility as HTMLElement)
    expect(controls.getAllByRole('button')).toHaveLength(4)
    expect(controls.queryAllByText(/Info|Full screen|Exit screen|Sound on|Sound off|TD Controls/)).toHaveLength(0)
    expect(controls.getByRole('button', { name: 'Open tournament information' }).querySelector('.control-icon--info')).not.toBeNull()
    expect(controls.getByRole('button', { name: 'Enter fullscreen' }).querySelector('.control-icon--fullscreen-enter')).not.toBeNull()
    expect(controls.getByRole('button', { name: 'Mute alerts' }).querySelector('.control-icon--sound-on')).not.toBeNull()
    expect(controls.getByRole('button', { name: 'Open Tournament Director' }).querySelector('.control-icon--settings')).not.toBeNull()
  })

  it('changes the fullscreen and sound glyphs with their real control states', () => {
    const { unmount } = renderDisplay(vi.fn(), vi.fn(), true)
    const exitFullscreen = screen.getByRole('button', { name: 'Exit fullscreen' })

    expect(exitFullscreen.querySelector('.control-icon--fullscreen-exit')).not.toBeNull()
    unmount()

    renderDisplay()
    const mute = screen.getByRole('button', { name: 'Mute alerts' })
    fireEvent.click(mute)

    const unmute = screen.getByRole('button', { name: 'Unmute alerts' })
    expect(unmute).toHaveAttribute('aria-pressed', 'true')
    expect(unmute.querySelector('.control-icon--sound-off')).not.toBeNull()
  })

  it('keeps public utility glyph controls square and projector-safe', () => {
    const buttonRule = cssRule(displayCss, '.utility-icon-button')
    const minimumRule = cssRule(displayCss, '.icon-button.utility-icon-button')
    const iconRule = cssRule(displayCss, '.control-icon')

    expect(buttonRule).toMatch(/width:\s*3\.4rem/)
    expect(buttonRule).toMatch(/height:\s*3\.4rem/)
    expect(buttonRule).toMatch(/padding:\s*0/)
    expect(minimumRule).toMatch(/min-width:\s*3\.4rem/)
    expect(iconRule).toMatch(/width:\s*1\.35rem/)
    expect(iconRule).toMatch(/height:\s*1\.35rem/)
  })

  it('uses ghost navigation and circular utility interaction surfaces', () => {
    const { container } = renderDisplay()
    const controls = within(screen.getByRole('navigation', { name: 'Tournament controls' }))
    const navRule = cssRule(displayCss, '.control-button--nav')
    const utilitySizeRule = cssRule(displayCss, '.utility-icon-button')
    const utilityRule = cssRule(displayCss, '.icon-button.utility-icon-button')
    const hoverRule = cssRule(displayCss, '.icon-button.utility-icon-button:hover:not(:disabled)')
    const focusRule = cssRule(displayCss, '.icon-button.utility-icon-button:focus-visible')
    const activeRule = cssRule(displayCss, '.icon-button.utility-icon-button:active:not(:disabled)')

    expect(controls.getByRole('button', { name: 'Previous level' })).toHaveClass('control-button--nav')
    expect(controls.getByRole('button', { name: 'Next level' })).toHaveClass('control-button--nav')
    expect(navRule).toMatch(/border:\s*0/)
    expect(navRule).toMatch(/background:\s*transparent/)
    expect(navRule).toMatch(/box-shadow:\s*none/)
    expect(utilityRule).toMatch(/border:\s*0/)
    expect(utilityRule).toMatch(/background:\s*transparent/)
    expect(utilityRule).toMatch(/box-shadow:\s*none/)
    expect(utilitySizeRule).toMatch(/width:\s*3\.4rem/)
    expect(utilitySizeRule).toMatch(/height:\s*3\.4rem/)
    expect(utilityRule).toMatch(/border-radius:\s*50%/)
    expect(hoverRule).toMatch(/background:\s*rgb\(255 249 232 \/ 7%\)/)
    expect(focusRule).toMatch(/background:\s*rgb\(255 249 232 \/ 7%\)/)
    expect(activeRule).toMatch(/background:\s*rgb\(217 121 43 \/ 14%\)/)
    expect(container.querySelector('.control-button--start')).toHaveClass('control-button--start')
  })

  it('keeps disabled ghost navigation out of the generic hover surface', () => {
    renderDisplay()

    expect(screen.getByRole('button', { name: 'Previous level' })).toBeDisabled()
    expect(displayCss).toMatch(/\.control-button:hover:not\(:disabled\)\s*,/)
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
