import type { OpeningElement } from '../../types/document'

/**
 * Dessin 2D d'une ouverture, en repère local : l'origine est le centre de l'ouverture,
 * x suit l'axe du mur, y va vers la normale (le « côté gauche » du mur, comme `wallFaces`).
 * Toutes les valeurs sont en mm.
 */
export interface OpeningSymbol {
  /** Rectangle retiré du mur (un peu plus épais que lui pour ne laisser aucun filet). */
  cut: { x: number; y: number; width: number; height: number }
  /** Traits à dessiner : `[x1, y1, x2, y2, …]` chacun. */
  lines: number[][]
}

/** Marge ajoutée à l'épaisseur du mur pour que la découpe efface tout le mur, en mm. */
const CUT_OVERFLOW = 4
/** Nombre de segments de l'arc d'ouverture d'une porte. */
const ARC_STEPS = 24

type SymbolInput = Pick<OpeningElement, 'kind' | 'width' | 'hinge' | 'side'>

/** Battant (ouvert à 90°) et arc d'ouverture d'une porte. */
function doorLines(width: number, hinge: 'start' | 'end', side: 'left' | 'right'): number[][] {
  const hx = hinge === 'start' ? -width / 2 : width / 2
  const s = side === 'left' ? 1 : -1 // sens d'ouverture sur y
  const d = hinge === 'start' ? 1 : -1 // direction du battant fermé, de la charnière à l'autre montant

  // Le battant ouvert part de la charnière, perpendiculaire au mur, du côté de l'ouverture.
  const leaf = [hx, 0, hx, s * width]

  // Arc de quart de cercle centré sur la charnière : du bout du battant ouvert au bout du battant fermé.
  const start = s * 90 // degrés, direction (0, s)
  const sweep = -s * d * 90 // produit vectoriel (0, s) × (d, 0) = −s·d
  const arc: number[] = []
  for (let i = 0; i <= ARC_STEPS; i++) {
    const angle = ((start + (sweep * i) / ARC_STEPS) * Math.PI) / 180
    arc.push(hx + width * Math.cos(angle), width * Math.sin(angle))
  }
  return [leaf, arc]
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

  switch (opening.kind) {
    case 'door':
      return {
        cut,
        lines: [
          // Montants de chaque côté, puis le battant et son arc.
          [-half, -t, -half, t],
          [half, -t, half, t],
          ...doorLines(w, opening.hinge, opening.side),
        ],
      }
    case 'window':
      return {
        cut,
        lines: [
          [-half, -t, half, -t, half, t, -half, t, -half, -t],
          // Vitrage : deux traits fins dans l'épaisseur du mur.
          [-half, -t / 3, half, -t / 3],
          [-half, t / 3, half, t / 3],
        ],
      }
    case 'bay':
      // Baie : simple passage, seuls les montants sont tracés.
      return {
        cut,
        lines: [
          [-half, -t, -half, t],
          [half, -t, half, t],
        ],
      }
  }
}
