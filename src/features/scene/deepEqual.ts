/** Égalité de valeurs JSON, quel que soit l'ordre des propriétés (clés `undefined` ignorées). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const other = b as unknown[]
    return a.length === other.length && a.every((value, index) => deepEqual(value, other[index]))
  }
  const left = Object.entries(a as Record<string, unknown>).filter(([, v]) => v !== undefined)
  const right = b as Record<string, unknown>
  const rightCount = Object.values(right).filter((v) => v !== undefined).length
  return left.length === rightCount && left.every(([key, value]) => deepEqual(value, right[key]))
}
