import type { WallMaterial } from '../../types/document'
import type { Point } from '../geometry/viewport'

/**
 * Modèle 3D neutre du bâtiment (sans Three.js). Unités : mm.
 * Repère 3D : x = x du plan, y = hauteur, z = y du plan.
 */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/** Boîte orientée autour de l'axe vertical : un morceau de mur (trumeau, allège ou linteau). */
export interface WallPiece {
  /** Identifiant du mur du document (sert à la sélection depuis la 3D). */
  sourceId: string
  levelId: string
  /** Centre de la boîte. */
  center: Vec3
  /** x = longueur le long du mur, y = hauteur, z = épaisseur. */
  size: Vec3
  /** Rotation autour de l'axe y, en radians (convention Three.js). */
  rotationY: number
  /** Matériau du mur (hachure en coupe) ; absent : rendu neutre. */
  material?: WallMaterial
}

/** Dalle sous une pièce, ou toit plat au-dessus : polygone extrudé verticalement. */
export interface SlabShape {
  /** Identifiant de la pièce du document. */
  sourceId: string
  levelId: string
  kind: 'slab' | 'roof' | 'platform'
  /** Contour dans le plan (x, y du document), sans point de fermeture. */
  outline: Point[]
  /** Altitude du dessous, mm. */
  baseY: number
  /** Épaisseur, mm. */
  thickness: number
  /** Trous (trémies d'escalier), dans le plan : chacun tient entièrement dans le contour. */
  holes?: Point[][]
  /** Dalle du niveau le plus bas : sous le terrain, la vue 3D ne la dessine pas (les coupes, si). */
  onGround?: boolean
}

/** Remplissage d'une ouverture en 3D : cadre, vitre ou vantail de porte (boîte orientée). */
export interface OpeningFill extends WallPiece {
  kind: 'frame' | 'glass' | 'door'
}

/**
 * Morceau de toiture en pente (M10 bis) : un polygone plan (dessus d'un versant, ou pignon vertical
 * au nu extérieur du mur) poussé de `extrude` (vers le bas pour un versant, vers l'intérieur pour un
 * pignon). Prisme droit ou oblique : même forme pour la 3D, les façades et les coupes.
 */
export interface RoofPrism {
  /** Identifiant de la toiture du document. */
  sourceId: string
  levelId: string
  kind: 'roof' | 'gable'
  /** Contour du polygone (3D, au moins 3 points, dans un même plan). */
  polygon: Vec3[]
  /** Décalage de la face opposée (mm). */
  extrude: Vec3
}

/**
 * Trait de façade d'une ouverture (triangle d'ouverture vers les gonds, flèche d'un coulissant,
 * marque de l'oscillo-battant). Il n'a pas de volume : la 3D ne le dessine pas, les façades oui.
 * Les points sont dans le plan de la baie (milieu de l'épaisseur du mur).
 */
export interface OpeningMark {
  /** Mur porteur. */
  sourceId: string
  levelId: string
  /** Au moins deux points : une ligne brisée. */
  points: Vec3[]
  dashed: boolean
}

/**
 * Une face rectangulaire d'un mur : coins dans l'ordre (bas début, bas fin, haut fin, haut début)
 * pour une face verticale. `edges[i]` dit si le côté coin i → coin i+1 est un vrai bord à tracer
 * (contour du mur, bord d'une ouverture, angle) ou une simple jonction avec la face voisine du
 * même plan (pas de trait : le mur se lit d'un seul tenant).
 */
export interface WallQuad {
  corners: [Vec3, Vec3, Vec3, Vec3]
  /** Normale sortante (unitaire). */
  normal: Vec3
  edges: [boolean, boolean, boolean, boolean]
}

/**
 * Un mur entier en un seul maillage de triangles (vue 3D) : mêmes volumes que ses `WallPiece`,
 * mais sans faces superposées ni coutures entre morceaux. Coordonnées en mm, repère 3D.
 */
export interface WallMesh {
  sourceId: string
  levelId: string
  /** Les faces du mur (rectangles de la grille), pour les façades et les coupes. */
  quads: WallQuad[]
  /** Sommets des triangles, x y z à la suite (3 sommets par triangle, sens trigonométrique vu de l'extérieur). */
  positions: number[]
  /** Normale de chaque sommet, x y z à la suite. */
  normals: number[]
}

export interface Bounds3 {
  min: Vec3
  max: Vec3
}

export interface BuildingModel {
  /** Morceaux de mur (boîtes) : façades, coupes, emprise. */
  walls: WallPiece[]
  /** Les mêmes murs en maillages sans couture, pour la vue 3D. */
  wallMeshes: WallMesh[]
  /** Marches et paliers des escaliers (mêmes boîtes orientées que les murs). */
  steps: WallPiece[]
  /** Cheminées : une boîte du plancher de leur niveau jusqu'au-dessus du dernier niveau. */
  chimneys: WallPiece[]
  slabs: SlabShape[]
  /** Cadres, vitres et portes dans les ouvertures (vue 3D seulement ; `sourceId` = mur porteur). */
  fills: OpeningFill[]
  /** Traits de façade des ouvertures (triangles d'ouverture, flèches) ; absents de la 3D. */
  marks: OpeningMark[]
  /** Versants et pignons des toitures en pente (un toit plat dessiné est une dalle `roof`). */
  roofs: RoofPrism[]
  /** Emprise de tout le modèle, ou `null` s'il est vide. */
  bounds: Bounds3 | null
}

export interface BuildOptions {
  /**
   * Dernier niveau affiché (vue « étage ouvert ») : les niveaux au-dessus sont ignorés et il n'y a
   * pas de toit. Absent : tous les niveaux, avec un toit plat sur chaque pièce sans pièce au-dessus.
   */
  upToLevelId?: string
}
