import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ClubLogo } from './ClubLogo'

describe('ClubLogo', () => {
  it('uses the local PPC brand asset by default', () => {
    render(<ClubLogo size={48} />)

    expect(screen.getByRole('img')).toHaveAttribute('src', '/branding/ppc-logo.png')
  })

  it('provides a meaningful accessible name', () => {
    render(<ClubLogo size={48} />)

    expect(screen.getByRole('img', { name: 'Princeton Poker Club logo' })).toBeVisible()
  })

  it('renders explicit equal dimensions from the requested size', () => {
    render(<ClubLogo size={48} />)

    expect(screen.getByRole('img')).toHaveAttribute('width', '48')
    expect(screen.getByRole('img')).toHaveAttribute('height', '48')
  })
})
