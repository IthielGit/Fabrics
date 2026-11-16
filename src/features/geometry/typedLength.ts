import type { Point } from './viewport'

/** Une longueur tapée au clavier pendant un tracé : des chiffres seulement (mm entiers). */
export function isTypedLengthKey(key: string): boolean {
  return /^\d$/.test(key)
}

/**
 * Point placé à la longueur tapée (en mm) depuis `from`, dans la direction du curseur.
 * Renvoie `null` si la saisie n'est pas un nombre entier positif ou si le curseur est sur `from`
 * (pas de direction).
 */
export function pointAtTypedLength(from: Point, cursor: Point, typed: string): Point | null {
  if (!/^\d+$/.test(typed)) return null
  const length = Number(typed)
  if (length <= 0) return null
  const dx = cursor.x - from.x
  const dy = cursor.y - from.y
  const distance = Math.hypot(dx, dy)
  if (distance < 1e-6) return null
  return { x: from.x + (dx / distance) * length, y: from.y + (dy / distance) * length }
}
