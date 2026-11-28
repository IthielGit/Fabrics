/**
 * Onglet « Contrôles » (M24, 24.1) : module propriétaire du regroupement de tous les points à
 * vérifier d'un plan. Il rassemble les contrôles existants (`warnings.ts`, `qualityChecks.ts`,
 * `wallContacts.ts`) et ajoute les identifiants en double et les points du DQE. Rien n'est corrigé ici.
 * Fonctions pures.
 */
import type { CanvasElement, FabricsDocument } from '../../types/document'
import type { Estimate } from '../pricing/estimate'
import type { BuildingMeasurements } from './measurements'
import { metresWarnings, type MetresWarning } from './warnings'

/** À corriger : les métrés sont faux ou incomplets. À vérifier : douteux. Pour information : sans effet sur les chiffres. */
export type ControlGroup = 'fix' | 'check' | 'info'

export const CONTROL_GROUPS: readonly ControlGroup[] = ['fix', 'check', 'info']

/** Groupe de chaque contrôle du plan ; le type oblige à classer tout nouveau contrôle. */
export const WARNING_GROUP: Record<MetresWarning['kind'], ControlGroup> = {
  coverageGap: 'fix',
  coverageOverflow: 'fix',
  openingOutside: 'fix',
  wallInvalidThickness: 'fix',
  wallZeroLength: 'fix',
  openingInvalidSize: 'fix',
  roomSelfIntersecting: 'fix',
  roofInvalid: 'fix',
  roomOverlap: 'check',
  voidOverflow: 'check',
  noLevel: 'check',
  wallZeroHeight: 'check',
  openingOverlap: 'check',
  wallGap: 'check',
  wallOverlap: 'check',
  openingTooTall: 'check',
  wallNoMaterial: 'check',
  suspiciousUnit: 'check',
  hiddenRoom: 'info',
  roomNoName: 'info',
}

/** Points du projet qui ne viennent pas d'un contrôle de géométrie. */
export type ExtraControl =
  | { kind: 'duplicateId'; id: string; count: number }
  | { kind: 'dqeUncovered'; elementIds: string[] }
  | { kind: 'dqeNoPrice'; count: number }
  | { kind: 'dqeProvisional'; count: number }
  | { kind: 'dqeRules'; count: number }

export const EXTRA_GROUP: Record<ExtraControl['kind'], ControlGroup> = {
  duplicateId: 'fix',
  dqeNoPrice: 'check',
  dqeUncovered: 'check',
  dqeRules: 'check',
  dqeProvisional: 'info',
}

export type ControlItem =
  | { source: 'plan'; group: ControlGroup; warning: MetresWarning }
  | { source: 'extra'; group: ControlGroup; extra: ExtraControl }

/** Identifiants portés par plusieurs éléments (aucun métré fiable pour ceux-là). */
export function duplicateIds(elements: readonly Pick<CanvasElement, 'id'>[]): { id: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const { id } of elements) counts.set(id, (counts.get(id) ?? 0) + 1)
  return [...counts].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }))
}

/** Points du DQE à signaler (ceux du panneau DQE : couverture, sans prix, provisoires, règles). */
export function estimateControls(estimate: Estimate): ExtraControl[] {
  const out: ExtraControl[] = []
  if (estimate.uncoveredElementIds.length > 0) out.push({ kind: 'dqeUncovered', elementIds: [...estimate.uncoveredElementIds] })
  if (estimate.linesWithoutPrice > 0) out.push({ kind: 'dqeNoPrice', count: estimate.linesWithoutPrice })
  if (estimate.provisionalLines > 0) out.push({ kind: 'dqeProvisional', count: estimate.provisionalLines })
  if (estimate.warnings.length > 0) out.push({ kind: 'dqeRules', count: estimate.warnings.length })
  return out
}

/**
 * Tous les points d'un plan, dans l'ordre : à corriger, à vérifier, pour information. Avec `levelId`,
 * seuls les points de ce niveau (les points du projet entier — sans niveau, doublons, DQE — restent).
 */
export function planControls(input: {
  document: Pick<FabricsDocument, 'elements' | 'levels'>
  building: BuildingMeasurements
  levelId?: string | null
  estimate?: Estimate | null
}): ControlItem[] {
  const { document, building, levelId = null, estimate = null } = input
  const items: ControlItem[] = metresWarnings(document, building, levelId).map((warning) => ({
    source: 'plan',
    group: WARNING_GROUP[warning.kind],
    warning,
  }))
  const extras: ExtraControl[] = duplicateIds(document.elements).map((d) => ({ kind: 'duplicateId', ...d }))
  if (estimate) extras.push(...estimateControls(estimate))
  for (const extra of extras) items.push({ source: 'extra', group: EXTRA_GROUP[extra.kind], extra })
  const rank = (group: ControlGroup) => CONTROL_GROUPS.indexOf(group)
  return items.sort((a, b) => rank(a.group) - rank(b.group))
}

export function countByGroup(items: readonly ControlItem[]): Record<ControlGroup, number> {
  const counts: Record<ControlGroup, number> = { fix: 0, check: 0, info: 0 }
  for (const item of items) counts[item.group]++
  return counts
}
