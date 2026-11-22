import { useScene } from '@pascal-app/core'
import { useCallback } from 'react'
import type { PlanOverlay } from '../features/building/views/drawing'
import type { SceneNodeData } from '../features/scene/sceneTypes'
import { pascalRoofStairSymbols } from '../features/scene/view/levelPlanSymbols'
import { pascalRoofPlan, type RoofPlanData } from '../features/scene/view/roofPlanData'

/**
 * Plan de toiture d'un niveau, lu dans la scène ouverte (M20 20.1b) : contour et pentes des toitures
 * de Pascal, escalier d'accès au toit. `null` si le niveau n'a pas de toiture de Pascal.
 */
export function useRoofPlans(): (fabricsLevelId: string) => { plan: RoofPlanData; stair: PlanOverlay | null } | null {
  const nodes = useScene((state) => state.nodes) as unknown as Record<string, SceneNodeData>
  return useCallback(
    (fabricsLevelId: string) => {
      const plan = pascalRoofPlan(nodes, fabricsLevelId)
      return plan ? { plan, stair: pascalRoofStairSymbols(nodes, fabricsLevelId) } : null
    },
    [nodes],
  )
}
