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
})
