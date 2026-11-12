/**
 * Cotes automatiques (M10 ter lot B) : calculées à partir du plan, jamais enregistrées dans le
 * document. Elles suivent donc toujours le plan. Les cotes tracées à la main restent des éléments.
 */

/** Réglage « Cotation » : aucune cote automatique, version Client ou version Exécution. */
export type DimensioningMode = 'none' | 'client' | 'execution'

/** Une cote calculée : même géométrie qu'une cote tracée à la main (`dimensionGeometry`). */
export interface AutoDimension {
  /** Identifiant stable (dérivé des éléments mesurés), utile comme clé d'affichage. */
  id: string
  /** Deux extrémités mesurées, absolues, en mm. */
  points: [number, number, number, number]
  /** Décalage de la ligne de cote, en mm (côté de la normale gauche si positif). */
  offset: number
}

/** Une étiquette calculée : quelques lignes de texte centrées sur un point du plan. */
export interface AutoLabel {
  id: string
  x: number
  y: number
  lines: string[]
}

export interface AutoAnnotations {
  dimensions: AutoDimension[]
  labels: AutoLabel[]
}
