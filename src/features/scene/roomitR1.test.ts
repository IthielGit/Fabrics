/**
 * M20 20.1b — exemple ROOMIT-R1 : le R+1 de la Villa ROOMIT (page 6 du dossier de référence de
 * l'utilisateur), relevé au mm dans le PDF vectoriel, passé par la scène Pascal. Les surfaces des
 * métrés sont comparées au tableau « Pièces Niveau R+1 » de la référence ; le total inclut le balcon
 * (D20-10 : A). Valeurs attendues : `fixtures/ROOMIT-R1/spec.json` ; relevé : `fixtures/ROOMIT-R1/README.md`.
 */
import { describe, expect, it } from 'vitest'
import spec from '../../../fixtures/ROOMIT-R1/spec.json'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { metresWarnings } from '../measurements/warnings'
import { fixtureScene, type FixtureSpec } from './fixturePlan'
import { pascalLevelSymbols } from './view/levelPlanSymbols'
import { sceneToFabricsView } from './view/toFabricsView'

const m2 = (mm2: number) => Math.round(mm2 / 1e4) / 100

const scene = fixtureScene(spec as unknown as FixtureSpec)
const view = sceneToFabricsView(scene)
const metres = computeBuildingMeasurements(view)
const level = metres.levels[0].measurements

describe('ROOMIT-R1 : R+1 de la Villa ROOMIT passé par la scène Pascal', () => {
  it('les 11 pièces, les ouvertures et les murs sont dans la scène', () => {
    const zones = Object.values(scene.nodes).filter((n) => n.type === 'zone').map((n) => n.name)
    expect(zones.sort()).toEqual(spec.rooms.map((r) => r.name).sort())
    expect(zones).toHaveLength(11)
    const openings = Object.values(scene.nodes).filter((n) => n.type === 'door' || n.type === 'window')
    expect(openings).toHaveLength(spec.openings.length)
    expect(level.walls).toHaveLength(spec.walls.length)
  })

  it.each(spec.expected.rooms)('$name : surface = $area_m2 m² (référence $reference_m2 m²)', (e) => {
    const room = level.rooms.find((r) => r.name === e.name)
    expect(room, e.name).toBeDefined()
    expect(m2(room!.area)).toBe(e.area_m2)
  })

  it('écarts avec le tableau de la référence (expliqués dans spec.json) : BAR −0,01 (arrondi), SDB 1 et 2 +0,09 (cloison de douche non déduite), Bibliothèque +0,02', () => {
    const gaps = spec.expected.rooms
      .map((e) => ({ name: e.name, gap: Math.round((e.area_m2 - e.reference_m2) * 100) / 100 }))
      .filter((g) => g.gap !== 0)
    expect(gaps).toEqual([
      { name: 'BAR', gap: -0.01 },
      { name: 'SDB 2', gap: 0.09 },
      { name: 'SDB 1', gap: 0.09 },
      { name: 'Bibliothèque', gap: 0.02 },
    ])
  })

  it('total du niveau, balcon compris (D20-10 : A) : 144,36 m² pour 144,16 m² dans la référence', () => {
    const total = level.rooms.reduce((sum, r) => sum + r.area, 0)
    expect(m2(total)).toBe(spec.expected.roomsTotal_m2)
    expect(spec.expected.roomsTotal_m2).toBe(144.36)
    expect(spec.expected.levelTotal_reference_m2).toBe(144.16)
    const balcony = level.rooms.find((r) => r.name === 'Balcon')!
    expect(m2(balcony.area)).toBe(18.63)
  })

  it('aucun avertissement de métré', () => {
    expect(metresWarnings(view, metres)).toEqual([])
  })

  it('escalier, mobilier et 21 poteaux dessinés sur le plan de niveau', () => {
    const symbols = pascalLevelSymbols(scene.nodes, spec.level.id)
    expect(symbols).not.toBeNull()
    expect(symbols!.cutPolygons).toHaveLength(spec.columns.length)
    expect(spec.columns).toHaveLength(21)
    const inside = (x: number, y: number, b: number[]) => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]
    const stairLines = symbols!.lines.filter((l) => inside(l.x1, l.y1, [8450, 2690, 11490, 4600]) && inside(l.x2, l.y2, [8450, 2690, 11490, 4600]))
    expect(stairLines.length).toBeGreaterThan(10)
  })
})
