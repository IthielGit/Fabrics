import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
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

function opening(
  id: string,
  wallId: string,
  partial: Partial<OpeningElement> = {},
): OpeningElement {
  return {
    ...BASE,
    id,
    name: id,
    type: 'opening',
    kind: 'door',
    wallId,
    segmentIndex: 0,
    offset: 2000,
    width: 900,
    height: 2100,
    sillHeight: 0,
    hinge: 'start',
    side: 'left',
    ...partial,
  }
}

const RECT_4X3 = [0, 0, 4000, 0, 4000, 3000, 0, 3000]
const L_SHAPE = [0, 0, 4000, 0, 4000, 2000, 2000, 2000, 2000, 3000, 0, 3000]

const EMPTY_TOTALS = {
  roomArea: 0,
  wallLength: 0,
  wallArea: 0,
  openingsArea: 0,
  wallNetArea: 0,
  doors: 0,
  windows: 0,
  bays: 0,
}

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

  it('surface murale brute = longueur × hauteur, une face, sans déduction', () => {
    const { walls } = computeMeasurements([wall('M', [0, 0, 4000, 0], 200, 2500)])
    expect(walls[0].wallArea).toBe(4000 * 2500) // 10 m²
    expect(walls[0].netArea).toBe(4000 * 2500) // sans ouverture : nette = brute
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
    expect(result.totals).toEqual(EMPTY_TOTALS)
  })

  it('un plan vide donne des totaux à zéro', () => {
    expect(computeMeasurements([]).totals).toEqual(EMPTY_TOTALS)
  })

  it('suit l’ordre du document', () => {
    const { rooms } = computeMeasurements([room('B', RECT_4X3), room('A', L_SHAPE)])
    expect(rooms.map((r) => r.name)).toEqual(['B', 'A'])
  })
})

describe('ouvertures et surface murale nette', () => {
  const m = wall('M', [0, 0, 4000, 0], 200, 2500)

  it('mur de 4,00 × 2,50 m avec une porte de 0,90 × 2,10 m : 10,00 m² brut, 8,11 m² net', () => {
    const { walls, totals } = computeMeasurements([m, opening('P', 'M')])
    expect(walls[0].wallArea / 1_000_000).toBeCloseTo(10, 10)
    expect(walls[0].openingsArea / 1_000_000).toBeCloseTo(1.89, 10)
    expect(walls[0].netArea / 1_000_000).toBeCloseTo(8.11, 10)
    expect(totals.wallNetArea).toBe(walls[0].netArea)
    expect(totals.openingsArea).toBe(walls[0].openingsArea)
  })

  it('liste les ouvertures avec leur mur', () => {
    const { openings } = computeMeasurements([m, opening('P', 'M')])
    expect(openings).toEqual([
      {
        id: 'P',
        name: 'P',
        kind: 'door',
        wallId: 'M',
        wallName: 'M',
        width: 900,
        height: 2100,
        sillHeight: 0,
        area: 900 * 2100,
      },
    ])
  })

  it('déduit plusieurs ouvertures et compte les portes, fenêtres et baies', () => {
    const { walls, totals } = computeMeasurements([
      m,
      opening('P', 'M'),
      opening('F', 'M', { kind: 'window', width: 1200, height: 1000, sillHeight: 900, offset: 3000 }),
      opening('B', 'M', { kind: 'bay', width: 800, height: 2000, offset: 600 }),
    ])
    expect(walls[0].openingsArea).toBe(900 * 2100 + 1200 * 1000 + 800 * 2000)
    expect(totals).toMatchObject({ doors: 1, windows: 1, bays: 1 })
  })

  it('ne déduit que les ouvertures de leur propre mur', () => {
    const other = wall('N', [0, 3000, 4000, 3000], 200, 2500)
    const { walls } = computeMeasurements([m, other, opening('P', 'N')])
    expect(walls.find((w) => w.id === 'M')?.netArea).toBe(4000 * 2500)
    expect(walls.find((w) => w.id === 'N')?.openingsArea).toBe(900 * 2100)
  })

  it('limite l’ouverture à la hauteur du mur', () => {
    const low = wall('L', [0, 0, 4000, 0], 200, 2000)
    const { openings, walls } = computeMeasurements([low, opening('P', 'L', { height: 2100 })])
    expect(openings[0].area).toBe(900 * 2000)
    expect(walls[0].netArea).toBe(4000 * 2000 - 900 * 2000)
  })

  it('la surface nette ne devient jamais négative', () => {
    const tiny = wall('T', [0, 0, 1000, 0], 200, 2500)
    const wide = opening('P', 'T', { width: 5000, height: 2500 })
    expect(computeMeasurements([tiny, wide]).walls[0].netArea).toBe(0)
  })

  it('ignore une ouverture dont le mur n’existe pas', () => {
    const { openings, totals } = computeMeasurements([opening('P', 'absent')])
    expect(openings).toEqual([])
    expect(totals.doors).toBe(0)
  })

  it('compte une ouverture même masquée', () => {
    const hidden = { ...opening('P', 'M'), hidden: true }
    expect(computeMeasurements([m, hidden]).openings).toHaveLength(1)
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
  wallArea: 'Surface murale brute (m²)',
  openingsArea: 'Ouvertures (m²)',
  wallNetArea: 'Surface murale nette (m²)',
  openings: 'Ouvertures',
  kind: 'Type',
  wall: 'Mur',
  width: 'Largeur (mm)',
  sillHeight: 'Allège (mm)',
  doors: 'Nombre de portes',
  windows: 'Nombre de fenêtres',
  bays: 'Nombre de baies',
  kinds: { door: 'Porte', window: 'Fenêtre', bay: 'Baie' },
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
    expect(lines).toContain('Mur 1;4000;200;2500;10,00;0,00;10,00')
  })

  it('contient les totaux des deux tableaux', () => {
    const lines = csv.slice(1).split('\r\n')
    expect(lines).toContain('Total;12,40;')
    expect(lines).toContain('Total;4000;;;10,00;0,00;10,00')
  })

  it('garde les mêmes colonnes pour toutes les lignes d’un tableau', () => {
    const lines = csv.slice(1).split('\r\n')
    const wallRows = lines.slice(lines.indexOf('Murs') + 1).filter(Boolean)
    expect(new Set(wallRows.map((l) => l.split(';').length))).toEqual(new Set([7]))
  })

  it('termine par un saut de ligne', () => {
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('gère un plan vide', () => {
    const empty = measurementsToCsv(computeMeasurements([]), LABELS)
    expect(empty).toContain('Total;0,00;')
  })
})

describe('measurementsToCsv avec ouvertures', () => {
  const elements = [
    wall('Mur 1', [0, 0, 4000, 0], 200, 2500),
    opening('Porte 1', 'Mur 1'),
    opening('Fenêtre 1', 'Mur 1', {
      kind: 'window',
      width: 1200,
      height: 1000,
      sillHeight: 900,
      offset: 3000,
    }),
  ]
  const lines = measurementsToCsv(computeMeasurements(elements), LABELS).slice(1).split('\r\n')

  it('donne la surface nette du mur', () => {
    // 10,00 − (1,89 + 1,20) = 6,91
    expect(lines).toContain('Mur 1;4000;200;2500;10,00;3,09;6,91')
  })

  it('ajoute un tableau des ouvertures, avec le mur, les dimensions et la surface', () => {
    const start = lines.indexOf('Ouvertures')
    expect(start).toBeGreaterThan(-1)
    expect(lines[start + 1]).toBe(
      'Nom;Type;Mur;Largeur (mm);Hauteur (mm);Allège (mm);Surface (m²)',
    )
    expect(lines[start + 2]).toBe('Porte 1;Porte;Mur 1;900;2100;0;1,89')
    expect(lines[start + 3]).toBe('Fenêtre 1;Fenêtre;Mur 1;1200;1000;900;1,20')
  })

  it('termine le tableau par le total et le nombre de portes, fenêtres et baies', () => {
    expect(lines).toContain('Total;;;;;;3,09')
    expect(lines).toContain('Nombre de portes;1')
    expect(lines).toContain('Nombre de fenêtres;1')
    expect(lines).toContain('Nombre de baies;0')
  })

  it('garde les mêmes colonnes pour toutes les lignes du tableau des ouvertures', () => {
    const start = lines.indexOf('Ouvertures')
    const rows = lines.slice(start + 1, start + 5)
    expect(new Set(rows.map((l) => l.split(';').length))).toEqual(new Set([7]))
  })

  it('n’ajoute aucun tableau d’ouvertures quand il n’y en a pas', () => {
    const none = measurementsToCsv(computeMeasurements([elements[0]]), LABELS)
    expect(none).not.toContain('Nombre de portes')
  })
})
