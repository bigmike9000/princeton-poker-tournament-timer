import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useReducer } from 'react'
import { App } from '../../app/App'
import { TournamentContext } from '../../app/useTournament'
import { createInitialState } from '../../domain/sampleStructure'
import { createPresetRepository } from '../../persistence/presets'
import { tournamentReducer } from '../../state/reducer'
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
    </TournamentContext.Provider>
  )
}

describe('StructureEditor', () => {
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
