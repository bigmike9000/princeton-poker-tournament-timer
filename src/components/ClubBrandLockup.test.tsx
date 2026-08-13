import { describe, expect, it } from 'vitest'
import brandCss from '../styles/brand.css?raw'

function cssRule(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return brandCss.match(new RegExp(`(?:^|\\n)\\s*${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('ClubBrandLockup styles', () => {
  it('keeps the organization line orange across every header surface', () => {
    expect(cssRule('.club-brand-lockup .club-brand-organization')).toMatch(/color:\s*var\(--orange-400\)/)

    for (const selector of [
      '.club-brand-lockup.brand-lockup--display .club-brand-organization',
      '.club-brand-lockup.info-brand .club-brand-organization',
      '.club-brand-lockup.director-brand .club-brand-organization',
    ]) {
      expect(cssRule(selector)).not.toMatch(/color:/)
    }
  })

  it('keeps the display lockup organization compact and lets the tournament title lead', () => {
    const organization = cssRule('.club-brand-lockup.brand-lockup--display .club-brand-organization')
    const title = cssRule('.club-brand-lockup.brand-lockup--display h1')

    expect(cssRule('.club-brand-lockup .club-brand-organization')).toMatch(/color:\s*var\(--orange-400\)/)
    expect(cssRule('.club-brand-lockup .club-brand-organization')).toMatch(/text-transform:\s*uppercase/)
    expect(organization).toMatch(/font-size:\s*clamp\(\.7[0-9]rem/)
    expect(organization).not.toMatch(/font-family:\s*var\(--font-heritage\)/)
    expect(title).toMatch(/color:\s*var\(--ivory-50\)/)
    expect(title).toMatch(/font-family:\s*var\(--font-heritage\)/)
    expect(title).toMatch(/font-size:\s*clamp\(1\.[0-9]+rem/)
    expect(title).not.toMatch(/text-transform:\s*uppercase/)
  })
})
