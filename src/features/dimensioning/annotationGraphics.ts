import type { DrawLine, DrawText, PlanOverlay } from '../building/views/drawing'
import { dimensionGeometry } from '../geometry/dimension'
import { formatDecimal } from '../units/format'
import type { AutoAnnotations } from './types'

/**
 * Cotes automatiques en traits et textes de dessin (planche et PDF des vues), en coordonnées du
 * plan. Même géométrie que les cotes de l'éditeur (`dimensionGeometry`) : ligne de cote, lignes
 * d'attache qui ne touchent pas l'objet, traits obliques, longueur en mm entiers sans unité.
 * Les tailles (traits obliques, écarts) suivent la hauteur des textes, donc l'échelle du papier.
 */
export function annotationGraphics(annotations: AutoAnnotations, fontMm: number): PlanOverlay {
  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  const tick = fontMm * 0.6
  const extensionGap = fontMm * 0.5

  for (const dimension of annotations.dimensions) {
    const geometry = dimensionGeometry(dimension.points, dimension.offset)
    if (!geometry) continue
    const { line, extensions, center, textAngle, direction, normal, length } = geometry
    lines.push({ x1: line[0].x, y1: line[0].y, x2: line[1].x, y2: line[1].y, weight: 'hair' })
    const gap = Math.min(extensionGap, Math.abs(dimension.offset) / 2) * (dimension.offset < 0 ? -1 : 1)
    for (const [from, to] of extensions) {
      if (Math.abs(dimension.offset) < 1) continue // chaîne intérieure : la ligne passe sur les murs
      lines.push({ x1: from.x + normal.x * gap, y1: from.y + normal.y * gap, x2: to.x, y2: to.y, weight: 'hair' })
    }
    const t = { x: ((direction.x + normal.x) / Math.SQRT2) * tick, y: ((direction.y + normal.y) / Math.SQRT2) * tick }
    for (const p of line) lines.push({ x1: p.x - t.x, y1: p.y - t.y, x2: p.x + t.x, y2: p.y + t.y })
    // Texte au-dessus de la ligne de cote, dans le sens de lecture.
    const a = (textAngle * Math.PI) / 180
    const lift = fontMm * 0.35
    texts.push({
      x: center.x + Math.sin(a) * lift,
      y: center.y - Math.cos(a) * lift,
      text: formatDecimal(length, 0),
      size: fontMm,
      anchor: 'middle',
      ...(textAngle !== 0 ? { angle: textAngle } : {}),
    })
  }

  for (const label of annotations.labels) {
    const step = fontMm * 1.25
    const top = label.y - (step * label.lines.length) / 2
    label.lines.forEach((text, index) => {
      texts.push({ x: label.x, y: top + step * (index + 0.8), text, size: fontMm, anchor: 'middle', bold: index === 0 })
    })
  }
  return { lines, texts }
}
