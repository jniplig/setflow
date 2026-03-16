/**
 * camelot.ts
 * Camelot wheel harmonic mixing compatibility logic.
 *
 * Compatible moves from any key:
 *   - Same key (perfect match)
 *   - +1 / -1 number, same letter (energy boost/drop)
 *   - Same number, opposite letter (relative major/minor)
 */

export type CompatibilityLevel = 'perfect' | 'compatible' | 'risky' | 'incompatible'

export interface KeyCompatibility {
  level: CompatibilityLevel
  label: string
}

function parseKey(key: string): { number: number; letter: 'A' | 'B' } | null {
  const match = key.match(/^(\d+)(A|B)$/)
  if (!match) return null
  return { number: parseInt(match[1]), letter: match[2] as 'A' | 'B' }
}

function wrap(n: number): number {
  // Camelot wheel is 1–12, wraps around
  if (n < 1) return n + 12
  if (n > 12) return n - 12
  return n
}

export function getKeyCompatibility(from: string | null, to: string | null): KeyCompatibility {
  if (!from || !to) return { level: 'incompatible', label: 'No key data' }

  const a = parseKey(from)
  const b = parseKey(to)
  if (!a || !b) return { level: 'incompatible', label: 'Unknown' }

  // Perfect match
  if (a.number === b.number && a.letter === b.letter) {
    return { level: 'perfect', label: 'Perfect match' }
  }

  // Same number, opposite letter (relative major/minor)
  if (a.number === b.number && a.letter !== b.letter) {
    return { level: 'compatible', label: 'Relative key' }
  }

  // +1 or -1 on the wheel, same letter (energy shift)
  if (
    (wrap(a.number + 1) === b.number || wrap(a.number - 1) === b.number) &&
    a.letter === b.letter
  ) {
    return { level: 'compatible', label: 'Energy shift' }
  }

  // +1 number, opposite letter (diagonal — works but needs care)
  if (wrap(a.number + 1) === b.number && a.letter !== b.letter) {
    return { level: 'risky', label: 'Diagonal — use with care' }
  }

  return { level: 'incompatible', label: 'Incompatible keys' }
}

export function getCompatibilityColour(level: CompatibilityLevel): string {
  switch (level) {
    case 'perfect':      return 'text-green-400'
    case 'compatible':   return 'text-sky-400'
    case 'risky':        return 'text-amber-400'
    case 'incompatible': return 'text-red-400'
  }
}

export function getCompatibilityDot(level: CompatibilityLevel): string {
  switch (level) {
    case 'perfect':      return '●'
    case 'compatible':   return '●'
    case 'risky':        return '◐'
    case 'incompatible': return '○'
  }
}

/** Returns true if the BPM jump between two tracks warrants a warning */
export function isBpmWarning(bpmA: number | null, bpmB: number | null, threshold = 8): boolean {
  if (!bpmA || !bpmB) return false
  return Math.abs(bpmA - bpmB) > threshold
}
