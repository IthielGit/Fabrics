import type { WallMaterial } from '../../../types/document'
import type { DrawLine, DrawPolygon, DrawText } from './drawing'
import { hatchSegments } from './patterns'

/**
 * Légende des hachures d'un plan de niveau (M20 20.2) : une case hachurée et le nom de chaque matériau
 * de mur coupé du niveau (ex. « Brique »), dans l'ordre de `materials`. Dessinée à droite du plan,
 * sous le tableau des surfaces.
 */
export interface LegendBlock {
  lines: DrawLine[]
  texts: DrawText[]
  polygons: DrawPolygon[]
  width: number
  height: number
}

export function materialLegend(
  materials: readonly WallMaterial[],
  names: Record<WallMaterial, string>,
  title: string,
  x: number,
  y: number,
  font: number,
): LegendBlock | null {
  if (materials.length === 0) return null
  const rowH = font * 2.2
  const sw = font * 4
  const sh = font * 1.6
  const texts: DrawText[] = [{ x, y: y + font * 1.2, text: title, size: font * 1.3 }]
  const lines: DrawLine[] = []
  const polygons: DrawPolygon[] = []
  let width = title.length * font * 1.3 * 0.68
  materials.forEach((m, i) => {
    const top = y + font * 2 + i * rowH
    const pts: [number, number][] = [[x, top], [x + sw, top], [x + sw, top + sh], [x, top + sh]]
    polygons.push({ points: pts, fill: 'white', hatch: hatchSegments(pts, m, font), edges: pts.map(() => false) })
    lines.push(...pts.map((p, k) => ({ x1: p[0], y1: p[1], x2: pts[(k + 1) % 4][0], y2: pts[(k + 1) % 4][1], weight: 'cut' as const })))
    texts.push({ x: x + sw + font, y: top + sh * 0.75, text: names[m], size: font })
    width = Math.max(width, sw + font + names[m].length * font * 0.68)
  })
  return { lines, texts, polygons, width, height: font * 2 + materials.length * rowH }
}

/** Matériaux des murs d'un niveau, sans doublon, dans l'ordre de première apparition. */
export function levelWallMaterials(elements: readonly { type: string; levelId?: string; hidden?: boolean; material?: WallMaterial }[], levelId: string): WallMaterial[] {
  const seen: WallMaterial[] = []
  for (const el of elements) {
    if (el.type !== 'wall' || el.hidden || el.levelId !== levelId || !el.material) continue
    if (!seen.includes(el.material)) seen.push(el.material)
  }
  return seen
}
