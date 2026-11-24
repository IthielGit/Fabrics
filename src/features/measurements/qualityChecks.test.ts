import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { createOpeningElement, createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { computeBuildingMeasurements } from './measurements'
import { isSelfIntersecting } from './qualityChecks'
import { metresWarnings } from './warnings'

const level = createLevel('RDC', 0, 3000, 200)
const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

const wallOf = (points: number[], extra: Partial<WallElement> = {}): WallElement => ({
  ...createWallElement('Mur', points, 200, 3000),
  levelId: level.id,
  material: 'masonry',
  ...extra,
})

const openingOn = (wall: WallElement, extra: Partial<OpeningElement>): OpeningElement => ({
  ...createOpeningElement('window', 'Fenêtre', { wallId: wall.id, segmentIndex: 0, offset: 2000, side: 'left' }),
  levelId: level.id,
  width: 1200,
  height: 1350,
  sillHeight: 900,
  ...extra,
})

const room = (points: number[], name = 'Séjour'): RoomElement =>
  ({ ...BASE, id: `room-${name}`, type: 'room', name, levelId: level.id, points, fill: '#eee' }) as RoomElement

function kinds(elements: CanvasElement[], levels = [level]) {
  const document = { elements, levels }
  return metresWarnings(document, computeBuildingMeasurements(document)).map((w) => w.kind)
}

describe('contrôles qualité (M21, 21.7)', () => {
  it('un plan propre ne déclenche aucun contrôle qualité', () => {
    expect(kinds([wallOf([0, 0, 4000, 0])])).toEqual([])
  })

  it('propriété manquante : mur sans matériau ni composition (EDGE-01 « missing-material »)', () => {
    const wall = wallOf([0, 0, 4000, 0], { material: undefined })
    expect(kinds([wall])).toEqual(['wallNoMaterial'])
    // Une composition venue de Pascal suffit.
    expect(kinds([{ ...wall, layers: [{ id: 'l1', role: 'structure', thickness: 200 }] }])).toEqual([])
  })

  it('propriété manquante : pièce sans nom', () => {
    expect(kinds([room([0, 0, 1000, 0, 1000, 1000, 0, 1000], '')])).toContain('roomNoName')
  })

  it('géométrie incohérente : ouverture plus haute que son mur', () => {
    const wall = wallOf([0, 0, 4000, 0], { height: 2500 })
    expect(kinds([wall, openingOn(wall, { height: 2400, sillHeight: 200 })])).toEqual(['openingTooTall'])
  })

  it('géométrie incohérente : ouverture sans largeur ou sans hauteur', () => {
    const wall = wallOf([0, 0, 4000, 0])
    expect(kinds([wall, openingOn(wall, { width: 0 })])).toContain('openingInvalidSize')
  })

  it('géométrie incohérente : contour de pièce qui se croise (en nœud papillon)', () => {
    expect(isSelfIntersecting([0, 0, 1000, 1000, 1000, 0, 0, 1000])).toBe(true)
    expect(isSelfIntersecting([0, 0, 1000, 0, 1000, 1000, 0, 1000])).toBe(false)
    expect(kinds([room([0, 0, 1000, 1000, 1000, 0, 0, 1000])])).toContain('roomSelfIntersecting')
  })

  it('unités incompatibles : épaisseur 0,2 ou 20 (saisie en m ou en cm), fenêtre de 1,2 de large', () => {
    const inMetres = wallOf([0, 0, 4000, 0], { thickness: 0.2 })
    const inCm = wallOf([0, 5000, 4000, 5000], { thickness: 15 })
    const ok = wallOf([0, 9000, 4000, 9000])
    const window = openingOn(ok, { width: 1.2 })
    const warnings = metresWarnings({ elements: [inMetres, inCm, ok, window], levels: [level] }, computeBuildingMeasurements({ elements: [inMetres, inCm, ok, window], levels: [level] }))
    const units = warnings.filter((w) => w.kind === 'suspiciousUnit')
    expect(units.map((w) => w.kind === 'suspiciousUnit' && [w.elementId, w.field, w.value])).toEqual([
      [inMetres.id, 'wallThickness', 0.2],
      [inCm.id, 'wallThickness', 15],
      [window.id, 'openingWidth', 1.2],
    ])
  })

  it('unités incompatibles : hauteur d’étage de 3 (m au lieu de mm)', () => {
    const odd = { ...level, height: 3 }
    expect(kinds([], [odd])).toEqual(['suspiciousUnit'])
  })
})
