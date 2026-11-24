/**
 * Correspondance élément Fabrics ↔ GlobalId IFC (M22, 22.3). Le GlobalId d'un objet IFC est tiré de
 * l'identifiant de son nœud dans la scène (stable, enregistré avec le projet) : exporter deux fois le
 * même plan, ou après avoir modifié un autre élément, donne les mêmes GlobalId. Un élément importé
 * d'un IFC garde le sien (`metadata.globalId` du nœud). Fonction pure.
 */
import type { IfcExportSummary } from '@pascal-app/ifc-converter/export'
import type { FabricsIfcAdditions } from './exportIfc'

export interface GlobalIdRow {
  /** Élément Fabrics (un mur à plusieurs côtés a une ligne par côté). */
  elementId: string
  nodeId: string
  entity: string
  globalId: string
}

/** Lignes de la correspondance, triées par élément puis par nœud. */
export function globalIdTable(summary: Pick<IfcExportSummary, 'products'>, additions: Pick<FabricsIfcAdditions, 'nodeToElement'>): GlobalIdRow[] {
  const rows: GlobalIdRow[] = []
  for (const [nodeId, products] of Object.entries(summary.products)) {
    const elementId = additions.nodeToElement[nodeId] ?? nodeId
    for (const product of products) rows.push({ elementId, nodeId, entity: product.entity, globalId: product.globalId })
  }
  return rows.sort((a, b) => a.elementId.localeCompare(b.elementId) || a.nodeId.localeCompare(b.nodeId) || a.entity.localeCompare(b.entity))
}
