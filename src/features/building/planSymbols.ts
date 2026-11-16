import type { Level, OpeningElement, WallElement } from '../../types/document'
import { openingGeometry } from '../geometry/openings'
import { openingSymbol } from '../geometry/openingSymbol'
import type { Point } from '../geometry/viewport'
import type { PlanSymbol } from './types'

/**
 * Symboles de plan des ouvertures d'un mur (battant et arc d'une porte, cadre et vitrage d'une
 * fenêtre…), en coordonnées du plan (mm). Ce sont exactement les traits du plan de travail
 * (`openingSymbol`), pour que la planche, les vues et les PDF suivent le même dessin normalisé.
 */
export function buildPlanSymbols(
  wall: Pick<WallElement, 'id' | 'points' | 'thickness'>,
  openings: readonly OpeningElement[],
  level: Pick<Level, 'id'>,
): PlanSymbol[] {
  const symbols: PlanSymbol[] = []
  for (const o of openings) {
    if (o.wallId !== wall.id) continue
    const geometry = openingGeometry(o, wall)
    if (!geometry) continue
    const { center, direction: d } = geometry
    // Repère local du symbole : x le long du mur, y vers la « gauche » du mur (comme à l'écran).
    const toPlan = (x: number, y: number): Point => ({
      x: center.x + x * d.x - y * d.y,
      y: center.y + x * d.y + y * d.x,
    })
    const polyline = (flat: readonly number[]): Point[] => {
      const points: Point[] = []
      for (let i = 0; i + 1 < flat.length; i += 2) points.push(toPlan(flat[i], flat[i + 1]))
      return points
    }
    const symbol = openingSymbol(o, wall.thickness)
    const { x, y, width, height } = symbol.cut
    symbols.push({
      sourceId: o.id,
      levelId: level.id,
      cut: [toPlan(x, y), toPlan(x + width, y), toPlan(x + width, y + height), toPlan(x, y + height)],
      lines: symbol.lines.map(polyline),
      dashed: symbol.dashed.map(polyline),
    })
  }
  return symbols
}
