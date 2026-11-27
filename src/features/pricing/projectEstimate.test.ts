/**
 * DQE d'un vrai plan, en passant par la scène Pascal comme un projet (même chemin que le gate G4).
 * Mur de 5 000 mm × 3 000 mm, 200 mm, maçonnerie, une fenêtre de 1 000 × 1 200 mm.
 */
import { describe, expect, it } from 'vitest'
import type { CanvasElement, Level } from '../../types/document'
import { planDocument } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import type { WorkItem } from './model'
import { projectEstimate } from './projectEstimate'
import { EMPTY_FILTER, type PricingRule } from './rules'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
const L = 'L0'
const levels: Level[] = [{ id: L, name: 'RDC', elevation: 0, height: 3000, slabThickness: 200 }]
const elements: CanvasElement[] = [
  { ...BASE, id: 'w', levelId: L, type: 'wall', name: 'M', points: [0, 0, 5000, 0], thickness: 200, height: 3000, fill: '#ccc', material: 'masonry' },
  { ...BASE, id: 'f', levelId: L, type: 'opening', name: 'F', kind: 'window', wallId: 'w', segmentIndex: 0, offset: 2000, width: 1000, height: 1200, sillHeight: 900, hinge: 'start', side: 'left' },
]

function work(id: string, unit: string, priceHt: bigint): WorkItem {
  return { id, libraryId: 'lib', code: id, category: 'Gros œuvre', designation: id, unit, priceHt, referencePrice: null, sourceCoefficient: '', output: '', components: [], sourceRow: '', sourceKey: '', updatedByEmail: '', updatedAt: '' }
}

function rule(id: string, patch: Partial<PricingRule>): PricingRule {
  return { id, libraryId: 'lib', name: id, quantityCode: 'wall.netArea', filter: EMPTY_FILTER, workItemId: null, wasteBp: 0, enabled: true, position: 0, updatedByEmail: '', updatedAt: '', ...patch }
}

describe('projectEstimate (plan via la scène Pascal)', () => {
  const scene = settleScene(fabricsToScene(planDocument(levels, elements)).scene)
  const document = sceneToFabricsView(scene)

  it('chiffre la surface nette du mur et la fenêtre à partir du métré de M21', () => {
    const { estimate, quantities } = projectEstimate({
      document,
      scene,
      workItems: [work('MAC', 'm²', 450000n), work('FEN', 'U', 3000000n)],
      rules: [
        rule('mac', { filter: { ...EMPTY_FILTER, wallMaterial: 'masonry' }, workItemId: 'MAC' }),
        rule('fen', { quantityCode: 'opening.count', filter: { ...EMPTY_FILTER, openingKind: 'window' }, workItemId: 'FEN', position: 1 }),
      ],
      settings: { a1Bp: 0, a2Bp: 0, a3Bp: 0, vatRateBp: 2000 },
    })
    const lines = estimate.lots.flatMap((lot) => lot.lines)
    // 5,00 × 3,00 − 1,00 × 1,20 = 13,80 m² × 45 000 = 621 000 Ar ; 1 U × 300 000 Ar.
    expect(lines.map((l) => [l.code, l.quantity, l.amountHt])).toEqual([
      ['FEN', 1n, 3000000n],
      ['MAC', 1380n, 6210000n],
    ])
    expect(estimate.totalHt).toBe(9210000n)
    expect(lines[1].sources[0].elementIds).toEqual(['w'])
    expect(quantities.length).toBeGreaterThan(0)
  })
})
