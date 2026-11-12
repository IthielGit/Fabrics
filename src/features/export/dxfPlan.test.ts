import { describe, expect, it } from 'vitest'
import type { CanvasElement, WallElement } from '../../types/document'
import {
  createAxisElement,
  createDimensionElement,
  createFurnitureElement,
  createOpeningElement,
  createRoomElement,
  createWallElement,
} from '../documents/elements'
import { createLevel } from '../documents/levels'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import type { DxfEntity } from './dxf'
import { DXF_LAYERS, levelDxf, levelDxfEntities } from './dxfPlan'

const ground = createLevel('Rez-de-chaussée', 0, 2700, 200)
const upper = createLevel('Étage 1', 2700, 2700, 200)
const LABELS = EXECUTION_LABELS
const OPTIONS = { mode: 'none' as const, labels: LABELS, fontMm: 125 }

function wall(points: number[], levelId = ground.id): WallElement {
  return { ...createWallElement('Mur', points, 200, 2700), levelId }
}

function entities(elements: CanvasElement[]): DxfEntity[] {
  return levelDxfEntities({ elements, levels: [ground, upper] }, ground.id, OPTIONS)
}

const length = (e: DxfEntity) => (e.kind === 'line' ? Math.hypot(e.x2 - e.x1, e.y2 - e.y1) : 0)
const onLayer = (list: DxfEntity[], layer: string) => list.filter((e) => e.layer === layer)

describe('levelDxfEntities', () => {
  it('un mur de 5000 mm donne deux faces de 5000 mm et deux bouts de 200 mm', () => {
    const walls = onLayer(entities([wall([0, 0, 5000, 0])]), DXF_LAYERS.walls)
    const lengths = walls.map(length).sort((a, b) => a - b)
    expect(lengths).toHaveLength(4)
    expect(lengths[0]).toBeCloseTo(200)
    expect(lengths[1]).toBeCloseTo(200)
    expect(lengths[2]).toBeCloseTo(5000)
    expect(lengths[3]).toBeCloseTo(5000)
  })

  it('une porte découpe le mur et dessine son symbole sur OUVERTURES', () => {
    const w = wall([0, 0, 5000, 0])
    const door = {
      ...createOpeningElement('door', 'Porte', { wallId: w.id, segmentIndex: 0, offset: 2500, side: 'left' }),
      levelId: ground.id,
      width: 900,
    }
    const list = entities([w, door])
    // Chaque face est coupée en deux morceaux autour des 900 mm de la porte.
    const faces = onLayer(list, DXF_LAYERS.walls).map(length).filter((l) => l > 1000)
    expect(faces).toHaveLength(4)
    for (const face of faces) expect(face).toBeCloseTo((5000 - 900) / 2)
    expect(onLayer(list, DXF_LAYERS.openings).length).toBeGreaterThan(0)
  })

  it('ne prend que les éléments du niveau et ceux communs à tous les niveaux', () => {
    const axis = createAxisElement('Axe A', 'A', [0, -1000, 0, 4000])
    const list = entities([wall([0, 0, 5000, 0]), wall([0, 3000, 5000, 3000], upper.id), axis])
    expect(onLayer(list, DXF_LAYERS.walls)).toHaveLength(4)
    const axes = onLayer(list, DXF_LAYERS.axes)
    expect(axes.filter((e) => e.kind === 'circle')).toHaveLength(2)
    expect(axes.filter((e) => e.kind === 'text').map((e) => (e.kind === 'text' ? e.text : ''))).toEqual(['A', 'A'])
  })

  it('pièce : contour fermé, nom et surface', () => {
    const room = { ...createRoomElement('Cuisine', [0, 0, 4000, 0, 4000, 3000, 0, 3000]), levelId: ground.id }
    const list = onLayer(entities([room]), DXF_LAYERS.rooms)
    expect(list[0]).toMatchObject({ kind: 'polyline', closed: true })
    const texts = list.flatMap((e) => (e.kind === 'text' ? [e.text] : []))
    expect(texts).toEqual(['Cuisine', '12,00 m²'])
  })

  it('cote : longueur en mm entiers, sans unité', () => {
    const dim = { ...createDimensionElement('Cote', [0, 0, 3500, 0], 500), levelId: ground.id }
    const list = onLayer(entities([dim]), DXF_LAYERS.dimensions)
    expect(list.flatMap((e) => (e.kind === 'text' ? [e.text] : []))).toEqual(['3500'])
    expect(list.filter((e) => e.kind === 'line')).toHaveLength(5)
  })

  it('cote réservée à la version Client : absente en Technique', () => {
    const dim = { ...createDimensionElement('Cote', [0, 0, 3500, 0], 500), levelId: ground.id, visibleIn: 'client' as const }
    const list = levelDxfEntities({ elements: [dim], levels: [ground] }, ground.id, { ...OPTIONS, mode: 'execution' })
    expect(list.filter((e) => e.kind === 'text' && e.text === '3500')).toHaveLength(0)
  })

  it('mobilier sur son calque, à sa place', () => {
    const bed = { ...createFurnitureElement('Lit', 'bed-queen', 1000, 1000, 1600, 2000), levelId: ground.id }
    const list = onLayer(entities([bed]), DXF_LAYERS.furniture)
    expect(list.length).toBeGreaterThan(0)
  })

  it('n’exporte pas les éléments masqués', () => {
    expect(entities([{ ...wall([0, 0, 5000, 0]), hidden: true }])).toHaveLength(0)
  })
})

describe('levelDxf', () => {
  it('produit un fichier DXF complet', () => {
    const text = levelDxf({ elements: [wall([0, 0, 5000, 0])], levels: [ground] }, ground.id, OPTIONS)
    expect(text.startsWith('0\r\nSECTION')).toBe(true)
    expect(text.trimEnd().endsWith('EOF')).toBe(true)
    for (const name of Object.values(DXF_LAYERS)) expect(text).toContain(`\r\n${name}\r\n`)
  })
})
