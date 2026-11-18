/**
 * Passage d'une scène par le chargement de Pascal (`setScene`) : migrations, liens réparés et
 * pièces reprises par Pascal (contour à l'axe des murs, murs de bord). C'est la scène telle que
 * Pascal la garde ; toute scène enregistrée ou affichée par Fabrics passe par là (M18).
 */
import { getSceneDocument, useScene } from '@pascal-app/core'
import { registerFabricsNodes } from './nodes/fabricsNodes'
import type { PlanScene } from './sceneTypes'

export function settleScene(scene: PlanScene): PlanScene {
  registerFabricsNodes()
  useScene.getState().setScene(scene.nodes as never, scene.rootNodeIds as never)
  const doc = getSceneDocument()
  return { nodes: doc.nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(doc.rootNodeIds as string[])] }
}
