import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../domain/sampleStructure'
import {
  DEFAULT_TOURNAMENT_INFORMATION,
  selectTournamentInformation,
  validateProjectorInformation,
} from '../domain/tournamentInformation'
import { loadSnapshot, saveSnapshot, SNAPSHOT_KEY } from './snapshot'

function saveRawSnapshot(storage: Storage, state: unknown): void {
  storage.setItem(SNAPSHOT_KEY, JSON.stringify({ version: 1, savedAt: 1_000, state }))
}

function setLevelNote(state: ReturnType<typeof createInitialState>, id: string, note: string): void {
  const entry = state.structure.find((candidate) => candidate.id === id)
  if (entry?.kind !== 'level') throw new Error(`Missing test level ${id}`)
  entry.note = note
}

function noteFor(state: ReturnType<typeof createInitialState>, id: string): string | undefined {
  const entry = state.structure.find((candidate) => candidate.id === id)
  return entry?.kind === 'level' ? entry.note : undefined
}

describe('snapshot persistence', () => {
  beforeEach(() => localStorage.clear())

  it('loads an older valid snapshot without information', () => {
    const state = createInitialState()
    delete state.information
    saveRawSnapshot(localStorage, state)

    const result = loadSnapshot(localStorage, 1_000)

    expect(result.recovered).toBe(false)
    expect(result.state).not.toHaveProperty('information')
    expect(selectTournamentInformation(result.state)).toEqual(DEFAULT_TOURNAMENT_INFORMATION)
  })

  it('round-trips configured tournament information', () => {
    const state = createInitialState()
    state.information = { chipLines: ['A'], prizeLines: ['B'], houseNotes: ['C'] }

    saveSnapshot(localStorage, state, 1_000)

    expect(loadSnapshot(localStorage, 1_000).state.information).toEqual(state.information)
  })

  it('preserves information that is legacy-valid under the old 24 by 160 envelope', () => {
    const state = createInitialState()
    state.information = {
      chipLines: Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}${'x'.repeat(158)}`),
      prizeLines: ['p'.repeat(160)],
      houseNotes: ['h'.repeat(160)],
    }
    saveRawSnapshot(localStorage, state)

    const restored = loadSnapshot(localStorage, 1_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state.information).toEqual(state.information)
    expect(validateProjectorInformation(restored.state.information!)).toMatchObject({ valid: false })
  })

  it.each([
    { chipLines: [7], prizeLines: ['B'], houseNotes: ['C'] },
    { chipLines: ['A'], prizeLines: 'B', houseNotes: ['C'] },
    { chipLines: ['x'.repeat(161)], prizeLines: ['B'], houseNotes: ['C'] },
    { chipLines: ['A'], prizeLines: ['B'], houseNotes: ['C'], extra: [] },
    { chipLines: [''], prizeLines: ['B'], houseNotes: ['C'] },
    { chipLines: Array.from({ length: 25 }, () => 'A'), prizeLines: ['B'], houseNotes: ['C'] },
  ])('recovers safely from malformed information %#', (information) => {
    const state = createInitialState()
    const rawState = { ...state, information }
    saveRawSnapshot(localStorage, rawState)

    const result = loadSnapshot(localStorage, 1_000)

    expect(result.recovered).toBe(true)
    expect(result.state.runtime.currentEntryIndex).toBe(0)
  })

  it('restores a running clock paused under the safe close policy', () => {
    const state = createInitialState()
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000

    saveSnapshot(localStorage, state, 11_000)
    const restored = loadSnapshot(localStorage, 31_000)

    expect(restored.state.runtime.status).toBe('paused')
    expect(restored.state.runtime.baselineAt).toBeNull()
    expect(restored.state.runtime.remainingMs).toBe(50_000)
    expect(restored.recovered).toBe(false)
  })

  it('replays elapsed wall-clock time under the continue policy', () => {
    const state = createInitialState()
    state.settings.closeBehavior = 'continue'
    state.runtime.status = 'running'
    state.runtime.remainingMs = 60_000
    state.runtime.baselineAt = 1_000

    saveSnapshot(localStorage, state, 11_000)
    const restored = loadSnapshot(localStorage, 31_000)

    expect(restored.state.runtime.remainingMs).toBe(30_000)
    expect(restored.state.runtime.baselineAt).toBe(31_000)
    expect(restored.state.runtime.status).toBe('running')
  })

  it('continues through a level boundary while the app is closed', () => {
    const state = createInitialState()
    state.settings.closeBehavior = 'continue'
    state.runtime.status = 'running'
    state.runtime.remainingMs = 1_000
    state.runtime.baselineAt = 1_000

    saveSnapshot(localStorage, state, 1_000)
    const restored = loadSnapshot(localStorage, 3_500)

    expect(restored.state.runtime.currentEntryIndex).toBe(1)
    expect(restored.state.runtime.remainingMs).toBe(718_500)
  })

  it('round-trips a structure with an untimed terminal level', () => {
    const state = createInitialState()

    saveSnapshot(localStorage, state, 10_000)
    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state.structure).toEqual(state.structure)
    expect(restored.state.structure.at(-1)?.durationSeconds).toBeNull()
  })

  it('removes obsolete bundled level notes from an existing saved tournament', () => {
    const state = createInitialState()
    setLevelNote(state, 'level-6', 'BB ante begins')
    setLevelNote(state, 'level-13', 'Final table target · chip up to 100s and 500s')
    setLevelNote(state, 'level-15', 'Expected finish')
    setLevelNote(state, 'level-17', 'Final level')
    setLevelNote(state, 'level-7', 'Custom note to preserve')
    saveRawSnapshot(localStorage, state)

    const restored = loadSnapshot(localStorage, 1_000)

    expect(restored.recovered).toBe(false)
    expect(noteFor(restored.state, 'level-6')).toBeUndefined()
    expect(noteFor(restored.state, 'level-13')).toBeUndefined()
    expect(noteFor(restored.state, 'level-15')).toBeUndefined()
    expect(noteFor(restored.state, 'level-17')).toBeUndefined()
    expect(noteFor(restored.state, 'level-7')).toBe('Custom note to preserve')
  })

  it('preserves custom text on a migrated ID and obsolete text on another ID', () => {
    const state = createInitialState()
    setLevelNote(state, 'level-6', 'BB ante begins after dinner')
    setLevelNote(state, 'level-7', 'Expected finish')
    saveRawSnapshot(localStorage, state)

    const restored = loadSnapshot(localStorage, 1_000)

    expect(noteFor(restored.state, 'level-6')).toBe('BB ante begins after dinner')
    expect(noteFor(restored.state, 'level-7')).toBe('Expected finish')
  })

  it('restores a valid running untimed level without inventing countdown state', () => {
    const state = createInitialState()
    state.settings.closeBehavior = 'continue'
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = 'running'
    state.runtime.remainingMs = 0
    state.runtime.baselineAt = null
    state.runtime.alertedThresholds = []
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ version: 1, savedAt: 10_000, state }))

    const restored = loadSnapshot(localStorage, 30_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state.runtime).toMatchObject({
      currentEntryIndex: state.structure.length - 1,
      status: 'running',
      remainingMs: 0,
      baselineAt: null,
      alertedThresholds: [],
    })
  })

  it.each([
    ['running', 'running'],
    ['paused', 'paused'],
    ['complete', 'paused'],
  ] as const)('canonicalizes malformed %s untimed progress to resumable %s state', (status, expectedStatus) => {
    const state = createInitialState()
    state.settings.closeBehavior = 'continue'
    state.runtime.currentEntryIndex = state.structure.length - 1
    state.runtime.status = status
    state.runtime.remainingMs = 123_456
    state.runtime.baselineAt = 9_000
    state.runtime.alertedThresholds = [300_000, 60_000]
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ version: 1, savedAt: 10_000, state }))

    const restored = loadSnapshot(localStorage, 30_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state.runtime).toMatchObject({
      currentEntryIndex: state.structure.length - 1,
      status: expectedStatus,
      remainingMs: 0,
      baselineAt: null,
      alertedThresholds: [],
    })
  })

  it('returns safe defaults and a recovery warning for malformed storage', () => {
    localStorage.setItem(SNAPSHOT_KEY, '{not-json')

    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(true)
    expect(restored.error).toMatch(/saved tournament/i)
    expect(restored.state.runtime.currentEntryIndex).toBe(0)
  })

  it('returns fresh state when no snapshot exists', () => {
    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state.configuration.tournamentName).toBe('Princeton Poker Club Standard')
  })

  it('rejects semantically invalid progress and structure data', () => {
    const state = createInitialState()
    state.runtime.playersRemaining = 2.5
    saveSnapshot(localStorage, state, 10_000)

    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(true)
    expect(restored.error).toMatch(/saved tournament/i)

    const malformedStructure = createInitialState()
    malformedStructure.structure[1].id = malformedStructure.structure[0].id
    saveSnapshot(localStorage, malformedStructure, 10_000)
    const structureResult = loadSnapshot(localStorage, 10_000)

    expect(structureResult.recovered).toBe(true)
    expect(structureResult.state.structure[0].id).toBe('level-1')
  })
})
