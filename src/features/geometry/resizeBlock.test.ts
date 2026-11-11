import { beforeEach, describe, expect, it } from 'vitest'
import { getPlaceable } from '../library/catalog/prefabs'
import { elementsForPrefab } from '../library/placeSet'
import { useEditorStore } from '../../stores/editorStore'
import type { FurnitureElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { createPlanProject } from '../documents/createProject'
import { createFurnitureElement, createOpeningElement, createRoomElement, createWallElement } from '../documents/elements'
import { elementBounds } from '../export/bounds'
import { polygonArea } from './polygon'
import { blockReference, resizeBlock } from './resizeBlock'
import { openingGeometry } from './openings'

const names = {
  nameOf: (symbol: string) => symbol,
  roomName: 'Chambre',
  wallName: 'Mur 1',
  openingName: (kind: OpeningElement['kind']) => kind,
}

/** Chambre préfabriquée de 3500 × 3200 mm posée en (0, 0). */
const bedroom = () => elementsForPrefab(getPlaceable('prefab-bedroom')!, { x: 0, y: 0 }, 2700, names)

const byType = <T extends { type: string }>(elements: readonly { type: string }[], type: string) =>
  elements.filter((el) => el.type === type) as unknown as T[]

describe('rectangle de référence', () => {
  it('l’emprise de la pièce (face intérieure) quand il y en a une', () => {
    expect(blockReference(bedroom())).toMatchObject({ x: 0, y: 0, width: 3500, height: 3200 })
  })

  it('sans pièce : l’axe des murs', () => {
    const wall = createWallElement('M', [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0], 200, 2700)
    expect(blockReference([wall])).toMatchObject({ width: 4000, height: 3000 })
  })

  it('rien à redimensionner sans mur ni pièce', () => {
    expect(blockReference([createFurnitureElement('L', 'bed-queen', 0, 0, 1600, 2000)])).toBeNull()
  })
})

describe('redimensionner une pièce préfabriquée en bloc', () => {
  const before = bedroom()
  const result = resizeBlock(before, before, { width: 5000, depth: 4000 })!
  const after = new Map(result.elements.map((el) => [el.id, el]))

  it('le sol et le mur s’étirent ; le mur garde son épaisseur', () => {
    const room = byType<RoomElement>(before, 'room')[0]
    const wall = byType<WallElement>(before, 'wall')[0]
    expect(polygonArea((after.get(room.id) as RoomElement).points)).toBeCloseTo(5000 * 4000)
    const newWall = after.get(wall.id) as WallElement
    // Axe : face intérieure + une demi-épaisseur de chaque côté.
    expect(newWall.points).toEqual([-100, -100, 5100, -100, 5100, 4100, -100, 4100, -100, -100])
    expect(newWall.thickness).toBe(wall.thickness)
  })

  it('les ouvertures gardent leur taille et leur mur', () => {
    const openings = byType<OpeningElement>(before, 'opening')
    expect(result.removedIds).toEqual([])
    for (const opening of openings) {
      const moved = after.get(opening.id) as OpeningElement
      expect([moved.width, moved.height, moved.sillHeight]).toEqual([opening.width, opening.height, opening.sillHeight])
      expect(moved.wallId).toBe(opening.wallId)
      expect(moved.segmentIndex).toBe(opening.segmentIndex)
    }
  })

  it('une ouverture garde sa place en proportion le long du mur', () => {
    const door = byType<OpeningElement>(before, 'opening').find((o) => o.kind === 'door')!
    const wall = after.get(byType<WallElement>(before, 'wall')[0].id) as WallElement
    const moved = after.get(door.id) as OpeningElement
    // Porte en bas, à x = 2400 sur 3500 → 2400 × 5000 / 3500 ≈ 3429 sur 5000.
    const center = openingGeometry(moved, wall)!.center
    expect(center.x).toBeCloseTo((2400 * 5000) / 3500, -1)
    expect(center.y).toBeCloseTo(4100)
  })

  it('les meubles gardent leur taille', () => {
    for (const el of byType<FurnitureElement>(before, 'furniture')) {
      const moved = after.get(el.id) as FurnitureElement
      expect([moved.width, moved.depth, moved.rotation]).toEqual([el.width, el.depth, el.rotation])
    }
  })

  it('un meuble contre un mur reste contre ce mur (le lit contre le mur du haut)', () => {
    const bed = byType<FurnitureElement>(before, 'furniture').find((f) => f.symbol === 'bed-queen')!
    const moved = after.get(bed.id) as FurnitureElement
    expect(elementBounds(moved)!.y).toBe(0) // toujours collé en haut
    // Au milieu en largeur : son centre garde sa place en proportion (50 %).
    expect(elementBounds(moved)!.x + 800).toBeCloseTo(2500, -1)
  })

  it('un meuble dans un angle reste dans l’angle (l’armoire en bas à gauche)', () => {
    const wardrobe = byType<FurnitureElement>(before, 'furniture').find((f) => f.symbol === 'wardrobe-2')!
    const box = elementBounds(after.get(wardrobe.id) as FurnitureElement)!
    expect(box.x).toBe(0)
    expect(box.y + box.height).toBe(4000 - 100) // même distance (100 mm) du mur du bas qu'avant
  })

  it('tout le mobilier reste dans la pièce', () => {
    for (const el of byType<FurnitureElement>(before, 'furniture')) {
      const box = elementBounds(after.get(el.id) as FurnitureElement)!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(5000)
      expect(box.y + box.height).toBeLessThanOrEqual(4000)
    }
  })

  it('rétrécir : le mobilier garde sa taille, poussé contre le mur si la pièce est trop petite', () => {
    const smaller = resizeBlock(before, before, { width: 2000, depth: 2500 })!
    const bed = byType<FurnitureElement>(before, 'furniture').find((f) => f.symbol === 'bed-queen')!
    const moved = smaller.elements.find((el) => el.id === bed.id) as FurnitureElement
    const box = elementBounds(moved)!
    expect([box.width, box.height]).toEqual([1600, 2000])
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(2000)
  })

  it('une ouverture qui ne tient plus sur son mur raccourci est retirée', () => {
    const wall = createWallElement('M', [-100, -100, 4100, -100, 4100, 3100, -100, 3100, -100, -100], 200, 2700)
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    const wide = createOpeningElement('bay', 'Baie', { wallId: wall.id, segmentIndex: 1, offset: 1500, side: 'left' })
    const result = resizeBlock([wall, room], [wall, room, wide], { width: 4000, depth: 1000 })!
    // Le côté droit passe de 3000 à 1000 mm : une baie de 2400 mm n'y tient plus.
    expect(result.removedIds).toEqual([wide.id])
  })

  it('refuse une taille trop petite', () => {
    expect(resizeBlock(before, before, { width: 100, depth: 4000 })).toBeNull()
  })

  it('n’emmène pas ce qui est verrouillé', () => {
    const locked = before.map((el) => (el.type === 'room' ? { ...el, locked: true } : el))
    const redone = resizeBlock(locked, locked, { width: 5000, depth: 4000 })!
    expect(redone.elements.some((el) => el.type === 'room')).toBe(false)
  })
})

describe('dans l’éditeur', () => {
  const store = () => useEditorStore.getState()

  beforeEach(() => {
    store().loadProject(createPlanProject('Maison'))
  })

  it('un seul pas d’historique, annulable ; les ouvertures restent sur le mur', () => {
    store().addElements(bedroom())
    const original = structuredClone(store().project!.document.elements)
    const historyBefore = store().history.past.length
    expect(store().resizeSelectionBlock(5000, 4000)).toBe(0)
    expect(store().history.past.length).toBe(historyBefore + 1)

    const resized = store().project!.document.elements
    const room = resized.find((el): el is RoomElement => el.type === 'room')!
    expect(polygonArea(room.points)).toBeCloseTo(5000 * 4000)
    // Les 2 ouvertures sont toujours là, à leur taille, sur le mur agrandi.
    const openings = resized.filter((el): el is OpeningElement => el.type === 'opening')
    expect(openings).toHaveLength(2)
    expect(openings.map((o) => o.width).sort()).toEqual(
      (original.filter((el): el is OpeningElement => el.type === 'opening')).map((o) => o.width).sort(),
    )

    store().undo()
    expect(store().project!.document.elements).toEqual(original)
  })

  it('sans mur ni pièce dans la sélection : rien ne se passe', () => {
    store().addElement(createFurnitureElement('L', 'bed-queen', 0, 0, 1600, 2000))
    expect(store().resizeSelectionBlock(5000, 4000)).toBeNull()
    expect(store().history.past).toHaveLength(1)
  })
})
