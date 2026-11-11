import { describe, expect, it } from 'vitest'
import { fr } from '../../i18n/fr'
import type { Level, RoomElement, StairElement } from '../../types/document'
import { buildBuildingModel } from '../building/model'
import { createRoomElement, createStairElement } from '../documents/elements'
import { polygonArea } from '../geometry/polygon'
import { measurementsToCsv } from '../measurements/csv'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { formatArea } from '../units/format'
import { collectStairVoids, overflowingStairIds, pointInPolygon, polygonInside, voidsOfRoom } from './voids'

const GROUND: Level = { id: 'n0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 }
const UPPER: Level = { id: 'n1', name: 'Étage 1', elevation: 2700, height: 2700, slabThickness: 200 }
const LEVELS = [GROUND, UPPER]

const flat = (points: { x: number; y: number }[]) => points.flatMap((p) => [p.x, p.y])

/** Pièce de 5000 × 4000 mm (20,00 m²) à l'étage. */
const upperRoom = (): RoomElement => ({
  ...createRoomElement('Chambre', [0, 0, 5000, 0, 5000, 4000, 0, 4000]),
  levelId: 'n1',
})

const stair = (overrides: Partial<StairElement> = {}): StairElement => ({
  ...createStairElement('Escalier 1', 'straight', 1000, 200, { length: 3500 }),
  levelId: 'n0',
  ...overrides,
})

describe('géométrie : un point et un polygone', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ]
  it('dedans, dehors, sur le bord', () => {
    expect(pointInPolygon({ x: 50, y: 50 }, square)).toBe(true)
    expect(pointInPolygon({ x: 150, y: 50 }, square)).toBe(false)
    expect(pointInPolygon({ x: 100, y: 50 }, square)).toBe(true)
  })

  it('un polygone tient dedans, ou déborde', () => {
    const small = square.map((p) => ({ x: p.x / 2 + 10, y: p.y / 2 + 10 }))
    const shifted = square.map((p) => ({ x: p.x + 60, y: p.y }))
    expect(polygonInside(small, square)).toBe(true)
    expect(polygonInside(shifted, square)).toBe(false)
  })

  it('un L creux : un polygone qui traverse l’encoche déborde même si ses sommets sont dedans', () => {
    const l = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 40 },
      { x: 40, y: 40 },
      { x: 40, y: 100 },
      { x: 0, y: 100 },
    ]
    const across = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 }, // dans l'encoche, hors du L
      { x: 10, y: 90 },
    ]
    expect(polygonInside(across, l)).toBe(false)
  })
})

describe('trémie dans la dalle et les métrés', () => {
  it('escalier droit 1000 × 3500 mm sous une pièce de 5000 × 4000 mm : trou de 1100 × 3600 mm (3,96 m²)', () => {
    const voids = collectStairVoids([stair()], LEVELS)
    expect(voids).toHaveLength(1)
    expect(voids[0].levelId).toBe('n1')
    const result = voidsOfRoom(upperRoom(), voids)
    expect(result.holes).toHaveLength(1)
    expect(result.area).toBeCloseTo(3.96e6)
  })

  it('la pièce affiche 20,00 m² au tracé et 16,04 m² net', () => {
    const building = computeBuildingMeasurements({ elements: [stair(), upperRoom()], levels: LEVELS })
    const [room] = building.levels[1].measurements.rooms
    expect(formatArea(room.area)).toBe('20,00 m²')
    expect(formatArea(room.voidArea)).toBe('3,96 m²')
    expect(formatArea(room.netArea)).toBe('16,04 m²')
    expect(room.voidOverflow).toBe(false)
    expect(building.total.totals.voidArea).toBeCloseTo(3.96e6)
    expect(building.total.totals.roomNetArea).toBeCloseTo(16.04e6)
  })

  it('déplacer l’escalier déplace le trou', () => {
    const before = collectStairVoids([stair()], LEVELS)[0].polygon
    const after = collectStairVoids([stair({ x: 1500, y: 400 })], LEVELS)[0].polygon
    expect(after.map((p) => [p.x - 500, p.y - 200])).toEqual(before.map((p) => [p.x, p.y]))
    // Tout reste dans la pièce : la surface nette ne change pas.
    const building = computeBuildingMeasurements({ elements: [stair({ x: 1500, y: 400 }), upperRoom()], levels: LEVELS })
    expect(building.levels[1].measurements.rooms[0].netArea).toBeCloseTo(16.04e6)
  })

  it('une pièce du rez-de-chaussée n’est pas trouée par l’escalier qui part d’en bas', () => {
    const ground = { ...upperRoom(), levelId: 'n0' }
    const building = computeBuildingMeasurements({ elements: [stair(), ground], levels: LEVELS })
    expect(building.levels[0].measurements.rooms[0].voidArea).toBe(0)
  })

  it('trémie qui déborde de la pièce : avertissement, aucune surface retirée, dalle pleine', () => {
    const overflowing = stair({ x: 4500 }) // 1100 mm de large dépassent le bord à 5000 mm
    const building = computeBuildingMeasurements({ elements: [overflowing, upperRoom()], levels: LEVELS })
    const [room] = building.levels[1].measurements.rooms
    expect(room.voidOverflow).toBe(true)
    expect(room.voidArea).toBe(0)
    expect(room.netArea).toBe(room.area)
    expect(overflowingStairIds([overflowing, upperRoom()], LEVELS).has(overflowing.id)).toBe(true)
    const model = buildBuildingModel({ elements: [overflowing, upperRoom()], levels: LEVELS })
    expect(model.slabs.find((s) => s.kind === 'slab')?.holes).toBeUndefined()
  })

  it('sans pièce au-dessus : rien à percer, pas d’avertissement', () => {
    expect(overflowingStairIds([stair()], LEVELS).size).toBe(0)
  })

  it('niveau du dessus supprimé : aucune trémie', () => {
    expect(collectStairVoids([stair()], [GROUND])).toHaveLength(0)
  })

  it('un escalier en L donne un trou en L', () => {
    const l = stair({ ...createStairElement('E', 'l', 1000, 200, { length: 2000, length2: 1500 }), levelId: 'n0' })
    const [hole] = collectStairVoids([l], LEVELS)
    expect(hole.polygon).toHaveLength(6)
    expect(hole.rects).toHaveLength(2)
    const result = voidsOfRoom(upperRoom(), [hole])
    expect(result.holes).toHaveLength(1)
    // Le L agrandi de 50 mm : plus petit que son rectangle englobant.
    const bbox = (1000 + 1500 + 100) * (1000 + 2000 + 100)
    expect(result.area).toBeLessThan(bbox)
    expect(result.area).toBeCloseTo(polygonArea(flat(hole.polygon)))
  })
})

describe('dalle 3D trouée', () => {
  it('la dalle de la pièce du dessus a un trou à l’emplacement de l’escalier', () => {
    const model = buildBuildingModel({ elements: [stair(), upperRoom()], levels: LEVELS })
    const slab = model.slabs.find((s) => s.kind === 'slab')!
    expect(slab.levelId).toBe('n1')
    expect(slab.holes).toHaveLength(1)
    const hole = slab.holes![0]
    const xs = hole.map((p) => p.x)
    const ys = hole.map((p) => p.y)
    expect(Math.max(...xs) - Math.min(...xs)).toBe(1100)
    expect(Math.max(...ys) - Math.min(...ys)).toBe(3600)
  })

  it('une pièce sans escalier garde une dalle pleine', () => {
    const model = buildBuildingModel({ elements: [upperRoom()], levels: LEVELS })
    expect(model.slabs[0].holes).toBeUndefined()
  })
})

describe('CSV : colonne « Trémie »', () => {
  it('donne la trémie et la surface nette de chaque pièce', () => {
    const building = computeBuildingMeasurements({ elements: [stair(), upperRoom()], levels: LEVELS })
    const csv = measurementsToCsv(building, fr.measurements.csv)
    expect(csv).toContain('Niveau;Nom;Surface (m²);Périmètre (mm);Trémie (m²);Surface nette (m²)')
    expect(csv).toContain('Étage 1;Chambre;20,00;18000;3,96;16,04')
  })
})
