/**
 * Jeux de tests de référence (roadmap, phase Fabrics + Pascal) : HOUSE-01, HOUSE-02 et EDGE-01, dont
 * les valeurs attendues sont dans `fixtures/<jeu>/spec.json` (calcul à la main relu par
 * l'utilisateur le 2026-11-18). M18 vérifie les métrés que Fabrics calcule déjà, sur le plan
 * **passé par la scène Pascal** ; volumes des murs, dalles et DQE viennent en M21 et M23.
 *
 * Les coordonnées des fixtures ont l'axe y vers le nord ; Fabrics a l'axe y vers le bas de l'écran.
 * Les surfaces, longueurs et périmètres n'en dépendent pas : les points sont repris tels quels.
 */
import { describe, expect, it } from 'vitest'
import { computeBuildingMeasurements } from '../../measurements/measurements'
import { computeQuantities, sumQuantity } from '../../measurements/quantities/quantitySet'
import type { QuantityCode } from '../../measurements/quantities/types'
import { isBlockingWarning, metresWarnings } from '../../measurements/warnings'
import { parseLength } from '../../units/format'
import type { CanvasElement, FabricsDocument, Level } from '../../../types/document'
import { BASE, house01, house02, planDocument, spec } from './fixtureDocuments'
import { settleScene } from '../settle'
import { sceneToFabricsView } from '../view/toFabricsView'
import { DuplicateElementIdError, fabricsToScene } from './fromFabrics'

const m2 = (mm2: number) => Math.round(mm2 / 1e4) / 100
const m3 = (mm3: number) => Math.round(mm3 / 1e6) / 1000

/** Plan → scène Pascal → chargement par Pascal → vue calculée : le chemin de tout plan à partir de M18. */
function viaScene(doc: FabricsDocument): FabricsDocument {
  return sceneToFabricsView(settleScene(fabricsToScene(doc).scene))
}

describe('HOUSE-01 passé par la scène Pascal', () => {
  const s = spec('HOUSE-01')
  const doc = viaScene(house01())
  const { measurements: m } = computeBuildingMeasurements(doc).levels[0]

  it('garde le plan à l’identique', () => {
    expect(doc).toStrictEqual(house01())
  })

  it('pièces : surfaces et périmètres', () => {
    for (const expected of s.expected.rooms) {
      const room = m.rooms.find((r) => r.name === expected.name)!
      expect(m2(room.area), expected.name).toBe(expected.area_m2)
      expect(room.area / 1e6, expected.name).toBeCloseTo(expected.exact_m2, 6)
      expect(room.perimeter, expected.name).toBe(expected.perimeter_mm)
    }
    expect(m2(m.rooms.reduce((sum, r) => sum + r.area, 0))).toBe(s.expected.roomsTotal_m2)
  })

  it('murs : longueur à l’axe, surfaces brute, des ouvertures et nette', () => {
    const env = m.walls.find((w) => w.id === 'ENV')!
    const e = s.expected.walls.ENV
    expect(env.length).toBe(e.axisLength_mm)
    expect(m2(env.wallArea)).toBe(e.grossArea_m2)
    expect(m2(env.openingsArea)).toBe(e.openingsArea_m2)
    expect(m2(env.netArea)).toBe(e.netArea_m2)
    for (const ref of ['C1', 'C2', 'C3']) {
      const wall = m.walls.find((w) => w.id === ref)!
      expect(wall.length, ref).toBe(s.expected.walls[ref].axisLength_mm)
      expect(m2(wall.wallArea), ref).toBe(s.expected.walls[ref].grossArea_m2)
    }
  })

  it('ouvertures : nombre et surface', () => {
    const o = s.expected.openings
    expect(m.openings.filter((x) => x.kind === 'door')).toHaveLength(o.doors)
    expect(m.openings.filter((x) => x.kind === 'window')).toHaveLength(o.windows)
    expect(m2(m.openings.reduce((sum, x) => sum + x.area, 0))).toBe(o.total_m2)
  })

  it('aucun avertissement de métré, sauf le matériau que la fixture ne donne pas (contrôle M21)', () => {
    const warnings = metresWarnings(doc, computeBuildingMeasurements(doc))
    expect(warnings.filter((w) => w.kind !== 'wallNoMaterial')).toEqual([])
    expect(warnings.map((w) => w.kind === 'wallNoMaterial' && w.wallId).sort()).toEqual(['C1', 'C2', 'C3', 'ENV'])
  })

  it('quantités géométriques (M21, 21.1) : volumes des murs, brut 21,12 m³ et net 19,394 m³ pour ENV', () => {
    const { geometric } = computeQuantities({ document: doc })
    const value = (code: QuantityCode, id: string) => geometric.find((q) => q.code === code && q.elementIds[0] === id)!.value
    const e = s.expected.walls
    expect(m3(value('wall.grossVolume', 'ENV'))).toBe(e.ENV.volumeGross_m3)
    expect(m3(value('wall.netVolume', 'ENV'))).toBe(e.ENV.volumeNet_m3)
    for (const ref of ['C1', 'C2', 'C3']) expect(m3(value('wall.netVolume', ref)), ref).toBe(e[ref].volume_m3)
    expect(m3(['C1', 'C2', 'C3'].reduce((sum, ref) => sum + value('wall.netVolume', ref), 0))).toBe(e.partitionsTotal.volume_m3)
  })

  it('dalle de niveau (M21, 21.2) : 80 m², 16 m³', () => {
    const scene = settleScene(fabricsToScene(house01()).scene)
    const { geometric, takeoff } = computeQuantities({ document: doc, scene })
    for (const list of [geometric, takeoff]) {
      expect(m2(sumQuantity(list, 'slab.area'))).toBe(s.expected.slab.area_m2)
      expect(m3(sumQuantity(list, 'slab.volume'))).toBe(s.expected.slab.volume_m3)
    }
  })
})

describe('HOUSE-02 passé par la scène Pascal', () => {
  const s = spec('HOUSE-02')
  const doc = viaScene(house02())
  const building = computeBuildingMeasurements(doc)
  const level = (name: string) => building.levels.find((l) => l.level.name === name)!.measurements

  it('garde le plan à l’identique', () => {
    expect(doc).toStrictEqual(house02())
  })

  it.each(['Rez-de-chaussée', 'Étage 1'])('%s : murs, ouvertures et pièces', (name) => {
    const e = s.expected.perLevel[name]
    const m = level(name)
    expect(m2(m.walls.reduce((sum, w) => sum + w.wallArea, 0))).toBe(e.walls.grossArea_m2)
    expect(m2(m.walls.reduce((sum, w) => sum + w.netArea, 0))).toBe(e.walls.netArea_m2)
    expect(m2(m.openings.reduce((sum, x) => sum + x.area, 0))).toBe(e.openings.area_m2)
    expect(m.openings.filter((x) => x.kind === 'door')).toHaveLength(e.openings.doors)
    expect(m.openings.filter((x) => x.kind === 'window')).toHaveLength(e.openings.windows)
    expect(m.openings.filter((x) => x.kind === 'bay')).toHaveLength(e.openings.bays ?? 0)
    expect(m2(m.rooms.reduce((sum, r) => sum + r.area, 0))).toBe(e.roomsTotal_m2 ?? e.roomsGross_m2)
  })

  it('trémie de l’escalier déduite de la pièce du dessus', () => {
    const e = s.expected.void
    const m = level(e.level)
    const sejour = m.rooms.find((r) => r.name === 'Séjour')!
    expect(m2(sejour.voidArea)).toBe(e.area_m2)
    expect(m2(sejour.netArea)).toBe(e.roomAboveNet_m2)
    expect(m2(m.rooms.reduce((sum, r) => sum + r.netArea, 0))).toBe(s.expected.perLevel[e.level].roomsNet_m2)
  })

  it('totaux du bâtiment : pièces et murs', () => {
    const b = s.expected.building
    const all = building.levels.map((l) => l.measurements)
    expect(m2(all.flatMap((m) => m.rooms).reduce((sum, r) => sum + r.area, 0))).toBe(b.roomsGross_m2)
    expect(m2(all.flatMap((m) => m.rooms).reduce((sum, r) => sum + r.netArea, 0))).toBe(b.roomsNet_m2)
    expect(m2(all.flatMap((m) => m.walls).reduce((sum, w) => sum + w.wallArea, 0))).toBe(b.wallsGrossArea_m2)
    expect(m2(all.flatMap((m) => m.walls).reduce((sum, w) => sum + w.netArea, 0))).toBe(b.wallsNetArea_m2)
  })

  it('quantités (M21, 21.2) : volumes nets des murs, dalles découpées par les murs du dessous et la trémie', () => {
    const scene = settleScene(fabricsToScene(house02()).scene)
    const { geometric } = computeQuantities({ document: doc, scene })
    const b = s.expected.building
    const ofLevel = (name: string) => geometric.filter((q) => q.levelId === building.levels.find((l) => l.level.name === name)!.level.id)
    for (const name of ['Rez-de-chaussée', 'Étage 1']) {
      const e = s.expected.perLevel[name]
      expect(m3(sumQuantity(ofLevel(name), 'wall.netVolume')), name).toBe(e.walls.netVolume_m3)
      expect(m2(sumQuantity(ofLevel(name), 'slab.area')), name).toBe(e.slab.area_m2)
      expect(m3(sumQuantity(ofLevel(name), 'slab.volume')), name).toBe(e.slab.volume_m3)
    }
    expect(m3(sumQuantity(geometric, 'wall.netVolume'))).toBe(b.wallsNetVolume_m3)
    expect(m2(sumQuantity(geometric, 'slab.area'))).toBe(b.slabsArea_m2)
    expect(m3(sumQuantity(geometric, 'slab.volume'))).toBe(b.slabsVolume_m3)
    expect(m3(sumQuantity(geometric, 'wall.netVolume') + sumQuantity(geometric, 'slab.volume'))).toBe(b.wallsAndSlabsVolume_m3)
  })
})

describe('EDGE-01 : jamais un résultat faux en silence', () => {
  const L = 'L'
  const levels: Level[] = [{ id: L, name: 'R', elevation: 0, height: 3000, slabThickness: 200 }]
  const wall = (height = 3000): CanvasElement => ({ ...BASE, id: 'w', levelId: L, type: 'wall', name: 'M', points: [0, 0, 4000, 0], thickness: 200, height, fill: '#ccc' })
  const win = (id: string, offset: number): CanvasElement => ({ ...BASE, id, levelId: L, type: 'opening', name: id, kind: 'window', wallId: 'w', segmentIndex: 0, offset, width: 1200, height: 1350, sillHeight: 900, hinge: 'start', side: 'left' })

  it('window-off-wall : la fenêtre n’est pas déplacée et le dépassement est signalé', () => {
    const doc = viaScene(planDocument(levels, [wall(), win('o', 300)]))
    expect(doc.elements[1]).toMatchObject({ offset: 300, width: 1200 })
    const warnings = metresWarnings(doc, computeBuildingMeasurements(doc))
    expect(warnings).toContainEqual(expect.objectContaining({ kind: 'openingOutside', openingId: 'o' }))
  })
  it('window-off-wall : aucune surface déduite pour la fenêtre qui dépasse', () => {
    const doc = viaScene(planDocument(levels, [wall(), win('o', 300)]))
    const [w] = computeBuildingMeasurements(doc).levels[0].measurements.walls
    expect(w.openingsArea).toBe(0)
    expect(w.netArea).toBe(w.wallArea)
  })

  it('overlapping-openings : le chevauchement est signalé', () => {
    const doc = viaScene(planDocument(levels, [wall(), win('a', 1600), win('b', 2400)]))
    const warnings = metresWarnings(doc, computeBuildingMeasurements(doc))
    expect(warnings).toContainEqual(expect.objectContaining({ kind: 'openingOverlap', openingIds: ['a', 'b'] }))
  })
  it('overlapping-openings : surface déduite = union 2,70 m² (et non 3,24)', () => {
    const doc = viaScene(planDocument(levels, [wall(), win('a', 1600), win('b', 2400)]))
    const [w] = computeBuildingMeasurements(doc).levels[0].measurements.walls
    expect(w.openingsArea).toBeCloseTo(2_700_000, 3)
  })

  it('zero-height-wall : surface nulle, le mur est gardé tel quel', () => {
    const doc = viaScene(planDocument(levels, [wall(0)]))
    const [w] = computeBuildingMeasurements(doc).levels[0].measurements.walls
    expect(w).toMatchObject({ wallArea: 0, netArea: 0, height: 0 })
  })
  it('zero-height-wall : avertissement « hauteur nulle », sans bloquer', () => {
    const doc = viaScene(planDocument(levels, [wall(0)]))
    const warnings = metresWarnings(doc, computeBuildingMeasurements(doc))
    expect(warnings).toContainEqual(expect.objectContaining({ kind: 'wallZeroHeight', wallId: 'w' }))
    expect(isBlockingWarning(warnings.find((x) => x.kind === 'wallZeroHeight')!)).toBe(false)
  })

  it('mixed-units : « 3,5 m », « 3500 » et « 350 cm » donnent 3500 mm', () => {
    expect(['3,5 m', '3500', '350 cm'].map(parseLength)).toEqual([3500, 3500, 3500])
  })

  it('duplicate-id : la conversion refuse le plan avec une erreur claire, sans rien écraser', () => {
    const doc = planDocument(levels, [wall(), { ...wall(), name: 'M bis' }])
    expect(() => fabricsToScene(doc)).toThrow(DuplicateElementIdError)
    expect(() => fabricsToScene(doc)).toThrow('Identifiants en double dans le plan : w')
  })

  it('missing-material : signalé « matériau manquant » dans les contrôles qualité (M21)', () => {
    const doc = viaScene(planDocument(levels, [wall()]))
    const warnings = metresWarnings(doc, computeBuildingMeasurements(doc))
    expect(warnings).toContainEqual(expect.objectContaining({ kind: 'wallNoMaterial', wallId: 'w' }))
    expect(isBlockingWarning(warnings.find((x) => x.kind === 'wallNoMaterial')!)).toBe(false)
  })
  it.todo('ifc-nested-placements : coordonnées absolues après import IFC (M22)')
})
