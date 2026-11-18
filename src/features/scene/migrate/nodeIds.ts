/**
 * Identifiants des nœuds créés depuis un plan Fabrics : stables et déduits de l'identifiant Fabrics,
 * avec le préfixe exigé par Pascal (`wall_…`, `door_…`). Un mur à plusieurs côtés donne un nœud par
 * côté : `wall_<id>__<rang>`.
 */
export function nodeIdOf(prefix: string, fabricsId: string, segment?: number): string {
  // Élément venu d'un nœud natif de Pascal (M19 B2) : il porte déjà l'identifiant du nœud.
  if (isNativeNodeId(prefix, fabricsId)) return segment ? `${fabricsId}__${segment}` : fabricsId
  return segment === undefined ? `${prefix}_${fabricsId}` : `${prefix}_${fabricsId}__${segment}`
}

/** Identifiant d'un nœud créé par Pascal (`wall_…`, sans rang de côté), repris tel quel par la vue. */
export function isNativeNodeId(prefix: string, id: string): boolean {
  return id.startsWith(`${prefix}_`) && !id.includes('__')
}
