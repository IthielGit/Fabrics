/**
 * Contrôle d'une ligne de prix ou d'un poste avant enregistrement (M23, 23.1).
 * Chaque problème est nommé ; rien n'est corrigé en silence.
 */
import type { PriceItemFields, WorkItemFields } from './model'
import { normalizeUnit } from './units'

/** Problème bloquant (la ligne n'est pas enregistrée). */
export type PriceItemError =
  | 'designationMissing'
  | 'unitMissing'
  | 'negativePrice'
  | 'sourceWithoutPrice'
  | 'invalidDate'

/** Problème signalé sans bloquer. */
export type PriceItemWarning = 'unitUnknown' | 'noPrice' | 'codeMissing'

export interface ValidationResult<E extends string> {
  errors: E[]
  warnings: PriceItemWarning[]
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

function commonChecks(fields: { designation: string; unit: string; code: string; priceHt: bigint | null }) {
  const errors: ('designationMissing' | 'unitMissing' | 'negativePrice')[] = []
  const warnings: PriceItemWarning[] = []
  if (fields.designation.trim() === '') errors.push('designationMissing')
  if (fields.unit.trim() === '') errors.push('unitMissing')
  else if (!normalizeUnit(fields.unit).known) warnings.push('unitUnknown')
  if (fields.priceHt !== null && fields.priceHt < 0n) errors.push('negativePrice')
  if (fields.priceHt === null) warnings.push('noPrice')
  if (fields.code.trim() === '') warnings.push('codeMissing')
  return { errors, warnings }
}

export function validatePriceItem(fields: PriceItemFields): ValidationResult<PriceItemError> {
  const { errors, warnings } = commonChecks(fields)
  const all: PriceItemError[] = [...errors]
  if (fields.sourcePrice !== null && fields.sourcePrice < 0n && !all.includes('negativePrice')) all.push('negativePrice')
  // Un prix source sans prix HT serait un prix « oublié » : la conversion doit être faite avant.
  if (fields.sourcePrice !== null && fields.priceHt === null) all.push('sourceWithoutPrice')
  if (fields.effectiveDate !== null && !isValidDate(fields.effectiveDate)) all.push('invalidDate')
  return { errors: all, warnings }
}

export function validateWorkItem(fields: WorkItemFields): ValidationResult<PriceItemError> {
  const { errors, warnings } = commonChecks(fields)
  return { errors: [...errors], warnings }
}
