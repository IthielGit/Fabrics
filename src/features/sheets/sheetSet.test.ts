/**
 * M20 20.7 — révisions : jeu de feuilles numéroté, figé par version (recalculé depuis son document),
 * renseignements du cartouche gardés avec le plan, comparaison avec le jeu précédent. Cas réel :
 * ROOMIT (RDC, R+1 et toiture).
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import type { FabricsDocument, RoomElement, SectionLineElement } from '../../types/document'
import { fixtureBuildingScene, type FixtureSpec } from '../scene/fixturePlan'
import { planToScene } from '../scene/sceneBinding'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { compareSheetSets, drawingSignature, sheetKey, sheetSet, sheetSnapshotsOf, type SheetSnapshot } from './sheetSet'

const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
const view = sceneToFabricsView(scene)

describe('jeu de feuilles', () => {
  it('identifiant stable de chaque feuille', () => {
    expect(sheetKey({ kind: 'level', levelId: 'R1' })).toBe('level-R1')
    expect(sheetKey({ kind: 'roof', levelId: 'R1' })).toBe('roof-R1')
    expect(sheetKey({ kind: 'ceiling', levelId: 'RDC' })).toBe('ceiling-RDC')
    expect(sheetKey({ kind: 'elevation', cardinal: 'O' })).toBe('elevation-O')
    expect(sheetKey({ kind: 'section', sectionId: 's1' })).toBe('section-s1')
    expect(sheetKey({ kind: 'schedules' })).toBe('schedules')
    expect(sheetKey({ kind: 'sheet' })).toBe('sheet')
  })

  it('ROOMIT : niveaux, toiture, plafonds, façades, nomenclatures, planche, numérotés 01, 02…', () => {
    const set = sheetSet({ document: view, sections: [], roofPlans: (id) => (id === 'R1' ? ({} as never) : null) })
    expect(set.map((s) => `${s.number} ${s.title}`)).toEqual([
      '01 Plan de niveau RDC',
      '02 Plan de niveau R+1',
      '03 Plan de toiture R+1',
      '04 Plan de plafond RDC',
      '05 Plan de plafond R+1',
      '06 Façade Nord',
      '07 Façade Est',
      '08 Façade Sud',
      '09 Façade Ouest',
      '10 Nomenclatures',
      '11 Planche',
    ])
  })

  it('un n° saisi à la main l’emporte (feuille 06 de la référence pour le R+1)', () => {
    const set = sheetSet({ document: view, sections: [], roofPlans: () => null }, { 'level-R1': '06', 'level-RDC': ' ' })
    expect(set.find((s) => s.key === 'level-R1')!.number).toBe('06')
    expect(set.find((s) => s.key === 'level-RDC')!.number).toBe('01')
  })

  it('les renseignements du jeu de feuilles sont gardés par la scène (donc dans chaque version)', () => {
    const sheets = { issuer: 'ATELIER 73', revision: 'B', status: 'apd' as const, numbers: { 'level-R1': '06' } }
    const doc: FabricsDocument = { ...view, plan: { ...view.plan!, sheets } }
    expect(sceneToFabricsView(planToScene(doc)).plan?.sheets).toEqual(sheets)
  })
})

describe('empreintes et comparaison', () => {
  const before = sheetSnapshotsOf(view, scene)

  it('chaque feuille de ROOMIT a une empreinte, la même à chaque calcul', () => {
    for (const s of before) {
      if (s.key === 'sheet') continue
      expect(s.signature, s.key).toMatch(/^[0-9a-f]{16}$/)
    }
    expect(sheetSnapshotsOf(view, scene)).toEqual(before)
    expect(before.find((s) => s.key === 'roof-R1')).toBeDefined()
    expect(drawingSignature(null)).toBeNull()
  })

  it('renommer une pièce du R+1 : plan, plafond du R+1 et nomenclatures modifiés ; le RDC et les façades non', () => {
    const elements = view.elements.map((el) =>
      el.type === 'room' && el.levelId === 'R1' && el.name === 'Bibliothèque' ? ({ ...el, name: 'Salle de lecture' } as RoomElement) : el,
    )
    expect(elements.some((el) => el.type === 'room' && el.name === 'Salle de lecture')).toBe(true)
    const after = sheetSnapshotsOf({ ...view, elements }, scene)
    const changes = Object.fromEntries(compareSheetSets(before, after).map((c) => [c.key, c.change]))
    expect(changes['level-R1']).toBe('changed')
    expect(changes['ceiling-R1']).toBe('changed')
    expect(changes['schedules']).toBe('changed')
    for (const key of ['level-RDC', 'ceiling-RDC', 'roof-R1', 'elevation-N', 'elevation-E', 'elevation-S', 'elevation-O']) {
      expect(changes[key], key).toBe('unchanged')
    }
  })

  it('une coupe ajoutée : feuille nouvelle ; un n° changé : ancien n° indiqué', () => {
    const section: SectionLineElement = {
      id: 'coupe-a',
      type: 'section',
      name: 'Coupe A',
      label: 'A',
      points: [7000, -2000, 7000, 15000],
      lookLeft: true,
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
    } as SectionLineElement
    const doc: FabricsDocument = { ...view, elements: [...view.elements, section], plan: { ...view.plan!, sheets: { issuer: '', revision: 'A', status: 'aps', numbers: { 'level-R1': '06' } } } }
    const comparison = compareSheetSets(before, sheetSnapshotsOf(doc, scene))
    expect(comparison.find((c) => c.key === 'section-coupe-a')).toMatchObject({ change: 'added', title: 'Coupe A–A' })
    expect(comparison.find((c) => c.key === 'level-R1')).toMatchObject({ number: '06', previousNumber: '02', change: 'unchanged' })
  })

  it('feuilles supprimées, vides des deux côtés, et redevenues dessinées', () => {
    const snap = (key: string, signature: string | null, number = '01'): SheetSnapshot => ({ key, number, title: key, signature })
    const result = compareSheetSets(
      [snap('a', 'x'), snap('b', null), snap('c', 'y'), snap('d', null), snap('gone', 'z')],
      [snap('a', 'x'), snap('b', null), snap('c', null), snap('d', 'w')],
    )
    expect(result.map((r) => `${r.key}:${r.change}`)).toEqual(['a:unchanged', 'b:unchanged', 'c:removed', 'd:added', 'gone:removed'])
  })
})
