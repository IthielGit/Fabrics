import { buildBuildingModel } from '../building/model'
import { PAPER_TEXT_MM, type Drawing } from '../building/views/drawing'
import type { PlanScene } from '../scene/sceneTypes'
import { pascalLevelSymbols, pascalRoofStairSymbols } from '../scene/view/levelPlanSymbols'
import { pascalRoofPlan } from '../scene/view/roofPlanData'
import { fr } from '../../i18n/fr'
import type { FabricsDocument, SectionLineElement, SheetSetSettings } from '../../types/document'
import { sheetView, type SheetContext, type SheetTab } from './sheetViews'

/**
 * Jeu de feuilles d'un projet Plan (M20 20.7) : la liste des feuilles numérotées, leur empreinte, et la
 * comparaison de deux jeux (une version et la précédente). Rien n'est enregistré à part : le jeu d'une
 * version se recalcule depuis son document (scène Pascal, D79), donc il est figé avec elle.
 */

export interface SheetEntry {
  /** Identifiant stable de la feuille (`level-<id>`, `elevation-N`, `schedules`…). */
  key: string
  tab: SheetTab
  /** N° de plan : saisi à la main, sinon automatique (01, 02…) dans l'ordre du jeu. */
  number: string
  title: string
}

/** Identifiant stable d'une feuille. */
export function sheetKey(tab: SheetTab): string {
  switch (tab.kind) {
    case 'level':
    case 'roof':
    case 'ceiling':
      return `${tab.kind}-${tab.levelId}`
    case 'elevation':
      return `elevation-${tab.cardinal}`
    case 'section':
      return `section-${tab.sectionId}`
    default:
      return tab.kind
  }
}

/** Renseignements par défaut du jeu de feuilles. */
export const DEFAULT_SHEET_SET: SheetSetSettings = { issuer: '', revision: '0', status: 'esquisse' }

/**
 * Feuilles du projet dans l'ordre du jeu, comme un dossier de plans : plans de niveau (du plus bas au
 * plus haut), plans de toiture, plans de plafond, façades N, E, S, O, coupes, nomenclatures, planche.
 * Numéros automatiques sur deux chiffres ; un numéro saisi à la main (`numbers`) l'emporte.
 */
export function sheetSet(ctx: Pick<SheetContext, 'document' | 'sections' | 'roofPlans'>, numbers: Readonly<Record<string, string>> = {}): SheetEntry[] {
  const levels = [...(ctx.document.levels ?? [])].sort((a, b) => a.elevation - b.elevation)
  const items: { tab: SheetTab; title: string }[] = [
    ...levels.map((l) => ({ tab: { kind: 'level', levelId: l.id } as SheetTab, title: fr.views.levelPlan(l.name) })),
    ...levels.filter((l) => ctx.roofPlans(l.id) !== null).map((l) => ({ tab: { kind: 'roof', levelId: l.id } as SheetTab, title: fr.views.roofPlan(l.name) })),
    ...levels.map((l) => ({ tab: { kind: 'ceiling', levelId: l.id } as SheetTab, title: fr.views.ceilingPlan(l.name) })),
    ...(['N', 'E', 'S', 'O'] as const).map((cardinal) => ({ tab: { kind: 'elevation', cardinal } as SheetTab, title: fr.views.elevation[cardinal] })),
    ...ctx.sections.map((s) => ({ tab: { kind: 'section', sectionId: s.id } as SheetTab, title: fr.views.section(s.label) })),
    { tab: { kind: 'schedules' }, title: fr.views.schedules },
    { tab: { kind: 'sheet' }, title: fr.views.sheet },
  ]
  return items.map(({ tab, title }, index) => {
    const key = sheetKey(tab)
    return { key, tab, title, number: numbers[key]?.trim() || String(index + 1).padStart(2, '0') }
  })
}

/** Empreinte d'un dessin : change dès qu'un trait, un fond ou un texte change (au dixième de mm réel). */
export function drawingSignature(drawing: Drawing | null): string | null {
  if (!drawing) return null
  const text = JSON.stringify(drawing, (_key, value: unknown) => (typeof value === 'number' ? Math.round(value * 10) / 10 : value))
  // Deux hachages FNV-1a de 32 bits (64 bits en tout) : une collision n'est pas à craindre ici.
  let a = 0x811c9dc5
  let b = 0x01000193
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    a = Math.imul(a ^ c, 0x01000193)
    b = Math.imul(b ^ c, 0x5bd1e995) ^ (b >>> 15)
  }
  return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0')
}

export interface SheetSnapshot {
  key: string
  number: string
  title: string
  /** `null` : rien à dessiner. */
  signature: string | null
}

/**
 * Feuilles d'un état du projet avec leur empreinte. Dessinées toujours de la même façon pour que deux
 * versions se comparent : texte à 1:100, cotes Exécution, surfaces de toiture affichées.
 */
export function sheetSnapshots(ctx: SheetContext, numbers: Readonly<Record<string, string>> = {}): SheetSnapshot[] {
  const fixed: SheetContext = {
    ...ctx,
    roofAreas: true,
    sheetDimensioning: Object.fromEntries((ctx.document.levels ?? []).map((l) => [l.id, 'execution'])),
  }
  return sheetSet(fixed, numbers).map(({ key, number, title, tab }) => ({
    key,
    number,
    title,
    signature: drawingSignature(sheetView(tab, fixed).build(PAPER_TEXT_MM * 100, 'execution')),
  }))
}

export type SheetChange = 'added' | 'removed' | 'changed' | 'unchanged'

export interface SheetComparison {
  key: string
  /** N° et titre dans le nouveau jeu (dans l'ancien pour une feuille supprimée). */
  number: string
  title: string
  change: SheetChange
  /** N° dans l'ancien jeu, s'il a changé. */
  previousNumber?: string
}

/**
 * Compare deux jeux de feuilles (M20 20.7) : feuilles ajoutées, supprimées, modifiées (le dessin a
 * changé) ou identiques, dans l'ordre du nouveau jeu, puis les feuilles supprimées.
 */
export function compareSheetSets(previous: readonly SheetSnapshot[], next: readonly SheetSnapshot[]): SheetComparison[] {
  const before = new Map(previous.map((s) => [s.key, s]))
  const result: SheetComparison[] = next.map((s) => {
    const old = before.get(s.key)
    let change: SheetChange
    if (!old || (old.signature === null && s.signature !== null)) change = 'added'
    else if (old.signature === s.signature) change = 'unchanged'
    else if (s.signature === null) change = 'removed'
    else change = 'changed'
    return { key: s.key, number: s.number, title: s.title, change, ...(old && old.number !== s.number ? { previousNumber: old.number } : {}) }
  })
  const kept = new Set(next.map((s) => s.key))
  for (const s of previous) {
    if (!kept.has(s.key) && s.signature !== null) result.push({ key: s.key, number: s.number, title: s.title, change: 'removed' })
  }
  return result
}

/**
 * Jeu de feuilles d'un état enregistré du projet (une version, M20 20.7) : document et scène Pascal
 * (sans scène, ni escaliers ni mobilier de Pascal, ni toiture). Numéros de la version.
 */
export function sheetSnapshotsOf(document: FabricsDocument, scene: PlanScene | null): SheetSnapshot[] {
  const nodes = scene?.nodes
  const sections = document.elements
    .filter((el): el is SectionLineElement => el.type === 'section')
    .sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true }))
  return sheetSnapshots(
    {
      model: buildBuildingModel({ elements: document.elements, levels: document.levels, plan: document.plan }),
      document,
      sections,
      levelSymbols: (levelId) => (nodes ? pascalLevelSymbols(nodes, levelId) : null),
      roofPlans: (levelId) => {
        const plan = nodes ? pascalRoofPlan(nodes, levelId) : null
        return plan && nodes ? { plan, stair: pascalRoofStairSymbols(nodes, levelId) } : null
      },
      sheetDimensioning: {},
      roofAreas: true,
    },
    document.plan?.sheets?.numbers,
  )
}
