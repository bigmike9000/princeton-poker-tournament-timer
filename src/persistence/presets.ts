import { sampleStructure } from '../domain/sampleStructure'
import type { StructureEntry } from '../domain/types'
import { validatePresetName, validateStructure } from '../domain/validation'
import { isFormerBundledStructure } from './legacyDefaults'
import { parseStructure } from './structureParser'

export const PRESETS_KEY = 'ppc-presets:v1'
export const BUILT_IN_PRESET_ID = 'ppc-standard-v1'
export const BUILT_IN_PRESET_NAME = 'Princeton Poker Club Standard'

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

export function isBuiltInPreset(value: StructurePreset | string): boolean {
  return (typeof value === 'string' ? value : value.id) === BUILT_IN_PRESET_ID
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `preset-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isPreset(value: unknown): value is StructurePreset {
  if (typeof value !== 'object' || value === null) return false
  const preset = value as Partial<StructurePreset>
  const structure = parseStructure(preset.structure)
  return typeof preset.id === 'string' &&
    typeof preset.name === 'string' &&
    isTimestamp(preset.createdAt) &&
    isTimestamp(preset.updatedAt) &&
    structure !== null &&
    validateStructure(structure).valid
}

export function createPresetRepository(
  storage: Storage,
  now: () => number = Date.now,
  idFactory: () => string = makeId,
): PresetRepository {
  const write = (presets: StructurePreset[]) => {
    storage.setItem(PRESETS_KEY, JSON.stringify(presets))
  }

  const read = (): StructurePreset[] => {
    const raw = storage.getItem(PRESETS_KEY)
    const parsed = (() => {
      try {
        const value = raw === null ? [] : JSON.parse(raw) as unknown
        return Array.isArray(value)
          ? clone(value.filter(isPreset))
          : []
      } catch {
        return []
      }
    })()

    const formerBundledIndex = parsed.findIndex((preset) =>
      preset.name === BUILT_IN_PRESET_NAME && isFormerBundledStructure(preset.structure))
    const persisted = parsed
    const stablePresets = persisted.filter((preset) => isBuiltInPreset(preset))
    const replacedPresets = stablePresets.concat(formerBundledIndex >= 0 ? [persisted[formerBundledIndex]] : [])
    const createdAt = replacedPresets
      .map((preset) => preset.createdAt)
      .filter((timestamp) => Number.isFinite(Date.parse(timestamp)))
      .sort((left, right) => Date.parse(left) - Date.parse(right))[0] ?? new Date(now()).toISOString()
    const timestamp = new Date(now()).toISOString()
    const builtIn: StructurePreset = {
      id: BUILT_IN_PRESET_ID,
      name: BUILT_IN_PRESET_NAME,
      structure: clone(sampleStructure),
      createdAt,
      updatedAt: stablePresets[0]?.updatedAt ?? timestamp,
    }
    const normalized = [
      builtIn,
      ...persisted.filter((preset, index) => !isBuiltInPreset(preset) && index !== formerBundledIndex),
    ]

    if (raw === null || JSON.stringify(persisted) !== JSON.stringify(normalized)) write(normalized)
    return clone(normalized)
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

  return {
    list: () => read(),
    save: create,
    duplicate(id, name) {
      return create(name, this.load(id).structure)
    },
    rename(id, name) {
      if (isBuiltInPreset(id)) throw new Error('The built-in preset cannot be renamed.')
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
      if (isBuiltInPreset(id)) throw new Error('The built-in preset cannot be deleted.')
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
