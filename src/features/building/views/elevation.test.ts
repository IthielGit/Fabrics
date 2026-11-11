import { describe, expect, it } from 'vitest'
import type { Level, OpeningElement, WallElement } from '../../../types/document'
import { createOpeningElement, createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { buildBuildingModel } from '../model'
import type { BuildingModel } from '../types'
import { buildElevation } from './elevation'
import { boxFaces, levelMarks, lookTowards, paintOrder, rightOf, slabFaces } from './projection'

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

/** Vrai si le point (u, v) de la vue est couvert par au moins une face (toutes sont des rectangles). */
function covered(faces: readonly { polygon: [number, number][] }[], u: number, v: number): boolean {
  return faces.some((f) => {
    const us = f.polygon.map((p) => p[0])
    const vs = f.polygon.map((p) => p[1])
    return u > Math.min(...us) && u < Math.max(...us) && v > Math.min(...vs) && v < Math.max(...vs)
  })
}

describe('projection', () => {
  it('le regard vers le sud a l’ouest à sa droite', () => {
    expect(rightOf({ x: 0, y: 1 })).toEqual({ x: -1, y: 0 })
  })

  it('lookTowards inverse la direction de la façade', () => {
    expect(lookTowards({ x: 0, y: -1 })).toEqual({ x: 0, y: 1 })
  })

  it('un mur vu de face donne une face de la largeur du mur et de la hauteur d’étage', () => {
    const model = buildBuildingModel({ elements: [wallOn(ground, [0, 0, 4000, 0])], levels: [ground] })
    const faces = boxFaces(model.walls[0], { x: 0, y: 1 }, 'wall')
    expect(faces).toHaveLength(1)
    const us = faces[0].polygon.map((p) => p[0])
    const vs = faces[0].polygon.map((p) => p[1])
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(4000)
    expect(Math.min(...vs)).toBeCloseTo(0)
    expect(Math.max(...vs)).toBeCloseTo(2500)
  })

  it('une dalle carrée montre ses deux côtés tournés vers la vue seulement', () => {
    const faces = slabFaces(
      {
        sourceId: 's',
        levelId: 'l',
        kind: 'slab',
        outline: [
          { x: 0, y: 0 },
          { x: 4000, y: 0 },
          { x: 4000, y: 3000 },
          { x: 0, y: 3000 },
        ],
        baseY: -200,
        thickness: 200,
      },
      { x: 0, y: 1 },
    )
    // Regard vers le sud : seul le côté nord (y = 0) fait face à la personne ; les côtés est et ouest sont de tranche.
    expect(faces).toHaveLength(1)
    expect(faces[0].polygon[0][1]).toBe(-200)
    expect(faces[0].polygon[2][1]).toBe(0)
  })

  it('paintOrder met la face la plus lointaine en premier', () => {
    const near = { polygon: [] as [number, number][], depth: 1, kind: 'wall' as const, sourceId: 'a', levelId: 'l' }
    const far = { ...near, depth: 9, sourceId: 'b' }
    expect(paintOrder([near, far]).map((f) => f.sourceId)).toEqual(['b', 'a'])
  })

  it('levelMarks trie les niveaux par altitude', () => {
    expect(levelMarks([upper, ground]).map((m) => m.elevation)).toEqual([0, 2500])
  })
})

describe('buildElevation', () => {
  const wall = wallOn(ground, [0, 0, 4000, 0])
  const doc = { elements: [wall, windowOn(wall, 2000)], levels: [ground] }
  const model = buildBuildingModel(doc)

  it('la façade Nord montre la fenêtre du mur, de 900 à 1 900 mm', () => {
    const view = buildElevation(model, doc.levels, 'N', 0)
    // Vue du nord : l'est est à gauche, donc u = −x ; la fenêtre est entre x = 1 400 et 2 600.
    expect(covered(view.faces, -2000, 1400)).toBe(false)
    expect(covered(view.faces, -2000, 450)).toBe(true) // allège
    expect(covered(view.faces, -2000, 2200)).toBe(true) // linteau
    expect(covered(view.faces, -700, 1400)).toBe(true) // trumeau
    expect(covered(view.faces, -2000, 899)).toBe(true)
    expect(covered(view.faces, -2000, 1901)).toBe(true)
  })

  it('la façade Sud voit aussi le mur, de l’autre côté (u = x)', () => {
    const view = buildElevation(model, doc.levels, 'S', 0)
    expect(covered(view.faces, 2000, 1400)).toBe(false)
    expect(covered(view.faces, 700, 1400)).toBe(true)
  })

  it('l’emprise couvre la largeur du mur et sa hauteur', () => {
    const view = buildElevation(model, doc.levels, 'N', 0)
    expect(view.bounds?.maxU).toBeCloseTo(0)
    expect(view.bounds?.minU).toBeCloseTo(-4000)
    expect(view.bounds?.minV).toBeCloseTo(0)
    expect(view.bounds?.maxV).toBeGreaterThanOrEqual(2500)
  })

  it('la façade Est ne voit le mur que par sa tranche de 200 mm', () => {
    const view = buildElevation(model, doc.levels, 'E', 0)
    expect(view.bounds).not.toBeNull()
    expect((view.bounds?.maxU ?? 0) - (view.bounds?.minU ?? 0)).toBeCloseTo(200)
  })

  it('le nord tourné de 90° : la façade Nord regarde l’ancienne façade Est', () => {
    const view = buildElevation(model, doc.levels, 'N', 90)
    expect((view.bounds?.maxU ?? 0) - (view.bounds?.minU ?? 0)).toBeCloseTo(200)
  })

  it('donne les cotes de niveaux et reste vide sans modèle', () => {
    const empty: BuildingModel = { walls: [], steps: [], chimneys: [], slabs: [], bounds: null }
    const view = buildElevation(empty, [ground, upper], 'N', 0)
    expect(view.faces).toEqual([])
    expect(view.bounds).toBeNull()
    expect(view.levels.map((l) => l.elevation)).toEqual([0, 2500])
  })
})
