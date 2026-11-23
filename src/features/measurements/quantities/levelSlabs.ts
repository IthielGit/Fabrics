/**
 * Dalle de niveau (M21, 21.2) : la dalle sous chaque niveau, quand la scène n'a pas de dalle dessinée
 * dans Pascal pour ce niveau (sinon ce sont les dalles de Pascal qui sont comptées, jamais les deux).
 *
 * Règle des fixtures (décision de l'utilisateur du 2026-11-18, `fixtures/HOUSE-02/spec.json`) : le
 * dessus de la dalle est à l'altitude du niveau, l'épaisseur descend. Les murs priment : une dalle
 * traversée par les murs du niveau du dessous perd leur emprise. Les trémies sont déduites.
 *   surface = emprise du niveau − emprise des murs du dessous qui la traversent − trémies
 *   volume  = surface × épaisseur de dalle du niveau
 * Limite : l'emprise des murs du dessous est retirée en entier (murs supposés sous l'emprise du niveau).
 * Fonction pure ; mm, mm², mm³.
 */
import type { Level } from '../../../types/document'
import type { StairVoid } from '../../stairs/voids'
import type { BuildingMeasurements } from '../measurements'

export interface LevelSlab {
  levelId: string
  /** Emprise du niveau (contour extérieur de ses murs), en mm². */
  footprint: number
  /** Emprise des murs du niveau du dessous qui traversent la dalle, en mm². */
  wallsBelow: number
  /** Surface des trémies du niveau, en mm². */
  voids: number
  /** Épaisseur de la dalle, en mm. */
  thickness: number
  area: number
  volume: number
}

function ringArea(points: readonly { x: number; y: number }[]): number {
  let twice = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    twice += a.x * b.y - b.x * a.y
  }
  return Math.abs(twice) / 2
}

export function levelSlabs(input: {
  building: BuildingMeasurements
  levels: readonly Level[]
  voids: readonly StairVoid[]
  /** Emprise de chaque niveau (`scene/siteMeasures.levelFootprintAreas`). */
  footprints: ReadonlyMap<string, number>
  /** Niveaux qui ont une dalle dessinée dans Pascal. */
  drawnSlabLevels: ReadonlySet<string>
}): LevelSlab[] {
  const out: LevelSlab[] = []
  const sorted = [...input.levels].sort((a, b) => a.elevation - b.elevation)
  sorted.forEach((level, index) => {
    const footprint = input.footprints.get(level.id) ?? 0
    if (footprint <= 0 || level.slabThickness <= 0 || input.drawnSlabLevels.has(level.id)) return
    const below = index > 0 ? sorted[index - 1] : undefined
    const slabBottom = level.elevation - level.slabThickness
    const wallsBelow = below
      ? (input.building.levels.find((entry) => entry.level.id === below.id)?.measurements.walls ?? [])
          // Un mur du dessous traverse la dalle si son sommet dépasse le dessous de la dalle.
          .filter((wall) => wall.height > 0 && below.elevation + wall.height > slabBottom)
          // Emprise d'un mur = volume brut ÷ hauteur (raccords en T comptés une fois).
          .reduce((sum, wall) => sum + (wall.volume + wall.openingsArea * wall.thickness) / wall.height, 0)
      : 0
    const voids = input.voids.filter((v) => v.levelId === level.id).reduce((sum, v) => sum + ringArea(v.polygon), 0)
    const area = Math.max(0, footprint - wallsBelow - voids)
    out.push({ levelId: level.id, footprint, wallsBelow, voids, thickness: level.slabThickness, area, volume: area * level.slabThickness })
  })
  return out
}
