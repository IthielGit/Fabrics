import type { DrawLine, DrawText, PlanOverlay } from '../building/views/drawing'
import type { AxisElement, CanvasElement } from '../../types/document'
import { tagOverlay } from '../building/views/graphicStyles'

/**
 * Axes du quadrillage porteur sur les plans imprimés (M20 20.2) : trait mixte d'un bout à l'autre,
 * bulle (cercle) à chaque extrémité, repère de l'axe (« A », « 1 ») au centre des bulles. Un axe
 * sans niveau est commun à tous les niveaux. `null` sans axe.
 */
export function axisGraphics(elements: readonly CanvasElement[], levelId: string, fontMm: number): PlanOverlay | null {
  const axes = elements.filter(
    (el): el is AxisElement => el.type === 'axis' && !el.hidden && (el.levelId === undefined || el.levelId === levelId),
  )
  if (axes.length === 0) return null
  const lines: DrawLine[] = []
  const texts: DrawText[] = []
  const r = fontMm * 0.9
  for (const axis of axes) {
    const [x1, y1, x2, y2] = axis.points
    const len = Math.hypot(x2 - x1, y2 - y1)
    if (len < 1) continue
    const ux = (x2 - x1) / len
    const uy = (y2 - y1) / len
    lines.push({ x1, y1, x2, y2, dashed: true, weight: 'hair' })
    // Bulles au-delà des extrémités, dans le prolongement de l'axe.
    for (const [ex, ey, s] of [[x1, y1, -1], [x2, y2, 1]] as const) {
      const cx = ex + ux * r * s
      const cy = ey + uy * r * s
      const n = 20
      for (let k = 0; k < n; k++) {
        const a0 = (2 * Math.PI * k) / n
        const a1 = (2 * Math.PI * (k + 1)) / n
        lines.push({ x1: cx + r * Math.cos(a0), y1: cy + r * Math.sin(a0), x2: cx + r * Math.cos(a1), y2: cy + r * Math.sin(a1) })
      }
      texts.push({ x: cx, y: cy + fontMm * 0.35, text: axis.label, size: fontMm, anchor: 'middle' })
    }
  }
  return tagOverlay({ lines, texts }, 'axes')
}
