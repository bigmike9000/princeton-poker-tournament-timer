import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SNAPSHOT_KEY } from '../persistence/snapshot'
import { ErrorBoundary } from './ErrorBoundary'

function BrokenComponent(): never {
  throw new Error('test failure')
}

describe('ErrorBoundary', () => {
  it('keeps saved progress by default and can reload the application', () => {
    localStorage.setItem(SNAPSHOT_KEY, 'saved-progress')
    const reload = vi.fn()
    render(<ErrorBoundary reload={reload}><BrokenComponent /></ErrorBoundary>)

    expect(screen.getByRole('heading', { name: 'The display encountered an error' })).toBeVisible()
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBe('saved-progress')
    fireEvent.click(screen.getByRole('button', { name: 'Reload application' }))
    expect(reload).toHaveBeenCalledOnce()
  })

  it('requires confirmation before discarding progress for safe defaults', () => {
    localStorage.setItem(SNAPSHOT_KEY, 'saved-progress')
    const reload = vi.fn()
    const confirm = vi.fn().mockReturnValue(false)
    const view = render(<ErrorBoundary reload={reload} confirmReset={confirm}><BrokenComponent /></ErrorBoundary>)

    fireEvent.click(screen.getByRole('button', { name: 'Start with safe defaults' }))
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBe('saved-progress')
    expect(reload).not.toHaveBeenCalled()

    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Start with safe defaults' }))
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull()
    expect(reload).toHaveBeenCalledOnce()
    view.unmount()
  })
})
