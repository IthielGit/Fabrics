import type { Size, SymbolDef } from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Taille d'un objet après un redimensionnement demandé (`requested`), selon son mode :
 * - `fixed` : la taille actuelle ne change pas ;
 * - `length` : seule la largeur change, la profondeur reste celle du catalogue ;
 * - `ratio` : les proportions actuelles sont gardées (la dimension qui a changé commande l'autre) ;
 * - `free` : largeur et profondeur libres.
 * Le résultat reste dans les limites `min` / `max` du catalogue, en mm entiers.
 */
export function resizeSymbol(def: SymbolDef, requested: Size, current: Size): Size {
  const { min, max } = def

  switch (def.resize) {
    case 'fixed':
      return { ...current }
    case 'length':
      return {
        width: Math.round(clamp(requested.width, min.width, max.width)),
        depth: def.depth,
      }
    case 'ratio': {
      const ratio = current.width / current.depth
      // La largeur commande, sauf si seule la profondeur a changé.
      const byDepth = requested.width === current.width && requested.depth !== current.depth
      const low = Math.max(min.width, min.depth * ratio)
      const high = Math.min(max.width, max.depth * ratio)
      const wanted = byDepth ? requested.depth * ratio : requested.width
      const width = clamp(wanted, low, Math.max(low, high))
      return { width: Math.round(width), depth: Math.round(width / ratio) }
    }
    case 'free':
      return {
        width: Math.round(clamp(requested.width, min.width, max.width)),
        depth: Math.round(clamp(requested.depth, min.depth, max.depth)),
      }
  }
}
