import type { DrawText, Drawing } from '../building/views/drawing'
import { printedTextSize } from '../export/printedText'

/**
 * Conflits d'annotations d'un dessin (M20 20.2, critère du gate G3 « aucun conflit d'annotations
 * critique ») : deux textes dont les cadres se recouvrent, **à la taille imprimée** à l'échelle donnée
 * (au moins 7 pt, 10 pt en gras : `printedTextSize`). Cadre estimé : largeur 0,58 em par caractère
 * (0,64 em en gras, Helvetica), hauteur 0,75 em ; un texte tourné a son cadre tourné. Les cadres sont
 * réduits de 10 % pour ne pas compter deux textes qui se frôlent.
 */
export interface TextBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

const CHAR_EM = 0.58
const BOLD_CHAR_EM = 0.64
const CAP_EM = 0.75
const SHRINK = 0.1

export function textBox(t: DrawText, scale = 1): TextBox {
  const size = printedTextSize(t, scale)
  const w = t.text.length * size * (t.bold ? BOLD_CHAR_EM : CHAR_EM)
  const h = size * CAP_EM
  const left = t.anchor === 'middle' ? -w / 2 : 0
  // Repère du texte : ligne de base en y, le texte monte de h au-dessus.
  const corners: [number, number][] = [
    [left, -h],
    [left + w, -h],
    [left + w, 0],
    [left, 0],
  ]
  const a = ((t.angle ?? 0) * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  const pts = corners.map(([u, v]) => [t.x + u * c - v * s, t.y + u * s + v * c])
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const box = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
  const dx = ((box.x1 - box.x0) * SHRINK) / 2
  const dy = ((box.y1 - box.y0) * SHRINK) / 2
  return { x0: box.x0 + dx, y0: box.y0 + dy, x1: box.x1 - dx, y1: box.y1 - dy }
}

export const boxesOverlap = (a: TextBox, b: TextBox) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

/** Paires de textes qui se recouvrent une fois imprimés à 1:`scale` (indices dans `drawing.texts`). */
export function textConflicts(drawing: Pick<Drawing, 'texts'>, scale = 1): [number, number][] {
  const boxes = drawing.texts.map((t) => textBox(t, scale))
  const out: [number, number][] = []
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) if (boxesOverlap(boxes[i], boxes[j])) out.push([i, j])
  }
  return out
}
