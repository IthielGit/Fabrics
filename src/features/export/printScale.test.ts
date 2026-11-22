/**
 * M20 20.1a étape 5 — exactitude imprimée : on lit le PDF vectoriel produit (contenu décompressé) et
 * on mesure les traits du plan de niveau ROOMIT-RDC (cotes Exécution comprises) sur la feuille.
 * À 1:50, 1000 mm réels = 20,0 mm de papier (écart toléré ≤ 0,1 mm) ; à 1:100, 10,0 mm.
 */
import { describe, expect, it } from 'vitest'
import spec from '../../../fixtures/ROOMIT-RDC/spec.json'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing, PAPER_TEXT_MM, type Drawing } from '../building/views/drawing'
import { planOverlay } from '../dimensioning/planOverlay'
import { fixtureScene, type FixtureSpec } from '../scene/fixturePlan'
import { pascalLevelSymbols } from '../scene/view/levelPlanSymbols'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import type { Orientation, SheetFormat } from './pdfLayout'
import { length, printedDrawing, TOLERANCE_MM } from './printedPdf'

const scene = fixtureScene(spec as unknown as FixtureSpec)
const view = sceneToFabricsView(scene)
const level = view.levels![0]

/** Plan de niveau tel que la planche le dessine, textes à la hauteur de papier de l'échelle. */
function planDrawing(scale: number): Drawing {
  return levelPlanDrawing(
    buildBuildingModel(view),
    level,
    PAPER_TEXT_MM * scale,
    (font) => planOverlay(view, level.id, 'execution', EXECUTION_LABELS, font),
    pascalLevelSymbols(scene.nodes, spec.level.id),
  )!
}

async function printed(format: SheetFormat, orientation: Orientation, scale: number) {
  return printedDrawing(planDrawing(scale), format, orientation, scale)
}

describe('ROOMIT-RDC imprimé : mesures sur le PDF vectoriel (20.1a étape 5)', () => {
  it('1:50 sur A2 paysage : le plan tient, dessin réduit exactement 50 fois', async () => {
    const { placement } = await printed('a2', 'landscape', 50)
    const drawing = planDrawing(50)
    expect(placement.fits).toBe(true)
    expect(placement.exact).toBe(true)
    expect(placement.rect.width).toBeCloseTo(drawing.width / 50, 6)
    expect(placement.rect.height).toBeCloseTo(drawing.height / 50, 6)
  })

  it.each([
    { real: 1000, paper: 20.0, what: 'cote de 1000 mm' },
    { real: 1475, paper: 29.5, what: 'largeur de la SDB' },
    { real: 14473, paper: 289.46, what: 'cote d’ensemble' },
  ])('1:50 : $what ($real mm) = $paper mm sur la feuille', async ({ real, paper }) => {
    const { onPaper, linesOf } = await printed('a2', 'landscape', 50)
    const lines = linesOf(real)
    expect(lines.length, `trait de ${real} mm dans le dessin`).toBeGreaterThan(0)
    for (const line of lines) {
      const segment = onPaper(line)
      expect(segment, `trait de ${real} mm écrit dans le PDF`).toBeDefined()
      expect(Math.abs(length(segment!) - paper)).toBeLessThanOrEqual(TOLERANCE_MM)
    }
  })

  it('1:50 : tous les traits du plan sont à leur place et à l’échelle (≤ 0,1 mm)', async () => {
    const { onPaper } = await printed('a2', 'landscape', 50)
    const drawing = planDrawing(50)
    const missing = drawing.lines.filter((l) => {
      const segment = onPaper(l)
      if (!segment) return true
      return Math.abs(length(segment) - Math.hypot(l.x2 - l.x1, l.y2 - l.y1) / 50) > TOLERANCE_MM
    })
    expect(missing).toEqual([])
  })

  it('1:100 sur A3 paysage (le plan ne tient pas sur A4) : 1000 mm = 10,0 mm, cote d’ensemble 144,73 mm', async () => {
    const { placement, onPaper, linesOf } = await printed('a3', 'landscape', 100)
    expect(placement.fits).toBe(true)
    for (const [real, paper] of [[1000, 10.0], [14473, 144.73]]) {
      const lines = linesOf(real)
      expect(lines.length).toBeGreaterThan(0)
      for (const line of lines) expect(Math.abs(length(onPaper(line)!) - paper)).toBeLessThanOrEqual(TOLERANCE_MM)
    }
  })
})
