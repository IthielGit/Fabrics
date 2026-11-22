import { describe, expect, it } from 'vitest'
import type { CanvasElement } from '../../types/document'
import { axisGraphics } from './axes'
import { sheetPlanOverlay } from './planOverlay'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'

const axis = (id: string, label: string, points: number[], levelId?: string) =>
  ({ id, name: id, type: 'axis', label, points, x: 0, y: 0, rotation: 0, opacity: 1, locked: false, hidden: false, ...(levelId ? { levelId } : {}) }) as CanvasElement

describe('axes du quadrillage sur les feuilles (M20 20.2)', () => {
  it('trait mixte, deux bulles et le repère à chaque bout ; un axe d’un autre niveau est ignoré', () => {
    const o = axisGraphics([axis('a', 'A', [0, 0, 0, 8000]), axis('b', '1', [0, 0, 6000, 0], 'R1')], 'RDC', 100)!
    expect(o.lines.filter((l) => l.dashed)).toHaveLength(1)
    expect(o.texts.map((t) => t.text)).toEqual(['A', 'A'])
    // Bulles au-delà des extrémités : centre à un rayon (90 mm) du bout.
    expect(Math.round(o.texts[0].y - 35)).toBe(-90)
    expect(Math.round(o.texts[1].y - 35)).toBe(8090)
  })

  it('aucun axe : rien ; sur une feuille, les axes s’ajoutent aux cotes', () => {
    expect(axisGraphics([], 'RDC', 100)).toBeNull()
    const doc = { elements: [axis('a', 'A', [0, 0, 0, 8000])], levels: [{ id: 'RDC', name: 'RDC', elevation: 0, height: 2700, slabThickness: 200 }] }
    expect(sheetPlanOverlay(doc, 'RDC', 'none', EXECUTION_LABELS, 100)!.texts.map((t) => t.text)).toEqual(['A', 'A'])
  })
})
