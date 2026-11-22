/**
 * M20 20.4 — feuilles au gabarit de la référence (D20-3 : A) : formats A4 à A1, colonne de droite
 * (type de plan, rose des vents, tableaux), cartouche (projet, émetteur, titre, N° de plan, indice,
 * date, statut, échelle, format). Le plan garde son échelle exacte.
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { fr } from '../../i18n/fr'
import { buildBuildingModel } from '../building/model'
import { levelAreaTable, withAreaTable } from '../building/views/areaTable'
import { levelPlanDrawing, PAPER_TEXT_MM } from '../building/views/drawing'
import { sheetPlanOverlay } from '../dimensioning/planOverlay'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { fixtureBuildingScene, type FixtureSpec } from '../scene/fixturePlan'
import { pascalLevelSymbols } from '../scene/view/levelPlanSymbols'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { columnCartoucheCells, SHEET_STATUSES } from './cartouche'
import { columnArea, columnPrintableArea, columnWidth, planPdfPlacement, SHEET_FORMATS, sheetSize } from './pdfLayout'
import { pdfStrings, printedDrawing } from './printedPdf'

describe('gabarit « colonne » : mise en page', () => {
  it('formats A4, A3, A2, A1 ; A1 paysage = 841 × 594 mm', () => {
    expect(SHEET_FORMATS).toEqual(['a4', 'a3', 'a2', 'a1'])
    expect(sheetSize('a1', 'landscape')).toEqual({ width: 841, height: 594 })
  })

  it('colonne de droite : 13 % de la largeur entre 50 et 90 mm ; le dessin occupe le reste', () => {
    const a2 = sheetSize('a2', 'landscape')
    expect(columnWidth(a2)).toBeCloseTo(77.22, 2)
    expect(columnWidth(sheetSize('a4', 'portrait'))).toBe(50)
    expect(columnWidth(sheetSize('a1', 'landscape'))).toBe(90)
    const area = columnPrintableArea(a2)
    const col = columnArea(a2)
    expect(area.x + area.width).toBeCloseTo(col.x, 6)
    expect(col.x + col.width).toBeCloseTo(a2.width - 10, 6)
  })

  it('le plan est centré dans la zone du dessin, jamais sous la colonne', () => {
    const a2 = sheetSize('a2', 'landscape')
    const p = planPdfPlacement({ width: 18_000, height: 15_000 }, a2, 50, 'column')
    expect(p.fits).toBe(true)
    expect(p.rect.x + p.rect.width).toBeLessThanOrEqual(columnArea(a2).x + 1e-6)
  })

  it('cellules du cartouche : N° de plan / Indice, Date / Statut, Échelle / Format', () => {
    const cells = columnCartoucheCells(
      { issuer: 'ATELIER 73', sheetNumber: '06', revision: '0', status: 'apd' },
      { exactScale: true, denominator: 50, date: '22/11/2026', format: 'a2' },
      fr.views.sheetInfo,
    )
    expect(cells.map((c) => `${c.label} : ${c.value}`)).toEqual([
      'N° de plan : 06',
      'Indice : 0',
      'Date : 22/11/2026',
      'Statut : APD',
      'Échelle : 1 : 50',
      'Format : A2',
    ])
    expect(SHEET_STATUSES.map((s) => fr.views.sheetInfo.statuses[s])).toEqual(['Esquisse', 'APS', 'APD', 'PC', 'DCE', 'EXE'])
  })
})

describe('feuille R+1 de ROOMIT au gabarit de la référence (A2 paysage, 1:50)', () => {
  const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
  const view = sceneToFabricsView(scene)
  const level = view.levels!.find((l) => l.id === 'R1')!
  const font = PAPER_TEXT_MM * 50
  const main = levelPlanDrawing(buildBuildingModel(view), level, font, (f) => sheetPlanOverlay(view, 'R1', 'execution', EXECUTION_LABELS, f), pascalLevelSymbols(scene.nodes, 'R1'))!
  const metres = computeBuildingMeasurements(view).levels.find((l) => l.level.id === 'R1')!
  const side = withAreaTable({ width: 0, height: 0, polygons: [], lines: [], texts: [] }, levelAreaTable(metres.measurements, 'R+1', fr.views.areaTable), font)
  const column = {
    kind: 'Plan de niveau',
    issuer: 'ATELIER 73',
    side,
    cells: columnCartoucheCells(
      { issuer: 'ATELIER 73', sheetNumber: '06', revision: '0', status: 'apd' },
      { exactScale: true, denominator: 50, date: '22/11/2026', format: 'a2' },
      fr.views.sheetInfo,
    ),
  }

  it('tous les traits du plan à l’échelle (≤ 0,1 mm), cartouche et colonne écrits dans le PDF', async () => {
    const { placement, misplaced, blob } = await printedDrawing(main, 'a2', 'landscape', 50, {
      template: 'column',
      labels: { subtitle: 'Plan de niveau R+1', northAngle: 0, northLabel: 'N', column },
    })
    expect(placement.fits).toBe(true)
    expect(misplaced()).toEqual([])
    const strings = await pdfStrings(blob)
    for (const text of ['PLAN DE NIVEAU', 'ROOMIT', 'ATELIER 73', 'Plan de niveau R+1', 'N° de plan : 06', 'Statut : APD', 'Échelle : 1 : 50', 'Format : A2', 'Pièces Niveau R+1']) {
      expect(strings.some((s) => s.includes(text)), text).toBe(true)
    }
  })
})
