import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, StairElement, WallElement } from '../../types/document'
import { dimensionGeometry } from '../geometry/dimension'
import { computeMeasurements } from '../measurements/measurements'
import { buildReferences } from '../measurements/references'
import { collectStairVoids } from '../stairs/voids'
import { executionDimensions, formatAltitude, innerChainTicks, type ExecutionLabels } from './executionDimensions'
import type { AutoDimension } from './types'
import { levelAnnotations } from './levelAnnotations'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0, levelId: 'L0' }
const L0 = { id: 'L0', name: 'Rez', elevation: 0, height: 2700, slabThickness: 200 }
const L1 = { id: 'L1', name: 'Étage', elevation: 2850, height: 2700, slabThickness: 200 }

const LABELS: ExecutionLabels = {
  sill: (mm) => `All. ${mm}`,
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
    references: buildReferences({ elements, levels }),
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

  it('fenêtre : F01, 1200 / 1350, All. 900, à l’extérieur du mur', () => {
    const { labels } = run([box, opening('f', 'box')])
    const label = labels.find((l) => l.id === 'opening-f')!
    expect(label.lines).toEqual(['F01', '1200 / 1350', 'All. 900'])
    expect(label.y).toBeLessThan(-100) // au-dessus de la façade haute
  })

  it('porte : repère P01 et pas d’allège', () => {
    const { labels } = run([box, opening('p', 'box', { kind: 'door', width: 900, height: 2100, sillHeight: 0 })])
    expect(labels.find((l) => l.id === 'opening-p')!.lines).toEqual(['P01', '900 / 2100'])
  })

  it('le repère du plan est celui des métrés d’exécution', () => {
    const elements = [box, opening('a', 'box', { offset: 1000 }), opening('b', 'box', { offset: 4000 })]
    const refs = buildReferences({ elements, levels: [L0] })
    const { labels } = run(elements)
    expect(labels.find((l) => l.id === 'opening-b')!.lines[0]).toBe(refs.openings.get('b'))
  })

  it('chaîne intérieure : épaisseur de chaque mur et largeur de chaque pièce', () => {
    const refend = wall('r', [2000, 0, 2000, 4000])
    expect(innerChainTicks([box, refend], 'horizontal', 2000)).toEqual([-100, 100, 1900, 2100, 5700, 5900])
    const r1 = room('r1', 'Chambre', [100, 100, 1900, 100, 1900, 3900, 100, 3900])
    const r2 = room('r2', 'Séjour', [2100, 100, 5700, 100, 5700, 3900, 2100, 3900])
    const { dimensions } = run([box, refend, r1, r2])
    const inner = dimensions.filter((d) => d.id.includes('-horizontal-'))
    // Les deux pièces sont sur la même ligne : une seule chaîne.
    expect(inner.map(len)).toEqual([200, 1800, 200, 3600, 200])
  })

  it('pièce : nom, surface, altitude du sol et de la dalle haute', () => {
    const r = room('r', 'Cuisine', [100, 100, 5700, 100, 5700, 3900, 100, 3900])
    const ground = run([box, r], [L0, L1]).labels.find((l) => l.id === 'room-r')!
    expect(ground.lines).toEqual(['Cuisine', '21,28 m²', 'Sol ±0', '+2650 sous plafond', 'Dalle +2850'])
    const upper = run([{ ...box, levelId: 'L1' }, { ...r, levelId: 'L1' }], [L0, L1], 'L1')
    expect(upper.labels.find((l) => l.id === 'room-r')!.lines.slice(2)).toEqual(['Sol +2850', '+5350 sous plafond', 'Dalle +5550'])
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

  it('Exécution : repère de la fenêtre ; niveau inconnu : rien', () => {
    const { labels } = levelAnnotations(doc, 'L0', 'execution', LABELS)
    expect(labels.find((l) => l.id === 'opening-f')!.lines[0]).toBe('F01')
    expect(levelAnnotations(doc, 'X', 'execution', LABELS).labels).toEqual([])
  })
})
