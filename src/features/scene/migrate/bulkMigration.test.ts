import { describe, expect, it } from 'vitest'
import type { RoomElement, WallElement } from '../../../types/document'
import { createDesignProject, createExamplePlanProject, createLargeHouseProject } from '../../documents/createProject'
import { toStoredProject } from '../../documents/migrations'
import { migrateStoredPlan } from './bulkMigration'

const NOW = new Date('2026-11-18T00:00:00Z')

describe('migration de la base (plan M18, point 3 B)', () => {
  it.each([
    ['exemple', createExamplePlanProject],
    ['grande maison', createLargeHouseProject],
  ])('le plan « %s » est prêt : scène sans écart de métrés', (_, create) => {
    const outcome = migrateStoredPlan(create(NOW))
    expect(outcome.status).toBe('ready')
    if (outcome.status === 'ready') expect(outcome.document).toMatchObject({ format: 'pascal-scene', version: 5 })
  })

  it('ne touche ni aux visuels ni aux plans déjà convertis', () => {
    expect(migrateStoredPlan(createDesignProject('a4', 'Affiche', NOW))).toEqual({ status: 'skipped', reason: 'design' })
    expect(migrateStoredPlan(toStoredProject(createExamplePlanProject(NOW)))).toEqual({ status: 'skipped', reason: 'already-scene' })
  })

  it('laisse intact et signale un plan dont une pièce changerait de surface', () => {
    const project = createExamplePlanProject(NOW)
    const doc = project.document
    // Une pièce tracée sur la moitié d'un espace fermé : Pascal l'étendrait à tout l'espace (ADR 0006).
    const sejour = doc.elements.find((el): el is RoomElement => el.type === 'room' && el.name === 'Séjour')!
    const xs = sejour.points.filter((_, i) => i % 2 === 0)
    const ys = sejour.points.filter((_, i) => i % 2 === 1)
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const half = x0 + Math.round(((x1 - x0) * 0.6) / 10) * 10
    const partial: RoomElement = { ...sejour, points: [x0, y0, half, y0, half, y1, x0, y1] }
    const outcome = migrateStoredPlan({ ...project, document: { ...doc, elements: doc.elements.map((el) => (el === sejour ? partial : el)) } })
    expect(outcome).toMatchObject({ status: 'refused', reason: 'measurements-changed' })
  })

  it('refuse avec une erreur claire un plan aux identifiants en double', () => {
    const project = createExamplePlanProject(NOW)
    const wall = project.document.elements.find((el): el is WallElement => el.type === 'wall')!
    const outcome = migrateStoredPlan({ ...project, document: { ...project.document, elements: [...project.document.elements, { ...wall }] } })
    expect(outcome).toMatchObject({ status: 'refused', reason: 'error' })
    if (outcome.status === 'refused') expect(outcome.detail).toContain(wall.id)
  })
})
