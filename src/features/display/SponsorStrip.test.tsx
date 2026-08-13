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

  it('keeps its presentation label and delegates its marks to the shared rack', () => {
    const { container } = render(<SponsorStrip labels={['Jane Street']} />)

    expect(screen.getByText('Presented with support from')).toBeVisible()
    expect(container.querySelector('.sponsor-marks.sponsor-marks--display')).not.toBeNull()
  })

  it('enlarges only the main sponsor rack at full and short projector heights', () => {
    const displayRule = cssRule(displayCss, '.sponsor-marks--display .sponsor-logo-card')
    const shortHeightCss = displayCss.slice(displayCss.indexOf('@media (max-height: 820px)'))
    const shortHeightRule = cssRule(shortHeightCss, '.sponsor-marks--display .sponsor-logo-card')
    const phoneCss = displayCss.slice(displayCss.indexOf('@media (max-width: 640px)'))
    const phoneRule = cssRule(phoneCss, '.sponsor-marks--display .sponsor-logo-card')
    const infoRule = cssRule(displayCss, '.sponsor-marks--info .sponsor-logo-card')
    const narrowInfoCss = displayCss.slice(displayCss.lastIndexOf('@media (max-width: 640px)'))
    const narrowInfoRule = cssRule(narrowInfoCss, '.sponsor-marks--info .sponsor-logo-card')

    expect(displayRule).toMatch(/width:\s*8\.5rem/)
    expect(displayRule).toMatch(/height:\s*2\.25rem/)
    expect(shortHeightRule).toMatch(/width:\s*7\.25rem/)
    expect(shortHeightRule).toMatch(/height:\s*1\.85rem/)
    expect(phoneRule).toMatch(/width:\s*5\.5rem/)
    expect(phoneRule).toMatch(/height:\s*1\.5rem/)
    expect(infoRule).toMatch(/width:\s*clamp\(7\.5rem,\s*11vw,\s*10rem\)/)
    expect(infoRule).toMatch(/height:\s*clamp\(2\.1rem,\s*3\.2vw,\s*2\.8rem\)/)
    expect(narrowInfoRule).toMatch(/width:\s*4\.8rem/)
    expect(narrowInfoRule).toMatch(/height:\s*1\.45rem/)
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

  it('gives the Susquehanna mark a light contrast plaque', () => {
    render(<SponsorStrip labels={['Jane Street', 'Susquehanna']} />)
    const susquehannaRule = cssRule(displayCss, '.sponsor-logo-card--susquehanna')

    expect(screen.getByRole('img', { name: 'Susquehanna' }).parentElement).toHaveClass('sponsor-logo-card--susquehanna')
    expect(susquehannaRule).toMatch(/background:\s*#[a-f0-9]{6}|background:\s*rgb/i)
    expect(susquehannaRule).toMatch(/border:\s*1px solid/)
    expect(susquehannaRule).toMatch(/padding:/)
    expect(susquehannaRule).toMatch(/border-radius:/)
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
