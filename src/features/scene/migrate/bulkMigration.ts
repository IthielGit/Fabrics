/**
 * Conversion d'un projet enregistré vers le format scène (plan M18, point 3 B : script sur toute la
 * base). Fonction pure : le script `scripts/migrate-plans-m18.ts` lit les projets, appelle
 * `migrateStoredPlan` et n'écrit que les projets « prêts ».
 *
 * Garde-fou (ADR 0006) : les métrés du plan sont calculés avant et après la conversion ; au moindre
 * écart, le projet est laissé intact et signalé.
 */
import type { FabricsDocument } from '../../../types/document'
import { migrateDocument, type StoredProject } from '../../documents/migrations'
import { computeBuildingMeasurements } from '../../measurements/measurements'
import { deepEqual } from '../sceneBinding'
import { isSceneDocument, toStoredDocument, viewOfStoredScene, type SceneDocument } from '../storedScene'

export type PlanMigrationOutcome =
  | { status: 'skipped'; reason: 'design' | 'already-scene' }
  | { status: 'ready'; document: SceneDocument }
  | { status: 'refused'; reason: 'measurements-changed' | 'error'; detail: string }

export function migrateStoredPlan(project: Pick<StoredProject, 'kind' | 'document'>): PlanMigrationOutcome {
  if (project.kind !== 'plan') return { status: 'skipped', reason: 'design' }
  if (isSceneDocument(project.document)) return { status: 'skipped', reason: 'already-scene' }
  let before: FabricsDocument
  let document: SceneDocument
  try {
    before = migrateDocument(project.document)
    document = toStoredDocument({ kind: 'plan', document: before }) as SceneDocument
  } catch (error) {
    return { status: 'refused', reason: 'error', detail: error instanceof Error ? error.message : String(error) }
  }
  const measuredBefore = computeBuildingMeasurements(before)
  const measuredAfter = computeBuildingMeasurements(viewOfStoredScene(JSON.parse(JSON.stringify(document)) as SceneDocument))
  if (!deepEqual(measuredBefore, measuredAfter)) {
    return { status: 'refused', reason: 'measurements-changed', detail: firstDifference(measuredBefore, measuredAfter) }
  }
  return { status: 'ready', document }
}

/** Premier chemin où deux valeurs JSON diffèrent (pour le rapport). */
export function firstDifference(a: unknown, b: unknown, path = ''): string {
  if (deepEqual(a, b)) return ''
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const key of keys) {
      const found = firstDifference((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], `${path}.${key}`)
      if (found) return found
    }
  }
  return `${path || '(racine)'} : ${JSON.stringify(a)} → ${JSON.stringify(b)}`
}
