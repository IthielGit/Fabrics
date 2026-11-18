/**
 * Types de nœuds propres à Fabrics dans la scène Pascal (plan M18, point 4 A ; ADR 0004 § 6).
 *
 * Éléments de Fabrics que Pascal n'a pas, ou dont la géométrie ne correspond pas encore à un nœud
 * Pascal (toiture à contour libre, escalier en L / U, cheminée sans versant, plateforme : une dalle
 * Pascal porterait les murs et remonterait les portes posées dessus). Ils sont déclarés par
 * `registerNode`, le mécanisme d'extension de Pascal : aucun fichier de Pascal n'est modifié, et
 * Pascal garde ces nœuds au chargement, à la validation et à l'enregistrement.
 *
 * Le champ `element` porte les propriétés de l'élément Fabrics, longueurs en mètres (voir
 * `migrate/lengthFields.ts`). Toiture, escalier, cheminée et plateforme deviendront des nœuds natifs de Pascal
 * quand ses outils remplaceront ceux de Fabrics (M19, lot B).
 */
import { BaseNode, nodeType, objectId, registerNode, type AnyNodeDefinition } from '@pascal-app/core'
import { z } from 'zod'

/** Type Fabrics → type de nœud dans la scène. */
export const FABRICS_NODE_KINDS = {
  section: 'fabrics:section',
  roof: 'fabrics:roof',
  stair: 'fabrics:stair',
  chimney: 'fabrics:chimney',
  platform: 'fabrics:platform',
  text: 'fabrics:annotation',
  rect: 'fabrics:annotation',
  ellipse: 'fabrics:annotation',
  line: 'fabrics:annotation',
  image: 'fabrics:annotation',
} as const

export type FabricsNodeSourceType = keyof typeof FABRICS_NODE_KINDS
export type FabricsNodeKind = (typeof FABRICS_NODE_KINDS)[FabricsNodeSourceType]

/** Préfixe des identifiants (règle de Pascal : `<préfixe>_<id>`). */
export const FABRICS_NODE_PREFIX: Record<FabricsNodeKind, string> = {
  'fabrics:section': 'fxsection',
  'fabrics:roof': 'fxroof',
  'fabrics:stair': 'fxstair',
  'fabrics:chimney': 'fxchimney',
  'fabrics:platform': 'fxplatform',
  'fabrics:annotation': 'fxannotation',
}

function schemaFor<K extends FabricsNodeKind>(kind: K) {
  return BaseNode.extend({
    id: objectId(FABRICS_NODE_PREFIX[kind]),
    type: nodeType(kind),
    /** Propriétés de l'élément Fabrics (longueurs en m). */
    element: z.record(z.string(), z.unknown()).default({}),
  })
}

export const FABRICS_NODE_SCHEMAS = {
  'fabrics:section': schemaFor('fabrics:section'),
  'fabrics:roof': schemaFor('fabrics:roof'),
  'fabrics:stair': schemaFor('fabrics:stair'),
  'fabrics:chimney': schemaFor('fabrics:chimney'),
  'fabrics:platform': schemaFor('fabrics:platform'),
  'fabrics:annotation': schemaFor('fabrics:annotation'),
} as const

let registered = false

/** Déclare les types Fabrics auprès du registre de Pascal (une seule fois). */
export function registerFabricsNodes(): void {
  if (registered) return
  registered = true
  for (const [kind, schema] of Object.entries(FABRICS_NODE_SCHEMAS)) {
    // Même conversion que les greffons de Pascal (`plugin-v1-conformance.test.ts`) : l'API v1 ne peut
    // pas typer un nœud hors de l'union fermée `AnyNode`.
    registerNode({
      kind,
      schemaVersion: 1,
      schema,
      category: kind === 'fabrics:annotation' ? 'utility' : 'structure',
      defaults: () => ({ object: 'node', parentId: null, visible: true, metadata: {}, element: {} }),
      capabilities: {},
    } as unknown as AnyNodeDefinition)
  }
}
