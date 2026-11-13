import { describe, expect, it } from 'vitest'
import { formatLength } from '../units/format'
import { DEMO_PLAN_SIZE } from './demoPlan'
import { countedValue, DEMO_FAULT, demoFaultLength, DIVIDER_AT, HERO_MODES, ROOM_SEQUENCE } from './heroModes'

describe('modes du hero', () => {
  it('présente trois plus-values, de la première à la dernière', () => {
    expect(HERO_MODES).toEqual(['sketch', 'measures', 'check'])
  })

  it('place le séparateur au milieu pour le croquis, et révèle le plan pour les deux autres', () => {
    expect(DIVIDER_AT.sketch).toBe(50)
    expect(DIVIDER_AT.measures).toBe(0)
    expect(DIVIDER_AT.check).toBe(0)
  })

  it('allume chaque pièce une seule fois', () => {
    expect(new Set(ROOM_SEQUENCE).size).toBe(ROOM_SEQUENCE.length)
    expect(ROOM_SEQUENCE).toEqual(['sejour', 'cuisine', 'entree'])
  })
})

describe('défaut de démonstration', () => {
  it('se superpose sur 800 mm, affichés en millimètres entiers', () => {
    expect(demoFaultLength()).toBe(800)
    expect(formatLength(demoFaultLength())).toBe('800 mm')
  })

  it('reste dans le plan, sur la cloison séjour | cuisine', () => {
    expect(DEMO_FAULT.x).toBe(5200)
    expect(DEMO_FAULT.fromY).toBeGreaterThanOrEqual(0)
    expect(DEMO_FAULT.toY).toBeLessThanOrEqual(DEMO_PLAN_SIZE.depth)
  })
})

describe('countedValue', () => {
  it('compte de 0 à la valeur exacte', () => {
    expect(countedValue(11_200_000, 0)).toBe(0)
    expect(countedValue(11_200_000, 0.5)).toBe(5_600_000)
    expect(countedValue(11_200_000, 1)).toBe(11_200_000)
  })

  it('borne la progression', () => {
    expect(countedValue(1000, -3)).toBe(0)
    expect(countedValue(1000, 7)).toBe(1000)
  })
})
