import type { DemoRoomId } from './demoPlan'

/** Les trois plus-values que le visiteur peut essayer dans le hero de la page d'introduction. */
export type HeroMode = 'sketch' | 'measures' | 'check'

export const HERO_MODES: readonly HeroMode[] = ['sketch', 'measures', 'check']

/** Part du croquis visible (en %) derrière le séparateur, pour chaque plus-value présentée. */
export const DIVIDER_AT: Record<HeroMode, number> = { sketch: 50, measures: 0, check: 0 }

/** Ordre dans lequel les pièces s'allument pendant la démonstration des métrés. */
export const ROOM_SEQUENCE: readonly DemoRoomId[] = ['sejour', 'cuisine', 'entree']

/**
 * Défaut de démonstration du « contrôle avant export » : deux murs se superposent sur
 * 800 mm le long de la cloison séjour | cuisine (coordonnées en mm, comme dans l'éditeur).
 */
export const DEMO_FAULT = {
  firstWall: 'M2',
  secondWall: 'M5',
  x: 5200,
  fromY: 2400,
  toY: 3200,
} as const

/** Longueur de la superposition, en mm. */
export const demoFaultLength = (): number => DEMO_FAULT.toY - DEMO_FAULT.fromY

/**
 * Valeur affichée pendant un compte à rebours animé : de 0 à `value`, exacte à `progress = 1`.
 * La progression est bornée entre 0 et 1.
 */
export function countedValue(value: number, progress: number): number {
  if (progress >= 1) return value
  if (progress <= 0) return 0
  return value * progress
}
