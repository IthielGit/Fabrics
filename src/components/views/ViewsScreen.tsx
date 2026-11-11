import clsx from 'clsx'
import { FileDown, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { drawingFromView, type Drawing } from '../../features/building/views/drawing'
import { buildElevation } from '../../features/building/views/elevation'
import { buildSection } from '../../features/building/views/section'
import { buildSheet } from '../../features/building/views/sheet'
import type { Cardinal } from '../../features/building/north'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { useViewsStore, type ViewsTab } from '../../stores/viewsStore'
import type { SectionLineElement } from '../../types/document'
import Button from '../ui/Button'
import { useBuildingModel } from '../viewer3d/useBuildingModel'
import ViewDrawing from './ViewDrawing'
import ViewsPdfDialog from './ViewsPdfDialog'

const CARDINALS: Cardinal[] = ['N', 'E', 'S', 'O']

function isSameTab(a: ViewsTab, b: ViewsTab): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'elevation' && b.kind === 'elevation') return a.cardinal === b.cardinal
  if (a.kind === 'section' && b.kind === 'section') return a.sectionId === b.sectionId
  return true
}

interface ActiveView {
  /** Titre de la vue (cartouche et nom du fichier). */
  title: string
  note: string
  /** Dessin construit avec cette hauteur de texte (mm réels) ; sans argument, hauteur automatique. */
  build: (fontMm?: number) => Drawing | null
  /** Message quand il n'y a rien à dessiner. */
  emptyText: string
}

/** Dessin de l'onglet affiché : une façade, une coupe ou la planche. */
function useActiveView(tab: ViewsTab, sections: readonly SectionLineElement[]): ActiveView {
  const model = useBuildingModel(undefined)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const northAngle = useEditorStore((state) => state.project?.document.plan?.northAngle ?? 0)

  return useMemo(() => {
    const allLevels = levels ?? []
    if (tab.kind === 'elevation') {
      const title = fr.views.elevation[tab.cardinal]
      const view = buildElevation(model, allLevels, tab.cardinal, northAngle)
      return {
        title,
        note: `${title} · ${fr.views.lookFrom(fr.views.sides[tab.cardinal])}`,
        build: (fontMm) => drawingFromView(view, fontMm),
        emptyText: fr.views.empty,
      }
    }
    if (tab.kind === 'section') {
      const section = sections.find((s) => s.id === tab.sectionId)
      if (!section) {
        return { title: '', note: '', build: () => null, emptyText: fr.views.sectionMissing }
      }
      const view = buildSection(model, allLevels, {
        points: section.points,
        lookLeft: section.lookLeft,
        label: section.label,
      })
      const title = fr.views.section(section.label)
      return {
        title,
        note: `${title} · ${fr.views.sectionLook}`,
        build: (fontMm) => (view ? drawingFromView(view, fontMm) : null),
        emptyText: fr.views.sectionEmpty,
      }
    }
    return {
      title: fr.views.sheet,
      note: fr.views.sheetNote,
      build: (fontMm) => {
        const sheet = buildSheet({
          model,
          levels: allLevels,
          sections: sections.map((s) => ({ points: s.points, lookLeft: s.lookLeft, label: s.label })),
          northAngle,
          labels: { elevation: fr.views.elevation, section: fr.views.section },
          fontMm,
        })
        return sheet.drawing.width > 0 ? sheet.drawing : null
      },
      emptyText: fr.views.empty,
    }
  }, [tab, sections, model, levels, northAngle])
}

/** Écran « Vues » : façades, coupes et planche calculées à partir du plan, en lecture seule. */
function ScreenBody() {
  const tab = useViewsStore((state) => state.tab)
  const setTab = useViewsStore((state) => state.setTab)
  const closeViews = useViewsStore((state) => state.closeViews)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const [pdfOpen, setPdfOpen] = useState(false)
  const sections = useMemo(
    () =>
      (elements ?? [])
        .filter((el): el is SectionLineElement => el.type === 'section')
        .sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true })),
    [elements],
  )
  const active = useActiveView(tab, sections)
  // Le dessin n'est calculé qu'une fois par changement de vue, pas à chaque rendu.
  const drawing = useMemo(() => active.build(), [active])
  const view = { ...active, drawing }

  const tabs: { key: string; label: string; value: ViewsTab }[] = [
    ...CARDINALS.map((cardinal) => ({
      key: `elevation-${cardinal}`,
      label: fr.views.elevation[cardinal],
      value: { kind: 'elevation', cardinal } as ViewsTab,
    })),
    ...sections.map((section) => ({
      key: `section-${section.id}`,
      label: fr.views.section(section.label),
      value: { kind: 'section', sectionId: section.id } as ViewsTab,
    })),
    { key: 'sheet', label: fr.views.sheet, value: { kind: 'sheet' } as ViewsTab },
  ]

  return (
    <div role="dialog" aria-label={fr.views.title} className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <h2 className="font-semibold text-slate-900">{fr.views.title}</h2>
        <div role="tablist" aria-label={fr.views.tabs} className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {tabs.map((item) => {
            const active = isSameTab(tab, item.value)
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.value)}
                className={clsx(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm',
                  active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button onClick={() => setPdfOpen(true)} disabled={!view.drawing} className="px-3 py-1.5">
            <FileDown size={16} aria-hidden="true" />
            {fr.views.exportPdf}
          </Button>
          <button
            type="button"
            onClick={closeViews}
            title={fr.views.close}
            aria-label={fr.views.close}
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        {view.note && <p className="px-4 pt-3 text-sm text-slate-600">{view.note}</p>}
        <div className="min-h-0 flex-1 p-4">
          {view.drawing ? (
            <ViewDrawing drawing={view.drawing} />
          ) : (
            <p className="text-sm text-slate-500">{view.emptyText}</p>
          )}
        </div>
        {sections.length === 0 && <p className="px-4 pb-3 text-xs text-slate-500">{fr.views.noSections}</p>}
      </main>
      {pdfOpen && view.drawing && (
        <ViewsPdfDialog
          build={active.build}
          viewTitle={view.title}
          showNorth={tab.kind === 'sheet'}
          onClose={() => setPdfOpen(false)}
        />
      )}
    </div>
  )
}

export default function ViewsScreen() {
  const open = useViewsStore((state) => state.open)
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  if (!open || !isPlan) return null
  return <ScreenBody />
}
