import { describe, expect, it } from 'vitest'
import type { OpeningElement, WallElement } from '../../../types/document'
import { createExamplePlanProject, createLargeHouseProject } from '../../documents/createProject'
import { createOpeningElement, createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { settleScene } from '../../scene/settle'
import { fabricsToScene } from '../../scene/migrate/fromFabrics'
import { sceneToFabricsView } from '../../scene/view/toFabricsView'
import { computeBuildingMeasurements, type Measurements } from '../measurements'
import { geometricQuantities } from './geometric'
import { buildingQuantities, sumQuantity, takeoffQuantities } from './takeoff'
import type { QuantityCode } from './types'

const level = createLevel('RDC', 0, 3000, 200)

/** Mur témoin du gate G4 : 5000 × 3000 × 200 mm, une ouverture de 900 × 2100 mm. */
function g4Wall() {
  const wall: WallElement = { ...createWallElement('Mur', [0, 0, 5000, 0], 200, 3000), levelId: level.id }
  const door: OpeningElement = {
    ...createOpeningElement('door', 'Porte', { wallId: wall.id, segmentIndex: 0, offset: 2500, side: 'left' }),
    levelId: level.id,
    width: 900,
    height: 2100,
    sillHeight: 0,
  }
  return { wall, door, document: { elements: [wall, door], levels: [level] } }
}

describe('quantités géométriques et de métré (M21, 21.1)', () => {
  it('mur témoin G4 : brut 15,00 m², ouverture 1,89 m², net 13,11 m², volume net 2,622 m³', () => {
    const { wall, door, document } = g4Wall()
    const { geometric } = buildingQuantities(computeBuildingMeasurements(document))
    const value = (code: QuantityCode, id = wall.id) => geometric.find((q) => q.code === code && q.elementIds[0] === id)!.value
    expect(value('wall.grossArea')).toBe(15_000_000)
    expect(value('wall.openingsArea')).toBe(1_890_000)
    expect(value('opening.area', door.id)).toBe(1_890_000)
    expect(value('wall.netArea')).toBe(13_110_000)
    expect(value('wall.grossVolume')).toBe(3_000_000_000)
    expect(value('wall.netVolume')).toBe(2_622_000_000)
  })

  it('chaque quantité a une famille, une grandeur, un niveau et ses éléments sources', () => {
    const { wall, document } = g4Wall()
    const { geometric } = buildingQuantities(computeBuildingMeasurements(document))
    const length = geometric.find((q) => q.code === 'wall.length')!
    expect(length).toEqual({
      key: `geometric:wall.length:${wall.id}`,
      family: 'geometric',
      category: 'wall',
      code: 'wall.length',
      dimension: 'length',
      value: 5000,
      elementIds: [wall.id],
      partId: null,
      levelId: level.id,
    })
  })

  it('les deux familles sont distinctes : clés différentes, mêmes sources', () => {
    const { document } = g4Wall()
    const { geometric, takeoff } = buildingQuantities(computeBuildingMeasurements(document))
    expect(takeoff).toHaveLength(geometric.length)
    expect(takeoff.every((q) => q.family === 'takeoff')).toBe(true)
    const keys = new Set([...geometric, ...takeoff].map((q) => q.key))
    expect(keys.size).toBe(geometric.length * 2)
    takeoff.forEach((q, i) => {
      expect(q.code).toBe(geometric[i].code)
      expect(q.elementIds).toEqual(geometric[i].elementIds)
      expect(q.elementIds).not.toBe(geometric[i].elementIds)
    })
  })

  it('convention par défaut (seuil 0 m², longueur à l’axe) : le métré redonne la géométrie', () => {
    const { document } = g4Wall()
    const geometric = geometricQuantities(computeBuildingMeasurements(document))
    expect(takeoffQuantities(geometric).map((q) => q.value)).toEqual(geometric.map((q) => q.value))
  })

  it('takeoffQuantities ignore une quantité qui n’est pas géométrique', () => {
    const { document } = g4Wall()
    const { takeoff } = buildingQuantities(computeBuildingMeasurements(document))
    expect(takeoffQuantities(takeoff)).toEqual([])
  })
})

/** Totaux des métrés actuels ↔ somme des quantités du même code : aucun chiffre ne bouge. */
const TOTALS: [QuantityCode, keyof Measurements['totals']][] = [
  ['wall.length', 'wallLength'],
  ['wall.grossArea', 'wallArea'],
  ['wall.openingsArea', 'openingsArea'],
  ['wall.netArea', 'wallNetArea'],
  ['wall.facesGrossArea', 'wallFacesArea'],
  ['wall.facesNetArea', 'wallFacesNetArea'],
  ['wall.netVolume', 'wallVolume'],
  ['room.area', 'roomArea'],
  ['room.voidArea', 'voidArea'],
  ['room.netArea', 'roomNetArea'],
  ['room.habitableArea', 'roomHabitableArea'],
  ['platform.area', 'platformArea'],
  ['platform.volume', 'platformVolume'],
  ['roof.projectedArea', 'roofProjectedArea'],
  ['roof.realArea', 'roofRealArea'],
  ['roof.ridgeLength', 'roofRidgeLength'],
  ['roof.eaveLength', 'roofEaveLength'],
  ['roof.hipLength', 'roofHipLength'],
  ['roof.gableCount', 'roofGables'],
  ['chimney.count', 'chimneys'],
]

describe.each([
  ['plan d’exemple', createExamplePlanProject],
  ['grande maison', createLargeHouseProject],
])('%s passé par la scène Pascal : quantités = métrés actuels', (_name, create) => {
  const document = sceneToFabricsView(settleScene(fabricsToScene(create(new Date('2026-11-17T00:00:00Z')).document).scene))
  const building = computeBuildingMeasurements(document)
  const { geometric } = buildingQuantities(building)

  it.each(TOTALS)('%s = total %s', (code, total) => {
    expect(sumQuantity(geometric, code)).toBe(building.total.totals[total])
  })

  it('nombre d’ouvertures et d’éléments : un résultat par élément mesuré', () => {
    const t = building.total.totals
    expect(sumQuantity(geometric, 'opening.count')).toBe(t.doors + t.windows + t.bays)
    expect(sumQuantity(geometric, 'stair.count')).toBe(building.total.stairs.length)
    expect(geometric.filter((q) => q.code === 'wall.length')).toHaveLength(building.total.walls.length)
    expect(geometric.filter((q) => q.code === 'room.area')).toHaveLength(building.total.rooms.length)
  })

  it('couches des murs : une surface et un volume par couche', () => {
    const layers = building.total.walls.flatMap((wall) => wall.layers ?? [])
    expect(geometric.filter((q) => q.code === 'wallLayer.volume')).toHaveLength(layers.length)
    expect(sumQuantity(geometric, 'wallLayer.volume')).toBe(layers.reduce((sum, layer) => sum + layer.volume, 0))
  })

  it('aucune clé en double, chaque quantité rattachée à un niveau du plan', () => {
    const levelIds = new Set(building.levels.map((entry) => entry.level.id))
    expect(new Set(geometric.map((q) => q.key)).size).toBe(geometric.length)
    expect(geometric.every((q) => q.levelId !== null && levelIds.has(q.levelId))).toBe(true)
  })
})
