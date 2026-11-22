import clsx from 'clsx'
import { FileDown, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Drawing } from '../../features/building/views/drawing'
import { applyVisibility, VISIBILITY_KEYS, type VisibilityKey } from '../../features/building/views/graphicStyles'
import type { Cardinal } from '../../features/building/north'
import type { DimensioningMode } from '../../features/dimensioning/types'
import { sheetView, type SheetView } from '../../features/sheets/sheetViews'
import { sheetKey, sheetSet } from '../../features/sheets/sheetSet'
import { useRoofPlans } from '../../pascal/useRoofPlans'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { useViewsStore, type ViewsTab } from '../../stores/viewsStore'
import type { SectionLineElement } from '../../types/document'
import Button from '../ui/Button'
import { useLevelPlanSymbols } from '../../pascal/useLevelPlanSymbols'
import { useBuildingModel } from '../viewer3d/useBuildingModel'
import ViewDrawing from './ViewDrawing'
import ViewsPdfDialog from './ViewsPdfDialog'

const CARDINALS: Cardinal[] = ['N', 'E', 'S', 'O']

function isSameTab(a: ViewsTab, b: ViewsTab): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'elevation' && b.kind === 'elevation') return a.cardinal === b.cardinal
  if (a.kind === 'section' && b.kind === 'section') return a.sectionId === b.sectionId
  if (a.kind === 'level' && b.kind === 'level') return a.levelId === b.levelId
  if (a.kind === 'roof' && b.kind === 'roof') return a.levelId === b.levelId
  if (a.kind === 'ceiling' && b.kind === 'ceiling') return a.levelId === b.levelId
  return true
}

type ActiveView = SheetView

/** Dessin de l'onglet affiché : le plan d'un niveau, une façade, une coupe ou la planche. */
function useActiveView(tab: ViewsTab, sections: readonly SectionLineElement[]): ActiveView {
  const model = useBuildingModel(undefined)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const plan = useEditorStore((state) => state.project?.document.plan)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const sheetDimensioning = useViewsStore((state) => state.sheetDimensioning)
  const roofAreas = useViewsStore((state) => state.roofAreas)
  const pascalQuantities = useEditorStore((state) => state.project?.document.pascalQuantities)
  // Scène de Pascal : escaliers et mobilier dessinés avec sa géométrie de plan (ADR 0007).
  const levelSymbols = useLevelPlanSymbols()
  const roofPlans = useRoofPlans()

  return useMemo(
    () =>
      sheetView(tab, {
        model,
        document: { elements: elements ?? [], levels: levels ?? [], plan, pascalQuantities },
        sections,
        levelSymbols,
        roofPlans,
        sheetDimensioning,
        roofAreas,
      }),
    [tab, sections, model, levels, plan, elements, sheetDimensioning, levelSymbols, roofPlans, roofAreas, pascalQuantities],
  )
}

const MODES: readonly DimensioningMode[] = ['none', 'client', 'execution']

/** Planche : réglage de cotation du plan de chaque niveau (M10 ter lot B), hors document. */
function SheetDimensioning({ levelId }: { levelId?: string }) {
  const levels = useEditorStore((state) => state.project?.document.levels)
  const modes = useViewsStore((state) => state.sheetDimensioning)
  const setMode = useViewsStore((state) => state.setSheetDimensioning)
  if (!levels || levels.length === 0) return null
  const sorted = [...levels].filter((l) => !levelId || l.id === levelId).sort((a, b) => a.elevation - b.elevation)
  return (
    <div
      role="group"
      aria-label={fr.dimensioning.sheetLabel}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-2 text-sm text-slate-700"
    >
      <span className="font-medium">{fr.dimensioning.sheetLabel}</span>
      {sorted.map((level) => (
        <label key={level.id} className="flex items-center gap-1.5">
          {level.name}
          <select
            aria-label={fr.dimensioning.sheetLevel(level.name)}
            value={modes[level.id] ?? 'none'}
            onChange={(event) => setMode(level.id, event.target.value as DimensioningMode)}
            className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
          >
            {MODES.map((mode) => (
              <option key={mode} value={mode}>
                {fr.dimensioning.modes[mode]}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}

/** Plan de toiture : afficher ou non les surfaces de toiture (D20-10 : seulement sur demande). */
function RoofAreasToggle() {
  const on = useViewsStore((state) => state.roofAreas)
  const setOn = useViewsStore((state) => state.setRoofAreas)
  return (
    <label className="flex items-center gap-2 px-4 pt-2 text-sm text-slate-700">
      <input type="checkbox" checked={on} onChange={(event) => setOn(event.target.checked)} className="h-4 w-4" />
      {fr.views.roofAreasToggle}
    </label>
  )
}

/** Cases « Visibilité » des plans (M20 20.5) : les catégories cochées sont dessinées, à l'écran et dans le PDF. */
function VisibilityPanel() {
  const hidden = useViewsStore((state) => state.hidden)
  const toggle = useViewsStore((state) => state.toggleHidden)
  return (
    <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2 text-sm text-slate-700">
      <legend className="sr-only">{fr.views.visibility.title}</legend>
      <span aria-hidden="true" className="font-medium text-slate-900">
        {fr.views.visibility.title}
      </span>
      {VISIBILITY_KEYS.map((key) => (
        <label key={key} className="flex items-center gap-1.5">
          <input type="checkbox" checked={!hidden.includes(key)} onChange={() => toggle(key)} className="h-4 w-4" />
          {fr.views.visibility.keys[key]}
        </label>
      ))}
    </fieldset>
  )
}

/** Vue dont les dessins (écran et PDF) n'ont plus les catégories masquées (M20 20.5). */
function withVisibility(view: ActiveView, hidden: readonly VisibilityKey[]): ActiveView {
  if (hidden.length === 0) return view
  const set = new Set(hidden)
  const filter = (drawing: Drawing | null) => (drawing ? applyVisibility(drawing, set) : null)
  return {
    ...view,
    build: (fontMm, version) => filter(view.build(fontMm, version)),
    ...(view.parts
      ? {
          parts: (fontMm, version) => {
            const { main, side } = view.parts!(fontMm, version)
            return { main: filter(main), side }
          },
        }
      : {}),
  }
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
  const hidden = useViewsStore((state) => state.hidden)
  const viewOfTab = useActiveView(tab, sections)
  const active = useMemo(() => withVisibility(viewOfTab, hidden), [viewOfTab, hidden])
  // Le dessin n'est calculé qu'une fois par changement de vue, pas à chaque rendu.
  const drawing = useMemo(() => active.build(), [active])
  const view = { ...active, drawing }
  const levels = useEditorStore((state) => state.project?.document.levels)
  const sheetDimensioning = useViewsStore((state) => state.sheetDimensioning)
  const hasExecution = (levels ?? [])
    .filter((level) => tab.kind !== 'level' || level.id === tab.levelId)
    .some((level) => sheetDimensioning[level.id] === 'execution')
  const showsPlans = tab.kind === 'sheet' || tab.kind === 'level' || tab.kind === 'roof'
  const roofPlans = useRoofPlans()
  // Numéro automatique de la feuille dans le jeu (M20 20.7) : niveaux, toitures, plafonds, façades…
  const activeKey = sheetKey(tab)
  const autoNumber = useMemo(
    () => sheetSet({ document: { elements: [], levels: levels ?? [] }, sections, roofPlans }).find((e) => e.key === activeKey)?.number ?? '01',
    [levels, sections, roofPlans, activeKey],
  )

  const tabs: { key: string; label: string; value: ViewsTab }[] = [
    ...[...(levels ?? [])]
      .sort((a, b) => a.elevation - b.elevation)
      .map((level) => ({
        key: `level-${level.id}`,
        label: fr.views.levelPlan(level.name),
        value: { kind: 'level', levelId: level.id } as ViewsTab,
      })),
    ...[...(levels ?? [])]
      .sort((a, b) => a.elevation - b.elevation)
      .map((level) => ({
        key: `ceiling-${level.id}`,
        label: fr.views.ceilingPlan(level.name),
        value: { kind: 'ceiling', levelId: level.id } as ViewsTab,
      })),
    ...[...(levels ?? [])]
      .sort((a, b) => a.elevation - b.elevation)
      .filter((level) => roofPlans(level.id) !== null)
      .map((level) => ({
        key: `roof-${level.id}`,
        label: fr.views.roofPlan(level.name),
        value: { kind: 'roof', levelId: level.id } as ViewsTab,
      })),
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
    { key: 'schedules', label: fr.views.schedules, value: { kind: 'schedules' } as ViewsTab },
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
        {tab.kind === 'sheet' && <SheetDimensioning />}
        {tab.kind === 'level' && <SheetDimensioning levelId={tab.levelId} />}
        {tab.kind === 'roof' && <RoofAreasToggle />}
        {(tab.kind === 'level' || tab.kind === 'ceiling' || tab.kind === 'roof' || tab.kind === 'sheet') && <VisibilityPanel />}
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
          sheetKind={active.kind}
          parts={active.parts}
          sheetKey={activeKey}
          autoNumber={autoNumber}
          showNorth={showsPlans}
          dimensioning={tab.kind === 'sheet' || tab.kind === 'level' ? { hasExecution } : undefined}
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
