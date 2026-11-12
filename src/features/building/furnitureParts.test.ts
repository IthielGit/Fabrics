import { describe, expect, it } from 'vitest'
import { createFurnitureElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { buildFurnitureParts, lookOf, shapeOf } from './furnitureParts'

const level = createLevel('Rez-de-chaussée', 0, 2700, 200)
const piece = (symbol: string, width: number, depth: number, rotation = 0) => ({
  ...createFurnitureElement('Objet', symbol, 1000, 2000, width, depth),
  rotation,
})
const top = (parts: { center: { y: number }; size: { y: number } }[]) =>
  Math.max(...parts.map((p) => p.center.y + p.size.y / 2))

describe('objets en 3D : aspect et forme', () => {
  it('donne un aspect selon le type d’objet', () => {
    expect(lookOf('sofa-3')).toBe('fabric')
    expect(lookOf('chair')).toBe('wood')
    expect(lookOf('washing-machine')).toBe('white')
    expect(lookOf('kitchen-island')).toBe('stone')
    expect(lookOf('plant-pot')).toBe('plant')
    expect(lookOf('car-suv')).toBe('carDark')
    expect(lookOf('swimming-pool')).toBe('water')
    expect(lookOf('quelque-chose')).toBe('neutral')
  })

  it('une table ronde est un cylindre, une table rectangulaire une boîte', () => {
    expect(shapeOf('table-round-6')).toBe('cylinder')
    expect(shapeOf('table-rect-6')).toBe('box')
  })

  it('un objet simple reste un seul volume de la hauteur du catalogue', () => {
    const parts = buildFurnitureParts(piece('bed-queen', 1600, 2000), level)
    expect(parts).toHaveLength(1)
    expect(parts[0]).toMatchObject({ look: 'fabric', shape: 'box', size: { x: 1600, y: 500, z: 2000 } })
  })
})

describe('objets en 3D : volumes composés', () => {
  it('un parasol n’est plus un bloc plein : un mât fin et une toile en cône', () => {
    const parts = buildFurnitureParts(piece('parasol', 3000, 3000), level)
    expect(parts.map((p) => p.shape)).toEqual(['cylinder', 'cone'])
    expect(parts[0].size.x).toBeLessThan(100)
    expect(top(parts)).toBe(2500)
  })

  it('une pergola a quatre poteaux et un toit mince, on voit dessous', () => {
    const parts = buildFurnitureParts(piece('pergola', 3000, 4000), level)
    expect(parts).toHaveLength(5)
    const roof = parts[4]
    expect(roof.size).toEqual({ x: 3000, y: 120, z: 4000 })
    expect(Math.min(...parts.slice(0, 4).map((p) => p.size.x))).toBeLessThan(200)
  })

  it('une piscine est un bassin d’eau bleu entouré d’une margelle', () => {
    const parts = buildFurnitureParts(piece('swimming-pool', 8000, 4000), level)
    expect(parts.filter((p) => p.look === 'water')).toHaveLength(1)
    expect(parts.filter((p) => p.look === 'stone')).toHaveLength(4)
    const water = parts.find((p) => p.look === 'water')!
    expect(water.size).toMatchObject({ x: 8000, z: 4000 })
    expect(water.center.y + water.size.y / 2).toBe(50)
  })

  it('une piscine ronde est un cylindre d’eau', () => {
    const parts = buildFurnitureParts(piece('swimming-pool-round', 4000, 4000), level)
    expect(parts).toMatchObject([{ look: 'water', shape: 'cylinder' }])
  })

  it('un arbre a un tronc et une couronne ronde', () => {
    const parts = buildFurnitureParts(piece('tree-medium', 5000, 5000), level)
    expect(parts.map((p) => [p.look, p.shape])).toEqual([
      ['wood', 'cylinder'],
      ['plant', 'sphere'],
    ])
    expect(top(parts)).toBe(6000)
  })

  it('une voiture a une caisse, un habitacle vitré et quatre roues', () => {
    const parts = buildFurnitureParts(piece('car-suv', 1950, 4700), level)
    expect(parts).toHaveLength(6)
    expect(parts.filter((p) => p.look === 'tire')).toHaveLength(4)
    expect(parts.some((p) => p.look === 'carGlass')).toBe(true)
    expect(top(parts)).toBeCloseTo(1700)
  })

  it('les volumes suivent la rotation de l’objet autour de son coin haut-gauche', () => {
    const upright = buildFurnitureParts(piece('car', 1800, 4500), level)
    const turned = buildFurnitureParts(piece('car', 1800, 4500, 90), level)
    // Le centre de la caisse tourne de 90° autour du coin (1000, 2000).
    expect(upright[0].center.x).toBeCloseTo(1000 + 900)
    expect(upright[0].center.z).toBeCloseTo(2000 + 2250)
    expect(turned[0].center.x).toBeCloseTo(1000 - 2250)
    expect(turned[0].center.z).toBeCloseTo(2000 + 900)
    expect(turned[0].rotationY).toBeCloseTo(-Math.PI / 2)
  })

  it('aucun volume pour une zone, un symbole conventionnel ou un objet inconnu', () => {
    expect(buildFurnitureParts(piece('rug-rect', 2000, 3000), level)).toEqual([])
    expect(buildFurnitureParts(piece('socket-single', 80, 80), level)).toEqual([])
    expect(buildFurnitureParts(piece('inconnu', 100, 100), level)).toEqual([])
  })
})
