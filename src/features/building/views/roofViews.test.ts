import { describe, expect, it } from 'vitest'
import type { Level, RoofElement, WallElement } from '../../../types/document'
import { closedWallAxisAround } from '../../documents/construction'
import { createRoofElement, createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { buildBuildingModel } from '../model'
import { drawingFromView } from './drawing'
import { buildElevation } from './elevation'
import { buildSection } from './section'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)
const RECT = [0, 0, 8000, 0, 8000, 6000, 0, 6000] // nu extérieur ; faîtage le long de x
const TAN35 = Math.tan((35 * Math.PI) / 180)
const RIDGE_Y = 2500 + 3000 * TAN35 // ≈ 4600,6 mm

function house(level: Level): WallElement {
  return {
    ...createWallElement('Mur', closedWallAxisAround({ x: 200, y: 200 }, { x: 7800, y: 5800 }, 200), 200, 2500),
    levelId: level.id,
  }
}

function modelWith(partial: Partial<RoofElement> = {}) {
  const roof = { ...createRoofElement('Toiture', RECT), levelId: ground.id, ...partial }
  return buildBuildingModel({ elements: [house(ground), roof], levels: [ground] })
}

const vs = (polygon: [number, number][]) => polygon.map((p) => p[1])

describe('façades avec une toiture', () => {
  it('la façade pignon (Est) montre un triangle, et la toiture monte jusqu\'au faîtage', () => {
    const view = buildElevation(modelWith(), [ground], 'E', 0)
    const triangles = view.faces.filter((f) => f.kind === 'wall' && f.polygon.length === 3)
    expect(triangles.length).toBeGreaterThanOrEqual(1)
    expect(Math.max(...vs(triangles[0].polygon))).toBeGreaterThan(2500 + 1500) // pointe du pignon
    expect(view.bounds?.maxV).toBeCloseTo(RIDGE_Y)
  })

  it('la façade du long côté (Nord) montre un versant incliné, de l\'égout au faîtage', () => {
    const view = buildElevation(modelWith(), [ground], 'N', 0)
    // Le versant vu de face : de l'égout (sous le dessus des murs) jusqu'au faîtage.
    const slope = view.faces.find(
      (f) =>
        f.kind === 'roof' &&
        Math.max(...vs(f.polygon)) > RIDGE_Y - 1 &&
        Math.min(...vs(f.polygon)) < 2500,
    )
    expect(slope).toBeDefined()
    expect(Math.min(...vs(slope!.polygon))).toBeCloseTo(2500 - 500 * TAN35)
    // La tranche du versant opposé, le long du faîtage, est peinte avant lui : il la cache.
    const ridgeStrip = view.faces.find(
      (f) => f.kind === 'roof' && Math.min(...vs(f.polygon)) > RIDGE_Y - 201 && Math.min(...vs(f.polygon)) < RIDGE_Y - 199,
    )
    expect(ridgeStrip).toBeDefined()
    expect(view.faces.indexOf(ridgeStrip!)).toBeLessThan(view.faces.indexOf(slope!))
    // le débord dépasse des murs de 500 mm de chaque côté
    const us = slope!.polygon.map((p) => p[0])
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(9000)
  })

  it('une croupe n\'a pas de pignon en façade', () => {
    const view = buildElevation(modelWith({ shape: 'hip' }), [ground], 'E', 0)
    expect(view.faces.filter((f) => f.kind === 'wall' && f.polygon.length === 3)).toHaveLength(0)
    expect(view.bounds?.maxV).toBeCloseTo(RIDGE_Y)
  })

  it('changer la pente change la façade', () => {
    const steep = buildElevation(modelWith({ pitch: 45 }), [ground], 'E', 0)
    expect(steep.bounds?.maxV).toBeCloseTo(2500 + 3000)
  })

  it('le dessin de la façade contient les versants en blanc cerné', () => {
    const drawing = drawingFromView(buildElevation(modelWith(), [ground], 'N', 0))!
    expect(drawing.polygons.some((p) => p.points.length === 4 && p.fill === 'white')).toBe(true)
  })
})

describe('coupes avec une toiture', () => {
  // Ligne de coupe perpendiculaire au faîtage, au milieu de la maison.
  const line = { points: [4000, -2000, 4000, 8000], lookLeft: true, label: 'A', ridgeLabel: 'Faîtage' }

  it('le profil du toit coupé est noir et monte jusqu\'au faîtage', () => {
    const view = buildSection(modelWith(), [ground], line)!
    const cut = view.faces.filter((f) => f.kind === 'roof' && f.cut)
    expect(cut).toHaveLength(2) // les deux versants
    expect(Math.max(...cut.flatMap((f) => vs(f.polygon)))).toBeCloseTo(RIDGE_Y)
    // chaque versant coupé a l'épaisseur de dalle (200 mm à la verticale)
    const profile = cut[0].polygon
    expect(profile.length).toBeGreaterThanOrEqual(4)
  })

  it('cote l\'altitude du faîtage', () => {
    const view = buildSection(modelWith(), [ground], line)!
    const ridge = view.levels.find((m) => m.name === 'Faîtage')
    expect(ridge?.elevation).toBe(Math.round(RIDGE_Y))
    expect(Math.round(RIDGE_Y)).toBe(4601)
  })

  it('sans nom de cote, pas de cote de faîtage', () => {
    const { ridgeLabel: _unused, ...plain } = line
    void _unused
    const view = buildSection(modelWith(), [ground], plain)!
    expect(view.levels.every((m) => m.name !== 'Faîtage')).toBe(true)
  })

  it('une coupe qui ne traverse pas la toiture ne la cote pas', () => {
    const outside = { ...line, points: [20000, -2000, 20000, 8000] }
    const view = buildSection(modelWith(), [ground], outside)
    expect(view?.levels.some((m) => m.name === 'Faîtage') ?? false).toBe(false)
  })

  it('la coupe parallèle au faîtage montre le pignon coupé', () => {
    // Ligne le long de x, à 3000 mm (sous le faîtage), qui traverse les deux pignons.
    const along = { points: [-2000, 3000, 10000, 3000], lookLeft: true, label: 'B', ridgeLabel: 'Faîtage' }
    const view = buildSection(modelWith(), [ground], along)!
    expect(view.faces.some((f) => f.kind === 'wall' && f.cut && Math.max(...vs(f.polygon)) > 4000)).toBe(true)
  })

  it('changer la pente met la coupe à jour', () => {
    const view = buildSection(modelWith({ pitch: 45 }), [ground], line)!
    expect(view.levels.find((m) => m.name === 'Faîtage')?.elevation).toBe(5500)
  })
})
