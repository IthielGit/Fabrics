import { beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { Level, StairElement } from '../../types/document'
import { buildBuildingModel } from '../building/model'
import { createPlanProject } from '../documents/createProject'
import { createStairElement } from '../documents/elements'
import { updateLevel } from '../documents/levels'
import { elementBounds } from '../export/bounds'
import { rotateSelectionQuarterTurn } from '../geometry/rotateSelection'
import { measurementsToCsv } from '../measurements/csv'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { planStairPlacement } from './placement'

const level = (id: string, elevation: number, height = 2700): Level => ({
  id,
  name: id === 'n0' ? 'Rez-de-chaussée' : 'Étage 1',
  elevation,
  height,
  slabThickness: 200,
})
const GROUND = level('n0', 0)
const UPPER = level('n1', 2700)

const stairOn = (shape: StairElement['shape'], lengths: { length: number; length2?: number; gap?: number }) => ({
  ...createStairElement('Escalier 1', shape, 0, 0, lengths),
  levelId: 'n0',
})

describe('pose d’un escalier', () => {
  it('centré sur le curseur, avec des longueurs qui suffisent', () => {
    const stair = planStairPlacement([GROUND, UPPER], 'n0', 'straight', { x: 5000, y: 4000 }, null, 'Escalier 1')!
    expect(stair.length).toBe(3500)
    expect(stair.x).toBe(4500) // emmarchement 1000 centré sur 5000
    expect(stair.y).toBe(4000 - 1750)
  })

  it('aimanté à la grille', () => {
    const stair = planStairPlacement([GROUND, UPPER], 'n0', 'straight', { x: 5030, y: 4020 }, 100, 'E')!
    expect((stair.x + 500) % 100).toBe(0)
    expect((stair.y + 1750) % 100).toBe(0)
  })

  it('refusée sur le dernier niveau', () => {
    expect(planStairPlacement([GROUND, UPPER], 'n1', 'straight', { x: 0, y: 0 }, null, 'E')).toBeNull()
    expect(planStairPlacement([GROUND], 'n0', 'u', { x: 0, y: 0 }, null, 'E')).toBeNull()
    expect(planStairPlacement(undefined, null, 'l', { x: 0, y: 0 }, null, 'E')).toBeNull()
  })
})

describe('hauteur d’étage et escaliers', () => {
  it('passer la hauteur d’étage de 2 700 à 2 880 mm remonte le niveau du dessus : 16 contremarches', () => {
    const levels = updateLevel([GROUND, UPPER], 'n0', { height: 2880 })
    expect(levels.find((l) => l.id === 'n1')!.elevation).toBe(2880)
    const building = computeBuildingMeasurements({
      elements: [{ ...stairOn('straight', { length: 3500 }) }],
      levels: [...levels],
    })
    expect(building.levels[0].measurements.stairs[0].risers).toBe(16)
  })

  it('un niveau du dessus placé à la main n’est pas déplacé', () => {
    const detached = level('n1', 3000)
    const levels = updateLevel([GROUND, detached], 'n0', { height: 2880 })
    expect(levels.find((l) => l.id === 'n1')!.elevation).toBe(3000)
  })
})

describe('métrés des escaliers', () => {
  it('2 700 mm : 15 contremarches de 180 mm, 14 girons de 250 mm, emmarchement 1000 mm', () => {
    const building = computeBuildingMeasurements({
      elements: [stairOn('straight', { length: 3500 })],
      levels: [GROUND, UPPER],
    })
    const [stair] = building.total.stairs
    expect(stair).toMatchObject({
      risers: 15,
      treads: 14,
      riserHeight: 180,
      treadDepth: 250,
      width: 1000,
      status: 'ok',
    })
  })

  it('trop court : 3500 mm nécessaires', () => {
    const building = computeBuildingMeasurements({
      elements: [stairOn('straight', { length: 3000 })],
      levels: [GROUND, UPPER],
    })
    expect(building.total.stairs[0]).toMatchObject({ status: 'too-short', requiredRun: 3500 })
  })

  it('niveau du dessus supprimé : l’escalier reste, sans marches', () => {
    const building = computeBuildingMeasurements({
      elements: [stairOn('straight', { length: 3500 })],
      levels: [GROUND],
    })
    expect(building.total.stairs[0]).toMatchObject({ status: 'no-level-above', risers: null })
  })

  it('CSV : tableau « Escaliers » avec les remarques', () => {
    const elements = [stairOn('straight', { length: 3500 }), { ...stairOn('l', { length: 1000, length2: 1000 }), name: 'Escalier 2' }]
    const building = computeBuildingMeasurements({ elements, levels: [GROUND, UPPER] })
    const csv = measurementsToCsv(building, fr.measurements.csv)
    expect(csv).toContain('Escaliers')
    expect(csv).toContain('Rez-de-chaussée;Escalier 1;Droit;1000;15;180;14;250;')
    expect(csv).toContain('Escalier 2;En L;1000;15;180;14;143;Trop court : 3500 mm nécessaires')
  })
})

describe('escalier en 3D', () => {
  const doc = (stair: StairElement) => ({ elements: [stair], levels: [GROUND, UPPER] })

  it('droit : 14 marches qui montent de 180 mm chacune', () => {
    const model = buildBuildingModel(doc(stairOn('straight', { length: 3500 })))
    expect(model.steps).toHaveLength(14)
    const tops = model.steps.map((s) => s.size.y)
    expect(tops[0]).toBe(180)
    expect(tops[13]).toBe(2520)
    tops.slice(1).forEach((top, i) => expect(top - tops[i]).toBeCloseTo(180))
    expect(model.steps.every((s) => s.size.x === 1000 && s.size.z === 250)).toBe(true)
    expect(model.bounds!.max.y).toBe(2520)
  })

  it('en L : un palier compte pour une marche, la dernière arrive à hauteur du plancher du dessus', () => {
    const model = buildBuildingModel(doc(stairOn('l', { length: 1750, length2: 1750 })))
    expect(model.steps).toHaveLength(15) // 14 girons + le palier
    expect(Math.max(...model.steps.map((s) => s.size.y))).toBeCloseTo(2700)
  })

  it('suit la position et la rotation de l’escalier', () => {
    const base = stairOn('straight', { length: 3500 })
    const turned = buildBuildingModel(doc({ ...base, x: 1000, y: 2000, rotation: 90 }))
    expect(turned.steps[0].rotationY).toBeCloseTo(-Math.PI / 2)
    expect(turned.steps[0].sourceId).toBe(base.id)
  })

  it('sans niveau au-dessus : pas de marches', () => {
    const model = buildBuildingModel({ elements: [stairOn('straight', { length: 3500 })], levels: [GROUND] })
    expect(model.steps).toHaveLength(0)
  })

  it('un escalier masqué n’apparaît pas', () => {
    expect(buildBuildingModel(doc({ ...stairOn('straight', { length: 3500 }), hidden: true })).steps).toHaveLength(0)
  })
})

describe('escalier : sélection et historique', () => {
  const store = () => useEditorStore.getState()

  beforeEach(() => {
    store().loadProject(createPlanProject('Maison'))
  })

  it('l’outil Escalier n’existe que dans un plan', () => {
    store().setTool('stair')
    expect(store().activeTool).toBe('stair')
  })

  it('Maj + R : tourne autour du centre de son emprise', () => {
    const stair = stairOn('straight', { length: 3500 })
    const before = elementBounds(stair)!
    const [turned] = rotateSelectionQuarterTurn([stair])
    const after = elementBounds(turned)!
    expect([after.width, after.height]).toEqual([3500, 1000])
    expect(after.x + after.width / 2).toBeCloseTo(before.x + before.width / 2)
    expect(after.y + after.height / 2).toBeCloseTo(before.y + before.height / 2)
  })
})
