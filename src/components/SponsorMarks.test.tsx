import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SponsorMarks } from './SponsorMarks'

describe('SponsorMarks', () => {
  it('renders canonical sponsors with their maintained image paths', () => {
    render(<SponsorMarks labels={['Jane Street', 'Susquehanna']} />)

    expect(screen.getByRole('img', { name: 'Jane Street' })).toHaveAttribute('src', '/branding/jane-street.png')
    expect(screen.getByRole('img', { name: 'Susquehanna' })).toHaveAttribute('src', '/branding/susquehanna.png')
  })

  it('maps legacy sponsor placeholders by their supplied slots', () => {
    render(<SponsorMarks labels={['SPONSOR', 'SPONSOR']} />)

    expect(screen.getByRole('img', { name: 'Jane Street' })).toBeVisible()
    expect(screen.getByRole('img', { name: 'Susquehanna' })).toBeVisible()
  })

  it('renders custom sponsor labels as text marks', () => {
    render(<SponsorMarks labels={['Princeton Alumni', 'Local Partner']} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Princeton Alumni')).toHaveClass('sponsor-text-mark')
    expect(screen.getByText('Local Partner')).toHaveClass('sponsor-text-mark')
  })
})
