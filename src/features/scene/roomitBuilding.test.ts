/**
 * M20 20.1b étape 2 — la Villa ROOMIT à deux niveaux (ROOMIT-RDC + ROOMIT-R1) dans une seule scène
 * Pascal : le plan du R+1 se dessine par la même chaîne que le RDC, et l'escalier qui monte du RDC
 * est dessiné sur le plan du R+1, comme sur la page 6 de la référence.
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing } from '../building/views/drawing'
import { levelAreaTable } from '../building/views/areaTable'
import { fr } from '../../i18n/fr'
import { planOverlay } from '../dimensioning/planOverlay'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { fixtureBuildingScene, type FixtureSpec } from './fixturePlan'
import { pascalLevelSymbols } from './view/levelPlanSymbols'
import { sceneToFabricsView } from './view/toFabricsView'
import type { SceneNodeData } from './sceneTypes'

const m2 = (mm2: number) => Math.round(mm2 / 1e4) / 100
const specs = [rdc, r1] as unknown as FixtureSpec[]
const scene = fixtureBuildingScene(specs)
const view = sceneToFabricsView(scene)
const metres = computeBuildingMeasurements(view)

const STAIR_BOX = [8400, 2690, 11500, 4650]
const inBox = (l: { x1: number; y1: number; x2: number; y2: number }) =>
  [l.x1, l.x2].every((x) => x >= STAIR_BOX[0] && x <= STAIR_BOX[2]) && [l.y1, l.y2].every((y) => y >= STAIR_BOX[1] && y <= STAIR_BOX[3])

describe('Villa ROOMIT, RDC + R+1 dans une seule scène', () => {
  it('deux niveaux empilés : RDC à 0 mm, R+1 à 3000 mm', () => {
    expect(view.levels!.map((l) => [l.name, l.elevation])).toEqual([
      ['RDC', 0],
      ['R+1', 3000],
    ])
  })

  it('les surfaces de chaque niveau sont celles des exemples seuls', () => {
    const total = (id: string) => m2(metres.levels.find((l) => l.level.id === id)!.measurements.rooms.reduce((s, r) => s + r.area, 0))
    expect(total('RDC')).toBe(rdc.expected.roomsTotal_m2)
    expect(total('R1')).toBe(r1.expected.roomsTotal_m2)
  })

  it('l’escalier qui monte du RDC est dessiné sur le plan du R+1 (mêmes traits que sur le RDC)', () => {
    const below = pascalLevelSymbols(scene.nodes, 'RDC')!.lines.filter(inBox)
    const above = pascalLevelSymbols(scene.nodes, 'R1')!.lines.filter(inBox)
    expect(below.length).toBeGreaterThan(10)
    expect(above.length).toBe(below.length)
    // L'escalier reste un seul nœud, dans le RDC.
    const stairs = Object.values(scene.nodes).filter((n) => n.type === 'stair')
    expect(stairs).toHaveLength(1)
  })

  it('un escalier qui ne monte pas jusqu’au niveau du dessus n’y est pas dessiné', () => {
    const nodes: Record<string, SceneNodeData> = { ...scene.nodes }
    for (const n of Object.values(nodes)) {
      if (n.type === 'stair-segment') nodes[n.id] = { ...n, height: 0.1 } as SceneNodeData
    }
    expect(pascalLevelSymbols(nodes, 'R1')!.lines.filter(inBox)).toHaveLength(0)
  })

  it('plan du R+1 en Exécution : repères des baies, surfaces des pièces, 21 poteaux', () => {
    const level = view.levels!.find((l) => l.id === 'R1')!
    const symbols = pascalLevelSymbols(scene.nodes, 'R1')
    const drawing = levelPlanDrawing(buildBuildingModel(view), level, 125, (f) => planOverlay(view, 'R1', 'execution', EXECUTION_LABELS, f), symbols)!
    const texts = drawing.texts.map((t) => t.text)
    expect(texts).toContain('PP: 2000 x 2100')
    expect(texts).toContain('PP: 1500 x 2100')
    expect(texts).toContain('All. 800')
    expect(texts).toContain('Balcon')
    expect(texts).toContain('18,63 m²')
    expect(texts).toContain('5,65 m²')
    expect(symbols!.cutPolygons).toHaveLength(21)
  })

  it('tableau « Pièces Niveau R+1 » : 11 pièces lues dans les métrés, total 144,36 m² balcon compris', () => {
    const level = metres.levels.find((l) => l.level.id === 'R1')!
    const table = levelAreaTable(level.measurements, 'R+1', fr.views.areaTable)!
    expect(table.title).toBe('Pièces Niveau R+1')
    expect(table.rows).toHaveLength(11)
    expect(table.rows).toContainEqual(['Balcon', '18,63 m²'])
    expect(table.rows).toContainEqual(['Suite parentale', '20,16 m²'])
    expect(table.total).toEqual(['Niveau R+1', '144,36 m²'])
  })
})
