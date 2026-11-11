import { describe, expect, it } from 'vitest'
import type { Level, OpeningElement, WallElement } from '../../../types/document'
import { createOpeningElement, createRoomElement, createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { buildBuildingModel } from '../model'
import { buildSection } from './section'
import type { ViewFace } from './projection'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)
const upper = createLevel('Étage 1', 2500, 2500, 200)

function wallOn(level: Level, points: number[]): WallElement {
  return { ...createWallElement('Mur', points, 200, 2500), levelId: level.id }
}

function windowOn(wall: WallElement, offset: number): OpeningElement {
  return {
    ...createOpeningElement('window', 'Fenêtre', { wallId: wall.id, segmentIndex: 0, offset, side: 'left' }),
    levelId: wall.levelId,
    width: 1200,
    height: 1000,
    sillHeight: 900,
  }
}

function covered(faces: readonly ViewFace[], u: number, v: number, cut?: boolean, kind = 'wall'): boolean {
  return faces.some((f) => {
    if (f.kind !== kind) return false
    if (cut !== undefined && Boolean(f.cut) !== cut) return false
    const us = f.polygon.map((p) => p[0])
    const vs = f.polygon.map((p) => p[1])
    return u > Math.min(...us) && u < Math.max(...us) && v > Math.min(...vs) && v < Math.max(...vs)
  })
}

describe('buildSection', () => {
  // Mur de 4000 mm le long de x, fenêtre 1200 × 1000 à 900 mm d'allège, centrée en x = 2000.
  const wall = wallOn(ground, [0, 0, 4000, 0])
  const doc = { elements: [wall, windowOn(wall, 2000)], levels: [ground] }
  const model = buildBuildingModel(doc)
  // Ligne de coupe verticale à x = 2000, tracée vers le bas ; à gauche du sens de tracé : l'est.
  const line = { points: [2000, -2000, 2000, 2000], lookLeft: true, label: 'A' }

  it('coupe l’allège et le linteau en noir, mais pas la fenêtre', () => {
    const view = buildSection(model, doc.levels, line)
    expect(view).not.toBeNull()
    const faces = view?.faces ?? []
    expect(covered(faces, 0, 450, true)).toBe(true) // allège coupée
    expect(covered(faces, 0, 2200, true)).toBe(true) // linteau coupé
    expect(covered(faces, 0, 1400, true)).toBe(false) // vide de la fenêtre
    expect(covered(faces, 0, 1400, true, 'wall')).toBe(false) // aucun mur coupé dans la baie
    expect(covered(faces, 0, 1400, true, 'frame')).toBe(true) // le montant central est coupé (noir)
  })

  it('montre derrière la fenêtre le côté du trumeau, en blanc', () => {
    const faces = buildSection(model, doc.levels, line)?.faces ?? []
    expect(covered(faces, 0, 1400, false)).toBe(true)
  })

  it('la matière coupée mesure l’épaisseur du mur et sa hauteur', () => {
    const faces = buildSection(model, doc.levels, line)?.faces ?? []
    const cuts = faces.filter((f) => f.cut && f.kind === 'wall')
    expect(cuts.length).toBe(2)
    const us = cuts.flatMap((f) => f.polygon.map((p) => p[0]))
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(200)
    const vs = cuts.flatMap((f) => f.polygon.map((p) => p[1]))
    expect(Math.min(...vs)).toBeCloseTo(0)
    expect(Math.max(...vs)).toBeCloseTo(2500)
  })

  it('la matière coupée est dessinée en dernier (au premier plan)', () => {
    const faces = buildSection(model, doc.levels, line)?.faces ?? []
    const firstCut = faces.findIndex((f) => f.cut)
    expect(faces.slice(firstCut).every((f) => f.cut)).toBe(true)
  })

  it('déplacer la ligne de coupe change la coupe', () => {
    // À x = 700 : plein mur, aucun vide.
    const moved = buildSection(model, doc.levels, { ...line, points: [700, -2000, 700, 2000] })
    const cuts = (moved?.faces ?? []).filter((f) => f.cut)
    expect(cuts).toHaveLength(1)
    expect(covered(moved?.faces ?? [], 0, 1400, true)).toBe(true)
  })

  it('inverser le sens de vue regarde l’autre côté : le trumeau gauche apparaît', () => {
    const faces = buildSection(model, doc.levels, { ...line, lookLeft: false })?.faces ?? []
    // Vue vers l'ouest : on voit derrière la fenêtre le côté du trumeau de gauche (x = 0 à 1400).
    expect(covered(faces, 0, 1400, false)).toBe(true)
  })

  it('une ligne sans longueur ne donne pas de coupe', () => {
    expect(buildSection(model, doc.levels, { points: [5, 5, 5, 5], lookLeft: true, label: 'A' })).toBeNull()
  })

  it('une ligne de coupe qui ne rencontre rien donne une coupe vide', () => {
    const view = buildSection(model, doc.levels, { ...line, points: [9000, -2000, 9000, 2000] })
    expect(view?.faces).toEqual([])
    expect(view?.bounds).toBeNull()
  })

  it('coupe les dalles : une dalle de pièce coupée sur toute la pièce', () => {
    const room = { ...createRoomElement('Pièce', [0, 0, 4000, 0, 4000, 3000, 0, 3000]), levelId: ground.id }
    const slabModel = buildBuildingModel({ elements: [room], levels: [ground, upper] })
    const view = buildSection(slabModel, [ground, upper], {
      points: [2000, -500, 2000, 3500],
      lookLeft: true,
      label: 'B',
    })
    const cuts = (view?.faces ?? []).filter((f) => f.cut)
    expect(cuts.length).toBeGreaterThan(0)
    const us = cuts.flatMap((f) => f.polygon.map((p) => p[0]))
    // La dalle est coupée sur les 3000 mm de la pièce (u = y).
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(3000)
  })

  it('limite la coupe à la longueur de la ligne', () => {
    const short = buildSection(model, doc.levels, { ...line, points: [2000, -50, 2000, 50] })
    const us = (short?.faces ?? []).flatMap((f) => f.polygon.map((p) => p[0]))
    expect(Math.min(...us)).toBeGreaterThanOrEqual(-50 - 1e-6)
    expect(Math.max(...us)).toBeLessThanOrEqual(50 + 1e-6)
  })
})
