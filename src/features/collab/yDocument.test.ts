import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { createExamplePlanProject, createPlanProject } from '../documents/createProject'
import { createWallElement } from '../documents/elements'
import type { CanvasElement, FabricsDocument } from '../../types/document'
import {
  applyDocumentDiff,
  isLaterThan,
  isSavedAtOnly,
  isYDocumentEmpty,
  longestIncreasing,
  readDocument,
  readSavedAt,
  writeDocument,
  writeSavedAt,
  yParts,
} from './yDocument'

function planDocument(): FabricsDocument {
  return createPlanProject('Essai').document
}

function wall(name: string): CanvasElement {
  return createWallElement(name, [0, 0, 3500, 0], 200, 2700)
}

function ids(document: FabricsDocument | null): string[] {
  return (document?.elements ?? []).map((el) => el.name)
}

describe('writeDocument / readDocument', () => {
  it('un Y.Doc neuf est vide', () => {
    const ydoc = new Y.Doc()
    expect(isYDocumentEmpty(ydoc)).toBe(true)
    expect(readDocument(ydoc)).toBeNull()
  })

  it('relit exactement le plan d’exemple', () => {
    const document = createExamplePlanProject().document
    const ydoc = new Y.Doc()
    writeDocument(ydoc, document)
    expect(isYDocumentEmpty(ydoc)).toBe(false)
    expect(readDocument(ydoc)).toEqual(JSON.parse(JSON.stringify(document)))
  })

  it('un visuel sans réglages de plan ni niveaux reste sans ces champs', () => {
    const document: FabricsDocument = {
      version: 4,
      unit: 'px',
      page: { width: 1080, height: 1080, background: '#ffffff' },
      elements: [],
    }
    const ydoc = new Y.Doc()
    writeDocument(ydoc, document)
    const read = readDocument(ydoc)
    expect(read).toEqual(document)
    expect(read && 'plan' in read).toBe(false)
    expect(read && 'levels' in read).toBe(false)
  })
})

describe('applyDocumentDiff', () => {
  it('ajoute, modifie, supprime et réordonne des éléments', () => {
    const a = wall('A')
    const b = wall('B')
    const c = wall('C')
    const start = { ...planDocument(), elements: [a, b, c] }
    const ydoc = new Y.Doc()
    writeDocument(ydoc, start)

    const d = wall('D')
    const movedB = { ...b, x: 100 }
    const next = { ...start, elements: [c, movedB, d] } // A supprimé, C au début, D ajouté
    applyDocumentDiff(ydoc, start, next)
    const read = readDocument(ydoc)
    expect(ids(read)).toEqual(['C', 'B', 'D'])
    expect(read?.elements[1].x).toBe(100)
    expect(yParts(ydoc).elements.has(a.id)).toBe(false)
  })

  it('n’écrit que les propriétés modifiées', () => {
    const a = wall('A')
    const start = { ...planDocument(), elements: [a] }
    const ydoc = new Y.Doc()
    writeDocument(ydoc, start)
    const writes: string[] = []
    yParts(ydoc).elements.get(a.id)?.observe((event) => writes.push(...event.keysChanged))
    applyDocumentDiff(ydoc, start, { ...start, elements: [{ ...a, name: 'Façade' }] })
    expect(writes).toEqual(['name'])
  })

  it('une propriété devenue absente est supprimée', () => {
    const a = { ...wall('A'), material: 'brick' as const }
    const start = { ...planDocument(), elements: [a] }
    const ydoc = new Y.Doc()
    writeDocument(ydoc, start)
    const without = { ...a }
    delete (without as { material?: string }).material
    applyDocumentDiff(ydoc, start, { ...start, elements: [without] })
    expect(readDocument(ydoc)?.elements[0]).not.toHaveProperty('material')
  })

  it('modifie la page, les réglages du plan et les niveaux', () => {
    const start = planDocument()
    const ydoc = new Y.Doc()
    writeDocument(ydoc, start)
    const level = { ...start.levels![0], name: 'RDC' }
    const next: FabricsDocument = {
      ...start,
      page: { ...start.page, background: '#eeeeee' },
      plan: { ...start.plan!, northAngle: 90 },
      levels: [level, { id: 'n1', name: 'Étage', elevation: 2900, height: 2700, slabThickness: 200 }],
    }
    applyDocumentDiff(ydoc, start, next)
    expect(readDocument(ydoc)).toEqual(next)
  })

  it('garde un élément ajouté par une autre personne que l’éditeur ne connaît pas encore', () => {
    const a = wall('A')
    const b = wall('B')
    const start = { ...planDocument(), elements: [a, b] }
    const ydoc = new Y.Doc()
    writeDocument(ydoc, start)
    // Une autre personne ajoute X entre A et B.
    const x = wall('X')
    ydoc.transact(() => {
      const parts = yParts(ydoc)
      const entry = new Y.Map<unknown>()
      parts.elements.set(x.id, entry)
      for (const [key, value] of Object.entries(x)) entry.set(key, value)
      parts.order.insert(1, [x.id])
    })
    // L'éditeur, qui ne voit que A et B, ajoute C à la fin.
    const c = wall('C')
    applyDocumentDiff(ydoc, start, { ...start, elements: [a, b, c] })
    expect(ids(readDocument(ydoc))).toEqual(['A', 'X', 'B', 'C'])
  })

  it('ignore les doublons de l’ordre (deux premiers envois simultanés)', () => {
    const a = wall('A')
    const document = { ...planDocument(), elements: [a] }
    const one = new Y.Doc()
    const two = new Y.Doc()
    writeDocument(one, document)
    writeDocument(two, document)
    Y.applyUpdate(one, Y.encodeStateAsUpdate(two))
    expect(yParts(one).order.length).toBe(2)
    expect(ids(readDocument(one))).toEqual(['A'])
    // La prochaine modification nettoie le doublon.
    const b = wall('B')
    applyDocumentDiff(one, document, { ...document, elements: [a, b] })
    expect(yParts(one).order.toArray()).toEqual([a.id, b.id])
  })
})

describe('readDocument avec le document précédent', () => {
  it('réutilise les objets non modifiés', () => {
    const a = wall('A')
    const b = wall('B')
    const start = { ...planDocument(), elements: [a, b] }
    const ydoc = new Y.Doc()
    writeDocument(ydoc, start)
    const first = readDocument(ydoc)!
    yParts(ydoc).elements.get(b.id)?.set('x', 50)
    const second = readDocument(ydoc, first, new Set([b.id]))!
    expect(second.elements[0]).toBe(first.elements[0])
    expect(second.elements[1]).not.toBe(first.elements[1])
    expect(second.elements[1].x).toBe(50)
    expect(second.page).toBe(first.page)
    expect(second.levels).toBe(first.levels)
  })
})

describe('longestIncreasing', () => {
  it('trouve une plus longue suite croissante', () => {
    expect(longestIncreasing([])).toEqual([])
    expect(longestIncreasing([0, 1, 2])).toEqual([0, 1, 2])
    const values = [3, 0, 1, 2]
    expect(longestIncreasing(values).map((index) => values[index])).toEqual([0, 1, 2])
    const other = [2, 0, 3, 1, 4]
    expect(longestIncreasing(other)).toHaveLength(3)
  })
})

describe("marque d'enregistrement (lot F)", () => {
  it("est absente au départ, puis notée, et n'avance que vers le plus récent", () => {
    const ydoc = new Y.Doc()
    writeDocument(ydoc, planDocument())
    expect(readSavedAt(ydoc)).toBeNull()
    writeSavedAt(ydoc, '2026-11-15T10:00:00.000Z')
    writeSavedAt(ydoc, '2026-11-15T09:00:00.000Z')
    expect(readSavedAt(ydoc)).toBe('2026-11-15T10:00:00.000Z')
    writeSavedAt(ydoc, '2026-11-15T11:00:00.000Z')
    expect(readSavedAt(ydoc)).toBe('2026-11-15T11:00:00.000Z')
  })

  it('ne change pas le document lu', () => {
    const ydoc = new Y.Doc()
    const document = planDocument()
    writeDocument(ydoc, document)
    const before = readDocument(ydoc)
    writeSavedAt(ydoc, '2026-11-15T10:00:00.000Z')
    expect(readDocument(ydoc)).toEqual(before)
  })

  it("est reconnue comme seul changement d'une transaction", () => {
    const ydoc = new Y.Doc()
    writeDocument(ydoc, planDocument())
    const seen: boolean[] = []
    ydoc.on('afterTransaction', (transaction: Y.Transaction) => seen.push(isSavedAtOnly(ydoc, transaction)))
    writeSavedAt(ydoc, '2026-11-15T10:00:00.000Z')
    applyDocumentDiff(ydoc, planDocument(), { ...planDocument(), elements: [wall('A')] })
    expect(seen).toEqual([true, false])
  })
})

describe('isLaterThan', () => {
  it('compare des dates ISO', () => {
    expect(isLaterThan('2026-11-15T11:00:00Z', '2026-11-15T10:00:00Z')).toBe(true)
    expect(isLaterThan('2026-11-15T10:00:00Z', '2026-11-15T10:00:00Z')).toBe(false)
    expect(isLaterThan('2026-11-15T09:00:00Z', '2026-11-15T10:00:00Z')).toBe(false)
  })

  it("une date absente ou illisible n'est jamais plus récente", () => {
    expect(isLaterThan(null, '2026-11-15T10:00:00Z')).toBe(false)
    expect(isLaterThan('pas une date', '2026-11-15T10:00:00Z')).toBe(false)
    expect(isLaterThan('2026-11-15T10:00:00Z', null)).toBe(true)
  })
})
