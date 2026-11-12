import type { RoofCovering, RoofElement, WallElement, WallMaterial } from '../../types/document'

/**
 * Matériaux des murs et couvertures des toitures (M10 bis lot C). Un seul champ par élément : la
 * hachure en coupe vient du matériau, la texture de façade s'en déduit (D46). Sans matériau, le
 * rendu reste neutre (murs coupés en noir, façades blanches).
 */
export const WALL_MATERIALS: readonly WallMaterial[] = [
  'concrete',
  'masonry',
  'brick',
  'wood',
  'insulation',
  'plasterboard',
]

export const ROOF_COVERINGS: readonly RoofCovering[] = ['tiles', 'slates', 'zinc', 'steel', 'flat']

/** Copie du mur avec ce matériau ; `undefined` retire le champ (rendu neutre, fichier inchangé). */
export function withWallMaterial(wall: WallElement, material: WallMaterial | undefined): WallElement {
  const { material: _previous, ...rest } = wall
  return material ? { ...rest, material } : rest
}

/** Copie du toit avec cette couverture ; `undefined` retire le champ. */
export function withRoofCovering(roof: RoofElement, covering: RoofCovering | undefined): RoofElement {
  const { covering: _previous, ...rest } = roof
  return covering ? { ...rest, covering } : rest
}

/** Valeur commune d'une liste (`undefined` si aucune), ou `'mixed'` si elle diffère. */
export function commonChoice<T>(values: readonly (T | undefined)[]): T | undefined | 'mixed' {
  const first = values[0]
  return values.every((v) => v === first) ? first : 'mixed'
}

/** Hachure d'une matière coupée : une par matériau de mur. */
export type HatchPattern = WallMaterial

/** Texture vue en façade : parement d'un mur ou couverture d'un versant. */
export type FacadeTexture = 'render' | 'brick' | 'cladding' | 'tiles' | 'slates' | 'zinc' | 'steel'

export function isWallMaterial(value: unknown): value is WallMaterial {
  return typeof value === 'string' && (WALL_MATERIALS as readonly string[]).includes(value)
}

export function isRoofCovering(value: unknown): value is RoofCovering {
  return typeof value === 'string' && (ROOF_COVERINGS as readonly string[]).includes(value)
}

/**
 * Parement vu en façade, déduit du matériau : brique apparente, bardage pour le bois, enduit pour
 * le béton et la maçonnerie. Isolant et plaque de plâtre (cloisons, doublages) : pas de texture.
 */
export function wallFacadeTexture(material: WallMaterial | undefined): FacadeTexture | null {
  switch (material) {
    case 'brick':
      return 'brick'
    case 'wood':
      return 'cladding'
    case 'concrete':
    case 'masonry':
      return 'render'
    default:
      return null
  }
}

/** Texture des versants vus en façade. Toiture plate (étanchéité) ou sans couverture : aucune. */
export function roofFacadeTexture(covering: RoofCovering | undefined): FacadeTexture | null {
  switch (covering) {
    case 'tiles':
    case 'slates':
    case 'zinc':
    case 'steel':
      return covering
    default:
      return null
  }
}
