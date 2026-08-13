import type { StructureEntry } from './types'

export interface ValidationIssue {
  entryId: string
  field: string
  message: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

function wholeNonnegative(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

export function validateStructure(entries: StructureEntry[]): ValidationResult {
  const issues: ValidationIssue[] = []
  const seenIds = new Set<string>()

  if (!entries.some((entry) => entry.kind === 'level')) {
    issues.push({
      entryId: 'structure',
      field: 'structure',
      message: 'Add at least one poker level.',
    })
  }

  for (const [index, entry] of entries.entries()) {
    if (seenIds.has(entry.id)) {
      issues.push({ entryId: entry.id, field: 'id', message: 'Every entry needs a unique identifier.' })
    }
    seenIds.add(entry.id)

    const isTerminalUntimedLevel = entry.kind === 'level'
      && entry.durationSeconds === null
      && index === entries.length - 1
    if (!isTerminalUntimedLevel && (
      entry.durationSeconds === null
      || !Number.isInteger(entry.durationSeconds)
      || entry.durationSeconds <= 0
      || entry.durationSeconds % 60 !== 0
    )) {
      issues.push({
        entryId: entry.id,
        field: 'durationSeconds',
        message: 'Duration must be a positive whole number of minutes.',
      })
    }

    if (entry.kind === 'break') {
      if (!entry.label.trim()) {
        issues.push({ entryId: entry.id, field: 'label', message: 'Break label is required.' })
      }
      continue
    }

    if (!wholeNonnegative(entry.smallBlind)) {
      issues.push({ entryId: entry.id, field: 'smallBlind', message: 'Small blind must be a whole chip amount.' })
    }
    if (!Number.isInteger(entry.bigBlind) || entry.bigBlind <= 0) {
      issues.push({ entryId: entry.id, field: 'bigBlind', message: 'Big blind must be a positive whole chip amount.' })
    }
    if (wholeNonnegative(entry.smallBlind) && wholeNonnegative(entry.bigBlind) && entry.smallBlind > entry.bigBlind) {
      issues.push({ entryId: entry.id, field: 'smallBlind', message: 'Small blind cannot exceed big blind.' })
    }
    if (!wholeNonnegative(entry.ante)) {
      issues.push({ entryId: entry.id, field: 'ante', message: 'Ante must be a whole chip amount.' })
    } else if (entry.anteType === 'none' && entry.ante !== 0) {
      issues.push({ entryId: entry.id, field: 'ante', message: 'Ante must be zero when ante type is None.' })
    } else if (entry.anteType !== 'none' && entry.ante <= 0) {
      issues.push({ entryId: entry.id, field: 'ante', message: 'This ante type requires a positive ante.' })
    }
  }

  return { valid: issues.length === 0, issues }
}

export function validatePresetName(
  name: string,
  existingNames: string[],
  currentName?: string,
): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'Preset name is required.'
  if (trimmed.length > 60) return 'Preset name must be 60 characters or fewer.'
  const normalized = trimmed.toLocaleLowerCase()
  const currentNormalized = currentName?.trim().toLocaleLowerCase()
  if (existingNames.some((entry) => {
    const candidate = entry.trim().toLocaleLowerCase()
    return candidate === normalized && candidate !== currentNormalized
  })) {
    return 'A preset with this name already exists.'
  }
  return null
}
