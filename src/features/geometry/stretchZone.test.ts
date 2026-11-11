import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { createFurnitureElement, createOpeningElement, createRoomElement, createWallElement } from '../documents/elements'
import { elementBounds } from '../export/bounds'
import { openingGeometry } from './openings'
import { polygonArea } from './polygon'
import { constrainStretch, pointInZone, stretchZone } from './stretchZone'

// Pièce de 4000 × 3000 mm (face intérieure) ; l'axe des murs est 100 mm plus loin (murs de 200).
const wall = createWallElement('Mur', [-100, -100, 4100, -100, 4100, 3100, -100, 3100, -100, -100], 200, 2700)
const room = createRoomElement('Pièce', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
// Côté est : segment 1 (de haut en bas) ; côté sud : segment 2 (de droite à gauche).
const windowEast = createOpeningElement('window', 'Fenêtre', { wallId: wall.id, segmentIndex: 1, offset: 1600, side: 'left' })
const doorSouth = createOpeningElement('door', 'Porte', { wallId: wall.id, segmentIndex: 2, offset: 1000, side: 'left' })
const plan: CanvasElement[] = [wall, room, windowEast, doorSouth]

// Zone qui entoure tout le mur est (et le bord est de la pièce), avec de la marge.
const eastZone = { x: 3500, y: -500, width: 1000, height: 4000 }

const byId = (result: { elements: CanvasElement[] }, id: string) => result.elements.find((el) => el.id === id)

describe('constrainStretch', () => {
  it('le mur est entouré : les murs nord et sud traversent la zone, donc pas de déplacement vertical', () => {
    const { delta, blockedByDiagonal } = constrainStretch(plan, eastZone, { x: 1000, y: 700 })
    expect(delta).toEqual({ x: 1000, y: 0 })
    expect(blockedByDiagonal).toBe(false)
  })

  it('arrondit au mm', () => {
    expect(constrainStretch(plan, eastZone, { x: 1000.4, y: 0 }).delta).toEqual({ x: 1000, y: 0 })
  })

  it('un côté en biais qui traverse la zone bloque tout', () => {
    const triangle = createRoomElement('Triangle', [0, 0, 4000, 0, 0, 3000])
    const result = constrainStretch([triangle], { x: 3500, y: -500, width: 1000, height: 1000 }, { x: 500, y: 0 })
    expect(result.blockedByDiagonal).toBe(true)
    expect(result.delta).toEqual({ x: 0, y: 0 })
  })

  it('une zone sans bord à traverser ne contraint rien', () => {
    const all = { x: -1000, y: -1000, width: 10000, height: 10000 }
    expect(constrainStretch(plan, all, { x: 300, y: 200 }).delta).toEqual({ x: 300, y: 200 })
  })

  it('ignore les éléments verrouillés', () => {
    const locked = plan.map((el) => ({ ...el, locked: true }))
    expect(constrainStretch(locked, eastZone, { x: 1000, y: 700 }).delta).toEqual({ x: 1000, y: 700 })
  })
})

describe('pointInZone', () => {
  it('bords compris', () => {
    expect(pointInZone({ x: 3500, y: 0 }, eastZone)).toBe(true)
    expect(pointInZone({ x: 3499, y: 0 }, eastZone)).toBe(false)
  })
})

describe('étirer par zone', () => {
  const result = stretchZone(plan, eastZone, { x: 1000, y: 0 })!

  it('le mur est se déplace, les murs nord et sud s’allongent', () => {
    const moved = byId(result, wall.id) as WallElement
    expect(moved.points).toEqual([-100, -100, 5100, -100, 5100, 3100, -100, 3100, -100, -100])
    expect(moved.thickness).toBe(wall.thickness)
  })

  it('la pièce suit : 5000 × 3000 mm', () => {
    const moved = byId(result, room.id) as RoomElement
    expect(polygonArea(moved.points)).toBeCloseTo(5000 * 3000)
  })

  it('une ouverture du mur déplacé suit son mur', () => {
    const moved = byId(result, windowEast.id)
    // Début du segment est passé de (4100, -100) à (5100, -100) : même position le long du mur.
    expect(moved).toBeUndefined()
    const newWall = byId(result, wall.id) as WallElement
    const center = openingGeometry(windowEast, newWall)!.center
    expect(center.x).toBeCloseTo(5100)
    expect(center.y).toBeCloseTo(1500)
  })

  it('une ouverture du mur sud, hors zone, garde sa place réelle', () => {
    const moved = byId(result, doorSouth.id) as OpeningElement
    const newWall = byId(result, wall.id) as WallElement
    const center = openingGeometry(moved, newWall)!.center
    expect(center.x).toBeCloseTo(3100) // 4100 − 1000, comme avant
    expect(center.y).toBeCloseTo(3100)
    expect(moved.width).toBe(doorSouth.width)
    // Le segment sud commence maintenant à x = 5100 : la porte est 1000 mm plus loin du début.
    expect(moved.offset).toBe(2000)
    expect(result.removedIds).toEqual([])
  })

  it('un déplacement nul ne change rien', () => {
    expect(stretchZone(plan, eastZone, { x: 0, y: 0 })).toBeNull()
  })

  it('une zone sans sommet ne change rien', () => {
    expect(stretchZone(plan, { x: 1000, y: 1000, width: 500, height: 500 }, { x: 500, y: 0 })).toBeNull()
  })

  it('raccourcir : une ouverture qui ne tient plus est retirée', () => {
    const bay = createOpeningElement('bay', 'Baie', { wallId: wall.id, segmentIndex: 2, offset: 1000, side: 'left' })
    const short = stretchZone([wall, room, bay], eastZone, { x: -3800, y: 0 })!
    // Le côté sud ne mesure plus que 400 mm : la baie (largeur par défaut) n'y tient pas.
    expect(short.removedIds).toEqual([bay.id])
  })

  it('n’emmène pas ce qui est verrouillé', () => {
    const locked = [wall, { ...room, locked: true }, windowEast, doorSouth]
    const redone = stretchZone(locked, eastZone, { x: 1000, y: 0 })!
    expect(redone.elements.some((el) => el.id === room.id)).toBe(false)
  })
})

describe('objets posés', () => {
  const inside = createFurnitureElement('Lit', 'bed-queen', 3000, 500, 1600, 2000) // centre x = 3800
  const outside = createFurnitureElement('Lit', 'bed-queen', 200, 500, 1600, 2000) // centre x = 1000

  it('l’objet dans la zone bouge, taille inchangée ; l’autre reste', () => {
    const result = stretchZone([wall, room, inside, outside], eastZone, { x: 1000, y: 0 })!
    const moved = byId(result, inside.id)!
    expect(elementBounds(moved)!.x).toBe(4000)
    expect(elementBounds(moved)!.width).toBe(1600)
    expect(byId(result, outside.id)).toBeUndefined()
  })
})
