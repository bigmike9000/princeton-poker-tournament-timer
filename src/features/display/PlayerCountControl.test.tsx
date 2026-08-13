import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import displayCss from '../../styles/display.css?raw'
import { PlayerCountControl } from './PlayerCountControl'

function cssRule(css: string, selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

function renderHarness({ players, startingPlayers }: { players: number; startingPlayers: number }) {
  const onSetPlayers = vi.fn()

  function Harness() {
    const [playersRemaining, setPlayersRemaining] = useState(players)
    const setPlayers = (nextPlayers: number) => {
      onSetPlayers(nextPlayers)
      setPlayersRemaining(Math.max(1, Math.min(startingPlayers, Math.round(nextPlayers))))
    }

    return (
      <PlayerCountControl
        playersRemaining={playersRemaining}
        startingPlayers={startingPlayers}
        onSetPlayers={setPlayers}
        onAdjustPlayers={(delta) => setPlayers(playersRemaining + delta)}
      />
    )
  }

  render(<Harness />)
  return { onSetPlayers }
}

describe('PlayerCountControl', () => {
  it('keeps the player stepper at the shared 3.4rem control height', () => {
    const stepperRule = cssRule(displayCss, '.player-stepper')

    expect(stepperRule).toMatch(/(?:^|\n)\s*height:\s*3\.4rem/)
    expect(stepperRule).toMatch(/(?:^|\n)\s*min-height:\s*3\.4rem/)
  })

  it('positions the player label inside a full-height editable center', () => {
    const centerRule = cssRule(displayCss, '.player-stepper div')
    const labelRule = cssRule(displayCss, '.player-stepper span')
    const inputRule = cssRule(displayCss, '.player-stepper input')

    expect(centerRule).toMatch(/position:\s*relative/)
    expect(centerRule).toMatch(/padding:\s*0\s+\.65rem/)
    expect(labelRule).toMatch(/position:\s*absolute/)
    expect(labelRule).toMatch(/top:\s*\.42rem/)
    expect(inputRule).toMatch(/height:\s*100%/)
    expect(inputRule).toMatch(/min-height:\s*2\.75rem/)
    expect(inputRule).toMatch(/padding:\s*1\.05rem\s+\.35rem\s+0/)
  })

  it('commits a typed player count on Enter', async () => {
    const user = userEvent.setup()
    renderHarness({ players: 80, startingPlayers: 80 })
    const input = screen.getByRole('spinbutton', { name: 'Players remaining' })

    await user.clear(input)
    await user.type(input, '53{Enter}')

    expect(screen.getByRole('spinbutton', { name: 'Players remaining' })).toHaveValue(53)
  })

  it('commits on blur and clamps through the reducer-facing callback', async () => {
    const user = userEvent.setup()
    const { onSetPlayers } = renderHarness({ players: 80, startingPlayers: 80 })
    const input = screen.getByRole('spinbutton', { name: 'Players remaining' })

    await user.clear(input)
    await user.type(input, '999')
    await user.tab()

    expect(onSetPlayers).toHaveBeenCalledWith(999)
    expect(screen.getByRole('spinbutton', { name: 'Players remaining' })).toHaveValue(80)
  })

  it('restores the live value on Escape', async () => {
    const user = userEvent.setup()
    const { onSetPlayers } = renderHarness({ players: 80, startingPlayers: 80 })
    const input = screen.getByRole('spinbutton', { name: 'Players remaining' })

    await user.clear(input)
    await user.type(input, '40{Escape}')

    expect(onSetPlayers).not.toHaveBeenCalled()
    expect(screen.getByRole('spinbutton', { name: 'Players remaining' })).toHaveValue(80)
  })

  it('keeps minus and plus buttons synchronized with the input', async () => {
    const user = userEvent.setup()
    renderHarness({ players: 80, startingPlayers: 80 })

    await user.click(screen.getByRole('button', { name: 'Eliminate player' }))
    expect(screen.getByRole('spinbutton', { name: 'Players remaining' })).toHaveValue(79)

    await user.click(screen.getByRole('button', { name: 'Restore player' }))
    expect(screen.getByRole('spinbutton', { name: 'Players remaining' })).toHaveValue(80)
  })
})
