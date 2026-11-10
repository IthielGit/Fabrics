import { describe, expect, it } from 'vitest'
import { openingSymbol } from './openingSymbol'

type Kind = 'door' | 'window' | 'bay'
const make = (
  kind: Kind,
  hinge: 'start' | 'end' = 'start',
  side: 'left' | 'right' = 'left',
  width = 900,
) => openingSymbol({ kind, width, hinge, side }, 200)

/** Premier et dernier point d'un tracé `[x1, y1, x2, y2, …]`. */
function ends(line: number[]) {
  return {
    first: { x: line[0], y: line[1] },
    last: { x: line[line.length - 2], y: line[line.length - 1] },
  }
}

describe('openingSymbol : découpe', () => {
  it('découpe toute la largeur et un peu plus que l’épaisseur du mur', () => {
    const { cut } = make('door')
    expect(cut.x).toBe(-450)
    expect(cut.width).toBe(900)
    expect(cut.height).toBeGreaterThan(200)
    expect(cut.y).toBeCloseTo(-cut.height / 2)
  })
})

describe('openingSymbol : porte', () => {
  it('a deux montants, un battant et un arc', () => {
    expect(make('door').lines).toHaveLength(4)
  })

  it('battant perpendiculaire au mur, de la longueur de la porte', () => {
    const leaf = make('door', 'start', 'left').lines[2]
    expect(leaf).toEqual([-450, 0, -450, 900])
  })

  it('charnière à droite, ouverture de l’autre côté', () => {
    const leaf = make('door', 'end', 'right').lines[2]
    expect(leaf).toEqual([450, 0, 450, -900])
  })

  it.each([
    ['start', 'left'],
    ['start', 'right'],
    ['end', 'left'],
    ['end', 'right'],
  ] as const)('l’arc relie le bout du battant ouvert au bout du battant fermé (%s, %s)', (hinge, side) => {
    const [, , leaf, arc] = make('door', hinge, side).lines
    const hx = hinge === 'start' ? -450 : 450
    const otherJamb = -hx
    const { first, last } = ends(arc)
    // Début de l'arc = bout du battant ouvert.
    expect(first.x).toBeCloseTo(leaf[2], 6)
    expect(first.y).toBeCloseTo(leaf[3], 6)
    // Fin de l'arc = bout du battant fermé, dans l'axe du mur.
    expect(last.x).toBeCloseTo(otherJamb, 6)
    expect(last.y).toBeCloseTo(0, 6)
  })

  it('tous les points de l’arc sont à la distance « largeur » de la charnière', () => {
    const arc = make('door', 'end', 'left').lines[3]
    for (let i = 0; i < arc.length; i += 2) {
      expect(Math.hypot(arc[i] - 450, arc[i + 1])).toBeCloseTo(900, 6)
    }
  })

  it('l’arc reste du côté d’ouverture', () => {
    const arc = make('door', 'start', 'right').lines[3]
    for (let i = 1; i < arc.length; i += 2) expect(arc[i]).toBeLessThanOrEqual(1e-9)
  })
})

describe('openingSymbol : fenêtre', () => {
  it('a un cadre fermé et deux traits de vitrage dans le mur', () => {
    const { lines } = make('window', 'start', 'left', 1200)
    expect(lines).toHaveLength(3)
    const frame = lines[0]
    expect(frame.slice(0, 2)).toEqual(frame.slice(-2))
    for (const glass of lines.slice(1)) {
      expect(glass[0]).toBe(-600)
      expect(glass[2]).toBe(600)
      expect(Math.abs(glass[1])).toBeLessThan(100)
    }
  })
})

describe('openingSymbol : baie', () => {
  it('ne trace que deux montants', () => {
    const { lines } = make('bay', 'start', 'left', 2400)
    expect(lines).toEqual([
      [-1200, -100, -1200, 100],
      [1200, -100, 1200, 100],
    ])
  })
})
