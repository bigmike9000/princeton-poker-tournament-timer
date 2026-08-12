import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../../app/App'

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Open Tournament Director' }))
  await user.click(screen.getByRole('button', { name: 'Settings' }))
}

describe('DirectorSettings', () => {
  it('updates advancement, close behavior, sound, and alert preferences', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openSettings(user)

    const autoAdvance = screen.getByRole('checkbox', { name: 'Automatically advance levels' })
    expect(autoAdvance).toBeChecked()
    await user.click(autoAdvance)
    expect(autoAdvance).not.toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Keep tournament clock running' }))
    expect(screen.getByRole('radio', { name: 'Keep tournament clock running' })).toBeChecked()

    await user.click(screen.getByRole('checkbox', { name: 'Five minutes remaining' }))
    expect(screen.getByRole('checkbox', { name: 'Five minutes remaining' })).not.toBeChecked()
    expect(screen.getByText('Space')).toBeVisible()
    expect(screen.getByText('Start / Pause')).toBeVisible()
  })

  it('runs keyboard shortcuts outside editable controls', async () => {
    render(<App />)

    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByRole('button', { name: 'Pause tournament' })).toBeVisible()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('LEVEL 2')).toBeVisible()
    fireEvent.keyDown(window, { key: 'm' })
    expect(screen.getByRole('button', { name: 'Unmute alerts' })).toBeVisible()
  })

  it('offers fullscreen from the main display', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: requestFullscreen })
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    expect(requestFullscreen).toHaveBeenCalledOnce()
  })

  it('shows a nonblocking error when the fullscreen keyboard shortcut is unavailable', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: undefined })
    render(<App />)

    fireEvent.keyDown(window, { key: 'f' })

    expect(await screen.findByRole('status')).toHaveTextContent(/fullscreen is unavailable/i)
    expect(screen.getByRole('timer')).toBeVisible()
  })
})
