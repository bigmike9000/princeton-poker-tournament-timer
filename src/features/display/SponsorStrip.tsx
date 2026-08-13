import { SponsorMarks } from '../../components/SponsorMarks'

export interface SponsorStripProps {
  labels: readonly string[]
}

export function SponsorStrip({ labels }: SponsorStripProps) {
  return (
    <footer className="sponsor-strip" aria-label="Tournament sponsors">
      <span>Presented with support from</span>
      <SponsorMarks labels={labels} />
    </footer>
  )
}
