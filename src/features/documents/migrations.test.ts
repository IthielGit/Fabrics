import { describe, expect, it } from 'vitest'
import {
  CURRENT_DOCUMENT_VERSION,
  migrateDocument,
  migrateProject,
  UnsupportedDocumentVersionError,
  type StoredDocument,
  type StoredProject,
} from './migrations'

function v1PlanDocument(): StoredDocument {
  return {
    version: 1,
    unit: 'mm',
    page: { width: 20000, height: 15000, background: '#ffffff' },
    plan: {
      scale: 50,
      gridSize: 100,
      snapToGrid: true,
      defaultWallThickness: 200,
      defaultWallHeight: 2500,
    },
    elements: [
      {
        id: 'w1',
        type: 'wall',
        name: 'Mur 1',
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        points: [0, 0, 4000, 0, 4000, 3000],
        thickness: 200,
        height: 2500,
        fill: '#475569',
      },
      {
        id: 'r1',
        type: 'room',
        name: 'Cuisine',
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        points: [0, 0, 4000, 0, 4000, 3000, 0, 3000],
        fill: '#3b82f633',
        showLabel: true,
      },
    ],
  }
}

describe('migrateDocument', () => {
  it('la version actuelle est 2', () => {
    expect(CURRENT_DOCUMENT_VERSION).toBe(2)
  })

  it('un document v1 passe en v2 sans perdre aucun élément', () => {
    const source = v1PlanDocument()
    const snapshot = structuredClone(source)
    const migrated = migrateDocument(source)

    expect(migrated.version).toBe(2)
    expect(migrated.elements).toEqual(snapshot.elements)
    expect(migrated.page).toEqual(snapshot.page)
    expect(migrated.plan).toEqual(snapshot.plan)
    expect(migrated.unit).toBe('mm')
  })

  it('ne modifie pas le document reçu', () => {
    const source = v1PlanDocument()
    migrateDocument(source)
    expect(source.version).toBe(1)
  })

  it('un document déjà à jour est renvoyé tel quel', () => {
    const current = { ...v1PlanDocument(), version: 2 }
    expect(migrateDocument(current)).toBe(current)
  })

  it.each([0, 3, 1.5, Number.NaN])('refuse la version %s', (version) => {
    expect(() => migrateDocument({ ...v1PlanDocument(), version })).toThrow(
      UnsupportedDocumentVersionError,
    )
  })
})

describe('migrateProject', () => {
  const base: Omit<StoredProject, 'document'> = {
    id: 'p1',
    name: 'Maison',
    kind: 'plan',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  }

  it('migre le document et garde le reste du projet', () => {
    const project = migrateProject({ ...base, document: v1PlanDocument() })
    expect(project.document.version).toBe(2)
    expect(project.name).toBe('Maison')
    expect(project.updatedAt).toBe(base.updatedAt)
  })

  it('renvoie le même objet si rien ne change', () => {
    const project: StoredProject = { ...base, document: { ...v1PlanDocument(), version: 2 } }
    expect(migrateProject(project)).toBe(project)
  })
})
