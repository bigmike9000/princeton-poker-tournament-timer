import type { PokerLevel, StructureEntry } from './types'

export function isUntimedEntry(
  entry: StructureEntry,
): entry is PokerLevel & { durationSeconds: null } {
  return entry.kind === 'level' && entry.durationSeconds === null
}

export function entryDurationMs(entry: StructureEntry): number | null {
  return entry.durationSeconds === null ? null : entry.durationSeconds * 1_000
}

export function durationLabel(entry: StructureEntry): string {
  return entry.durationSeconds === null
    ? 'Until end'
    : `${Math.round(entry.durationSeconds / 60)} min`
}
