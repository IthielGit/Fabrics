import { describe, expect, it } from 'vitest'
import { dimensionGeometry } from './dimension'

describe('dimensionGeometry', () => {
  it('mesure la distance entre les deux points', () => {
    expect(dimensionGeometry([0, 0, 3500, 0], 500)!.length).toBe(3500)
    expect(dimensionGeometry([0, 0, 3000, 4000], 0)!.length).toBe(5000)
  })

  it('décale la ligne de cote perpendiculairement', () => {
    const g = dimensionGeometry([0, 0, 3500, 0], 500)!
    expect(g.line[0]).toEqual({ x: 0, y: 500 })
    expect(g.line[1]).toEqual({ x: 3500, y: 500 })
    expect(g.center).toEqual({ x: 1750, y: 500 })
  })

  it('un décalage négatif place la ligne de l’autre côté', () => {
    const g = dimensionGeometry([0, 0, 3500, 0], -500)!
    expect(g.line[0].y).toBe(-500)
  })

  it('les lignes d’attache partent des points mesurés et dépassent la ligne de cote', () => {
    const g = dimensionGeometry([0, 0, 3500, 0], 500)!
    expect(g.extensions[0][0]).toEqual({ x: 0, y: 0 })
    expect(g.extensions[0][1]).toEqual({ x: 0, y: 600 }) // 500 + 100 de dépassement
    expect(g.extensions[1][1]).toEqual({ x: 3500, y: 600 })
  })

  it('dépasse aussi du côté négatif', () => {
    const g = dimensionGeometry([0, 0, 3500, 0], -500)!
    expect(g.extensions[0][1]).toEqual({ x: 0, y: -600 })
  })

  it('texte horizontal : angle 0', () => {
    expect(dimensionGeometry([0, 0, 1000, 0], 0)!.textAngle).toBe(0)
  })

  it('le texte reste lisible quand on mesure de droite à gauche', () => {
    expect(dimensionGeometry([1000, 0, 0, 0], 0)!.textAngle).toBeCloseTo(0)
  })

  it('texte vertical : 90° ou -90° mais jamais à l’envers', () => {
    const down = dimensionGeometry([0, 0, 0, 1000], 0)!.textAngle
    const up = dimensionGeometry([0, 1000, 0, 0], 0)!.textAngle
    expect(Math.abs(down)).toBeCloseTo(90)
    expect(Math.abs(up)).toBeCloseTo(90)
  })

  it('l’angle du texte reste dans ]-90, 90]', () => {
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180
      const g = dimensionGeometry([0, 0, Math.cos(rad) * 1000, Math.sin(rad) * 1000], 0)!
      expect(g.textAngle).toBeGreaterThan(-90 - 1e-9)
      expect(g.textAngle).toBeLessThanOrEqual(90 + 1e-9)
    }
  })

  it('renvoie null pour deux points confondus', () => {
    expect(dimensionGeometry([5, 5, 5, 5], 500)).toBeNull()
  })
})
