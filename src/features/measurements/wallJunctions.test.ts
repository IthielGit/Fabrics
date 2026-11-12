import { describe, expect, it } from 'vitest'
import type { WallElement } from '../../types/document'
import { createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { applyWallFix } from '../geometry/wallContacts'
import { computeBuildingMeasurements, computeMeasurements } from './measurements'
import { metresWarnings } from './warnings'

const level = createLevel('RDC', 0, 2700, 200)
const wall = (points: number[]): WallElement => ({
  ...createWallElement('', points, 200, 2700),
  levelId: level.id,
})

describe('métrés des raccords en T', () => {
  it('le bout du mur qui entre dans l’autre n’est pas compté deux fois', () => {
    const through = wall([0, 0, 6000, 0])
    const branch = wall([3000, 4000, 3000, 0])
    const { walls } = computeMeasurements([through, branch])
    const byId = new Map(walls.map((w) => [w.id, w]))
    // 4000 × 200 × 2700, moins la demi-épaisseur du mur traversé (100 × 200 × 2700).
    expect(byId.get(branch.id)?.volume).toBe(4000 * 200 * 2700 - 100 * 200 * 2700)
    expect(byId.get(through.id)?.volume).toBe(6000 * 200 * 2700)
    // Faces : 2 × 4000 moins la part cachée dans le mur (2 × 100) ; 2 × 6000 moins la largeur du mur qui s'y raccorde.
    expect(byId.get(branch.id)?.facesLength).toBe(8000 - 200)
    expect(byId.get(through.id)?.facesLength).toBe(12000 - 200)
  })

  it('un angle en L reste inchangé', () => {
    const { walls } = computeMeasurements([wall([0, 0, 6000, 0]), wall([6000, 0, 6000, 4000])])
    expect(walls.map((w) => w.volume)).toEqual([6000 * 200 * 2700, 4000 * 200 * 2700])
    expect(walls.map((w) => w.facesLength)).toEqual([12000, 8000])
  })
})

describe('contrôle des murs dans les avertissements', () => {
  const check = (walls: WallElement[]) => {
    const document = { elements: walls, levels: [level] }
    return metresWarnings(document, computeBuildingMeasurements(document))
  }

  it('un écart entre deux murs est signalé, avec sa correction', () => {
    const a = wall([0, 0, 6000, 0])
    const b = wall([6010, 0, 6010, 4000])
    const warnings = check([a, b]).filter((w) => w.kind === 'wallGap')
    expect(warnings).toHaveLength(1)
    const [warning] = warnings
    if (warning.kind !== 'wallGap') return
    expect(warning.gap).toBe(10)
    const target = warning.fix.wallId === a.id ? a : b
    const fixed = applyWallFix(target, warning.fix)
    const after = check([target === a ? fixed : a, target === b ? fixed : b])
    expect(after.filter((w) => w.kind === 'wallGap')).toHaveLength(0)
  })

  it('deux murs superposés sont signalés', () => {
    const warnings = check([wall([0, 0, 6000, 0]), wall([5000, 0, 8000, 0])])
    expect(warnings.some((w) => w.kind === 'wallOverlap')).toBe(true)
  })

  it('un plan dessiné proprement ne signale rien', () => {
    const rectangle = [
      wall([0, 0, 6000, 0]),
      wall([6000, 0, 6000, 4000]),
      wall([6000, 4000, 0, 4000]),
      wall([0, 4000, 0, 0]),
      wall([3000, 4000, 3000, 0]),
    ]
    expect(check(rectangle).filter((w) => w.kind === 'wallGap' || w.kind === 'wallOverlap')).toEqual([])
  })
})
