import { createInitialState } from '../domain/sampleStructure'
import { isUntimedEntry } from '../domain/structure'
import { resolveTimer } from '../domain/timer'
import type { TournamentState } from '../domain/types'
import { validateStructure } from '../domain/validation'
import { isUntouchedFormerDefault } from './legacyDefaults'
import { parseStructure } from './structureParser'

export const SNAPSHOT_KEY = 'ppc-tournament:v1'
const SNAPSHOT_VERSION = 1

interface Snapshot {
  version: typeof SNAPSHOT_VERSION
  savedAt: number
  state: TournamentState
}

export interface LoadResult {
  state: TournamentState
  recovered: boolean
  error?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isInformationLines(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.length <= 24 &&
    value.every((line) => typeof line === 'string' && line.length > 0 && line.length <= 160)
}

function isTournamentInformation(value: unknown): boolean {
  if (!isRecord(value)) return false
  const keys = Object.keys(value).sort()
  return keys.length === 3 &&
    keys[0] === 'chipLines' &&
    keys[1] === 'houseNotes' &&
    keys[2] === 'prizeLines' &&
    isInformationLines(value.chipLines) &&
    isInformationLines(value.prizeLines) &&
    isInformationLines(value.houseNotes)
}

function parseSnapshot(value: unknown): Snapshot {
  if (!isRecord(value) || value.version !== SNAPSHOT_VERSION || !isFiniteNonnegative(value.savedAt)) {
    throw new Error('Unsupported saved tournament format.')
  }

  const state = value.state
  if (!isRecord(state) || !isRecord(state.configuration) || !isRecord(state.runtime) || !isRecord(state.settings)) {
    throw new Error('Saved tournament is missing required data.')
  }

  const configuration = state.configuration
  const runtime = state.runtime
  const settings = state.settings
  const structure = parseStructure(state.structure)
  const chipLedger = state.chipLedger
  const information = state.information

  if (typeof configuration.organizationName !== 'string' ||
      typeof configuration.tournamentName !== 'string' ||
      !Number.isInteger(configuration.startingPlayers) || Number(configuration.startingPlayers) < 1 ||
      !Number.isInteger(configuration.startingStack) || Number(configuration.startingStack) < 1 ||
      !Array.isArray(configuration.sponsorLabels) ||
      !configuration.sponsorLabels.every((label) => typeof label === 'string')) {
    throw new Error('Saved tournament configuration is invalid.')
  }

  if (structure === null || structure.length === 0 ||
      !validateStructure(structure).valid) {
    throw new Error('Saved tournament structure is invalid.')
  }

  if (!Number.isInteger(runtime.currentEntryIndex) ||
      Number(runtime.currentEntryIndex) < 0 || Number(runtime.currentEntryIndex) >= structure.length ||
      !['idle', 'running', 'paused', 'complete'].includes(String(runtime.status)) ||
      !isFiniteNonnegative(runtime.remainingMs) ||
      !(runtime.baselineAt === null || isFiniteNonnegative(runtime.baselineAt)) ||
      !Number.isInteger(runtime.playersRemaining) || Number(runtime.playersRemaining) < 1 ||
      Number(runtime.playersRemaining) > Number(configuration.startingPlayers) ||
      !Array.isArray(runtime.alertedThresholds) ||
      !runtime.alertedThresholds.every(isFiniteNonnegative) ||
      !(runtime.transitionCause === undefined || runtime.transitionCause === null ||
        ['automatic', 'manual'].includes(String(runtime.transitionCause)))) {
    throw new Error('Saved tournament progress is invalid.')
  }

  if (!Array.isArray(chipLedger) || !chipLedger.every((entry) =>
    isRecord(entry) &&
    typeof entry.id === 'string' &&
    ['initial', 'reentry', 'addon'].includes(String(entry.kind)) &&
    Number.isInteger(entry.chips) && Number(entry.chips) >= 0)) {
    throw new Error('Saved tournament chip ledger is invalid.')
  }

  if (information !== undefined && !isTournamentInformation(information)) {
    throw new Error('Saved tournament information is invalid.')
  }

  const booleanSettings = [
    'autoAdvance',
    'muted',
    'alertAtFiveMinutes',
    'alertAtOneMinute',
    'alertLevelComplete',
    'alertBreakBeginning',
    'alertBreakEnding',
  ]
  if (!booleanSettings.every((key) => typeof settings[key] === 'boolean') ||
      !['pause', 'continue'].includes(String(settings.closeBehavior))) {
    throw new Error('Saved tournament settings are invalid.')
  }

  const snapshot = structuredClone(value) as unknown as Snapshot
  snapshot.state.runtime.transitionCause ??= null
  return snapshot
}

function canonicalizeUntimedRuntime(state: TournamentState): TournamentState {
  const currentEntry = state.structure[state.runtime.currentEntryIndex]
  if (!isUntimedEntry(currentEntry)) return state

  return {
    ...state,
    runtime: {
      ...state.runtime,
      status: state.runtime.status === 'complete' ? 'paused' : state.runtime.status,
      remainingMs: 0,
      baselineAt: null,
      alertedThresholds: [],
    },
  }
}

export function saveSnapshot(storage: Storage, state: TournamentState, savedAt: number): void {
  const resolved = resolveTimer(state, savedAt)
  const snapshot: Snapshot = {
    version: SNAPSHOT_VERSION,
    savedAt,
    state: resolved,
  }
  storage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function loadSnapshot(storage: Storage, now: number): LoadResult {
  const raw = storage.getItem(SNAPSHOT_KEY)
  if (raw === null) {
    return { state: createInitialState(), recovered: false }
  }

  try {
    const snapshot = parseSnapshot(JSON.parse(raw) as unknown)
    if (isUntouchedFormerDefault(snapshot.state)) {
      return { state: createInitialState(), recovered: false }
    }
    const state = canonicalizeUntimedRuntime(snapshot.state)
    if (state.settings.closeBehavior === 'continue') {
      return {
        state: resolveTimer(state, now),
        recovered: false,
      }
    }

    if (state.runtime.status === 'running') {
      return {
        state: {
          ...state,
          runtime: {
            ...state.runtime,
            status: 'paused',
            baselineAt: null,
          },
        },
        recovered: false,
      }
    }

    return { state, recovered: false }
  } catch {
    return {
      state: createInitialState(),
      recovered: true,
      error: 'The saved tournament could not be read. Safe defaults were loaded.',
    }
  }
}
