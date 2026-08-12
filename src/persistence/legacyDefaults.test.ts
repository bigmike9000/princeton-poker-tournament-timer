import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState, sampleStructure } from '../domain/sampleStructure'
import type { StructureEntry, TournamentState } from '../domain/types'
import {
  isFormerBundledStructure,
  isUntouchedFormerDefault,
} from './legacyDefaults'
import { loadSnapshot, saveSnapshot } from './snapshot'

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

function formerDefaultState(): TournamentState {
  const state = createInitialState()
  state.configuration.startingStack = 30_000
  state.structure = structuredClone(formerBundledStructure)
  state.runtime.remainingMs = 1_200_000
  state.chipLedger = [{ id: 'initial-chips', kind: 'initial', chips: 2_400_000 }]
  return state
}

describe('former bundled defaults', () => {
  beforeEach(() => localStorage.clear())

  it('matches the former bundled structure by deep value', () => {
    expect(isFormerBundledStructure(structuredClone(formerBundledStructure))).toBe(true)

    const customized = structuredClone(formerBundledStructure)
    customized[0].durationSeconds = 1_140
    expect(isFormerBundledStructure(customized)).toBe(false)
  })

  it('replaces only untouched former default progress with the current default', () => {
    const legacy = formerDefaultState()
    expect(isUntouchedFormerDefault(legacy)).toBe(true)
    saveSnapshot(localStorage, legacy, 10_000)

    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state.configuration.startingStack).toBe(200)
    expect(restored.state.structure).toEqual(sampleStructure)
  })

  it.each([
    ['progressed to index one', (state: TournamentState) => { state.runtime.currentEntryIndex = 1 }],
    ['progressed to 79 players', (state: TournamentState) => { state.runtime.playersRemaining = 79 }],
    ['customized its structure', (state: TournamentState) => { state.structure[0].durationSeconds = 1_140 }],
    ['customized its organization metadata', (state: TournamentState) => { state.configuration.organizationName = 'PPC ALUMNI' }],
    ['customized its sponsor labels', (state: TournamentState) => { state.configuration.sponsorLabels[0] = 'LOCAL SPONSOR' }],
    ['customized its settings', (state: TournamentState) => { state.settings.muted = true }],
    ['edited its remaining time', (state: TournamentState) => { state.runtime.remainingMs = 1_199_000 }],
    ['stored a runtime baseline', (state: TournamentState) => { state.runtime.baselineAt = 9_000 }],
    ['recorded an alert threshold', (state: TournamentState) => { state.runtime.alertedThresholds = [300_000] }],
    ['recorded a transition cause', (state: TournamentState) => { state.runtime.transitionCause = 'manual' }],
    ['customized its chip ledger', (state: TournamentState) => {
      state.chipLedger.push({ id: 'addon-1', kind: 'addon', chips: 20_000 })
    }],
  ])('preserves a former state that has %s', (_label, customize) => {
    const legacy = formerDefaultState()
    customize(legacy)
    saveSnapshot(localStorage, legacy, 10_000)

    const restored = loadSnapshot(localStorage, 10_000)

    expect(restored.recovered).toBe(false)
    expect(restored.state).toEqual(legacy)
    expect(isUntouchedFormerDefault(legacy)).toBe(false)
  })
})
