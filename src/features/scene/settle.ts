/**
 * Passage d'une scène par le chargement de Pascal (`setScene`) : migrations, liens réparés et
 * pièces reprises par Pascal (contour à l'axe des murs, murs de bord). C'est la scène telle que
 * Pascal la garde ; toute scène enregistrée ou affichée par Fabrics passe par là (M18).
 */
import { getSceneDocument, useScene } from '@pascal-app/core'
import { upgradeLegacyRoofsAndStairs } from './migrate/roofStairNodes'
import { registerFabricsNodes } from './nodes/fabricsNodes'
import type { PlanScene } from './sceneTypes'

export function settleScene(input: PlanScene): PlanScene {
  registerFabricsNodes()
  // Plans enregistrés avant M19 B6 : toitures et escaliers deviennent des nœuds de Pascal.
  const scene = upgradeLegacyRoofsAndStairs(input)
  useScene.getState().setScene(scene.nodes as never, scene.rootNodeIds as never)
  const doc = getSceneDocument()
  return { nodes: doc.nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(doc.rootNodeIds as string[])] }
}
