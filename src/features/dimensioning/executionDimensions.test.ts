import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, StairElement, WallElement } from '../../types/document'
import { dimensionGeometry } from '../geometry/dimension'
import { computeMeasurements } from '../measurements/measurements'
import { collectStairVoids } from '../stairs/voids'
import { executionDimensions, formatAltitude, roomChord, type ExecutionLabels } from './executionDimensions'
import type { AutoDimension } from './types'
import { levelAnnotations } from './levelAnnotations'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0, levelId: 'L0' }
const L0 = { id: 'L0', name: 'Rez', elevation: 0, height: 2700, slabThickness: 200 }
const L1 = { id: 'L1', name: 'Étage', elevation: 2850, height: 2700, slabThickness: 200 }

const LABELS: ExecutionLabels = {
  sill: (mm) => `All. ${mm}`,
  door: (w, h) => `PP: ${w} x ${h}`,
  window: (w, h) => `${w} x ${h}`,
  floor: (a) => `Sol ${a}`,
  slab: (a) => `Dalle ${a}`,
  ceiling: (a) => `${a} sous plafond`,
  north: 'N',
  levelMark: (name, altitude) => `Niveau ${name} (${altitude})`,
  stairVoid: 'Trémie',
  risers: (n, h) => `${n} CM × ${h}`,
  tread: (mm) => `Giron ${mm}`,
}

const wall = (id: string, points: number[], thickness = 200): WallElement => ({
  ...BASE, id, name: id, type: 'wall', points, thickness, height: 2700, fill: '#444',
})
const opening = (id: string, wallId: string, partial: Partial<OpeningElement> = {}): OpeningElement => ({
  ...BASE, id, name: id, type: 'opening', kind: 'window', wallId, segmentIndex: 0, offset: 2900,
  width: 1200, height: 1350, sillHeight: 900, hinge: 'start', side: 'left', ...partial,
})
const room = (id: string, name: string, points: number[]): RoomElement => ({
  ...BASE, id, name, type: 'room', points, fill: '#eee', showLabel: true,
})
const stair = (partial: Partial<StairElement> = {}): StairElement => ({
  ...BASE, id: 's', name: 'Escalier', type: 'stair', shape: 'straight', x: 3000, y: 500, width: 1000,
  length: 4500, voidMargin: 50, ...partial,
})

const box = wall('box', [0, 0, 5800, 0, 5800, 4000, 0, 4000, 0, 0])

function run(elements: CanvasElement[], levels = [L0], levelId = 'L0') {
  const level = levels.find((l) => l.id === levelId)!
  const sorted = [...levels].sort((a, b) => a.elevation - b.elevation)
  const levelAbove = sorted[sorted.indexOf(level) + 1]
  const own = elements.filter((el) => el.levelId === levelId)
  const voids = collectStairVoids(elements, levels).filter((v) => v.levelId === levelId)
  return executionDimensions(own, {
    level,
    levelAbove,
    measurements: computeMeasurements(own, levels, voids),
    voids,
    labels: LABELS,
  })
}

const len = (d: AutoDimension) => Math.round(dimensionGeometry(d.points, d.offset)!.length)

describe('cotes Exécution', () => {
  it('altitudes : ±0, +2850, -450', () => {
    expect(formatAltitude(0)).toBe('±0')
    expect(formatAltitude(-0.2)).toBe('±0')
    expect(formatAltitude(2850)).toBe('+2850')
    expect(formatAltitude(-450)).toBe('-450')
  })

  it('fenêtre : 1200 x 1350, All. 900, à l’extérieur du mur (D20-9 : sans repère F01)', () => {
    const { labels } = run([box, opening('f', 'box')])
    const label = labels.find((l) => l.id === 'opening-f')!
    expect(label.lines).toEqual(['1200 x 1350', 'All. 900'])
    expect(label.y).toBeLessThan(-100) // au-dessus de la façade haute
  })

  it('porte et baie : « PP: 900 x 2100 », pas d’allège', () => {
    const { labels } = run([box, opening('p', 'box', { kind: 'door', width: 900, height: 2100, sillHeight: 0 })])
    expect(labels.find((l) => l.id === 'opening-p')!.lines).toEqual(['PP: 900 x 2100'])
    const bay = run([box, opening('b', 'box', { kind: 'bay', width: 2400, height: 2150, sillHeight: 0 })])
    expect(bay.labels.find((l) => l.id === 'opening-b')!.lines).toEqual(['PP: 2400 x 2150'])
  })

  it('une cote de largeur et une de profondeur par pièce, au nu des murs, sans doublon', () => {
    const refend = wall('r', [2000, 0, 2000, 4000])
    const r1 = room('r1', 'Chambre', [100, 100, 1900, 100, 1900, 3900, 100, 3900])
    const r2 = room('r2', 'Séjour', [2100, 100, 5700, 100, 5700, 3900, 2100, 3900])
    const { dimensions } = run([box, refend, r1, r2])
    const inner = dimensions.filter((d) => d.id.startsWith('room-'))
    expect(inner.map((d) => [d.id, len(d)])).toEqual([
      ['room-r1-width', 1800],
      ['room-r1-depth', 3800],
      ['room-r2-width', 3600],
      ['room-r2-depth', 3800],
    ])
  })

  it('pièce en L : la cote passe dans la partie qui contient le centre', () => {
    // L : 4000 × 1000 en haut, 1000 × 3000 à gauche
    const L = [0, 0, 4000, 0, 4000, 1000, 1000, 1000, 1000, 4000, 0, 4000]
    expect(roomChord(L, 'horizontal', 500, 2000)).toEqual([0, 4000])
    expect(roomChord(L, 'horizontal', 2500, 500)).toEqual([0, 1000])
    expect(roomChord(L, 'vertical', 2500, 500)).toEqual([0, 1000])
    expect(roomChord(L, 'horizontal', 5000, 500)).toBeNull()
  })

  it('pièce : nom et surface seulement (D20-9 ; altitudes dans les métrés)', () => {
    const r = room('r', 'Cuisine', [100, 100, 5700, 100, 5700, 3900, 100, 3900])
    const ground = run([box, r], [L0, L1]).labels.find((l) => l.id === 'room-r')!
    expect(ground.lines).toEqual(['Cuisine', '21,28 m²'])
  })

  it('escalier : contremarches, hauteur et giron ; trémie cotée au niveau du dessus', () => {
    const s = stair()
    const ground = run([box, s], [L0, L1])
    const stairLabel = ground.labels.find((l) => l.id === 'stair-s')!
    const measure = computeMeasurements([s], [L0, L1]).stairs[0]
    expect(stairLabel.lines).toEqual([
      `${measure.risers} CM × ${Math.round(measure.riserHeight!)}`,
      `Giron ${Math.round(measure.treadDepth!)}`,
    ])
    const upper = run([{ ...box, levelId: 'L1' }, s], [L0, L1], 'L1')
    expect(upper.labels.find((l) => l.id === 'void-s')!.lines).toEqual(['Trémie', '1100 × 4600'])
  })

  it('contient les chaînes de façade', () => {
    const { dimensions } = run([box, opening('f', 'box')])
    expect(dimensions.filter((d) => d.id.startsWith('facade-top-openings')).map(len)).toEqual([2400, 1200, 2400])
  })
})

describe('cotes d’un niveau selon le réglage', () => {
  const doc = { elements: [box, opening('f', 'box'), room('r', 'Chambre', [100, 100, 4100, 100, 4100, 3100, 100, 3100])], levels: [L0] }

  it('« Aucune » : rien', () => {
    expect(levelAnnotations(doc, 'L0', 'none', LABELS)).toEqual({ dimensions: [], labels: [] })
  })

  it('Client : nom, dimensions et surface ; pas de repère d’ouverture', () => {
    const { labels } = levelAnnotations(doc, 'L0', 'client', LABELS)
    expect(labels.map((l) => l.lines)).toEqual([['Chambre', '4000 × 3000', '12,00 m²']])
  })

  it('Exécution : dimensions de la fenêtre ; niveau inconnu : rien', () => {
    const { labels } = levelAnnotations(doc, 'L0', 'execution', LABELS)
    expect(labels.find((l) => l.id === 'opening-f')!.lines[0]).toBe('1200 x 1350')
    expect(levelAnnotations(doc, 'X', 'execution', LABELS).labels).toEqual([])
  })
})
