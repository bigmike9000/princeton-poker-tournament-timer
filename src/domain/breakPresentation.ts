import { durationLabel } from './structure'
import type { BreakLevel } from './types'

export interface BreakPresentation {
  heading: string
  subtitle: string | null
  accessibleLabel: string
}

const formerBundledMessages: Readonly<Record<string, string>> = {
  'Chip up to 5s': 'Count and stack white chips in stacks of 10',
  'Chip up to 25s and 100s': 'Count and stack red chips',
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[—–-]/g, ' ').replace(/[·,:]/g, ' ').replace(/\s+/g, ' ')
}

export function breakPresentation(entry: BreakLevel): BreakPresentation {
  const duration = durationLabel(entry)
  const heading = `BREAK · ${duration.toLocaleUpperCase()}`
  const savedLabel = entry.label.trim()
  const candidate = formerBundledMessages[savedLabel] ?? savedLabel
  const generic = normalized(candidate)
  const repetitions = new Set([
    '',
    'break',
    normalized(heading),
    normalized(`Break ${duration}`),
    normalized(`Break ${entry.durationSeconds / 60} mins`),
  ])
  const subtitle = repetitions.has(generic) ? null : candidate
  return {
    heading,
    subtitle,
    accessibleLabel: ['Break', duration, subtitle].filter(Boolean).join(', '),
  }
}
