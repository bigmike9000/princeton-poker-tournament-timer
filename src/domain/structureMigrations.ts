import type { StructureEntry } from './types'

const obsoleteBundledNotes = new Map([
  ['level-6', 'BB ante begins'],
  ['level-13', 'Final table target · chip up to 100s and 500s'],
  ['level-15', 'Expected finish'],
  ['level-17', 'Final level'],
])

export function removeObsoleteBundledNotes(structure: StructureEntry[]): StructureEntry[] {
  return structure.map((entry) => {
    if (entry.kind !== 'level' || obsoleteBundledNotes.get(entry.id) !== entry.note) return entry
    const migrated = { ...entry }
    delete migrated.note
    return migrated
  })
}
