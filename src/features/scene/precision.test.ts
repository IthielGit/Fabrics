/**
 * M19 B5 — Exemples T1 (studio) et T2 (séjour + chambre) : précision 2D → 3D et 3D → 2D.
 *
 * - 2D → 3D : le plan Fabrics devient la scène Pascal (nœuds de murs, ouvertures, pièces) ; chaque
 *   longueur, épaisseur, hauteur et largeur s'y retrouve au mm près, et l'emprise calculée par Pascal
 *   est celle du calcul à la main.
 * - 3D → 2D : un geste de Pascal (mur déplacé, fenêtre élargie) se retrouve sur le plan et dans les
 *   métrés de Fabrics, au mm et au centième de m² près.
 * Valeurs attendues : `fixtures/T1/spec.json`, `fixtures/T2/spec.json` (calcul à la main).
 */
import { useScene } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { metresWarnings } from '../measurements/warnings'
import type { CanvasElement, FabricsDocument } from '../../types/document'
import { fabricsToScene } from './migrate/fromFabrics'
import type { PlanScene } from './sceneTypes'
import { settleScene } from './settle'
import { siteMeasures } from './siteMeasures'
import { sceneToFabricsView } from './view/toFabricsView'

const SPECS = import.meta.glob<Record<string, unknown>>('../../../fixtures/T*/spec.json', { eager: true, import: 'default' })
type Spec = any // JSON de spécification, lu tel quel (forme documentée dans le fichier lui-même)
const spec = (id: string): Spec => SPECS[`../../../fixtures/${id}/spec.json`]

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const m2 = (mm2: number) => Math.round(mm2 / 1e4) / 100
const m3 = (mm3: number) => Math.round(mm3 / 1e6) / 1000

function planOf(s: Spec): FabricsDocument {
  const levelId = s.level.id
  const elements: CanvasElement[] = []
  for (const w of s.walls) {
    elements.push({ ...BASE, id: w.ref, levelId, type: 'wall', name: w.ref, points: w.axis, thickness: w.thickness, height: w.height, fill: '#475569' })
  }
  for (const o of s.openings) {
    elements.push({
      ...BASE, id: o.ref, levelId, type: 'opening', name: o.ref, kind: o.kind, wallId: o.wall, segmentIndex: o.segment,
      offset: o.offset, width: o.width, height: o.height, sillHeight: o.sillHeight, hinge: 'start', side: 'left',
    })
  }
  s.rooms.forEach((r: { name: string; polygon: number[] }, i: number) =>
    elements.push({ ...BASE, id: `room${i}`, levelId, type: 'room', name: r.name, points: r.polygon, fill: '#eef', showLabel: true }),
  )
  return {
    version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' },
    levels: [{ ...s.level }],
    elements,
  }
}

const sceneOf = (doc: FabricsDocument): PlanScene => settleScene(fabricsToScene(doc).scene)
const metresOf = (scene: PlanScene) => computeBuildingMeasurements(sceneToFabricsView(scene)).levels[0].measurements

/** Gestes de Pascal : nœuds modifiés ensemble dans son store, en une étape. */
function gesture(scene: PlanScene, updates: { id: string; data: Record<string, unknown> }[]): PlanScene {
  settleScene(scene)
  useScene.getState().updateNodes(updates.map((u) => ({ id: u.id as never, data: u.data as never })))
  const state = useScene.getState()
  return settleScene({ nodes: state.nodes as unknown as PlanScene['nodes'], rootNodeIds: [...(state.rootNodeIds as string[])] })
}

/** Écarts mesurés (pour le rapport de précision) : tous doivent être nuls. */
const deviations: { fixture: string; quantity: string; expected: number; measured: number }[] = []
function check(fixture: string, quantity: string, measured: number, expected: number) {
  deviations.push({ fixture, quantity, expected, measured })
  expect(measured, `${fixture} · ${quantity}`).toBe(expected)
}

function checkMetres(id: string, s: Spec, scene: PlanScene) {
  const m = metresOf(scene)
  for (const [ref, e] of Object.entries<Spec>(s.expected.walls)) {
    const wall = m.walls.find((w) => w.id === ref)!
    check(id, `${ref} longueur (mm)`, wall.length, e.axisLength_mm)
    check(id, `${ref} brute (m²)`, m2(wall.wallArea), e.grossArea_m2)
    check(id, `${ref} ouvertures (m²)`, m2(wall.openingsArea), e.openingsArea_m2)
    check(id, `${ref} nette (m²)`, m2(wall.netArea), e.netArea_m2)
    check(id, `${ref} volume (m³)`, m3(wall.volume), e.volume_m3)
  }
  for (const e of s.expected.rooms) {
    const room = m.rooms.find((r) => r.name === e.name)!
    check(id, `${e.name} surface (m²)`, m2(room.area), e.area_m2)
    check(id, `${e.name} périmètre (mm)`, room.perimeter, e.perimeter_mm)
  }
}

describe.each(['T1', 'T2'])('%s : plan → scène Pascal (2D → 3D)', (id) => {
  const s = spec(id)
  const doc = planOf(s)
  const scene = sceneOf(doc)

  it('métrés par la scène = calcul à la main', () => checkMetres(id, s, scene))

  it('chaque côté de mur devient un nœud Pascal aux mêmes cotes (m), épaisseur et hauteur', () => {
    for (const w of s.walls) {
      const segments = w.axis.length / 2 - 1
      for (let i = 0; i < segments; i++) {
        const node = scene.nodes[`wall_${w.ref}__${i}`]
        expect(node, `${w.ref} côté ${i}`).toBeDefined()
        const mm = (v: number) => Math.round(v * 1000)
        expect([...(node.start as number[]), ...(node.end as number[])].map(mm)).toEqual(w.axis.slice(i * 2, i * 2 + 4))
        expect(mm(node.thickness as number)).toBe(w.thickness)
        expect(mm(node.height as number)).toBe(w.height)
      }
    }
  })

  it('ouvertures et pièces présentes dans la scène, aux mêmes dimensions', () => {
    for (const o of s.openings) {
      const node = scene.nodes[`${o.kind}_${o.ref}`]
      expect(Math.round((node.width as number) * 1000), o.ref).toBe(o.width)
      expect(Math.round((node.height as number) * 1000), o.ref).toBe(o.height)
      expect(node.parentId).toBe(`wall_${o.wall}__${o.segment}`)
    }
    const zones = Object.values(scene.nodes).filter((n) => n.type === 'zone').map((n) => n.name)
    expect(zones.sort()).toEqual(s.rooms.map((r: { name: string }) => r.name).sort())
  })

  it('emprise au sol calculée par Pascal = calcul à la main', () => {
    check(id, 'emprise (m²)', m2(siteMeasures(scene).footprintArea), s.expected.footprint_m2)
  })

  it('aucun avertissement de métré', () => {
    const view = sceneToFabricsView(scene)
    expect(metresWarnings(view, computeBuildingMeasurements(view))).toEqual([])
  })
})

describe('T1 : mur déplacé dans Pascal (3D → 2D)', () => {
  const s = spec('T1')
  const e = s.expected.edit3d
  // Mur est (côté 1) déplacé de 1000 mm vers l'est avec ses deux coins (geste « déplacer un mur »).
  const after = gesture(sceneOf(planOf(s)), [
    { id: 'wall_ENV__1', data: { start: [6.9, 0.1], end: [6.9, 4.9] } },
    { id: 'wall_ENV__0', data: { end: [6.9, 0.1] } },
    { id: 'wall_ENV__2', data: { start: [6.9, 4.9] } },
  ])

  it('le plan Fabrics montre le mur à sa nouvelle place', () => {
    const env = sceneToFabricsView(after).elements.find((el) => el.id === 'ENV')
    expect(env?.type === 'wall' && env.points).toEqual([100, 100, 6900, 100, 6900, 4900, 100, 4900, 100, 100])
  })

  it('métrés et emprise suivent, au mm et au centième de m² près', () => {
    const m = metresOf(after)
    const env = m.walls.find((w) => w.id === 'ENV')!
    check('T1 3D', 'ENV longueur (mm)', env.length, e.axisLength_mm)
    check('T1 3D', 'ENV brute (m²)', m2(env.wallArea), e.grossArea_m2)
    check('T1 3D', 'ENV nette (m²)', m2(env.netArea), e.netArea_m2)
    check('T1 3D', 'Studio (m²)', m2(m.rooms[0].area), e.roomArea_m2)
    check('T1 3D', 'emprise (m²)', m2(siteMeasures(after).footprintArea), e.footprint_m2)
  })
})

describe('T2 : fenêtre élargie dans Pascal (3D → 2D)', () => {
  const s = spec('T2')
  const e = s.expected.edit3d
  const after = gesture(sceneOf(planOf(s)), [{ id: 'window_F1', data: { width: 1.5 } }])

  it('la fenêtre a sa nouvelle largeur sur le plan', () => {
    const f1 = sceneToFabricsView(after).elements.find((el) => el.id === 'F1')
    expect(f1?.type === 'opening' && f1.width).toBe(1500)
  })

  it('surfaces et volume du mur recalculés', () => {
    const env = metresOf(after).walls.find((w) => w.id === 'ENV')!
    check('T2 3D', 'ENV ouvertures (m²)', m2(env.openingsArea), e.openingsArea_m2)
    check('T2 3D', 'ENV nette (m²)', m2(env.netArea), e.netArea_m2)
    check('T2 3D', 'ENV volume (m³)', m3(env.volume), e.volume_m3)
  })

  it('rapport de précision : aucun écart', () => {
    const off = deviations.filter((d) => d.measured !== d.expected)
    expect(off).toEqual([])
    expect(deviations.length).toBeGreaterThan(30)
  })
})
