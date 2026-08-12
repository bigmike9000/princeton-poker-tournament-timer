import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TournamentProvider } from './TournamentProvider'
import { PwaUpdatePrompt, type UpdateRegistration } from './PwaUpdatePrompt'
import { useTournament } from './useTournament'

function RunningHarness({ register }: { register: UpdateRegistration }) {
  const { dispatch } = useTournament()
  return (
    <>
      <button onClick={() => dispatch({ type: 'START', now: Date.now() })}>Start tournament</button>
      <PwaUpdatePrompt registerUpdate={register} />
    </>
  )
}

describe('PwaUpdatePrompt', () => {
  it('requires confirmation before activating an update while the clock is stopped', async () => {
    let announceUpdate: (() => void) | undefined
    const activate = vi.fn().mockResolvedValue(undefined)
    const register: UpdateRegistration = (options) => {
      announceUpdate = options.onNeedRefresh
      return activate
    }
    render(<TournamentProvider><RunningHarness register={register} /></TournamentProvider>)

    act(() => announceUpdate?.())
    fireEvent.click(screen.getByRole('button', { name: 'Review application update' }))
    expect(activate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Install application update' }))

    expect(activate).toHaveBeenCalledOnce()
  })

  it('defers activation while the tournament clock is running', () => {
    let announceUpdate: (() => void) | undefined
    const activate = vi.fn().mockResolvedValue(undefined)
    const register: UpdateRegistration = (options) => {
      announceUpdate = options.onNeedRefresh
      return activate
    }
    render(<TournamentProvider><RunningHarness register={register} /></TournamentProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Start tournament' }))
    act(() => announceUpdate?.())

    expect(screen.getByRole('status')).toHaveTextContent(/pause the clock to install/i)
    expect(screen.queryByRole('button', { name: 'Review application update' })).not.toBeInTheDocument()
    expect(activate).not.toHaveBeenCalled()
  })
})
