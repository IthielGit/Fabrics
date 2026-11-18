import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { elementsOfLevel } from '../../features/documents/levels'
import { wallIssues } from '../../features/geometry/wallContacts'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { WallElement } from '../../types/document'

/**
 * Pastille « N points à vérifier » : murs qui ne se touchent pas ou qui se superposent sur le niveau
 * affiché. Un clic ouvre le panneau Métrés, où chaque point se corrige en un clic.
 */
interface PlanCheckBadgeProps {
  /** Éditeur de Pascal (M19 A3) : ouvre son onglet Métrés au lieu de celui de l'ancien panneau. */
  onOpen?: () => void
}

export default function PlanCheckBadge({ onOpen }: PlanCheckBadgeProps = {}) {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const elements = useEditorStore((state) => state.project?.document.elements)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const setSidePanelTab = useEditorStore((state) => state.setSidePanelTab)

  const count = useMemo(() => {
    if (!isPlan || !elements) return 0
    const onLevel = activeLevelId ? elementsOfLevel(elements, activeLevelId) : elements
    return wallIssues(onLevel.filter((el): el is WallElement => el.type === 'wall')).length
  }, [isPlan, elements, activeLevelId])

  if (count === 0) return null
  return (
    <button
      type="button"
      onClick={() => (onOpen ? onOpen() : setSidePanelTab('measurements'))}
      title={fr.planCheck.hint}
      className="flex h-7 shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 text-xs font-medium text-amber-900 transition-colors duration-150 ease-out hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-600"
    >
      <AlertTriangle size={13} aria-hidden="true" />
      {fr.planCheck.badge(count)}
    </button>
  )
}
