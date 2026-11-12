import { describe, expect, it } from 'vitest'
import type { PlanSettings } from '../../types/document'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { createOpeningElement, createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { levelDxfEntities } from '../export/dxfPlan'
import { lengthLabels } from './lengthLabels'
import { planOverlay } from './planOverlay'

const ground = createLevel('RDC', 0, 2700, 200)
const PLAN: PlanSettings = {
  scale: 50,
  gridSize: 100,
  snapToGrid: true,
  defaultWallThickness: 200,
  defaultWallHeight: 2700,
  northAngle: 0,
  showDimensionLabels: true,
}
// Rectangle de 6000 × 4000 en quatre murs.
const walls = [
  [0, 0, 6000, 0],
  [6000, 0, 6000, 4000],
  [6000, 4000, 0, 4000],
  [0, 4000, 0, 0],
].map((points) => ({ ...createWallElement('', points, 200, 2700), levelId: ground.id }))
const door = {
  ...createOpeningElement('door', '', { wallId: walls[2].id, segmentIndex: 0, offset: 3000, side: 'left' }),
  levelId: ground.id,
  width: 900,
}
const doc = (plan: Partial<PlanSettings> = {}, elements = [...walls, door]) => ({
  elements,
  levels: [ground],
  plan: { ...PLAN, ...plan },
})

describe('étiquettes de cote automatiques', () => {
  it('rien sans l’option', () => {
    expect(lengthLabels(doc({ showDimensionLabels: false }), ground.id, 125)).toBeNull()
    expect(lengthLabels({ elements: walls, plan: undefined }, ground.id, 125)).toBeNull()
  })

  it('la longueur de chaque mur et la largeur de la porte, en mm', () => {
    const labels = lengthLabels(doc(), ground.id, 125)!
    expect(labels.texts.map((t) => t.text).sort()).toEqual(['4000', '4000', '6000', '6000', '900'])
  })

  it('les longueurs de mur sont à l’extérieur, la largeur de la porte à l’intérieur', () => {
    const labels = lengthLabels(doc(), ground.id, 125)!
    const top = labels.texts.find((t) => t.text === '6000' && t.y < 0)!
    expect(top.x).toBeCloseTo(3000)
    expect(top.y).toBeLessThan(-100) // au-dessus de la face extérieure du mur du haut
    const bottomDoor = labels.texts.find((t) => t.text === '900')!
    expect(bottomDoor.y).toBeLessThan(4000) // la porte est dans le mur du bas : texte vers l'intérieur
  })

  it('un texte vertical est tourné pour rester lisible (jamais à l’envers)', () => {
    const labels = lengthLabels(doc(), ground.id, 125)!
    for (const text of labels.texts) {
      const angle = text.angle ?? 0
      expect(angle).toBeGreaterThan(-90)
      expect(angle).toBeLessThanOrEqual(90)
    }
    const side = labels.texts.find((t) => t.text === '4000' && t.x > 6000)!
    expect(Math.abs(side.angle ?? 0)).toBe(90)
  })

  it('un côté trop court n’est pas étiqueté ; un niveau sans mur : rien', () => {
    const short = [{ ...createWallElement('', [0, 0, 300, 0], 200, 2700), levelId: ground.id }]
    expect(lengthLabels(doc({}, short), ground.id, 125)).toBeNull()
    expect(lengthLabels(doc(), 'autre', 125)).toBeNull()
  })

  it('suit le plan : un mur plus long, un chiffre plus grand', () => {
    const longer = walls.map((w, i) => (i === 0 ? { ...w, points: [0, 0, 7000, 0] } : w))
    const texts = lengthLabels(doc({}, longer), ground.id, 125)!.texts.map((t) => t.text)
    expect(texts).toContain('7000')
    expect(texts).not.toContain('6000'.repeat(2))
  })

  it('repris dans le calque de la planche et dans le DXF', () => {
    const overlay = planOverlay(doc(), ground.id, 'none', EXECUTION_LABELS, 125)
    expect(overlay?.texts.filter((t) => t.text === '6000')).toHaveLength(2)
    const entities = levelDxfEntities(doc(), ground.id, { mode: 'none', labels: EXECUTION_LABELS, fontMm: 125 })
    expect(entities.filter((e) => e.kind === 'text' && e.text === '6000')).toHaveLength(2)
    expect(entities.some((e) => e.kind === 'text' && e.text === '900')).toBe(true)
  })
})
