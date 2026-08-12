import { sampleStructure } from '../domain/sampleStructure'
import type { StructureEntry } from '../domain/types'
import { validatePresetName, validateStructure } from '../domain/validation'
import { isFormerBundledStructure } from './legacyDefaults'
import { parseStructure } from './structureParser'

export const PRESETS_KEY = 'ppc-presets:v1'

export interface StructurePreset {
  id: string
  name: string
  structure: StructureEntry[]
  createdAt: string
  updatedAt: string
}

export interface PresetRepository {
  list(): StructurePreset[]
  save(name: string, structure: StructureEntry[]): StructurePreset
  duplicate(id: string, name: string): StructurePreset
  rename(id: string, name: string): StructurePreset
  remove(id: string): void
  load(id: string): StructurePreset
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isPreset(value: unknown): value is StructurePreset {
  if (typeof value !== 'object' || value === null) return false
  const preset = value as Partial<StructurePreset>
  const structure = parseStructure(preset.structure)
  return typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    typeof preset.createdAt === 'string' &&
    typeof preset.updatedAt === 'string' &&
    structure !== null &&
    validateStructure(structure).valid
}

export function createPresetRepository(
  storage: Storage,
  now: () => number = Date.now,
  idFactory: () => string = makeId,
): PresetRepository {
  const read = (): StructurePreset[] => {
    const raw = storage.getItem(PRESETS_KEY)
    if (raw === null) return []
    try {
      const value = JSON.parse(raw) as unknown
      return Array.isArray(value) ? clone(value.filter(isPreset)) : []
    } catch {
      return []
    }
  }

  const write = (presets: StructurePreset[]) => {
    storage.setItem(PRESETS_KEY, JSON.stringify(presets))
  }

  const create = (name: string, structure: StructureEntry[]): StructurePreset => {
    const presets = read()
    const nameError = validatePresetName(name, presets.map((preset) => preset.name))
    if (nameError) throw new Error(nameError)
    if (!validateStructure(structure).valid) throw new Error('A preset requires a valid structure.')
    const timestamp = new Date(now()).toISOString()
    const preset: StructurePreset = {
      id: idFactory(),
      name: name.trim(),
      structure: clone(structure),
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    write([...presets, preset])
    return clone(preset)
  }

  if (storage.getItem(PRESETS_KEY) === null) {
    const timestamp = new Date(now()).toISOString()
    write([{
      id: idFactory(),
      name: 'Princeton Poker Club Standard',
      structure: clone(sampleStructure),
      createdAt: timestamp,
      updatedAt: timestamp,
    }])
  } else {
    const presets = read()
    const legacyStandard = presets.findIndex((preset) =>
      preset.name === 'Princeton Poker Club Standard' &&
      isFormerBundledStructure(preset.structure))
    if (legacyStandard >= 0) {
      presets[legacyStandard] = {
        ...presets[legacyStandard],
        structure: clone(sampleStructure),
      }
      write(presets)
    }
  }

  return {
    list: () => read(),
    save: create,
    duplicate(id, name) {
      return create(name, this.load(id).structure)
    },
    rename(id, name) {
      const presets = read()
      const index = presets.findIndex((preset) => preset.id === id)
      if (index < 0) throw new Error('Preset was not found.')
      const nameError = validatePresetName(name, presets.map((preset) => preset.name), presets[index].name)
      if (nameError) throw new Error(nameError)
      presets[index] = {
        ...presets[index],
        name: name.trim(),
        updatedAt: new Date(now()).toISOString(),
      }
      write(presets)
      return clone(presets[index])
    },
    remove(id) {
      const presets = read()
      if (!presets.some((preset) => preset.id === id)) throw new Error('Preset was not found.')
      write(presets.filter((preset) => preset.id !== id))
    },
    load(id) {
      const preset = read().find((entry) => entry.id === id)
      if (!preset) throw new Error('Preset was not found.')
      return clone(preset)
    },
  }
}
