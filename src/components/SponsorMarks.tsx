import type { JSX } from 'react'

const CANONICAL_SPONSORS = [
  { label: 'Jane Street', source: '/branding/jane-street.png', className: 'sponsor-logo-card--jane-street' },
  { label: 'Susquehanna', source: '/branding/susquehanna.png', className: 'sponsor-logo-card--susquehanna' },
] as const

function getSponsorMark(label: string, index: number) {
  const normalizedLabel = label.trim().toLocaleLowerCase()
  const canonicalSponsor = CANONICAL_SPONSORS.find((sponsor) => sponsor.label.toLocaleLowerCase() === normalizedLabel)

  if (canonicalSponsor) return canonicalSponsor

  return label === 'SPONSOR' ? CANONICAL_SPONSORS[index] : undefined
}

export interface SponsorMarksProps {
  labels: readonly string[]
  className?: string
}

export function SponsorMarks({ labels, className }: SponsorMarksProps): JSX.Element {
  return (
    <div className={className ? `sponsor-marks ${className}` : 'sponsor-marks'}>
      {labels.map((label, index) => {
        const sponsor = getSponsorMark(label, index)

        return sponsor ? (
          <div className={`sponsor-logo-card ${sponsor.className}`} key={`${label}-${index}`}>
            <img className="sponsor-logo" src={sponsor.source} alt={sponsor.label} />
          </div>
        ) : (
          <strong className="sponsor-text-mark" key={`${label}-${index}`}>{label}</strong>
        )
      })}
    </div>
  )
}
