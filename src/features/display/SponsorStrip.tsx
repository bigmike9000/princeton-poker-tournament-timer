const CANONICAL_SPONSORS = [
  { label: 'Jane Street', source: '/branding/jane-street.png', className: 'sponsor-logo-card--jane-street' },
  { label: 'Susquehanna', source: '/branding/susquehanna.png', className: 'sponsor-logo-card--susquehanna' },
] as const

function getSponsorMark(label: string, index: number) {
  const normalizedLabel = label.trim().toLocaleLowerCase()
  const canonicalSponsor = CANONICAL_SPONSORS.find((sponsor) => sponsor.label.toLocaleLowerCase() === normalizedLabel)

  if (canonicalSponsor) {
    return canonicalSponsor
  }

  return label === 'SPONSOR' ? CANONICAL_SPONSORS[index] : undefined
}

export interface SponsorStripProps {
  labels: string[]
}

export function SponsorStrip({ labels }: SponsorStripProps) {
  return (
    <footer className="sponsor-strip" aria-label="Tournament sponsors">
      <span>Presented with support from</span>
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
    </footer>
  )
}
