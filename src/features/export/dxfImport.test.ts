import { describe, expect, it } from 'vitest'
import { writeDxf } from './dxf'
import {
  chainPaths,
  cleanDxfText,
  DXF_UNIT_FACTORS,
  DxfReadError,
  dxfPathsToLines,
  dxfTextsToElements,
  parseDxfText,
  pathsExtent,
  placeImport,
  unitFromInsunits,
} from './dxfImport'

/** Petit DXF écrit à la main : en-tête facultatif, blocs facultatifs, puis entités. */
function dxf(entities: string[], options: { insunits?: number; blocks?: string[] } = {}): string {
  const lines = ['0', 'SECTION', '2', 'HEADER']
  if (options.insunits !== undefined) lines.push('9', '$INSUNITS', '70', String(options.insunits))
  lines.push('0', 'ENDSEC')
  if (options.blocks) lines.push('0', 'SECTION', '2', 'BLOCKS', ...options.blocks, '0', 'ENDSEC')
  lines.push('0', 'SECTION', '2', 'ENTITIES', ...entities, '0', 'ENDSEC', '0', 'EOF')
  return lines.join('\n')
}

const line = (x1: number, y1: number, x2: number, y2: number, layer = '0') => [
  '0', 'LINE', '8', layer, '10', String(x1), '20', String(y1), '30', '0', '11', String(x2), '21', String(y2), '31', '0',
]

const len = (points: readonly number[]) => {
  let total = 0
  for (let i = 2; i + 1 < points.length; i += 2) total += Math.hypot(points[i] - points[i - 2], points[i + 1] - points[i - 1])
  return total
}

const meta = { name: 'Fond DXF – plan.dxf', groupId: 'g1', levelId: 'l1' }

describe('unitFromInsunits', () => {
  it('lit les unités courantes', () => {
    expect(unitFromInsunits(4)).toBe('mm')
    expect(unitFromInsunits(5)).toBe('cm')
    expect(unitFromInsunits(6)).toBe('m')
    expect(unitFromInsunits(1)).toBe('in')
    expect(unitFromInsunits(0)).toBeNull()
    expect(unitFromInsunits(null)).toBeNull()
  })
})

describe('parseDxfText', () => {
  it('une ligne de 5000 mm mesure 5000 mm une fois importée', () => {
    const parsed = parseDxfText(dxf(line(0, 0, 5000, 0), { insunits: 4 }))
    expect(parsed.insUnits).toBe(4)
    const [element] = dxfPathsToLines(parsed.paths, DXF_UNIT_FACTORS.mm, { x: 0, y: 0 }, meta)
    expect(len(element.points)).toBe(5000)
    expect(element).toMatchObject({ type: 'line', locked: true, groupId: 'g1', levelId: 'l1' })
  })

  it('un fichier en cm est converti en mm', () => {
    const parsed = parseDxfText(dxf(line(0, 0, 500, 0), { insunits: 5 }))
    const factor = DXF_UNIT_FACTORS[unitFromInsunits(parsed.insUnits) ?? 'mm']
    expect(len(dxfPathsToLines(parsed.paths, factor, { x: 0, y: 0 }, meta)[0].points)).toBe(5000)
  })

  it('relit un DXF exporté par Fabrics (aller-retour)', () => {
    const text = writeDxf([{ name: 'MURS', color: 7 }], [
      { kind: 'line', layer: 'MURS', x1: 0, y1: 0, x2: 5000, y2: 0 },
      { kind: 'polyline', layer: 'MURS', points: [0, 0, 4000, 0, 4000, 3000, 0, 3000], closed: true },
    ])
    const parsed = parseDxfText(text)
    expect(parsed.insUnits).toBe(4)
    const lines = dxfPathsToLines(parsed.paths, 1, { x: 0, y: 0 }, meta)
    expect(lines.map((l) => len(l.points))).toEqual([5000, 14000])
  })

  it('polyligne avec un arc (bulge = 1 : demi-cercle)', () => {
    const parsed = parseDxfText(
      dxf(['0', 'LWPOLYLINE', '8', '0', '90', '2', '70', '0', '10', '0', '20', '0', '42', '1', '10', '2000', '20', '0']),
    )
    const points = parsed.paths[0].points
    expect(points.slice(-2)).toEqual([2000, 0])
    // Demi-cercle de rayon 1000 tourné dans le sens direct : il passe sous la corde (y = -1000).
    expect(Math.min(...points.filter((_, i) => i % 2 === 1))).toBeCloseTo(-1000, 0)
    expect(len(points)).toBeCloseTo(Math.PI * 1000, -1)
  })

  it('cercle et arc', () => {
    const parsed = parseDxfText(
      dxf([
        '0', 'CIRCLE', '8', '0', '10', '0', '20', '0', '30', '0', '40', '500',
        '0', 'ARC', '8', '0', '10', '0', '20', '0', '30', '0', '40', '1000', '50', '0', '51', '90',
      ]),
    )
    expect(parsed.paths).toHaveLength(2)
    expect(parsed.paths[0].closed).toBe(true)
    const extent = pathsExtent([parsed.paths[0]])
    expect(extent?.maxX).toBeCloseTo(500)
    expect(parsed.paths[1].points.slice(-2).map((v) => Math.round(v))).toEqual([0, 1000])
  })

  it('développe les blocs insérés (position, rotation, échelle)', () => {
    const blocks = ['0', 'BLOCK', '8', '0', '2', 'PORTE', '70', '0', '10', '0', '20', '0', '30', '0', ...line(0, 0, 900, 0), '0', 'ENDBLK']
    const insert = ['0', 'INSERT', '8', '0', '2', 'PORTE', '10', '1000', '20', '2000', '30', '0', '41', '2', '42', '2', '50', '90']
    const parsed = parseDxfText(dxf(insert, { blocks }))
    const [x1, y1, x2, y2] = parsed.paths[0].points
    expect([x1, y1]).toEqual([1000, 2000])
    expect(x2).toBeCloseTo(1000)
    expect(y2).toBeCloseTo(3800)
  })

  it('refuse un fichier illisible ou sans trait', () => {
    expect(() => parseDxfText('pas un dxf')).toThrow(DxfReadError)
    expect(() => parseDxfText(dxf([]))).toThrow(DxfReadError)
  })
})

describe('chainPaths', () => {
  it('réunit les lignes qui se suivent', () => {
    const chained = chainPaths([
      { points: [0, 0, 1000, 0], closed: false },
      { points: [1000, 0, 1000, 1000], closed: false },
      { points: [5000, 5000, 6000, 5000], closed: false },
    ])
    expect(chained).toHaveLength(2)
    expect(chained[0].points).toEqual([0, 0, 1000, 0, 1000, 1000])
  })
})

describe('dxfPathsToLines', () => {
  it('retourne l’axe y et centre le dessin sur le point donné', () => {
    const [element] = dxfPathsToLines([{ points: [0, 0, 4000, 2000], closed: false }], 1, { x: 10000, y: 10000 }, meta)
    // Le point haut du dessin (y = 2000 dans le DXF) est en haut sur le plan (y plus petit).
    expect(element.points).toEqual([8000, 11000, 12000, 9000])
  })

  it('un trait fermé revient à son premier point', () => {
    const [element] = dxfPathsToLines([{ points: [0, 0, 1000, 0, 1000, 1000], closed: true }], 1, { x: 0, y: 0 }, meta)
    expect(element.points.slice(-2)).toEqual(element.points.slice(0, 2))
  })
})

const text = (x: number, y: number, height: number, value: string, rotation = 0) => [
  '0', 'TEXT', '8', '0', '10', String(x), '20', String(y), '30', '0', '40', String(height), '1', value, '50', String(rotation),
]
const mtext = (x: number, y: number, height: number, value: string, attachment = 1) => [
  '0', 'MTEXT', '8', '0', '10', String(x), '20', String(y), '30', '0', '40', String(height), '41', '2000', '71', String(attachment), '1', value,
]

describe('cleanDxfText', () => {
  it('décode les accents, les retours à la ligne et les symboles', () => {
    expect(cleanDxfText('Salle \\U+00E9t\\U+00E9')).toBe('Salle été')
    expect(cleanDxfText('{\\fArial|b0;Cuisine}\\PRDC')).toBe('Cuisine\nRDC')
    expect(cleanDxfText('%%c120 %%p5 20%%d')).toBe('Ø120 ±5 20°')
  })
})

describe('textes d’un DXF', () => {
  it('TEXT et MTEXT sont lus avec leur hauteur', () => {
    const parsed = parseDxfText(dxf([...line(0, 0, 5000, 0), ...text(100, 200, 125, 'Salon'), ...mtext(0, 3000, 200, 'Cuisine\\PRDC')]))
    expect(parsed.texts).toHaveLength(2)
    expect(parsed.texts[0]).toMatchObject({ x: 100, y: 200, height: 125, text: 'Salon', halign: 'left', valign: 'baseline' })
    expect(parsed.texts[1]).toMatchObject({ height: 200, text: 'Cuisine\nRDC', valign: 'top', width: 2000 })
  })

  it('un texte dans un bloc suit la position et l’échelle du bloc', () => {
    const blocks = ['0', 'BLOCK', '8', '0', '2', 'ETIQ', '70', '0', '10', '0', '20', '0', '30', '0', ...text(0, 0, 100, 'A'), '0', 'ENDBLK']
    const insert = ['0', 'INSERT', '8', '0', '2', 'ETIQ', '10', '1000', '20', '500', '30', '0', '41', '2', '42', '2']
    const parsed = parseDxfText(dxf([...line(0, 0, 10, 0), ...insert], { blocks }))
    expect(parsed.texts[0]).toMatchObject({ x: 1000, y: 500, height: 200 })
  })

  it('un fichier de textes seuls est accepté', () => {
    expect(parseDxfText(dxf(text(0, 0, 100, 'Seul'))).texts).toHaveLength(1)
  })

  it('la hauteur des majuscules en mm donne la taille de police, et l’axe y est retourné', () => {
    const parsed = parseDxfText(dxf([...line(0, 0, 4000, 2000), ...text(0, 2000, 140, 'Haut')]))
    const [element] = dxfTextsToElements(parsed.paths, parsed.texts, 1, { x: 10000, y: 10000 }, meta)
    expect(element.fontSize).toBe(200) // 140 / 0,7
    expect(element.text).toBe('Haut')
    expect(element.locked).toBe(true)
    expect(element.groupId).toBe('g1')
    expect(element.levelId).toBe('l1')
    // Le bord haut du dessin (y = 2000) est en haut : x = 8000, y = 9000 moins la ligne de base (0,8 × 200).
    expect(element.x).toBeCloseTo(8000)
    expect(element.y).toBeCloseTo(9000 - 160)
  })

  it('même échelle et même centrage que les traits', () => {
    const parsed = parseDxfText(dxf([...line(0, 0, 4000, 2000), ...text(4000, 0, 100, 'X')]))
    const [lineElement] = dxfPathsToLines(parsed.paths, 1, { x: 0, y: 0 }, meta, parsed.texts)
    const [element] = dxfTextsToElements(parsed.paths, parsed.texts, 1, { x: 0, y: 0 }, meta)
    // Le texte est posé au pied du trait (x = 4000, y = 0) : même repère.
    expect(element.x).toBeCloseTo(lineElement.points[2])
    expect(element.y + (100 / 0.7) * 0.8).toBeCloseTo(lineElement.points[1])
  })

  it('un texte tourné de 90° est lu de bas en haut', () => {
    const parsed = parseDxfText(dxf([...line(0, 0, 10, 0), ...text(0, 0, 100, 'V', 90)]))
    const [element] = dxfTextsToElements(parsed.paths, parsed.texts, 1, { x: 0, y: 0 }, meta)
    expect(element.rotation).toBe(270)
  })

  it('aller-retour avec l’export : un texte accentué retrouve sa hauteur', () => {
    const file = writeDxf(
      [{ name: 'T', color: 7 }],
      [
        { kind: 'line', layer: 'T', x1: 0, y1: 0, x2: 1000, y2: 0 },
        { kind: 'text', layer: 'T', x: 100, y: 100, height: 125, text: 'Séjour' },
      ],
    )
    const parsed = parseDxfText(file)
    expect(parsed.texts[0].text).toBe('Séjour')
    expect(parsed.texts[0].height).toBe(125)
  })
})

describe('placement d’un dessin importé sur la page', () => {
  const page = { width: 20000, height: 15000 }
  const MAX = 200000

  it('un dessin qui tient reste centré sur la vue, sans toucher la page', () => {
    const placed = placeImport(8000, 6000, page, { x: 10000, y: 7500 }, MAX)
    expect(placed).toEqual({ center: { x: 10000, y: 7500 } })
  })

  it('un dessin qui tient mais dont le centre de la vue est trop près du bord est ramené dans la page', () => {
    const placed = placeImport(8000, 6000, page, { x: -5000, y: 99999 }, MAX)
    expect(placed.page).toBeUndefined()
    expect(placed.center).toEqual({ x: 4000, y: 12000 })
  })

  it('un dessin plus grand que la page agrandit la page (marge comprise) et s’y centre', () => {
    const placed = placeImport(30000, 21000, page, { x: 0, y: 0 }, MAX)
    expect(placed.page).toEqual({ width: 34000, height: 25000 })
    expect(placed.center).toEqual({ x: 17000, y: 12500 })
  })

  it('la page ne dépasse pas la limite', () => {
    const placed = placeImport(500000, 100, page, { x: 0, y: 0 }, MAX)
    expect(placed.page?.width).toBe(MAX)
  })
})
