import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { fr } from '../../i18n/fr'
import { buildClientTables, roomDimensionsText } from './clientView'
import { measurementsToCsv } from './csv'
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
    expect(tables.map((t) => t.id)).toEqual(['client-rooms', 'client-levels'])
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
