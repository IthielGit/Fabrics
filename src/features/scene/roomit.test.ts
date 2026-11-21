/**
 * M20 20.1a — exemple ROOMIT-RDC : le RDC de la Villa ROOMIT (page 5 du dossier de référence de
 * l'utilisateur), relevé au mm dans le PDF vectoriel, passé par la scène Pascal. Les surfaces des
 * métrés sont comparées au tableau « Pièces Niveau RDC » de la référence (écarts expliqués dans spec.json).
 * Valeurs attendues : `fixtures/ROOMIT-RDC/spec.json` ; relevé : `fixtures/ROOMIT-RDC/README.md`.
 */
import { describe, expect, it } from 'vitest'
import spec from '../../../fixtures/ROOMIT-RDC/spec.json'
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
