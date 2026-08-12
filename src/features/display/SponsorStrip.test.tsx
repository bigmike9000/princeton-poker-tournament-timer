import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SponsorStrip } from './SponsorStrip'

describe('SponsorStrip', () => {
  it('renders the two supplied canonical sponsor marks', () => {
    render(<SponsorStrip labels={['Jane Street', 'Susquehanna']} />)

    expect(screen.getByRole('img', { name: 'Jane Street' })).toHaveAttribute('src', '/branding/jane-street.png')
    expect(screen.getByRole('img', { name: 'Susquehanna' })).toHaveAttribute('src', '/branding/susquehanna.png')
  })

  it('maps the two exact legacy placeholders by slot', () => {
    render(<SponsorStrip labels={['SPONSOR', 'SPONSOR']} />)

    expect(screen.getAllByRole('img')).toHaveLength(2)
  })

  it('keeps custom sponsors as text', () => {
    render(<SponsorStrip labels={['Princeton Alumni', 'Local Partner']} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Princeton Alumni')).toBeVisible()
  })
})
