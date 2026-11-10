import { describe, expect, it } from 'vitest'
import { gridPositions, isMajorLine, visibleGridStep } from './grid'

describe('visibleGridStep', () => {
  it('garde le pas de la grille quand il y a assez de place', () => {
    // 100 mm × 0,2 px/mm = 20 px entre deux traits
    expect(visibleGridStep(100, 0.2)).toBe(100)
  })

  it('n’affiche qu’un trait sur n quand le zoom est faible', () => {
    // 100 mm × 0,05 = 5 px < 8 px → pas de 200 mm (10 px)
    expect(visibleGridStep(100, 0.05)).toBe(200)
    // 100 mm × 0,01 = 1 px → pas de 1 000 mm (10 px)
    expect(visibleGridStep(100, 0.01)).toBe(1000)
  })

  it('renvoie null quand même le pas le plus large est trop serré', () => {
    expect(visibleGridStep(100, 0.00001)).toBeNull()
  })

  it('refuse des valeurs invalides', () => {
    expect(visibleGridStep(0, 1)).toBeNull()
    expect(visibleGridStep(100, 0)).toBeNull()
  })
})

describe('gridPositions', () => {
  it('liste les traits de 0 à la longueur, bornes comprises', () => {
    expect(gridPositions(500, 100)).toEqual([0, 100, 200, 300, 400, 500])
  })

  it('s’arrête avant la longueur quand elle n’est pas un multiple du pas', () => {
    expect(gridPositions(450, 100)).toEqual([0, 100, 200, 300, 400])
  })

  it('compte les 20 m d’un plan à 10 cm : 201 traits', () => {
    expect(gridPositions(20_000, 100)).toHaveLength(201)
  })

  it('renvoie une liste vide pour un pas invalide', () => {
    expect(gridPositions(500, 0)).toEqual([])
  })
})

describe('isMajorLine', () => {
  it('marque les mètres entiers', () => {
    expect(isMajorLine(0)).toBe(true)
    expect(isMajorLine(1000)).toBe(true)
    expect(isMajorLine(7000)).toBe(true)
    expect(isMajorLine(500)).toBe(false)
    expect(isMajorLine(1100)).toBe(false)
  })
})
