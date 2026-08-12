import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState, sampleStructure } from '../domain/sampleStructure'
import type { StructureEntry } from '../domain/types'
import { createPresetRepository, PRESETS_KEY, type StructurePreset } from './presets'

const formerBundledStructure: StructureEntry[] = [
  { id: 'level-1', kind: 'level', durationSeconds: 1_200, smallBlind: 100, bigBlind: 200, ante: 200, anteType: 'big-blind' },
  { id: 'level-2', kind: 'level', durationSeconds: 1_200, smallBlind: 100, bigBlind: 300, ante: 300, anteType: 'big-blind' },
  { id: 'level-3', kind: 'level', durationSeconds: 1_200, smallBlind: 200, bigBlind: 400, ante: 400, anteType: 'big-blind' },
  { id: 'level-4', kind: 'level', durationSeconds: 1_200, smallBlind: 300, bigBlind: 600, ante: 600, anteType: 'big-blind' },
  { id: 'break-1', kind: 'break', durationSeconds: 900, label: 'Break' },
  { id: 'level-5', kind: 'level', durationSeconds: 1_200, smallBlind: 400, bigBlind: 800, ante: 800, anteType: 'big-blind' },
  { id: 'level-6', kind: 'level', durationSeconds: 1_200, smallBlind: 500, bigBlind: 1_000, ante: 1_000, anteType: 'big-blind' },
  { id: 'level-7', kind: 'level', durationSeconds: 1_200, smallBlind: 600, bigBlind: 1_200, ante: 1_200, anteType: 'big-blind' },
  { id: 'level-8', kind: 'level', durationSeconds: 1_200, smallBlind: 800, bigBlind: 1_600, ante: 1_600, anteType: 'big-blind' },
  { id: 'break-2', kind: 'break', durationSeconds: 900, label: 'Break' },
  { id: 'level-9', kind: 'level', durationSeconds: 1_200, smallBlind: 1_000, bigBlind: 2_000, ante: 2_000, anteType: 'big-blind' },
  { id: 'level-10', kind: 'level', durationSeconds: 1_200, smallBlind: 1_500, bigBlind: 3_000, ante: 3_000, anteType: 'big-blind' },
]

function persistedPreset(overrides: Partial<StructurePreset> = {}): StructurePreset {
  return {
    id: 'standard-v1',
    name: 'Princeton Poker Club Standard',
    structure: structuredClone(formerBundledStructure),
    createdAt: '2025-01-02T03:04:05.000Z',
    updatedAt: '2025-06-07T08:09:10.000Z',
    ...overrides,
  }
}

function setStructureNote(structure: StructureEntry[], id: string, note: string): void {
  const entry = structure.find((candidate) => candidate.id === id)
  if (entry?.kind !== 'level') throw new Error(`Missing test level ${id}`)
  entry.note = note
}

function structureNote(structure: StructureEntry[], id: string): string | undefined {
  const entry = structure.find((candidate) => candidate.id === id)
  return entry?.kind === 'level' ? entry.note : undefined
}

describe('preset repository', () => {
  beforeEach(() => localStorage.clear())

  it('starts with a copy-safe sample preset', () => {
    const repository = createPresetRepository(localStorage)
    const sample = repository.list()[0]

    expect(sample.name).toBe('Princeton Poker Club Standard')
    sample.structure[0].durationSeconds = 60
    expect(repository.load(sample.id).structure[0].durationSeconds).toBe(720)
  })

  it('saves and duplicates presets without shared entry references', () => {
    const repository = createPresetRepository(localStorage)
    const original = repository.save('Turbo', createInitialState().structure)
    const copy = repository.duplicate(original.id, 'Turbo Copy')
    copy.structure[0].durationSeconds = 60

    expect(repository.load(original.id).structure[0].durationSeconds).toBe(720)
    expect(repository.load(copy.id).name).toBe('Turbo Copy')
  })

  it('renames and deletes presets', () => {
    const repository = createPresetRepository(localStorage)
    const preset = repository.save('Deep Stack', createInitialState().structure)
    const renamed = repository.rename(preset.id, 'Championship')
    repository.remove(renamed.id)

    expect(renamed.name).toBe('Championship')
    expect(repository.list().some((entry) => entry.id === preset.id)).toBe(false)
  })

  it('rejects duplicate names and malformed structures', () => {
    const repository = createPresetRepository(localStorage)
    repository.save('Turbo', createInitialState().structure)

    expect(() => repository.save('turbo', createInitialState().structure)).toThrow(/already exists/i)
    expect(() => repository.save('Bad', [])).toThrow(/valid structure/i)
  })

  it.each([
    ['a non-string level note', { note: { unsafe: true } }],
    ['an invalid ante type', { anteType: 'dealer-button', ante: 2 }],
    ['a non-string break label', { kind: 'break', label: null, durationSeconds: 600 }],
  ])('filters persisted presets with %s without discarding valid siblings', (_label, malformedFields) => {
    const valid = persistedPreset({
      id: 'valid-v2',
      name: 'Current custom',
      structure: structuredClone(sampleStructure),
    })
    const malformedStructure = structuredClone(sampleStructure) as unknown as Record<string, unknown>[]
    malformedStructure[0] = { ...malformedStructure[0], ...malformedFields }
    const malformed = {
      ...persistedPreset({ id: 'malformed-v2', name: 'Malformed' }),
      structure: malformedStructure,
    }
    localStorage.setItem(PRESETS_KEY, JSON.stringify([valid, malformed]))

    const presets = createPresetRepository(localStorage).list()

    expect(presets).toEqual([valid])
  })

  it('upgrades the former bundled standard preset in place', () => {
    const legacy = persistedPreset()
    localStorage.setItem(PRESETS_KEY, JSON.stringify([legacy]))

    const [upgraded] = createPresetRepository(localStorage).list()

    expect(upgraded).toEqual({ ...legacy, structure: sampleStructure })
  })

  it('strips obsolete bundled notes when an existing preset is read or loaded', () => {
    const structure = structuredClone(sampleStructure)
    setStructureNote(structure, 'level-6', 'BB ante begins')
    setStructureNote(structure, 'level-13', 'Final table target · chip up to 100s and 500s')
    setStructureNote(structure, 'level-15', 'Expected finish')
    setStructureNote(structure, 'level-17', 'Final level')
    setStructureNote(structure, 'level-7', 'Custom note to preserve')
    const persisted = persistedPreset({
      id: 'saved-with-old-notes',
      name: 'Saved before upgrade',
      structure,
    })
    localStorage.setItem(PRESETS_KEY, JSON.stringify([persisted]))

    const repository = createPresetRepository(localStorage)
    const listed = repository.list()[0]
    const loaded = repository.load(persisted.id)

    for (const migrated of [listed.structure, loaded.structure]) {
      expect(structureNote(migrated, 'level-6')).toBeUndefined()
      expect(structureNote(migrated, 'level-13')).toBeUndefined()
      expect(structureNote(migrated, 'level-15')).toBeUndefined()
      expect(structureNote(migrated, 'level-17')).toBeUndefined()
      expect(structureNote(migrated, 'level-7')).toBe('Custom note to preserve')
    }
  })

  it.each([
    ['a custom preset with the former structure', persistedPreset({ id: 'custom-v1', name: 'Custom' })],
    ['a standard-named preset with a customized structure', persistedPreset({
      structure: [{ ...formerBundledStructure[0], durationSeconds: 1_140 }, ...formerBundledStructure.slice(1)],
    })],
  ])('does not alter %s', (_label, preset) => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify([preset]))

    const [restored] = createPresetRepository(localStorage).list()

    expect(restored).toEqual(preset)
  })
})
