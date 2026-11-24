import { describe, expect, it } from 'vitest'
import type { FabricsDocument, OpeningElement, WallElement } from '../../../types/document'
import { createLargeHouseProject } from '../../documents/createProject'
import { createOpeningElement } from '../../documents/elements'
import { settleScene } from '../../scene/settle'
import { fabricsToScene } from '../../scene/migrate/fromFabrics'
import { sceneToFabricsView } from '../../scene/view/toFabricsView'
import { initialQuantities, updateQuantities } from './incremental'
import { computeQuantities } from './quantitySet'
import type { Quantity } from './status'

const scene = settleScene(fabricsToScene(createLargeHouseProject(new Date('2026-11-17T00:00:00Z')).document).scene)
const base = sceneToFabricsView(scene)

/** Ce qui compte d'une quantité : valeur, statut, trace (sans l'identité de l'objet). */
const view = (list: readonly Quantity[]) =>
  new Map(list.map((q) => [q.key, { value: q.value, status: q.status, reason: q.statusReason, trace: q.trace, rule: q.rule }]))

/** Le recalcul ciblé donne exactement le même quantitatif qu'un recalcul complet. */
function expectSameAsFull(doc: FabricsDocument) {
  const cache = initialQuantities(base, scene)
  const update = updateQuantities(cache, doc, scene)
  const full = computeQuantities({ document: doc, scene })
  expect(view(update.cache.set.geometric)).toEqual(view(full.geometric))
  expect(view(update.cache.set.takeoff)).toEqual(view(full.takeoff))
  expect(update.cache.set.summary).toEqual(full.summary)
  return { cache, update }
}

const walls = base.elements.filter((el): el is WallElement => el.type === 'wall')
const levelIds = [...new Set(walls.map((w) => w.levelId))]
const wall = walls.find((w) => w.levelId === levelIds[0])!

describe('recalcul ciblé du quantitatif (M21, 21.5)', () => {
  it('rien ne change : rien n’est recalculé, tout est repris', () => {
    const cache = initialQuantities(base, scene)
    const update = updateQuantities(cache, base, scene)
    expect(update.recomputed).toEqual(new Set())
    expect(update.recomputedLevels).toEqual(new Set())
    update.cache.set.takeoff
      .filter((q) => q.category !== 'slab' && q.category !== 'other')
      .forEach((q, i) => expect(q).toBe(cache.set.takeoff.filter((p) => p.category !== 'slab' && p.category !== 'other')[i]))
  })

  it('un mur allongé de 500 mm : seuls ce mur, ses voisins, ses ouvertures et les pièces de son niveau', () => {
    const points = [...wall.points]
    points[points.length - 2] += 500
    const doc = { ...base, elements: base.elements.map((el) => (el.id === wall.id ? { ...wall, points } : el)) }
    const { cache, update } = expectSameAsFull(doc)
    expect(update.recomputed!.has(wall.id)).toBe(true)
    // Les murs des autres niveaux ne sont pas recalculés, et leurs quantités sont les mêmes objets.
    const otherLevelWall = walls.find((w) => w.levelId !== wall.levelId)
    if (otherLevelWall) {
      expect(update.recomputed!.has(otherLevelWall.id)).toBe(false)
      const before = cache.set.takeoff.find((q) => q.elementIds[0] === otherLevelWall.id)
      const after = update.cache.set.takeoff.find((q) => q.elementIds[0] === otherLevelWall.id)
      expect(after).toBe(before)
    }
    expect(update.recomputed!.size).toBeLessThan(base.elements.length)
    expect(update.recomputedLevels).toEqual(new Set([wall.levelId]))
  })

  it('une fenêtre ajoutée : le mur et les pièces du niveau, mêmes résultats qu’un calcul complet', () => {
    const window: OpeningElement = {
      ...createOpeningElement('window', 'Fenêtre test', { wallId: wall.id, segmentIndex: 0, offset: 600, side: 'left' }),
      levelId: wall.levelId,
      width: 600,
      height: 600,
      sillHeight: 1200,
    }
    const { update } = expectSameAsFull({ ...base, elements: [...base.elements, window] })
    expect(update.recomputed!.has(window.id)).toBe(true)
    expect(update.recomputed!.has(wall.id)).toBe(true)
  })

  it('un mur supprimé : ses ouvertures disparaissent aussi du quantitatif', () => {
    const doc = { ...base, elements: base.elements.filter((el) => el.id !== wall.id && !(el.type === 'opening' && el.wallId === wall.id)) }
    const { update } = expectSameAsFull(doc)
    expect(update.cache.set.takeoff.some((q) => q.elementIds[0] === wall.id)).toBe(false)
  })

  it('une pièce renommée : la pièce et ses ouvertures (dont le nom affiché suit), pas le reste', () => {
    const room = base.elements.find((el) => el.type === 'room')!
    const doc = { ...base, elements: base.elements.map((el) => (el.id === room.id ? { ...room, name: 'Pièce renommée' } : el)) }
    const { update } = expectSameAsFull(doc)
    expect(update.recomputed!.has(room.id)).toBe(true)
    expect(update.recomputed!.size).toBeLessThan(base.elements.length / 2)
    expect(update.recomputedLevels).toEqual(new Set([room.levelId]))
  })

  it('hauteur d’un niveau changée : recalcul complet', () => {
    const levels = (base.levels ?? []).map((level, i) => (i === 0 ? { ...level, height: level.height + 100 } : level))
    const { update } = expectSameAsFull({ ...base, levels })
    expect(update.recomputed).toBeNull()
  })

  it('seuil de maçonnerie changé : recalcul complet', () => {
    const { update } = expectSameAsFull({ ...base, plan: { ...base.plan!, takeoff: { thresholds: { masonry: 2_000_000 } } } })
    expect(update.recomputed).toBeNull()
  })

  it('suite de modifications : le cache reste juste à chaque étape', () => {
    let cache = initialQuantities(base, scene)
    let doc: FabricsDocument = base
    for (const delta of [200, -300, 1000]) {
      const current = doc.elements.find((el) => el.id === wall.id) as WallElement
      const points = [...current.points]
      points[points.length - 1] += delta
      doc = { ...doc, elements: doc.elements.map((el) => (el.id === wall.id ? { ...current, points } : el)) }
      cache = updateQuantities(cache, doc, scene).cache
      expect(view(cache.set.takeoff)).toEqual(view(computeQuantities({ document: doc, scene }).takeoff))
    }
  })
})
