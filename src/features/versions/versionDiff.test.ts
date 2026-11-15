import { describe, expect, it } from 'vitest'
import { createPlanProject } from '../documents/createProject'
import { createWallElement } from '../documents/elements'
import type { CanvasElement, FabricsDocument } from '../../types/document'
import { countChanges, diffVersions, sameJson } from './versionDiff'

function wall(name: string): CanvasElement {
  return createWallElement(name, [0, 0, 3500, 0], 200, 2700)
}

function documentWith(elements: CanvasElement[]): FabricsDocument {
  return { ...createPlanProject('Essai').document, elements }
}

describe('diffVersions', () => {
  it('repère les éléments ajoutés, modifiés et supprimés', () => {
    const a = wall('A')
    const b = wall('B')
    const c = wall('C')
    const before = documentWith([a, b])
    const after = documentWith([{ ...a, x: 500 }, c])
    const changes = diffVersions(before, after)
    expect([...changes.added]).toEqual([c.id])
    expect([...changes.modified]).toEqual([a.id])
    expect(changes.removed.map((el) => el.id)).toEqual([b.id])
    expect(countChanges(changes)).toEqual({ added: 1, modified: 1, removed: 1 })
  })

  it('un élément identique n’est pas marqué, même si ses clés sont dans un autre ordre', () => {
    const a = wall('A')
    const reordered = Object.fromEntries(Object.entries(a).reverse()) as unknown as CanvasElement
    const changes = diffVersions(documentWith([a]), documentWith([reordered]))
    expect(countChanges(changes)).toEqual({ added: 0, modified: 0, removed: 0 })
  })

  it('sans version précédente, rien n’est marqué', () => {
    expect(countChanges(diffVersions(null, documentWith([wall('A')])))).toEqual({ added: 0, modified: 0, removed: 0 })
  })
})

describe('sameJson', () => {
  it('compare listes et objets imbriqués', () => {
    expect(sameJson({ points: [0, 1], a: { b: 1 } }, { a: { b: 1 }, points: [0, 1] })).toBe(true)
    expect(sameJson({ points: [0, 1] }, { points: [1, 0] })).toBe(false)
    expect(sameJson([1], { 0: 1 })).toBe(false)
  })

  it('une clé absente vaut une clé non définie', () => {
    expect(sameJson({ a: 1, b: undefined }, { a: 1 })).toBe(true)
  })
})
