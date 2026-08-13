import { breakPresentation } from '../../domain/breakPresentation'
import type { StructureEntry } from '../../domain/types'

export function BreakProcedure({ entry }: { entry: StructureEntry }) {
  if (entry.kind !== 'break') return null
  const { subtitle } = breakPresentation(entry)
  if (!subtitle) return null
  return (
    <aside className="break-procedure" role="status" aria-label="Break procedure">
      <span>Break procedure</span>
      <strong>{subtitle}</strong>
    </aside>
  )
}
