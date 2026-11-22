import {
  FILL_COLORS,
  INK,
  MUTED_INK,
  paintBatches,
  type DrawCategory,
  type Drawing,
  type DrawPolygon,
} from '../building/views/drawing'
import { estimatedTextWidth, lineWeights, textMask } from '../building/views/graphicStyles'
import { printedTextSize } from './printedText'

/**
 * Export SVG d'une vue à l'échelle (M20 20.6) : le dessin seul, sans cadre ni cartouche, à la taille du
 * papier (`width` et `height` en mm : 1:50 → 1000 mm réels = 20 mm). Même contenu, mêmes épaisseurs
 * (`lineWeights`), mêmes tailles de texte imprimées et mêmes masques que le PDF. Les éléments sont
 * rangés en calques par catégorie (M20 20.5), lus comme calques par Inkscape et comme groupes ailleurs.
 */
export interface SvgOptions {
  /** Dénominateur de l'échelle (50 pour 1:50). */
  scale: number
  /** Titre du document (`<title>`). */
  title: string
  /** Nom de chaque calque (catégorie) ; « Fond » pour les éléments sans catégorie. */
  layerNames: Record<DrawCategory | 'base', string>
}

const n = (value: number) => String(Math.round(value * 100) / 100)

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Morceaux du dessin dans l'ordre de peinture, chacun avec sa catégorie. */
interface Piece {
  category: DrawCategory | undefined
  svg: string
}

export function drawingToSvg(drawing: Drawing, options: SvgOptions): string {
  const { scale } = options
  // Épaisseurs et motifs donnés en mm sur le papier, convertis dans le repère du dessin (mm réels).
  const W = lineWeights(scale)
  const paper = (mm: number) => n(mm * scale)
  const pieces: Piece[] = []
  const points = (p: DrawPolygon) => p.points.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')
  const fillOf = (p: DrawPolygon) => (p.fill === 'none' ? 'none' : FILL_COLORS[p.fill])

  for (const batch of paintBatches(drawing.polygons)) {
    const [head] = batch
    const stroke = paper(head.fill === 'black' ? W.cut : W.normal)
    if (head.open) {
      const dash = head.dashed ? ` stroke-dasharray="${paper(1.5)} ${paper(1)}"` : ''
      pieces.push({
        category: head.category,
        svg: `<polyline points="${points(head)}" fill="none" stroke="${INK}" stroke-width="${paper(W.hair)}" stroke-linejoin="round"${dash}/>`,
      })
      continue
    }
    if (head.edges) {
      // Faces d'un même plan : fonds, hachures, puis les vrais bords seulement (comme le PDF).
      for (const p of batch) {
        if (p.points.length < 3 || p.fill === 'none') continue
        pieces.push({ category: p.category, svg: `<polygon points="${points(p)}" fill="${fillOf(p)}" stroke="none"/>` })
      }
      for (const p of batch) {
        if (!p.hatch?.length) continue
        const d = p.hatch.map(([x1, y1, x2, y2]) => `M${n(x1)},${n(y1)}L${n(x2)},${n(y2)}`).join('')
        pieces.push({ category: p.category, svg: `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${paper(W.hatch)}"/>` })
      }
      for (const p of batch) {
        const d = p.points
          .map(([x, y], i) => {
            if (!p.edges?.[i]) return ''
            const [nx, ny] = p.points[(i + 1) % p.points.length]
            return `M${n(x)},${n(y)}L${n(nx)},${n(ny)}`
          })
          .join('')
        if (d) pieces.push({ category: p.category, svg: `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${stroke}" stroke-linecap="square"/>` })
      }
      continue
    }
    if (head.points.length < 3) continue
    pieces.push({
      category: head.category,
      svg: `<polygon points="${points(head)}" fill="${fillOf(head)}" stroke="${INK}" stroke-width="${stroke}" stroke-linejoin="round"/>`,
    })
  }

  for (const line of drawing.lines) {
    const dash = line.dashed ? ` stroke-dasharray="${paper(2)} ${paper(1.5)}"` : ''
    pieces.push({
      category: line.category,
      svg: `<line x1="${n(line.x1)}" y1="${n(line.y1)}" x2="${n(line.x2)}" y2="${n(line.y2)}" stroke="${line.muted ? MUTED_INK : INK}" stroke-width="${paper(W[line.weight ?? 'normal'])}"${dash}/>`,
    })
  }

  // Masques sous les noms de pièces, avant tous les textes (comme le PDF).
  for (const text of drawing.texts) {
    if (!text.mask) continue
    const size = printedTextSize(text, scale)
    const rect = textMask(text, size, estimatedTextWidth(text, size))
    if (rect) pieces.push({ category: text.category, svg: `<rect x="${n(rect.x)}" y="${n(rect.y)}" width="${n(rect.width)}" height="${n(rect.height)}" fill="#ffffff"/>` })
  }

  for (const text of drawing.texts) {
    const size = printedTextSize(text, scale)
    const attributes = [
      `x="${n(text.x)}"`,
      `y="${n(text.y)}"`,
      `font-size="${n(size)}"`,
      text.bold ? 'font-weight="bold"' : '',
      text.anchor === 'middle' ? 'text-anchor="middle"' : '',
      `fill="${text.muted ? MUTED_INK : INK}"`,
      text.angle ? `transform="rotate(${n(text.angle)} ${n(text.x)} ${n(text.y)})"` : '',
    ].filter(Boolean)
    pieces.push({ category: text.category, svg: `<text ${attributes.join(' ')}>${escapeXml(text.text)}</text>` })
  }

  // Calques : morceaux consécutifs de la même catégorie, dans l'ordre de peinture.
  const layers: string[] = []
  let run: Piece[] = []
  const flush = () => {
    if (run.length === 0) return
    const key = run[0].category ?? 'base'
    const label = escapeXml(options.layerNames[key])
    layers.push(`<g inkscape:groupmode="layer" inkscape:label="${label}" data-category="${key}">${run.map((p) => p.svg).join('')}</g>`)
    run = []
  }
  for (const piece of pieces) {
    if (run.length > 0 && run[0].category !== piece.category) flush()
    run.push(piece)
  }
  flush()

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${n(drawing.width / scale)}mm" height="${n(drawing.height / scale)}mm" viewBox="0 0 ${n(drawing.width)} ${n(drawing.height)}" font-family="'Liberation Sans', Arial, Helvetica, sans-serif">`,
    `<title>${escapeXml(options.title)}</title>`,
    `<rect width="${n(drawing.width)}" height="${n(drawing.height)}" fill="#ffffff"/>`,
    ...layers,
    '</svg>',
    '',
  ].join('\n')
}
