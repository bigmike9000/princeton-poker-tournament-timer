import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TournamentProvider } from '../../app/TournamentProvider'
import { createInitialState } from '../../domain/sampleStructure'
import { entryDurationMs } from '../../domain/structure'
import { saveSnapshot } from '../../persistence/snapshot'
import { TournamentDisplay } from './TournamentDisplay'

function renderDisplay(onOpenDirector = vi.fn()) {
  return render(
    <TournamentProvider>
      <TournamentDisplay
        onOpenDirector={onOpenDirector}
        fullscreen={false}
        fullscreenError={null}
        onToggleFullscreen={vi.fn().mockResolvedValue(undefined)}
      />
    </TournamentProvider>,
  )
}

describe('TournamentDisplay', () => {
  it('shows the Princeton Poker Club logo', () => {
    renderDisplay()

    expect(screen.getByRole('img', { name: 'Princeton Poker Club logo' })).toBeVisible()
  })

  it('shows the dominant timer, current blinds, and player statistics', () => {
    renderDisplay()

    expect(screen.getByRole('timer')).toHaveTextContent('12:00')
    expect(screen.getByText('LEVEL 1')).toBeVisible()
    expect(screen.getAllByText('1 / 2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('NO ANTE').length).toBeGreaterThan(0)
    expect(screen.getByText('80 / 80')).toBeVisible()
    expect(screen.getByText('200')).toBeVisible()
    expect(screen.getByText('16,000')).toBeVisible()
  })

  it('renders a break and previews the next poker level', () => {
    const state = createInitialState()
    state.runtime.currentEntryIndex = 5
    state.runtime.remainingMs = entryDurationMs(state.structure[5]) ?? 0
    state.runtime.status = 'paused'
    saveSnapshot(localStorage, state, Date.now())

    renderDisplay()

    expect(screen.getAllByText('BREAK').length).toBeGreaterThan(0)
    expect(screen.getByText(/Next: Level 6/)).toBeVisible()
    expect(screen.getAllByText(/10 \/ 20/).length).toBeGreaterThan(0)
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
})
