import { useScene } from '@pascal-app/core'
import { useCallback } from 'react'
import type { PlanOverlay } from '../features/building/views/drawing'
import type { SceneNodeData } from '../features/scene/sceneTypes'
import { pascalLevelSymbols } from '../features/scene/view/levelPlanSymbols'

/**
 * Escaliers et mobilier de Pascal d'un niveau, lus dans la scène ouverte, pour les plans de niveau
 * des vues et de la planche (ADR 0007). La fonction change quand la scène change.
 */
export function useLevelPlanSymbols(): (fabricsLevelId: string) => PlanOverlay | null {
  const nodes = useScene((state) => state.nodes) as unknown as Record<string, SceneNodeData>
  return useCallback((fabricsLevelId: string) => pascalLevelSymbols(nodes, fabricsLevelId), [nodes])
}
