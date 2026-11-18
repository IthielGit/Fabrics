/**
 * Forme d'une scène Pascal telle que Fabrics l'enregistre et la convertit (ADR 0001, 0004).
 *
 * Les nœuds sont ceux de `@pascal-app/core` (validés par ses schémas) ; leur type exact n'est pas
 * repris ici pour que la conversion reste un simple travail de données. Les propriétés propres à
 * Fabrics (ordre d'affichage, verrou, couleurs…) sont rangées dans `metadata.fabrics`, le sac libre
 * que Pascal garde au chargement et à l'enregistrement.
 */

export interface SceneNodeData {
  id: string
  type: string
  parentId: string | null
  children?: string[]
  name?: string
  visible?: boolean
  metadata: Record<string, unknown>
  [field: string]: unknown
}

/** Scène d'un projet Plan (même forme que `SceneSnapshot` de Pascal, réduite à ses nœuds). */
export interface PlanScene {
  nodes: Record<string, SceneNodeData>
  rootNodeIds: string[]
}

/** Propriétés Fabrics d'un nœud (`metadata.fabrics`). Longueurs en m. */
export interface FabricsNodeMeta {
  /** Identifiant de l'élément Fabrics (un mur à plusieurs côtés donne plusieurs nœuds). */
  id: string
  /** Place dans `FabricsDocument.elements` (ordre d'affichage). */
  order: number
  /** Niveau, seulement s'il ne se déduit pas du parent : `null` = commun à tous les niveaux,
   * texte = niveau absent du document (conservé tel quel). */
  levelId?: string | null
  /** Champs communs non portés par Pascal (`x`, `y` en m ; `rotation` en degrés). */
  base?: { x?: number; y?: number; rotation?: number; opacity?: number; locked?: boolean }
  /** Autres propriétés Fabrics sans équivalent Pascal (couleur, style, matériau…). */
  props?: Record<string, unknown>
  /** Murs : rang du côté dans la polyligne d'origine. */
  segment?: number
  /** Mur réduit à un point (moins de deux points). */
  degenerate?: boolean
}

/** Problème trouvé pendant la conversion : signalé, jamais corrigé en silence. */
export interface ConversionIssue {
  code: 'opening-without-wall' | 'wall-degenerate' | 'no-level' | 'element-without-level'
  elementId: string
}

export const SITE_ID = 'site_fabrics'
export const BUILDING_ID = 'building_fabrics'
