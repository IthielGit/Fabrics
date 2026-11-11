import { describe, expect, it } from 'vitest'
import type { Level, RoofElement, WallElement } from '../../types/document'
import { closedWallAxisAround } from '../documents/construction'
import { createRoofElement, createRoomElement, createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { buildBuildingModel } from './model'
import { wallThicknessUnder } from './roofModel'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)
const upper = createLevel('Étage 1', 2500, 2500, 200)
const RECT = [0, 0, 8000, 0, 8000, 6000, 0, 6000] // nu extérieur, 8000 × 6000
const TAN35 = Math.tan((35 * Math.PI) / 180)

/** Mur fermé dont le nu extérieur est le rectangle 0..8000 × 0..6000. */
function houseWalls(level: Level, thickness = 200): WallElement {
  const inner = { a: { x: thickness, y: thickness }, b: { x: 8000 - thickness, y: 6000 - thickness } }
  return {
    ...createWallElement('Mur', closedWallAxisAround(inner.a, inner.b, thickness), thickness, level.height),
    levelId: level.id,
  }
}

function roofOn(level: Level, partial: Partial<RoofElement> = {}): RoofElement {
  return { ...createRoofElement('Toiture', RECT), levelId: level.id, ...partial }
}

const innerRoom = (level: Level) => ({ ...createRoomElement('Pièce', [200, 200, 7800, 200, 7800, 5800, 200, 5800]), levelId: level.id })

describe('toiture en 3D', () => {
  it('deux pans : deux versants et deux pignons', () => {
    const model = buildBuildingModel({ elements: [houseWalls(ground), roofOn(ground)], levels: [ground] })
    expect(model.roofs.filter((p) => p.kind === 'roof')).toHaveLength(2)
    expect(model.roofs.filter((p) => p.kind === 'gable')).toHaveLength(2)
  })

  it('les versants ont l\'épaisseur de dalle du niveau, vers le bas (D42)', () => {
    const model = buildBuildingModel({ elements: [roofOn(ground)], levels: [ground] })
    for (const slope of model.roofs.filter((p) => p.kind === 'roof')) {
      expect(slope.extrude).toEqual({ x: 0, y: -200, z: 0 })
    }
  })

  it('un pignon prolonge le mur dessous : même épaisseur, vers l\'intérieur (D43)', () => {
    const model = buildBuildingModel({ elements: [houseWalls(ground, 300), roofOn(ground)], levels: [ground] })
    const gables = model.roofs.filter((p) => p.kind === 'gable')
    // Pignons sur les petits côtés x = 0 et x = 8000 : poussés vers l'intérieur de 300 mm.
    const byX = [...gables].sort((p, q) => p.polygon[0].x - q.polygon[0].x)
    expect(byX[0].extrude.x).toBeCloseTo(300)
    expect(byX[1].extrude.x).toBeCloseTo(-300)
    // Le sommet du pignon touche le dessous du versant, sous le faîtage (épaisseur 200 mm).
    const top = Math.max(...byX[0].polygon.map((p) => p.y))
    expect(top).toBeCloseTo(2500 + 3000 * TAN35 - 200)
  })

  it('sans mur dessous, le pignon prend l\'épaisseur des murs par défaut du plan', () => {
    const model = buildBuildingModel({
      elements: [roofOn(ground)],
      levels: [ground],
      plan: { scale: 50, gridSize: 100, snapToGrid: true, defaultWallThickness: 250, defaultWallHeight: 2500, northAngle: 0 },
    })
    const gable = model.roofs.find((p) => p.kind === 'gable')!
    expect(Math.hypot(gable.extrude.x, gable.extrude.z)).toBeCloseTo(250)
  })

  it('un pan : un versant, deux pignons et le mur haut rehaussé', () => {
    const model = buildBuildingModel({ elements: [roofOn(ground, { shape: 'shed' })], levels: [ground] })
    expect(model.roofs.filter((p) => p.kind === 'roof')).toHaveLength(1)
    expect(model.roofs.filter((p) => p.kind === 'gable')).toHaveLength(3)
  })

  it('croupe : quatre versants, aucun pignon', () => {
    const model = buildBuildingModel({ elements: [roofOn(ground, { shape: 'hip' })], levels: [ground] })
    expect(model.roofs.filter((p) => p.kind === 'roof')).toHaveLength(4)
    expect(model.roofs.filter((p) => p.kind === 'gable')).toHaveLength(0)
  })

  it('toit plat dessiné : une dalle dessus au haut des murs, débord compris (D44)', () => {
    const model = buildBuildingModel({
      elements: [roofOn(ground, { shape: 'flat', overhang: 300 })],
      levels: [ground],
    })
    expect(model.roofs).toEqual([])
    const slab = model.slabs.find((s) => s.kind === 'roof')!
    expect(slab.baseY + slab.thickness).toBe(2500)
    expect(slab.thickness).toBe(200)
    expect(Math.min(...slab.outline.map((p) => p.x))).toBeCloseTo(-300)
  })

  it('une toiture non valable ne donne aucun volume', () => {
    const trapeze = [0, 0, 8000, 0, 7000, 6000, 1000, 6000]
    const model = buildBuildingModel({ elements: [roofOn(ground, { points: trapeze })], levels: [ground] })
    expect(model.roofs).toEqual([])
  })

  it('l\'emprise monte jusqu\'au faîtage', () => {
    const model = buildBuildingModel({ elements: [houseWalls(ground), roofOn(ground)], levels: [ground] })
    expect(model.bounds?.max.y).toBeCloseTo(2500 + 3000 * TAN35)
  })
})

describe('toit plat automatique et niveaux (D45)', () => {
  it('une pièce sous une toiture dessinée n\'a plus de toit plat automatique', () => {
    const covered = buildBuildingModel({
      elements: [houseWalls(ground), innerRoom(ground), roofOn(ground)],
      levels: [ground],
    })
    expect(covered.slabs.filter((s) => s.kind === 'roof')).toHaveLength(0)
    const bare = buildBuildingModel({ elements: [houseWalls(ground), innerRoom(ground)], levels: [ground] })
    expect(bare.slabs.filter((s) => s.kind === 'roof')).toHaveLength(1)
  })

  it('une toiture d\'un autre niveau ne retire pas le toit automatique', () => {
    const model = buildBuildingModel({
      elements: [innerRoom(ground), roofOn(upper)],
      levels: [ground, upper],
    })
    // la pièce du rez n'a pas de pièce au-dessus : elle garde son toit plat
    expect(model.slabs.filter((s) => s.kind === 'roof' && s.levelId === ground.id)).toHaveLength(1)
  })

  it('la toiture est posée sur le dessus des murs de son niveau', () => {
    const model = buildBuildingModel({ elements: [roofOn(upper)], levels: [ground, upper] })
    const lowest = Math.min(...model.roofs.filter((p) => p.kind === 'gable').flatMap((p) => p.polygon.map((q) => q.y)))
    expect(lowest).toBe(5000)
  })

  it('vue « étage ouvert » sous le dernier niveau : aucune toiture', () => {
    const model = buildBuildingModel(
      { elements: [roofOn(ground)], levels: [ground, upper] },
      { upToLevelId: ground.id },
    )
    expect(model.roofs).toEqual([])
  })

  it('une toiture masquée n\'est pas dessinée', () => {
    const model = buildBuildingModel({ elements: [roofOn(ground, { hidden: true })], levels: [ground] })
    expect(model.roofs).toEqual([])
  })
})

describe('wallThicknessUnder', () => {
  it('trouve le mur dont l\'axe est à une demi-épaisseur sous le côté', () => {
    const walls = [houseWalls(ground, 300)]
    expect(wallThicknessUnder({ x: 0, y: 0 }, { x: 0, y: 6000 }, walls)).toBe(300)
  })

  it('ignore un mur trop loin du côté', () => {
    const walls = [houseWalls(ground, 300)]
    expect(wallThicknessUnder({ x: -1000, y: 0 }, { x: -1000, y: 6000 }, walls)).toBeNull()
  })
})
