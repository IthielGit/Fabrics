import { describe, expect, it } from 'vitest'
import type { Level, RoofElement } from '../../types/document'
import { createRoofElement } from '../documents/elements'
import { areaOf, clipToConvex, clipToHalfPlane } from '../geometry/polygonClip'
import { habitableArea, MIN_HABITABLE_HEIGHT } from './habitableArea'

const M2 = 1_000_000
const RECT = [0, 0, 8000, 0, 8000, 6000, 0, 6000] // 48 m², grand côté en x
const SQUARE = (x: number, y: number, s: number) => [
  { x, y },
  { x: x + s, y },
  { x: x + s, y: y + s },
  { x, y: y + s },
]

// Combles : murs de 1000 mm, dalle de 200 mm → dessous du toit à 800 mm au droit des murs.
const ATTIC: Level = { id: 'L2', name: 'Combles', elevation: 2700, height: 1000, slabThickness: 200 }

function gable(pitch: number, overhang = 0): RoofElement {
  return { ...createRoofElement('Toit', RECT, 'gable'), pitch, overhang, levelId: 'L2' }
}

describe('découpe de polygones', () => {
  it('un carré coupé par un carré qui le recouvre à moitié', () => {
    const out = clipToConvex(SQUARE(0, 0, 10), SQUARE(5, 0, 10))
    expect(areaOf(out)).toBeCloseTo(50, 9)
  })

  it('un sujet non convexe (L) garde une aire juste', () => {
    const l = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 10 },
      { x: 0, y: 10 },
    ] // 10 × 4 + 4 × 6 = 64
    expect(areaOf(clipToConvex(l, SQUARE(0, 0, 10)))).toBeCloseTo(64, 9)
    expect(areaOf(clipToConvex(l, SQUARE(0, 0, 5)))).toBeCloseTo(24, 9) // 5 × 4 + 4 × 1
  })

  it('aucune intersection : liste vide', () => {
    expect(clipToConvex(SQUARE(0, 0, 4), SQUARE(10, 10, 4))).toEqual([])
  })

  it('demi-plan : garde la part où a·x + b·y + c < 0', () => {
    const half = clipToHalfPlane(SQUARE(0, 0, 10), 1, 0, -3) // x < 3
    expect(areaOf(half)).toBeCloseTo(30, 9)
    expect(clipToHalfPlane(SQUARE(0, 0, 10), 1, 0, 1)).toEqual([]) // x < -1 : rien
    expect(areaOf(clipToHalfPlane(SQUARE(0, 0, 10), 1, 0, -20))).toBeCloseTo(100, 9) // tout
  })
})

describe('surface habitable', () => {
  it('la hauteur minimale est de 1800 mm', () => {
    expect(MIN_HABITABLE_HEIGHT).toBe(1800)
  })

  it('toit à deux pans à 45° : on retire deux bandes de 1000 mm le long des murs bas', () => {
    // Dessous du versant = 800 + d (d = distance au mur bas) : sous 1800 mm quand d < 1000 mm.
    // Bandes : 2 × 8000 × 1000 = 16 m² retirés sur 48 m².
    const value = habitableArea(RECT, 48 * M2, ATTIC, [gable(45)], 800)
    expect(value / M2).toBeCloseTo(32, 4)
  })

  it('pente plus raide : la zone basse est plus étroite', () => {
    // À 60° : tan = 1,732 ; 800 + d·1,732 < 1800 ⇔ d < 577,35 mm : 2 × 8000 × 577,35 mm².
    const value = habitableArea(RECT, 48 * M2, ATTIC, [gable(60)], 800)
    const low = 2 * 8000 * (1000 / Math.tan((60 * Math.PI) / 180))
    expect(value).toBeCloseTo(48 * M2 - low, -1)
  })

  it('pente très douce : toute la pièce est trop basse', () => {
    // À 5°, la hauteur sous le faîtage reste sous 1800 mm (800 + 3000 × tan 5° ≈ 1062 mm).
    expect(habitableArea(RECT, 48 * M2, ATTIC, [gable(5)], 800)).toBeCloseTo(0, 3)
  })

  it('une pièce qui ne couvre que le milieu du comble n’a rien à retirer', () => {
    const middle = [2000, 1500, 6000, 1500, 6000, 4500, 2000, 4500] // d ≥ 1500 mm : dessous ≥ 2300 mm
    expect(habitableArea(middle, 12 * M2, ATTIC, [gable(45)], 800)).toBeCloseTo(12 * M2, 4)
  })

  it('une pièce sur une partie basse seulement : on retire la part trop basse', () => {
    // Bande de 0 à 2000 mm de profondeur (en y), 8000 de long : 16 m² dont 8 m² sous 1800 mm.
    const strip = [0, 0, 8000, 0, 8000, 2000, 0, 2000]
    expect(habitableArea(strip, 16 * M2, ATTIC, [gable(45)], 800) / M2).toBeCloseTo(8, 4)
  })

  it('la trémie déjà retirée de la surface nette reste retirée', () => {
    const value = habitableArea(RECT, 40 * M2, ATTIC, [gable(45)], 800) // 8 m² de trémie, ailleurs
    expect(value / M2).toBeCloseTo(24, 4)
  })

  it('sans toiture : entière, sauf si la hauteur sous plafond est sous le minimum', () => {
    const level: Level = { id: 'L1', name: 'RDC', elevation: 0, height: 2700, slabThickness: 200 }
    expect(habitableArea(RECT, 48 * M2, level, [], 2500)).toBe(48 * M2)
    expect(habitableArea(RECT, 48 * M2, level, [], 1700)).toBe(0)
    expect(habitableArea(RECT, 48 * M2, level, [], null)).toBe(48 * M2)
    expect(habitableArea(RECT, 48 * M2, undefined, [], null)).toBe(48 * M2)
  })

  it('toit plat sur un étage normal : rien à retirer', () => {
    const level: Level = { id: 'L1', name: 'RDC', elevation: 0, height: 2700, slabThickness: 200 }
    const flat = { ...createRoofElement('Toit plat', RECT, 'flat'), levelId: 'L1' }
    expect(habitableArea(RECT, 48 * M2, level, [flat], 2500)).toBe(48 * M2)
  })

  it('la surface habitable ne dépasse jamais la surface nette ni ne devient négative', () => {
    const value = habitableArea(RECT, 10 * M2, ATTIC, [gable(45)], 800)
    expect(value).toBeLessThanOrEqual(10 * M2)
    expect(value).toBeGreaterThanOrEqual(0)
  })
})
