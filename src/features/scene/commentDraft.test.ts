import { describe, expect, it } from 'vitest'
import type { FabricsDocument } from '../../types/document'
import { commentDraftTarget, elementMiddle } from './commentDraft'

const doc = {
  version: 4,
  unit: 'mm',
  page: { width: 20000, height: 10000, background: '#ffffff' },
  elements: [
    { id: 'w1', type: 'wall', levelId: 'l1', points: [0, 0, 4000, 0, 4000, 2000] },
    { id: 'd1', type: 'door', levelId: 'l2', x: 1500, y: 300 },
  ],
} as unknown as FabricsDocument

describe('commentDraftTarget (commentaire depuis l’éditeur de Pascal)', () => {
  it('se pose au milieu de l’élément sélectionné, sur son niveau', () => {
    expect(commentDraftTarget(doc, 'wall_w1__0', 'l9')).toEqual({ elementId: 'w1', levelId: 'l1', x: 2667, y: 667 })
    expect(commentDraftTarget(doc, 'door_d1', null)).toEqual({ elementId: 'd1', levelId: 'l2', x: 1500, y: 300 })
  })

  it('sans sélection : point libre au milieu de la page, sur le niveau affiché', () => {
    expect(commentDraftTarget(doc, null, 'l1')).toEqual({ elementId: null, levelId: 'l1', x: 10000, y: 5000 })
  })

  it('un nœud créé dans Pascal garde son identifiant', () => {
    expect(commentDraftTarget(doc, 'slab_abc', 'l1').elementId).toBe('slab_abc')
  })

  it('elementMiddle : null sans position connue', () => {
    expect(elementMiddle({ id: 'x', type: 'text' } as never)).toBeNull()
  })
})
