import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useReducer } from 'react'
import { App } from '../../app/App'
import { TournamentContext } from '../../app/useTournament'
import { createInitialState } from '../../domain/sampleStructure'
import { createPresetRepository } from '../../persistence/presets'
import { tournamentReducer } from '../../state/reducer'
import directorCss from '../../styles/director.css?raw'
import { StructureEditor } from './StructureEditor'
import { StructureRow } from './StructureRow'
import { TimeEditor } from './TimeEditor'

async function openTab(user: ReturnType<typeof userEvent.setup>, name: 'Structure' | 'Presets') {
  await user.click(screen.getByRole('button', { name: 'Open Tournament Director' }))
  await user.click(screen.getByRole('button', { name }))
}

function StructureStateHarness({ seededNote = 'Featured table' }: { seededNote?: string } = {}) {
  const [state, dispatch] = useReducer(tournamentReducer, undefined, () => {
    const initial = createInitialState()
    const level = initial.structure.find((entry) => entry.id === 'level-6')
    if (level?.kind === 'level') level.note = seededNote
    return initial
  })
  const level = state.structure.find((entry) => entry.id === 'level-6')
  const note = level?.kind === 'level' && level.note !== undefined
    ? JSON.stringify(level.note)
    : 'absent'

  return (
    <TournamentContext.Provider value={{ state, now: 0, dispatch, persistenceError: null }}>
      <StructureEditor />
      <output aria-label="Applied level 6 note">{note}</output>
      <output aria-label="Applied structure">{JSON.stringify(state.structure)}</output>
    </TournamentContext.Provider>
  )
}

function cssRule(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('StructureEditor', () => {
  it('renders seven explicit headings inside the shared structure table', () => {
    const { container } = render(<StructureStateHarness />)
    const table = container.querySelector('.structure-editor-table')
    const columns = table?.querySelector('.structure-editor-columns')
    const list = table?.querySelector('.structure-editor-list')

    expect(columns).toHaveAttribute('aria-hidden', 'true')
    expect(within(columns as HTMLElement).getAllByText(/.+/).map((node) => node.textContent)).toEqual([
      'Level', 'Minutes', 'SB', 'BB', 'Ante type', 'Ante', 'Actions',
    ])
    expect(columns?.closest('.structure-editor-table')).toBe(table)
    expect(list?.closest('.structure-editor-table')).toBe(table)
  })

  it('marks every structure row with its list-position tone', () => {
    const { container } = render(<StructureStateHarness />)
    const tones = Array.from(
      container.querySelectorAll('.structure-editor-list > .structure-editor-row'),
      (row) => row.getAttribute('data-row-tone'),
    )

    expect(tones).toEqual([
      'odd', 'even', 'odd', 'even', 'odd', 'even', 'odd', 'even', 'odd', 'even',
      'odd', 'even', 'odd', 'even', 'odd', 'even', 'odd', 'even', 'odd', 'even',
    ])
  })

  it('keeps every visible poker field editable and applies the complete draft', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 1' })

    await user.clear(within(level).getByRole('spinbutton', { name: 'Duration minutes' }))
    await user.type(within(level).getByRole('spinbutton', { name: 'Duration minutes' }), '13')
    await user.clear(within(level).getByRole('spinbutton', { name: 'Small blind' }))
    await user.type(within(level).getByRole('spinbutton', { name: 'Small blind' }), '2')
    await user.clear(within(level).getByRole('spinbutton', { name: 'Big blind' }))
    await user.type(within(level).getByRole('spinbutton', { name: 'Big blind' }), '5')
    await user.clear(within(level).getByRole('spinbutton', { name: 'Ante' }))
    await user.type(within(level).getByRole('spinbutton', { name: 'Ante' }), '5')
    await user.selectOptions(within(level).getByRole('combobox', { name: 'Ante type' }), 'traditional')
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied structure')).toHaveTextContent(
      '"id":"level-1","kind":"level","durationSeconds":780,"smallBlind":2,"bigBlind":5,"ante":5,"anteType":"traditional"',
    )
  })

  it('preserves hidden level note and untimed duration data when another draft field is applied', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 1' })

    await user.clear(within(level).getByRole('spinbutton', { name: 'Small blind' }))
    await user.type(within(level).getByRole('spinbutton', { name: 'Small blind' }), '2')
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied level 6 note')).toHaveTextContent('"Featured table"')
    expect(screen.getByLabelText('Applied structure')).toHaveTextContent('"id":"level-17","kind":"level","durationSeconds":null')
  })

  it('allows applying an imported hidden note that is longer than the retired editor limit', async () => {
    const user = userEvent.setup()
    const importedNote = 'x'.repeat(81)
    render(<StructureStateHarness seededNote={importedNote} />)

    expect(screen.getByRole('button', { name: 'Apply structure' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied level 6 note')).toHaveTextContent(JSON.stringify(importedNote))
  })

  it('keeps break label and duration editable and applies both values', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)
    const breakRow = screen.getByRole('group', { name: 'Break 1' })

    await user.clear(within(breakRow).getByRole('textbox', { name: 'Active break message' }))
    await user.type(within(breakRow).getByRole('textbox', { name: 'Active break message' }), 'Dinner')
    await user.clear(within(breakRow).getByRole('spinbutton', { name: 'Duration minutes' }))
    await user.type(within(breakRow).getByRole('spinbutton', { name: 'Duration minutes' }), '20')
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied structure')).toHaveTextContent(
      '"id":"break-1","kind":"break","durationSeconds":1200,"label":"Dinner"',
    )
  })

  it('shows the exact active-screen break message and allows clearing it', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)
    const breakRow = screen.getByRole('group', { name: 'Break 1' })
    const message = within(breakRow).getByRole('textbox', { name: 'Active break message' })

    expect(message).toHaveValue('Count and stack white chips in stacks of 10')
    expect(message).toHaveAttribute('maxlength', '80')
    expect(message).toHaveAttribute('placeholder', 'No message shown')
    await user.clear(message)
    expect(screen.getByRole('button', { name: 'Apply structure' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))
    expect(screen.getByLabelText('Applied structure')).toHaveTextContent(
      '"id":"break-1","kind":"break","durationSeconds":600,"label":""',
    )
  })

  it('retains an accessible name for every visible responsive row control', () => {
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 1' })
    const breakRow = screen.getByRole('group', { name: 'Break 1' })

    expect(within(level).getByRole('spinbutton', { name: 'Duration minutes' })).toBeVisible()
    expect(within(level).getByRole('spinbutton', { name: 'Small blind' })).toBeVisible()
    expect(within(level).getByRole('spinbutton', { name: 'Big blind' })).toBeVisible()
    expect(within(level).getByRole('spinbutton', { name: 'Ante' })).toBeVisible()
    expect(within(level).getByRole('combobox', { name: 'Ante type' })).toBeVisible()
    expect(within(level).getByRole('button', { name: 'Move up' })).toBeVisible()
    expect(within(level).getByRole('button', { name: 'Move down' })).toBeVisible()
    expect(within(level).getByRole('button', { name: 'Delete' })).toBeVisible()
    expect(within(breakRow).getByRole('textbox', { name: 'Active break message' })).toBeVisible()
    expect(within(breakRow).getByRole('spinbutton', { name: 'Duration minutes' })).toBeVisible()
  })

  it('renders separate poker fields without note or until-end controls', () => {
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 1' })
    expect(level.querySelector('.structure-small-blind-field')).toContainElement(within(level).getByRole('spinbutton', { name: 'Small blind' }))
    expect(level.querySelector('.structure-big-blind-field')).toContainElement(within(level).getByRole('spinbutton', { name: 'Big blind' }))
    expect(level.querySelector('.structure-ante-type-field')).toContainElement(within(level).getByRole('combobox', { name: 'Ante type' }))
    expect(level.querySelector('.structure-ante-field')).toContainElement(within(level).getByRole('spinbutton', { name: 'Ante' }))
    expect(within(level).getByText('SB', { exact: true })).toBeVisible()
    expect(within(level).getByText('BB', { exact: true })).toBeVisible()
    expect(within(level).getByText('Ante type', { exact: true })).toBeVisible()
    expect(within(level).getByText('Ante', { exact: true })).toBeVisible()
    expect(within(level).queryByRole('textbox', { name: 'Level note' })).not.toBeInTheDocument()
    expect(within(level).queryByRole('checkbox', { name: 'Until end' })).not.toBeInTheDocument()
    expect(within(level).queryByText('Note', { exact: true })).not.toBeInTheDocument()
    expect(within(level).queryByText('Until end', { exact: true })).not.toBeInTheDocument()
  })

  it('renders breaks as a spanning label with minutes and actions but no poker groups', () => {
    render(<StructureStateHarness />)
    const breakRow = screen.getByRole('group', { name: 'Break 1' })

    expect(breakRow.querySelector('.structure-break-label')).toContainElement(
      within(breakRow).getByRole('textbox', { name: 'Active break message' }),
    )
    expect(within(breakRow).getByRole('spinbutton', { name: 'Duration minutes' })).toBeVisible()
    expect(within(breakRow).getByRole('button', { name: 'Delete' })).toBeVisible()
    expect(breakRow.querySelector('.structure-blinds-group')).not.toBeInTheDocument()
    expect(breakRow.querySelector('.structure-ante-group')).not.toBeInTheDocument()
  })

  it('keeps grouped validation errors beside the precise invalid controls', () => {
    const level = createInitialState().structure.find((entry) => entry.kind === 'level')
    if (!level || level.kind !== 'level') throw new Error('Expected a level fixture')

    render(
      <StructureRow
        entry={level}
        label="Level 1"
        tone="odd"
        index={0}
        total={1}
        issues={[
          { entryId: level.id, field: 'smallBlind', message: 'Small blind error' },
          { entryId: level.id, field: 'ante', message: 'Ante error' },
        ]}
        onChange={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const smallBlindField = screen.getByRole('spinbutton', { name: 'Small blind' }).closest('label')
    const smallBlindInput = screen.getByRole('spinbutton', { name: 'Small blind' })
    const bigBlindInput = screen.getByRole('spinbutton', { name: 'Big blind' })
    const bigBlindField = bigBlindInput.closest('label')
    const anteField = screen.getByRole('spinbutton', { name: 'Ante' }).closest('label')
    const anteInput = screen.getByRole('spinbutton', { name: 'Ante' })
    expect(within(smallBlindField as HTMLElement).getByText('Small blind error')).toBeVisible()
    expect(within(bigBlindField as HTMLElement).queryByText('Small blind error')).not.toBeInTheDocument()
    expect(within(anteField as HTMLElement).getByText('Ante error')).toBeVisible()
    expect(smallBlindInput).toHaveAttribute('aria-invalid', 'true')
    expect(smallBlindInput).toHaveAttribute('aria-describedby', `structure-${level.id}-smallBlind-error`)
    expect(document.getElementById(`structure-${level.id}-smallBlind-error`)).toHaveTextContent('Small blind error')
    expect(anteInput).toHaveAttribute('aria-invalid', 'true')
    expect(anteInput).toHaveAttribute('aria-describedby', `structure-${level.id}-ante-error`)
    expect(document.getElementById(`structure-${level.id}-ante-error`)).toHaveTextContent('Ante error')
    expect(bigBlindInput).not.toHaveAttribute('aria-invalid')
    expect(bigBlindInput).not.toHaveAttribute('aria-describedby')
  })

  it('programmatically binds break validation errors to only their affected controls', () => {
    const breakEntry = createInitialState().structure.find((entry) => entry.kind === 'break')
    if (!breakEntry || breakEntry.kind !== 'break') throw new Error('Expected a break fixture')

    render(
      <StructureRow
        entry={breakEntry}
        label="Break 1"
        tone="even"
        index={0}
        total={1}
        issues={[
          { entryId: breakEntry.id, field: 'durationSeconds', message: 'Duration error' },
          { entryId: breakEntry.id, field: 'label', message: 'Label error' },
        ]}
        onChange={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    )

    const duration = screen.getByRole('spinbutton', { name: 'Duration minutes' })
    const label = screen.getByRole('textbox', { name: 'Active break message' })
    expect(duration).toHaveAttribute('aria-invalid', 'true')
    expect(duration).toHaveAttribute('aria-describedby', `structure-${breakEntry.id}-durationSeconds-error`)
    expect(document.getElementById(`structure-${breakEntry.id}-durationSeconds-error`)).toHaveTextContent('Duration error')
    expect(label).toHaveAttribute('aria-invalid', 'true')
    expect(label).toHaveAttribute('aria-describedby', `structure-${breakEntry.id}-label-error`)
    expect(document.getElementById(`structure-${breakEntry.id}-label-error`)).toHaveTextContent('Label error')
  })

  it('shows the final untimed level as a non-editable duration marker', () => {
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 18' })
    const duration = level.querySelector('.structure-untimed-duration')

    expect(duration).toHaveAccessibleName('Untimed level')
    expect(duration).toHaveTextContent('—')
    expect(within(level).queryByRole('spinbutton', { name: 'Duration minutes' })).not.toBeInTheDocument()
  })

  it('keeps a semantic legend and grid-contained actions without placeholder break fields', () => {
    const state = createInitialState()
    const level = state.structure.find((entry) => entry.kind === 'level')
    const breakEntry = state.structure.find((entry) => entry.kind === 'break')
    if (!level || !breakEntry) throw new Error('Expected level and break fixtures')

    const { rerender } = render(
      <StructureRow entry={level} label="Level 1" tone="odd" index={0} total={2} issues={[]} onChange={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    )
    const levelGroup = screen.getByRole('group', { name: 'Level 1' })
    expect.soft(levelGroup.querySelector('legend')).toHaveTextContent(/^Level 1$/)
    expect(levelGroup.querySelector('.structure-row-grid > .structure-actions-cell')).toContainElement(
      within(levelGroup).getByRole('button', { name: 'Delete' }),
    )

    rerender(
      <StructureRow entry={breakEntry} label="Break 1" tone="even" index={1} total={2} issues={[]} onChange={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    )
    const breakGroup = screen.getByRole('group', { name: 'Break 1' })
    expect.soft(breakGroup.querySelector('legend')).toHaveTextContent(/^Break 1$/)
    expect(breakGroup.querySelector('.structure-row-identity')).toHaveTextContent(/^Break 01$/)
    expect(breakGroup.querySelector('.structure-row-identity')).not.toHaveTextContent('BreakBreak 1')
    expect(within(breakGroup).getByRole('textbox', { name: 'Active break message' })).toBeEnabled()
    expect(within(breakGroup).getByRole('spinbutton', { name: 'Duration minutes' })).toBeEnabled()
    expect(within(breakGroup).queryByRole('spinbutton', { name: 'Small blind' })).not.toBeInTheDocument()
    expect(within(breakGroup).queryByRole('spinbutton', { name: 'Big blind' })).not.toBeInTheDocument()
    expect(within(breakGroup).queryByRole('spinbutton', { name: 'Ante' })).not.toBeInTheDocument()
    expect(within(breakGroup).queryByRole('combobox', { name: 'Ante type' })).not.toBeInTheDocument()
    expect(breakGroup.querySelector('input:disabled, select:disabled')).not.toBeInTheDocument()
  })

  it('restores the live structure when draft changes are cancelled', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)
    const smallBlind = within(screen.getByRole('group', { name: 'Level 1' })).getByRole('spinbutton', { name: 'Small blind' })

    await user.clear(smallBlind)
    await user.type(smallBlind, '99')
    expect(smallBlind).toHaveValue(99)
    expect(screen.getByLabelText('Applied structure')).toHaveTextContent('"smallBlind":1')

    await user.click(screen.getByRole('button', { name: 'Cancel changes' }))

    expect(within(screen.getByRole('group', { name: 'Level 1' })).getByRole('spinbutton', { name: 'Small blind' })).toHaveValue(1)
    expect(screen.getByLabelText('Applied structure')).toHaveTextContent('"smallBlind":1')
  })

  it('shows an explanatory state instead of time inputs for the final untimed level', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.remainingMs = 0

    render(
      <TournamentContext.Provider value={{ state, now: 0, dispatch: vi.fn(), persistenceError: null }}>
        <TimeEditor />
      </TournamentContext.Provider>,
    )

    expect(screen.getByRole('heading', { name: 'Untimed final level' })).toBeVisible()
    expect(screen.getByText('This level runs until the tournament ends; there is no countdown to edit.')).toBeVisible()
    expect(screen.queryByLabelText('Minutes remaining')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Seconds remaining')).not.toBeInTheDocument()
  })

  it('inserts a break, reorders it, and applies the draft atomically', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Structure')

    await user.click(screen.getByRole('button', { name: 'Insert break' }))
    const breakRows = screen.getAllByRole('group', { name: /Break/ })
    const newBreak = breakRows[breakRows.length - 1]
    expect(within(newBreak).getByLabelText('Duration minutes')).toHaveValue(10)
    await user.clear(within(newBreak).getByLabelText('Duration minutes'))
    await user.type(within(newBreak).getByLabelText('Duration minutes'), '11')
    await user.click(within(newBreak).getByRole('button', { name: 'Move up' }))
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByRole('button', { name: 'Break, 11 min' })).toHaveTextContent('BREAK — 11 MIN')
  })

  it('adds a timed 15-minute level before an untimed final level and keeps the draft valid', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Structure')

    await user.click(screen.getByRole('button', { name: /Add level/ }))
    const addedLevel = screen.getByRole('group', { name: 'Level 18' })

    expect(within(addedLevel).getByLabelText('Duration minutes')).toHaveValue(15)
    expect(within(addedLevel).queryByRole('checkbox', { name: 'Until end' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Level 19' }).querySelector('.structure-untimed-duration')).toHaveTextContent('—')
    expect(screen.getByRole('button', { name: 'Apply structure' })).toBeEnabled()
  })

  it('shows field validation and blocks malformed levels', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Structure')
    const firstLevel = screen.getByRole('group', { name: 'Level 1' })

    await user.clear(within(firstLevel).getByLabelText('Small blind'))
    await user.type(within(firstLevel).getByLabelText('Small blind'), '500')
    await user.clear(within(firstLevel).getByLabelText('Big blind'))
    await user.type(within(firstLevel).getByLabelText('Big blind'), '400')

    expect(within(firstLevel).getByText(/cannot exceed big blind/i)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Apply structure' })).toBeDisabled()
  })

  it('confirms deletion of the current entry before applying the draft', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)

    await user.click(within(screen.getByRole('group', { name: 'Level 1' })).getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('alertdialog', { name: 'Delete the current entry?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Confirm entry deletion' }))
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied structure')).not.toHaveTextContent('"id":"level-1"')
  })
})

describe('Structure editor responsive CSS', () => {
  it('keeps the desktop column heading visible above scrolling rows', () => {
    const headingRule = cssRule(directorCss, '.structure-editor-columns')

    expect(headingRule).toMatch(/position:\s*sticky/)
    expect(headingRule).toMatch(/z-index:\s*[1-9]\d*/)
    expect(headingRule).toMatch(/background:/)
  })

  it('renders one spreadsheet surface with flat cells and row dividers', () => {
    const tableRule = cssRule(directorCss, '.structure-editor-table')
    const rowRule = cssRule(directorCss, '.structure-editor-row')
    const inputRule = cssRule(directorCss, `.director-overlay .structure-editor-row input,
.director-overlay .structure-editor-row select`)

    expect(tableRule).toMatch(/border:\s*0/)
    expect(tableRule).toMatch(/background:\s*rgb/)
    expect(tableRule).not.toMatch(/box-shadow:/)
    expect(rowRule).toMatch(/border:\s*0/)
    expect(rowRule).toMatch(/border-bottom:\s*1px solid/)
    expect(rowRule).not.toMatch(/border-radius:/)
    expect(inputRule).toMatch(/border:\s*0/)
    expect(inputRule).toMatch(/border-radius:\s*0/)
    expect(inputRule).toMatch(/background:\s*transparent/)
    expect(inputRule).toMatch(/box-shadow:\s*none/)
  })

  it('shares the exact seven-column desktop template between header and rows', () => {
    const template = /grid-template-columns:\s*5\.25rem 5\.25rem minmax\(5rem, \.75fr\) minmax\(5rem, \.75fr\) minmax\(9rem, 1\.25fr\) minmax\(5rem, \.75fr\) 8\.7rem/

    expect(cssRule(directorCss, '.structure-editor-columns')).toMatch(template)
    expect(cssRule(directorCss, '.structure-row-grid')).toMatch(template)
  })

  it('hides repeated compact field labels below the desktop column headings', () => {
    expect(cssRule(directorCss, '.structure-compact-field > span')).toMatch(/display:\s*none/)
  })

  it('keeps row actions unboxed and operational labels in the interface typeface', () => {
    const actionRule = cssRule(directorCss, '.row-order-actions')

    expect(actionRule).toMatch(/border:\s*0/)
    expect(actionRule).toMatch(/background:\s*transparent/)
    expect(cssRule(directorCss, '.structure-editor-columns')).toMatch(/font-family:\s*var\(--font-interface\)/)
    expect(cssRule(directorCss, '.structure-row-identity')).toMatch(/font-family:\s*var\(--font-interface\)/)
  })

  it('uses tabular numeric typography for structure number inputs', () => {
    const numericRule = cssRule(directorCss, `.director-overlay .structure-editor-row input[type='number']`)

    expect(numericRule).toMatch(/font-family:\s*var\(--font-numeric\)/)
    expect(numericRule).toMatch(/font-variant-numeric:\s*tabular-nums/)
  })

  it('separates break rows with a stronger copper edge and tinted background', () => {
    const breakRule = cssRule(directorCss, '.structure-editor-row--break')

    expect(breakRule).toMatch(/border-left:\s*[2-9]px solid/)
    expect(breakRule).toMatch(/background:/)
  })

  it('collapses Director navigation through the measured 967px overflow boundary', () => {
    const collapseStart = directorCss.indexOf('@media (max-width: 967px)')
    const mediumStart = directorCss.indexOf('@media (max-width: 1180px)')
    const collapseCss = collapseStart < 0
      ? ''
      : directorCss.slice(collapseStart, directorCss.indexOf('.structure-editor {', collapseStart))

    expect(collapseStart).toBeGreaterThan(-1)
    expect(collapseStart).toBeLessThan(mediumStart)
    expect(directorCss).not.toContain('@media (max-width: 960px)')
    expect(cssRule(collapseCss, '.director-layout')).toMatch(/grid-template-columns:\s*1fr/)
    expect(cssRule(collapseCss, '.director-layout')).toMatch(/grid-template-rows:\s*auto minmax\(0, 1fr\)/)
    expect(cssRule(collapseCss, '.director-nav')).toMatch(/flex-direction:\s*row/)
  })

  it('fits all four Director tabs at 390px without horizontal navigation clipping', () => {
    const collapseStart = directorCss.indexOf('@media (max-width: 967px)')
    const collapseCss = collapseStart < 0
      ? ''
      : directorCss.slice(collapseStart, directorCss.indexOf('.structure-editor {', collapseStart))
    const navRule = cssRule(collapseCss, '.director-nav')
    const tabRule = cssRule(collapseCss, '.director-tab')

    expect(navRule).toMatch(/overflow-x:\s*hidden/)
    expect(tabRule).toMatch(/flex:\s*1 1 0/)
    expect(tabRule).toMatch(/min-width:\s*0/)
  })

  it('reduces the seven-column grid before it can overflow the Director content column', () => {
    const mediumStart = directorCss.indexOf('@media (max-width: 1180px)')
    const mobileStart = directorCss.indexOf('@media (max-width: 1000px)')
    const mediumCss = directorCss.slice(mediumStart, mobileStart)

    expect(mediumStart).toBeGreaterThan(-1)
    expect(cssRule(mediumCss, '.structure-editor-columns')).toMatch(/grid-template-columns:\s*4\.75rem 5\.25rem minmax\(4\.5rem, 1fr\) minmax\(4\.5rem, 1fr\) minmax\(8rem, 1\.25fr\) minmax\(4\.5rem, 1fr\) 8\.7rem/)
    expect(cssRule(mediumCss, '.structure-row-grid')).toMatch(/grid-template-columns:\s*4\.75rem 5\.25rem minmax\(4\.5rem, 1fr\) minmax\(4\.5rem, 1fr\) minmax\(8rem, 1\.25fr\) minmax\(4\.5rem, 1fr\) 8\.7rem/)
    expect(cssRule(mediumCss, '.structure-cell-label')).toBe('')
    expect(cssRule(mediumCss, '.structure-compact-field > span')).toBe('')
    expect(cssRule(mediumCss, '.structure-editor-row--break .structure-break-label')).toMatch(/grid-column:\s*3 \/ 7/)
    expect(cssRule(mediumCss, '.structure-actions-cell')).toMatch(/grid-column:\s*7/)
  })

  it('keeps actions in the seventh desktop grid column and preserves 44-pixel targets', () => {
    const inputRule = cssRule(directorCss, `.director-overlay .structure-editor-row input,
.director-overlay .structure-editor-row select`)

    expect(cssRule(directorCss, '.row-order-actions')).toMatch(/display:\s*grid/)
    expect(cssRule(directorCss, '.row-order-actions')).toMatch(/grid-template-columns:\s*repeat\(3, 2\.75rem\)/)
    expect(cssRule(directorCss, '.row-order-actions')).not.toMatch(/position:\s*absolute/)
    expect(cssRule(directorCss, '.row-order-actions button')).toMatch(/width:\s*2\.75rem/)
    expect(cssRule(directorCss, '.row-order-actions button')).toMatch(/height:\s*2\.75rem/)
    expect(cssRule(directorCss, '.row-order-actions button')).not.toMatch(/position:\s*absolute/)
    expect(inputRule).toMatch(/min-height:\s*2\.75rem/)
    expect(cssRule(directorCss, '.structure-actions-cell')).toMatch(/grid-column:\s*7/)
    expect(cssRule(directorCss, '.structure-untimed-duration')).toMatch(/min-height:\s*2\.75rem/)
    expect(cssRule(directorCss, '.structure-untimed-duration')).toMatch(/cursor:\s*default/)
    expect(cssRule(directorCss, '.structure-editor-row--break .structure-break-label')).toMatch(/grid-column:\s*3 \/ 7/)
  })

  it('switches only structure rows to a contained two-column layout before the 700px clipping band', () => {
    const containedStart = directorCss.indexOf('@media (max-width: 760px)')
    const globalMobileStart = directorCss.indexOf('@media (max-width: 620px)')
    const containedCss = containedStart < 0 ? '' : directorCss.slice(containedStart, globalMobileStart)
    const fullWidthSelector = `.structure-row-identity,
  .structure-actions-cell`

    expect(containedStart).toBeGreaterThan(directorCss.indexOf('@media (max-width: 1000px)'))
    expect(containedStart).toBeLessThan(globalMobileStart)
    expect(cssRule(containedCss, '.structure-editor-columns')).toMatch(/display:\s*none/)
    expect(cssRule(containedCss, '.structure-cell-label')).toMatch(/display:\s*block/)
    expect(cssRule(containedCss, '.structure-compact-field > span')).toMatch(/display:\s*block/)
    expect(cssRule(containedCss, '.structure-row-grid')).toMatch(/grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(cssRule(containedCss, fullWidthSelector)).toMatch(/grid-column:\s*1 \/ -1/)
    expect(cssRule(containedCss, '.structure-editor-row--break .structure-break-label')).toMatch(/grid-column:\s*1 \/ -1/)
    expect(cssRule(containedCss, '.alert-options, .shortcut-grid')).toBe('')
  })

  it('keeps unrelated mobile layouts at the 620px global breakpoint', () => {
    const globalMobileCss = directorCss.slice(directorCss.indexOf('@media (max-width: 620px)'))

    expect(cssRule(globalMobileCss, '.structure-editor-heading')).toMatch(/display:\s*block/)
    expect(cssRule(globalMobileCss, '.alert-options, .shortcut-grid')).toMatch(/grid-template-columns:\s*1fr/)
    expect(cssRule(globalMobileCss, '.preset-actions button')).toMatch(/min-height:\s*2\.75rem/)
  })
})

describe('PresetManager', () => {
  it('identifies and protects the built-in preset row', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Presets')

    const builtIn = screen.getByRole('group', { name: 'Preset Princeton Poker Club Standard' })
    expect(within(builtIn).getByText('Built-in')).toBeVisible()
    expect(within(builtIn).getByLabelText('Preset name')).toHaveAttribute('readonly')
    expect(within(builtIn).getByRole('button', { name: 'Load' })).toBeEnabled()
    expect(within(builtIn).getByRole('button', { name: 'Duplicate' })).toBeEnabled()
    expect(within(builtIn).queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument()
    expect(within(builtIn).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('keeps the tournament operational when preset storage is unavailable', async () => {
    const originalSetItem = localStorage.setItem
    localStorage.setItem = () => { throw new Error('quota unavailable') }
    const user = userEvent.setup()
    try {
      render(<App />)
      await openTab(user, 'Presets')

      expect(screen.getByText(/presets are unavailable/i)).toHaveAttribute('role', 'alert')
      expect(screen.getByRole('timer')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Save current structure' })).toBeDisabled()
    } finally {
      localStorage.setItem = originalSetItem
    }
  })

  it('saves, duplicates, renames, and deletes a structure preset', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Presets')

    await user.type(screen.getByLabelText('New preset name'), 'Turbo')
    await user.click(screen.getByRole('button', { name: 'Save current structure' }))
    const turbo = screen.getByRole('group', { name: 'Preset Turbo' })
    await user.click(within(turbo).getByRole('button', { name: 'Duplicate' }))

    const copy = screen.getByRole('group', { name: 'Preset Turbo Copy' })
    await user.clear(within(copy).getByLabelText('Preset name'))
    await user.type(within(copy).getByLabelText('Preset name'), 'Championship')
    await user.click(within(copy).getByRole('button', { name: 'Rename' }))

    const renamed = screen.getByRole('group', { name: 'Preset Championship' })
    await user.click(within(renamed).getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Confirm preset deletion' }))
    expect(screen.queryByRole('group', { name: 'Preset Championship' })).not.toBeInTheDocument()
  })

  it('loads a preset using its own opening-entry duration', async () => {
    const structure = createInitialState().structure
    const opener = structure[0]
    if (opener.kind !== 'level') throw new Error('Expected opening poker level')
    opener.durationSeconds = 600
    opener.smallBlind = 3
    opener.bigBlind = 6
    createPresetRepository(localStorage).save('Ten Minute Opener', structure)
    const user = userEvent.setup()

    render(<App />)
    await openTab(user, 'Presets')
    const preset = screen.getByRole('group', { name: 'Preset Ten Minute Opener' })
    await user.click(within(preset).getByRole('button', { name: 'Load' }))

    expect(screen.getByRole('timer')).toHaveTextContent('10:00')
    await user.click(screen.getByRole('button', { name: 'Structure' }))
    const loadedOpener = screen.getByRole('group', { name: 'Level 1' })
    expect(within(loadedOpener).getByRole('spinbutton', { name: 'Small blind' })).toHaveValue(3)
    expect(within(loadedOpener).getByRole('spinbutton', { name: 'Big blind' })).toHaveValue(6)
  })

  it('confirms a progressed preset load while retaining the selected structure and resetting progress', async () => {
    const structure = createInitialState().structure
    const opener = structure[0]
    if (opener.kind !== 'level') throw new Error('Expected opening poker level')
    opener.durationSeconds = 600
    opener.smallBlind = 3
    opener.bigBlind = 6
    createPresetRepository(localStorage).save('Ten Minute Opener', structure)
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Next level' }))
    await user.click(screen.getByRole('button', { name: 'Eliminate player' }))
    await openTab(user, 'Presets')
    const preset = screen.getByRole('group', { name: 'Preset Ten Minute Opener' })
    await user.click(within(preset).getByRole('button', { name: 'Load' }))

    expect(screen.getByRole('alertdialog', { name: 'Load this preset?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Confirm preset load' }))
    expect(screen.getAllByText('LEVEL 1').length).toBeGreaterThan(0)
    expect(screen.getByRole('timer')).toHaveTextContent('10:00')
    expect(screen.getAllByText('80 / 80').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Structure' }))
    const loadedOpener = screen.getByRole('group', { name: 'Level 1' })
    expect(within(loadedOpener).getByRole('spinbutton', { name: 'Small blind' })).toHaveValue(3)
    expect(within(loadedOpener).getByRole('spinbutton', { name: 'Big blind' })).toHaveValue(6)
  })
})
