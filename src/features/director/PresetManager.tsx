import { useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { Dialog } from '../../components/Dialog'
import { createPresetRepository, isBuiltInPreset, type PresetRepository, type StructurePreset } from '../../persistence/presets'

interface PresetRowProps {
  preset: StructurePreset
  onLoad: () => void
  onDuplicate: () => void
  onRename: (name: string) => void
  onDelete: () => void
}

function PresetRow({ preset, onLoad, onDuplicate, onRename, onDelete }: PresetRowProps) {
  const [name, setName] = useState(preset.name)
  const builtIn = isBuiltInPreset(preset)
  const levels = preset.structure.filter((entry) => entry.kind === 'level').length
  const breaks = preset.structure.length - levels

  return (
    <article className="preset-row" role="group" aria-label={`Preset ${preset.name}`}>
      <div className="preset-symbol" aria-hidden="true"><strong>{String(levels).padStart(2, '0')}</strong><span>Levels</span></div>
      <div className="preset-details">
        <div className="preset-name-row">
          <label><span>Preset name</span><input value={name} maxLength={60} readOnly={builtIn} onChange={(event) => setName(event.target.value)} /></label>
          {builtIn && <span className="preset-built-in">Built-in</span>}
        </div>
        <p>{levels} levels · {breaks} breaks · Updated {new Date(preset.updatedAt).toLocaleDateString()}</p>
      </div>
      <div className="preset-actions">
        <button onClick={onLoad}>Load</button>
        <button onClick={onDuplicate}>Duplicate</button>
        {!builtIn && <button onClick={() => onRename(name)}>Rename</button>}
        {!builtIn && <button className="delete-preset" onClick={onDelete}>Delete</button>}
      </div>
    </article>
  )
}

export function PresetManager() {
  const { state, dispatch } = useTournament()
  const [initialRepository] = useState<{
    repository: PresetRepository | null
    presets: StructurePreset[]
    error: string | null
  }>(() => {
    try {
      const repository = createPresetRepository(localStorage)
      return { repository, presets: repository.list(), error: null }
    } catch {
      return {
        repository: null,
        presets: [],
        error: 'Presets are unavailable because this browser cannot access local storage.',
      }
    }
  })
  const repository = initialRepository.repository
  const [presets, setPresets] = useState(initialRepository.presets)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(initialRepository.error)
  const [pendingLoad, setPendingLoad] = useState<StructurePreset | null>(null)
  const [pendingDelete, setPendingDelete] = useState<StructurePreset | null>(null)

  const refresh = (activeRepository: PresetRepository) => setPresets(activeRepository.list())
  const run = (operation: (activeRepository: PresetRepository) => void) => {
    if (repository === null) return
    try {
      operation(repository)
      setError(null)
      refresh(repository)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Preset operation failed.')
    }
  }

  const duplicateName = (base: string): string => {
    const names = new Set(presets.map((preset) => preset.name.toLocaleLowerCase()))
    let name = `${base} Copy`
    let suffix = 2
    while (names.has(name.toLocaleLowerCase())) {
      name = `${base} Copy ${suffix}`
      suffix += 1
    }
    return name
  }

  const loadPreset = (preset: StructurePreset, now: number) => {
    const progressed = state.runtime.currentEntryIndex !== 0 ||
      state.runtime.status !== 'idle' ||
      state.runtime.playersRemaining !== state.configuration.startingPlayers
    if (progressed) {
      setPendingLoad(preset)
      return
    }
    dispatch({ type: 'SET_STRUCTURE', structure: preset.structure, now })
    dispatch({ type: 'RESET_PROGRESS', now })
  }

  return (
    <div className="director-section preset-manager">
      <div className="section-intro">
        <div><span className="section-kicker">Saved structures</span><h2>Presets</h2></div>
      </div>

      <section className="save-preset-card">
        <div className="current-structure-summary"><span>Current structure</span><strong>{state.structure.filter((entry) => entry.kind === 'level').length} levels · {state.structure.filter((entry) => entry.kind === 'break').length} breaks</strong></div>
        <label><span>New preset name</span><input disabled={repository === null} value={newName} maxLength={60} placeholder="e.g. Turbo Tournament" onChange={(event) => setNewName(event.target.value)} /></label>
        <button disabled={repository === null} className="primary-action" onClick={() => run((activeRepository) => { activeRepository.save(newName, state.structure); setNewName('') })}>Save current structure</button>
      </section>

      {error && <p role="alert" className="validation-banner">{error}</p>}

      <div className="preset-list">
        {presets.map((preset) => (
          <PresetRow
            key={preset.id}
            preset={preset}
            onLoad={() => loadPreset(preset, Date.now())}
            onDuplicate={() => run((activeRepository) => { activeRepository.duplicate(preset.id, duplicateName(preset.name)) })}
            onRename={(name) => run((activeRepository) => { activeRepository.rename(preset.id, name) })}
            onDelete={() => setPendingDelete(preset)}
          />
        ))}
        {presets.length === 0 && <div className="empty-presets"><strong>No saved presets</strong><p>Save the current structure to create one.</p></div>}
      </div>

      {pendingDelete && (
        <Dialog
          title="Delete this preset?"
          description={`“${pendingDelete.name}” will be permanently removed. The live tournament is not affected.`}
          confirmLabel="Confirm preset deletion"
          destructive
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => run((activeRepository) => { activeRepository.remove(pendingDelete.id); setPendingDelete(null) })}
        />
      )}
      {pendingLoad && (
        <Dialog
          title="Load this preset?"
          description={`Loading “${pendingLoad.name}” replaces the blind structure and resets level, clock, and player progress.`}
          confirmLabel="Confirm preset load"
          destructive
          onCancel={() => setPendingLoad(null)}
          onConfirm={() => {
            dispatch({ type: 'SET_STRUCTURE', structure: pendingLoad.structure, now: Date.now() })
            dispatch({ type: 'RESET_PROGRESS', now: Date.now() })
            setPendingLoad(null)
          }}
        />
      )}
    </div>
  )
}
