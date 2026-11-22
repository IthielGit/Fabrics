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
import { getRoofSegmentDeckReach } from '@pascal-app/core'
import { fixtureBuildingScene, type FixtureSpec } from './fixturePlan'
import { pascalLevelSymbols, pascalRoofStairSymbols } from './view/levelPlanSymbols'
import { pascalRoofPlan } from './view/roofPlanData'
import { roofPlanDrawing } from '../building/views/roofPlan'
import { roofChains } from '../dimensioning/roofChains'
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
    // L'escalier du RDC reste un seul nœud, dans le RDC (le R+1 n'a que l'escalier d'accès au toit).
    const stairs = Object.values(scene.nodes).filter((n) => n.type === 'stair')
    expect(stairs.map((n) => [n.name, n.parentId]).sort()).toEqual([
      ['ESC', 'level_RDC'],
      ['ESC_TOIT', 'level_R1'],
    ])
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

  it('toiture native de Pascal (D20-13 : A) : 4 pans à 1 %, débord 300 mm, contour du R+1 sans le balcon', () => {
    const segs = Object.values(scene.nodes).filter((n) => n.type === 'roof-segment') as unknown as {
      position: [number, number, number]; rotation: number; width: number; depth: number; pitch: number; roofType: string
    }[]
    expect(segs).toHaveLength(4)
    for (const seg of segs) {
      expect(seg.roofType).toBe('shed')
      expect(Math.tan((seg.pitch * Math.PI) / 180) * 100).toBeCloseTo(1, 9)
      const reach = getRoofSegmentDeckReach(seg as never)
      expect(reach.x).toBeCloseTo(0.3, 9)
      expect(reach.z).toBeCloseTo(0.3, 9)
    }
    // Emprise du toit (débords compris) : 15072 × 13072 mm, de (−300, −300) à (14772, 12772).
    const corners = segs.flatMap((seg) => {
      const across = Math.abs(Math.sin(seg.rotation)) < 0.5
      const hx = (across ? seg.width : seg.depth) / 2 + 0.3
      const hz = (across ? seg.depth : seg.width) / 2 + 0.3
      return [[seg.position[0] - hx, seg.position[2] - hz], [seg.position[0] + hx, seg.position[2] + hz]]
    })
    const mm = (v: number) => Math.round(v * 1000)
    expect([mm(Math.min(...corners.map((c) => c[0]))), mm(Math.min(...corners.map((c) => c[1]))), mm(Math.max(...corners.map((c) => c[0]))), mm(Math.max(...corners.map((c) => c[1])))]).toEqual([-300, -300, 14772, 12772])
  })

  it('escalier d’accès au toit (D20-11 : A) : escalier de Pascal sur le balcon, 2340 × 6389 mm, monte de 3000 mm', () => {
    const stair = Object.values(scene.nodes).find((n) => n.type === 'stair' && n.name === 'ESC_TOIT')!
    expect(stair.parentId).toBe('level_R1')
    const rise = (stair.children ?? []).reduce((sum, id) => sum + ((scene.nodes[id] as { height?: number }).height ?? 0), 0)
    expect(Math.round(rise * 1000)).toBe(3000)
    const lines = pascalLevelSymbols(scene.nodes, 'R1')!.lines.filter((l) => Math.min(l.x1, l.x2) > 11900 && Math.max(l.y1, l.y2) < 6500)
    const xs = lines.flatMap((l) => [l.x1, l.x2])
    const ys = lines.flatMap((l) => [l.y1, l.y2])
    expect([Math.round(Math.min(...xs)), Math.round(Math.max(...xs)), Math.round(Math.min(...ys)), Math.round(Math.max(...ys))]).toEqual([11981, 14321, 0, 6389])
  })

  it('plan de toiture lu dans les pans : contour réuni à 10 sommets, deux flèches « Pente 1 % » (nord et ouest), escalier d’accès', () => {
    const plan = pascalRoofPlan(scene.nodes, 'R1')!
    expect(plan.outlines).toHaveLength(1)
    expect(plan.outlines[0].holes).toEqual([])
    const ring = plan.outlines[0].outer.map(([x, y]) => [Math.round(x), Math.round(y)])
    const unique = ring.filter((p, i) => i === 0 || p[0] !== ring[0][0] || p[1] !== ring[0][1])
    expect(unique.map((p) => p.join(',')).sort()).toEqual(
      ['4204,-300', '11981,-300', '11981,6388', '14772,6388', '14772,11778', '5004,11778', '5004,12772', '-300,12772', '-300,1370', '4204,1370'].sort(),
    )
    const arrows = plan.slopes.map((s) => [Math.round(s.dx), Math.round(s.dy), Math.round(s.percent * 1000) / 1000]).sort()
    expect(arrows).toEqual([[-1, 0, 1], [0, -1, 1]].sort())
    const stair = pascalRoofStairSymbols(scene.nodes, 'R1')!
    expect(stair.lines.length).toBeGreaterThan(10)
    // L'escalier du RDC monte au R+1, pas au toit : il n'est jamais un escalier d'accès au toit.
    expect(pascalRoofStairSymbols(scene.nodes, 'RDC')).toBeNull()
    const drawing = roofPlanDrawing(plan, { slope: fr.views.roofSlope }, 125, [stair])!
    expect(drawing.texts.map((t) => t.text)).toEqual(['Pente 1 %', 'Pente 1 %'])
    expect(drawing.texts.some((t) => /m²/.test(t.text))).toBe(false)
  })

  it('cotes du plan de toiture = page 7 de la référence (cm → mm) : 450 · 778 · 279 et 1507 en haut, 167 · 1140 et 1307 à gauche…', () => {
    const plan = pascalRoofPlan(scene.nodes, 'R1')!
    const dims = roofChains(plan.outlines)
    const side = (s: string) =>
      dims.filter((d) => d.id.startsWith(`roof-${s}-`)).map((d) => Math.round(Math.hypot(d.points[2] - d.points[0], d.points[3] - d.points[1]) / 10))
    // La référence arrondit au cm : 4504 → 450, 7777 → 778, 2791 → 279, 15072 → 1507.
    expect(side('top')).toEqual([450, 778, 279, 1507])
    expect(side('bottom')).toEqual([530, 977, 1507])
    expect(side('left')).toEqual([167, 1140, 1307])
    expect(side('right')).toEqual([669, 539, 99, 1307])
  })
})
