import clsx from 'clsx'
import { BookOpen, Building2, Calculator, Layers, SlidersHorizontal, X, type LucideIcon } from 'lucide-react'
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
  { id: 'levels', label: fr.sidePanel.levels, icon: Building2, planOnly: true },
  { id: 'layers', label: fr.sidePanel.layers, icon: Layers },
  { id: 'measurements', label: fr.sidePanel.measurements, icon: Calculator, planOnly: true },
]

/**
 * Panneau de droite, rangé en onglets : Propriétés, Bibliothèque, Niveaux (plan), Calques, Métrés.
 * Un seul contenu à la fois, au lieu de tous les panneaux empilés.
 */
export default function SidePanel() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const tab = useEditorStore((state) => state.sidePanelTab)
  const setTab = useEditorStore((state) => state.setSidePanelTab)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const activeTool = useEditorStore((state) => state.activeTool)
  const open = useEditorStore((state) => state.sidePanelOpen)
  const setOpen = useEditorStore((state) => state.setSidePanelOpen)

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

  // Sur grand écran le panneau est fixe ; en dessous il devient un tiroir par-dessus le plan.
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={fr.sidePanel.close}
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}
    <aside
      className={clsx(
        'shrink-0 flex-col border-l border-slate-200 bg-white lg:flex lg:w-88',
        open
          ? 'fixed inset-y-0 right-0 z-40 flex w-[min(22rem,92vw)] shadow-2xl lg:static lg:z-auto lg:shadow-none'
          : 'hidden',
      )}
    >

      <div role="tablist" aria-label={fr.sidePanel.label} className="flex shrink-0 border-b border-slate-200">
        <button
          type="button"
          aria-label={fr.sidePanel.close}
          title={fr.sidePanel.close}
          onClick={() => setOpen(false)}
          className="flex shrink-0 items-center px-3 text-slate-600 hover:bg-slate-50 lg:hidden"
        >
          <X size={18} aria-hidden="true" />
        </button>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={current === id}
            onClick={() => setTab(id)}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 border-b-2 px-1 py-2.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600',
              current === id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
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
        {current === 'levels' && <LevelsPanel />}
        {current === 'layers' && <LayersPanel />}
        {current === 'measurements' && <MeasurementsPanel />}
      </div>
    </aside>
    </>
  )
}
