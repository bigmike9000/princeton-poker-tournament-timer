import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import displayCss from '../../styles/display.css?raw'
import { SponsorStrip } from './SponsorStrip'

function cssRule(source: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('SponsorStrip', () => {
  it('renders the two supplied canonical sponsor marks', () => {
    render(<SponsorStrip labels={['Jane Street', 'Susquehanna']} />)

    expect(screen.getByRole('img', { name: 'Jane Street' })).toHaveAttribute('src', '/branding/jane-street.png')
    expect(screen.getByRole('img', { name: 'Susquehanna' })).toHaveAttribute('src', '/branding/susquehanna.png')
  })

  it('contains both intrinsic logo images inside the bounded sponsor cards', () => {
    render(<SponsorStrip labels={['Jane Street', 'Susquehanna']} />)
    const logoRule = cssRule(displayCss, '.sponsor-logo')
    const cardRule = cssRule(displayCss, '.sponsor-logo-card')

    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(screen.getAllByRole('img').every((logo) => logo.classList.contains('sponsor-logo'))).toBe(true)
    expect(logoRule).toMatch(/width:\s*auto/)
    expect(logoRule).toMatch(/height:\s*auto/)
    expect(logoRule).toMatch(/max-width:\s*100%/)
    expect(logoRule).toMatch(/max-height:\s*100%/)
    expect(logoRule).toMatch(/min-width:\s*0/)
    expect(logoRule).toMatch(/min-height:\s*0/)
    expect(logoRule).toMatch(/object-fit:\s*contain/)
    expect(cardRule).toMatch(/width:\s*7\.5rem/)
    expect(cardRule).toMatch(/height:\s*2rem/)
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
