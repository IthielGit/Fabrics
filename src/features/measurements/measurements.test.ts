import { describe, expect, it } from 'vitest'
import type { CanvasElement, RoomElement, WallElement } from '../../types/document'
import { CSV_BOM, csvFileName, escapeCsvField, measurementsToCsv, type CsvLabels } from './csv'
import { computeMeasurements } from './measurements'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

function room(name: string, points: number[], extra: Partial<RoomElement> = {}): RoomElement {
  return {
    ...BASE,
    id: name,
    name,
    type: 'room',
    points,
    fill: 'rgba(0,128,0,0.2)',
    showLabel: true,
    ...extra,
  }
}

function wall(name: string, points: number[], thickness = 200, height = 2500): WallElement {
  return { ...BASE, id: name, name, type: 'wall', points, thickness, height, fill: '#444' }
}

const RECT_4X3 = [0, 0, 4000, 0, 4000, 3000, 0, 3000]
const L_SHAPE = [0, 0, 4000, 0, 4000, 2000, 2000, 2000, 2000, 3000, 0, 3000]

describe('computeMeasurements', () => {
  it('pièce de 4 m × 3 m : 12,00 m² et 14,00 m', () => {
    const { rooms } = computeMeasurements([room('Salon', RECT_4X3)])
    expect(rooms).toEqual([{ id: 'Salon', name: 'Salon', area: 12_000_000, perimeter: 14_000 }])
  })

  it('pièce en L : 10 m² et 14 m', () => {
    const { rooms } = computeMeasurements([room('L', L_SHAPE)])
    expect(rooms[0].area).toBe(10_000_000)
    expect(rooms[0].perimeter).toBe(14_000)
  })

  it('même surface quand le polygone est parcouru à l’envers', () => {
    const reversed = [0, 3000, 4000, 3000, 4000, 0, 0, 0]
    expect(computeMeasurements([room('R', reversed)]).rooms[0].area).toBe(12_000_000)
  })

  it('mur en 3 segments : somme exacte des longueurs', () => {
    const { walls } = computeMeasurements([wall('M', [0, 0, 3000, 0, 3000, 4000, 0, 4000])])
    expect(walls[0].length).toBe(10_000)
  })

  it('surface murale = longueur × hauteur, une face, sans déduction', () => {
    const { walls } = computeMeasurements([wall('M', [0, 0, 4000, 0], 200, 2500)])
    expect(walls[0].wallArea).toBe(4000 * 2500) // 10 m²
  })

  it('totaux : surface des pièces, linéaire de murs, surface murale', () => {
    const { totals } = computeMeasurements([
      room('A', RECT_4X3),
      room('B', L_SHAPE),
      wall('M1', [0, 0, 4000, 0]),
      wall('M2', [0, 0, 0, 3000], 200, 3000),
    ])
    expect(totals.roomArea).toBe(22_000_000)
    expect(totals.wallLength).toBe(7000)
    expect(totals.wallArea).toBe(4000 * 2500 + 3000 * 3000)
  })

  it('compte les éléments masqués (masquer ne change que l’affichage)', () => {
    const { rooms } = computeMeasurements([room('H', RECT_4X3, { hidden: true })])
    expect(rooms).toHaveLength(1)
  })

  it('ignore les éléments qui ne sont ni des pièces ni des murs', () => {
    const rect: CanvasElement = {
      ...BASE,
      id: 'r',
      name: 'r',
      type: 'rect',
      width: 100,
      height: 100,
      fill: '#000',
      stroke: '#000',
      strokeWidth: 0,
      cornerRadius: 0,
    }
    const result = computeMeasurements([rect])
    expect(result.rooms).toEqual([])
    expect(result.walls).toEqual([])
    expect(result.totals).toEqual({ roomArea: 0, wallLength: 0, wallArea: 0 })
  })

  it('un plan vide donne des totaux à zéro', () => {
    expect(computeMeasurements([]).totals).toEqual({ roomArea: 0, wallLength: 0, wallArea: 0 })
  })

  it('suit l’ordre du document', () => {
    const { rooms } = computeMeasurements([room('B', RECT_4X3), room('A', L_SHAPE)])
    expect(rooms.map((r) => r.name)).toEqual(['B', 'A'])
  })
})

const LABELS: CsvLabels = {
  rooms: 'Pièces',
  walls: 'Murs',
  name: 'Nom',
  area: 'Surface (m²)',
  perimeter: 'Périmètre (mm)',
  length: 'Longueur (mm)',
  thickness: 'Épaisseur (mm)',
  height: 'Hauteur (mm)',
  wallArea: 'Surface murale (m²)',
  total: 'Total',
}

describe('csvFileName', () => {
  it('ajoute le suffixe et l’extension', () => {
    expect(csvFileName('Cuisine', 'metres', 'plan')).toBe('Cuisine-metres.csv')
  })

  it('retire les caractères interdits dans un nom de fichier', () => {
    expect(csvFileName('Plan: étage 1/2 ?', 'metres', 'plan')).toBe('Plan étage 1 2-metres.csv')
  })

  it('retire les points et espaces de fin', () => {
    expect(csvFileName('Maison...  ', 'metres', 'plan')).toBe('Maison-metres.csv')
  })

  it('utilise le nom par défaut pour un nom vide ou entièrement interdit', () => {
    expect(csvFileName('', 'metres', 'plan')).toBe('plan-metres.csv')
    expect(csvFileName('???', 'metres', 'plan')).toBe('plan-metres.csv')
  })

  it('garde les accents', () => {
    expect(csvFileName('Rénovation', 'metres', 'plan')).toBe('Rénovation-metres.csv')
  })
})

describe('escapeCsvField', () => {
  it('laisse un texte simple tel quel (accents compris)', () => {
    expect(escapeCsvField('Cuisine équipée')).toBe('Cuisine équipée')
  })

  it('met entre guillemets un champ avec point-virgule, guillemet ou retour à la ligne', () => {
    expect(escapeCsvField('a;b')).toBe('"a;b"')
    expect(escapeCsvField('dit "oui"')).toBe('"dit ""oui"""')
    expect(escapeCsvField('a\nb')).toBe('"a\nb"')
  })

  it('neutralise une formule de tableur', () => {
    expect(escapeCsvField('=SOMME(A1:A9)')).toBe("'=SOMME(A1:A9)")
    expect(escapeCsvField('+1')).toBe("'+1")
    expect(escapeCsvField('@cmd')).toBe("'@cmd")
  })
})

describe('measurementsToCsv', () => {
  const measurements = computeMeasurements([
    room('Cuisine', [0, 0, 4000, 0, 4000, 3100, 0, 3100]),
    wall('Mur 1', [0, 0, 4000, 0], 200, 2500),
  ])
  const csv = measurementsToCsv(measurements, LABELS)

  it('commence par le BOM UTF-8 pour Excel', () => {
    expect(csv.startsWith(CSV_BOM)).toBe(true)
  })

  it('sépare par des points-virgules, avec des décimales à virgule et des fins de ligne CRLF', () => {
    const lines = csv.slice(1).split('\r\n')
    expect(lines).toContain('Nom;Surface (m²);Périmètre (mm)')
    expect(lines).toContain('Cuisine;12,40;14200') // 4000 × 3100 mm ; 2 × (4000 + 3100)
    expect(lines).toContain('Mur 1;4000;200;2500;10,00')
  })

  it('contient les totaux des deux tableaux', () => {
    const lines = csv.slice(1).split('\r\n')
    expect(lines).toContain('Total;12,40;')
    expect(lines).toContain('Total;4000;;;10,00')
  })

  it('garde les mêmes colonnes pour toutes les lignes d’un tableau', () => {
    const lines = csv.slice(1).split('\r\n')
    const wallRows = lines.slice(lines.indexOf('Murs') + 1).filter(Boolean)
    expect(new Set(wallRows.map((l) => l.split(';').length))).toEqual(new Set([5]))
  })

  it('termine par un saut de ligne', () => {
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('gère un plan vide', () => {
    const empty = measurementsToCsv(computeMeasurements([]), LABELS)
    expect(empty).toContain('Total;0,00;')
  })
})
