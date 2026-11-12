import { describe, expect, it } from 'vitest'
import type { RoofCovering, RoofElement, WallElement, WallMaterial } from '../../../types/document'
import { closedWallAxisAround } from '../../documents/construction'
import { createRoofElement, createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { buildBuildingModel } from '../model'
import { composeSheet, drawingFromView } from './drawing'
import { buildElevation } from './elevation'
import { buildSection } from './section'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)
const RECT = [0, 0, 8000, 0, 8000, 6000, 0, 6000]

function house(material?: WallMaterial): WallElement {
  const wall = {
    ...createWallElement('Mur', closedWallAxisAround({ x: 200, y: 200 }, { x: 7800, y: 5800 }, 200), 200, 2500),
    levelId: ground.id,
  }
  return material ? { ...wall, material } : wall
}

function modelWith(material?: WallMaterial, covering?: RoofCovering) {
  const roof: RoofElement = { ...createRoofElement('Toiture', RECT), levelId: ground.id, ...(covering ? { covering } : {}) }
  return buildBuildingModel({ elements: [house(material), roof], levels: [ground] })
}

describe('textures de façade', () => {
  it('sans matériau ni couverture : aucune texture (rendu d\'avant)', () => {
    const view = buildElevation(modelWith(), [ground], 'N', 0)
    expect(view.faces.some((f) => f.texture)).toBe(false)
    const drawing = drawingFromView(view, 100)
    expect(drawing?.polygons.some((p) => p.hatch?.length)).toBe(false)
  })

  it('un mur en brique reçoit la texture « brique » en façade, tracée en traits', () => {
    const view = buildElevation(modelWith('brick'), [ground], 'N', 0)
    expect(view.faces.filter((f) => f.kind === 'wall' && f.texture === 'brick').length).toBeGreaterThan(0)
    const drawing = drawingFromView(view, 100)
    expect(drawing?.polygons.some((p) => (p.hatch?.length ?? 0) > 10)).toBe(true)
  })

  it('isolant et plâtre : pas de texture ; béton : enduit ; bois : bardage', () => {
    const textureOf = (m: WallMaterial) =>
      buildElevation(modelWith(m), [ground], 'N', 0).faces.find((f) => f.kind === 'wall')?.texture
    expect(textureOf('insulation')).toBeUndefined()
    expect(textureOf('plasterboard')).toBeUndefined()
    expect(textureOf('concrete')).toBe('render')
    expect(textureOf('wood')).toBe('cladding')
  })

  it('la couverture se voit sur les versants, pas sur les pignons', () => {
    const view = buildElevation(modelWith(undefined, 'tiles'), [ground], 'N', 0)
    expect(view.faces.filter((f) => f.kind === 'roof' && f.texture === 'tiles').length).toBeGreaterThan(0)
    expect(view.faces.filter((f) => f.kind === 'wall').some((f) => f.texture)).toBe(false)
  })

  it('toiture plate : pas de texture', () => {
    const view = buildElevation(modelWith(undefined, 'flat'), [ground], 'N', 0)
    expect(view.faces.some((f) => f.texture)).toBe(false)
  })

  it('en coupe, les murs vus derrière le plan sont texturés, la matière coupée reste hachurée', () => {
    const doc = { elements: [house('brick')], levels: [ground] }
    const view = buildSection(buildBuildingModel(doc), doc.levels, { points: [4000, -1000, 4000, 7000], lookLeft: false, label: 'A' })
    expect(view?.faces.some((f) => f.texture === 'brick' && !f.cut)).toBe(true)
    expect(view?.faces.filter((f) => f.cut).every((f) => !f.texture)).toBe(true)
  })

  it('la planche garde les traits de texture (déplacés avec le dessin)', () => {
    const drawing = drawingFromView(buildElevation(modelWith('brick'), [ground], 'N', 0), 100)
    if (!drawing) throw new Error('dessin attendu')
    const sheet = composeSheet([{ id: 'n', title: 'N', drawing }], 100)
    const count = (d: typeof drawing) => d.polygons.reduce((n, p) => n + (p.hatch?.length ?? 0), 0)
    expect(count(sheet.drawing)).toBe(count(drawing))
    expect(count(sheet.drawing)).toBeGreaterThan(0)
  })
})
