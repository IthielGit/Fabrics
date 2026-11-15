import { describe, expect, it } from 'vitest'
import type { Level, RoomElement, WallElement } from '../../types/document'
import { liveMetresSummary } from './liveSummary'
import { computeMeasurements, type LevelMeasurements } from './measurements'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

const room = (id: string, points: number[]): RoomElement => ({
  ...BASE, id, name: id, type: 'room', points, fill: 'rgba(0,128,0,0.2)', showLabel: true,
})
const wall = (id: string, points: number[]): WallElement => ({
  ...BASE, id, name: id, type: 'wall', points, thickness: 200, height: 2500, fill: '#444',
})
const level = (id: string): LevelMeasurements['level'] => ({ id }) as Level

describe('liveMetresSummary', () => {
  // Pièce de 6000 × 2000 mm = 12,00 m², et deux murs de 6000 + 2000 mm.
  const ground: LevelMeasurements = {
    level: level('rdc'),
    measurements: computeMeasurements([
      room('p1', [0, 0, 6000, 0, 6000, 2000, 0, 2000]),
      wall('m1', [0, 0, 6000, 0]),
      wall('m2', [6000, 0, 6000, 2000]),
    ]),
  }
  const upper: LevelMeasurements = { level: level('r1'), measurements: computeMeasurements([]) }

  it('résume le niveau affiché', () => {
    const summary = liveMetresSummary({ levels: [ground, upper] }, 'rdc')
    expect(summary.rooms).toBe(1)
    expect(summary.roomArea).toBeCloseTo(12_000_000)
    expect(summary.wallLength).toBeCloseTo(8000)
  })

  it('ne compte pas les autres niveaux', () => {
    expect(liveMetresSummary({ levels: [ground, upper] }, 'r1')).toEqual({ rooms: 0, roomArea: 0, wallLength: 0 })
  })

  it('donne un résumé vide sans niveau affiché', () => {
    expect(liveMetresSummary({ levels: [ground] }, null)).toEqual({ rooms: 0, roomArea: 0, wallLength: 0 })
    expect(liveMetresSummary({ levels: [ground] }, 'inconnu').rooms).toBe(0)
  })
})
