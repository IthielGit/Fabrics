import { describe, expect, it } from 'vitest'
import { fr } from '../../i18n/fr'
import { createPlatformElement, createRoomElement } from '../documents/elements'
import { elementBounds } from '../export/bounds'
import { moveVertex, translateElement } from '../geometry/transform'
import { formatVolume, mm3ToM3 } from '../units/format'
import { measurementsToCsv } from './csv'
import { computeBuildingMeasurements, computeMeasurements } from './measurements'

const RECT = [0, 0, 4000, 0, 4000, 3000, 0, 3000]
const LEVEL = { id: 'n0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 }

describe('plateforme : création', () => {
  it('l’épaisseur par défaut est la hauteur du dessus (estrade pleine)', () => {
    const platform = createPlatformElement('Plateforme 1', RECT)
    expect(platform.elevation).toBe(450)
    expect(platform.thickness).toBe(450)
    expect(createPlatformElement('P', RECT, 300).thickness).toBe(300)
  })
})

describe('plateforme : géométrie', () => {
  const platform = createPlatformElement('Plateforme 1', RECT)

  it('se déplace par ses points (x et y restent à 0)', () => {
    const moved = translateElement(platform, 100, -200)
    expect(moved.type).toBe('platform')
    if (moved.type !== 'platform') return
    expect(moved.points).toEqual([100, -200, 4100, -200, 4100, 2800, 100, 2800])
    expect([moved.x, moved.y]).toEqual([0, 0])
  })

  it('un sommet se déplace comme celui d’une pièce', () => {
    const moved = moveVertex(platform, 2, { x: 5000, y: 3500 })
    expect(moved.type === 'platform' && moved.points.slice(4, 6)).toEqual([5000, 3500])
  })

  it('son emprise est celle de son contour', () => {
    expect(elementBounds(platform)).toEqual({ x: 0, y: 0, width: 4000, height: 3000 })
  })
})

describe('plateforme : métrés', () => {
  it('4000 × 3000 mm, dessus à 450 mm : 12,00 m² et 5,40 m³', () => {
    const platform = createPlatformElement('Plateforme 1', RECT)
    const measures = computeMeasurements([platform])
    expect(measures.platforms).toHaveLength(1)
    expect(measures.platforms[0].area).toBeCloseTo(12e6)
    expect(mm3ToM3(measures.platforms[0].volume)).toBeCloseTo(5.4)
    expect(formatVolume(measures.platforms[0].volume)).toBe('5,40 m³')
    expect(measures.totals.platformArea).toBeCloseTo(12e6)
    expect(mm3ToM3(measures.totals.platformVolume)).toBeCloseTo(5.4)
  })

  it('le volume suit l’épaisseur : une dalle de 150 mm sous un dessus à 450 mm', () => {
    const platform = { ...createPlatformElement('P', RECT), thickness: 150 }
    expect(mm3ToM3(computeMeasurements([platform]).platforms[0].volume)).toBeCloseTo(1.8)
  })

  it('une plateforme n’est pas une pièce : elle n’entre pas dans la surface des pièces', () => {
    const room = createRoomElement('Pièce', RECT)
    const measures = computeMeasurements([room, createPlatformElement('P', RECT)])
    expect(measures.totals.roomArea).toBeCloseTo(12e6)
    expect(measures.rooms).toHaveLength(1)
  })

  it('les totaux du bâtiment sont la somme des niveaux', () => {
    const upper = { ...LEVEL, id: 'n1', name: 'Étage 1', elevation: 2900 }
    const a = { ...createPlatformElement('A', RECT), levelId: LEVEL.id }
    const b = { ...createPlatformElement('B', [0, 0, 1000, 0, 1000, 1000, 0, 1000], 300), levelId: upper.id }
    const building = computeBuildingMeasurements({ elements: [a, b], levels: [LEVEL, upper] })
    expect(building.levels.map((l) => l.measurements.platforms.length)).toEqual([1, 1])
    expect(building.total.totals.platformArea).toBeCloseTo(13e6)
    expect(mm3ToM3(building.total.totals.platformVolume)).toBeCloseTo(5.4 + 0.3)
  })
})

describe('plateforme : CSV', () => {
  it('ajoute un tableau « Plateformes » avec surface (m²) et volume (m³)', () => {
    const platform = { ...createPlatformElement('Estrade', RECT), levelId: LEVEL.id }
    const building = computeBuildingMeasurements({ elements: [platform], levels: [LEVEL] })
    const csv = measurementsToCsv(building, fr.measurements.csv)
    expect(csv).toContain('Plateformes')
    expect(csv).toContain('Hauteur du dessus (mm)')
    expect(csv).toContain('Rez-de-chaussée;Estrade;12,00;450;450;5,40')
  })

  it('sans plateforme, pas de tableau', () => {
    const building = computeBuildingMeasurements({ elements: [], levels: [LEVEL] })
    expect(measurementsToCsv(building, fr.measurements.csv)).not.toContain('Plateformes')
  })
})
