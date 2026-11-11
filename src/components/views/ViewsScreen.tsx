import clsx from 'clsx'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { useBuildingModel } from '../viewer3d/useBuildingModel'
import { buildElevation } from '../../features/building/views/elevation'
import { buildSection } from '../../features/building/views/section'
import type { SectionLineElement } from '../../types/document'
import type { Cardinal } from '../../features/building/north'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { useViewsStore, type ViewsTab } from '../../stores/viewsStore'
import ViewDrawing from './ViewDrawing'

const CARDINALS: Cardinal[] = ['N', 'E', 'S', 'O']

function isSameTab(a: ViewsTab, b: ViewsTab): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'elevation' && b.kind === 'elevation') return a.cardinal === b.cardinal
  if (a.kind === 'section' && b.kind === 'section') return a.sectionId === b.sectionId
  return true
}

function ElevationTab({ cardinal }: { cardinal: Cardinal }) {
  const model = useBuildingModel(undefined)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const northAngle = useEditorStore((state) => state.project?.document.plan?.northAngle ?? 0)
  const view = useMemo(
    () => buildElevation(model, levels ?? [], cardinal, northAngle),
    [model, levels, cardinal, northAngle],
  )
  return (
    <>
      <p className="px-4 pt-3 text-sm text-slate-600">
        {fr.views.elevation[cardinal]} · {fr.views.lookFrom(fr.views.sides[cardinal])}
      </p>
      <div className="min-h-0 flex-1 p-4">
        {view.bounds ? (
          <ViewDrawing faces={view.faces} bounds={view.bounds} levels={view.levels} />
        ) : (
          <p className="text-sm text-slate-500">{fr.views.empty}</p>
        )}
      </div>
    </>
  )
}

function SectionTab({ sectionId }: { sectionId: string }) {
  const model = useBuildingModel(undefined)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const section = useEditorStore((state) =>
    state.project?.document.elements.find(
      (el): el is SectionLineElement => el.type === 'section' && el.id === sectionId,
    ),
  )
  const view = useMemo(
    () =>
      section
        ? buildSection(model, levels ?? [], {
            points: section.points,
            lookLeft: section.lookLeft,
            label: section.label,
          })
        : null,
    [model, levels, section],
  )
  if (!section) return <p className="p-4 text-sm text-slate-500">{fr.views.sectionMissing}</p>
  return (
    <>
      <p className="px-4 pt-3 text-sm text-slate-600">
        {fr.views.section(section.label)} · {fr.views.sectionLook}
      </p>
      <div className="min-h-0 flex-1 p-4">
        {view?.bounds ? (
          <ViewDrawing faces={view.faces} bounds={view.bounds} levels={view.levels} />
        ) : (
          <p className="text-sm text-slate-500">{fr.views.sectionEmpty}</p>
        )}
      </div>
    </>
  )
}

/** Écran « Vues » : façades, coupes (puis planche) calculées à partir du plan, en lecture seule. */
function ScreenBody() {
  const tab = useViewsStore((state) => state.tab)
  const setTab = useViewsStore((state) => state.setTab)
  const closeViews = useViewsStore((state) => state.closeViews)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const sections = useMemo(
    () =>
      (elements ?? [])
        .filter((el): el is SectionLineElement => el.type === 'section')
        .sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true })),
    [elements],
  )

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
  ]

  return (
    <div
      role="dialog"
      aria-label={fr.views.title}
      className="fixed inset-0 z-50 flex flex-col bg-slate-50"
    >
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <h2 className="font-semibold text-slate-900">{fr.views.title}</h2>
        <div role="tablist" aria-label={fr.views.tabs} className="flex items-center gap-1">
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
                  'rounded-md px-3 py-1.5 text-sm',
                  active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
        <span className="ml-auto hidden text-xs text-slate-500 md:inline">{fr.views.readOnly}</span>
        <button
          type="button"
          onClick={closeViews}
          title={fr.views.close}
          aria-label={fr.views.close}
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        {tab.kind === 'elevation' && <ElevationTab cardinal={tab.cardinal} />}
        {tab.kind === 'section' && <SectionTab sectionId={tab.sectionId} />}
        {sections.length === 0 && (
          <p className="px-4 pb-3 text-xs text-slate-500">{fr.views.noSections}</p>
        )}
      </main>
    </div>
  )
}

export default function ViewsScreen() {
  const open = useViewsStore((state) => state.open)
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  if (!open || !isPlan) return null
  return <ScreenBody />
}
