/**
 * M20 20.3 — nomenclatures et plan de plafond de ROOMIT (RDC + R+1), tirés des métrés.
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { fr } from '../../i18n/fr'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing } from '../building/views/drawing'
import { openingSchedule, roomSchedule, scheduleDrawing } from '../building/views/schedule'
import { ceilingPlanOverlay } from '../dimensioning/ceilingPlan'
import { textConflicts } from '../dimensioning/conflicts'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { fixtureBuildingScene, type FixtureSpec } from './fixturePlan'
import { sceneToFabricsView } from './view/toFabricsView'

const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
const view = sceneToFabricsView(scene)
const building = computeBuildingMeasurements(view)
const labels = { ...fr.views.schedule, kinds: fr.measurements.csv.kinds, styles: fr.measurements.csv.styles }

describe('ROOMIT : nomenclatures', () => {
  it('menuiseries : une ligne par type identique, quantités = toutes les ouvertures des deux niveaux', () => {
    const table = openingSchedule(building, labels)!
    expect(table.header).toEqual(['Type', 'L x H (mm)', 'Allège (mm)', 'Quantité', 'Repères', 'Niveaux'])
    const total = table.rows.reduce((s, r) => s + Number(r[3]), 0)
    expect(total).toBe(rdc.openings.length + r1.openings.length)
    // Fenêtres 1500 x 1000, allège 1100 : RDC (5) et R+1 (4), une seule ligne.
    const w1500 = table.rows.find((r) => r[0].startsWith('Fenêtre') && r[1] === '1500 x 1000' && r[2] === '1100')!
    expect(w1500[3]).toBe('9')
    expect(w1500[5]).toBe('RDC, R+1')
    // Les portes d'abord, de la plus large à la plus étroite.
    expect(table.rows[0][0].startsWith('Porte')).toBe(true)
  })

  it('pièces : 12 + 11 lignes, surface et hauteur sous plafond des métrés', () => {
    const table = roomSchedule(building, labels)!
    expect(table.rows).toHaveLength(23)
    expect(table.rows).toContainEqual(['Balcon', 'R+1', '18,63 m²', '2880', 'Non'])
  })

  it('feuille des nomenclatures : deux tableaux, sans conflit de texte', () => {
    const d = scheduleDrawing([openingSchedule(building, labels), roomSchedule(building, labels)], 125)!
    expect(d.texts.map((t) => t.text)).toContain('Nomenclature des menuiseries')
    expect(d.texts.map((t) => t.text)).toContain('Nomenclature des pièces')
    expect(textConflicts(d, 50)).toEqual([])
  })
})

describe('ROOMIT : plan de plafond du R+1', () => {
  it('nom, « HSP 2880 » par pièce ; pas de mobilier ; sans conflit de texte', () => {
    const level = view.levels!.find((l) => l.id === 'R1')!
    const metres = building.levels.find((l) => l.level.id === 'R1')!.measurements
    const d = levelPlanDrawing(buildBuildingModel(view), level, 125, (f) => ceilingPlanOverlay(view, 'R1', metres, fr.views.ceiling, f))!
    const texts = d.texts.map((t) => t.text)
    expect(texts.filter((t) => t === 'HSP 2880')).toHaveLength(11)
    expect(texts).toContain('Suite parentale')
    expect(textConflicts(d, 50)).toEqual([])
  })
})
