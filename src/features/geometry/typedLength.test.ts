import { describe, expect, it } from 'vitest'
import { isTypedLengthKey, pointAtTypedLength } from './typedLength'

describe('pointAtTypedLength', () => {
  it('place le point à la longueur tapée dans la direction du curseur', () => {
    expect(pointAtTypedLength({ x: 0, y: 0 }, { x: 1200, y: 0 }, '5000')).toEqual({ x: 5000, y: 0 })
    expect(pointAtTypedLength({ x: 100, y: 100 }, { x: 100, y: -20 }, '3500')).toEqual({ x: 100, y: -3400 })
  })

  it('suit une direction en biais en gardant la longueur exacte', () => {
    const point = pointAtTypedLength({ x: 0, y: 0 }, { x: 300, y: 400 }, '1000')
    expect(point?.x).toBeCloseTo(600)
    expect(point?.y).toBeCloseTo(800)
  })

  it('refuse une saisie vide, nulle ou non numérique, ou sans direction', () => {
    expect(pointAtTypedLength({ x: 0, y: 0 }, { x: 10, y: 0 }, '')).toBeNull()
    expect(pointAtTypedLength({ x: 0, y: 0 }, { x: 10, y: 0 }, '0')).toBeNull()
    expect(pointAtTypedLength({ x: 0, y: 0 }, { x: 10, y: 0 }, '-50')).toBeNull()
    expect(pointAtTypedLength({ x: 5, y: 5 }, { x: 5, y: 5 }, '1000')).toBeNull()
  })
})

describe('isTypedLengthKey', () => {
  it('accepte uniquement les chiffres', () => {
    expect(isTypedLengthKey('5')).toBe(true)
    expect(isTypedLengthKey('0')).toBe(true)
    expect(isTypedLengthKey('a')).toBe(false)
    expect(isTypedLengthKey('Enter')).toBe(false)
  })
})
