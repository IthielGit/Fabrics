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
import { metresWarnings } from '../../measurements/warnings'
import { parseLength } from '../../units/format'
import type { CanvasElement, FabricsDocument, Level } from '../../../types/document'
import { settleScene } from '../settle'
import { sceneToFabricsView } from '../view/toFabricsView'
import { DuplicateElementIdError, fabricsToScene } from './fromFabrics'

const SPECS = import.meta.glob<Record<string, unknown>>('../../../../fixtures/*/spec.json', { eager: true, import: 'default' })
type Spec = any // JSON de spécification, lu tel quel (forme documentée dans le fichier lui-même)
function spec(id: string): Spec {
  return SPECS[`../../../../fixtures/${id}/spec.json`]
}

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const m2 = (mm2: number) => Math.round(mm2 / 1e4) / 100

/** Plan → scène Pascal → chargement par Pascal → vue calculée : le chemin de tout plan à partir de M18. */
function viaScene(doc: FabricsDocument): FabricsDocument {
  return sceneToFabricsView(settleScene(fabricsToScene(doc).scene))
}

/** Position d'une ouverture de fixture sur la polyligne de son mur : rang du côté et distance au
 * centre depuis le début de ce côté. `side` = sud / nord (y min / max) ou ouest / est (x min / max). */
function placeOnWall(axis: number[], o: { side?: string; centerX?: number; centerY?: number }) {
  const xs = axis.filter((_, i) => i % 2 === 0)
  const ys = axis.filter((_, i) => i % 2 === 1)
  const target =
    o.side === 'sud' ? [o.centerX!, Math.min(...ys)]
    : o.side === 'nord' ? [o.centerX!, Math.max(...ys)]
    : o.side === 'ouest' ? [Math.min(...xs), o.centerY!]
    : o.side === 'est' ? [Math.max(...xs), o.centerY!]
    : [o.centerX ?? xs[0], ys[0]]
  for (let i = 0; i + 3 < axis.length; i += 2) {
    const [x1, y1, x2, y2] = axis.slice(i, i + 4)
    const onX = Math.min(x1, x2) <= target[0] && target[0] <= Math.max(x1, x2)
    const onY = Math.min(y1, y2) <= target[1] && target[1] <= Math.max(y1, y2)
    const collinear = (x2 - x1) * (target[1] - y1) - (y2 - y1) * (target[0] - x1) === 0
    if (onX && onY && collinear) return { segmentIndex: i / 2, offset: Math.hypot(target[0] - x1, target[1] - y1) }
  }
  throw new Error(`ouverture hors de son mur : ${JSON.stringify(o)}`)
}

/** Murs, ouvertures et pièces de HOUSE-01 sur un niveau. */
function houseElements(s: Spec, levelId: string, prefix: string): CanvasElement[] {
  const walls = new Map<string, number[]>()
  const out: CanvasElement[] = []
  for (const w of s.walls) {
    walls.set(w.ref, w.axis)
    out.push({ ...BASE, id: `${prefix}${w.ref}`, levelId, type: 'wall', name: w.ref, points: w.axis, thickness: w.thickness, height: w.height, fill: '#ccc' })
  }
  for (const o of s.openings) out.push(opening(o, walls, levelId, prefix))
  s.rooms.forEach((r: { name: string; polygon: number[] }, i: number) =>
    out.push({ ...BASE, id: `${prefix}room${i}`, levelId, type: 'room', name: r.name, points: r.polygon, fill: '#eef', showLabel: true }),
  )
  return out
}

function opening(o: Spec, walls: Map<string, number[]>, levelId: string, prefix: string): CanvasElement {
  const { segmentIndex, offset } = placeOnWall(walls.get(o.wall)!, o)
  return {
    ...BASE, id: `${prefix}${o.ref ?? 'through'}`, levelId, type: 'opening', name: o.ref ?? 'B', kind: o.kind, ...(o.style ? { style: o.style } : {}),
    wallId: `${prefix}${o.wall}`, segmentIndex, offset, width: o.width, height: o.height, sillHeight: o.sillHeight, hinge: 'start', side: 'left',
  }
}

function planDocument(levels: Level[], elements: CanvasElement[]): FabricsDocument {
  return { version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' }, levels, elements }
}

function house01(): FabricsDocument {
  const s = spec('HOUSE-01')
  return planDocument([{ id: 'L0', ...s.level }], houseElements(s, 'L0', ''))
}

function house02(): FabricsDocument {
  const s = spec('HOUSE-02')
  const h1 = spec('HOUSE-01')
  const levels: Level[] = s.levels.map((l: Omit<Level, 'id'>, i: number) => ({ id: `L${i}`, ...l }))
  const [rdc, etage] = levels
  const elements = [...houseElements(h1, rdc.id, 'r-'), ...houseElements(h1, etage.id, 'e-')]
  const walls = new Map<string, number[]>(h1.walls.map((w: { ref: string; axis: number[] }) => [w.ref, w.axis]))
  elements.push(opening(s.throughOpening, walls, etage.id, 'e-'))
  elements.push({ ...BASE, id: 'stair', levelId: rdc.id, type: 'stair', name: 'Escalier', x: 300, y: 600, shape: 'straight', width: s.stair.width, length: s.stair.length, voidMargin: s.stair.voidMargin })
  elements.push({ ...BASE, id: 'roof', levelId: etage.id, type: 'roof', name: 'Toiture', points: s.roof.outline, shape: s.roof.shape, pitch: s.roof.pitch, overhang: s.roof.overhang, ridgeEdge: 1 })
  for (const sec of s.sections) elements.push({ ...BASE, id: `section-${sec.label}`, type: 'section', name: sec.label, points: sec.points, label: sec.label, lookLeft: false })
  return planDocument(levels, elements)
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

  it('aucun avertissement de métré', () => {
    expect(metresWarnings(doc, computeBuildingMeasurements(doc))).toEqual([])
  })

  it.todo('volumes des murs (brut 21,12 m³, net 19,394 m³) et dalle (80 m², 16 m³) : M21')
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

  it.todo('volumes nets des murs (48,838 m³), dalles découpées (146,74 m², 29,348 m³), escalier : M21')
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
  it.todo('window-off-wall : aucune surface déduite pour la fenêtre rejetée (aujourd’hui 1,62 m² déduits)')

  it('overlapping-openings : le chevauchement est signalé', () => {
    const doc = viaScene(planDocument(levels, [wall(), win('a', 1600), win('b', 2400)]))
    const warnings = metresWarnings(doc, computeBuildingMeasurements(doc))
    expect(warnings).toContainEqual(expect.objectContaining({ kind: 'openingOverlap', openingIds: ['a', 'b'] }))
  })
  it.todo('overlapping-openings : surface déduite = union 2,70 m² (aujourd’hui 3,24 m²)')

  it('zero-height-wall : surface nulle, le mur est gardé tel quel', () => {
    const doc = viaScene(planDocument(levels, [wall(0)]))
    const [w] = computeBuildingMeasurements(doc).levels[0].measurements.walls
    expect(w).toMatchObject({ wallArea: 0, netArea: 0, height: 0 })
  })
  it.todo('zero-height-wall : avertissement « hauteur nulle » (aujourd’hui aucun)')

  it('mixed-units : « 3,5 m », « 3500 » et « 350 cm » donnent 3500 mm', () => {
    expect(['3,5 m', '3500', '350 cm'].map(parseLength)).toEqual([3500, 3500, 3500])
  })

  it('duplicate-id : la conversion refuse le plan avec une erreur claire, sans rien écraser', () => {
    const doc = planDocument(levels, [wall(), { ...wall(), name: 'M bis' }])
    expect(() => fabricsToScene(doc)).toThrow(DuplicateElementIdError)
    expect(() => fabricsToScene(doc)).toThrow('Identifiants en double dans le plan : w')
  })

  it.todo('missing-material : signalé « matériau manquant » dans les contrôles (M21, M24)')
  it.todo('ifc-nested-placements : coordonnées absolues après import IFC (M22)')
})
