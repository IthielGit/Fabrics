import type { OpeningElement, OpeningStyle } from '../../types/document'
import { OPENING_DEFAULTS } from '../documents/elements'
import type { OpeningSize } from '../geometry/openingPlacement'
import type { Interval } from '../geometry/openings'

/**
 * Catalogue des styles de portes, fenêtres et baies (M10 bis, lot A). Fonctions pures.
 * Un style ne change que le dessin (plan, façade, 3D) : le trou dans le mur et les métrés restent
 * ceux de la largeur, de la hauteur et de l'allège.
 */

type Kind = OpeningElement['kind']

export interface OpeningStyleDef extends OpeningSize {
  style: OpeningStyle
}

/** Styles permis par type, le premier étant le style par défaut (le dessin d'avant M10 bis). */
export const OPENING_STYLES: Record<Kind, readonly OpeningStyleDef[]> = {
  door: [
    { style: 'swing', ...OPENING_DEFAULTS.door },
    { style: 'double', width: 1400, height: 2100, sillHeight: 0 },
    { style: 'slidingSurface', width: 900, height: 2100, sillHeight: 0 },
    { style: 'slidingPocket', width: 900, height: 2100, sillHeight: 0 },
    { style: 'folding', width: 900, height: 2100, sillHeight: 0 },
    { style: 'swingBoth', width: 900, height: 2100, sillHeight: 0 },
    { style: 'garageSectional', width: 2400, height: 2000, sillHeight: 0 },
    { style: 'garageTilt', width: 2400, height: 2000, sillHeight: 0 },
  ],
  window: [
    { style: 'casement2', ...OPENING_DEFAULTS.window },
    { style: 'casement1', width: 700, height: 1200, sillHeight: 900 },
    { style: 'fixed', width: 1200, height: 1000, sillHeight: 900 },
    { style: 'sliding', width: 1500, height: 1200, sillHeight: 900 },
    { style: 'tilt', width: 600, height: 400, sillHeight: 1600 },
  ],
  bay: [
    { style: 'bay-sliding', ...OPENING_DEFAULTS.bay },
    { style: 'bay-fixed', width: 2400, height: 2150, sillHeight: 0 },
    { style: 'free', width: 1000, height: 2100, sillHeight: 0 },
  ],
}

/** Taille rapide : un style et une taille de départ choisis en un clic (jamais un style en double). */
export interface QuickSize extends OpeningStyleDef {
  id: 'entryDoor' | 'frenchWindow1' | 'frenchWindow2' | 'shopWindow' | 'passThrough'
  kind: Kind
}

export const QUICK_SIZES: readonly QuickSize[] = [
  { id: 'entryDoor', kind: 'door', style: 'swing', width: 1000, height: 2150, sillHeight: 0 },
  { id: 'frenchWindow1', kind: 'window', style: 'casement1', width: 900, height: 2150, sillHeight: 0 },
  { id: 'frenchWindow2', kind: 'window', style: 'casement2', width: 1400, height: 2150, sillHeight: 0 },
  { id: 'shopWindow', kind: 'bay', style: 'bay-fixed', width: 3000, height: 2200, sillHeight: 0 },
  { id: 'passThrough', kind: 'bay', style: 'free', width: 600, height: 600, sillHeight: 1000 },
]

/** Tailles rapides proposées pour un type d'ouverture. */
export function quickSizesFor(kind: Kind): QuickSize[] {
  return QUICK_SIZES.filter((quick) => quick.kind === kind)
}

/** Style par défaut d'un type : celui qu'avait l'ouverture avant M10 bis. */
export function defaultStyle(kind: Kind): OpeningStyle {
  return OPENING_STYLES[kind][0].style
}

/** Le style est-il permis pour ce type ? */
export function isStyleAllowed(kind: Kind, style: OpeningStyle): boolean {
  return OPENING_STYLES[kind].some((def) => def.style === style)
}

/** Style effectif d'une ouverture : son style s'il est valide pour son type, sinon celui par défaut. */
export function openingStyle(opening: Pick<OpeningElement, 'kind' | 'style'>): OpeningStyle {
  return opening.style && isStyleAllowed(opening.kind, opening.style)
    ? opening.style
    : defaultStyle(opening.kind)
}

/** Taille par défaut d'un style, ou `null` si le style n'existe pas pour ce type. */
export function styleSize(kind: Kind, style: OpeningStyle): OpeningSize | null {
  const def = OPENING_STYLES[kind].find((item) => item.style === style)
  return def ? { width: def.width, height: def.height, sillHeight: def.sillHeight } : null
}

/** L'option oscillo-battant existe pour les fenêtres à vantaux (un ou deux). */
export function supportsTiltTurn(style: OpeningStyle): boolean {
  return style === 'casement1' || style === 'casement2'
}

/**
 * La porte à galandage coulisse dans le mur : il faut, d'un côté de l'ouverture, une longueur de
 * mur libre au moins égale à sa largeur (entre elle et sa voisine ou le bout du segment).
 * `siblings` : les autres ouvertures du même segment.
 */
export function hasPocketRoom(
  offset: number,
  width: number,
  segmentLength: number,
  siblings: readonly Interval[],
): boolean {
  const from = offset - width / 2
  const to = offset + width / 2
  const before = Math.max(0, ...siblings.filter((s) => s.to <= from + 1e-6).map((s) => s.to))
  const after = Math.min(segmentLength, ...siblings.filter((s) => s.from >= to - 1e-6).map((s) => s.from))
  return from - before >= width - 1e-6 || after - to >= width - 1e-6
}
