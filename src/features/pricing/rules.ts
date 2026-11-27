/**
 * Règles de l'espace : élément du plan → postes (M23, 23.3, D23-15).
 *
 * Une règle prend une quantité de métré de M21 (famille « takeoff », jamais recalculée ici), un
 * filtre sur l'élément (matériau, épaisseur, couche, type d'ouverture) et l'envoie vers un poste,
 * avec un coefficient de perte. Plusieurs règles peuvent viser le même élément (maçonnerie, enduit,
 * peinture) ; une même quantité n'est jamais comptée deux fois dans un même poste.
 * Dans un projet, une correction à la main remplace ou retire la ligne d'une règle (tracée).
 */
import type { QuantityStatus } from '../measurements/quantities/status'
import { QUANTITY_DIMENSIONS, type QuantityCode, type QuantityDimension, type QuantityResult } from '../measurements/quantities/types'
import type { CanvasElement, WallMaterial } from '../../types/document'
import type { Tracking, WorkItem } from './model'
import { normalizeUnit } from './units'

export type OpeningKind = 'door' | 'window' | 'bay'

/** Quantités de métré qu'une règle peut viser (celles d'un élément du modèle). */
export const RULE_QUANTITY_CODES = (Object.keys(QUANTITY_DIMENSIONS) as QuantityCode[]).filter((code) => code !== 'other.count')

/** Filtre d'une règle : chaque critère renseigné doit être rempli. */
export interface RuleFilter {
  /** Matériau du mur (M10 bis). */
  wallMaterial: WallMaterial | null
  /** Matériau d'une couche du mur (composition de Pascal : « cmu », « plaster »…). */
  layerMaterial: string | null
  /** Épaisseur en mm (du mur, ou de la couche pour une quantité de couche), bornes comprises. */
  minThickness: number | null
  maxThickness: number | null
  openingKind: OpeningKind | null
}

export const EMPTY_FILTER: RuleFilter = {
  wallMaterial: null,
  layerMaterial: null,
  minThickness: null,
  maxThickness: null,
  openingKind: null,
}

export interface PricingRuleFields {
  name: string
  quantityCode: QuantityCode
  filter: RuleFilter
  /** Poste visé ; `null` si le poste a été retiré de la bibliothèque. */
  workItemId: string | null
  /** Perte ajoutée à la quantité, en points de base (500 = 5 %). */
  wasteBp: number
  enabled: boolean
  /** Ordre d'application (la première règle gagne en cas de doublon). */
  position: number
}

export interface PricingRule extends PricingRuleFields, Tracking {
  id: string
  libraryId: string
}

/** Correction à la main dans un projet : remplace le poste d'une règle pour une quantité, ou ajoute une ligne. */
export interface QuantityOverride {
  id: string
  /** Clé de la quantité (M21, stable : famille, code, élément, couche). */
  quantityKey: string
  /** Règle corrigée ; `null` : ligne ajoutée sans règle. */
  ruleId: string | null
  /** Nouveau poste ; `null` : la quantité est retirée de ce poste. */
  workItemId: string | null
  note: string
}

/** Ce qu'une règle peut lire d'un élément. */
export interface ElementFacts {
  type: string
  wallMaterial: WallMaterial | null
  thickness: number | null
  openingKind: OpeningKind | null
  layers: Map<string, { material: string | null; thickness: number }>
}

export function elementFacts(elements: readonly CanvasElement[]): Map<string, ElementFacts> {
  const facts = new Map<string, ElementFacts>()
  for (const element of elements) {
    const base: ElementFacts = { type: element.type, wallMaterial: null, thickness: null, openingKind: null, layers: new Map() }
    if (element.type === 'wall') {
      base.wallMaterial = element.material ?? null
      base.thickness = element.thickness
      for (const layer of element.layers ?? []) base.layers.set(layer.id, { material: layer.material ?? null, thickness: layer.thickness })
    } else if (element.type === 'opening') {
      base.openingKind = element.kind
    } else if (element.type === 'platform') {
      base.thickness = element.thickness
    }
    facts.set(element.id, base)
  }
  return facts
}

/** La règle vise-t-elle cette quantité ? */
export function ruleMatches(rule: PricingRuleFields, quantity: QuantityResult, facts: ReadonlyMap<string, ElementFacts>): boolean {
  if (!rule.enabled || quantity.code !== rule.quantityCode) return false
  const { filter } = rule
  const element = facts.get(quantity.elementIds[0] ?? '')
  const needsElement =
    filter.wallMaterial !== null ||
    filter.layerMaterial !== null ||
    filter.minThickness !== null ||
    filter.maxThickness !== null ||
    filter.openingKind !== null
  if (!needsElement) return true
  if (!element) return false
  if (filter.wallMaterial !== null && element.wallMaterial !== filter.wallMaterial) return false
  if (filter.openingKind !== null && element.openingKind !== filter.openingKind) return false
  const layer = quantity.partId ? element.layers.get(quantity.partId) : undefined
  if (filter.layerMaterial !== null) {
    const wanted = filter.layerMaterial.trim().toLowerCase()
    const materials = layer ? [layer.material] : [...element.layers.values()].map((l) => l.material)
    if (!materials.some((m) => (m ?? '').toLowerCase() === wanted)) return false
  }
  const thickness = layer ? layer.thickness : element.thickness
  if (filter.minThickness !== null && (thickness === null || thickness < filter.minThickness)) return false
  if (filter.maxThickness !== null && (thickness === null || thickness > filter.maxThickness)) return false
  return true
}

/** Unités de poste compatibles avec la grandeur d'une quantité. */
const COUNT_UNITS = new Set(['U', 'FFT', 'Lot', 'Ferme', 'Paire'])

export function unitCompatible(dimension: QuantityDimension, unit: string): boolean {
  const normalized = normalizeUnit(unit).unit
  switch (dimension) {
    case 'area':
      return normalized === 'm²'
    case 'volume':
      return normalized === 'm³'
    case 'length':
      return normalized === 'ml' || normalized === 'm'
    case 'count':
      return COUNT_UNITS.has(normalized)
  }
}

export type MatchWarningCode = 'ruleWithoutWork' | 'unitMismatch' | 'doubleMatch' | 'overrideUnknownWork'

export interface MatchWarning {
  code: MatchWarningCode
  ruleId: string | null
  quantityKey: string | null
}

/** Une quantité envoyée vers un poste, avec son origine. */
export interface MatchedLine {
  workItemId: string
  quantityKey: string
  code: QuantityCode
  dimension: QuantityDimension
  /** Valeur exacte dans l'unité de base (mm, mm², mm³, nombre), sans perte. */
  value: number
  elementIds: string[]
  partId: string | null
  levelId: string | null
  status: QuantityStatus
  ruleId: string | null
  overrideId: string | null
  wasteBp: number
}

export interface MatchResult {
  lines: MatchedLine[]
  warnings: MatchWarning[]
  /** Éléments qui ont des quantités de métré mais aucune ligne : couverture incomplète. */
  uncoveredElementIds: string[]
}

type QuantityWithStatus = QuantityResult & { status?: QuantityStatus }

export function matchQuantities(input: {
  quantities: readonly QuantityWithStatus[]
  facts: ReadonlyMap<string, ElementFacts>
  rules: readonly PricingRule[]
  workItems: ReadonlyMap<string, WorkItem>
  overrides?: readonly QuantityOverride[]
}): MatchResult {
  const warnings: MatchWarning[] = []
  const rules = [...input.rules].filter((r) => r.enabled).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  const usable = new Map<string, PricingRule>()
  for (const rule of rules) {
    const work = rule.workItemId ? input.workItems.get(rule.workItemId) : undefined
    if (!work) {
      warnings.push({ code: 'ruleWithoutWork', ruleId: rule.id, quantityKey: null })
      continue
    }
    usable.set(rule.id, rule)
  }
  const overrides = new Map<string, QuantityOverride>()
  const added: QuantityOverride[] = []
  for (const override of input.overrides ?? []) {
    if (override.ruleId === null) added.push(override)
    else overrides.set(`${override.quantityKey}|${override.ruleId}`, override)
  }

  const lines: MatchedLine[] = []
  const taken = new Set<string>()
  const covered = new Set<string>()
  const quantitiesByKey = new Map<string, QuantityWithStatus>()
  const push = (quantity: QuantityWithStatus, workItemId: string, ruleId: string | null, overrideId: string | null, wasteBp: number) => {
    const work = input.workItems.get(workItemId)
    if (!work) {
      warnings.push({ code: 'overrideUnknownWork', ruleId, quantityKey: quantity.key })
      return
    }
    if (!unitCompatible(quantity.dimension, work.unit)) {
      warnings.push({ code: 'unitMismatch', ruleId, quantityKey: quantity.key })
      return
    }
    const slot = `${quantity.key}|${workItemId}`
    if (taken.has(slot)) {
      warnings.push({ code: 'doubleMatch', ruleId, quantityKey: quantity.key })
      return
    }
    taken.add(slot)
    for (const id of quantity.elementIds) covered.add(id)
    lines.push({
      workItemId,
      quantityKey: quantity.key,
      code: quantity.code,
      dimension: quantity.dimension,
      value: quantity.value,
      elementIds: quantity.elementIds,
      partId: quantity.partId,
      levelId: quantity.levelId,
      status: quantity.status ?? 'validated',
      ruleId,
      overrideId,
      wasteBp,
    })
  }

  for (const quantity of input.quantities) {
    quantitiesByKey.set(quantity.key, quantity)
    for (const rule of usable.values()) {
      if (!ruleMatches(rule, quantity, input.facts)) continue
      const override = overrides.get(`${quantity.key}|${rule.id}`)
      if (override) {
        // Retirée à la main : l'élément est considéré comme traité.
        if (override.workItemId === null) quantity.elementIds.forEach((id) => covered.add(id))
        else push(quantity, override.workItemId, rule.id, override.id, rule.wasteBp)
        continue
      }
      push(quantity, rule.workItemId!, rule.id, null, rule.wasteBp)
    }
  }
  for (const override of added) {
    const quantity = quantitiesByKey.get(override.quantityKey)
    if (quantity && override.workItemId) push(quantity, override.workItemId, null, override.id, 0)
  }

  const uncovered = new Set<string>()
  for (const quantity of input.quantities) {
    if (quantity.category === 'other') continue
    for (const id of quantity.elementIds) if (!covered.has(id)) uncovered.add(id)
  }
  return { lines, warnings, uncoveredElementIds: [...uncovered] }
}

export type RuleError = 'name' | 'work' | 'thickness' | 'waste' | 'unitMismatch'

/** Contrôle d'une règle avant enregistrement ; chaque problème est nommé. */
export function validateRule(fields: PricingRuleFields, workItems: ReadonlyMap<string, WorkItem>, dimension: QuantityDimension): RuleError[] {
  const errors: RuleError[] = []
  if (fields.name.trim() === '') errors.push('name')
  const work = fields.workItemId ? workItems.get(fields.workItemId) : undefined
  if (!work) errors.push('work')
  else if (!unitCompatible(dimension, work.unit)) errors.push('unitMismatch')
  const { minThickness: min, maxThickness: max } = fields.filter
  const badThickness = (v: number | null) => v !== null && (!Number.isInteger(v) || v < 0)
  if (badThickness(min) || badThickness(max) || (min !== null && max !== null && min > max)) errors.push('thickness')
  if (!Number.isInteger(fields.wasteBp) || fields.wasteBp < 0 || fields.wasteBp > 10000) errors.push('waste')
  return errors
}
