import type { Level, StairElement } from '../../types/document'
import { stairLayout, stairStatus, stairToWorld } from '../stairs/stairs'
import type { WallPiece } from './types'

/**
 * Marches 3D d'un escalier : une boîte pleine par giron (du plancher du niveau de départ jusqu'au
 * dessus de la marche) et une pour le palier. Les marches montent d'une contremarche à chaque
 * giron, dans l'ordre de la montée ; le palier compte pour une marche (sa hauteur suit celle de
 * la dernière marche de la 1re volée), donc le dernier giron d'un escalier à palier arrive à
 * hauteur du plancher du niveau du dessus.
 * Aucune marche sans niveau au-dessus. Une boîte est orientée autour de l'axe vertical, comme un
 * morceau de mur (`WallPiece`) ; la sélection depuis la 3D renvoie l'escalier.
 */
export function buildStairSteps(
  stair: StairElement,
  level: Level,
  levels: readonly Level[],
): WallPiece[] {
  const status = stairStatus(stair, levels)
  if (status.kind === 'no-level-above') return []
  const { treads, riserHeight } = status.steps
  if (treads < 1) return []

  const layout = stairLayout(stair, treads)
  const rotationY = (-stair.rotation * Math.PI) / 180
  const sourceId = stair.id
  const pieces: WallPiece[] = []

  /** Boîte occupant le rectangle local (x, y, w, d), du plancher jusqu'à `top` (mm au-dessus du plancher). */
  const box = (x: number, y: number, w: number, d: number, top: number) => {
    const center = stairToWorld(stair, { x: x + w / 2, y: y + d / 2 })
    pieces.push({
      sourceId,
      levelId: level.id,
      center: { x: center.x, y: level.elevation + top / 2, z: center.y },
      size: { x: w, y: top, z: d },
      rotationY,
    })
  }

  let step = 0 // nombre de contremarches déjà montées
  layout.flights.forEach((flight, index) => {
    const count = flight.treads
    for (let j = 1; j <= count; j++) {
      step += 1
      const top = step * riserHeight
      if (flight.direction === 'up') {
        const depth = flight.height / count
        box(flight.x, flight.y + flight.height - j * depth, flight.width, depth, top)
      } else if (flight.direction === 'down') {
        const depth = flight.height / count
        box(flight.x, flight.y + (j - 1) * depth, flight.width, depth, top)
      } else {
        const width = flight.width / count
        box(flight.x + (j - 1) * width, flight.y, width, flight.height, top)
      }
    }
    // Le palier est la marche qui sépare la 1re volée de la 2e.
    if (index === 0 && layout.landing) {
      step += 1
      const { x, y, width, height } = layout.landing
      box(x, y, width, height, step * riserHeight)
    }
  })
  return pieces
}
