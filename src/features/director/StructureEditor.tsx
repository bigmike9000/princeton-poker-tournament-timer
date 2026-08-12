import { useState } from 'react'
import { useTournament } from '../../app/useTournament'
import { Dialog } from '../../components/Dialog'
import type { PokerLevel, StructureEntry } from '../../domain/types'
import { validateStructure } from '../../domain/validation'
import { StructureRow } from './StructureRow'

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
    const previous = [...draft].reverse().find((entry): entry is PokerLevel => entry.kind === 'level')
    setDraft((current) => [...current, {
      id: newId('level'),
      kind: 'level',
      durationSeconds: previous?.durationSeconds ?? 1_200,
      smallBlind: previous?.bigBlind ?? 100,
      bigBlind: previous ? previous.bigBlind * 2 : 200,
      ante: previous ? previous.bigBlind * 2 : 200,
      anteType: 'big-blind',
    }])
  }

  const addBreak = () => {
    setDraft((current) => [...current, {
      id: newId('break'),
      kind: 'break',
      durationSeconds: 900,
      label: 'Break',
    }])
  }

  return (
    <div className="director-section structure-editor">
      <div className="structure-editor-heading">
        <div className="section-intro">
          <div><span className="section-kicker">Blind schedule</span><h2>Structure editor</h2><p>Edit a draft, validate it, then apply every change at once.</p></div>
        </div>
        <div className="structure-add-actions">
          <button onClick={addLevel}>+ Add level</button>
          <button aria-label="Insert break" onClick={addBreak}>+ Insert break</button>
        </div>
      </div>

      {validation.issues.some((issue) => issue.entryId === 'structure') && (
        <p role="alert" className="validation-banner">Add at least one valid poker level before applying.</p>
      )}

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

      <div className="structure-sticky-actions">
        <span>{draft.length} entries · {validation.valid ? 'Ready to apply' : `${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}</span>
        <button className="secondary-action" onClick={() => setDraft(structuredClone(state.structure))}>Cancel changes</button>
        <button
          className="primary-action"
          disabled={!validation.valid}
          onClick={() => dispatch({ type: 'SET_STRUCTURE', structure: draft, now: Date.now() })}
        >Apply structure</button>
      </div>

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
