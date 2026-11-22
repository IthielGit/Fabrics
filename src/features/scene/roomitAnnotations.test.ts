/**
 * M20 20.2 — critère du gate G3 « aucun conflit d'annotations critique » : sur les plans de ROOMIT
 * imprimés à 1:50 (RDC et R+1, cotes Client et Exécution, plan de toiture), aucun texte n'en recouvre
 * un autre à sa taille imprimée (noms de pièces en gras à 10 pt).
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { fr } from '../../i18n/fr'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing, PAPER_TEXT_MM } from '../building/views/drawing'
import { roofPlanDrawing } from '../building/views/roofPlan'
import { annotationGraphics } from '../dimensioning/annotationGraphics'
import { textConflicts } from '../dimensioning/conflicts'
import { planOverlay } from '../dimensioning/planOverlay'
import { roofChains } from '../dimensioning/roofChains'
import { fixtureBuildingScene, type FixtureSpec } from './fixturePlan'
import { pascalLevelSymbols, pascalRoofStairSymbols } from './view/levelPlanSymbols'
import { pascalRoofPlan } from './view/roofPlanData'
import { sceneToFabricsView } from './view/toFabricsView'

const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
const view = sceneToFabricsView(scene)
const model = buildBuildingModel(view)
const SCALE = 50
const font = PAPER_TEXT_MM * SCALE
const named = (d: { texts: { text: string }[] }, pairs: [number, number][]) => pairs.map(([i, j]) => `${d.texts[i].text} | ${d.texts[j].text}`)

describe('ROOMIT à 1:50 : aucun conflit d’annotations', () => {
  it.each([
    ['RDC', 'client'],
    ['RDC', 'execution'],
    ['R1', 'client'],
    ['R1', 'execution'],
  ] as const)('plan de niveau %s, cotes %s', (levelId, mode) => {
    const level = view.levels!.find((l) => l.id === levelId)!
    const d = levelPlanDrawing(model, level, font, (f) => planOverlay(view, levelId, mode, EXECUTION_LABELS, f), pascalLevelSymbols(scene.nodes, levelId))!
    expect(named(d, textConflicts(d, SCALE))).toEqual([])
  })

  it('plan de toiture', () => {
    const plan = pascalRoofPlan(scene.nodes, 'R1')!
    const d = roofPlanDrawing(plan, { slope: fr.views.roofSlope }, font, [
      pascalRoofStairSymbols(scene.nodes, 'R1'),
      (f) => annotationGraphics({ dimensions: roofChains(plan.outlines), labels: [] }, f),
    ])!
    expect(named(d, textConflicts(d, SCALE))).toEqual([])
  })
})
