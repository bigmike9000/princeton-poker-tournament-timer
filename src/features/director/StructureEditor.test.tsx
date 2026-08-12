import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from '../../app/App'

async function openTab(user: ReturnType<typeof userEvent.setup>, name: 'Structure' | 'Presets') {
  await user.click(screen.getByRole('button', { name: 'Open Tournament Director' }))
  await user.click(screen.getByRole('button', { name }))
}

describe('StructureEditor', () => {
  it('inserts a break, reorders it, and applies the draft atomically', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Structure')

    await user.click(screen.getByRole('button', { name: 'Insert break' }))
    const breakRows = screen.getAllByRole('group', { name: /Break/ })
    const newBreak = breakRows[breakRows.length - 1]
    await user.clear(within(newBreak).getByLabelText('Duration minutes'))
    await user.type(within(newBreak).getByLabelText('Duration minutes'), '10')
    await user.click(within(newBreak).getByRole('button', { name: 'Move up' }))
    await user.click(screen.getByRole('button', { name: 'Apply structure' }))

    expect(screen.getByRole('listitem', { name: 'BREAK — 10 MIN' })).toBeVisible()
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
