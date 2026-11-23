import { describe, expect, it } from 'vitest'
import type { FabricsDocument, OpeningElement, RoomElement, WallElement } from '../../../types/document'
import { createExamplePlanProject, createLargeHouseProject } from '../../documents/createProject'
import { createOpeningElement, createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { settleScene } from '../../scene/settle'
import { fabricsToScene } from '../../scene/migrate/fromFabrics'
import { sceneToFabricsView } from '../../scene/view/toFabricsView'
import { computeBuildingMeasurements, type Measurements } from '../measurements'
import { GEOMETRY_VERSION, RULESET_VERSION, takeoffSettingsOf } from './rules'
import { computeQuantities, sumQuantity } from './quantitySet'
import { revealPerimeter } from './takeoff'
import type { QuantityCode, QuantityResult } from './types'

const level = createLevel('RDC', 0, 3000, 200)
const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

function wallOf(points: number[], thickness = 200, height = 3000): WallElement {
  return { ...createWallElement('Mur', points, thickness, height), levelId: level.id }
}

function openingOn(wall: WallElement, kind: OpeningElement['kind'], offset: number, width: number, height: number, sillHeight: number): OpeningElement {
  return {
    ...createOpeningElement(kind, kind, { wallId: wall.id, segmentIndex: 0, offset, side: 'left' }),
    levelId: level.id,
    width,
    height,
    sillHeight,
  }
}

function plan(elements: FabricsDocument['elements'], takeoff?: NonNullable<FabricsDocument['plan']>['takeoff']) {
  return {
    elements,
    levels: [level],
    plan: { scale: 50, gridSize: 100, snapToGrid: true, defaultWallThickness: 200, defaultWallHeight: 2500, northAngle: 0, takeoff },
  }
}

/** Mur témoin du gate G4 : 5000 × 3000 × 200 mm, une ouverture de 900 × 2100 mm. */
function g4Wall() {
  const wall = wallOf([0, 0, 5000, 0])
  const door = openingOn(wall, 'door', 2500, 900, 2100, 0)
  return { wall, door, document: plan([wall, door]) }
}

const find = (list: readonly QuantityResult[], code: QuantityCode, id: string) =>
  list.find((q) => q.code === code && q.elementIds[0] === id)!

describe('quantités géométriques et de métré (M21, 21.1)', () => {
  it('mur témoin G4 : brut 15,00 m², ouverture 1,89 m², net 13,11 m², volume net 2,622 m³', () => {
    const { wall, door, document } = g4Wall()
    for (const list of Object.values(computeQuantities({ document }))) {
      expect(find(list, 'wall.grossArea', wall.id).value).toBe(15_000_000)
      expect(find(list, 'wall.openingsArea', wall.id).value).toBe(1_890_000)
      expect(find(list, 'opening.area', door.id).value).toBe(1_890_000)
      expect(find(list, 'wall.netArea', wall.id).value).toBe(13_110_000)
      expect(find(list, 'wall.grossVolume', wall.id).value).toBe(3_000_000_000)
      expect(find(list, 'wall.netVolume', wall.id).value).toBe(2_622_000_000)
    }
  })

  it('chaque quantité a une famille, une grandeur, un niveau, ses sources et sa règle versionnée', () => {
    const { wall, document } = g4Wall()
    const { geometric, takeoff } = computeQuantities({ document })
    expect(find(geometric, 'wall.length', wall.id)).toEqual({
      key: `geometric:wall.length:${wall.id}`,
      family: 'geometric',
      category: 'wall',
      code: 'wall.length',
      dimension: 'length',
      value: 5000,
      elementIds: [wall.id],
      partId: null,
      levelId: level.id,
      rule: { id: 'geometric.wall.length', version: GEOMETRY_VERSION },
    })
    expect(find(takeoff, 'wall.netArea', wall.id).rule).toEqual({
      id: 'takeoff.wall.netArea',
      version: RULESET_VERSION,
      threshold: { category: 'masonry', value: 0 },
    })
  })

  it('les deux familles sont distinctes : clés différentes, mêmes sources', () => {
    const { document } = g4Wall()
    const { geometric, takeoff } = computeQuantities({ document })
    expect(takeoff.every((q) => q.family === 'takeoff')).toBe(true)
    expect(new Set([...geometric, ...takeoff].map((q) => q.key)).size).toBe(geometric.length + takeoff.length)
    for (const g of geometric) {
      const t = takeoff.find((q) => q.key === g.key.replace('geometric:', 'takeoff:'))!
      expect(t.elementIds).toEqual(g.elementIds)
      expect(t.elementIds).not.toBe(g.elementIds)
    }
  })

  it('convention par défaut (seuil 0 m², longueur à l’axe) : le métré redonne la géométrie', () => {
    const { document } = g4Wall()
    const { geometric, takeoff } = computeQuantities({ document })
    for (const g of geometric) expect(takeoff.find((q) => q.key === g.key.replace('geometric:', 'takeoff:'))!.value).toBe(g.value)
  })
})

describe('règles versionnées (M21, 21.2)', () => {
  it('seuil de maçonnerie : une ouverture plus petite que le seuil n’est pas déduite (métré seulement)', () => {
    const wall = wallOf([0, 0, 5000, 0])
    const small = openingOn(wall, 'window', 1000, 600, 600, 1200) // 0,36 m²
    const large = openingOn(wall, 'window', 3500, 1200, 1350, 900) // 1,62 m²
    const { geometric, takeoff } = computeQuantities({ document: plan([wall, small, large], { thresholds: { masonry: 500_000 } }) })
    expect(find(geometric, 'wall.netArea', wall.id).value).toBe(15_000_000 - 360_000 - 1_620_000)
    expect(find(takeoff, 'wall.openingsArea', wall.id).value).toBe(1_620_000)
    expect(find(takeoff, 'wall.netArea', wall.id).value).toBe(15_000_000 - 1_620_000)
    expect(find(takeoff, 'wall.netVolume', wall.id).value).toBe((15_000_000 - 1_620_000) * 200)
    expect(find(takeoff, 'wall.netArea', wall.id).rule.threshold).toEqual({ category: 'masonry', value: 500_000 })
    // Les autres catégories gardent leur propre seuil (0) : enduits et peinture déduisent tout.
    const faces = find(geometric, 'wall.facesGrossArea', wall.id).value
    expect(find(takeoff, 'wall.plasterArea', wall.id).value).toBe(faces - 2 * (360_000 + 1_620_000))
    expect(find(takeoff, 'wall.paintArea', wall.id).value).toBe(faces - 2 * (360_000 + 1_620_000))
  })

  it('seuils d’enduit et de peinture indépendants', () => {
    const wall = wallOf([0, 0, 5000, 0])
    const small = openingOn(wall, 'window', 1000, 600, 600, 1200)
    const { takeoff } = computeQuantities({ document: plan([wall, small], { thresholds: { plaster: 360_000, paint: 359_999 } }) })
    const faces = find(takeoff, 'wall.facesGrossArea', wall.id).value
    expect(find(takeoff, 'wall.plasterArea', wall.id).value).toBe(faces) // 0,36 m² ne dépasse pas 0,36 m²
    expect(find(takeoff, 'wall.paintArea', wall.id).value).toBe(faces - 720_000)
  })

  it('seuil : deux ouvertures qui se chevauchent sont déduites par leur union', () => {
    const wall = wallOf([0, 0, 4000, 0])
    const a = openingOn(wall, 'window', 1400, 1200, 1350, 900)
    const b = openingOn(wall, 'window', 2200, 1200, 1350, 900)
    const { takeoff } = computeQuantities({ document: plan([wall, a, b], { thresholds: { masonry: 1_000_000 } }) })
    expect(find(takeoff, 'wall.openingsArea', wall.id).value).toBe(2000 * 1350)
  })

  it('tableaux : pourtour × épaisseur ; pas de tableau bas pour une porte', () => {
    expect(revealPerimeter(900, 2100, 0)).toBe(2 * 2100 + 900)
    expect(revealPerimeter(1200, 1350, 900)).toBe(2 * 1350 + 2 * 1200)
    const { door, document } = g4Wall()
    const { geometric, takeoff } = computeQuantities({ document })
    expect(find(takeoff, 'opening.revealArea', door.id).value).toBe((2 * 2100 + 900) * 200)
    expect(geometric.some((q) => q.code === 'opening.revealArea')).toBe(false)
  })

  it('tableaux : une fenêtre hors du mur (EDGE-01) n’en a pas', () => {
    const wall = wallOf([0, 0, 4000, 0])
    const off = openingOn(wall, 'window', 300, 1200, 1350, 900)
    const { takeoff } = computeQuantities({ document: plan([wall, off]) })
    expect(find(takeoff, 'opening.revealArea', off.id).value).toBe(0)
  })

  it('pièce : sol et plafond = surface nette ; plinthes = périmètre moins les portes de la pièce', () => {
    const south = wallOf([0, 0, 4000, 0])
    const north = wallOf([0, 3000, 4000, 3000])
    const door = openingOn(south, 'door', 1000, 900, 2100, 0)
    const window = openingOn(north, 'window', 2000, 1200, 1350, 900)
    const farDoor = openingOn(wallOf([0, 9000, 4000, 9000]), 'door', 1000, 800, 2100, 0)
    const room: RoomElement = { ...BASE, id: 'room', type: 'room', name: 'Séjour', levelId: level.id, points: [100, 100, 3900, 100, 3900, 2900, 100, 2900], fill: '#eee' } as RoomElement
    const { takeoff } = computeQuantities({ document: plan([south, north, door, window, farDoor, room]) })
    expect(find(takeoff, 'room.floorCoveringArea', 'room').value).toBe(3800 * 2800)
    expect(find(takeoff, 'room.ceilingArea', 'room').value).toBe(3800 * 2800)
    // La fenêtre (allège) et la porte d'une autre pièce ne sont pas déduites.
    expect(find(takeoff, 'room.skirtingLength', 'room').value).toBe(2 * (3800 + 2800) - 900)
  })

  it('les réglages enregistrés : valeurs par défaut, valeurs invalides ignorées', () => {
    expect(takeoffSettingsOf(undefined).thresholds).toEqual({ masonry: 0, plaster: 0, paint: 0 })
    expect(takeoffSettingsOf({ thresholds: { masonry: 250_000, paint: -1 } }).thresholds).toEqual({ masonry: 250_000, plaster: 0, paint: 0 })
  })

  it('les seuils passent par la scène Pascal en m² et reviennent en mm²', () => {
    const { document } = g4Wall()
    const full = { ...createExamplePlanProject(new Date('2026-11-17T00:00:00Z')).document }
    full.plan = { ...full.plan!, takeoff: { thresholds: { masonry: 500_000, plaster: 250_000 } } }
    const scene = fabricsToScene(full).scene
    const building = Object.values(scene.nodes).find((n) => n.type === 'building')!
    expect((building.metadata.fabrics as { plan: { takeoff: unknown } }).plan.takeoff).toEqual({ thresholds: { masonry: 0.5, plaster: 0.25 } })
    expect(sceneToFabricsView(settleScene(scene)).plan?.takeoff).toEqual({ thresholds: { masonry: 500_000, plaster: 250_000 } })
    expect(document.plan.takeoff).toBeUndefined()
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
  const scene = settleScene(fabricsToScene(create(new Date('2026-11-17T00:00:00Z')).document).scene)
  const document = sceneToFabricsView(scene)
  const building = computeBuildingMeasurements(document)
  const { geometric, takeoff } = computeQuantities({ document, scene, building })

  it.each(TOTALS)('%s = total %s (géométrie et métré par défaut)', (code, total) => {
    expect(sumQuantity(geometric, code)).toBe(building.total.totals[total])
    expect(sumQuantity(takeoff, code)).toBe(building.total.totals[total])
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
    const levelIds = new Set([...building.levels.map((entry) => entry.level.id), ...Object.keys(scene.nodes)])
    const all = [...geometric, ...takeoff]
    expect(new Set(all.map((q) => q.key)).size).toBe(all.length)
    expect(all.every((q) => q.levelId !== null && levelIds.has(q.levelId))).toBe(true)
  })
})
