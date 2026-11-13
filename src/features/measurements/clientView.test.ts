import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { fr } from '../../i18n/fr'
import { createRoofElement } from '../documents/elements'
import { buildClientTables, hasLivingAreaDifference, roomDimensionsText } from './clientView'
import { measurementsToCsv, measurementsToFlatCsv } from './csv'
import { buildExecutionTables } from './executionView'
import { axisAlignedRectangle, computeBuildingMeasurements } from './measurements'
import { cellText } from './tables'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const L0 = { id: 'L0', name: 'Rez', elevation: 0, height: 2700, slabThickness: 200 }
const room = (name: string, points: number[]): RoomElement => ({
  ...BASE, id: name, name, type: 'room', points, fill: '#0a0', showLabel: true, levelId: 'L0',
})
const wall: WallElement = {
  ...BASE, id: 'w', name: 'Mur', type: 'wall', points: [0, 0, 4000, 0], thickness: 200, height: 2500, fill: '#444', levelId: 'L0',
}
const opening = (id: string, kind: OpeningElement['kind']): OpeningElement => ({
  ...BASE, id, name: id, type: 'opening', kind, wallId: 'w', segmentIndex: 0, offset: 2000,
  width: 900, height: 2100, sillHeight: 0, hinge: 'start', side: 'left', levelId: 'L0',
})
const build = (elements: CanvasElement[]) => buildClientTables(computeBuildingMeasurements({ levels: [L0], elements }), fr.measurements.client)

describe('présentation Client', () => {
  it('une chambre de 4000 × 3000 : nom, dimensions, périmètre, hauteur sous plafond et 12,00 m²', () => {
    const tables = build([room('Chambre', [0, 0, 4000, 0, 4000, 3000, 0, 3000])])
    const rooms = tables.find((t) => t.id === 'client-rooms')
    expect(rooms?.rows[0].map(cellText)).toEqual(['Rez', 'Chambre', '4000 × 3000', '14000', '2500', '12,00'])
    expect(rooms?.total?.map(cellText)).toEqual(['Total', '', '', '', '', '12,00'])
  })

  it('aucune épaisseur ni surface de mur dans la version Client', () => {
    const tables = build([wall, room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000])])
    const headers = tables.flatMap((t) => t.columns.map((c) => c.header.toLowerCase()))
    expect(headers.some((h) => h.includes('épaisseur') || h.includes('mur') || h.includes('volume'))).toBe(false)
    expect(tables.map((t) => t.id)).toEqual(['client-rooms', 'ceilings', 'client-levels'])
  })

  it('compte les portes et les fenêtres par niveau et pour le bâtiment', () => {
    const tables = build([wall, opening('p', 'door'), opening('f', 'window'), opening('g', 'window')])
    const levels = tables.find((t) => t.id === 'client-levels')
    expect(levels?.rows[0].map(cellText)).toEqual(['Rez', '0,00', '1', '2', '0'])
    expect(levels?.total?.map(cellText)).toEqual(['Bâtiment', '0,00', '1', '2', '0'])
  })

  it('une pièce qui n\'est pas un rectangle n\'a pas de dimensions', () => {
    expect(axisAlignedRectangle([0, 0, 4000, 0, 4000, 3000, 0, 3000])).toEqual([4000, 3000])
    expect(axisAlignedRectangle([0, 0, 4000, 0, 4000, 3000])).toBeNull()
    expect(axisAlignedRectangle([0, 0, 4000, 500, 4000, 3000, 0, 3000])).toBeNull()
    expect(roomDimensionsText(null)).toBe('')
  })

  it('une pièce en forme libre affiche « forme libre » dans la cellule des dimensions', () => {
    const tables = build([room('Salon', [0, 0, 4000, 0, 4000, 3000, 2000, 3000, 2000, 5000, 0, 5000])])
    const rooms = tables.find((t) => t.id === 'client-rooms')
    expect(cellText(rooms?.rows[0][2] ?? '')).toBe('forme libre')
  })

  it('un nom vide devient « Pièce 1 », « Pièce 2 » par niveau ; des noms identiques sont gardés', () => {
    const L1 = { ...L0, id: 'L1', name: 'Étage', elevation: 2900 }
    const sq = [0, 0, 2000, 0, 2000, 2000, 0, 2000]
    const building = computeBuildingMeasurements({
      levels: [L0, L1],
      elements: [
        { ...room('a', sq), name: '' },
        { ...room('b', sq), name: 'Chambre' },
        { ...room('c', sq), name: 'Chambre' },
        { ...room('d', sq), name: '   ' },
        { ...room('e', sq), name: '', levelId: 'L1' },
      ],
    })
    const rooms = buildClientTables(building, fr.measurements.client).find((t) => t.id === 'client-rooms')
    expect(rooms?.rows.map((r) => cellText(r[1]))).toEqual(['Pièce 1', 'Chambre', 'Chambre', 'Pièce 2', 'Pièce 1'])
  })

  it('un niveau sans pièce ni ouverture est absent du récapitulatif Client, mais reste en Exécution', () => {
    const L1 = { ...L0, id: 'L1', name: 'Étage', elevation: 2900 }
    const building = computeBuildingMeasurements({
      levels: [L0, L1],
      elements: [room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000])],
    })
    const client = buildClientTables(building, fr.measurements.client).find((t) => t.id === 'client-levels')
    expect(client?.rows.map((r) => cellText(r[0]))).toEqual(['Rez'])
    const execution = buildExecutionTables(building, fr.measurements.csv, [], fr.measurements.execution)
    expect(JSON.stringify(execution)).toContain('Étage')
  })

  it('un seul niveau exporté : la ligne de total dit « Total du niveau »', () => {
    const building = computeBuildingMeasurements({ levels: [L0], elements: [room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000])] })
    const levels = buildClientTables(building, fr.measurements.client, 'level').find((t) => t.id === 'client-levels')
    expect(cellText(levels?.total?.[0] ?? '')).toBe('Total du niveau')
  })

  it('le total du bâtiment est la somme des niveaux', () => {
    const L1 = { ...L0, id: 'L1', name: 'Étage', elevation: 2900 }
    const upper = { ...room('Suite', [0, 0, 2000, 0, 2000, 2000, 0, 2000]), levelId: 'L1' }
    const building = computeBuildingMeasurements({ levels: [L0, L1], elements: [room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000]), upper] })
    const levels = buildClientTables(building, fr.measurements.client).find((t) => t.id === 'client-levels')
    expect(levels?.total?.map(cellText)[1]).toBe('16,00')
  })
})

describe('présentation Exécution', () => {
  it('garde tous les tableaux détaillés et ajoute les règles de calcul à la fin', () => {
    const building = computeBuildingMeasurements({
      levels: [L0],
      elements: [wall, opening('p', 'door'), room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000])],
    })
    const tables = buildExecutionTables(building, fr.measurements.csv, [], fr.measurements.execution)
    const ids = tables.map((t) => t.id)
    expect(ids).toContain('walls')
    expect(ids).toContain('openings')
    expect(ids[ids.length - 1]).toBe('rules')
    const rules = tables[tables.length - 1].rows.map((row) => cellText(row[0]))
    expect(rules.some((rule) => rule.includes('déduites') && rule.includes('sans seuil'))).toBe(true)
    expect(rules.some((rule) => rule.includes('menuisier'))).toBe(true)
    expect(rules.some((rule) => rule.includes('Repères valables à la date du document'))).toBe(true)
  })

  it('la mention des repères est dans la note Technique, pas dans la version Client', () => {
    const technical = fr.measurements.csv.meta?.noteValue ?? ''
    expect(technical).toContain('Repères valables à la date du document')
    expect(fr.measurements.client.pdfNote).not.toContain('Repères')
  })

  it('aucun prix, montant ni devis dans les deux versions', () => {
    const building = computeBuildingMeasurements({ levels: [L0], elements: [wall, room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000])] })
    const all = [
      ...buildClientTables(building, fr.measurements.client),
      ...buildExecutionTables(building, fr.measurements.csv, [], fr.measurements.execution),
    ]
    const text = all.flatMap((t) => [t.title, ...t.columns.map((c) => c.header), ...t.rows.flat().map(cellText)]).join(' ').toLowerCase()
    expect(/prix|devis|montant|€|ariary/.test(text.replace('aucun prix ni devis', ''))).toBe(false)
  })

  it('la version Client en CSV ne contient ni murs ni volumes', () => {
    const building = computeBuildingMeasurements({ levels: [L0], elements: [wall, room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000])] })
    const csv = measurementsToCsv(building, fr.measurements.csv, [], undefined, buildClientTables(building, fr.measurements.client))
    expect(csv).toContain('Vos pièces')
    expect(csv).toContain('Salon;4000 × 3000;14000;2500;12,00')
    expect(csv).not.toContain('Murs')
    expect(csv).not.toContain('Volume')
  })
})

describe('tableau Plafonds', () => {
  const chambre = room('Chambre', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
  const floors = [
    { ...L0, height: 2850 },
    { id: 'L1', name: 'Étage', elevation: 2850, height: 2700, slabThickness: 200 },
  ]
  const building = (elements: CanvasElement[]) => computeBuildingMeasurements({ levels: floors, elements })

  it('une chambre de 4000 × 3000 sous une dalle à +2650 : 12,00 m² et 2650 mm, en Client et en Technique', () => {
    const b = building([chambre])
    const client = buildClientTables(b, fr.measurements.client).find((t) => t.id === 'ceilings')
    const technical = buildExecutionTables(b, fr.measurements.csv, [], fr.measurements.execution).find(
      (t) => t.id === 'ceilings',
    )
    for (const table of [client, technical]) {
      expect(table?.title).toBe('Plafonds')
      expect(table?.rows[0].map(cellText)).toEqual(['Rez', 'Chambre', '12,00', '2650', '14000'])
      expect(table?.total?.map(cellText)).toEqual(['Total', '', '12,00', '', ''])
    }
  })

  it('un faux plafond ajoute une ligne sans changer le total ; une pièce sans l’option ne change pas', () => {
    const plain = buildClientTables(building([chambre]), fr.measurements.client).find((t) => t.id === 'ceilings')!
    const withFalse = buildClientTables(building([{ ...chambre, falseCeiling: true }]), fr.measurements.client).find(
      (t) => t.id === 'ceilings',
    )!
    expect(plain.rows).toHaveLength(1)
    expect(withFalse.rows).toHaveLength(2)
    expect(withFalse.rows[1].map(cellText)).toEqual(['Rez', 'Chambre – faux plafond', '12,00', '', ''])
    expect(withFalse.total?.map(cellText)).toEqual(plain.total?.map(cellText))
  })

  it('pas de pièce : pas de tableau Plafonds', () => {
    expect(buildClientTables(building([wall]), fr.measurements.client).some((t) => t.id === 'ceilings')).toBe(false)
  })

  it('le CSV à plat donne la hauteur sous plafond et le faux plafond', () => {
    const csv = measurementsToFlatCsv(building([{ ...chambre, falseCeiling: true }]), fr.measurements.csv)
    expect(csv).toContain('Hauteur sous plafond')
    expect(csv).toContain('Faux plafond')
  })
})

describe('surface habitable dans la version Client', () => {
  const ATTIC = { id: 'L2', name: 'Combles', elevation: 2900, height: 1000, slabThickness: 200 }
  const rect = [0, 0, 8000, 0, 8000, 6000, 0, 6000]
  const attic = (pitch: number): CanvasElement[] => [
    { ...room('Chambre', rect), levelId: 'L2' },
    { ...createRoofElement('Toit', rect, 'gable'), pitch, overhang: 0, levelId: 'L2' },
  ]
  const buildAttic = (pitch: number) =>
    computeBuildingMeasurements({ levels: [L0, ATTIC], elements: attic(pitch) })

  it('sans pièce basse, la colonne n’apparaît pas : les tableaux sont inchangés', () => {
    const tables = build([room('Chambre', [0, 0, 4000, 0, 4000, 3000, 0, 3000])])
    const rooms = tables.find((t) => t.id === 'client-rooms')
    expect(rooms?.columns.map((c) => c.header)).not.toContain(fr.measurements.client.livingArea)
    expect(hasLivingAreaDifference(computeBuildingMeasurements({ levels: [L0], elements: [room('C', rect)] }))).toBe(false)
  })

  it('sous un toit à 45° : la colonne apparaît dans « Vos pièces » et dans le récapitulatif', () => {
    const tables = buildClientTables(buildAttic(45), fr.measurements.client)
    const rooms = tables.find((t) => t.id === 'client-rooms')!
    expect(rooms.columns.at(-1)?.header).toBe(fr.measurements.client.livingArea)
    // 48 m² au sol, 2 bandes de 8000 × 1000 mm sous 1800 mm : 32 m² habitables.
    expect(rooms.rows[0].map(cellText).slice(-2)).toEqual(['48,00', '32,00'])
    expect(rooms.total?.map(cellText).slice(-2)).toEqual(['48,00', '32,00'])
    const levels = tables.find((t) => t.id === 'client-levels')!
    expect(levels.columns.map((c) => c.header)).toContain(fr.measurements.client.livingArea)
    expect(levels.total?.map(cellText)).toEqual(['Bâtiment', '48,00', '32,00', '0', '0', '0'])
  })

  it('le CSV Client contient la colonne quand elle s’affiche', () => {
    const building = buildAttic(45)
    const csv = measurementsToCsv(building, fr.measurements.csv, [], undefined, buildClientTables(building, fr.measurements.client))
    expect(csv).toContain(fr.measurements.client.livingArea)
    expect(csv).toContain('32,00')
  })

  it('le total du bâtiment additionne les surfaces habitables de tous les niveaux', () => {
    const elements: CanvasElement[] = [room('Salon', [0, 0, 4000, 0, 4000, 3000, 0, 3000]), ...attic(45)]
    const building = computeBuildingMeasurements({ levels: [L0, ATTIC], elements })
    expect(building.total.totals.roomHabitableArea / 1_000_000).toBeCloseTo(12 + 32, 4)
  })
})
