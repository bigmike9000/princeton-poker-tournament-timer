import { breakPresentation } from '../../domain/breakPresentation'
import type { StructureEntry } from '../../domain/types'

export function BreakProcedure({ entry }: { entry: StructureEntry }) {
  const subtitle = entry.kind === 'break' ? breakPresentation(entry).subtitle : null
  return (
    <aside
      className={subtitle ? 'break-procedure' : 'break-procedure break-procedure--empty'}
      role="status"
      aria-atomic="true"
    >
      {subtitle}
    </aside>
  )
}
