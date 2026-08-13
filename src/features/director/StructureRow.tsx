import type { StructureEntry } from '../../domain/types'
import type { ValidationIssue } from '../../domain/validation'

interface StructureRowProps {
  entry: StructureEntry
  label: string
  tone: 'odd' | 'even'
  index: number
  total: number
  issues: ValidationIssue[]
  onChange: (entry: StructureEntry) => void
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
}

function FieldIssue({ field, issues }: { field: string; issues: ValidationIssue[] }) {
  const issue = issues.find((candidate) => candidate.field === field)
  return issue ? <small className="structure-field-error">{issue.message}</small> : null
}

export function StructureRow({
  entry,
  label,
  tone,
  index,
  total,
  issues,
  onChange,
  onMove,
  onDelete,
}: StructureRowProps) {
  const [kind, number] = label.split(' ')
  const displayLabel = `${kind} ${String(Number(number)).padStart(2, '0')}`

  const updateNumber = (field: string, value: string) => {
    onChange({ ...entry, [field]: Number(value) } as StructureEntry)
  }

  return (
    <fieldset className={`structure-editor-row structure-editor-row--${entry.kind}`} aria-label={label} data-row-tone={tone}>
      <legend className="structure-row-legend">{label}</legend>
      <div className="structure-row-grid">
        <div className="structure-row-identity" aria-hidden="true">
          <strong>{displayLabel}</strong>
        </div>

        {entry.kind === 'level' ? (
          <>
            <div className="structure-cell structure-duration-field">
              <span className="structure-cell-label">Duration minutes</span>
              {entry.durationSeconds !== null ? (
                <input aria-label="Duration minutes" type="number" min="1" step="1" value={entry.durationSeconds / 60} onChange={(event) => updateNumber('durationSeconds', String(Number(event.target.value) * 60))} />
              ) : (
                <span className="structure-untimed-duration" aria-label="Untimed level">—</span>
              )}
              <FieldIssue field="durationSeconds" issues={issues} />
            </div>
            <label className="structure-cell structure-small-blind">
              <span className="structure-cell-label">Small blind</span>
              <input aria-label="Small blind" type="number" min="0" step="1" value={entry.smallBlind} onChange={(event) => updateNumber('smallBlind', event.target.value)} />
              <FieldIssue field="smallBlind" issues={issues} />
            </label>
            <label className="structure-cell structure-big-blind">
              <span className="structure-cell-label">Big blind</span>
              <input aria-label="Big blind" type="number" min="1" step="1" value={entry.bigBlind} onChange={(event) => updateNumber('bigBlind', event.target.value)} />
              <FieldIssue field="bigBlind" issues={issues} />
            </label>
            <label className="structure-cell structure-ante">
              <span className="structure-cell-label">Ante</span>
              <input aria-label="Ante" type="number" min="0" step="1" value={entry.ante} onChange={(event) => updateNumber('ante', event.target.value)} />
              <FieldIssue field="ante" issues={issues} />
            </label>
            <label className="structure-cell structure-ante-type">
              <span className="structure-cell-label">Ante type</span>
              <select
                aria-label="Ante type"
                value={entry.anteType}
                onChange={(event) => {
                  const anteType = event.target.value as typeof entry.anteType
                  onChange({ ...entry, anteType, ante: anteType === 'none' ? 0 : Math.max(entry.ante, entry.bigBlind) })
                }}
              >
                <option value="none">None</option>
                <option value="traditional">Traditional ante</option>
                <option value="big-blind">Big Blind Ante</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <div className="structure-cell structure-duration-field">
              <span className="structure-cell-label">Duration minutes</span>
              <input aria-label="Duration minutes" type="number" min="1" step="1" value={entry.durationSeconds / 60} onChange={(event) => updateNumber('durationSeconds', String(Number(event.target.value) * 60))} />
              <FieldIssue field="durationSeconds" issues={issues} />
            </div>
            <label className="structure-cell structure-break-label">
              <span className="structure-cell-label">Break label</span>
              <input aria-label="Break label" value={entry.label} maxLength={30} onChange={(event) => onChange({ ...entry, label: event.target.value })} />
              <FieldIssue field="label" issues={issues} />
            </label>
          </>
        )}

        <div className="structure-cell structure-actions-cell">
          <span className="structure-cell-label" aria-hidden="true">Actions</span>
          <div className="row-order-actions">
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
            <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
            <button type="button" aria-label="Delete" className="delete-entry" onClick={onDelete}>×</button>
          </div>
        </div>
      </div>
    </fieldset>
  )
}
