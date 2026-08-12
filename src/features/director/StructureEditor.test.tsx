import { fireEvent, render, screen, within } from '@testing-library/react'
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

function StructureStateHarness() {
  const [state, dispatch] = useReducer(tournamentReducer, undefined, createInitialState)
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
  it('renders one shared desktop heading for every structure column', () => {
    const { container } = render(<StructureStateHarness />)
    const heading = container.querySelector('.structure-editor-columns')

    expect(heading).toHaveAttribute('aria-hidden', 'true')
    expect(Array.from(heading?.children ?? [], (column) => column.textContent)).toEqual([
      'Level',
      'Duration',
      'Small',
      'Big',
      'Ante',
      'Type',
      'Note',
      'Actions',
    ])
  })

  it('keeps every poker field editable and applies the complete draft', async () => {
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
    await user.type(within(level).getByRole('textbox', { name: 'Level note' }), 'Opening orbit')
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied structure')).toHaveTextContent(
      '"id":"level-1","kind":"level","durationSeconds":780,"smallBlind":2,"bigBlind":5,"ante":5,"anteType":"traditional","note":"Opening orbit"',
    )
  })

  it('keeps break label and duration editable and applies both values', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)
    const breakRow = screen.getByRole('group', { name: 'Break 1' })

    await user.clear(within(breakRow).getByRole('textbox', { name: 'Break label' }))
    await user.type(within(breakRow).getByRole('textbox', { name: 'Break label' }), 'Dinner')
    await user.clear(within(breakRow).getByRole('spinbutton', { name: 'Duration minutes' }))
    await user.type(within(breakRow).getByRole('spinbutton', { name: 'Duration minutes' }), '20')
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied structure')).toHaveTextContent(
      '"id":"break-1","kind":"break","durationSeconds":1200,"label":"Dinner"',
    )
  })

  it('retains an accessible name for every responsive row control', () => {
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 1' })
    const breakRow = screen.getByRole('group', { name: 'Break 1' })

    expect(within(level).getByRole('spinbutton', { name: 'Duration minutes' })).toBeVisible()
    expect(within(level).getByRole('checkbox', { name: 'Until end' })).toBeVisible()
    expect(within(level).getByRole('spinbutton', { name: 'Small blind' })).toBeVisible()
    expect(within(level).getByRole('spinbutton', { name: 'Big blind' })).toBeVisible()
    expect(within(level).getByRole('spinbutton', { name: 'Ante' })).toBeVisible()
    expect(within(level).getByRole('combobox', { name: 'Ante type' })).toBeVisible()
    expect(within(level).getByRole('textbox', { name: 'Level note' })).toBeVisible()
    expect(within(level).getByRole('button', { name: 'Move up' })).toBeVisible()
    expect(within(level).getByRole('button', { name: 'Move down' })).toBeVisible()
    expect(within(level).getByRole('button', { name: 'Delete' })).toBeVisible()
    expect(within(breakRow).getByRole('textbox', { name: 'Break label' })).toBeVisible()
    expect(within(breakRow).getByRole('spinbutton', { name: 'Duration minutes' })).toBeVisible()
  })

  it('renders responsive field-label hooks for every level and break cell', () => {
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 1' })
    const breakRow = screen.getByRole('group', { name: 'Break 1' })

    expect(Array.from(level.querySelectorAll('.structure-cell-label'), (label) => label.textContent)).toEqual([
      'Duration minutes',
      'Small blind',
      'Big blind',
      'Ante',
      'Ante type',
      'Level note',
      'Actions',
    ])
    expect(Array.from(breakRow.querySelectorAll('.structure-cell-label'), (label) => label.textContent)).toEqual([
      'Duration minutes',
      'Break label',
      'Actions',
    ])
  })

  it('keeps a semantic legend and grid-contained actions without placeholder break fields', () => {
    const state = createInitialState()
    const level = state.structure.find((entry) => entry.kind === 'level')
    const breakEntry = state.structure.find((entry) => entry.kind === 'break')
    if (!level || !breakEntry) throw new Error('Expected level and break fixtures')

    const { rerender } = render(
      <StructureRow entry={level} label="Level 1" index={0} total={2} issues={[]} onChange={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    )
    const levelGroup = screen.getByRole('group', { name: 'Level 1' })
    expect(levelGroup.querySelector('legend')).toHaveTextContent('Poker levelLevel 1')
    expect(levelGroup.querySelector('.structure-row-grid > .structure-actions-cell')).toContainElement(
      within(levelGroup).getByRole('button', { name: 'Delete' }),
    )

    rerender(
      <StructureRow entry={breakEntry} label="Break 1" index={1} total={2} issues={[]} onChange={vi.fn()} onMove={vi.fn()} onDelete={vi.fn()} />,
    )
    const breakGroup = screen.getByRole('group', { name: 'Break 1' })
    expect(breakGroup.querySelector('legend')).toHaveTextContent('BreakBreak 1')
    expect(within(breakGroup).getByRole('textbox', { name: 'Break label' })).toBeEnabled()
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

  it('switches a poker level to Until end and removes timed duration editing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const entry = createInitialState().structure[0]
    if (entry.kind !== 'level') throw new Error('Expected the opening entry to be a poker level')

    const { rerender } = render(
      <StructureRow entry={entry} label="Level 1" index={0} total={1} issues={[]} onChange={onChange} onMove={vi.fn()} onDelete={vi.fn()} />,
    )
    await user.click(screen.getByRole('checkbox', { name: 'Until end' }))
    expect(onChange).toHaveBeenLastCalledWith({ ...entry, durationSeconds: null })

    rerender(
      <StructureRow entry={{ ...entry, durationSeconds: null }} label="Level 1" index={0} total={1} issues={[]} onChange={onChange} onMove={vi.fn()} onDelete={vi.fn()} />,
    )
    expect(screen.getByRole('checkbox', { name: 'Until end' })).toBeChecked()
    expect(screen.queryByLabelText('Duration minutes')).not.toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Until end' }))
    expect(onChange).toHaveBeenLastCalledWith({ ...entry, durationSeconds: 900 })
  })

  it('emits the raw Level note draft and leaves length validation to the field contract', async () => {
    const onChange = vi.fn()
    const entry = createInitialState().structure[0]
    if (entry.kind !== 'level') throw new Error('Expected the opening entry to be a poker level')

    render(
      <StructureRow entry={entry} label="Level 1" index={0} total={1} issues={[]} onChange={onChange} onMove={vi.fn()} onDelete={vi.fn()} />,
    )
    const note = screen.getByRole('textbox', { name: 'Level note' })
    expect(note).toHaveAttribute('maxlength', '80')
    fireEvent.change(note, { target: { value: '  Final table  ' } })

    expect(onChange).toHaveBeenLastCalledWith({ ...entry, note: '  Final table  ' })
  })

  it('removes a cleared note when the draft is applied while preserving the whitespace draft', async () => {
    const user = userEvent.setup()
    render(<StructureStateHarness />)
    const level = screen.getByRole('group', { name: 'Level 6' })
    const note = within(level).getByRole('textbox', { name: 'Level note' })
    await user.clear(note)
    fireEvent.change(note, { target: { value: '   ' } })

    expect(note).toHaveValue('   ')
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByLabelText('Applied level 6 note')).toHaveTextContent('absent')
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

    expect(screen.getByRole('listitem', { name: 'BREAK — 11 MIN' })).toBeVisible()
  })

  it('adds a timed 15-minute level after an untimed final level', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Structure')

    await user.click(screen.getByRole('button', { name: /Add level/ }))
    const levels = screen.getAllByRole('group', { name: /Level/ })
    const addedLevel = levels[levels.length - 1]

    expect(within(addedLevel).getByLabelText('Duration minutes')).toHaveValue(15)
    expect(within(addedLevel).getByRole('checkbox', { name: 'Until end' })).not.toBeChecked()
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
  it('collapses Director navigation by 820px before the medium structure grid can overflow', () => {
    const collapseStart = directorCss.indexOf('@media (max-width: 820px)')
    const mediumStart = directorCss.indexOf('@media (max-width: 1180px)')
    const collapseCss = collapseStart < 0
      ? ''
      : directorCss.slice(collapseStart, directorCss.indexOf('.structure-editor {', collapseStart))

    expect(collapseStart).toBeGreaterThan(-1)
    expect(collapseStart).toBeLessThan(mediumStart)
    expect(cssRule(collapseCss, '.director-layout')).toMatch(/grid-template-columns:\s*1fr/)
    expect(cssRule(collapseCss, '.director-nav')).toMatch(/flex-direction:\s*row/)
    expect(cssRule(collapseCss, '.director-nav')).toMatch(/overflow-x:\s*auto/)
  })

  it('wraps before the desktop grid can overflow the Director content column', () => {
    const mediumStart = directorCss.indexOf('@media (max-width: 1180px)')
    const mobileStart = directorCss.indexOf('@media (max-width: 620px)')
    const mediumCss = directorCss.slice(mediumStart, mobileStart)

    expect(mediumStart).toBeGreaterThan(-1)
    expect(cssRule(mediumCss, '.structure-editor-columns')).toMatch(/display:\s*none/)
    expect(cssRule(mediumCss, '.structure-row-grid')).toMatch(/grid-template-columns:\s*5\.25rem 5\.75rem repeat\(3, minmax\(4\.75rem, 1fr\)\) 8\.7rem/)
    expect(cssRule(mediumCss, '.structure-cell-label')).toMatch(/display:\s*block/)
    expect(cssRule(mediumCss, '.structure-editor-row--level .structure-level-note')).toMatch(/grid-column:\s*4 \/ 6/)
    expect(cssRule(mediumCss, '.structure-editor-row--break .structure-break-label')).toMatch(/grid-column:\s*3 \/ 6/)
    expect(cssRule(mediumCss, '.structure-actions-cell')).toMatch(/grid-column:\s*6/)
    expect(cssRule(mediumCss, '.structure-actions-cell')).toMatch(/grid-row:\s*1 \/ 3/)
  })

  it('keeps actions in the desktop grid and makes the full Until end target 44 pixels', () => {
    expect(cssRule(directorCss, '.row-order-actions')).toMatch(/display:\s*grid/)
    expect(cssRule(directorCss, '.row-order-actions')).not.toMatch(/position:\s*absolute/)
    expect(cssRule(directorCss, '.structure-actions-cell')).toMatch(/grid-column:\s*8/)
    expect(cssRule(directorCss, '.structure-until-end')).toMatch(/min-width:\s*2\.75rem/)
    expect(cssRule(directorCss, '.structure-until-end')).toMatch(/min-height:\s*2\.75rem/)
  })

  it('uses a two-column mobile grid with full-width notes and actions', () => {
    const mobileCss = directorCss.slice(directorCss.indexOf('@media (max-width: 620px)'))
    const fullWidthSelector = `.structure-row-identity,
  .structure-editor-row--level .structure-level-note,
  .structure-actions-cell`

    expect(cssRule(mobileCss, '.structure-row-grid')).toMatch(/grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(cssRule(mobileCss, fullWidthSelector)).toMatch(/grid-column:\s*1 \/ -1/)
    expect(mobileCss).toMatch(/\.structure-editor-row--break \.structure-break-label,\s*\n\s*\.structure-actions-cell\s*\{[^}]*grid-column:\s*auto/s)
  })
})

describe('PresetManager', () => {
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
    structure[0].durationSeconds = 600
    createPresetRepository(localStorage).save('Ten Minute Opener', structure)
    const user = userEvent.setup()

    render(<App />)
    await openTab(user, 'Presets')
    const preset = screen.getByRole('group', { name: 'Preset Ten Minute Opener' })
    await user.click(within(preset).getByRole('button', { name: 'Load' }))

    expect(screen.getByRole('timer')).toHaveTextContent('10:00')
  })

  it('confirms replacing a progressed tournament with a preset', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Next level' }))
    await openTab(user, 'Presets')
    const sample = screen.getByRole('group', { name: 'Preset Princeton Poker Club Standard' })
    await user.click(within(sample).getByRole('button', { name: 'Load' }))

    expect(screen.getByRole('alertdialog', { name: 'Load this preset?' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Confirm preset load' }))
    expect(screen.getAllByText('LEVEL 1').length).toBeGreaterThan(0)
  })
})
