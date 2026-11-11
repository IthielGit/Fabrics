import { describe, expect, it } from 'vitest'
import type { RoofElement } from '../../types/document'
import { createRoofElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { fr } from '../../i18n/fr'
import { measurementsToCsv, measurementsToFlatCsv } from './csv'
import { computeBuildingMeasurements, computeMeasurements } from './measurements'
import { buildMetresTables } from './tables'

const ground = createLevel('Rez', 0, 2500, 200)
const RECT = [0, 0, 8000, 0, 8000, 6000, 0, 6000]

function roof(partial: Partial<RoofElement> = {}): RoofElement {
  return { ...createRoofElement('Toiture 1', RECT), levelId: ground.id, ...partial }
}

const m2 = (mm2: number) => Math.round(mm2 / 10_000) / 100

describe('métrés des toitures', () => {
  it('deux pans 8000 × 6000, 35°, débord 500 : 76,91 m², faîtage 9000, égouts 18000, 2 pignons', () => {
    const [measure] = computeMeasurements([roof()]).roofs
    expect(measure).toMatchObject({ name: 'Toiture 1', shape: 'gable', pitch: 35, overhang: 500, gableCount: 2 })
    expect(m2(measure.realArea)).toBe(76.91)
    expect(m2(measure.projectedArea)).toBe(63)
    expect(measure.ridgeLength).toBe(9000)
    expect(measure.eaveLength).toBe(18000)
    expect(measure.problem).toBeNull()
  })

  it('croupe : faîtage 2000, égout 32000, aucun pignon, arêtiers comptés', () => {
    const [measure] = computeMeasurements([roof({ shape: 'hip' })]).roofs
    expect(m2(measure.realArea)).toBe(76.91)
    expect(measure.ridgeLength).toBe(2000)
    expect(measure.eaveLength).toBe(32000)
    expect(measure.gableCount).toBe(0)
    expect(measure.hipLength).toBeGreaterThan(0)
  })

  it('toit plat : pas de pente, surface du contour', () => {
    const [measure] = computeMeasurements([roof({ shape: 'flat', overhang: 0 })]).roofs
    expect(measure.pitch).toBeNull()
    expect(m2(measure.realArea)).toBe(48)
  })

  it('une toiture non valable est listée avec des quantités nulles et la raison', () => {
    const [measure] = computeMeasurements([roof({ points: [0, 0, 8000, 0, 7000, 6000, 1000, 6000] })]).roofs
    expect(measure.problem).toBe('not-rectangle')
    expect(measure.realArea).toBe(0)
  })

  it('totaux du niveau et du bâtiment', () => {
    const building = computeBuildingMeasurements({
      elements: [roof(), roof({ id: 'r2', name: 'Toiture 2', shape: 'hip' })],
      levels: [ground],
    })
    const t = building.total.totals
    expect(m2(t.roofRealArea)).toBe(153.82)
    expect(t.roofRidgeLength).toBe(11000)
    expect(t.roofEaveLength).toBe(50000)
    expect(t.roofGables).toBe(2)
  })
})

describe('tableau « Toitures » des exports', () => {
  const building = computeBuildingMeasurements({ elements: [roof()], levels: [ground] })

  it('le CSV a un tableau des toitures, sans aucun prix', () => {
    const csv = measurementsToCsv(building, fr.measurements.csv)
    expect(csv).toContain('Toitures')
    expect(csv).toContain('Rez;Toiture 1;Deux pans;35,0;500;63,00;76,91;9000;18000;0;2;')
    expect(csv.toLowerCase()).not.toContain('prix (')
    expect(csv).not.toContain('€')
  })

  it('le tableau a une ligne de total', () => {
    const table = buildMetresTables(building, fr.measurements.csv).find((t) => t.id === 'roofs')
    expect(table?.total).toBeDefined()
    expect(table?.columns.map((c) => c.header)).toContain('Surface réelle (m²)')
  })

  it('le CSV « données à plat » a une ligne par grandeur de la toiture', () => {
    const flat = measurementsToFlatCsv(building, fr.measurements.csv)
    expect(flat).toContain('Rez;Toiture;Toiture 1;;Surface réelle;')
    expect(flat).toContain(';Pente;35,0;°')
    expect(flat).toContain(';Pignons;2;nombre')
  })
})
