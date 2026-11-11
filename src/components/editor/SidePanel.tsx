import clsx from 'clsx'
import { BookOpen, Calculator, Layers, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import LibraryPanel from '../library/LibraryPanel'
import { fr } from '../../i18n/fr'
import { useEditorStore, type SidePanelTab } from '../../stores/editorStore'
import LayersPanel from './LayersPanel'
import LevelsPanel from './LevelsPanel'
import MeasurementsPanel from './MeasurementsPanel'
import PropertiesPanel from './PropertiesPanel'

interface TabDefinition {
  id: SidePanelTab
  label: string
  icon: LucideIcon
  planOnly?: boolean
}

const TABS: TabDefinition[] = [
  { id: 'properties', label: fr.sidePanel.properties, icon: SlidersHorizontal },
  { id: 'library', label: fr.sidePanel.library, icon: BookOpen, planOnly: true },
  { id: 'layers', label: fr.sidePanel.layers, icon: Layers },
  { id: 'measurements', label: fr.sidePanel.measurements, icon: Calculator, planOnly: true },
]

/**
 * Panneau de droite, rangé en onglets : Propriétés, Bibliothèque, Calques (et niveaux), Métrés.
 * Un seul contenu à la fois, au lieu de tous les panneaux empilés.
 */
export default function SidePanel() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const tab = useEditorStore((state) => state.sidePanelTab)
  const setTab = useEditorStore((state) => state.setSidePanelTab)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const activeTool = useEditorStore((state) => state.activeTool)

  const tabs = TABS.filter((t) => isPlan || !t.planOnly)
  // Un onglet du plan dans un visuel (projet ouvert ensuite) : on revient aux propriétés.
  const current = tabs.some((t) => t.id === tab) ? tab : 'properties'

  // Sélectionner un élément sur le plan (outil Sélection) montre ses propriétés quand on était
  // dans la bibliothèque. Les calques et les métrés restent ouverts : on y sélectionne aussi.
  const hadSelection = useRef(false)
  useEffect(() => {
    const has = selectedIds.length > 0
    if (has && !hadSelection.current && current === 'library' && activeTool === 'select') {
      setTab('properties')
    }
    hadSelection.current = has
  }, [selectedIds, current, activeTool, setTab])

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div role="tablist" aria-label={fr.sidePanel.label} className="flex shrink-0 border-b border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex flex-1 flex-col items-center gap-0.5 border-b-2 px-1 py-2 text-xs font-medium',
              current === id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800',
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto">
        {current === 'properties' && <PropertiesPanel />}
        {current === 'library' && <LibraryPanel />}
        {current === 'layers' && (
          <>
            <LevelsPanel />
            <LayersPanel />
          </>
        )}
        {current === 'measurements' && <MeasurementsPanel />}
      </div>
    </aside>
  )
}
