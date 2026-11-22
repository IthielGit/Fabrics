import { describe, expect, it } from 'vitest'
import { fr } from '../../../i18n/fr'
import { offsetRing, roofPlanDrawing, ROOF_EDGE_MM } from './roofPlan'

type Pt = [number, number]
const L: Pt[] = [[0, 0], [4000, 0], [4000, 2000], [2000, 2000], [2000, 3000], [0, 3000]]

describe('plan de toiture (M20 20.1b)', () => {
  it('bord de toiture : contour décalé de 100 mm vers l’intérieur, angles vifs, dans les deux sens de parcours', () => {
    const expected = [[100, 100], [3900, 100], [3900, 1900], [1900, 1900], [1900, 2900], [100, 2900]]
    expect(offsetRing(L, ROOF_EDGE_MM).map((p) => p.map(Math.round))).toEqual(expected)
    const reversed = [...L].reverse()
    expect(offsetRing(reversed, ROOF_EDGE_MM).map((p) => p.map(Math.round)).sort()).toEqual([...expected].sort())
  })

  it('un trou est décalé vers l’extérieur du trou (dans la toiture)', () => {
    const hole: Pt[] = [[1000, 1000], [2000, 1000], [2000, 2000], [1000, 2000]]
    expect(offsetRing(hole, 100, -1).map((p) => p.map(Math.round)).sort()).toEqual([[900, 900], [2100, 900], [2100, 2100], [900, 2100]].sort())
  })

  it('double trait, flèche de pente avec son texte, pas de pièce ni de surface', () => {
    const d = roofPlanDrawing({ outlines: [{ outer: L, holes: [] }], slopes: [{ x: 1000, y: 1000, dx: -1, dy: 0, percent: 1 }] }, { slope: fr.views.roofSlope }, 100)!
    // 6 côtés extérieurs (trait de coupe) + 6 côtés du bord + flèche (3 traits)
    expect(d.lines.filter((l) => l.weight === 'cut')).toHaveLength(6)
    expect(d.lines).toHaveLength(15)
    expect(d.texts.map((t) => t.text)).toEqual(['Pente 1 %'])
    expect(d.texts[0].angle).toBeUndefined()
    expect(d.polygons).toEqual([])
  })

  it('flèche vers le nord : texte tourné le long de la flèche ; pente décimale en français', () => {
    const d = roofPlanDrawing({ outlines: [{ outer: L, holes: [] }], slopes: [{ x: 1000, y: 1000, dx: 0, dy: -1, percent: 1.5 }] }, { slope: fr.views.roofSlope }, 100)!
    expect(d.texts[0].text).toBe('Pente 1,5 %')
    // Lu de bas en haut (comme une cote verticale), à gauche de la flèche ; idem pour une flèche vers le sud.
    expect(d.texts[0].angle).toBe(-90)
    const arrowX = d.lines[d.lines.length - 3].x1
    expect(d.texts[0].x).toBeLessThan(arrowX)
    const south = roofPlanDrawing({ outlines: [{ outer: L, holes: [] }], slopes: [{ x: 1000, y: 1000, dx: 0, dy: 1, percent: 1 }] }, { slope: fr.views.roofSlope }, 100)!
    expect(south.texts[0].angle).toBe(-90)
  })

  it('rien à dessiner sans toiture', () => {
    expect(roofPlanDrawing({ outlines: [], slopes: [] }, { slope: fr.views.roofSlope })).toBeNull()
  })
})
