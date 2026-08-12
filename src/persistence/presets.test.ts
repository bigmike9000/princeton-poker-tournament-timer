import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import { createPresetRepository } from './presets'

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
})
