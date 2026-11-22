import type { DrawLine, DrawText, PlanOverlay } from '../building/views/drawing'
import { dimensionGeometry } from '../geometry/dimension'
import { formatDecimal } from '../units/format'
import { dimensionObstacles, dimensionTextRow, LABEL_TITLE_EM, labelHeightEm, LINE_HEIGHT_EM, placeLabels, ROW_LIFT_EM } from './layout'
import type { AutoAnnotations } from './types'
import { boxesOverlap, textBox, type TextBox } from './conflicts'

/**
 * Cotes automatiques en traits et textes de dessin (planche et PDF des vues), en coordonnées du
 * plan. Même géométrie que les cotes de l'éditeur (`dimensionGeometry`) : ligne de cote, lignes
 * d'attache qui ne touchent pas l'objet, traits obliques, longueur en mm entiers sans unité.
 * Les tailles (traits obliques, écarts) suivent la hauteur des textes, donc l'échelle du papier.
 * Même mise en page qu'à l'écran : petites cotes en alternance, étiquettes écartées (`layout.ts`).
 */

export function annotationGraphics(annotations: AutoAnnotations, fontMm: number): PlanOverlay {
  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  const tick = fontMm * 0.6
  const extensionGap = fontMm * 0.5
  const valueBoxes: TextBox[] = []

  for (const dimension of annotations.dimensions) {
    const geometry = dimensionGeometry(dimension.points, dimension.offset)
    if (!geometry) continue
    const { line, extensions, center, textAngle, direction, normal, length } = geometry
    lines.push({ x1: line[0].x, y1: line[0].y, x2: line[1].x, y2: line[1].y, weight: 'hair', category: 'dimensions' })
    const gap = Math.min(extensionGap, Math.abs(dimension.offset) / 2) * (dimension.offset < 0 ? -1 : 1)
    for (const [from, to] of extensions) {
      if (Math.abs(dimension.offset) < 1) continue // chaîne intérieure : la ligne passe sur les murs
      lines.push({ x1: from.x + normal.x * gap, y1: from.y + normal.y * gap, x2: to.x, y2: to.y, weight: 'hair', category: 'dimensions' })
    }
    const t = { x: ((direction.x + normal.x) / Math.SQRT2) * tick, y: ((direction.y + normal.y) / Math.SQRT2) * tick }
    for (const p of line) lines.push({ x1: p.x - t.x, y1: p.y - t.y, x2: p.x + t.x, y2: p.y + t.y, category: 'dimensions' })
    // Texte dans le sens de lecture : au-dessus, ou en alternance s'il ne tient pas entre les traits.
    // S'il touche le chiffre d'une autre cote déjà placé, il essaie les autres rangs (M20 20.2).
    const a = (textAngle * Math.PI) / 180
    const value = formatDecimal(length, 0)
    const preferred = dimensionTextRow(length, value, fontMm, dimension.chainIndex ?? 0)
    const rows = [preferred, ...(['above', 'below', 'above2'] as const).filter((r) => r !== preferred)]
    const at = (row: keyof typeof ROW_LIFT_EM): DrawText => {
      const lift = fontMm * ROW_LIFT_EM[row]
      return {
        x: center.x + Math.sin(a) * lift,
        y: center.y - Math.cos(a) * lift,
        text: value,
        size: fontMm,
        anchor: 'middle',
        category: 'dimensions',
        ...(textAngle !== 0 ? { angle: textAngle } : {}),
      }
    }
    const free = rows.map(at).find((t) => !valueBoxes.some((box) => boxesOverlap(box, textBox(t))))
    const chosen = free ?? at(preferred)
    valueBoxes.push(textBox(chosen))
    texts.push(chosen)
  }

  for (const label of placeLabels(annotations.labels, fontMm, dimensionObstacles(annotations.dimensions, fontMm))) {
    // Nom de la pièce en gras, 1,4 fois plus grand (taille imprimée, M20 20.2), puis les autres lignes.
    const step = fontMm * LINE_HEIGHT_EM
    const title = fontMm * LABEL_TITLE_EM
    const top = label.y - (labelHeightEm(label.lines.length) * fontMm) / 2
    // Noms de pièces dans « Pièces », repères des portes, fenêtres, escaliers… dans « Repères » (M20 20.5).
    // Masque blanc sous les noms de pièces seulement (il cache le mobilier dessous) : les repères sont
    // posés contre les murs, un masque mordrait sur leur trait.
    const category = label.id.startsWith('room-') ? 'rooms' : 'marks'
    const mask = category === 'rooms'
    label.lines.forEach((text, index) => {
      const y = top + title * 0.8 + step * index
      texts.push({ x: label.x, y, text, size: index === 0 ? title : fontMm, anchor: 'middle', bold: index === 0, category, ...(mask ? { mask } : {}) })
    })
  }
  return { lines, texts }
}
