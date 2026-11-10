import type { Primitive } from '../types'

/** Fonction de dessin d'un objet : largeur et profondeur en mm → primitives dans [0, w] × [0, d]. */
export type DrawFn = (width: number, depth: number) => Primitive[]

/** Rayon d'angle arrondi proportionnel à la taille, borné. */
export function corner(width: number, depth: number, ratio = 0.08, max = 60): number {
  return Math.max(6, Math.min(max, Math.min(width, depth) * ratio))
}

/** Marge intérieure (épaisseur d'un bord) proportionnelle à la taille, bornée. */
export function edge(width: number, depth: number, max = 40): number {
  return Math.max(4, Math.min(max, width * 0.1, depth * 0.2))
}

/** Nombre d'éléments de `unit` mm qui tiennent dans `length`, au moins `min`. */
export function countFor(length: number, unit: number, min = 1): number {
  return Math.max(min, Math.round(length / unit))
}
