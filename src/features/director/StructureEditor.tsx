import { useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { Dialog } from '../../components/Dialog'
import { durationLabel } from '../../domain/structure'
import type { PokerLevel, StructureEntry } from '../../domain/types'
import { validateStructure } from '../../domain/validation'
import { selectEntryLabel } from '../../state/selectors'
import { ResetControls } from './ResetControls'
import { StructureRow } from './StructureRow'
import { TimeEditor } from './TimeEditor'

function newId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function StructureEditor() {
  const { state, dispatch } = useTournament()
  const [draft, setDraft] = useState<StructureEntry[]>(() => structuredClone(state.structure))
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const validation = validateStructure(draft)

  const updateEntry = (index: number, entry: StructureEntry) => {
    setDraft((current) => current.map((candidate, candidateIndex) => candidateIndex === index ? entry : candidate))
  }

  const moveEntry = (index: number, delta: -1 | 1) => {
    setDraft((current) => {
      const target = Math.max(0, Math.min(current.length - 1, index + delta))
      if (target === index) return current
      const next = structuredClone(current)
      const [entry] = next.splice(index, 1)
      next.splice(target, 0, entry)
      return next
    })
  }

  const deleteEntry = (index: number) => {
    const liveCurrentId = state.structure[state.runtime.currentEntryIndex]?.id
    if (draft[index]?.id === liveCurrentId) {
      setDeleteIndex(index)
      return
    }
    setDraft((current) => current.filter((_, candidateIndex) => candidateIndex !== index))
  }

  const addLevel = () => {
    setDraft((current) => {
      const previous = [...current].reverse().find((entry): entry is PokerLevel => entry.kind === 'level')
      const level: PokerLevel = {
        id: newId('level'),
        kind: 'level',
        durationSeconds: previous?.durationSeconds ?? 900,
        smallBlind: previous?.bigBlind ?? 100,
        bigBlind: previous ? previous.bigBlind * 2 : 200,
        ante: previous ? previous.bigBlind * 2 : 200,
        anteType: 'big-blind',
      }
      const untimedIndex = current.findIndex((entry) => entry.kind === 'level' && entry.durationSeconds === null)
      return untimedIndex === -1
        ? [...current, level]
        : [...current.slice(0, untimedIndex), level, ...current.slice(untimedIndex)]
    })
  }

  const addBreak = () => {
    setDraft((current) => {
      const breakEntry: StructureEntry = {
        id: newId('break'),
        kind: 'break',
        durationSeconds: 600,
        label: '',
      }
      const untimedIndex = current.findIndex((entry) => entry.kind === 'level' && entry.durationSeconds === null)
      return untimedIndex === -1
        ? [...current, breakEntry]
        : [...current.slice(0, untimedIndex), breakEntry, ...current.slice(untimedIndex)]
    })
  }

  const applyStructure = () => {
    dispatch({ type: 'SET_STRUCTURE', structure: structuredClone(draft), now: Date.now() })
  }

  return (
    <div className="director-section structure-editor">
      <div className="structure-live-tools">
        <div className="section-intro structure-live-heading">
          <div>
            <span className="section-kicker">Current level</span>
            <h2>{selectEntryLabel(state, state.runtime.currentEntryIndex)}</h2>
            <p>Entry {state.runtime.currentEntryIndex + 1} of {state.structure.length} · {durationLabel(state.structure[state.runtime.currentEntryIndex])}</p>
          </div>
        </div>
        <TimeEditor key={state.structure[state.runtime.currentEntryIndex].id} />
      </div>

      <div className="structure-editor-heading">
        <div className="section-intro">
          <div><span className="section-kicker">Blind schedule</span><h2>Structure editor</h2></div>
        </div>
        <div className="structure-add-actions">
          <button onClick={addLevel}>+ Add level</button>
          <button aria-label="Insert break" onClick={addBreak}>+ Insert break</button>
        </div>
      </div>

      {validation.issues.some((issue) => issue.entryId === 'structure') && (
        <p role="alert" className="validation-banner">Add at least one valid poker level before applying.</p>
      )}

      <div className="structure-editor-table">
        <div className="structure-editor-columns" aria-hidden="true">
          <span>Level</span>
          <span>Minutes</span>
          <span>SB</span>
          <span>BB</span>
          <span>Ante type</span>
          <span>Ante</span>
          <span>Actions</span>
        </div>
        <div className="structure-editor-list">
          {draft.map((entry, index) => {
            const entryNumber = draft
              .slice(0, index + 1)
              .filter((candidate) => candidate.kind === entry.kind)
              .length
            const label = entry.kind === 'level' ? `Level ${entryNumber}` : `Break ${entryNumber}`
            return (
              <StructureRow
                key={entry.id}
                entry={entry}
                label={label}
                tone={index % 2 === 0 ? 'odd' : 'even'}
                index={index}
                total={draft.length}
                issues={validation.issues.filter((issue) => issue.entryId === entry.id)}
                onChange={(next) => updateEntry(index, next)}
                onMove={(delta) => moveEntry(index, delta)}
                onDelete={() => deleteEntry(index)}
              />
            )
          })}
        </div>
      </div>

      <div className="structure-sticky-actions">
        <span>{draft.length} entries · {validation.valid ? 'Ready to apply' : `${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}</span>
        <button className="secondary-action" onClick={() => setDraft(structuredClone(state.structure))}>Cancel changes</button>
        <button
          className="primary-action"
          disabled={!validation.valid}
          onClick={applyStructure}
        >Apply structure</button>
      </div>

      <ResetControls />

      {deleteIndex !== null && draft[deleteIndex] && (
        <Dialog
          title="Delete the current entry?"
          description="The live tournament will move to the nearest remaining entry when this draft is applied."
          confirmLabel="Confirm entry deletion"
          destructive
          onCancel={() => setDeleteIndex(null)}
          onConfirm={() => { setDraft((current) => current.filter((_, index) => index !== deleteIndex)); setDeleteIndex(null) }}
        />
      )}
    </div>
  )
}
