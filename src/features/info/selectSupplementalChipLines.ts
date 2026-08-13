const CANONICAL_LINE_PATTERNS = [
  /^starting stack\s*:/i,
  /^10\s*×\s*1-value(?:\s+chips)?\s*$/i,
  /^8\s*×\s*5-value(?:\s+chips)?\s*$/i,
  /^6\s*×\s*25-value(?:\s+chips)?\s*$/i,
]

export function selectSupplementalChipLines(chipLines: readonly string[]): string[] {
  return chipLines.filter((line) => {
    const trimmed = line.trim()
    return !CANONICAL_LINE_PATTERNS.some((pattern) => pattern.test(trimmed))
  })
}
