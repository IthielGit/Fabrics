import type { OpeningElement } from '../../types/document'
import { openingStyle } from '../openings/styles'

/**
 * Dessin 2D d'une ouverture, en repère local : l'origine est le centre de l'ouverture,
 * x suit l'axe du mur, y va vers la normale (le « côté gauche » du mur, comme `wallFaces`).
 * Toutes les valeurs sont en mm.
 */
export interface OpeningSymbol {
  /** Rectangle retiré du mur (un peu plus épais que lui pour ne laisser aucun filet). */
  cut: { x: number; y: number; width: number; height: number }
  /** Traits pleins à dessiner : `[x1, y1, x2, y2, …]` chacun. */
  lines: number[][]
  /** Traits en pointillé (position ouverte, rails, galandage) : même forme que `lines`. */
  dashed: number[][]
}

/** Marge ajoutée à l'épaisseur du mur pour que la découpe efface tout le mur, en mm. */
const CUT_OVERFLOW = 4
/** Nombre de segments de l'arc d'ouverture d'une porte. */
const ARC_STEPS = 24
/** Distance entre le mur et le vantail d'une porte coulissante en applique, en mm. */
const SURFACE_GAP = 40

type SymbolInput = Pick<OpeningElement, 'kind' | 'width' | 'hinge' | 'side'> &
  Partial<Pick<OpeningElement, 'style'>>

/**
 * Battant (ouvert à 90°) et arc d'ouverture. `hx` : abscisse de la charnière ; `d` : direction du
 * battant fermé, de la charnière vers l'autre montant (+1 ou −1) ; `s` : sens d'ouverture sur y.
 */
function leafLines(hx: number, length: number, d: 1 | -1, s: 1 | -1): number[][] {
  // Le battant ouvert part de la charnière, perpendiculaire au mur, du côté de l'ouverture.
  const leaf = [hx, 0, hx, s * length]

  // Arc de quart de cercle centré sur la charnière : du bout du battant ouvert au bout du battant fermé.
  const start = s * 90 // degrés, direction (0, s)
  const sweep = -s * d * 90 // produit vectoriel (0, s) × (d, 0) = −s·d
  const arc: number[] = []
  for (let i = 0; i <= ARC_STEPS; i++) {
    const angle = ((start + (sweep * i) / ARC_STEPS) * Math.PI) / 180
    arc.push(hx + length * Math.cos(angle), length * Math.sin(angle))
  }
  return [leaf, arc]
}

/** Battant (ouvert à 90°) et arc d'ouverture d'une porte. */
function doorLines(width: number, hinge: 'start' | 'end', side: 'left' | 'right'): number[][] {
  const hx = hinge === 'start' ? -width / 2 : width / 2
  return leafLines(hx, width, hinge === 'start' ? 1 : -1, side === 'left' ? 1 : -1)
}

/** Pointe de flèche à l'extrémité (x, y) d'un trait qui va dans la direction `d` (+1 ou −1) sur x. */
function arrowHead(x: number, y: number, d: 1 | -1, size: number): number[] {
  return [x - d * size, y - size / 2, x, y, x - d * size, y + size / 2]
}

/** Dessin d'une ouverture de largeur `width` dans un mur de `thickness` mm. */
export function openingSymbol(opening: SymbolInput, thickness: number): OpeningSymbol {
  const w = opening.width
  const half = w / 2
  const t = thickness / 2
  const cut = {
    x: -half,
    y: -t - CUT_OVERFLOW / 2,
    width: w,
    height: thickness + CUT_OVERFLOW,
  }
  const s: 1 | -1 = opening.side === 'left' ? 1 : -1 // côté vers lequel la porte s'ouvre
  const d: 1 | -1 = opening.hinge === 'start' ? 1 : -1 // du côté des gonds vers l'autre montant
  const jambs = [
    [-half, -t, -half, t],
    [half, -t, half, t],
  ]
  /** Cadre d'une fenêtre, avec les deux traits fins du vitrage. */
  const frame = [-half, -t, half, -t, half, t, -half, t, -half, -t]
  const glazing = [
    [-half, -t / 3, half, -t / 3],
    [-half, t / 3, half, t / 3],
  ]

  switch (openingStyle({ kind: opening.kind, style: opening.style })) {
    // --- Portes ---
    case 'swing':
      return { cut, lines: [...jambs, ...doorLines(w, opening.hinge, opening.side)], dashed: [] }
    case 'double':
      return {
        cut,
        lines: [...jambs, ...leafLines(-half, half, 1, s), ...leafLines(half, half, -1, s)],
        dashed: [],
      }
    case 'swingBoth':
      // Va-et-vient : le battant passe des deux côtés du mur.
      return {
        cut,
        lines: [...jambs, ...doorLines(w, opening.hinge, 'left'), ...doorLines(w, opening.hinge, 'right')],
        dashed: [],
      }
    case 'slidingSurface': {
      // Vantail posé contre la face du mur, qui coulisse devant le mur du côté « gonds » (le côté
      // où il se range ; le champ `hinge` sert ici à choisir ce côté).
      const near = s * (t + SURFACE_GAP / 2)
      const far = s * (t + SURFACE_GAP * 1.5)
      const arrowY = s * (t + SURFACE_GAP * 3)
      return {
        cut,
        lines: [
          ...jambs,
          [-half, near, half, near, half, far, -half, far, -half, near],
          [0, arrowY, -d * half, arrowY],
          arrowHead(-d * half, arrowY, -d as 1 | -1, SURFACE_GAP * 1.5),
        ],
        dashed: [],
      }
    }
    case 'slidingPocket':
      return {
        cut,
        // Vantail fermé dans l'ouverture ; il rentre dans le mur du côté des gonds (pointillé).
        lines: [...jambs, [-half, -t / 4, half, -t / 4], [-half, t / 4, half, t / 4]],
        dashed: [
          [-d * half, -t / 2, -d * (half + w), -t / 2, -d * (half + w), t / 2, -d * half, t / 2],
        ],
      }
    case 'folding': {
      // Vantaux articulés : quatre panneaux en zigzag à partir des gonds.
      const hx = -d * half
      const zigzag: number[] = []
      for (let i = 0; i <= 4; i++) zigzag.push(hx + d * (w / 4) * i, i % 2 === 1 ? s * (w / 8) : 0)
      return { cut, lines: [...jambs, zigzag], dashed: [] }
    }
    case 'garageSectional':
      // Sectionnelle : le panneau monte le long de rails à l'intérieur (pointillés).
      return {
        cut,
        lines: [...jambs, [-half, -t / 4, half, -t / 4], [-half, t / 4, half, t / 4]],
        dashed: [
          [-half * 0.9, 0, -half * 0.9, s * w * 0.7],
          [half * 0.9, 0, half * 0.9, s * w * 0.7],
          [-half * 0.9, s * w * 0.7, half * 0.9, s * w * 0.7],
        ],
      }
    case 'garageTilt':
      // Basculante : le panneau avance vers l'extérieur quand il s'ouvre (pointillés).
      return {
        cut,
        lines: [...jambs, [-half, -t / 4, half, -t / 4], [-half, t / 4, half, t / 4]],
        dashed: [[-half, 0, -half * 0.7, -s * w * 0.3, half * 0.7, -s * w * 0.3, half, 0]],
      }

    // --- Fenêtres ---
    case 'casement2':
      return { cut, lines: [frame, ...glazing], dashed: [] }
    case 'casement1': {
      // Un seul vantail : un trait de dormant près des gonds.
      const sashX = -d * (half - Math.min(60, half / 4))
      return { cut, lines: [frame, ...glazing, [sashX, -t, sashX, t]], dashed: [] }
    }
    case 'fixed':
      return { cut, lines: [frame, [-half, 0, half, 0]], dashed: [] }
    case 'sliding': {
      // Deux rails : les vitrages se croisent au milieu.
      const overlap = w * 0.05
      return {
        cut,
        lines: [
          frame,
          [-half, -t / 3, overlap, -t / 3],
          [-overlap, t / 3, half, t / 3],
        ],
        dashed: [],
      }
    }
    case 'tilt':
      // Soufflet : le vitrage bascule autour de son axe ; trait pointillé au milieu.
      return { cut, lines: [frame, ...glazing], dashed: [[-half, 0, half, 0]] }

    // --- Baies ---
    case 'bay-sliding':
      // Baie coulissante : seuls les montants sont tracés.
      return { cut, lines: jambs, dashed: [] }
    case 'bay-fixed':
      return { cut, lines: [...jambs, [-half, 0, half, 0]], dashed: [] }
    case 'free':
      // Ouverture libre : seuils en pointillé sur les deux faces du mur.
      return { cut, lines: jambs, dashed: [[-half, -t, half, -t], [-half, t, half, t]] }
  }
}
