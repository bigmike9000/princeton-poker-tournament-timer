import { render, screen } from '@testing-library/react'
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
})
