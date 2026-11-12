import { dimensionGeometry } from '../geometry/dimension'
import type { AutoDimension, AutoLabel } from './types'

/**
 * Mise en page des textes des cotes automatiques (M10 ter lot B) : éviter que chiffres et
 * étiquettes se chevauchent. Calculs purs, partagés par l'écran et le PDF.
 */

/** Largeur moyenne d'un caractère, en multiples de la hauteur du texte (police sans empattement). */
export const CHAR_WIDTH_EM = 0.56
/** Hauteur d'une ligne d'étiquette, en multiples de la hauteur du texte. */
export const LINE_HEIGHT_EM = 1.25

/** Largeur estimée d'un texte d'une ligne, en mm. */
export function textWidth(text: string, fontMm: number): number {
  return text.length * CHAR_WIDTH_EM * fontMm
}

/**
 * Où écrire le chiffre d'une cote :
 * - `above` : au-dessus de la ligne, au milieu (il tient entre les deux traits) ;
 * - `above2` : au-dessus, un rang plus haut ; `below` : sous la ligne. Une petite cote (épaisseur
 *   de mur, trumeau étroit) prend l'un ou l'autre selon son rang dans la chaîne : deux petites
 *   cotes voisines ne se touchent pas, et le chiffre ne recouvre plus la ligne ni les traits.
 */
export type DimensionTextRow = 'above' | 'above2' | 'below'

export function dimensionTextRow(length: number, text: string, fontMm: number, chainIndex = 0): DimensionTextRow {
  if (textWidth(text, fontMm) + fontMm * 0.6 <= length) return 'above'
  return chainIndex % 2 === 0 ? 'above2' : 'below'
}

export interface LabelBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** Rectangle occupé par une étiquette centrée en (x, y), en mm. */
export function labelBox(lines: readonly string[], x: number, y: number, fontMm: number): LabelBox {
  const width = Math.max(0, ...lines.map((line) => textWidth(line, fontMm))) + fontMm * 0.4
  const height = lines.length * LINE_HEIGHT_EM * fontMm + fontMm * 0.2
  return { minX: x - width / 2, minY: y - height / 2, maxX: x + width / 2, maxY: y + height / 2 }
}

function overlapArea(a: LabelBox, b: LabelBox): number {
  const w = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)
  const h = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)
  return w > 0 && h > 0 ? w * h : 0
}

/** Hauteur du texte d'une cote : ligne de base au-dessus de la ligne de cote, par rang (voir `dimensionTextRow`). */
export const ROW_LIFT_EM = { above: 0.35, above2: 1.55, below: -1.15 } as const

/**
 * Zones occupées par les cotes : un fin rectangle le long de chaque ligne de cote et un rectangle
 * par chiffre (à sa place réelle). Les étiquettes les évitent (`placeLabels`).
 */
export function dimensionObstacles(dimensions: readonly AutoDimension[], fontMm: number): LabelBox[] {
  const boxes: LabelBox[] = []
  const thin = fontMm * 0.25
  for (const dimension of dimensions) {
    const geometry = dimensionGeometry(dimension.points, dimension.offset)
    if (!geometry) continue
    const { line, center, textAngle, length } = geometry
    boxes.push({
      minX: Math.min(line[0].x, line[1].x) - thin,
      maxX: Math.max(line[0].x, line[1].x) + thin,
      minY: Math.min(line[0].y, line[1].y) - thin,
      maxY: Math.max(line[0].y, line[1].y) + thin,
    })
    const text = String(Math.round(length))
    const row = dimensionTextRow(length, text, fontMm, dimension.chainIndex ?? 0)
    const a = (textAngle * Math.PI) / 180
    // Centre du chiffre : sa ligne de base remontée de la moitié de sa hauteur, dans le sens de lecture.
    const lift = fontMm * (ROW_LIFT_EM[row] + 0.4)
    const cx = center.x + Math.sin(a) * lift
    const cy = center.y - Math.cos(a) * lift
    const w = textWidth(text, fontMm) + fontMm * 0.3
    const h = fontMm * 1.05
    const vertical = Math.abs(textAngle) > 45
    const [hw, hh] = vertical ? [h / 2, w / 2] : [w / 2, h / 2]
    boxes.push({ minX: cx - hw, maxX: cx + hw, minY: cy - hh, maxY: cy + hh })
  }
  return boxes
}

/** Part d'un rectangle qui sort de `bounds` (en mm²) ; 0 si `bounds` est absent. */
function outsideArea(box: LabelBox, bounds: LabelBox | undefined): number {
  if (!bounds) return 0
  const area = (box.maxX - box.minX) * (box.maxY - box.minY)
  return area - overlapArea(box, bounds)
}

/**
 * Place les étiquettes dans l'ordre donné (les premières sont prioritaires) en évitant les
 * étiquettes déjà placées et les `obstacles` (lignes et chiffres des cotes). Chaque étiquette essaie
 * son emplacement préféré, ses `alternatives`, puis des positions de plus en plus éloignées (d'abord
 * à la verticale, puis en diagonale et à l'horizontale) ; elle prend la première position libre qui
 * reste dans ses `bounds`, sinon celle qui gêne le moins. Les étiquettes gardent leur texte.
 */
export function placeLabels(
  labels: readonly AutoLabel[],
  fontMm: number,
  obstacles: readonly LabelBox[] = [],
): AutoLabel[] {
  const placed: LabelBox[] = []
  const step = fontMm * 1.5
  const ring = [1, 2, 3, 4].flatMap((r) =>
    [
      [0, r], [0, -r], [r, 0], [-r, 0], [r, r], [-r, r], [r, -r], [-r, -r],
    ].map(([dx, dy]) => ({ dx: dx * step, dy: dy * step })),
  )
  return labels.map((label) => {
    const candidates = [
      { x: label.x, y: label.y },
      ...(label.alternatives ?? []),
      ...ring.map(({ dx, dy }) => ({ x: label.x + dx, y: label.y + dy })),
    ]
    let best = candidates[0]
    let bestScore = Infinity
    for (const [index, candidate] of candidates.entries()) {
      const box = labelBox(label.lines, candidate.x, candidate.y, fontMm)
      const hits = [...placed, ...obstacles].reduce((sum, other) => sum + overlapArea(box, other), 0)
      const out = outsideArea(box, label.bounds)
      // Une sortie de la pièce pèse plus lourd qu'un léger chevauchement ; l'éloignement départage.
      const score = hits + out * 2 + index
      if (score < bestScore) {
        best = candidate
        bestScore = score
      }
      if (hits === 0 && out === 0) break
    }
    placed.push(labelBox(label.lines, best.x, best.y, fontMm))
    const { alternatives: _alternatives, bounds: _bounds, ...rest } = label
    void _alternatives
    void _bounds
    return { ...rest, x: best.x, y: best.y }
  })
}
