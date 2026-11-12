import { describe, expect, it } from 'vitest'
import type {
  CanvasElement,
  ChimneyElement,
  OpeningElement,
  RoomElement,
  StairElement,
  WallElement,
} from '../../types/document'
import { fr } from '../../i18n/fr'
import { buildMetresTables } from './tables'
import { clientMetaLabels } from './clientView'
import { CSV_BOM, measurementsToCsv, measurementsToFlatCsv, type CsvLabels } from './csv'
import {
  computeBuildingMeasurements,
  computeMeasurements,
  type BuildingMeasurements,
} from './measurements'

const LABELS: CsvLabels = fr.measurements.csv
const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const LEVEL = { id: 'L0', name: 'Rez', elevation: 0, height: 2700, slabThickness: 200 }

function room(name: string, points: number[]): RoomElement {
  return { ...BASE, id: name, name, type: 'room', points, fill: '#0a0', showLabel: true }
}

function wall(name: string, points: number[], thickness = 200, height = 2500): WallElement {
  return { ...BASE, id: name, name, type: 'wall', points, thickness, height, fill: '#444' }
}

function opening(id: string, wallId: string, partial: Partial<OpeningElement> = {}): OpeningElement {
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

/** Bâtiment d'un seul niveau « Rez ». */
function oneLevel(elements: CanvasElement[]): BuildingMeasurements {
  return computeBuildingMeasurements({
    levels: [LEVEL],
    elements: elements.map((el) => ({ ...el, levelId: 'L0' })),
  })
}

const linesOf = (csv: string) => csv.slice(1).split('\r\n')

describe('measurementsToCsv', () => {
  const building = oneLevel([
    room('Cuisine', [0, 0, 4000, 0, 4000, 3100, 0, 3100]),
    wall('Mur 1', [0, 0, 4000, 0], 200, 2500),
  ])
  const csv = measurementsToCsv(building, LABELS)
  const lines = linesOf(csv)

  it('commence par le BOM UTF-8 pour Excel', () => {
    expect(csv.startsWith(CSV_BOM)).toBe(true)
  })

  it('sépare par des points-virgules, avec des décimales à virgule', () => {
    expect(lines).toContain('Niveau;Nom;Surface au tracé (m²);Périmètre (mm)')
    expect(lines).toContain('Rez;Cuisine;12,40;14200') // 4000 × 3100 mm ; 2 × (4000 + 3100)
  })

  it('cache les colonnes Trémie et Surface nette quand il n’y a pas de trémie', () => {
    expect(csv).not.toContain('Trémie (m²)')
  })

  it('termine chaque tableau par une ligne de total', () => {
    expect(lines).toContain('Total;;12,40;14200')
    expect(lines.some((line) => line.startsWith('Total;;;4000;'))).toBe(true)
  })

  it('donne les totaux du niveau puis du bâtiment', () => {
    expect(lines).toContain('Rez;0;2700;12,40;4000;10,00;0,00;10,00;20,00;2,00;0;0;0')
    expect(lines).toContain('Bâtiment;;;12,40;4000;10,00;0,00;10,00;20,00;2,00;0;0;0')
  })

  it('garde les mêmes colonnes pour toutes les lignes du tableau des murs, total compris', () => {
    const start = lines.indexOf('Murs')
    const rows = lines.slice(start + 2, start + 5) // après le titre et la note : en-tête, mur, total
    expect(new Set(rows.map((l) => l.split(';').length))).toEqual(new Set([13]))
  })

  it('termine par un saut de ligne et gère un plan vide', () => {
    expect(csv.endsWith('\r\n')).toBe(true)
    expect(measurementsToCsv(oneLevel([]), LABELS)).toContain(
      'Bâtiment;;;0,00;0;0,00;0,00;0,00;0,00;0,00;0;0;0',
    )
  })

  it('met en tête le projet, la date et les unités quand on les donne', () => {
    const head = linesOf(
      measurementsToCsv(building, LABELS, [], { projectName: 'Maison', date: '11/11/2026' }),
    )
    expect(head.slice(0, 5)).toEqual([
      'Métrés',
      'Projet;Maison',
      'Date;11/11/2026',
      'Application;Fabrics',
      'Unités;Longueurs en mm, surfaces en m², volumes en m³',
    ])
  })
})

describe('murs : une face, deux faces et volume', () => {
  const lines = linesOf(measurementsToCsv(oneLevel([wall('Mur 1', [0, 0, 4000, 0])]), LABELS))

  it('donne la longueur et la surface des deux faces, et le volume', () => {
    // Un mur droit de 4000 mm : deux faces de 4000 mm, 2 × 10,00 m², 4000 × 200 × 2500 = 2,00 m³.
    expect(lines).toContain('Rez;M01;Mur 1;4000;200;2500;10,00;0,00;10,00;8000;20,00;20,00;2,00')
  })

  it('dit comment se lisent les surfaces', () => {
    expect(lines.some((line) => line.startsWith('Surface 1 face : longueur de l’axe'))).toBe(true)
  })

  it('mesure les faces d’un mur fermé sur les faces, pas sur l’axe', () => {
    // Carré de 4000 mm d'axe, mur de 200 mm : face extérieure 4200 × 4, face intérieure 3800 × 4.
    const closed = wall('Carré', [0, 0, 4000, 0, 4000, 4000, 0, 4000, 0, 0])
    const { walls } = computeMeasurements([closed])
    expect(walls[0].length).toBe(16000)
    expect(walls[0].facesLength).toBeCloseTo(4 * 4200 + 4 * 3800, 6)
    expect(walls[0].facesArea).toBeCloseTo((4 * 4200 + 4 * 3800) * 2500, 3)
  })

  it('déduit une ouverture sur chacune des deux faces, et son volume du mur', () => {
    const { walls } = computeMeasurements([wall('Mur 1', [0, 0, 4000, 0]), opening('P', 'Mur 1')])
    expect(walls[0].facesNetArea).toBeCloseTo(2 * 10_000_000 - 2 * 1_890_000, 3)
    expect(walls[0].volume).toBeCloseTo(4000 * 200 * 2500 - 1_890_000 * 200, 3)
  })
})

describe('références des murs', () => {
  it('numérote les murs et les rappelle dans le tableau des ouvertures', () => {
    const elements = [
      wall('Mur', [0, 0, 4000, 0]),
      { ...wall('Mur', [0, 0, 3000, 0]), id: 'autre' },
      opening('Porte 1', 'autre'),
    ]
    const lines = linesOf(measurementsToCsv(oneLevel(elements), LABELS))
    expect(lines.filter((l) => /^Rez;M0\d;Mur;/.test(l))).toHaveLength(2)
    // Deux murs au même nom : la porte indique de quel mur il s'agit (M01).
    expect(lines).toContain('Rez;P01;Porte 1;Porte;Battant;Mur;M01;900;2100;0;1,89')
  })
})

describe('totaux sur les valeurs exactes', () => {
  it('ne somme pas les lignes arrondies', () => {
    // Deux pièces de 4,004 m² : chaque ligne s'arrondit à 4,00 m² mais le total est 8,01 m².
    const a = room('A', [0, 0, 2002, 0, 2002, 2000, 0, 2000])
    const b = room('B', [0, 0, 2002, 0, 2002, 2000, 0, 2000])
    const csv = measurementsToCsv(oneLevel([a, b]), LABELS)
    expect(csv).toContain('Rez;A;4,00;8004')
    expect(csv).toContain('Total;;8,01;16008')
  })
})

describe('ouvertures', () => {
  const elements = [
    wall('Mur 1', [0, 0, 4000, 0]),
    opening('Porte 1', 'Mur 1'),
    opening('Fenêtre 1', 'Mur 1', {
      kind: 'window',
      width: 1200,
      height: 1000,
      sillHeight: 900,
      offset: 3000,
    }),
  ]
  const lines = linesOf(measurementsToCsv(oneLevel(elements), LABELS))

  it('donne la surface nette du mur, une face et deux faces', () => {
    // 10,00 − (1,89 + 1,20) = 6,91 ; deux faces : 20,00 − 2 × 3,09 = 13,82 ; volume 2,00 − 3,09 × 0,2 = 1,38
    expect(lines).toContain('Rez;M01;Mur 1;4000;200;2500;10,00;3,09;6,91;8000;20,00;13,82;1,38')
  })

  it('ajoute un tableau des ouvertures avec le mur, sa référence, les dimensions, la surface et le total', () => {
    const start = lines.indexOf('Ouvertures')
    expect(start).toBeGreaterThan(-1)
    expect(lines[start + 1]).toBe(
      'Niveau;Réf.;Nom;Type;Style;Mur;Réf. du mur;Largeur (mm);Hauteur (mm);Allège (mm);Surface (m²)',
    )
    expect(lines[start + 2]).toBe('Rez;P01;Porte 1;Porte;Battant;Mur 1;M01;900;2100;0;1,89')
    expect(lines[start + 3]).toBe('Rez;F01;Fenêtre 1;Fenêtre;Deux vantaux;Mur 1;M01;1200;1000;900;1,20')
    expect(lines[start + 4]).toBe('Total;;;;;;;;;;3,09')
  })

  it('compte les portes, fenêtres et baies dans les totaux', () => {
    expect(lines).toContain('Bâtiment;;;0,00;4000;10,00;3,09;6,91;13,82;1,38;1;1;0')
  })

  it('n’ajoute aucun tableau d’ouvertures quand il n’y en a pas', () => {
    expect(measurementsToCsv(oneLevel([elements[0]]), LABELS)).not.toContain('\r\nOuvertures\r\n')
  })
})

describe('cheminées', () => {
  const chimney: ChimneyElement = {
    ...BASE,
    id: 'c',
    name: 'Cheminée 1',
    type: 'chimney',
    width: 600,
    depth: 500,
    heightAboveTop: 800,
  }

  it('mesure l’emprise et compte les cheminées', () => {
    const { chimneys, totals } = computeMeasurements([chimney])
    expect(chimneys).toEqual([
      { id: 'c', name: 'Cheminée 1', width: 600, depth: 500, area: 300_000, heightAboveTop: 800 },
    ])
    expect(totals.chimneys).toBe(1)
  })

  it('ajoute un tableau des cheminées au CSV, seulement s’il y en a', () => {
    const lines = linesOf(measurementsToCsv(oneLevel([chimney]), LABELS))
    const start = lines.indexOf('Cheminées')
    expect(start).toBeGreaterThan(-1)
    expect(lines[start + 2]).toBe('Rez;Cheminée 1;600;500;0,30;800')
    expect(measurementsToCsv(oneLevel([]), LABELS)).not.toContain('Cheminées')
  })
})

describe('measurementsToFlatCsv', () => {
  const elements = [
    room('Cuisine', [0, 0, 4000, 0, 4000, 3100, 0, 3100]),
    wall('Mur 1', [0, 0, 4000, 0]),
    opening('Porte 1', 'Mur 1'),
  ]
  const lines = linesOf(
    measurementsToFlatCsv(oneLevel(elements), LABELS, [
      { category: 'Chambre', name: 'Lit', width: 1600, depth: 2000, count: 2, kind: 'furniture' },
    ]),
  )

  it('commence par les sept colonnes', () => {
    expect(lines[0]).toBe('Niveau;Catégorie;Élément;Réf.;Grandeur;Valeur;Unité')
  })

  it('met une grandeur par ligne, avec un vrai nombre et son unité', () => {
    expect(lines).toContain('Rez;Pièce;Cuisine;;Surface au tracé;12,4000;m²')
    expect(lines).toContain('Rez;Pièce;Cuisine;;Périmètre;14200;mm')
    expect(lines).toContain('Rez;Mur;Mur 1;M01;Volume;1,6220;m³')
    expect(lines).toContain('Rez;Ouverture;Porte 1;P01;Surface;1,8900;m²')
  })

  it('compte le mobilier, avec sa taille en référence', () => {
    expect(lines).toContain(';Mobilier;Lit;1600 × 2000 mm;Nombre;2;nombre')
  })

  it('a sept colonnes partout et aucun total', () => {
    expect(new Set(lines.filter(Boolean).map((l) => l.split(';').length))).toEqual(new Set([7]))
    expect(lines.some((l) => l.includes('Total'))).toBe(false)
  })

  it('ne met pas de ligne pour une grandeur absente (escalier sans niveau au-dessus)', () => {
    const stair: StairElement = {
      ...BASE,
      id: 's',
      name: 'Escalier 1',
      type: 'stair',
      shape: 'straight',
      width: 1000,
      length: 3500,
      voidMargin: 50,
    }
    const out = measurementsToFlatCsv(oneLevel([stair]), LABELS)
    expect(out).toContain('Rez;Escalier;Escalier 1;;Largeur;1000;mm')
    expect(out).not.toContain('Contremarches')
  })
})

describe('valeurs chiffrées des tableaux (Excel)', () => {
  const building = oneLevel([
    room('A', [0, 0, 2002, 0, 2002, 2000, 0, 2000]),
    wall('Mur 1', [0, 0, 4000, 0]),
  ])
  const tables = buildMetresTables(building, LABELS)
  const rooms = tables.find((t) => t.id === 'rooms')!
  const walls = tables.find((t) => t.id === 'walls')!

  it('donne les surfaces en m² et les volumes en m³, à leur valeur exacte', () => {
    expect(rooms.rows[0][2]).toEqual({ text: '4,00', value: 4.004, unit: 'm2' })
    expect(rooms.total?.[2]).toEqual({ text: '4,00', value: 4.004, unit: 'm2' })
    expect(walls.rows[0][12]).toEqual({ text: '2,00', value: 2, unit: 'm3' })
  })

  it('donne les longueurs en mm', () => {
    expect(walls.rows[0][3]).toEqual({ text: '4000', value: 4000, unit: 'mm' })
  })
})

describe('en-tête de la version Client', () => {
  it('le CSV Client porte le titre et la remarque du client, sans la note technique', () => {
    const building = computeBuildingMeasurements({ levels: [], elements: [] })
    const meta = fr.measurements.csv.meta!
    const labels = { ...fr.measurements.csv, meta: clientMetaLabels(meta, fr.measurements.client) }
    const csv = measurementsToCsv(building, labels, [], { projectName: 'Maison', date: '12/11/2026' }, [])
    expect(csv).toContain('Surfaces de votre projet')
    expect(csv).toContain(fr.measurements.client.pdfNote)
    expect(csv).not.toContain(meta.noteValue)
  })
})
