import type { FabricsDocument } from '../../types/document'
import type { DrawLine, DrawText, PlanOverlay } from '../building/views/drawing'
import { elementBounds } from '../export/bounds'
import { elementsOnLevel } from '../documents/levels'
import { unionBoxes } from '../geometry/box'
import { formatAltitude, type ExecutionLabels } from './executionDimensions'

// Annotations de plan (M11 bis, lot F) : flèche du nord et repère de niveau, dessinés de zéro à
// partir de formes simples. Calculées à partir du plan, jamais enregistrées ; seule l'option
// « Flèche du nord et repère de niveau » (`plan.showAnnotations`) l'est. Fonctions pures.

/** Rayon du cercle de la flèche, en hauteurs de texte. */
const RADIUS_EM = 4
/** Écart entre le plan et la flèche, en hauteurs de texte (au-delà des cotes extérieures usuelles). */
const GAP_EM = 10
/** Nombre de côtés du cercle de la flèche. */
const CIRCLE_STEPS = 32

/** Éléments qui donnent l'emprise du bâtiment sur un niveau (les cotes et les axes n'en font pas partie). */
const BUILDING_TYPES = new Set(['wall', 'room', 'platform', 'roof', 'stair', 'chimney', 'furniture'])

/**
 * Flèche du nord et repère de niveau d'un niveau, à droite de l'emprise du bâtiment, `fontMm` étant la
 * hauteur des textes (la flèche s'agrandit avec elle). `null` si l'option est désactivée, si le niveau
 * est inconnu ou s'il n'y a rien à repérer.
 */
export function planMarks(
  document: Pick<FabricsDocument, 'elements' | 'levels' | 'plan'>,
  levelId: string,
  labels: Pick<ExecutionLabels, 'north' | 'east' | 'south' | 'west' | 'levelMark'>,
  fontMm: number,
): PlanOverlay | null {
  if (!document.plan?.showAnnotations) return null
  const level = document.levels?.find((l) => l.id === levelId)
  if (!level) return null
  const boxes = elementsOnLevel(document.elements, levelId)
    .filter((el) => !el.hidden && BUILDING_TYPES.has(el.type))
    .flatMap((el) => elementBounds(el) ?? [])
  const box = unionBoxes(boxes)
  if (!box) return null

  const radius = RADIUS_EM * fontMm
  const cx = box.x + box.width + GAP_EM * fontMm + radius
  const cy = box.y + radius + 2 * fontMm
  const angle = (document.plan.northAngle * Math.PI) / 180
  // Direction du nord à l'écran (y vers le bas) : 0° = vers le haut, sens horaire.
  const north = { x: Math.sin(angle), y: -Math.cos(angle) }
  const side = { x: -north.y, y: north.x }
  const at = (along: number, across: number) => ({
    x: cx + north.x * along + side.x * across,
    y: cy + north.y * along + side.y * across,
  })

  const lines: DrawLine[] = []
  const segment = (a: { x: number; y: number }, b: { x: number; y: number }, weight: DrawLine['weight'] = 'normal') =>
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, weight })
  // Cercle.
  for (let i = 0; i < CIRCLE_STEPS; i++) {
    const a = (i / CIRCLE_STEPS) * Math.PI * 2
    const b = ((i + 1) / CIRCLE_STEPS) * Math.PI * 2
    segment(
      { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) },
      { x: cx + radius * Math.cos(b), y: cy + radius * Math.sin(b) },
      'hair',
    )
  }
  // Rose des vents : une graduation à chaque point cardinal (N, E, S, O), tournée avec le nord.
  for (const quarter of [0, 90, 180, 270]) {
    const rad = (quarter * Math.PI) / 180
    const along = Math.cos(rad)
    const across = Math.sin(rad)
    segment(at(radius * along, radius * across), at(radius * 0.8 * along, radius * 0.8 * across), 'hair')
  }
  // Flèche : pointe au nord, deux ailes, creux au centre (une moitié noircie par un trait de milieu).
  const tip = at(radius * 0.95, 0)
  const left = at(-radius * 0.7, -radius * 0.38)
  const right = at(-radius * 0.7, radius * 0.38)
  const notch = at(-radius * 0.3, 0)
  segment(tip, left)
  segment(left, notch)
  segment(notch, right)
  segment(right, tip)
  segment(tip, notch)

  // Lettres N, E, S, O au bout de leur direction, restant droites (lisibles) quel que soit le nord.
  const letter = (text: string, quarter: number, size: number, bold: boolean): DrawText => {
    const rad = (quarter * Math.PI) / 180
    const spot = at((radius + size * 0.9) * Math.cos(rad), (radius + size * 0.9) * Math.sin(rad))
    return { x: spot.x, y: spot.y + size * 0.35, text, size, anchor: 'middle', bold }
  }
  const texts: DrawText[] = [letter(labels.north, 0, fontMm * 1.4, true)]
  if (labels.east) texts.push(letter(labels.east, 90, fontMm, false))
  if (labels.south) texts.push(letter(labels.south, 180, fontMm, false))
  if (labels.west) texts.push(letter(labels.west, 270, fontMm, false))
  texts.push({
    x: cx,
    // Sous la lettre du sud, quel que soit le nord.
    y: cy + radius + fontMm * 3.6,
    text: labels.levelMark(level.name, formatAltitude(level.elevation)),
    size: fontMm,
    anchor: 'middle',
  })
  return { lines, texts }
}

/** Réunit deux calques de cotes et d'annotations (l'un ou l'autre peut manquer). */
export function mergeOverlays(a: PlanOverlay | null, b: PlanOverlay | null): PlanOverlay | null {
  if (!a) return b
  if (!b) return a
  return { lines: [...a.lines, ...b.lines], texts: [...a.texts, ...b.texts] }
}
