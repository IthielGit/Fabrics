/**
 * Calculs de repère utilisés par la conversion Fabrics ↔ scène (mm, axe y vers le bas de l'écran,
 * angles Fabrics en degrés dans le sens horaire de l'écran).
 */

/** Arrondi au millionième de mm (efface les écarts de virgule flottante d'un aller-retour). */
export function roundMm(value: number): number {
  const rounded = Math.round(value * 1e6) / 1e6
  return rounded === 0 ? 0 : rounded
}

/** Centre d'un objet Fabrics (x, y = coin haut-gauche avant rotation autour de ce coin). */
export function furnitureCentre(x: number, y: number, width: number, depth: number, degrees: number): [number, number] {
  const a = (degrees * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return [x + (width / 2) * cos - (depth / 2) * sin, y + (width / 2) * sin + (depth / 2) * cos]
}

/** Coin haut-gauche d'un objet Fabrics depuis son centre (inverse de `furnitureCentre`). */
export function furnitureCorner(cx: number, cy: number, width: number, depth: number, degrees: number): [number, number] {
  const a = (degrees * Math.PI) / 180
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return [roundMm(cx - (width / 2) * cos + (depth / 2) * sin), roundMm(cy - (width / 2) * sin - (depth / 2) * cos)]
}

/** Repère d'une cote : direction unitaire du premier vers le second point ([1, 0] si confondus),
 * normale `[-dy, dx]`, et origine de la ligne de cote = premier point décalé de `offset`. */
export function dimensionFrame(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  offset: number,
): { direction: [number, number]; origin: [number, number] } {
  const length = Math.hypot(x2 - x1, y2 - y1)
  const direction: [number, number] = length > 0 ? [(x2 - x1) / length, (y2 - y1) / length] : [1, 0]
  return { direction, origin: [x1 - direction[1] * offset, y1 + direction[0] * offset] }
}

/** Décalage d'une cote depuis l'origine de sa ligne (inverse de `dimensionFrame`). */
export function dimensionOffset(
  x1: number,
  y1: number,
  origin: readonly [number, number],
  direction: readonly [number, number],
): number {
  const length = Math.hypot(direction[0], direction[1])
  return roundMm(((origin[0] - x1) * -direction[1] + (origin[1] - y1) * direction[0]) / length)
}
