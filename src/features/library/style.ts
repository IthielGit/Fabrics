import type { PrimitiveStyle } from './types'

/** Apparence d'un style de primitive ; épaisseurs en mm sur le plan, tirets en mm. */
export interface StyleLook {
  /** Couleur du trait, ou `null` pour pas de trait. */
  stroke: string | null
  /** Épaisseur du trait, en mm. */
  strokeWidth: number
  /** Couleur de remplissage, ou `null` pour transparent. */
  fill: string | null
  /** Tirets (longueur, espace…) en mm, ou `null` pour un trait plein. */
  dash: number[] | null
}

const DARK = '#374151'
const MEDIUM = '#6b7280'

/** Table commune au canevas et à l'aperçu (voir « Conventions de dessin », docs/06-BIBLIOTHEQUE.md). */
export const STYLE_LOOKS: Record<PrimitiveStyle, StyleLook> = {
  outline: { stroke: DARK, strokeWidth: 15, fill: '#faf9f7', dash: null },
  detail: { stroke: MEDIUM, strokeWidth: 8, fill: null, dash: null },
  above: { stroke: MEDIUM, strokeWidth: 8, fill: null, dash: [60, 40] },
  zone: { stroke: MEDIUM, strokeWidth: 6, fill: null, dash: [160, 60] },
  soft: { stroke: null, strokeWidth: 0, fill: '#e5e7eb', dash: null },
}
