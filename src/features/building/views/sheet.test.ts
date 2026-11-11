import { describe, expect, it } from 'vitest'
import type { Level, WallElement } from '../../../types/document'
import { createOpeningElement, createRoomElement, createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { buildBuildingModel } from '../model'
import { composeSheet, drawingFromView, levelPlanDrawing, type Drawing } from './drawing'
import { buildElevation } from './elevation'
import { buildSheet, type SheetLabels } from './sheet'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)
const upper = createLevel('Étage 1', 2500, 2500, 200)

const wall = (level: Level, points: number[]): WallElement => ({
  ...createWallElement('Mur', points, 200, 2500),
  levelId: level.id,
})

const labels: SheetLabels = {
  elevation: { N: 'Façade Nord', E: 'Façade Est', S: 'Façade Sud', O: 'Façade Ouest' },
  section: (label) => `Coupe ${label}–${label}`,
}

const doc = {
  elements: [
    wall(ground, [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0]),
    { ...createRoomElement('Pièce', [0, 0, 4000, 0, 4000, 3000, 0, 3000]), levelId: ground.id },
    wall(upper, [0, 0, 4000, 0]),
  ],
  levels: [ground, upper],
}
const model = buildBuildingModel(doc)

function rect(width: number, height: number): Drawing {
  return { width, height, polygons: [], lines: [], texts: [] }
}

describe('drawingFromView', () => {
  it('une vue vide ne donne pas de dessin', () => {
    expect(drawingFromView({ faces: [], bounds: null, levels: [] })).toBeNull()
  })

  it('garde les dimensions réelles : la façade est large comme le mur plus les marges', () => {
    const view = buildElevation(model, doc.levels, 'N', 0)
    const drawing = drawingFromView(view, 100)
    expect(drawing).not.toBeNull()
    // 4200 mm (axes de 4000 mm + une épaisseur de 200) + 200 mm de marge à gauche + 1100 mm à droite (cotes de niveaux).
    expect(drawing?.width).toBeCloseTo(4200 + 200 + 1100)
    // 5000 mm de hauteur (2 niveaux) + dalles sous le sol + marges.
    expect(drawing?.height ?? 0).toBeGreaterThan(5000)
  })

  it('met une cote de niveau (nom et altitude en mm) par plancher', () => {
    const drawing = drawingFromView(buildElevation(model, doc.levels, 'N', 0), 100)
    const texts = drawing?.texts.map((t) => t.text) ?? []
    expect(texts).toContain('Rez-de-chaussée')
    expect(texts).toContain('± 0 mm')
    expect(texts).toContain('Étage 1')
    expect(texts).toContain('+ 2500 mm')
  })
})

describe('levelPlanDrawing', () => {
  it('dessine les murs et le sol du niveau seulement', () => {
    const plan = levelPlanDrawing(model, ground, 100)
    expect(plan).not.toBeNull()
    expect(plan?.polygons.some((p) => p.fill === 'black')).toBe(true) // murs coupés
    expect(plan?.polygons.some((p) => p.fill === 'light')).toBe(true)
    // 4200 × 3200 mm d'axes à axes + épaisseur : 4200 de large avec 200 de marge de chaque côté.
    expect(plan?.width).toBeCloseTo(4200 + 400)
  })

  it('coupé à 1 m : murs noirs sans trait, allège en blanc, vitre en filet', () => {
    const w = wall(ground, [0, 0, 4000, 0])
    const window = {
      ...createOpeningElement('window', 'Fenêtre', { wallId: w.id, segmentIndex: 0, offset: 2000, side: 'left' }),
      levelId: ground.id,
      width: 1200,
      height: 1000,
      sillHeight: 900,
    }
    const plan = levelPlanDrawing(buildBuildingModel({ elements: [w, window], levels: [ground] }), ground, 100)
    const walls = plan?.polygons.filter((p) => p.fill === 'black' && p.edges) ?? []
    expect(walls.length).toBe(2) // les deux trumeaux, le linteau est au-dessus de la coupe
    expect(walls.every((p) => p.edges?.every((e) => !e))).toBe(true)
    const whites = plan?.polygons.filter((p) => p.fill === 'white') ?? []
    expect(whites.length).toBe(2) // l'allège (sous la coupe) et la vitre
  })

  it('un niveau vide ne donne pas de plan', () => {
    const empty = createLevel('Étage 2', 5000, 2500, 200)
    expect(levelPlanDrawing(model, empty, 100)).toBeNull()
  })
})

describe('composeSheet', () => {
  it('une planche vide a une taille nulle', () => {
    expect(composeSheet([], 100).drawing.width).toBe(0)
  })

  it('range les dessins sans chevauchement et à leur taille réelle', () => {
    const entries = [
      { id: 'a', title: 'A', drawing: rect(5000, 3000) },
      { id: 'b', title: 'B', drawing: rect(4000, 3000) },
      { id: 'c', title: 'C', drawing: rect(6000, 2000) },
      { id: 'd', title: 'D', drawing: rect(3000, 2500) },
    ]
    const { placements, drawing } = composeSheet(entries, 100)
    expect(placements).toHaveLength(4)
    for (let i = 0; i < entries.length; i++) {
      const a = { ...placements[i], w: entries[i].drawing.width, h: entries[i].drawing.height + 320 }
      expect(a.x + a.w).toBeLessThanOrEqual(drawing.width + 1e-6)
      expect(a.y + a.h).toBeLessThanOrEqual(drawing.height + 1e-6)
      for (let j = i + 1; j < entries.length; j++) {
        const b = { ...placements[j], w: entries[j].drawing.width, h: entries[j].drawing.height + 320 }
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
        expect(overlap).toBe(false)
      }
    }
  })

  it('met le titre de chaque dessin', () => {
    const { drawing } = composeSheet([{ id: 'a', title: 'Façade Nord', drawing: rect(1000, 1000) }], 100)
    expect(drawing.texts.map((t) => t.text)).toEqual(['Façade Nord'])
  })
})

describe('buildSheet', () => {
  const sections = [{ points: [2000, -1000, 2000, 4000], lookLeft: true, label: 'A' }]

  it('réunit les niveaux, les quatre façades et les coupes avec leurs titres', () => {
    const { drawing } = buildSheet({ model, levels: doc.levels, sections, northAngle: 0, labels })
    const titles = drawing.texts.filter((t) => t.bold).map((t) => t.text)
    expect(titles).toEqual([
      'Rez-de-chaussée',
      'Étage 1',
      'Façade Nord',
      'Façade Est',
      'Façade Sud',
      'Façade Ouest',
      'Coupe A–A',
    ])
  })

  it('sans rien à montrer, la planche est vide', () => {
    const empty = buildBuildingModel({ elements: [], levels: [ground] })
    const sheet = buildSheet({ model: empty, levels: [ground], sections: [], northAngle: 0, labels })
    expect(sheet.drawing.width).toBe(0)
  })
})
