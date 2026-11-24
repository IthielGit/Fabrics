/**
 * Export IFC de l'éditeur (M22, 22.2) : tout export IFC lancé dans l'éditeur de Pascal (fenêtre
 * Exporter de Fabrics ou réglages de Pascal) reçoit les ajouts de Fabrics (`features/ifc/exportIfc.ts`)
 * et ses remarques en français. Une erreur fait échouer l'export : jamais de fichier incomplet en silence.
 */
import type { AnyNode } from '@pascal-app/core'
import { setIfcExportHost } from '@pascal-app/editor'
import { fabricsIfcAdditions, ifcExportNotes } from '../features/ifc/exportIfc'
import type { SceneNodeData } from '../features/scene/sceneTypes'
import { fr } from '../i18n/fr'

export function registerFabricsIfcExport(): void {
  setIfcExportHost((nodes) => {
    const sceneNodes = nodes as unknown as Record<string, SceneNodeData>
    const rootNodeIds = Object.values(sceneNodes).filter((node) => !node.parentId).map((node) => node.id)
    const additions = fabricsIfcAdditions({ nodes: sceneNodes, rootNodeIds }, { levelSlab: fr.export.ifc.levelSlab })
    return {
      nodes: additions.nodes as unknown as Record<string, AnyNode>,
      extensions: additions.extensions,
      excludedNodeTypes: additions.excludedNodeTypes,
      warnings: (summary, missing) => ifcExportNotes(summary, missing, additions, fr.export.ifc),
    }
  })
}
