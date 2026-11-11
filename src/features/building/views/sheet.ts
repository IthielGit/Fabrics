import type { Level } from '../../../types/document'
import type { Cardinal } from '../north'
import type { BuildingModel } from '../types'
import {
  autoFontMm,
  composeSheet,
  drawingFromView,
  levelPlanDrawing,
  type Drawing,
  type SheetEntry,
  type SheetResult,
} from './drawing'
import { buildElevation } from './elevation'
import { buildSection, type SectionSpec } from './section'

const CARDINALS: Cardinal[] = ['N', 'E', 'S', 'O']

/** Textes des titres de la planche (viennent de `src/i18n/fr.ts`). */
export interface SheetLabels {
  elevation: Record<Cardinal, string>
  section: (label: string) => string
  /** Nom de la cote d'altitude du faîtage dans les coupes ; absent : pas de cote. */
  ridge?: string
}

export interface SheetInput {
  model: BuildingModel
  levels: readonly Level[]
  sections: readonly SectionSpec[]
  northAngle: number
  labels: SheetLabels
  /** Hauteur des textes (mm réels) ; absent : choisie d'après la taille de la planche. */
  fontMm?: number
}

function entriesFor(input: SheetInput, fontMm: number | undefined): SheetEntry[] {
  const { model, levels, sections, northAngle, labels } = input
  const entries: SheetEntry[] = []
  const add = (id: string, title: string, drawing: Drawing | null) => {
    if (drawing) entries.push({ id, title, drawing })
  }
  // Niveaux du plus bas au plus haut, puis les quatre façades, puis les coupes dans l'ordre des repères.
  for (const level of [...levels].sort((a, b) => a.elevation - b.elevation)) {
    add(`level-${level.id}`, level.name, levelPlanDrawing(model, level, fontMm))
  }
  for (const cardinal of CARDINALS) {
    const view = buildElevation(model, levels, cardinal, northAngle)
    add(`elevation-${cardinal}`, labels.elevation[cardinal], drawingFromView(view, fontMm))
  }
  const ordered = [...sections].sort((a, b) => a.label.localeCompare(b.label, 'fr', { numeric: true }))
  for (const section of ordered) {
    const view = buildSection(model, levels, labels.ridge ? { ...section, ridgeLabel: labels.ridge } : section)
    if (view) add(`section-${section.label}`, labels.section(section.label), drawingFromView(view, fontMm))
  }
  return entries
}

/**
 * La planche : plans des niveaux, façades et coupes côte à côte, à la même échelle, avec leurs
 * titres. Les textes ont une hauteur commune, choisie d'après le plus grand dessin. Une planche
 * sans rien à montrer donne un dessin vide (largeur 0).
 */
export function buildSheet(input: SheetInput): SheetResult {
  const first = entriesFor(input, input.fontMm)
  if (first.length === 0) return composeSheet([], 100)
  if (input.fontMm !== undefined) return composeSheet(first, input.fontMm)
  const biggest = Math.max(...first.flatMap((e) => [e.drawing.width, e.drawing.height]))
  const fontMm = autoFontMm(biggest, biggest)
  return composeSheet(entriesFor(input, fontMm), fontMm)
}
