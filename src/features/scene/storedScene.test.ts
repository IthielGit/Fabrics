/**
 * M18, lot D : un projet Plan est enregistré par sa scène Pascal, et elle seule ; il se rouvre avec
 * les mêmes métrés (critère G1 : au mm et au centième de m² près).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDesignProject, createExamplePlanProject, createLargeHouseProject, duplicateProject } from '../documents/createProject'
import { migrateDocument, migrateProject, toStoredProject, UnsupportedDocumentVersionError } from '../documents/migrations'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { projectToRow, rowToStoredProject } from '../persistence/cloudMapping'
import { isSceneDocument, toStoredDocument } from './storedScene'

const idb = new Map<string, unknown>()
vi.mock('idb-keyval', () => ({
  get: async (key: string) => structuredClone(idb.get(key)),
  set: async (key: string, value: unknown) => void idb.set(key, structuredClone(value)),
  del: async (key: string) => void idb.delete(key),
  delMany: async (keys: string[]) => void keys.forEach((key) => idb.delete(key)),
  keys: async () => [...idb.keys()],
  getMany: async (keys: string[]) => keys.map((key) => structuredClone(idb.get(key))),
  setMany: async (entries: [string, unknown][]) => void entries.forEach(([key, value]) => idb.set(key, structuredClone(value))),
}))
const { LocalRepository } = await import('../persistence/LocalRepository')

const NOW = new Date('2026-11-18T00:00:00Z')

beforeEach(() => idb.clear())

describe('enregistrement d’un projet Plan (scène Pascal)', () => {
  it('enregistre la scène, jamais la vue ; un projet Visuel garde son document', () => {
    const plan = createExamplePlanProject(NOW)
    const stored = toStoredProject(plan)
    expect(isSceneDocument(stored.document)).toBe(true)
    expect(stored.document).toMatchObject({ format: 'pascal-scene', version: 5 })
    expect('elements' in stored.document).toBe(false)
    expect('scene' in stored).toBe(false)

    const design = createDesignProject('a4', 'Affiche', NOW)
    expect(toStoredDocument(design)).toBe(design.document)
  })

  it.each([
    ['exemple', createExamplePlanProject],
    ['grande maison', createLargeHouseProject],
  ])('le plan « %s » se rouvre avec les mêmes métrés (Supabase : JSON aller-retour)', (_, create) => {
    const project = create(NOW)
    const row = JSON.parse(JSON.stringify(projectToRow(project)))
    const reopened = migrateProject(rowToStoredProject({ ...row, updated_at: row.created_at }))
    expect(reopened.document).toStrictEqual(project.document)
    expect(reopened.scene).toBeDefined()
    expect(computeBuildingMeasurements(reopened.document)).toStrictEqual(computeBuildingMeasurements(project.document))
  })

  it('un plan enregistré avant M18 s’ouvre tel quel, puis est réenregistré en scène', async () => {
    const repo = new LocalRepository()
    const old = createExamplePlanProject(NOW)
    idb.set(`project:${old.id}`, structuredClone(old)) // ancien format : document Fabrics
    const opened = await repo.get(old.id)
    expect(opened!.document).toStrictEqual(old.document)
    expect(opened!.scene).toBeUndefined()

    await repo.save(opened!)
    expect(isSceneDocument((idb.get(`project:${old.id}`) as { document: unknown }).document)).toBe(true)
    const reopened = await repo.get(old.id)
    expect(reopened!.document).toStrictEqual(old.document)
    expect(computeBuildingMeasurements(reopened!.document)).toStrictEqual(computeBuildingMeasurements(old.document))
  })

  it('le résumé de l’accueil ne contient ni le document ni la scène', async () => {
    const repo = new LocalRepository()
    const plan = migrateProject(toStoredProject(createExamplePlanProject(NOW)))
    await repo.save(plan)
    const [summary] = await repo.list()
    expect(summary).not.toHaveProperty('document')
    expect(summary).not.toHaveProperty('scene')
  })

  it('dupliquer un plan donne un projet indépendant, avec la même scène et les mêmes métrés', async () => {
    const repo = new LocalRepository()
    const plan = migrateProject(toStoredProject(createExamplePlanProject(NOW)))
    await repo.save(plan)
    const copy = duplicateProject((await repo.get(plan.id))!, 'Copie', NOW)
    await repo.save(copy)
    const reopened = (await repo.get(copy.id))!
    expect(reopened.id).not.toBe(plan.id)
    expect(reopened.document).toStrictEqual(plan.document)
    expect(reopened.scene).toStrictEqual(plan.scene)
  })

  it('une version enregistrée (ancien ou nouveau format) s’affiche par sa vue', () => {
    const plan = createExamplePlanProject(NOW)
    const sceneVersion = JSON.parse(JSON.stringify(toStoredDocument(plan)))
    expect(migrateDocument(sceneVersion)).toStrictEqual(plan.document)
    expect(migrateDocument(structuredClone(plan.document))).toStrictEqual(plan.document)
  })

  it('un document plus récent que cette version de Fabrics est refusé proprement', () => {
    const plan = createExamplePlanProject(NOW)
    expect(() => migrateDocument({ ...plan.document, version: 6 })).toThrow(UnsupportedDocumentVersionError)
  })
})
