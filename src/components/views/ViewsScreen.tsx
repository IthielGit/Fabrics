import clsx from 'clsx'
import { FileDown, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { autoFontMm, drawingFromView, levelPlanDrawing, type Drawing } from '../../features/building/views/drawing'
import { levelAreaTable, roofAreaTable, withAreaTable } from '../../features/building/views/areaTable'
import { roofPerimeter } from '../../features/scene/view/roofPlanData'
import { roofPlanDrawing } from '../../features/building/views/roofPlan'
import { levelWallMaterials, materialLegend } from '../../features/building/views/legend'
import { openingSchedule, roomSchedule, scheduleDrawing } from '../../features/building/views/schedule'
import { ceilingPlanOverlay } from '../../features/dimensioning/ceilingPlan'
import { annotationGraphics } from '../../features/dimensioning/annotationGraphics'
import { roofChains } from '../../features/dimensioning/roofChains'
import { useRoofPlans } from '../../pascal/useRoofPlans'
import { computeBuildingMeasurements } from '../../features/measurements/measurements'
import { buildElevation } from '../../features/building/views/elevation'
import { buildSection } from '../../features/building/views/section'
import { buildSheet } from '../../features/building/views/sheet'
import type { Cardinal } from '../../features/building/north'
import { sheetPlanOverlay } from '../../features/dimensioning/planOverlay'
import type { DimensioningMode } from '../../features/dimensioning/types'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
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

interface ActiveView {
  /** Titre de la vue (cartouche et nom du fichier). */
  title: string
  note: string
  /**
   * Dessin construit avec cette hauteur de texte (mm réels) ; sans argument, hauteur automatique.
   * `version` impose une cotation à tous les plans de la planche (export PDF) ; absente : réglage de chaque vue.
   */
  build: (fontMm?: number, version?: 'client' | 'execution') => Drawing | null
  /** Message quand il n'y a rien à dessiner. */
  emptyText: string
}

/** Dessin de l'onglet affiché : le plan d'un niveau, une façade, une coupe ou la planche. */
function useActiveView(tab: ViewsTab, sections: readonly SectionLineElement[]): ActiveView {
  const model = useBuildingModel(undefined)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const northAngle = useEditorStore((state) => state.project?.document.plan?.northAngle ?? 0)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const sheetDimensioning = useViewsStore((state) => state.sheetDimensioning)
  const roofAreas = useViewsStore((state) => state.roofAreas)
  const pascalQuantities = useEditorStore((state) => state.project?.document.pascalQuantities)
  // Scène de Pascal : escaliers et mobilier dessinés avec sa géométrie de plan (ADR 0007).
  const levelSymbols = useLevelPlanSymbols()
  const roofPlans = useRoofPlans()

  return useMemo(() => {
    const allLevels = levels ?? []
    if (tab.kind === 'schedules') {
      // Nomenclatures (M20 20.3) : tirées des métrés, comme l'onglet Métrés.
      const document = { elements: elements ?? [], levels: allLevels, pascalQuantities }
      const labels = { ...fr.views.schedule, kinds: fr.measurements.csv.kinds, styles: fr.measurements.csv.styles }
      return {
        title: fr.views.schedules,
        note: fr.views.schedulesNote,
        build: (fontMm) => {
          const building = computeBuildingMeasurements(document)
          return scheduleDrawing([openingSchedule(building, labels), roomSchedule(building, labels)], fontMm ?? 125)
        },
        emptyText: fr.views.empty,
      }
    }
    if (tab.kind === 'ceiling') {
      // Plan de plafond (M20 20.3) : murs du niveau, hauteur sous plafond et faux plafond par pièce.
      const level = allLevels.find((l) => l.id === tab.levelId)
      if (!level) return { title: '', note: '', build: () => null, emptyText: fr.views.levelMissing }
      const document = { elements: elements ?? [], levels: allLevels, pascalQuantities }
      return {
        title: fr.views.ceilingPlan(level.name),
        note: fr.views.ceilingPlanNote,
        build: (fontMm) => {
          const metres = computeBuildingMeasurements(document).levels.find((l) => l.level.id === level.id)
          return levelPlanDrawing(model, level, fontMm, (font) => (metres ? ceilingPlanOverlay(document, level.id, metres.measurements, fr.views.ceiling, font) : null))
        },
        emptyText: fr.views.empty,
      }
    }
    if (tab.kind === 'roof') {
      // Plan de toiture (M20 20.1b) : contour, débords, pentes lues dans les pans, escalier d'accès.
      const level = allLevels.find((l) => l.id === tab.levelId)
      const roof = level ? roofPlans(level.id) : null
      if (!level || !roof) return { title: '', note: '', build: () => null, emptyText: fr.views.levelMissing }
      const title = fr.views.roofPlan(level.name)
      return {
        title,
        note: fr.views.roofPlanNote,
        build: (fontMm) => {
          const drawing = roofPlanDrawing(roof.plan, { slope: fr.views.roofSlope }, fontMm, [
            roof.stair,
            (font) => annotationGraphics({ dimensions: roofChains(roof.plan.outlines), labels: [] }, font),
          ])
          if (!drawing || !roofAreas) return drawing
          // Surfaces de toiture sur demande (D20-10) : valeurs des métrés, pans comptés sur leur réunion (D20-15).
          const pans = (pascalQuantities?.roofs ?? []).filter((r) => r.levelId === level.id)
          const table = roofAreaTable(pans, roofPerimeter(roof.plan), level.name, fr.views.roofAreaTable)
          return withAreaTable(drawing, table, fontMm ?? autoFontMm(drawing.width, drawing.height))
        },
        emptyText: fr.views.empty,
      }
    }
    if (tab.kind === 'level') {
      // Plan d'un niveau seul (M20 20.1b) : même dessin que sur la planche, une feuille par niveau.
      const level = allLevels.find((l) => l.id === tab.levelId)
      if (!level) return { title: '', note: '', build: () => null, emptyText: fr.views.levelMissing }
      const title = fr.views.levelPlan(level.name)
      const document = { elements: elements ?? [], levels: allLevels }
      return {
        title,
        note: fr.views.levelPlanNote,
        build: (fontMm, version) => {
          const plan = levelPlanDrawing(
            model,
            level,
            fontMm,
            (font) => sheetPlanOverlay(document, level.id, version ?? sheetDimensioning[level.id] ?? 'none', EXECUTION_LABELS, font),
            levelSymbols(level.id),
          )
          if (!plan) return null
          // Tableau des surfaces du niveau, lu dans les métrés (balcon compris, D20-10).
          const metres = computeBuildingMeasurements(document).levels.find((l) => l.level.id === level.id)
          const table = metres ? levelAreaTable(metres.measurements, level.name, fr.views.areaTable) : null
          const font = fontMm ?? autoFontMm(plan.width, plan.height)
          // Légende des hachures des murs du niveau, sous le tableau (M20 20.2).
          const materials = levelWallMaterials(document.elements, level.id)
          return withAreaTable(plan, table, font, (x, y) => materialLegend(materials, fr.materials.walls, fr.views.legendTitle, x, y, font))
        },
        emptyText: fr.views.empty,
      }
    }
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
        ridgeLabel: fr.views.ridge,
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
      build: (fontMm, version) => {
        const document = { elements: elements ?? [], levels: allLevels }
        const sheet = buildSheet({
          model,
          levels: allLevels,
          sections: sections.map((s) => ({ points: s.points, lookLeft: s.lookLeft, label: s.label })),
          northAngle,
          labels: { elevation: fr.views.elevation, section: fr.views.section, ridge: fr.views.ridge },
          fontMm,
          levelOverlay: (level, font) =>
            sheetPlanOverlay(document, level.id, version ?? sheetDimensioning[level.id] ?? 'none', EXECUTION_LABELS, font),
          levelSymbols: (level) => levelSymbols(level.id),
        })
        return sheet.drawing.width > 0 ? sheet.drawing : null
      },
      emptyText: fr.views.empty,
    }
  }, [tab, sections, model, levels, northAngle, elements, sheetDimensioning, levelSymbols, roofPlans, roofAreas, pascalQuantities])
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
  const levels = useEditorStore((state) => state.project?.document.levels)
  const sheetDimensioning = useViewsStore((state) => state.sheetDimensioning)
  const hasExecution = (levels ?? [])
    .filter((level) => tab.kind !== 'level' || level.id === tab.levelId)
    .some((level) => sheetDimensioning[level.id] === 'execution')
  const showsPlans = tab.kind === 'sheet' || tab.kind === 'level' || tab.kind === 'roof'
  const roofPlans = useRoofPlans()

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
