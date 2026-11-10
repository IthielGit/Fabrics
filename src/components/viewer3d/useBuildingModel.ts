import { useEffect, useMemo, useState } from 'react'
import { buildBuildingModel } from '../../features/building/model'
import type { BuildingModel } from '../../features/building/types'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Modèle 3D du projet ouvert, recalculé au plus une fois par image (`requestAnimationFrame`) :
 * pendant un glissement, la 3D suit sans que chaque événement de souris refasse le calcul.
 */
export function useBuildingModel(upToLevelId: string | undefined): BuildingModel {
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const [snapshot, setSnapshot] = useState({ elements, levels })

  useEffect(() => {
    const frame = requestAnimationFrame(() => setSnapshot({ elements, levels }))
    return () => cancelAnimationFrame(frame)
  }, [elements, levels])

  return useMemo(
    () => buildBuildingModel({ elements: snapshot.elements ?? [], levels: snapshot.levels }, { upToLevelId }),
    [snapshot, upToLevelId],
  )
}
