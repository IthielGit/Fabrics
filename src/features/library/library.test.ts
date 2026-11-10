import { describe, expect, it } from 'vitest'
import { fr } from '../../i18n/fr'
import { applyNodeTransform } from '../geometry/transform'
import { createFurnitureElement } from '../documents/elements'
import { getSymbol, SYMBOLS } from './catalog'
import { drawSymbol } from './drawing'
import {
  arc,
  arcPoints,
  circle,
  ellipse,
  line,
  mirrorPrimitives,
  polygon,
  primitivesBounds,
  rect,
} from './primitives'
import { resizeSymbol } from './resize'
import { stairSteps } from './templates/stairs'
import type { SymbolDef } from './types'

const TOLERANCE = 1e-6

/** Nombres arrondis au millionième de mm : deux retournements ne sont exacts qu'à l'arrondi flottant près. */
function rounded<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)))
}

function def(overrides: Partial<SymbolDef>): SymbolDef {
  return {
    id: 'test',
    category: 'living',
    width: 1000,
    depth: 500,
    min: { width: 500, depth: 250 },
    max: { width: 2000, depth: 1000 },
    resize: 'free',
    mirrorable: true,
    height: 500,
    draw: (w, d) => [rect(0, 0, w, d, 'outline')],
    ...overrides,
  }
}

describe('primitives', () => {
  it('retourner deux fois redonne le dessin d’origine', () => {
    const original = [
      rect(100, 50, 300, 200, 'outline', 20),
      circle(250, 400, 80, 'detail'),
      ellipse(600, 300, 120, 60, 'detail'),
      line([10, 20, 500, 40, 700, 300], 'above'),
      polygon([0, 0, 400, 0, 200, 300], 'zone'),
      arc(300, 300, 200, -30, 120, 'detail'),
    ]
    const twice = mirrorPrimitives(mirrorPrimitives(original, 800), 800)
    expect(twice).toEqual(original)
  })

  it('un retournement garde le dessin dans la même boîte, en symétrie gauche / droite', () => {
    const original = [rect(100, 50, 300, 200, 'outline'), line([10, 20, 500, 40], 'detail')]
    const flipped = mirrorPrimitives(original, 800)
    expect(flipped[0]).toMatchObject({ x: 400, y: 50, w: 300, h: 200 })
    expect(flipped[1]).toMatchObject({ points: [790, 20, 300, 40] })
    const box = primitivesBounds(flipped)!
    expect(box.minX).toBeGreaterThanOrEqual(0)
    expect(box.maxX).toBeLessThanOrEqual(800)
  })

  it('un arc retourné couvre l’angle symétrique', () => {
    // Quart de cercle de 0° à 90° (de la droite vers le bas) → de 90° à 180° (du bas vers la gauche).
    const flipped = mirrorPrimitives([arc(0, 0, 100, 0, 90, 'detail')], 0)[0]
    expect(flipped).toMatchObject({ kind: 'arc', from: 90, to: 180 })
    const [x0, y0] = arcPoints(0, 0, 100, 90, 180)
    expect(x0).toBeCloseTo(0)
    expect(y0).toBeCloseTo(100)
  })

  it('arcPoints : extrémités exactes et un point tous les 5° au plus', () => {
    const points = arcPoints(0, 0, 100, 0, 90)
    expect(points).toHaveLength((90 / 5 + 1) * 2)
    expect(points[0]).toBeCloseTo(100)
    expect(points[1]).toBeCloseTo(0)
    expect(points[points.length - 2]).toBeCloseTo(0)
    expect(points[points.length - 1]).toBeCloseTo(100)
  })

  it('primitivesBounds : liste vide → null', () => {
    expect(primitivesBounds([])).toBeNull()
  })
})

describe('resizeSymbol', () => {
  const current = { width: 1000, depth: 500 }

  it('libre : largeur et profondeur suivent, dans les limites, en mm entiers', () => {
    expect(resizeSymbol(def({}), { width: 1500.4, depth: 700 }, current)).toEqual({
      width: 1500,
      depth: 700,
    })
    expect(resizeSymbol(def({}), { width: 5000, depth: 10 }, current)).toEqual({
      width: 2000,
      depth: 250,
    })
  })

  it('fixe : rien ne change', () => {
    expect(resizeSymbol(def({ resize: 'fixed' }), { width: 1500, depth: 900 }, current)).toEqual(
      current,
    )
  })

  it('longueur : seule la largeur change, la profondeur reste celle du catalogue', () => {
    const radiator = def({ resize: 'length', depth: 100 })
    expect(resizeSymbol(radiator, { width: 1400, depth: 900 }, { width: 1000, depth: 100 })).toEqual({
      width: 1400,
      depth: 100,
    })
  })

  it('proportions : la largeur commande, la profondeur suit', () => {
    const round = def({ resize: 'ratio', width: 1000, depth: 1000, min: { width: 600, depth: 600 }, max: { width: 1600, depth: 1600 } })
    expect(resizeSymbol(round, { width: 1200, depth: 1000 }, { width: 1000, depth: 1000 })).toEqual({
      width: 1200,
      depth: 1200,
    })
  })

  it('proportions : si seule la profondeur change, c’est elle qui commande', () => {
    const tall = def({ resize: 'ratio', min: { width: 100, depth: 50 }, max: { width: 4000, depth: 2000 } })
    // Rapport 2 : une profondeur de 600 donne une largeur de 1200.
    expect(resizeSymbol(tall, { width: 1000, depth: 600 }, { width: 1000, depth: 500 })).toEqual({
      width: 1200,
      depth: 600,
    })
  })

  it('proportions : les limites s’appliquent sans casser le rapport', () => {
    const round = def({ resize: 'ratio', width: 1000, depth: 1000, min: { width: 600, depth: 600 }, max: { width: 1600, depth: 1600 } })
    expect(resizeSymbol(round, { width: 9000, depth: 1000 }, { width: 1000, depth: 1000 })).toEqual({
      width: 1600,
      depth: 1600,
    })
    expect(resizeSymbol(round, { width: 100, depth: 1000 }, { width: 1000, depth: 1000 })).toEqual({
      width: 600,
      depth: 600,
    })
  })
})

describe('catalogue', () => {
  it('chaque identifiant est unique et en kebab-case', () => {
    const ids = SYMBOLS.map((symbol) => symbol.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('getSymbol retrouve un objet, ou undefined pour un identifiant inconnu', () => {
    expect(getSymbol('bed-queen')?.id).toBe('bed-queen')
    expect(getSymbol('inconnu')).toBeUndefined()
  })

  it('le lit 160 × 200 mesure bien 1600 × 2000 mm', () => {
    const bed = getSymbol('bed-queen')!
    expect(bed.width).toBe(1600)
    expect(bed.depth).toBe(2000)
  })

  describe.each(SYMBOLS.map((symbol) => [symbol.id, symbol] as const))('%s', (_id, symbol) => {
    it('min ≤ défaut ≤ max, et les tailles rapides sont dans les limites', () => {
      expect(symbol.min.width).toBeLessThanOrEqual(symbol.width)
      expect(symbol.width).toBeLessThanOrEqual(symbol.max.width)
      expect(symbol.min.depth).toBeLessThanOrEqual(symbol.depth)
      expect(symbol.depth).toBeLessThanOrEqual(symbol.max.depth)
      for (const size of symbol.sizes ?? []) {
        expect(size.width).toBeGreaterThanOrEqual(symbol.min.width)
        expect(size.width).toBeLessThanOrEqual(symbol.max.width)
        expect(size.depth).toBeGreaterThanOrEqual(symbol.min.depth)
        expect(size.depth).toBeLessThanOrEqual(symbol.max.depth)
      }
    })

    it('le dessin reste dans sa boîte, sans NaN, avec au moins un contour — aux tailles par défaut, min, max et rapides', () => {
      const sizes = [
        { width: symbol.width, depth: symbol.depth },
        symbol.min,
        symbol.max,
        { width: symbol.min.width, depth: symbol.max.depth },
        ...(symbol.sizes ?? []),
      ]
      for (const { width, depth } of sizes) {
        for (const mirrored of [false, true]) {
          const primitives = drawSymbol(symbol, width, depth, mirrored)
          expect(primitives.some((p) => p.style === 'outline' || p.style === 'above' || p.style === 'zone')).toBe(true)
          const box = primitivesBounds(primitives)!
          for (const value of Object.values(box)) expect(Number.isFinite(value)).toBe(true)
          expect(box.minX).toBeGreaterThanOrEqual(-TOLERANCE)
          expect(box.minY).toBeGreaterThanOrEqual(-TOLERANCE)
          expect(box.maxX).toBeLessThanOrEqual(width + TOLERANCE)
          expect(box.maxY).toBeLessThanOrEqual(depth + TOLERANCE)
        }
      }
    })

    it('retourner deux fois redonne le dessin', () => {
      const original = symbol.draw(symbol.width, symbol.depth)
      const twice = mirrorPrimitives(mirrorPrimitives(original, symbol.width), symbol.width)
      expect(rounded(twice)).toEqual(rounded(original))
    })
  })
})

describe('objet posé sur le plan', () => {
  const bed = getSymbol('bed-queen')!
  const element = () => createFurnitureElement('Lit 1', bed.id, 500, 700, bed.width, bed.depth)

  it('à rotation 0 et sans redimensionnement, la taille ne change pas', () => {
    const next = applyNodeTransform(element(), { x: 900, y: 800, rotation: 0, scaleX: 1, scaleY: 1 })
    expect(next).toMatchObject({ x: 900, y: 800, width: 1600, depth: 2000 })
  })

  it('le redimensionnement suit le mode et les limites du catalogue', () => {
    const next = applyNodeTransform(element(), { x: 500, y: 700, rotation: 0, scaleX: 1.5, scaleY: 0.5 })
    // 1600 × 1,5 = 2400 (dans les limites) ; 2000 × 0,5 = 1000 (le minimum : la moitié de 2000).
    expect(next).toMatchObject({ width: 2400, depth: 1000 })
  })

  it('une table ronde garde ses proportions', () => {
    const round = getSymbol('table-round-4')!
    const table = createFurnitureElement('Table 1', round.id, 0, 0, round.width, round.depth)
    const next = applyNodeTransform(table, { x: 0, y: 0, rotation: 0, scaleX: 1.3, scaleY: 1 })
    expect(next).toMatchObject({ width: 1300, depth: 1300 })
  })

  it('un objet inconnu garde la taille demandée (arrondie)', () => {
    const unknown = createFurnitureElement('?', 'objet-futur', 0, 0, 1000, 500)
    const next = applyNodeTransform(unknown, { x: 0, y: 0, rotation: 0, scaleX: 1.5, scaleY: 1 })
    expect(next).toMatchObject({ width: 1500, depth: 500 })
  })

  it('un objet n’a pas de niveau tant qu’il n’est pas posé dans le store', () => {
    expect(element().levelId).toBeUndefined()
    expect(element().mirrored).toBeUndefined()
  })
})

describe('textes du catalogue', () => {
  it('chaque objet a un nom français et des mots-clés dans fr.ts', () => {
    for (const symbol of SYMBOLS) {
      const text = fr.library.symbols[symbol.id]
      expect(text?.name, symbol.id).toBeTruthy()
      expect(text?.keywords.length, symbol.id).toBeGreaterThan(0)
    }
  })

  it('chaque catégorie utilisée a un intitulé', () => {
    for (const symbol of SYMBOLS) expect(fr.library.categories[symbol.category]).toBeTruthy()
  })
})

describe('escaliers', () => {
  it('le nombre de marches suit la longueur (giron ≈ 250 mm), au moins 3', () => {
    expect(stairSteps(2800)).toBe(11)
    expect(stairSteps(2500)).toBe(10)
    expect(stairSteps(1000)).toBe(4)
    expect(stairSteps(300)).toBe(3)
    expect(stairSteps(0)).toBe(3)
  })

  it('un escalier droit de 2 800 mm a 11 marches : 10 traits de marche + la flèche', () => {
    const stair = getSymbol('stair-straight')!
    const primitives = stair.draw(900, 2800)
    const treads = primitives.filter(
      (p) => p.kind === 'line' && p.points.length === 4 && p.points[1] === p.points[3] && p.points[0] === 0 && p.points[2] === 900,
    )
    expect(treads).toHaveLength(10)
  })

  it('un escalier hélicoïdal et un escalier en L se retournent (asymétriques)', () => {
    expect(getSymbol('stair-spiral')!.mirrorable).toBe(true)
    expect(getSymbol('stair-l')!.mirrorable).toBe(true)
  })
})
