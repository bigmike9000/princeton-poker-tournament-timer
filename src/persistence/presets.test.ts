import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState, sampleStructure } from '../domain/sampleStructure'
import type { StructureEntry } from '../domain/types'
import { BUILT_IN_PRESET_ID, createPresetRepository, PRESETS_KEY, type StructurePreset } from './presets'

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
    const [sample] = repository.list()

    expect(sample).toMatchObject({
      id: BUILT_IN_PRESET_ID,
      name: 'Princeton Poker Club Standard',
      structure: sampleStructure,
    })
    sample.structure[0].durationSeconds = 60
    expect(repository.load(sample.id).structure[0].durationSeconds).toBe(720)
  })

  it('protects the built-in preset from renaming and deletion', () => {
    const repository = createPresetRepository(localStorage)

    expect(() => repository.rename(BUILT_IN_PRESET_ID, 'Changed')).toThrow('The built-in preset cannot be renamed.')
    expect(() => repository.remove(BUILT_IN_PRESET_ID)).toThrow('The built-in preset cannot be deleted.')
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

    expect(presets[0]).toMatchObject({ id: BUILT_IN_PRESET_ID, structure: sampleStructure })
    expect(presets.slice(1)).toEqual([valid])
  })

  it('normalizes the former bundled standard to one canonical first preset without altering customs', () => {
    const custom = persistedPreset({
      id: 'custom-v1',
      name: 'Turbo',
      structure: structuredClone(sampleStructure),
    })
    const legacy = persistedPreset({ id: 'former-bundled-random-id' })
    const customizedStandard = persistedPreset({
      id: 'custom-standard-v1',
      structure: [{ ...formerBundledStructure[0], durationSeconds: 1_140 }, ...formerBundledStructure.slice(1)],
    })
    localStorage.setItem(PRESETS_KEY, JSON.stringify([custom, legacy, customizedStandard]))

    const presets = createPresetRepository(localStorage).list()
    const [builtIn] = presets

    expect(presets.filter((preset) => preset.id === BUILT_IN_PRESET_ID)).toHaveLength(1)
    expect(builtIn).toMatchObject({
      id: BUILT_IN_PRESET_ID,
      name: 'Princeton Poker Club Standard',
      structure: sampleStructure,
      createdAt: legacy.createdAt,
    })
    expect(presets.some((preset) => preset.id === legacy.id)).toBe(false)
    expect(presets.slice(1)).toEqual([custom, customizedStandard])
  })

  it('preserves a standard-named former structure customized only by an obsolete note', () => {
    const structure = structuredClone(formerBundledStructure)
    setStructureNote(structure, 'level-6', 'BB ante begins')
    const custom = persistedPreset({ id: 'custom-legacy-note-v1', structure })
    localStorage.setItem(PRESETS_KEY, JSON.stringify([custom]))

    const presets = createPresetRepository(localStorage).list()

    expect(presets[0]).toMatchObject({ id: BUILT_IN_PRESET_ID, structure: sampleStructure })
    expect(presets.slice(1)).toEqual([custom])
  })

  it.each([
    ['invalid createdAt', { createdAt: 'not-a-date' }],
    ['invalid updatedAt', { updatedAt: 'not-a-date' }],
  ])('filters a stable-ID record with %s instead of propagating it to the canonical preset', (_label, timestamps) => {
    const invalidStable = persistedPreset({ id: BUILT_IN_PRESET_ID, ...timestamps })
    const custom = persistedPreset({ id: 'valid-custom-v1', name: 'Turbo', structure: structuredClone(sampleStructure) })
    localStorage.setItem(PRESETS_KEY, JSON.stringify([invalidStable, custom]))

    const presets = createPresetRepository(localStorage, () => 0).list()

    expect(presets[0]).toMatchObject({
      id: BUILT_IN_PRESET_ID,
      name: 'Princeton Poker Club Standard',
      structure: sampleStructure,
      createdAt: '1970-01-01T00:00:00.000Z',
      updatedAt: '1970-01-01T00:00:00.000Z',
    })
    expect(presets.slice(1)).toEqual([custom])
  })

  it('self-restores a directly deleted built-in preset without touching custom records', () => {
    const repository = createPresetRepository(localStorage)
    const custom = repository.save('Turbo', createInitialState().structure)
    const stored = JSON.parse(localStorage.getItem(PRESETS_KEY)!) as StructurePreset[]
    localStorage.setItem(PRESETS_KEY, JSON.stringify(stored.filter((preset) => preset.id !== BUILT_IN_PRESET_ID)))

    const presets = createPresetRepository(localStorage).list()

    expect(presets[0]).toMatchObject({ id: BUILT_IN_PRESET_ID, name: 'Princeton Poker Club Standard', structure: sampleStructure })
    expect(presets.slice(1)).toEqual([custom])
  })

  it('preserves every saved level note exactly when a custom preset is listed, loaded, or duplicated', () => {
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

    const repository = createPresetRepository(localStorage, () => Date.parse('2026-08-12T12:00:00.000Z'), () => 'saved-with-old-notes-copy')
    const listed = repository.list().find((preset) => preset.id === persisted.id)!
    const loaded = repository.load(persisted.id)
    const duplicated = repository.duplicate(persisted.id, 'Saved notes copy')

    for (const preserved of [listed.structure, loaded.structure, duplicated.structure]) {
      expect(preserved).toEqual(structure)
      expect(structureNote(preserved, 'level-6')).toBe('BB ante begins')
      expect(structureNote(preserved, 'level-13')).toBe('Final table target · chip up to 100s and 500s')
      expect(structureNote(preserved, 'level-15')).toBe('Expected finish')
      expect(structureNote(preserved, 'level-17')).toBe('Final level')
      expect(structureNote(preserved, 'level-7')).toBe('Custom note to preserve')
    }
  })

  it.each([
    ['a custom preset with the former structure', persistedPreset({ id: 'custom-v1', name: 'Custom' })],
    ['a standard-named preset with a customized structure', persistedPreset({
      structure: [{ ...formerBundledStructure[0], durationSeconds: 1_140 }, ...formerBundledStructure.slice(1)],
    })],
  ])('does not alter %s', (_label, preset) => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify([preset]))

    const presets = createPresetRepository(localStorage).list()

    expect(presets[0]).toMatchObject({ id: BUILT_IN_PRESET_ID, structure: sampleStructure })
    expect(presets.slice(1)).toEqual([preset])
  })
})
