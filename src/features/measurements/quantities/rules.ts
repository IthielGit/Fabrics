/**
 * Règles versionnées du quantitatif (M21, 21.2). Décisions : `docs/phases/M21-decisions.md`.
 *
 * Chaque quantité porte la règle qui l'a produite (identifiant + version). Une règle dont le calcul
 * change reçoit une nouvelle version : un quantitatif ancien reste lisible avec la règle de son temps.
 * Les libellés et formules affichés sont dans `src/i18n/fr.ts` (`quantities.rules`), par identifiant.
 */
import type { QuantityCode, QuantityFamily } from './types'

/** Version du jeu de règles « avant-métré à la française » (D21-1). */
export const RULESET_VERSION = 'fr-2026.1'
/** Version des règles géométriques (forme exacte, toutes les ouvertures déduites par union). */
export const GEOMETRY_VERSION = 'geo-2026.1'

/** Catégories d'ouvrage qui ont leur propre seuil de déduction des vides (D21-2). */
export type ThresholdCategory = 'masonry' | 'plaster' | 'paint'
export const THRESHOLD_CATEGORIES: readonly ThresholdCategory[] = ['masonry', 'plaster', 'paint']

/** Réglages du quantitatif d'un projet (enregistrés avec le plan). Seuils en mm². */
export interface TakeoffSettings {
  /**
   * Une ouverture n'est déduite que si sa surface dépasse le seuil de la catégorie. 0 (par défaut) :
   * toute ouverture est déduite, en attendant les valeurs d'un métreur (D21-2).
   */
  thresholds: Record<ThresholdCategory, number>
}

export const DEFAULT_TAKEOFF_SETTINGS: TakeoffSettings = { thresholds: { masonry: 0, plaster: 0, paint: 0 } }

/** Réglages complets à partir de ceux du plan (absents ou partiels : valeurs par défaut). */
export function takeoffSettingsOf(saved: { thresholds?: Partial<Record<ThresholdCategory, number>> } | undefined): TakeoffSettings {
  const thresholds = { ...DEFAULT_TAKEOFF_SETTINGS.thresholds }
  for (const category of THRESHOLD_CATEGORIES) {
    const value = saved?.thresholds?.[category]
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) thresholds[category] = value
  }
  return { thresholds }
}

export interface QuantityRule {
  /** Identifiant de la règle : famille puis code (`takeoff.wall.netArea`). */
  id: string
  version: string
  /** Seuil de déduction appliqué (catégorie et valeur en mm²), pour les règles qui en ont un. */
  threshold?: { category: ThresholdCategory; value: number }
}

/** Catégorie de seuil de chaque quantité de métré qui déduit des ouvertures. */
export const THRESHOLD_OF: Partial<Record<QuantityCode, ThresholdCategory>> = {
  'wall.openingsArea': 'masonry',
  'wall.netArea': 'masonry',
  'wall.netVolume': 'masonry',
  'wall.plasterArea': 'plaster',
  'wall.paintArea': 'paint',
}

export function ruleOf(family: QuantityFamily, code: QuantityCode, settings: TakeoffSettings = DEFAULT_TAKEOFF_SETTINGS): QuantityRule {
  const rule: QuantityRule = { id: `${family}.${code}`, version: family === 'geometric' ? GEOMETRY_VERSION : RULESET_VERSION }
  const category = family === 'takeoff' ? THRESHOLD_OF[code] : undefined
  if (category) rule.threshold = { category, value: settings.thresholds[category] }
  return rule
}
