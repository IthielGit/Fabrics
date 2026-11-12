import { describe, expect, it } from 'vitest'
import type { PlanSettings } from '../../types/document'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { levelDxfEntities } from '../export/dxfPlan'
import { mergeOverlays, planMarks } from './planMarks'
import { planOverlay } from './planOverlay'

const ground = createLevel('RDC', 0, 2700, 200)
const wall = { ...createWallElement('', [0, 0, 8000, 0], 200, 2700), levelId: ground.id }
const PLAN: PlanSettings = {
  scale: 50,
  gridSize: 100,
  snapToGrid: true,
  defaultWallThickness: 200,
  defaultWallHeight: 2700,
  northAngle: 0,
  showAnnotations: true,
}
const doc = (plan: Partial<PlanSettings> = {}) => ({ elements: [wall], levels: [ground], plan: { ...PLAN, ...plan } })

describe('flèche du nord et repère de niveau', () => {
  it('rien tant que l’option n’est pas cochée', () => {
    expect(planMarks(doc({ showAnnotations: false }), ground.id, EXECUTION_LABELS, 125)).toBeNull()
    expect(planMarks({ elements: [wall], levels: [ground] }, ground.id, EXECUTION_LABELS, 125)).toBeNull()
    expect(planOverlay(doc({ showAnnotations: false }), ground.id, 'none', EXECUTION_LABELS, 125)).toBeNull()
  })

  it('une flèche à droite du bâtiment, avec la lettre N et le niveau', () => {
    const marks = planMarks(doc(), ground.id, EXECUTION_LABELS, 125)!
    expect(marks.texts.map((t) => t.text)).toEqual(['N', 'Niveau RDC (±0)'])
    const xs = marks.lines.flatMap((l) => [l.x1, l.x2])
    expect(Math.min(...xs)).toBeGreaterThan(8100) // au-delà du bout du mur (8000 + demi-épaisseur)
  })

  it('la pointe suit l’angle du nord : 90° pointe vers la droite', () => {
    const up = planMarks(doc({ northAngle: 0 }), ground.id, EXECUTION_LABELS, 125)!
    const right = planMarks(doc({ northAngle: 90 }), ground.id, EXECUTION_LABELS, 125)!
    // Les cinq derniers traits sont la flèche : le premier part de la pointe.
    const tipUp = up.lines[up.lines.length - 5]
    const tipRight = right.lines[right.lines.length - 5]
    expect(tipUp.y1).toBeLessThan(tipUp.y2)
    expect(tipRight.x1).toBeGreaterThan(tipRight.x2)
  })

  it('un niveau sans bâtiment ou inconnu : rien', () => {
    expect(planMarks({ ...doc(), elements: [] }, ground.id, EXECUTION_LABELS, 125)).toBeNull()
    expect(planMarks(doc(), 'inconnu', EXECUTION_LABELS, 125)).toBeNull()
  })

  it('reprise dans les exports : calque de cotes de la planche et DXF', () => {
    const overlay = planOverlay(doc(), ground.id, 'none', EXECUTION_LABELS, 125)
    expect(overlay?.texts.some((t) => t.text === 'N')).toBe(true)
    const entities = levelDxfEntities(doc(), ground.id, { mode: 'none', labels: EXECUTION_LABELS, fontMm: 125 })
    expect(entities.some((e) => e.kind === 'text' && e.text === 'N')).toBe(true)
    expect(entities.some((e) => e.kind === 'text' && e.text === 'Niveau RDC (±0)')).toBe(true)
  })

  it('se réunit aux cotes automatiques', () => {
    const marks = planMarks(doc(), ground.id, EXECUTION_LABELS, 125)!
    expect(mergeOverlays(null, marks)).toBe(marks)
    expect(mergeOverlays(marks, null)).toBe(marks)
    expect(mergeOverlays(marks, marks)?.lines).toHaveLength(marks.lines.length * 2)
  })
})
