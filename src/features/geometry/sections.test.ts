import { describe, expect, it } from 'vitest'
import { createAxisElement, createSectionElement } from '../documents/elements'
import { isLevelIndependent } from '../documents/levels'
import { elementBounds } from '../export/bounds'
import { nextSectionLabel, sectionGeometry, sectionLook, sectionTitle } from './sections'
import { moveVertex, translateElement } from './transform'

describe('nextSectionLabel', () => {
  it('commence à A puis suit les lettres', () => {
    const a = createSectionElement('Coupe A–A', 'A', [0, 0, 1000, 0])
    expect(nextSectionLabel([])).toBe('A')
    expect(nextSectionLabel([a])).toBe('B')
    expect(nextSectionLabel([a, createSectionElement('x', 'B', [0, 0, 0, 1000])])).toBe('C')
  })

  it('ignore les axes et les repères renommés à la main', () => {
    const axis = createAxisElement('Axe C', 'C', [0, 0, 1000, 0])
    const renamed = createSectionElement('x', 'A-1', [0, 0, 1000, 0])
    expect(nextSectionLabel([axis, renamed])).toBe('A')
  })
})

describe('sectionLook', () => {
  it('regarde à gauche du sens de tracé : tracé vers la droite, on regarde vers le haut du plan', () => {
    expect(sectionLook([0, 0, 1000, 0], true)).toEqual({ x: 0, y: -1 })
    expect(sectionLook([0, 0, 1000, 0], false)).toEqual({ x: 0, y: 1 })
  })

  it('tracé vers le bas, la gauche est l’est', () => {
    expect(sectionLook([0, 0, 0, 1000], true)).toEqual({ x: 1, y: 0 })
  })

  it('refuse deux points confondus', () => {
    expect(sectionLook([5, 5, 5, 5], true)).toBeNull()
    expect(sectionGeometry([5, 5, 5, 5], true)).toBeNull()
  })
})

describe('sectionGeometry', () => {
  it('place une flèche et une bulle à chaque bout, du côté du regard', () => {
    const g = sectionGeometry([0, 0, 4000, 0], true, 600, 250)
    expect(g?.arrows[0]).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: -600 },
    ])
    expect(g?.bubbles[1]).toEqual({ x: 4000, y: -850 })
    expect(g?.length).toBe(4000)
  })
})

describe('élément section', () => {
  const section = createSectionElement('Coupe A–A', 'A', [0, 0, 4000, 0])

  it('est commun à tous les niveaux et se déplace par ses points', () => {
    expect(isLevelIndependent(section)).toBe(true)
    expect(section.levelId).toBeUndefined()
    const moved = translateElement(section, 100, 50)
    expect(moved.type === 'section' && moved.points).toEqual([100, 50, 4100, 50])
    expect(moved.x).toBe(0)
  })

  it('un sommet se déplace', () => {
    const moved = moveVertex(section, 1, { x: 3000, y: 500 })
    expect(moved.type === 'section' && moved.points).toEqual([0, 0, 3000, 500])
  })

  it('son emprise exportée contient la ligne et les bulles', () => {
    const box = elementBounds(section)
    expect(box).not.toBeNull()
    expect(box?.x).toBeLessThanOrEqual(0)
    expect(box?.y).toBeLessThan(-600)
    expect(box?.width).toBeGreaterThanOrEqual(4000)
  })

  it('son titre est « A–A »', () => {
    expect(sectionTitle('A')).toBe('A–A')
  })
})
