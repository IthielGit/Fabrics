/**
 * M20 20.1a — exemple ROOMIT-RDC : le RDC de la Villa ROOMIT (page 5 du dossier de référence de
 * l'utilisateur), relevé au mm dans le PDF vectoriel, passé par la scène Pascal. Les surfaces des
 * métrés sont comparées au tableau « Pièces Niveau RDC » de la référence (écarts expliqués dans spec.json).
 * Valeurs attendues : `fixtures/ROOMIT-RDC/spec.json` ; relevé : `fixtures/ROOMIT-RDC/README.md`.
 */
import { describe, expect, it } from 'vitest'
import spec from '../../../fixtures/ROOMIT-RDC/spec.json'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing } from '../building/views/drawing'
import { pascalLevelSymbols } from './view/levelPlanSymbols'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { metresWarnings } from '../measurements/warnings'
import { fixtureScene, type FixtureSpec } from './fixturePlan'
import { sceneToFabricsView } from './view/toFabricsView'

const m2 = (mm2: number) => Math.round(mm2 / 1e4) / 100

const scene = fixtureScene(spec as unknown as FixtureSpec)
const view = sceneToFabricsView(scene)
const metres = computeBuildingMeasurements(view)
const level = metres.levels[0].measurements

describe('ROOMIT-RDC : RDC de la Villa ROOMIT passé par la scène Pascal', () => {
  it('toutes les pièces, ouvertures et murs sont dans la scène', () => {
    const zones = Object.values(scene.nodes).filter((n) => n.type === 'zone').map((n) => n.name)
    expect(zones.sort()).toEqual(spec.rooms.map((r) => r.name).sort())
    const openings = Object.values(scene.nodes).filter((n) => n.type === 'door' || n.type === 'window')
    expect(openings).toHaveLength(spec.openings.length)
    expect(level.walls).toHaveLength(spec.walls.length)
  })

  it.each(spec.expected.rooms)('$name : surface = $area_m2 m² (référence $reference_m2 m²)', (e) => {
    const room = level.rooms.find((r) => r.name === e.name)
    expect(room, e.name).toBeDefined()
    expect(m2(room!.area)).toBe(e.area_m2)
  })

  it('total des pièces (écarts avec la référence expliqués dans spec.json)', () => {
    const total = level.rooms.reduce((sum, r) => sum + r.area, 0)
    expect(m2(total)).toBe(spec.expected.roomsTotal_m2)
  })

  it('écart avec le tableau de la référence : 0 m² sauf Séjour, Dégagement (+0,20) et SDB (−0,01)', () => {
    const gaps = spec.expected.rooms
      .map((e) => ({ name: e.name, gap: Math.round((e.area_m2 - e.reference_m2) * 100) / 100 }))
      .filter((g) => g.gap !== 0)
    expect(gaps).toEqual([
      { name: 'Dégagement', gap: 0.2 },
      { name: 'Séjour', gap: 0.21 },
      { name: 'SDB', gap: -0.01 },
    ])
  })

  it('aucun avertissement de métré', () => {
    expect(metresWarnings(view, metres)).toEqual([])
  })
})

describe('ROOMIT-RDC : escaliers et mobilier de Pascal sur le plan de niveau (ADR 0007)', () => {
  const symbols = pascalLevelSymbols(scene.nodes, spec.level.id)

  it('l’escalier, les 4 objets et les poteaux donnent des traits, en mm dans le repère du plan', () => {
    expect(symbols).not.toBeNull()
    const inside = (x: number, y: number, box: [number, number, number, number]) => x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3]
    const linesIn = (box: [number, number, number, number]) => symbols!.lines.filter((l) => inside(l.x1, l.y1, box) && inside(l.x2, l.y2, box))
    // Escalier en L : emprise 8460 → 11481 × 2700 → 4590
    expect(linesIn([8450, 2690, 11490, 4600]).length).toBeGreaterThan(10)
    // Lit de la Chambre 1 (2000 × 1600 centré en 10700, 10000), en filet gris
    const bed = linesIn([9690, 9190, 11710, 10810])
    expect(bed.length).toBeGreaterThan(4)
    expect(bed.every((l) => l.muted)).toBe(true)
    // WC de la SDB-2 : masque blanc
    expect(symbols!.polygons.length).toBeGreaterThan(0)
  })

  it('le plan de niveau dessine ces traits ; les marches 3D de Fabrics ne sont plus dessinées', () => {
    const model = buildBuildingModel(view)
    const plain = levelPlanDrawing(model, view.levels![0], 125)!
    const withSymbols = levelPlanDrawing(model, view.levels![0], 125, undefined, symbols)!
    expect(withSymbols.lines.length - plain.lines.length).toBe(symbols!.lines.length)
    expect(withSymbols.polygons.length - plain.polygons.length).toBe(symbols!.polygons.length + symbols!.cutPolygons!.length)
    // 25 poteaux de 200 × 200 mm, noir plein, peints après les murs coupés
    expect(symbols!.cutPolygons).toHaveLength(spec.columns.length)
    expect(withSymbols.polygons.slice(-symbols!.cutPolygons!.length - 20).some((q) => q.fill === 'black')).toBe(true)
  })
})
