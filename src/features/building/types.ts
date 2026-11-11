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
}

export interface Bounds3 {
  min: Vec3
  max: Vec3
}

export interface BuildingModel {
  walls: WallPiece[]
  /** Marches et paliers des escaliers (mêmes boîtes orientées que les murs). */
  steps: WallPiece[]
  /** Cheminées : une boîte du plancher de leur niveau jusqu'au-dessus du dernier niveau. */
  chimneys: WallPiece[]
  slabs: SlabShape[]
  /** Emprise de tout le modèle, ou `null` s'il est vide. */
  bounds: Bounds3 | null
}

export interface BuildOptions {
  /**
   * Dernier niveau affiché (vue « étage ouvert ») : les niveaux au-dessus sont ignorés et il n'y a
   * pas de toit. Absent : tous les niveaux, avec un toit plat sur le dernier.
   */
  upToLevelId?: string
}
