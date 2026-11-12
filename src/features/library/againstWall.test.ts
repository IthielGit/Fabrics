import { describe, expect, it } from 'vitest'
import { createWallElement } from '../documents/elements'
import { SYMBOLS } from './catalog'
import { collectWallSides, isWallBacked, placeAgainstWall } from './againstWall'

const horizontal = collectWallSides([createWallElement('', [0, 0, 5000, 0], 200, 2500)])
const WC = { width: 400, depth: 700 }

describe('pose contre un mur', () => {
  it('sous un mur horizontal : dos au mur, face avant vers le bas, rotation 0', () => {
    const result = placeAgainstWall(WC, { x: 2000, y: 480 }, horizontal, 300)!
    // Face basse du mur à y = 100 ; l'objet de 700 de profondeur va de 100 à 800.
    expect(result).toEqual({ x: 1800, y: 100, rotation: 0 })
  })

  it('au-dessus du mur : l’objet se retourne (180°) et reste collé', () => {
    const result = placeAgainstWall(WC, { x: 2000, y: -480 }, horizontal, 300)!
    expect(result.rotation).toBe(180)
    // Tourné de 180° autour de son coin haut-gauche : le coin est de l'autre côté de la boîte.
    expect(result.x).toBe(2200)
    expect(result.y).toBe(-100)
  })

  it('contre un mur vertical, à droite : rotation 270°', () => {
    const vertical = collectWallSides([createWallElement('', [0, 0, 0, 3000], 200, 2500)])
    const result = placeAgainstWall(WC, { x: 500, y: 1500 }, vertical, 300)!
    expect(result.rotation).toBe(270)
  })

  it('à gauche d’un mur vertical : rotation 90°', () => {
    const vertical = collectWallSides([createWallElement('', [0, 0, 0, 3000], 200, 2500)])
    expect(placeAgainstWall(WC, { x: -500, y: 1500 }, vertical, 300)!.rotation).toBe(90)
  })

  it('trop loin d’un mur : rien', () => {
    expect(placeAgainstWall(WC, { x: 2000, y: 1500 }, horizontal, 300)).toBeNull()
    expect(placeAgainstWall(WC, { x: 2000, y: 480 }, [], 300)).toBeNull()
  })

  it('ne dépasse pas du bout du mur', () => {
    const result = placeAgainstWall(WC, { x: 5100, y: 480 }, horizontal, 300)!
    expect(result.x + WC.width).toBe(5000)
  })

  it('choisit le mur le plus proche', () => {
    const walls = collectWallSides([
      createWallElement('', [0, 0, 5000, 0], 200, 2500),
      createWallElement('', [0, 1200, 5000, 1200], 200, 2500),
    ])
    expect(placeAgainstWall(WC, { x: 2000, y: 500 }, walls, 400)!.y).toBe(100)
    expect(placeAgainstWall(WC, { x: 2000, y: 1000 }, walls, 400)!.rotation).toBe(180)
  })
})

describe('objets muraux', () => {
  it('les sanitaires, radiateurs et éléments de cuisine sont muraux ; les tables et lits non', () => {
    for (const id of ['wc', 'washbasin', 'radiator-panel', 'kitchen-base', 'kitchen-wall', 'wardrobe-2', 'fridge']) {
      expect(isWallBacked(id), id).toBe(true)
    }
    for (const id of ['table-rect-4', 'bed-double', 'sofa-3', 'chair', 'coffee-table', 'rug-rect']) {
      expect(isWallBacked(id), id).toBe(false)
    }
  })

  it('tout ce qui est fixé en hauteur au catalogue est mural, sauf les luminaires et symboles conventionnels', () => {
    const exceptions = new Set(['ac-cassette', 'vmc-unit', 'hood-island', 'parasol', 'pergola', 'gazebo', 'carport'])
    const loose = SYMBOLS.filter(
      (s) => s.elevation !== undefined && !s.nominal && !s.zone && s.category !== 'electrical' && !isWallBacked(s.id),
    ).map((s) => s.id)
    expect(loose.filter((id) => !exceptions.has(id))).toEqual([])
  })
})
