import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import displayCss from '../styles/display.css?raw'
import { SponsorMarks } from './SponsorMarks'

function cssRule(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

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

  it('contains an unbroken maximum-length custom sponsor at narrow widths', () => {
    const label = 'A'.repeat(30)
    render(<SponsorMarks labels={[label]} className="sponsor-marks--info" />)

    expect(screen.getByText(label)).toHaveClass('sponsor-text-mark')
    const textMarkRule = cssRule(displayCss, '.sponsor-text-mark')
    expect(textMarkRule).toMatch(/min-width:\s*0/)
    expect(textMarkRule).toMatch(/max-width:\s*100%/)
    expect(textMarkRule).toMatch(/overflow-wrap:\s*anywhere/)
  })
})
