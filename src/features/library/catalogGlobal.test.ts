import { beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { createPlanProject } from '../documents/createProject'
import { createFurnitureElement } from '../documents/elements'
import { measurementsToCsv, type FurnitureCsvRow } from '../measurements/csv'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { CATEGORIES, SYMBOLS } from './catalog'
import { getSet, SETS } from './catalog/sets'
import { groupFurniture } from './furnitureList'
import { elementsForSet } from './placeSet'
import { MAX_RECENTS, parseIdList, pushRecent, toggleFavorite } from './prefs'
import { searchSymbols } from './search'

/** Nombre d'objets par catégorie annoncé dans docs/06-BIBLIOTHEQUE.md. */
const EXPECTED_COUNTS: Record<string, number> = {
  living: 29,
  dining: 18,
  bedroom: 23,
  office: 22,
  storage: 16,
  kitchen: 44,
  bathroom: 34,
  laundry: 14,
  stairs: 16,
  electrical: 24,
  hvac: 18,
  safety: 14,
  outdoor: 41,
  vehicles: 16,
  hospitality: 31,
  'health-education': 16,
  leisure: 16,
}

/** Marques et références commerciales interdites dans les noms et mots-clés (règle « clean room »). */
const BRANDS = ['ikea', 'revit', 'autodesk', 'bimobject', 'jacuzzi', 'velux', 'nespresso', 'tesla', 'bmw', 'mercedes', 'audi', 'peugeot', 'renault', 'volkswagen', 'toyota', 'vespa', 'steinway', 'yamaha', 'miele', 'bosch', 'siemens', 'samsung', 'apple', 'canva']

describe('catalogue complet', () => {
  it('392 objets : le nombre annoncé dans chaque catégorie', () => {
    const counts: Record<string, number> = {}
    for (const symbol of SYMBOLS) counts[symbol.category] = (counts[symbol.category] ?? 0) + 1
    expect(counts).toEqual(EXPECTED_COUNTS)
    expect(SYMBOLS).toHaveLength(392)
  })

  it('chaque catégorie du panneau a des objets, et toutes ont un intitulé français', () => {
    for (const category of CATEGORIES) {
      expect(fr.library.categories[category], category).toBeTruthy()
      if (category !== 'sets') expect(SYMBOLS.some((s) => s.category === category), category).toBe(true)
    }
  })

  it('aucun identifiant n’est partagé entre un objet et un ensemble', () => {
    const ids = [...SYMBOLS.map((s) => s.id), ...SETS.map((s) => s.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('aucune marque ni référence commerciale dans les noms et les mots-clés', () => {
    const ids = [...SYMBOLS.map((s) => s.id), ...SETS.map((s) => s.id)]
    for (const id of ids) {
      const text = fr.library.symbols[id]
      expect(text, id).toBeTruthy()
      const haystack = `${text.name} ${text.keywords.join(' ')}`.toLowerCase()
      // Mot entier : « chaudière » ne contient pas la marque « audi ».
      for (const brand of BRANDS) expect(haystack, `${id} : ${brand}`).not.toMatch(new RegExp(String.raw`\b${brand}\b`))
    }
  })

  it('la recherche trouve les objets courants, sans accents ni tirets', () => {
    const find = (query: string) =>
      searchSymbols(SYMBOLS, query, (s) => ({
        name: fr.library.symbols[s.id].name,
        keywords: fr.library.symbols[s.id].keywords,
        category: fr.library.categories[s.category],
      })).map((s) => s.id)
    expect(find('lave vaisselle')).toContain('dishwasher')
    expect(find('canape')).toContain('sofa-3')
    expect(find('frigo')).toContain('fridge')
    expect(find('cuisine americaine')).toEqual(expect.arrayContaining(['kitchen-american', 'kitchen-american-l']))
    expect(find('bar')).toEqual(expect.arrayContaining(['bar-counter', 'bar-counter-l', 'bar-home']))
    expect(find('escalier')).toContain('stair-straight')
    expect(find('zzzz')).toEqual([])
  })

  it('les cuisines en L et américaines, et les bars, se retournent', () => {
    for (const id of ['kitchen-l', 'kitchen-american', 'kitchen-american-l', 'kitchen-american-island', 'bar-counter-l', 'bar-counter-curved', 'bar-home']) {
      expect(SYMBOLS.find((s) => s.id === id)?.mirrorable, id).toBe(true)
    }
  })

  it('les symboles conventionnels ont une taille fixe, les zones sont marquées', () => {
    for (const symbol of SYMBOLS.filter((s) => s.nominal)) expect(symbol.resize, symbol.id).toBe('fixed')
    expect(SYMBOLS.find((s) => s.id === 'pmr-turning-circle')?.zone).toBe(true)
    expect(SYMBOLS.find((s) => s.id === 'parking-bay')?.zone).toBe(true)
  })
})

describe('ensembles', () => {
  it('24 ensembles, tous composés d’objets du catalogue', () => {
    expect(SETS).toHaveLength(24)
    for (const set of SETS) {
      expect(set.members.length, set.id).toBeGreaterThan(1)
      for (const member of set.members) {
        expect(SYMBOLS.some((s) => s.id === member.symbol), `${set.id} : ${member.symbol}`).toBe(true)
      }
    }
  })

  it('l’emprise est la boîte englobante des objets, calée en (0, 0)', () => {
    for (const set of SETS) {
      const xs: number[] = []
      const ys: number[] = []
      for (const m of set.members) {
        const a = (m.rotation * Math.PI) / 180
        for (const [px, py] of [[0, 0], [m.width, 0], [m.width, m.depth], [0, m.depth]]) {
          xs.push(m.x + px * Math.cos(a) - py * Math.sin(a))
          ys.push(m.y + px * Math.sin(a) + py * Math.cos(a))
        }
      }
      expect(Math.min(...xs), set.id).toBeGreaterThanOrEqual(-1)
      expect(Math.min(...ys), set.id).toBeGreaterThanOrEqual(-1)
      expect(Math.min(...xs), set.id).toBeLessThanOrEqual(1)
      expect(Math.min(...ys), set.id).toBeLessThanOrEqual(1)
      expect(Math.abs(Math.max(...xs) - set.width), set.id).toBeLessThanOrEqual(1)
      expect(Math.abs(Math.max(...ys) - set.depth), set.id).toBeLessThanOrEqual(1)
    }
  })

  it('table + 4, 6 et 8 chaises : le bon nombre d’objets', () => {
    expect(getSet('set-dining-4')!.members).toHaveLength(1 + 4)
    expect(getSet('set-dining-6')!.members).toHaveLength(1 + 6)
    expect(getSet('set-dining-8')!.members).toHaveLength(1 + 8)
    expect(getSet('set-dining-round-6')!.members).toHaveLength(1 + 6)
    expect(getSet('set-parking-3')!.members).toHaveLength(3)
  })

  it('chaque chaise tourne le dos à la table : son assise est tournée vers elle', () => {
    for (const id of ['set-dining-4', 'set-dining-6', 'set-dining-8', 'set-dining-round-6', 'set-office-meeting-6', 'set-terrace-4']) {
      const set = getSet(id)!
      const table = set.members[0]
      const ta = (table.rotation * Math.PI) / 180
      const tableCenter = {
        x: table.x + (table.width / 2) * Math.cos(ta) - (table.depth / 2) * Math.sin(ta),
        y: table.y + (table.width / 2) * Math.sin(ta) + (table.depth / 2) * Math.cos(ta),
      }
      const chairs = set.members.filter((m) => m.symbol.startsWith('chair'))
      expect(chairs.length, id).toBeGreaterThan(0)
      for (const chair of chairs) {
        const a = (chair.rotation * Math.PI) / 180
        const point = (px: number, py: number) => ({
          x: chair.x + px * Math.cos(a) - py * Math.sin(a),
          y: chair.y + px * Math.sin(a) + py * Math.cos(a),
        })
        const front = point(chair.width / 2, chair.depth) // milieu du bord avant
        const back = point(chair.width / 2, 0) // milieu du dossier
        const dist = (p: { x: number; y: number }) => Math.hypot(p.x - tableCenter.x, p.y - tableCenter.y)
        expect(dist(front), `${id} ${chair.symbol}`).toBeLessThan(dist(back))
      }
    }
  })

  it('elementsForSet : un élément par objet, noms numérotés, rotation gardée, position décalée', () => {
    const set = getSet('set-dining-4')!
    const elements = elementsForSet(set, { x: 1000, y: 2000 }, (id) => fr.library.symbols[id].name, new Map([['chair', 2]]))
    expect(elements).toHaveLength(5)
    expect(new Set(elements.map((e) => e.id)).size).toBe(5)
    expect(elements.filter((e) => e.symbol === 'chair').map((e) => e.name)).toEqual(['Chaise 3', 'Chaise 4', 'Chaise 5', 'Chaise 6'])
    set.members.forEach((member, i) => {
      expect(elements[i]).toMatchObject({ x: 1000 + member.x, y: 2000 + member.y, rotation: member.rotation, width: member.width, depth: member.depth })
    })
  })
})

describe('poser un ensemble dans le plan', () => {
  beforeEach(() => {
    useEditorStore.getState().loadProject(createPlanProject('Maison'))
  })

  it('un seul pas d’historique : annuler retire tout l’ensemble, rétablir le remet', () => {
    const store = () => useEditorStore.getState()
    const set = getSet('set-dining-4')!
    store().addElements(elementsForSet(set, { x: 0, y: 0 }, (id) => id))
    expect(store().project!.document.elements).toHaveLength(5)
    expect(store().selectedIds).toHaveLength(5)
    expect(store().project!.document.elements.every((e) => e.levelId === store().activeLevelId)).toBe(true)
    store().undo()
    expect(store().project!.document.elements).toHaveLength(0)
    store().redo()
    expect(store().project!.document.elements).toHaveLength(5)
  })

  it('addElements sans élément ne crée pas d’historique', () => {
    useEditorStore.getState().addElements([])
    expect(useEditorStore.getState().history.past).toHaveLength(0)
  })
})

describe('récents et favoris', () => {
  it('pushRecent : en tête, sans doublon, au plus 12', () => {
    expect(pushRecent(['a', 'b'], 'c')).toEqual(['c', 'a', 'b'])
    expect(pushRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c'])
    const many = Array.from({ length: 20 }, (_, i) => `id${i}`).reduce<string[]>((list, id) => pushRecent(list, id), [])
    expect(many).toHaveLength(MAX_RECENTS)
    expect(many[0]).toBe('id19')
  })

  it('toggleFavorite : ajoute en tête, retire au second appel', () => {
    expect(toggleFavorite(['a'], 'b')).toEqual(['b', 'a'])
    expect(toggleFavorite(['b', 'a'], 'b')).toEqual(['a'])
  })

  it('parseIdList : tolère une valeur absente, invalide ou du mauvais type', () => {
    expect(parseIdList(null)).toEqual([])
    expect(parseIdList('pas du json')).toEqual([])
    expect(parseIdList('{"a":1}')).toEqual([])
    expect(parseIdList('["a", 3, "b"]')).toEqual(['a', 'b'])
  })
})

describe('liste du mobilier (CSV)', () => {
  const bed = (x: number, w = 1600, d = 2000) => createFurnitureElement('Lit', 'bed-queen', x, 0, w, d)
  const sofa = createFurnitureElement('Canapé', 'sofa-3', 0, 0, 2100, 900)
  const outlet = createFurnitureElement('Prise', 'socket-single', 0, 0, 300, 300)
  const rug = createFurnitureElement('Tapis', 'rug-rect', 0, 0, 2000, 3000)

  it('regroupe par objet et par taille, avec le nombre', () => {
    const groups = groupFurniture([bed(0), bed(2000), bed(4000, 1400, 1900), sofa])
    expect(groups.find((g) => g.symbol === 'bed-queen' && g.width === 1600)?.count).toBe(2)
    expect(groups.find((g) => g.symbol === 'bed-queen' && g.width === 1400)?.count).toBe(1)
    expect(groups.find((g) => g.symbol === 'sofa-3')?.count).toBe(1)
  })

  it('range les symboles conventionnels et les zones à part', () => {
    const kinds = Object.fromEntries(groupFurniture([bed(0), outlet, rug]).map((g) => [g.symbol, g.kind]))
    expect(kinds).toEqual({ 'bed-queen': 'furniture', 'socket-single': 'nominal', 'rug-rect': 'zone' })
  })

  it('ignore les éléments qui ne sont pas des objets, et garde un objet inconnu', () => {
    const unknown = createFurnitureElement('?', 'objet-futur', 0, 0, 500, 500)
    const groups = groupFurniture([unknown])
    expect(groups).toEqual([{ symbol: 'objet-futur', category: null, kind: 'furniture', width: 500, depth: 500, count: 1 }])
  })

  const building = computeBuildingMeasurements({ elements: [], levels: undefined })
  const rows: FurnitureCsvRow[] = [
    { category: 'Chambre', name: 'Lit 160 × 200', width: 1600, depth: 2000, count: 2, kind: 'furniture' },
    { category: 'Électricité et éclairage', name: 'Prise simple', width: 300, depth: 300, count: 4, kind: 'nominal' },
    { category: 'Séjour et salon', name: 'Tapis rectangulaire', width: 2000, depth: 3000, count: 1, kind: 'zone' },
  ]

  it('le CSV contient trois tableaux, en mm entiers, sans toucher aux métrés', () => {
    const csv = measurementsToCsv(building, fr.measurements.csv, rows)
    expect(csv).toContain('Mobilier et équipements')
    expect(csv).toContain('Chambre;Lit 160 × 200;1600;2000;2')
    expect(csv).toContain('Symboles conventionnels (non à l’échelle)')
    expect(csv).toContain('Électricité et éclairage;Prise simple;300;300;4')
    expect(csv).toContain('Zones de référence')
    expect(csv).toContain('Séjour et salon;Tapis rectangulaire;2000;3000;1')
  })

  it('le mobilier n’ajoute rien aux surfaces ni aux longueurs : les autres lignes sont identiques', () => {
    const without = measurementsToCsv(building, fr.measurements.csv)
    const withRows = measurementsToCsv(building, fr.measurements.csv, rows)
    const keep = (csv: string) => csv.split('\r\n').filter((line) => !/Lit 160|Prise simple|Tapis rect|Mobilier|Symboles conv|Zones de réf|^Catégorie;/.test(line)).filter(Boolean)
    expect(keep(withRows)).toEqual(keep(without))
  })

  it('sans mobilier, pas de tableau', () => {
    expect(measurementsToCsv(building, fr.measurements.csv, [])).not.toContain('Mobilier et équipements')
  })
})
