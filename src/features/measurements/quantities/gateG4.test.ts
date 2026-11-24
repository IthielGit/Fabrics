/**
 * Gate G4 (M21, 21.8) : les critères d'acceptation de `docs/03-ROADMAP.md`, réunis ici. Tout passe
 * par la scène Pascal, comme un vrai projet.
 *
 * Note (contradiction signalée à l'utilisateur) : le roadmap dit « ouverture qui dépasse du mur :
 * seule la partie dans le mur est déduite » ; la décision 1 d'EDGE-01 (2026-11-18) dit « rejet,
 * aucune surface déduite » pour une ouverture qui dépasse **en longueur**. Appliqué : la décision
 * d'EDGE-01 en longueur ; en hauteur, seule la partie dans le mur est déduite. Dans les deux cas,
 * l'élément est signalé et sa quantité n'est pas « validée ».
 */
import { describe, expect, it } from 'vitest'
import type { CanvasElement, FabricsDocument, Level } from '../../../types/document'
import { house01, house02, planDocument, spec } from '../../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../../scene/migrate/fromFabrics'
import { settleScene } from '../../scene/settle'
import { sceneToFabricsView } from '../../scene/view/toFabricsView'
import { fr } from '../../../i18n/fr'
import { computeBuildingMeasurements } from '../measurements'
import { metresWarnings } from '../warnings'
import { computeQuantities, sumQuantity } from './quantitySet'
import { buildQuantityTable } from './quantityTable'
import type { Quantity } from './status'
import type { QuantityCode } from './types'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const L = 'L0'
const levels: Level[] = [{ id: L, name: 'RDC', elevation: 0, height: 3000, slabThickness: 200 }]

function viaScene(doc: FabricsDocument) {
  const scene = settleScene(fabricsToScene(doc).scene)
  return { scene, document: sceneToFabricsView(scene) }
}

const wall = (length: number, height = 3000): CanvasElement => ({
  ...BASE, id: 'w', levelId: L, type: 'wall', name: 'M', points: [0, 0, length, 0], thickness: 200, height, fill: '#ccc', material: 'masonry',
})
const opening = (id: string, offset: number, width: number, height: number, sillHeight: number, kind: 'door' | 'window' = 'window'): CanvasElement => ({
  ...BASE, id, levelId: L, type: 'opening', name: id, kind, wallId: 'w', segmentIndex: 0, offset, width, height, sillHeight, hinge: 'start', side: 'left',
})

const value = (list: readonly Quantity[], code: QuantityCode, id: string) => list.find((q) => q.code === code && q.elementIds[0] === id)!
/** Écart relatif d'une quantité simple (D21-6 : moins de 0,1 %). */
const relative = (ours: number, expected: number) => Math.abs(ours - expected) / expected

describe('gate G4 — quantitatif automatique et traçabilité', () => {
  it('mur 5000 × 3000 × 200 mm, ouverture 900 × 2100 mm : brut 15,00 m², ouverture 1,89 m², net 13,11 m², volume net 2,622 m³', () => {
    const { document, scene } = viaScene(planDocument(levels, [wall(5000), opening('P', 2500, 900, 2100, 0, 'door')]))
    for (const list of [computeQuantities({ document, scene }).geometric, computeQuantities({ document, scene }).takeoff]) {
      expect(value(list, 'wall.grossArea', 'w').value / 1e6).toBe(15)
      expect(value(list, 'opening.area', 'P').value / 1e6).toBe(1.89)
      expect(value(list, 'wall.netArea', 'w').value / 1e6).toBe(13.11)
      expect(value(list, 'wall.netVolume', 'w').value / 1e9).toBe(2.622)
      expect(value(list, 'wall.netVolume', 'w').status).toBe('validated')
    }
  })

  it('deux ouvertures qui se chevauchent : déduction de leur union (2,70 m²), pas de la somme (3,24 m²)', () => {
    const { document, scene } = viaScene(planDocument(levels, [wall(4000), opening('a', 1400, 1200, 1350, 900), opening('b', 2200, 1200, 1350, 900)]))
    const { takeoff } = computeQuantities({ document, scene })
    expect(value(takeoff, 'wall.openingsArea', 'w').value / 1e6).toBe(2.7)
    expect(value(takeoff, 'wall.netArea', 'w').trace.union).toBe(true)
    expect(metresWarnings(document, computeBuildingMeasurements(document)).map((w) => w.kind)).toContain('openingOverlap')
  })

  it('ouverture qui dépasse du mur en hauteur : seule la partie dans le mur est déduite, l’élément est signalé', () => {
    const { document, scene } = viaScene(planDocument(levels, [wall(4000, 2500), opening('P', 2000, 900, 2700, 0, 'door')]))
    const { takeoff } = computeQuantities({ document, scene })
    expect(value(takeoff, 'opening.area', 'P')).toMatchObject({ value: 900 * 2500, status: 'provisional' })
    expect(value(takeoff, 'wall.netArea', 'w').value).toBe(4000 * 2500 - 900 * 2500)
    expect(metresWarnings(document, computeBuildingMeasurements(document)).map((w) => w.kind)).toContain('openingTooTall')
  })

  it('ouverture qui dépasse du mur en longueur : rejetée (décision EDGE-01), rien n’est déduit, l’élément est signalé', () => {
    const { document, scene } = viaScene(planDocument(levels, [wall(4000), opening('F', 300, 1200, 1350, 900)]))
    const { takeoff, summary } = computeQuantities({ document, scene })
    expect(value(takeoff, 'opening.area', 'F')).toMatchObject({ value: 0, status: 'missing_data' })
    expect(value(takeoff, 'wall.netArea', 'w').value / 1e6).toBe(12)
    expect(summary.complete).toBe(false)
    expect(metresWarnings(document, computeBuildingMeasurements(document)).map((w) => w.kind)).toContain('openingOutside')
  })

  it('tolérances : ±1 mm sur les longueurs, moins de 0,1 % sur les quantités simples (HOUSE-01)', () => {
    const s = spec('HOUSE-01')
    const { document, scene } = viaScene(house01())
    const { geometric } = computeQuantities({ document, scene })
    for (const [ref, e] of Object.entries(s.expected.walls as Record<string, { axisLength_mm?: number; grossArea_m2?: number }>)) {
      if (e.axisLength_mm === undefined) continue
      expect(Math.abs(value(geometric, 'wall.length', ref).value - e.axisLength_mm), ref).toBeLessThanOrEqual(1)
      expect(relative(value(geometric, 'wall.grossArea', ref).value / 1e6, e.grossArea_m2!), ref).toBeLessThan(0.001)
    }
    expect(relative(value(geometric, 'wall.netVolume', 'ENV').value / 1e9, s.expected.walls.ENV.volumeNet_m3)).toBeLessThan(0.001)
    expect(relative(sumQuantity(geometric, 'slab.volume') / 1e9, s.expected.slab.volume_m3)).toBeLessThan(0.001)
    for (const room of s.expected.rooms) {
      const q = geometric.find((x) => x.code === 'room.area' && x.trace.sources[0]?.name === room.name)!
      expect(relative(q.value / 1e6, room.exact_m2), room.name).toBeLessThan(0.001)
    }
  })

  it('tolérances : moins de 0,1 % sur les totaux du bâtiment (HOUSE-02)', () => {
    const b = spec('HOUSE-02').expected.building
    const { document, scene } = viaScene(house02())
    const { geometric } = computeQuantities({ document, scene })
    expect(relative(sumQuantity(geometric, 'wall.grossArea') / 1e6, b.wallsGrossArea_m2)).toBeLessThan(0.001)
    expect(relative(sumQuantity(geometric, 'wall.netArea') / 1e6, b.wallsNetArea_m2)).toBeLessThan(0.001)
    expect(relative(sumQuantity(geometric, 'wall.netVolume') / 1e9, b.wallsNetVolume_m3)).toBeLessThan(0.001)
    expect(relative(sumQuantity(geometric, 'slab.area') / 1e6, b.slabsArea_m2)).toBeLessThan(0.001)
    expect(relative(sumQuantity(geometric, 'room.netArea') / 1e6, b.roomsNet_m2)).toBeLessThan(0.001)
  })

  it.each([
    ['HOUSE-01', house01],
    ['HOUSE-02', house02],
  ])('%s : chaque quantité exportée montre ses sources, sa règle et sa version', (_name, create) => {
    const { document, scene } = viaScene(create())
    const { takeoff, summary } = computeQuantities({ document, scene })
    const table = buildQuantityTable(takeoff, fr.measurements.quantities, () => 'Niveau', summary)
    const column = (header: string) => table.columns.findIndex((c) => c.header === header)
    const c = fr.measurements.quantities.columns
    for (const row of table.rows) {
      expect(row[column(c.sources)]).not.toBe('')
      expect(row[column(c.rule)]).toMatch(/^takeoff\./)
      expect(row[column(c.version)]).toBe('fr-2026.1')
      expect(row[column(c.formula)]).not.toBe('')
      expect(row[column(c.status)]).not.toBe('')
    }
    expect(table.rows.length).toBe(takeoff.length)
  })
})
