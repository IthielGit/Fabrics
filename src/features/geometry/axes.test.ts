import { describe, expect, it } from 'vitest'
import { createAxisElement, createWallElement } from '../documents/elements'
import {
  axisBubblePoints,
  axisFamily,
  axisGeometry,
  axisIntersections,
  collectAxisSegments,
  lettersLabel,
  nearestPointOnAxes,
  nextAxisLabel,
  parseLettersLabel,
  parseNumberLabel,
} from './axes'

const horizontal = (label: string, y: number) =>
  createAxisElement(`Axe ${label}`, label, [0, y, 10000, y])
const vertical = (label: string, x: number) =>
  createAxisElement(`Axe ${label}`, label, [x, 0, x, 8000])

describe('étiquettes', () => {
  it('lettres : A…Z puis AA, AB…', () => {
    expect(lettersLabel(1)).toBe('A')
    expect(lettersLabel(3)).toBe('C')
    expect(lettersLabel(26)).toBe('Z')
    expect(lettersLabel(27)).toBe('AA')
    expect(lettersLabel(28)).toBe('AB')
    expect(lettersLabel(52)).toBe('AZ')
    expect(lettersLabel(53)).toBe('BA')
    expect(lettersLabel(0)).toBe('')
  })

  it('lecture des lettres : l’inverse de lettersLabel', () => {
    for (const n of [1, 2, 26, 27, 52, 53, 702, 703]) {
      expect(parseLettersLabel(lettersLabel(n))).toBe(n)
    }
    expect(parseLettersLabel(' b ')).toBe(2)
    expect(parseLettersLabel('A1')).toBeNull()
    expect(parseLettersLabel('')).toBeNull()
  })

  it('lecture des nombres', () => {
    expect(parseNumberLabel('3')).toBe(3)
    expect(parseNumberLabel(' 12 ')).toBe(12)
    expect(parseNumberLabel('0')).toBeNull()
    expect(parseNumberLabel('-2')).toBeNull()
    expect(parseNumberLabel('A')).toBeNull()
  })
})

describe('axisFamily', () => {
  it('distingue les axes horizontaux et verticaux', () => {
    expect(axisFamily([0, 0, 5000, 100])).toBe('horizontal')
    expect(axisFamily([0, 0, 100, 5000])).toBe('vertical')
    expect(axisFamily([0, 0, 1000, 1000])).toBe('horizontal') // à 45° : horizontal
  })
})

describe('nextAxisLabel', () => {
  it('le premier axe horizontal reçoit A, le premier vertical reçoit 1', () => {
    expect(nextAxisLabel([], [0, 0, 5000, 0])).toBe('A')
    expect(nextAxisLabel([], [0, 0, 0, 5000])).toBe('1')
  })

  it('un nouvel axe parallèle aux axes « A, B » reçoit « C »', () => {
    const elements = [horizontal('A', 0), horizontal('B', 3000)]
    expect(nextAxisLabel(elements, [0, 6000, 10000, 6000])).toBe('C')
  })

  it('les deux sens ont chacun leur suite', () => {
    const elements = [horizontal('A', 0), horizontal('B', 3000), vertical('1', 0)]
    expect(nextAxisLabel(elements, [0, 0, 0, 8000])).toBe('2')
    expect(nextAxisLabel(elements, [0, 0, 8000, 0])).toBe('C')
  })

  it('continue après la plus grande étiquette (pas de réutilisation d’un trou)', () => {
    const elements = [horizontal('A', 0), horizontal('C', 6000)]
    expect(nextAxisLabel(elements, [0, 9000, 10000, 9000])).toBe('D')
  })

  it('ignore les étiquettes renommées hors suite et les éléments qui ne sont pas des axes', () => {
    const elements = [
      horizontal('A', 0),
      horizontal('Façade', 3000),
      createWallElement('Mur', [0, 0, 1000, 0], 200, 2700),
    ]
    expect(nextAxisLabel(elements, [0, 9000, 10000, 9000])).toBe('B')
  })

  it('après Z vient AA', () => {
    expect(nextAxisLabel([horizontal('Z', 0)], [0, 100, 10000, 100])).toBe('AA')
  })
})

describe('axisGeometry', () => {
  it('place une bulle au prolongement de chaque extrémité', () => {
    const geometry = axisGeometry([0, 0, 4000, 0], 250)!
    expect(geometry.length).toBe(4000)
    expect(geometry.line).toEqual([
      { x: 0, y: 0 },
      { x: 4000, y: 0 },
    ])
    expect(geometry.bubbles[0].x).toBeCloseTo(-250)
    expect(geometry.bubbles[0].y).toBeCloseTo(0)
    expect(geometry.bubbles[1].x).toBeCloseTo(4250)
  })

  it('fonctionne dans toutes les directions', () => {
    const geometry = axisGeometry([0, 0, 0, 3000], 250)!
    expect(geometry.bubbles[0].y).toBeCloseTo(-250)
    expect(geometry.bubbles[1].y).toBeCloseTo(3250)
  })

  it('renvoie null si les deux points sont confondus', () => {
    expect(axisGeometry([5, 5, 5, 5])).toBeNull()
  })

  it('l’emprise comprend les deux bulles', () => {
    const xs = axisBubblePoints([0, 0, 4000, 0]).map((p) => p.x)
    expect(Math.min(...xs)).toBeCloseTo(-500)
    expect(Math.max(...xs)).toBeCloseTo(4500)
  })
})

describe('croisements et projection', () => {
  const axes = collectAxisSegments([horizontal('A', 3000), vertical('1', 4000)])

  it('collectAxisSegments ignore les axes masqués et exclus', () => {
    const hidden = { ...horizontal('B', 0), hidden: true }
    const excluded = horizontal('C', 100)
    expect(collectAxisSegments([hidden, excluded], new Set([excluded.id]))).toEqual([])
  })

  it('un axe horizontal et un axe vertical se croisent en un point', () => {
    expect(axisIntersections(axes)).toEqual([{ x: 4000, y: 3000 }])
  })

  it('deux axes parallèles ne se croisent pas', () => {
    const parallels = collectAxisSegments([horizontal('A', 0), horizontal('B', 3000)])
    expect(axisIntersections(parallels)).toEqual([])
  })

  it('nearestPointOnAxes projette sur la ligne, bornée au segment', () => {
    const p = nearestPointOnAxes({ x: 2000, y: 3050 }, axes, 100)
    expect(p).toEqual({ x: 2000, y: 3000 })
    expect(nearestPointOnAxes({ x: 2000, y: 3500 }, axes, 100)).toBeNull()
    // Au-delà du bout de l’axe horizontal (x > 10000) : la projection est ramenée à l’extrémité.
    expect(nearestPointOnAxes({ x: 10100, y: 3000 }, axes, 150)).toEqual({ x: 10000, y: 3000 })
  })
})
