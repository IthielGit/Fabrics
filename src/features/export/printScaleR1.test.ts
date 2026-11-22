/**
 * M20 20.1b tâche 7 — exactitude imprimée du R+1 (page 6) et du plan de toiture (page 7) de ROOMIT :
 * le PDF vectoriel est relu, chaque trait du dessin est retrouvé sur la feuille à sa place et à
 * l'échelle (écart ≤ 0,1 mm). À 1:50 : 4304 mm (largeur de la Chambre 3) = 86,08 mm ; 15072 mm
 * (largeur de la toiture) = 301,44 mm. Aussi à 1:100 et 1:200 (critère du gate G3).
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { fr } from '../../i18n/fr'
import { levelAreaTable, withAreaTable } from '../building/views/areaTable'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing, PAPER_TEXT_MM, type Drawing } from '../building/views/drawing'
import { roofPlanDrawing } from '../building/views/roofPlan'
import { annotationGraphics } from '../dimensioning/annotationGraphics'
import { planOverlay } from '../dimensioning/planOverlay'
import { roofChains } from '../dimensioning/roofChains'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { fixtureBuildingScene, type FixtureSpec } from '../scene/fixturePlan'
import { pascalLevelSymbols, pascalRoofStairSymbols } from '../scene/view/levelPlanSymbols'
import { pascalRoofPlan } from '../scene/view/roofPlanData'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { length, printedDrawing, TOLERANCE_MM } from './printedPdf'

const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
const view = sceneToFabricsView(scene)
const level = view.levels!.find((l) => l.id === 'R1')!

/** Plan du R+1 en Exécution avec son tableau des surfaces, comme l'onglet « Plan de niveau R+1 ». */
function r1Drawing(scale: number): Drawing {
  const font = PAPER_TEXT_MM * scale
  const plan = levelPlanDrawing(buildBuildingModel(view), level, font, (f) => planOverlay(view, 'R1', 'execution', EXECUTION_LABELS, f), pascalLevelSymbols(scene.nodes, 'R1'))!
  const metres = computeBuildingMeasurements(view).levels.find((l) => l.level.id === 'R1')!
  return withAreaTable(plan, levelAreaTable(metres.measurements, level.name, fr.views.areaTable), font)
}

/** Plan de toiture avec ses cotes et l'escalier d'accès, comme l'onglet « Plan de toiture R+1 ». */
function roofDrawing(scale: number): Drawing {
  const plan = pascalRoofPlan(scene.nodes, 'R1')!
  return roofPlanDrawing(plan, { slope: fr.views.roofSlope }, PAPER_TEXT_MM * scale, [
    pascalRoofStairSymbols(scene.nodes, 'R1'),
    (f) => annotationGraphics({ dimensions: roofChains(plan.outlines), labels: [] }, f),
  ])!
}

describe('ROOMIT R+1 et toiture imprimés : mesures sur le PDF vectoriel', () => {
  it('R+1 à 1:50 sur A2 paysage : tous les traits à leur place et à l’échelle ; 4304 mm = 86,08 mm', async () => {
    const drawing = r1Drawing(50)
    const { placement, misplaced, linesOf, onPaper } = await printedDrawing(drawing, 'a2', 'landscape', 50)
    expect(placement.fits).toBe(true)
    expect(misplaced()).toEqual([])
    const lines = linesOf(4304)
    expect(lines.length).toBeGreaterThan(0)
    for (const l of lines) expect(Math.abs(length(onPaper(l)!) - 86.08)).toBeLessThanOrEqual(TOLERANCE_MM)
  })

  it('toiture à 1:50 sur A2 paysage : tous les traits ; 15072 mm = 301,44 mm, 4504 mm = 90,08 mm', async () => {
    const drawing = roofDrawing(50)
    const { placement, misplaced, linesOf, onPaper } = await printedDrawing(drawing, 'a2', 'landscape', 50)
    expect(placement.fits).toBe(true)
    expect(misplaced()).toEqual([])
    for (const [real, paper] of [[15072, 301.44], [4504, 90.08]]) {
      const lines = linesOf(real)
      expect(lines.length, `trait de ${real} mm`).toBeGreaterThan(0)
      for (const l of lines) expect(Math.abs(length(onPaper(l)!) - paper)).toBeLessThanOrEqual(TOLERANCE_MM)
    }
  })

  it.each([
    { scale: 100, format: 'a3' as const, paper: 150.72 },
    { scale: 200, format: 'a4' as const, paper: 75.36 },
  ])('toiture à 1:$scale sur $format : 15072 mm = $paper mm, tous les traits', async ({ scale, format, paper }) => {
    const drawing = roofDrawing(scale)
    const { placement, misplaced, linesOf, onPaper } = await printedDrawing(drawing, format, 'landscape', scale)
    expect(placement.fits).toBe(true)
    expect(misplaced()).toEqual([])
    for (const l of linesOf(15072)) expect(Math.abs(length(onPaper(l)!) - paper)).toBeLessThanOrEqual(TOLERANCE_MM)
  })
})
