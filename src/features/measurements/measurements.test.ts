import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { CSV_BOM, csvFileName, escapeCsvField, measurementsToCsv, type CsvLabels } from './csv'
import {
  computeBuildingMeasurements,
  computeMeasurements,
  type BuildingMeasurements,
} from './measurements'

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
  level: 'Niveau',
  building: 'Bâtiment',
  elevation: 'Altitude (mm)',
  levelHeight: 'Hauteur d’étage (mm)',
  levelTotals: 'Totaux par niveau',
  roomsTotal: 'Surface des pièces (m²)',
  wallsTotal: 'Longueur des murs (mm)',
}

const LEVEL = { id: 'L0', name: 'Rez', elevation: 0, height: 2700, slabThickness: 200 }

/** Bâtiment d'un seul niveau « Rez », pour les tests du CSV. */
function oneLevel(elements: CanvasElement[]): BuildingMeasurements {
  return computeBuildingMeasurements({
    levels: [LEVEL],
    elements: elements.map((el) => ({ ...el, levelId: 'L0' })),
  })
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
  const building = oneLevel([
    room('Cuisine', [0, 0, 4000, 0, 4000, 3100, 0, 3100]),
    wall('Mur 1', [0, 0, 4000, 0], 200, 2500),
  ])
  const csv = measurementsToCsv(building, LABELS)
  const lines = csv.slice(1).split('\r\n')

  it('commence par le BOM UTF-8 pour Excel', () => {
    expect(csv.startsWith(CSV_BOM)).toBe(true)
  })

  it('sépare par des points-virgules, avec des décimales à virgule et des fins de ligne CRLF', () => {
    expect(lines).toContain('Niveau;Nom;Surface (m²);Périmètre (mm)')
    expect(lines).toContain('Rez;Cuisine;12,40;14200') // 4000 × 3100 mm ; 2 × (4000 + 3100)
    expect(lines).toContain('Rez;Mur 1;4000;200;2500;10,00;0,00;10,00')
  })

  it('donne les totaux du niveau puis du bâtiment', () => {
    expect(lines).toContain('Rez;0;2700;12,40;4000;10,00;0,00;10,00;0;0;0')
    expect(lines).toContain('Bâtiment;;;12,40;4000;10,00;0,00;10,00;0;0;0')
  })

  it('garde les mêmes colonnes pour toutes les lignes d’un tableau', () => {
    const wallRows = lines.slice(lines.indexOf('Murs') + 1, lines.indexOf('Totaux par niveau') - 1)
    expect(new Set(wallRows.map((l) => l.split(';').length))).toEqual(new Set([8]))
  })

  it('termine par un saut de ligne', () => {
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('gère un plan vide', () => {
    const empty = measurementsToCsv(oneLevel([]), LABELS)
    expect(empty).toContain('Bâtiment;;;0,00;0;0,00;0,00;0,00;0;0;0')
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
  const lines = measurementsToCsv(oneLevel(elements), LABELS).slice(1).split('\r\n')

  it('donne la surface nette du mur', () => {
    // 10,00 − (1,89 + 1,20) = 6,91
    expect(lines).toContain('Rez;Mur 1;4000;200;2500;10,00;3,09;6,91')
  })

  it('ajoute un tableau des ouvertures, avec le niveau, le mur, les dimensions et la surface', () => {
    const start = lines.indexOf('Ouvertures')
    expect(start).toBeGreaterThan(-1)
    expect(lines[start + 1]).toBe(
      'Niveau;Nom;Type;Mur;Largeur (mm);Hauteur (mm);Allège (mm);Surface (m²)',
    )
    expect(lines[start + 2]).toBe('Rez;Porte 1;Porte;Mur 1;900;2100;0;1,89')
    expect(lines[start + 3]).toBe('Rez;Fenêtre 1;Fenêtre;Mur 1;1200;1000;900;1,20')
  })

  it('compte les portes, fenêtres et baies dans les totaux', () => {
    expect(lines).toContain('Bâtiment;;;0,00;4000;10,00;3,09;6,91;1;1;0')
  })

  it('garde les mêmes colonnes pour toutes les lignes du tableau des ouvertures', () => {
    const start = lines.indexOf('Ouvertures')
    const rows = lines.slice(start + 1, start + 4)
    expect(new Set(rows.map((l) => l.split(';').length))).toEqual(new Set([8]))
  })

  it('n’ajoute aucun tableau d’ouvertures quand il n’y en a pas', () => {
    const none = measurementsToCsv(oneLevel([elements[0]]), LABELS)
    expect(none).not.toContain('\r\nOuvertures\r\n')
  })
})

describe('métrés par niveau et pour le bâtiment', () => {
  const levels = [
    LEVEL,
    { id: 'L1', name: 'Étage 1', elevation: 2700, height: 2700, slabThickness: 200 },
  ]
  const elements: CanvasElement[] = [
    { ...room('R0', RECT_4X3), levelId: 'L0' },
    { ...wall('M0', [0, 0, 4000, 0]), levelId: 'L0' },
    { ...room('R1', L_SHAPE), levelId: 'L1' },
    { ...wall('M1', [0, 0, 2000, 0]), levelId: 'L1' },
    // Un élément commun à tous les niveaux n'est compté nulle part (pas de double comptage).
    room('Commune', RECT_4X3),
  ]
  const building = computeBuildingMeasurements({ levels, elements })

  it('calcule les métrés de chaque niveau avec ses seuls éléments', () => {
    expect(building.levels.map((l) => l.level.id)).toEqual(['L0', 'L1'])
    expect(building.levels[0].measurements.totals.roomArea).toBe(12_000_000)
    expect(building.levels[1].measurements.totals.roomArea).toBe(10_000_000) // L : 12 − 2 m²
  })

  it('les totaux du bâtiment sont la somme des totaux des niveaux', () => {
    const sum = (pick: (t: (typeof EMPTY_TOTALS)) => number) =>
      building.levels.reduce((acc, l) => acc + pick(l.measurements.totals), 0)
    expect(building.total.totals.roomArea).toBe(sum((t) => t.roomArea))
    expect(building.total.totals.wallLength).toBe(sum((t) => t.wallLength))
    expect(building.total.totals.wallArea).toBe(sum((t) => t.wallArea))
    expect(building.total.totals.roomArea).toBe(22_000_000)
    expect(building.total.totals.wallLength).toBe(6000)
  })

  it('un plan sans niveaux donne un bâtiment vide', () => {
    expect(computeBuildingMeasurements({ elements }).levels).toEqual([])
  })

  it('le CSV porte une colonne Niveau et une ligne par niveau', () => {
    const lines = measurementsToCsv(building, LABELS).slice(1).split('\r\n')
    expect(lines).toContain('Rez;R0;12,00;14000')
    expect(lines).toContain('Étage 1;R1;10,00;14000')
    expect(lines).toContain('Étage 1;2700;2700;10,00;2000;5,00;0,00;5,00;0;0;0')
    expect(lines).toContain('Bâtiment;;;22,00;6000;15,00;0,00;15,00;0;0;0')
  })
})
