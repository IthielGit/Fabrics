import type { BuildingModel } from '../building/types'
import { autoFontMm, drawingFromView, levelPlanDrawing, type Drawing, type PlanOverlay } from '../building/views/drawing'
import { levelAreaTable, roofAreaTable, withAreaTable } from '../building/views/areaTable'
import { roofPerimeter, type RoofPlanData } from '../scene/view/roofPlanData'
import { roofPlanDrawing } from '../building/views/roofPlan'
import { levelWallMaterials, materialLegend } from '../building/views/legend'
import { openingSchedule, roomSchedule, scheduleDrawing } from '../building/views/schedule'
import { ceilingPlanOverlay } from '../dimensioning/ceilingPlan'
import { annotationGraphics } from '../dimensioning/annotationGraphics'
import { roofChains } from '../dimensioning/roofChains'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { buildElevation } from '../building/views/elevation'
import { buildSection } from '../building/views/section'
import { buildSheet } from '../building/views/sheet'
import type { Cardinal } from '../building/north'
import { sheetPlanOverlay } from '../dimensioning/planOverlay'
import type { DimensioningMode } from '../dimensioning/types'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { fr } from '../../i18n/fr'
import type { FabricsDocument, SectionLineElement } from '../../types/document'

/**
 * Vues de l'écran « Vues » et de leurs feuilles (M20 20.7) : le dessin de chaque onglet, en fonction
 * pure du document, de la scène et des réglages. L'écran et la comparaison des jeux de feuilles de deux
 * versions s'en servent tous les deux (même dessin, mêmes numéros).
 */

/** Onglet (et feuille) : le plan d'un niveau, sa toiture, son plafond, une façade, une coupe, les nomenclatures ou la planche. */
export type SheetTab =
  | { kind: 'level'; levelId: string }
  | { kind: 'roof'; levelId: string }
  | { kind: 'ceiling'; levelId: string }
  | { kind: 'schedules' }
  | { kind: 'elevation'; cardinal: Cardinal }
  | { kind: 'section'; sectionId: string }
  | { kind: 'sheet' }

export interface SheetView {
  /** Titre de la vue (cartouche et nom du fichier). */
  title: string
  /** Ligne d'explication sous les onglets. */
  note: string
  /** Construit le dessin, avec une hauteur de texte donnée (PDF) ou automatique (écran). */
  build: (fontMm?: number, version?: 'client' | 'execution') => Drawing | null
  /** Message quand il n'y a rien à dessiner. */
  emptyText: string
  /** Type de plan en tête de la colonne de droite du PDF (« Plan de niveau »), M20 20.4. */
  kind: string
  /** PDF : dessin sans ses tableaux, et tableaux posés dans la colonne de droite (plan de niveau, toiture). */
  parts?: (fontMm?: number, version?: 'client' | 'execution') => { main: Drawing | null; side: Drawing | null }
}

/** Ce dont les vues ont besoin : document, modèle 3D, scène de Pascal (lue par fonctions) et réglages de l'écran. */
export interface SheetContext {
  model: BuildingModel
  document: Pick<FabricsDocument, 'elements' | 'levels' | 'plan' | 'pascalQuantities'>
  /** Traits de coupe, triés par repère. */
  sections: readonly SectionLineElement[]
  /** Escaliers, mobilier et poteaux de Pascal d'un niveau (ADR 0007). */
  levelSymbols: (levelId: string) => PlanOverlay | null
  /** Plan de toiture d'un niveau (M20 20.1b) ; `null` sans toiture de Pascal. */
  roofPlans: (levelId: string) => { plan: RoofPlanData; stair: PlanOverlay | null } | null
  sheetDimensioning: Readonly<Record<string, DimensioningMode>>
  roofAreas: boolean
}

/** Dessin vide : support des tableaux posés seuls dans la colonne de droite du PDF (M20 20.4). */
export const EMPTY_SIDE: Drawing = { width: 0, height: 0, polygons: [], lines: [], texts: [] }

/** Vue d'un onglet. */
export function sheetView(tab: SheetTab, ctx: SheetContext): SheetView {
  const { model, sections, levelSymbols, roofPlans, sheetDimensioning, roofAreas } = ctx
  const levels = ctx.document.levels
  const elements = ctx.document.elements
  const pascalQuantities = ctx.document.pascalQuantities
  const northAngle = ctx.document.plan?.northAngle ?? 0
  const allLevels = levels ?? []
  if (tab.kind === 'schedules') {
    // Nomenclatures (M20 20.3) : tirées des métrés, comme l'onglet Métrés.
    const document = { elements: elements ?? [], levels: allLevels, pascalQuantities }
    const labels = { ...fr.views.schedule, kinds: fr.measurements.csv.kinds, styles: fr.measurements.csv.styles }
    return {
      title: fr.views.schedules,
      note: fr.views.schedulesNote,
      kind: fr.views.sheetKinds.schedules,
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
    if (!level) return { title: '', note: '', build: () => null, emptyText: fr.views.levelMissing, kind: '' }
    const document = { elements: elements ?? [], levels: allLevels, pascalQuantities }
    return {
      title: fr.views.ceilingPlan(level.name),
      note: fr.views.ceilingPlanNote,
      kind: fr.views.sheetKinds.ceiling,
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
    if (!level || !roof) return { title: '', note: '', build: () => null, emptyText: fr.views.levelMissing, kind: '' }
    const title = fr.views.roofPlan(level.name)
    // Surfaces de toiture sur demande (D20-10) : valeurs des métrés, pans comptés sur leur réunion (D20-15).
    const roofTable = () =>
      roofAreas
        ? roofAreaTable((pascalQuantities?.roofs ?? []).filter((r) => r.levelId === level.id), roofPerimeter(roof.plan), level.name, fr.views.roofAreaTable)
        : null
    const roofParts = (fontMm?: number) => {
      const main = roofPlanDrawing(roof.plan, { slope: fr.views.roofSlope }, fontMm, [
        roof.stair,
        (font) => annotationGraphics({ dimensions: roofChains(roof.plan.outlines), labels: [] }, font),
      ])
      const table = roofTable()
      const font = fontMm ?? (main ? autoFontMm(main.width, main.height) : 125)
      return { main, side: table ? withAreaTable(EMPTY_SIDE, table, font) : null }
    }
    return {
      title,
      note: fr.views.roofPlanNote,
      kind: fr.views.sheetKinds.roof,
      build: (fontMm) => {
        const { main, side } = roofParts(fontMm)
        if (!main || !side) return main
        return withAreaTable(main, roofTable(), fontMm ?? autoFontMm(main.width, main.height))
      },
      parts: (fontMm) => roofParts(fontMm),
      emptyText: fr.views.empty,
    }
  }
  if (tab.kind === 'level') {
    // Plan d'un niveau seul (M20 20.1b) : même dessin que sur la planche, une feuille par niveau.
    const level = allLevels.find((l) => l.id === tab.levelId)
    if (!level) return { title: '', note: '', build: () => null, emptyText: fr.views.levelMissing, kind: '' }
    const title = fr.views.levelPlan(level.name)
    const document = { elements: elements ?? [], levels: allLevels }
    const levelParts = (fontMm?: number, version?: 'client' | 'execution') => {
      const main = levelPlanDrawing(
        model,
        level,
        fontMm,
        (font) => sheetPlanOverlay(document, level.id, version ?? sheetDimensioning[level.id] ?? 'none', EXECUTION_LABELS, font),
        levelSymbols(level.id),
      )
      if (!main) return { main: null, side: null }
      // Tableau des surfaces (métrés, balcon compris, D20-10) et légende des hachures (M20 20.2).
      const metres = computeBuildingMeasurements(document).levels.find((l) => l.level.id === level.id)
      const table = metres ? levelAreaTable(metres.measurements, level.name, fr.views.areaTable) : null
      const font = fontMm ?? autoFontMm(main.width, main.height)
      const materials = levelWallMaterials(document.elements, level.id)
      const legend = (x: number, y: number) => materialLegend(materials, fr.materials.walls, fr.views.legendTitle, x, y, font)
      return { main, side: table || materials.length > 0 ? withAreaTable(EMPTY_SIDE, table, font, legend) : null, table, legend, font }
    }
    return {
      title,
      note: fr.views.levelPlanNote,
      kind: fr.views.sheetKinds.level,
      build: (fontMm, version) => {
        const p = levelParts(fontMm, version)
        if (!p.main) return null
        return withAreaTable(p.main, p.table ?? null, p.font!, p.legend)
      },
      parts: (fontMm, version) => {
        const { main, side } = levelParts(fontMm, version)
        return { main, side }
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
      kind: fr.views.sheetKinds.elevation,
      build: (fontMm) => drawingFromView(view, fontMm),
      emptyText: fr.views.empty,
    }
  }
  if (tab.kind === 'section') {
    const section = sections.find((s) => s.id === tab.sectionId)
    if (!section) {
      return { title: '', note: '', build: () => null, emptyText: fr.views.sectionMissing, kind: '' }
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
      kind: fr.views.sheetKinds.section,
      build: (fontMm) => (view ? drawingFromView(view, fontMm) : null),
      emptyText: fr.views.sectionEmpty,
    }
  }
  return {
    title: fr.views.sheet,
    note: fr.views.sheetNote,
    kind: fr.views.sheetKinds.sheet,
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
}
