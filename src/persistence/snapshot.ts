import { createInitialState } from '../domain/sampleStructure'
import { resolveTimer } from '../domain/timer'
import type { StructureEntry, TournamentState } from '../domain/types'
import { validateStructure } from '../domain/validation'
import { isUntouchedFormerDefault } from './legacyDefaults'

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

function isStructureEntry(value: unknown): value is StructureEntry {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return false
  }
  if (value.kind === 'break') {
    return typeof value.label === 'string' &&
      isFiniteNonnegative(value.durationSeconds) &&
      value.durationSeconds > 0
  }
  if (value.kind !== 'level') return false
  return isFiniteNonnegative(value.smallBlind) &&
    isFiniteNonnegative(value.bigBlind) &&
    isFiniteNonnegative(value.ante) &&
    ['none', 'traditional', 'big-blind'].includes(String(value.anteType)) &&
    (value.durationSeconds === null ||
      (isFiniteNonnegative(value.durationSeconds) && value.durationSeconds > 0)) &&
    (value.note === undefined ||
      (typeof value.note === 'string' && value.note.length <= 80))
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
  const structure = state.structure
  const chipLedger = state.chipLedger

  if (typeof configuration.organizationName !== 'string' ||
      typeof configuration.tournamentName !== 'string' ||
      !Number.isInteger(configuration.startingPlayers) || Number(configuration.startingPlayers) < 1 ||
      !Number.isInteger(configuration.startingStack) || Number(configuration.startingStack) < 1 ||
      !Array.isArray(configuration.sponsorLabels) ||
      !configuration.sponsorLabels.every((label) => typeof label === 'string')) {
    throw new Error('Saved tournament configuration is invalid.')
  }

  if (!Array.isArray(structure) || structure.length === 0 || !structure.every(isStructureEntry) ||
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
    if (snapshot.state.settings.closeBehavior === 'continue') {
      return {
        state: resolveTimer(snapshot.state, now),
        recovered: false,
      }
    }

    if (snapshot.state.runtime.status === 'running') {
      return {
        state: {
          ...snapshot.state,
          runtime: {
            ...snapshot.state.runtime,
            status: 'paused',
            baselineAt: null,
          },
        },
        recovered: false,
      }
    }

    return { state: snapshot.state, recovered: false }
  } catch {
    return {
      state: createInitialState(),
      recovered: true,
      error: 'The saved tournament could not be read. Safe defaults were loaded.',
    }
  }
}
