import type { DrawCategory, Drawing, DrawLine, DrawText, PlanOverlay } from './drawing'

/**
 * Styles graphiques des feuilles (M20 20.5) : épaisseurs de trait imprimées selon l'échelle,
 * catégories (calques) et visibilité. Une seule table pour le PDF ; l'écran garde ses épaisseurs en
 * pixels, dans les mêmes rapports.
 */

/** Catégories dans l'ordre du panneau « Visibilité ». `hatch` : les hachures des matières coupées. */
export const VISIBILITY_KEYS = [
  'walls',
  'hatch',
  'columns',
  'openings',
  'stairs',
  'furniture',
  'rooms',
  'dimensions',
  'marks',
  'axes',
] as const satisfies readonly (DrawCategory | 'hatch')[]

export type VisibilityKey = (typeof VISIBILITY_KEYS)[number]

/** Épaisseurs de trait d'un dessin, en mm sur le papier. */
export interface LineWeights {
  /** Ligne de sol des façades et coupes, flèches de pente. */
  heavy: number
  /** Contour d'une matière coupée (murs, poteaux). */
  cut: number
  /** Éléments vus (menuiseries, mobilier, escaliers, traits de cote obliques). */
  normal: number
  /** Filets : lignes de cote et d'attache, axes, éléments au-dessus de la coupe (pointillés). */
  hair: number
  /** Hachures des matières coupées. */
  hatch: number
}

/**
 * Épaisseurs imprimées selon l'échelle (série ISO 128 : 0,13 · 0,18 · 0,25 · 0,35 · 0,5 · 0,7 mm),
 * comme les plumes d'un logiciel de dessin qui dépendent de l'échelle de la vue : plus l'échelle est
 * petite, plus les traits sont fins, pour que le dessin reste lisible. Proposé par Claude, à valider.
 *   - 1:50 et plus grand (1:20, 1:10) : coupé 0,5 · vu 0,25 · filet 0,13 · hachure 0,1 · sol 0,7
 *   - 1:100 : coupé 0,35 · vu 0,18 · filet 0,13 · hachure 0,08 · sol 0,5
 *   - 1:200 et plus petit : coupé 0,25 · vu 0,13 · filet 0,1 · hachure 0,07 · sol 0,35
 * Une échelle libre (« Ajuster à la page ») prend la tranche la plus proche.
 */
export function lineWeights(scale: number): LineWeights {
  if (scale <= 75) return { heavy: 0.7, cut: 0.5, normal: 0.25, hair: 0.13, hatch: 0.1 }
  if (scale <= 150) return { heavy: 0.5, cut: 0.35, normal: 0.18, hair: 0.13, hatch: 0.08 }
  return { heavy: 0.35, cut: 0.25, normal: 0.13, hair: 0.1, hatch: 0.07 }
}

/** Épaisseur d'un trait du dessin. */
export function lineWidth(weights: LineWeights, weight: DrawLine['weight']): number {
  return weights[weight ?? 'normal']
}

/** Range tous les éléments d'un calque d'annotations dans une catégorie (ceux déjà rangés le restent). */
export function tagOverlay<T extends PlanOverlay | null>(overlay: T, category: DrawCategory): T {
  if (!overlay) return overlay
  return {
    ...overlay,
    lines: overlay.lines.map((l) => ({ category, ...l })),
    texts: overlay.texts.map((t) => ({ category, ...t })),
    ...(overlay.polygons ? { polygons: overlay.polygons.map((p) => ({ category, ...p })) } : {}),
    ...(overlay.cutPolygons ? { cutPolygons: overlay.cutPolygons.map((p) => ({ category, ...p })) } : {}),
  } as T
}

/**
 * Dessin sans les catégories masquées (M20 20.5). Les éléments sans catégorie restent toujours ;
 * `hatch` retire les hachures en gardant le fond et le contour de la matière. Même dessin à l'écran et
 * dans le PDF.
 */
export function applyVisibility(drawing: Drawing, hidden: ReadonlySet<VisibilityKey>): Drawing {
  if (hidden.size === 0) return drawing
  const shown = (category: DrawCategory | undefined) => !category || !hidden.has(category)
  return {
    ...drawing,
    polygons: drawing.polygons
      .filter((p) => shown(p.category))
      .map((p) => {
        if (!hidden.has('hatch') || !p.hatch) return p
        const rest = { ...p }
        delete rest.hatch
        return rest
      }),
    lines: drawing.lines.filter((l) => shown(l.category)),
    texts: drawing.texts.filter((t) => shown(t.category)),
  }
}

/** Largeur estimée d'un texte (Helvetica), mm, quand on ne peut pas la mesurer (écran). */
export function estimatedTextWidth(t: Pick<DrawText, 'text' | 'bold'>, size: number): number {
  return t.text.length * size * (t.bold ? 0.6 : 0.53)
}

/**
 * Rectangle du masque blanc d'un texte (M20 20.5) : le texte, ses jambages, et une petite marge.
 * `size` : hauteur du texte, `width` : sa largeur (mesurée dans le PDF, estimée à l'écran). `null` pour
 * un texte tourné (les noms de pièces masqués ne le sont jamais).
 */
export function textMask(t: DrawText, size: number, width: number): { x: number; y: number; width: number; height: number } | null {
  if (t.angle) return null
  const pad = size * 0.2
  const left = t.anchor === 'middle' ? t.x - width / 2 : t.x
  return { x: left - pad, y: t.y - size * 0.8 - pad, width: width + pad * 2, height: size * 1.05 + pad * 2 }
}
