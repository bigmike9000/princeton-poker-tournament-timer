import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../app/App'
import { TournamentProvider } from '../../app/TournamentProvider'
import { createInitialState } from '../../domain/sampleStructure'
import { saveSnapshot } from '../../persistence/snapshot'
import displayCss from '../../styles/display.css?raw'
import { InfoOverlay } from './InfoOverlay'

const updateRegistration = vi.hoisted(() => ({
  announce: undefined as (() => void) | undefined,
}))

vi.mock('virtual:pwa-register', () => ({
  registerSW: (options: { onNeedRefresh?: () => void }) => {
    updateRegistration.announce = options.onNeedRefresh
    return async () => undefined
  },
}))

const originalScrollIntoView = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  'scrollIntoView',
)

function openInfo() {
  const trigger = screen.getByRole('button', { name: 'Open tournament information' })
  fireEvent.click(trigger)
  return {
    dialog: screen.getByRole('dialog', { name: 'Tournament Info' }),
    trigger,
  }
}

function cssRule(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

function fluidFontFloor(selector: string): number {
  const declaration = cssRule(displayCss, selector).match(/font-size:\s*([^;]+)/)?.[1] ?? ''
  expect(declaration).toMatch(/^clamp\(/)
  const floor = declaration.match(/clamp\(\s*([\d.]+)rem/)?.[1]
  expect(floor).toBeDefined()
  return Number(floor)
}

describe('InfoOverlay', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    updateRegistration.announce = undefined
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

  it('renders the Info header as a shared semantic lockup without the tournament name', () => {
    const state = createInitialState()
    state.configuration.organizationName = 'Princeton Poker Club'
    state.configuration.tournamentName = 'Test 1'
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const lockup = dialog.querySelector('.club-brand-lockup')

    expect(lockup).not.toBeNull()
    expect(lockup?.firstElementChild).toHaveAttribute('alt', 'Princeton Poker Club logo')
    expect(within(lockup as HTMLElement).getByText('Princeton Poker Club')).toHaveClass('club-brand-organization')
    expect(within(lockup as HTMLElement).getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(within(lockup as HTMLElement).getByRole('heading', { level: 1 })).toHaveTextContent('Tournament Info')
    expect(within(lockup as HTMLElement).queryByText('Test 1')).not.toBeInTheDocument()
  })

  it('keeps essential projector information fluid and above readable desktop floors', () => {
    expect(fluidFontFloor('.info-entry-marker')).toBeGreaterThanOrEqual(0.75)
    expect(fluidFontFloor('.info-entry-ante,\n.info-entry-duration')).toBeGreaterThanOrEqual(0.75)
    expect(fluidFontFloor('.info-break-subtitle')).toBeGreaterThanOrEqual(0.75)
    expect(fluidFontFloor('.info-current-marker')).toBeGreaterThanOrEqual(0.625)
    expect(fluidFontFloor('.info-card ul')).toBeGreaterThanOrEqual(0.82)
  })

  it('removes the inert application background from document flow while Info is open', () => {
    const inertBackground = cssRule(displayCss, '.app-background[inert]')

    expect(inertBackground).toMatch(/position:\s*fixed/)
    expect(inertBackground).toMatch(/inset:\s*0/)
    expect(inertBackground).toMatch(/overflow:\s*hidden/)
  })

  it('keeps required narrow labels wrapping without ellipsis or nowrap clipping', () => {
    const totalsRule = cssRule(displayCss, '.info-totals dt')
    const breakSubtitleRule = cssRule(displayCss, '.info-break-subtitle')
    const informationItemRule = cssRule(displayCss, '.info-card li')

    for (const rule of [totalsRule, breakSubtitleRule]) {
      expect(rule).not.toMatch(/text-overflow:\s*ellipsis/)
      expect(rule).not.toMatch(/white-space:\s*nowrap/)
      expect(rule).not.toMatch(/overflow:\s*hidden/)
      expect(rule).toMatch(/white-space:\s*normal/)
      expect(rule).toMatch(/overflow-wrap:\s*anywhere/)
    }
    expect(informationItemRule).toMatch(/overflow-wrap:\s*anywhere/)
  })

  it('raises essential narrow structure metadata while preserving responsive wrapping', () => {
    const narrowStart = displayCss.lastIndexOf('@media (max-width: 640px)')
    const narrowCss = displayCss.slice(narrowStart)
    const metadataRule = cssRule(narrowCss, `.info-entry-marker,
  .info-entry-ante,
  .info-entry-duration`)
    const breakRule = cssRule(narrowCss, `.info-structure-entry--break strong,
  .info-break-subtitle`)
    const currentRule = cssRule(narrowCss, '.info-current-marker')
    const totalRule = cssRule(narrowCss, '.info-totals dt')

    expect(metadataRule).toMatch(/font-size:\s*\.65rem/)
    expect(breakRule).toMatch(/font-size:\s*\.65rem/)
    expect(currentRule).toMatch(/font-size:\s*\.6rem/)
    expect(totalRule).toMatch(/font-size:\s*\.65rem/)
  })

  it('uses a non-scrolling safe Overview and a scoped scrolling legacy fallback', () => {
    const safeRule = cssRule(displayCss, '.info-page--projector-safe')
    const legacyRule = cssRule(displayCss, '.info-page--legacy-oversize')
    const legacyCardRule = cssRule(displayCss, '.info-page--legacy-oversize .info-card')

    expect(safeRule).toMatch(/overflow:\s*hidden/)
    expect(legacyRule).toMatch(/overflow-y:\s*auto/)
    expect(legacyRule).toMatch(/overflow-x:\s*hidden/)
    expect(legacyCardRule).toMatch(/overflow:\s*visible/)
  })

  it('gives the compact prize list winning base and narrow selectors', () => {
    const prizeListRule = cssRule(displayCss, '.info-card .info-prize-list')
    const narrowStart = displayCss.lastIndexOf('@media (max-width: 640px)')
    const narrowPrizeListRule = cssRule(
      displayCss.slice(narrowStart),
      '.info-card .info-prize-list',
    )

    expect(prizeListRule).toMatch(/gap:\s*0/)
    expect(prizeListRule).toMatch(/margin:\s*\.42rem 0 0/)
    expect(prizeListRule).toMatch(/padding:\s*0/)
    expect(narrowPrizeListRule).toMatch(/margin:\s*\.2rem 0 0/)
  })

  it('opens on Overview, switches pages manually, and resets to Overview after closing', async () => {
    const user = userEvent.setup()

    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)

    expect(overlay.getByRole('img', { name: 'Princeton Poker Club logo' })).toBeVisible()
    expect(overlay.getByRole('heading', { name: 'Tournament Info' })).toBeVisible()
    expect(overlay.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(overlay.getByText('Page 1 of 2')).toBeVisible()
    expect(overlay.getByRole('heading', { name: 'Chip denominations' })).toBeVisible()
    expect(overlay.getByRole('tabpanel')).toHaveClass('info-page--projector-safe')
    expect(overlay.queryByText('Legacy information exceeds projector layout')).not.toBeInTheDocument()
    expect(overlay.queryByRole('list', { name: 'Tournament blind structure' })).not.toBeInTheDocument()
    expect(overlay.getByText('Keep chips visible and countable.')).toBeVisible()
    expect(overlay.getAllByRole('listitem', { name: /place prize/i })).toHaveLength(8)
    expect(overlay.getByRole('listitem', { name: '1 place prize, 300' })).toBeVisible()
    expect(overlay.getByRole('listitem', { name: '8 place prize, 50' })).toBeVisible()
    expect(overlay.queryByRole('heading', { name: /rules/i })).not.toBeInTheDocument()
    expect(overlay.queryByText('House notes')).not.toBeInTheDocument()
    expect(overlay.queryByText('Big-blind ante begins at 10/20.')).not.toBeInTheDocument()
    expect(overlay.queryByRole('link', { name: '2024 Poker TDA rules' })).not.toBeInTheDocument()

    await user.click(overlay.getByRole('tab', { name: 'Blind structure' }))
    expect(overlay.getByRole('tab', { name: 'Blind structure' })).toHaveAttribute('aria-selected', 'true')
    expect(overlay.getByText('Page 2 of 2')).toBeVisible()
    expect(overlay.getByRole('list', { name: 'Tournament blind structure' })).toBeVisible()
    expect(overlay.queryByRole('heading', { name: 'Chip denominations' })).not.toBeInTheDocument()

    await user.click(overlay.getByRole('button', { name: 'Close tournament information' }))
    const reopened = openInfo()
    expect(within(reopened.dialog).getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(reopened.dialog).getByText('Page 1 of 2')).toBeVisible()
  })

  it('ignores hidden over-budget house notes when choosing the public projector layout', () => {
    const state = createInitialState()
    state.information = {
      chipLines: ['Tournament chips'],
      prizeLines: ['1: 300'],
      houseNotes: Array.from({ length: 5 }, (_, index) => `Hidden house note ${index + 1}`),
    }
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)
    const overview = overlay.getByRole('tabpanel')

    expect(overview).toHaveClass('info-page--projector-safe')
    expect(overview).not.toHaveClass('info-page--legacy-oversize')
    expect(overlay.queryByText('Legacy information exceeds projector layout')).not.toBeInTheDocument()
    expect(overlay.queryByText('Hidden house note 1')).not.toBeInTheDocument()
  })

  it('keeps the fixed projector layout when only hidden chip lines exceed the raw editor budget', () => {
    const state = createInitialState()
    state.configuration.startingStack = 50_000
    state.information = {
      chipLines: [
        `Starting stack: ${'9'.repeat(140)}`,
        '10 × 1-value chips',
        '8 × 5-value chips',
        '6 × 25-value chips',
        'Starting stack: 200 chips',
        '10 × 1-value chips',
        '20 × 100-value chips',
      ],
      prizeLines: ['1: 300'],
      houseNotes: ['Director-only note'],
    }
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)
    const overview = overlay.getByRole('tabpanel')
    const chips = overlay.getByRole('heading', { name: 'Chip denominations' }).closest('section')

    expect(overview).toHaveClass('info-page--projector-safe')
    expect(overview).not.toHaveClass('info-page--legacy-oversize')
    expect(overlay.queryByText('Legacy information exceeds projector layout')).not.toBeInTheDocument()
    expect(chips).not.toBeNull()
    expect(within(chips as HTMLElement).getByRole('group', { name: '10 white 1-value chips' })).toBeVisible()
    expect(within(chips as HTMLElement).getByText('20 × 100-value chips')).toBeVisible()
    expect(within(chips as HTMLElement).getByText('50,000')).toBeVisible()
    expect(within(chips as HTMLElement).queryByText(/^Starting stack:/)).not.toBeInTheDocument()
    expect(within(chips as HTMLElement).queryByText('10 × 1-value chips')).not.toBeInTheDocument()
  })

  it('warns about oversize public chips and keeps every legacy chip line reachable', () => {
    const state = createInitialState()
    state.information = {
      chipLines: Array.from({ length: 24 }, (_, index) => `Legacy chip line ${String(index + 1).padStart(2, '0')} ${'x'.repeat(120)}`),
      prizeLines: ['1: 300'],
      houseNotes: ['Hidden legacy house note'],
    }
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)
    const overview = overlay.getByRole('tabpanel')

    expect(overlay.getByText('Legacy information exceeds projector layout')).toBeVisible()
    expect(overview).toHaveClass('info-page--legacy-oversize')
    expect(overview).not.toHaveClass('info-page--projector-safe')
    expect(overlay.getByText(/^Legacy chip line 01 /)).toBeVisible()
    expect(overlay.getByText(/^Legacy chip line 24 /)).toBeVisible()
    expect(overlay.getByRole('listitem', { name: '1 place prize, 300' })).toBeVisible()
    expect(overlay.queryByText('Hidden legacy house note')).not.toBeInTheDocument()
  })

  it('warns about oversize public prizes and keeps the legacy prize reachable', () => {
    const state = createInitialState()
    const legacyPrize = `Legacy prize ${'p'.repeat(120)}`
    state.information = {
      chipLines: ['Tournament chips'],
      prizeLines: [legacyPrize],
      houseNotes: ['Hidden house note'],
    }
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)
    const overview = overlay.getByRole('tabpanel')

    expect(overlay.getByText('Legacy information exceeds projector layout')).toBeVisible()
    expect(overview).toHaveClass('info-page--legacy-oversize')
    expect(overview).not.toHaveClass('info-page--projector-safe')
    expect(overlay.getByRole('listitem', { name: legacyPrize })).toBeVisible()
  })

  it('aligns colon-delimited prizes and lets custom prize copy span the row', () => {
    const state = createInitialState()
    state.information = {
      chipLines: [...state.information!.chipLines],
      prizeLines: ['Winner takes the trophy', 'Runner-up: Medal'],
      houseNotes: [...state.information!.houseNotes],
    }
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)
    const prizeList = overlay.getByRole('list', { name: 'Prize structure' })

    const customPrize = within(prizeList).getByRole('listitem', { name: 'Winner takes the trophy' })
    expect(customPrize.firstElementChild).toHaveClass('info-prize-line--custom')
    expect(within(prizeList).getByRole('listitem', { name: 'Runner-up place prize, Medal' }))
      .toHaveTextContent('Runner-upMedal')
    expect(cssRule(displayCss, '.info-prize-line--custom')).toMatch(/grid-column:\s*1\s*\/\s*-1/)
  })

  it('shows canonical chip cards and live tournament totals', () => {
    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)

    const one = overlay.getByRole('group', { name: '10 white 1-value chips' })
    expect(within(one).getByText('1')).toBeVisible()
    expect(within(one).getByText('White')).toBeVisible()
    expect(within(one).getByText('10 chips')).toBeVisible()

    const five = overlay.getByRole('group', { name: '8 red 5-value chips' })
    expect(within(five).getByText('5')).toBeVisible()
    expect(within(five).getByText('Red')).toBeVisible()
    expect(within(five).getByText('8 chips')).toBeVisible()

    const twentyFive = overlay.getByRole('group', { name: '6 green 25-value chips' })
    expect(within(twentyFive).getByText('25')).toBeVisible()
    expect(within(twentyFive).getByText('Green')).toBeVisible()
    expect(within(twentyFive).getByText('6 chips')).toBeVisible()

    const totals = overlay.getByText('Starting stack').closest('dl')
    expect(totals).not.toBeNull()
    expect(within(totals as HTMLElement).getByText('Starting stack')).toBeVisible()
    expect(within(totals as HTMLElement).getByText('200')).toBeVisible()
    expect(within(totals as HTMLElement).getByText('Players')).toBeVisible()
    expect(within(totals as HTMLElement).getByText('80')).toBeVisible()
    expect(within(totals as HTMLElement).getByText('Chips in play')).toBeVisible()
    expect(within(totals as HTMLElement).getByText('16,000')).toBeVisible()
  })

  it('moves between tabs with arrow keys and exposes only the selected tab in the tab order', () => {
    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)
    const overview = overlay.getByRole('tab', { name: 'Overview' })
    const structure = overlay.getByRole('tab', { name: 'Blind structure' })

    expect(overview).toHaveAttribute('tabindex', '0')
    expect(structure).toHaveAttribute('tabindex', '-1')
    overview.focus()
    fireEvent.keyDown(overview, { key: 'ArrowRight' })

    expect(structure).toHaveFocus()
    expect(structure).toHaveAttribute('aria-selected', 'true')
    expect(structure).toHaveAttribute('tabindex', '0')
    expect(overview).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(structure, { key: 'ArrowLeft' })
    expect(overview).toHaveFocus()
    expect(overview).toHaveAttribute('aria-selected', 'true')
  })

  it('filters canonical allocations and every stale stack line before supplemental chip copy', () => {
    const state = createInitialState()
    state.configuration.startingStack = 50_000
    state.information = {
      chipLines: [
        '10 × 1-value chips',
        '8 × 5-value chips',
        '6 × 25-value chips',
        '20 × 100-value chips',
        'Starting stack: 200 chips',
        '8 × 5,000-value chips',
        '18 × 5-value chips for alternates',
        '110 × 1-value chips in reserve',
        'Starting stack: 999 chips',
      ],
      prizeLines: [...state.information!.prizeLines],
      houseNotes: [...state.information!.houseNotes],
    }
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const chips = within(dialog).getByRole('heading', { name: 'Chip denominations' }).closest('section')

    expect(chips).not.toBeNull()
    expect(within(chips as HTMLElement).getByText('20 × 100-value chips')).toBeVisible()
    expect(within(chips as HTMLElement).getByText('8 × 5,000-value chips')).toBeVisible()
    expect(within(chips as HTMLElement).getByText('18 × 5-value chips for alternates')).toBeVisible()
    expect(within(chips as HTMLElement).getByText('110 × 1-value chips in reserve')).toBeVisible()
    expect(within(chips as HTMLElement).queryByText('10 × 1-value chips')).not.toBeInTheDocument()
    expect(within(chips as HTMLElement).queryByText('8 × 5-value chips')).not.toBeInTheDocument()
    expect(within(chips as HTMLElement).queryByText('6 × 25-value chips')).not.toBeInTheDocument()
    expect(within(chips as HTMLElement).queryByText('Starting stack: 200 chips')).not.toBeInTheDocument()
    expect(within(chips as HTMLElement).queryByText('Starting stack: 999 chips')).not.toBeInTheDocument()
    expect(within(dialog).getByText('Starting stack')).toBeVisible()
    expect(within(dialog).getByText('50,000')).toBeVisible()
  })

  it('shows all structure entries in two ordered columns with concise shared break copy', async () => {
    const user = userEvent.setup()
    const state = createInitialState()
    const notedLevel = state.structure.find((entry) => entry.id === 'level-13')
    if (notedLevel?.kind !== 'level') throw new Error('Missing test level')
    notedLevel.note = 'Director-only final table setup'
    saveSnapshot(localStorage, state, Date.now())

    render(<App />)
    const { dialog } = openInfo()
    const overlay = within(dialog)
    scrollIntoView.mockClear()
    await user.click(overlay.getByRole('tab', { name: 'Blind structure' }))

    const structure = overlay.getByRole('list', { name: 'Tournament blind structure' })
    const entries = within(structure).getAllByRole('listitem')
    expect(entries).toHaveLength(19)
    entries.slice(0, 10).forEach((entry, index) => {
      expect(entry).toHaveAttribute('data-column', '1')
      expect(entry).toHaveAttribute('data-sequence', String(index + 1))
    })
    entries.slice(10).forEach((entry, index) => {
      expect(entry).toHaveAttribute('data-column', '2')
      expect(entry).toHaveAttribute('data-sequence', String(index + 11))
    })

    expect(entries[0]).toHaveAttribute('aria-current', 'step')
    expect(entries[0]).toHaveAttribute('data-state', 'current')
    expect(entries[0]).toHaveTextContent('CURRENT')
    expect(entries[0]).toHaveTextContent('Level 1')
    expect(entries[0]).toHaveTextContent('1 / 2')
    expect(entries[0]).toHaveTextContent('NO ANTE')
    expect(entries[0]).toHaveTextContent('12 min')

    const firstBreak = entries[5]
    expect(firstBreak).toHaveAccessibleName('Break, 10 min, Chip up to 5s')
    expect(within(firstBreak).getAllByText(/break/i)).toHaveLength(1)
    expect(within(firstBreak).getByText('BREAK · 10 MIN')).toBeVisible()
    expect(within(firstBreak).getByText('Chip up to 5s')).toBeVisible()

    const secondBreak = entries[11]
    expect(secondBreak).toHaveAccessibleName('Break, 10 min, Chip up to 25s and 100s')
    expect(within(secondBreak).getAllByText(/break/i)).toHaveLength(1)
    expect(within(secondBreak).getByText('BREAK · 10 MIN')).toBeVisible()
    expect(within(secondBreak).getByText('Chip up to 25s and 100s')).toBeVisible()

    expect(entries[18]).toHaveTextContent('Level 17')
    expect(entries[18]).toHaveTextContent('500 / 1,000')
    expect(entries[18]).toHaveTextContent('BBA 1,000')
    expect(entries[18]).toHaveTextContent('Until end')
    expect(structure).not.toHaveTextContent('Director-only final table setup')
    expect(entries[14]).not.toHaveAccessibleName(/Director-only final table setup/)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('keeps a newly announced application-update control inside the inert background', () => {
    render(<App />)
    openInfo()

    act(() => updateRegistration.announce?.())
    const updateControl = screen.getByRole('button', { name: 'Review application update' })
    const background = updateControl.closest('.app-background')

    expect(background).not.toBeNull()
    expect(background).toHaveAttribute('inert')
    expect(background).toContainElement(screen.getByRole('button', { name: 'Open tournament information' }))
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
      const dialog = screen.getByRole('dialog', { name: 'Tournament Info' })
      const close = within(dialog).getByRole('button', { name: 'Close tournament information' })
      const structureTab = within(dialog).getByRole('tab', { name: 'Blind structure' })

      expect(document.querySelector('.app-background')).toHaveAttribute('inert')
      expect(close).toHaveFocus()
      await user.click(structureTab)
      close.focus()
      fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
      expect(structureTab).toHaveFocus()
      fireEvent.keyDown(structureTab, { key: 'Tab' })
      expect(close).toHaveFocus()
      fireEvent.keyDown(close, { key: 'Escape' })

      expect(screen.queryByRole('dialog', { name: 'Tournament Info' })).not.toBeInTheDocument()
      expect(document.querySelector('.app-background')).not.toHaveAttribute('inert')
      expect(trigger).toHaveFocus()
    } finally {
      focus.mockRestore()
    }
  })

  it('restores the actual Info button after programmatic activation from elsewhere', () => {
    render(<App />)
    const infoTrigger = screen.getByRole('button', { name: 'Open tournament information' })
    const otherControl = screen.getByRole('button', { name: 'Open Tournament Director' })
    otherControl.focus()

    act(() => infoTrigger.click())
    expect(screen.getByRole('button', { name: 'Close tournament information' })).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Close tournament information' }))

    expect(infoTrigger).toHaveFocus()
  })

  it('closes from the backdrop but not from the information panel', () => {
    render(<App />)
    const { dialog } = openInfo()
    const panel = dialog.querySelector('.info-panel')
    expect(panel).not.toBeNull()

    fireEvent.click(panel as HTMLElement)
    expect(screen.getByRole('dialog', { name: 'Tournament Info' })).toBeVisible()
    fireEvent.click(dialog)
    expect(screen.queryByRole('dialog', { name: 'Tournament Info' })).not.toBeInTheDocument()
  })

  it('blocks clock shortcuts and prevents Info and Director from coexisting', () => {
    render(<App />)
    const infoTrigger = screen.getByRole('button', { name: 'Open tournament information' })
    const directorTrigger = screen.getByRole('button', { name: 'Open Tournament Director' })

    fireEvent.click(infoTrigger)
    const infoDialog = screen.getByRole('dialog', { name: 'Tournament Info' })
    fireEvent.click(within(infoDialog).getByRole('tab', { name: 'Blind structure' }))
    const structure = within(infoDialog).getByRole('list', { name: 'Tournament blind structure' })
    const firstEntry = within(structure).getAllByRole('listitem')[0]
    const structureTab = within(infoDialog).getByRole('tab', { name: 'Blind structure' })
    fireEvent.keyDown(structureTab, { key: 'ArrowRight' })
    fireEvent.keyDown(structureTab, { key: ' ' })
    fireEvent.click(directorTrigger)

    expect(firstEntry).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'Start tournament' })).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Tournament Director' })).not.toBeInTheDocument()
    fireEvent.click(within(infoDialog).getByRole('button', { name: 'Close tournament information' }))

    fireEvent.click(directorTrigger)
    fireEvent.click(infoTrigger)
    expect(screen.getByRole('dialog', { name: 'Tournament Director' })).toBeVisible()
    expect(screen.queryByRole('dialog', { name: 'Tournament Info' })).not.toBeInTheDocument()
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
