import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TournamentProvider } from '../../app/TournamentProvider'
import { useTournament } from '../../app/useTournament'
import { TournamentInformationEditor } from './TournamentInformationEditor'

function InformationHarness() {
  const { state } = useTournament()

  return (
    <>
      <TournamentInformationEditor />
      <output aria-label="Saved chip information">{state.information?.chipLines.join('|')}</output>
      <output aria-label="Saved prize information">{state.information?.prizeLines.join('|')}</output>
      <output aria-label="Saved house information">{state.information?.houseNotes.join('|')}</output>
    </>
  )
}

function renderEditor() {
  render(<TournamentProvider><InformationHarness /></TournamentProvider>)
}

describe('TournamentInformationEditor', () => {
  it('shows all public information fields with the safe prize copy', () => {
    renderEditor()

    expect(screen.getByRole('textbox', { name: 'Chip denominations and starting stack' })).toHaveAttribute('rows', '5')
    expect(screen.getByRole('textbox', { name: 'Prize structure' })).toHaveValue(
      'Prize structure will be announced by the Tournament Director before play begins.',
    )
    expect(screen.getByRole('textbox', { name: 'House notes' })).toBeVisible()
  })

  it('removes blank lines from all fields when saved', async () => {
    const user = userEvent.setup()
    renderEditor()
    const chips = screen.getByRole('textbox', { name: 'Chip denominations and starting stack' })
    const prizes = screen.getByRole('textbox', { name: 'Prize structure' })
    const notes = screen.getByRole('textbox', { name: 'House notes' })

    await user.clear(chips)
    await user.type(chips, '  Ones  {enter}{enter}Fives  ')
    await user.clear(prizes)
    await user.type(prizes, '  Trophy  {enter}{enter}Medal  ')
    await user.clear(notes)
    await user.type(notes, '  Be kind  {enter}{enter}Act in turn  ')
    await user.click(screen.getByRole('button', { name: 'Save tournament information' }))

    expect(screen.getByLabelText('Saved chip information')).toHaveTextContent('Ones|Fives')
    expect(screen.getByLabelText('Saved prize information')).toHaveTextContent('Trophy|Medal')
    expect(screen.getByLabelText('Saved house information')).toHaveTextContent('Be kind|Act in turn')
  })

  it('restores the corresponding safe default when a field is entirely blank', async () => {
    const user = userEvent.setup()
    renderEditor()
    const prizes = screen.getByRole('textbox', { name: 'Prize structure' })

    await user.clear(prizes)
    await user.type(prizes, '   {enter}{enter}   ')
    await user.click(screen.getByRole('button', { name: 'Save tournament information' }))

    expect(screen.getByLabelText('Saved prize information')).toHaveTextContent(
      'Prize structure will be announced by the Tournament Director before play begins.',
    )
  })

  it('states and accepts each exact projector-safe boundary', async () => {
    const user = userEvent.setup()
    renderEditor()
    const chips = screen.getByRole('textbox', { name: 'Chip denominations and starting stack' })
    const prizes = screen.getByRole('textbox', { name: 'Prize structure' })
    const notes = screen.getByRole('textbox', { name: 'House notes' })
    const chipBoundary = Array.from({ length: 6 }, () => 'x'.repeat(20)).join('\n')
    const prizeBoundary = Array.from({ length: 4 }, () => 'x'.repeat(24)).join('\n')
    const houseBoundary = Array.from({ length: 4 }, () => 'x'.repeat(30)).join('\n')

    fireEvent.change(chips, { target: { value: chipBoundary } })
    fireEvent.change(prizes, { target: { value: prizeBoundary } })
    fireEvent.change(notes, { target: { value: houseBoundary } })

    expect(screen.getByText('6 of 6 lines · 120 of 120 characters')).toBeVisible()
    expect(screen.getByText('4 of 4 lines · 96 of 96 characters')).toBeVisible()
    expect(screen.getByText('4 of 4 lines · 120 of 120 characters')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save tournament information' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Save tournament information' }))
    expect(screen.getByLabelText('Saved chip information')).toHaveTextContent(chipBoundary.replaceAll('\n', '|'))
    expect(screen.getByLabelText('Saved prize information')).toHaveTextContent(prizeBoundary.replaceAll('\n', '|'))
    expect(screen.getByLabelText('Saved house information')).toHaveTextContent(houseBoundary.replaceAll('\n', '|'))
  })

  it('shows field-specific errors, blocks save, and retains every over-budget draft', () => {
    renderEditor()
    const prizes = screen.getByRole('textbox', { name: 'Prize structure' })
    const notes = screen.getByRole('textbox', { name: 'House notes' })
    const originalPrize = screen.getByLabelText('Saved prize information').textContent
    const overPrize = 'p'.repeat(97)
    const overNotes = ['One', 'Two', 'Three', 'Four', 'Five'].join('\n')

    fireEvent.change(prizes, { target: { value: overPrize } })
    fireEvent.change(notes, { target: { value: overNotes } })

    const prizeError = screen.getByText('Use no more than 96 total characters (currently 97).')
    const notesError = screen.getByText('Use no more than 4 lines (currently 5).')
    expect(prizes).toHaveAttribute('aria-invalid', 'true')
    expect(prizes.getAttribute('aria-describedby')).toContain(prizeError.id)
    expect(notes).toHaveAttribute('aria-invalid', 'true')
    expect(notes.getAttribute('aria-describedby')).toContain(notesError.id)
    expect(screen.getByRole('button', { name: 'Save tournament information' })).toBeDisabled()

    fireEvent.submit(screen.getByRole('button', { name: 'Save tournament information' }).closest('form')!)

    expect(screen.getByLabelText('Saved prize information')).toHaveTextContent(originalPrize ?? '')
    expect(screen.getByLabelText('Saved house information')).toHaveTextContent(
      'Big-blind ante begins at 10/20.|Chip-ups occur during the scheduled breaks shown in the structure.',
    )
    expect(prizes).toHaveValue(overPrize)
    expect(notes).toHaveValue(overNotes)
  })
})
