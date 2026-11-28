import { AlertTriangle } from 'lucide-react'
import { useDeferredValue, useMemo } from 'react'
import { countByGroup, planControls } from '../../features/measurements/controls'
import { computeBuildingMeasurements } from '../../features/measurements/measurements'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Pastille « N points à vérifier » : tous les points à corriger ou à vérifier du plan (pas les simples
 * informations). Un clic ouvre l'onglet Contrôles, où chaque point se voit et se corrige.
 */
interface PlanCheckBadgeProps {
  /** Éditeur de Pascal (M19 A3) : ouvre son onglet Contrôles au lieu de celui de l'ancien panneau. */
  onOpen?: () => void
}

export default function PlanCheckBadge({ onOpen }: PlanCheckBadgeProps = {}) {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const pascalQuantities = useEditorStore((state) => state.project?.document.pascalQuantities)
  const setSidePanelTab = useEditorStore((state) => state.setSidePanelTab)
  // Recalculé un peu après la frappe : la pastille ne ralentit pas le glissement d'un mur.
  const deferredElements = useDeferredValue(elements)

  const count = useMemo(() => {
    if (!isPlan || !deferredElements) return 0
    const document = { elements: deferredElements, levels, pascalQuantities }
    const counts = countByGroup(planControls({ document, building: computeBuildingMeasurements(document) }))
    return counts.fix + counts.check
  }, [isPlan, deferredElements, levels, pascalQuantities])

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
