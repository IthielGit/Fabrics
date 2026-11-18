import { useViewer } from '@pascal-app/viewer'
import { useEffect } from 'react'
import { useEditorStore } from '../stores/editorStore'

/**
 * Niveau affiché dans Pascal → niveau actif de Fabrics (M19 A3) : métrés, points à vérifier et
 * exports portent sur le niveau que l'on regarde. Un niveau de la scène garde l'identifiant du niveau
 * Fabrics dans `metadata.fabrics.id` ; un niveau créé dans Pascal garde son propre identifiant.
 */
export function usePascalLevelSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const apply = (pascalLevelId: string | null) => {
      if (!pascalLevelId) return
      const { project, activeLevelId, setActiveLevel } = useEditorStore.getState()
      const node = project?.scene?.nodes[pascalLevelId]
      const meta = node?.metadata?.fabrics as { id?: unknown } | undefined
      const levelId = typeof meta?.id === 'string' ? meta.id : pascalLevelId
      const known = project?.document.levels?.some((level) => level.id === levelId)
      if (known && levelId !== activeLevelId) setActiveLevel(levelId)
    }
    apply(useViewer.getState().selection.levelId)
    return useViewer.subscribe((state, previous) => {
      if (state.selection.levelId !== previous.selection.levelId) apply(state.selection.levelId)
    })
  }, [enabled])
}
