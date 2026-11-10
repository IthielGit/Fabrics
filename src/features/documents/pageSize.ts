import { DESIGN_FORMATS } from './createProject'

/** Taille de page en unité du document (px pour un visuel, mm pour un plan). */
export interface PageSize {
  width: number
  height: number
}

export type PlanPageFormatId = 'room' | 'apartment' | 'house' | 'building' | 'plot'

/** Formats proposés pour la page d'un plan (zone de travail, pas feuille d'impression), en mm. */
export const PLAN_PAGE_FORMATS: readonly (PageSize & { id: PlanPageFormatId })[] = [
  { id: 'room', width: 6000, height: 5000 },
  { id: 'apartment', width: 12000, height: 10000 },
  { id: 'house', width: 20000, height: 15000 },
  { id: 'building', width: 40000, height: 30000 },
  { id: 'plot', width: 60000, height: 40000 },
]

/** Formats proposés pour la page d'un visuel : les mêmes que ceux de la création, en px. */
export const DESIGN_PAGE_FORMATS: readonly (PageSize & { id: string })[] = DESIGN_FORMATS

/** Limites d'une dimension de page : de 1 m à 200 m (plan), de 100 à 10 000 px (visuel). */
export const PAGE_LIMITS = {
  mm: { min: 1000, max: 200000 },
  px: { min: 100, max: 10000 },
} as const

/** Ramène une dimension à un entier dans les limites de l'unité (NaN : limite basse). */
export function clampPageDimension(value: number, unit: 'px' | 'mm'): number {
  const { min, max } = PAGE_LIMITS[unit]
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Vrai si la page a exactement cette taille. */
export function isSamePageSize(a: PageSize, b: PageSize): boolean {
  return a.width === b.width && a.height === b.height
}
