import { describe, expect, it } from 'vitest'
import type { Level, WallElement, WallMaterial } from '../../../types/document'
import { createWallElement } from '../../documents/elements'
import { createLevel } from '../../documents/levels'
import { buildBuildingModel } from '../model'
import { composeSheet, drawingFromView, levelPlanDrawing, type Drawing } from './drawing'
import { exposedOutline, type Segment } from './patterns'
import { buildSection } from './section'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)

function wallOn(level: Level, points: number[], material?: WallMaterial): WallElement {
  const wall = { ...createWallElement('Mur', points, 200, 2500), levelId: level.id }
  return material ? { ...wall, material } : wall
}

function inside(x: number, y: number, polygon: readonly [number, number][]): boolean {
  let result = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) result = !result
  }
  return result
}

const length = (segments: readonly Segment[]) =>
  segments.reduce((sum, [x1, y1, x2, y2]) => sum + Math.hypot(x2 - x1, y2 - y1), 0)

/** Un bâtiment de 4000 × 3000 mm et sa coupe transversale (x = 2000, regard vers les x croissants). */
function sectionDrawing(material?: WallMaterial): Drawing | null {
  const doc = { elements: [wallOn(ground, [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0], material)], levels: [ground] }
  const view = buildSection(buildBuildingModel(doc), doc.levels, {
    points: [2000, -1000, 2000, 4000],
    lookLeft: false,
    label: 'A',
  })
  return view ? drawingFromView(view, 100) : null
}

function planDrawing(material?: WallMaterial): Drawing | null {
  const doc = { elements: [wallOn(ground, [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0], material)], levels: [ground] }
  return levelPlanDrawing(buildBuildingModel(doc), ground, 100)
}

describe('exposedOutline', () => {
  const left: [number, number][] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ]
  const right: [number, number][] = [
    [10, 0],
    [20, 0],
    [20, 10],
    [10, 10],
  ]

  it('un polygone seul garde tout son contour', () => {
    expect(length(exposedOutline([left], [0]))).toBeCloseTo(40)
  })

  it('deux morceaux qui se touchent : le côté commun disparaît', () => {
    const outline = exposedOutline([left, right], [0, 1])
    expect(length(outline)).toBeCloseTo(60)
    expect(outline.some(([x1, , x2]) => Math.abs(x1 - 10) < 1e-6 && Math.abs(x2 - 10) < 1e-6)).toBe(false)
  })

  it('un morceau qui en chevauche un autre : seule la partie dehors est tracée', () => {
    const overlapping: [number, number][] = [
      [5, 2],
      [15, 2],
      [15, 8],
      [5, 8],
    ]
    // Le petit rectangle déborde de 5 mm à droite : 5 + 6 + 5 mm visibles.
    expect(length(exposedOutline([left, overlapping], [1]))).toBeCloseTo(16)
  })
})

describe('hachures dans les coupes', () => {
  it('sans matériau : la matière coupée reste noire, sans hachure (rendu d’avant)', () => {
    const drawing = sectionDrawing()
    expect(drawing?.polygons.some((p) => p.fill === 'black')).toBe(true)
    expect(drawing?.polygons.some((p) => p.hatch)).toBe(false)
    expect(drawing?.lines.some((l) => l.weight === 'cut')).toBe(false)
  })

  it('un mur en béton coupé : fond blanc hachuré, cerné d’un trait de coupe', () => {
    const drawing = sectionDrawing('concrete')
    const hatchedFaces = drawing?.polygons.filter((p) => p.hatch) ?? []
    // Les deux murs (y = 0 et y = 3000) sont coupés.
    expect(hatchedFaces.length).toBeGreaterThanOrEqual(2)
    for (const face of hatchedFaces) {
      expect(face.fill).toBe('white')
      expect(face.hatch?.length).toBeGreaterThan(0)
    }
    // Contour : au moins le tour des deux murs coupés (2 × (200 + 2500) × 2 mm).
    const outline = (drawing?.lines ?? []).filter((l) => l.weight === 'cut')
    const total = outline.reduce((sum, l) => sum + Math.hypot(l.x2 - l.x1, l.y2 - l.y1), 0)
    expect(total).toBeGreaterThan(2 * 2 * (200 + 2500) - 1)
  })

  it('changer le matériau change la hachure', () => {
    const count = (m: WallMaterial) =>
      (sectionDrawing(m)?.polygons ?? []).filter((p) => p.edges?.every((e) => !e)).reduce((sum, p) => sum + (p.hatch?.length ?? 0), 0)
    // Béton : traits deux fois plus serrés que la maçonnerie.
    expect(count('concrete')).toBeGreaterThan(count('masonry') * 1.5)
    expect(count('brick')).toBeGreaterThan(count('masonry') * 1.5)
  })

  it('les traits restent dans la matière coupée', () => {
    const drawing = sectionDrawing('masonry')
    for (const face of drawing?.polygons.filter((p) => p.hatch) ?? []) {
      const xs = face.points.map((p) => p[0])
      const ys = face.points.map((p) => p[1])
      for (const [x1, y1, x2, y2] of face.hatch ?? []) {
        for (const [x, y] of [
          [x1, y1],
          [x2, y2],
        ]) {
          expect(x).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6)
          expect(x).toBeLessThanOrEqual(Math.max(...xs) + 1e-6)
          expect(y).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6)
          expect(y).toBeLessThanOrEqual(Math.max(...ys) + 1e-6)
        }
      }
    }
  })
})

describe('hachures dans les plans de niveau', () => {
  it('sans matériau : murs noirs, sans contour ajouté', () => {
    const drawing = planDrawing()
    expect(drawing?.polygons.some((p) => p.hatch)).toBe(false)
    expect(drawing?.lines).toEqual([])
  })

  it('avec un matériau : murs blancs hachurés et contour sans couture aux angles', () => {
    const drawing = planDrawing('brick')
    const hatchedFaces = drawing?.polygons.filter((p) => p.hatch) ?? []
    expect(hatchedFaces.length).toBe(4)
    const lines = drawing?.lines ?? []
    const total = lines.reduce((sum, l) => sum + Math.hypot(l.x2 - l.x1, l.y2 - l.y1), 0)
    // Au moins le contour extérieur 4200 × 3200 et intérieur 3800 × 2800 (14800 + 13200 mm).
    expect(total).toBeGreaterThanOrEqual(2 * (4200 + 3200) + 2 * (3800 + 2800) - 1)
    // Aucune couture : de part et d'autre de chaque trait, l'un des côtés est hors de la matière.
    const solid = hatchedFaces.map((p) => p.points)
    const inSolid = (x: number, y: number) => solid.some((poly) => inside(x, y, poly))
    for (const l of lines) {
      const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1)
      const mx = (l.x1 + l.x2) / 2
      const my = (l.y1 + l.y2) / 2
      const nx = -(l.y2 - l.y1) / len
      const ny = (l.x2 - l.x1) / len
      expect(inSolid(mx + nx, my + ny) && inSolid(mx - nx, my - ny)).toBe(false)
    }
  })

  it('la planche déplace les hachures avec leur dessin', () => {
    const plan = planDrawing('concrete')
    expect(plan).not.toBeNull()
    if (!plan) return
    const { drawing, placements } = composeSheet(
      [
        { id: 'a', title: 'A', drawing: plan },
        { id: 'b', title: 'B', drawing: plan },
      ],
      100,
    )
    const second = placements[1]
    const firstHatch = plan.polygons.find((p) => p.hatch)?.hatch?.[0]
    const index = plan.polygons.findIndex((p) => p.hatch)
    const moved = drawing.polygons[plan.polygons.length + index].hatch?.[0]
    expect(firstHatch && moved).toBeTruthy()
    if (!firstHatch || !moved) return
    expect(moved[0] - firstHatch[0]).toBeCloseTo(second.x)
    expect(moved[2] - firstHatch[2]).toBeCloseTo(second.x)
  })
})
