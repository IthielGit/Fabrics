import { describe, expect, it } from 'vitest'
import { createFurnitureElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { buildFurniture } from './furniture'

const level = createLevel('Étage', 2850, 2700, 200)

describe('mobilier en 3D', () => {
  it('un lit 160 × 200 : boîte de 500 mm posée sur le plancher de son niveau', () => {
    const bed = createFurnitureElement('Lit', 'bed-queen', 1000, 2000, 1600, 2000)
    const piece = buildFurniture(bed, level)!
    expect(piece.size).toEqual({ x: 1600, y: 500, z: 2000 })
    expect(piece.center).toEqual({ x: 1800, y: 2850 + 250, z: 3000 })
    expect(piece.rotationY).toBeCloseTo(0)
  })

  it('un meuble haut est posé à sa hauteur de pose', () => {
    const wall = createFurnitureElement('Haut', 'kitchen-wall', 0, 0, 600, 350)
    const piece = buildFurniture(wall, level)!
    expect(piece.center.y).toBe(2850 + 1450 + 350)
    expect(piece.size.y).toBe(700)
  })

  it('une rotation de 90° garde le coin haut-gauche : le centre tourne autour de lui', () => {
    const bed = { ...createFurnitureElement('Lit', 'bed-queen', 1000, 2000, 1600, 2000), rotation: 90 }
    const piece = buildFurniture(bed, level)!
    expect(piece.center.x).toBeCloseTo(1000 - 1000)
    expect(piece.center.z).toBeCloseTo(2000 + 800)
    expect(piece.rotationY).toBeCloseTo(-Math.PI / 2)
  })

  it('pas de volume pour une zone, un symbole conventionnel ou un objet inconnu', () => {
    expect(buildFurniture(createFurnitureElement('Tapis', 'rug-rect', 0, 0, 2000, 3000), level)).toBeNull()
    expect(buildFurniture(createFurnitureElement('Prise', 'socket-single', 0, 0, 80, 80), level)).toBeNull()
    expect(buildFurniture(createFurnitureElement('?', 'inconnu', 0, 0, 100, 100), level)).toBeNull()
  })
})
