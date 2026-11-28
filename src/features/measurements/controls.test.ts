import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { createOpeningElement, createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import type { Estimate } from '../pricing/estimate'
import {
  CONTROL_GROUPS,
  EXTRA_GROUP,
  WARNING_GROUP,
  countByGroup,
  duplicateIds,
  estimateControls,
  planControls,
  type ControlItem,
} from './controls'
import { computeBuildingMeasurements } from './measurements'

const level = createLevel('RDC', 0, 3000, 200)

const wallOf = (points: number[], extra: Partial<WallElement> = {}): WallElement => ({
  ...createWallElement('Mur', points, 200, 3000),
  levelId: level.id,
  material: 'masonry',
  ...extra,
})

const windowOn = (wall: WallElement, extra: Partial<OpeningElement>): OpeningElement => ({
  ...createOpeningElement('window', 'Fenêtre', { wallId: wall.id, segmentIndex: 0, offset: 2000, side: 'left' }),
  levelId: level.id,
  width: 1200,
  height: 1350,
  sillHeight: 900,
  ...extra,
})

function controls(elements: CanvasElement[], estimate?: Estimate | null): ControlItem[] {
  const document = { elements, levels: [level] }
  return planControls({ document, building: computeBuildingMeasurements(document), estimate })
}

const planKinds = (items: ControlItem[]) => items.flatMap((i) => (i.source === 'plan' ? [`${i.group}:${i.warning.kind}`] : []))
const extraKinds = (items: ControlItem[]) => items.flatMap((i) => (i.source === 'extra' ? [`${i.group}:${i.extra.kind}`] : []))

const estimateWith = (patch: Partial<Estimate>): Estimate =>
  ({ uncoveredElementIds: [], linesWithoutPrice: 0, provisionalLines: 0, warnings: [], ...patch }) as Estimate

describe('contrôles regroupés (M24, 24.1)', () => {
  it('un plan propre ne signale rien', () => {
    expect(controls([wallOf([0, 0, 4000, 0])])).toEqual([])
  })

  it('chaque contrôle a un groupe valable', () => {
    for (const group of [...Object.values(WARNING_GROUP), ...Object.values(EXTRA_GROUP)]) {
      expect(CONTROL_GROUPS).toContain(group)
    }
  })

  // EDGE-01 : fenêtre hors du mur, ouvertures qui se chevauchent, mur de hauteur nulle, matériau manquant.
  it('EDGE-01 : fenêtre hors du mur → à corriger', () => {
    const wall = wallOf([0, 0, 4000, 0])
    expect(planKinds(controls([wall, windowOn(wall, { offset: 300 })]))).toContain('fix:openingOutside')
  })

  it('EDGE-01 : deux fenêtres qui se chevauchent → à vérifier', () => {
    const wall = wallOf([0, 0, 4000, 0])
    const items = controls([wall, windowOn(wall, { id: 'a', offset: 1500 }), windowOn(wall, { id: 'b', offset: 2300 })])
    expect(planKinds(items)).toContain('check:openingOverlap')
  })

  it('EDGE-01 : mur de hauteur nulle → à vérifier', () => {
    expect(planKinds(controls([wallOf([0, 0, 4000, 0], { height: 0 })]))).toContain('check:wallZeroHeight')
  })

  it('EDGE-01 : mur sans matériau → à vérifier', () => {
    expect(planKinds(controls([wallOf([0, 0, 4000, 0], { material: undefined })]))).toEqual(['check:wallNoMaterial'])
  })

  it('EDGE-01 : identifiant en double → à corriger', () => {
    const a = wallOf([0, 0, 4000, 0], { id: 'same' })
    const b = wallOf([0, 2000, 4000, 2000], { id: 'same' })
    expect(duplicateIds([a, b])).toEqual([{ id: 'same', count: 2 }])
    expect(extraKinds(controls([a, b]))).toEqual(['fix:duplicateId'])
  })

  it('les identifiants tous différents ne signalent rien', () => {
    expect(duplicateIds([{ id: 'a' }, { id: 'b' }])).toEqual([])
  })

  it('les points sont triés : à corriger, puis à vérifier, puis pour information', () => {
    const wall = wallOf([0, 0, 4000, 0], { material: undefined })
    const items = controls([wall, windowOn(wall, { offset: 300 })], estimateWith({ provisionalLines: 2 }))
    const ranks = items.map((i) => CONTROL_GROUPS.indexOf(i.group))
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    expect(countByGroup(items)).toEqual({ fix: 1, check: 1, info: 1 })
  })

  it('points du DQE : couverture, postes sans prix, provisoires, règles', () => {
    expect(estimateControls(estimateWith({}))).toEqual([])
    const extras = estimateControls(
      estimateWith({ uncoveredElementIds: ['w1'], linesWithoutPrice: 3, provisionalLines: 1, warnings: [{} as never] }),
    )
    expect(extras.map((e) => e.kind)).toEqual(['dqeUncovered', 'dqeNoPrice', 'dqeProvisional', 'dqeRules'])
    expect(extraKinds(controls([wallOf([0, 0, 4000, 0])], estimateWith({ linesWithoutPrice: 3 })))).toEqual(['check:dqeNoPrice'])
  })
})
