/**
 * Identifiants des nœuds créés depuis un plan Fabrics : stables et déduits de l'identifiant Fabrics,
 * avec le préfixe exigé par Pascal (`wall_…`, `door_…`). Un mur à plusieurs côtés donne un nœud par
 * côté : `wall_<id>__<rang>`.
 */
export function nodeIdOf(prefix: string, fabricsId: string, segment?: number): string {
  return segment === undefined ? `${prefix}_${fabricsId}` : `${prefix}_${fabricsId}__${segment}`
}
