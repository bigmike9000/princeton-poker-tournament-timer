import { formatChips } from '../../domain/calculations'
import type { AnteType } from '../../domain/types'

export function anteLabel(anteType: AnteType, ante: number): string {
  if (anteType === 'none') return 'NO ANTE'
  if (anteType === 'traditional') return `ANTE: ${formatChips(ante)}`
  return `BIG BLIND ANTE: ${formatChips(ante)}`
}
