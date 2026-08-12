import type { StructureEntry } from '../domain/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isStructureEntry(value: unknown): value is StructureEntry {
  if (!isRecord(value) || typeof value.id !== 'string') return false

  if (value.kind === 'break') {
    return typeof value.label === 'string' &&
      isFiniteNonnegative(value.durationSeconds) &&
      value.durationSeconds > 0
  }

  if (value.kind !== 'level') return false
  return isFiniteNonnegative(value.smallBlind) &&
    isFiniteNonnegative(value.bigBlind) &&
    isFiniteNonnegative(value.ante) &&
    (value.anteType === 'none' ||
      value.anteType === 'traditional' ||
      value.anteType === 'big-blind') &&
    (value.durationSeconds === null ||
      (isFiniteNonnegative(value.durationSeconds) && value.durationSeconds > 0)) &&
    (value.note === undefined || typeof value.note === 'string')
}

export function parseStructure(value: unknown): StructureEntry[] | null {
  return Array.isArray(value) && value.every(isStructureEntry)
    ? value
    : null
}
