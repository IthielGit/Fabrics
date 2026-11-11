// Bibliothèque d'objets (M7) — voir docs/06-BIBLIOTHEQUE.md.
// Un objet est décrit par des données : une fonction pure `draw(largeur, profondeur)` renvoie des
// primitives de dessin que le canevas (Konva) et l'aperçu du panneau (SVG) affichent tous deux.

export type SymbolCategory =
  | 'living'
  | 'dining'
  | 'bedroom'
  | 'office'
  | 'storage'
  | 'kitchen'
  | 'bathroom'
  | 'laundry'
  | 'stairs'
  | 'electrical'
  | 'hvac'
  | 'safety'
  | 'outdoor'
  | 'vehicles'
  | 'hospitality'
  | 'health-education'
  | 'leisure'
  | 'prefabs'
  | 'sets'

/**
 * Mode de redimensionnement :
 * - `free` : largeur et profondeur libres ;
 * - `ratio` : proportions verrouillées (arbres, objets ronds) ;
 * - `length` : seule la largeur est libre, la profondeur reste celle du catalogue ;
 * - `fixed` : taille imposée (symboles conventionnels, appareils à taille normalisée).
 */
export type ResizeMode = 'free' | 'ratio' | 'length' | 'fixed'

/**
 * Style d'une primitive (voir « Conventions de dessin », docs/06-BIBLIOTHEQUE.md) :
 * - `outline` : contour de l'objet, rempli de blanc cassé ;
 * - `detail` : détails (tiroirs, coussins, feux), sans remplissage ;
 * - `above` : élément situé au-dessus du plan de coupe, en pointillé ;
 * - `zone` : zone libre à respecter, en pointillé long, sans remplissage ;
 * - `soft` : aplat clair sans contour.
 */
export type PrimitiveStyle = 'outline' | 'detail' | 'above' | 'zone' | 'soft'

/** Primitives de dessin, en mm, dans le repère de l'objet : origine = coin haut-gauche, Y vers le bas. */
export type Primitive =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number; style: PrimitiveStyle }
  | { kind: 'circle'; cx: number; cy: number; r: number; style: PrimitiveStyle }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; style: PrimitiveStyle }
  /** Polyligne ouverte `[x1, y1, x2, y2, …]`. */
  | { kind: 'line'; points: number[]; style: PrimitiveStyle }
  /** Polygone fermé `[x1, y1, x2, y2, …]`. */
  | { kind: 'polygon'; points: number[]; style: PrimitiveStyle }
  /** Arc de cercle ; angles en degrés depuis l'axe X vers l'axe Y (sens horaire à l'écran), `from` < `to`. */
  | { kind: 'arc'; cx: number; cy: number; r: number; from: number; to: number; style: PrimitiveStyle }

export interface Size {
  width: number
  depth: number
}

export interface SymbolSizeOption extends Size {
  /** Texte de la puce (par exemple « 1800 × 2000 »). */
  label: string
}

export interface SymbolDef {
  /** kebab-case anglais, unique : `bed-queen`. */
  id: string
  category: SymbolCategory
  /** Taille par défaut, en mm. */
  width: number
  depth: number
  /** Tailles rapides proposées dans les propriétés. */
  sizes?: readonly SymbolSizeOption[]
  min: Size
  max: Size
  resize: ResizeMode
  /** Bouton « Retourner » proposé. */
  mirrorable: boolean
  /** Symbole conventionnel (pas à l'échelle réelle) : prises, détecteurs… */
  nominal?: boolean
  /** Surface de référence (cercle de manœuvre, place de stationnement…). */
  zone?: boolean
  /** Hauteur typique, en mm (réservée à la 3D, M8). */
  height: number
  /** Hauteur de pose, en mm (meuble haut, applique…), réservée à la 3D. */
  elevation?: number
  /** Dessin pour une largeur et une profondeur données : toutes les coordonnées dans [0, w] × [0, d]. */
  draw: (width: number, depth: number) => Primitive[]
}
