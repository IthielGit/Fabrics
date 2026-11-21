/**
 * M20 20.1a étape 5 — exactitude imprimée : on lit le PDF vectoriel produit (contenu décompressé) et
 * on mesure les traits du plan de niveau ROOMIT-RDC (cotes Exécution comprises) sur la feuille.
 * À 1:50, 1000 mm réels = 20,0 mm de papier (écart toléré ≤ 0,1 mm) ; à 1:100, 10,0 mm.
 */
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import spec from '../../../fixtures/ROOMIT-RDC/spec.json'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing, PAPER_TEXT_MM, type Drawing } from '../building/views/drawing'
import { planOverlay } from '../dimensioning/planOverlay'
import { fixtureScene, type FixtureSpec } from '../scene/fixturePlan'
import { pascalLevelSymbols } from '../scene/view/levelPlanSymbols'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { buildDrawingPdf } from './pdf'
import { planPdfPlacement, sheetSize, type SheetFormat, type Orientation } from './pdfLayout'

const PT_PER_MM = 72 / 25.4
const TOLERANCE_MM = 0.1

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

type Segment = [number, number, number, number]

/** Segments `x y m x y l` de toutes les pages du PDF, en mm de papier, origine en haut à gauche. */
async function pdfSegments(blob: Blob, sheetHeightMm: number): Promise<Segment[]> {
  const bytes = Buffer.from(await blob.arrayBuffer())
  const raw = bytes.toString('latin1')
  let content = ''
  for (const match of raw.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length
    const end = raw.indexOf('endstream', start)
    try {
      content += `${inflateSync(bytes.subarray(start, end)).toString('latin1')}\n`
    } catch {
      // Flux non compressé (police, image) : sans traits de dessin.
    }
  }
  const segments: Segment[] = []
  const number = String.raw`(-?[\d.]+)`
  const pattern = new RegExp(String.raw`${number} ${number} m\s+${number} ${number} l\b`, 'g')
  for (const [, x1, y1, x2, y2] of content.matchAll(pattern)) {
    const mm = (v: string) => Number(v) / PT_PER_MM
    segments.push([mm(x1), sheetHeightMm - mm(y1), mm(x2), sheetHeightMm - mm(y2)])
  }
  return segments
}

const length = ([x1, y1, x2, y2]: Segment) => Math.hypot(x2 - x1, y2 - y1)

async function printed(format: SheetFormat, orientation: Orientation, scale: number) {
  const drawing = planDrawing(scale)
  const sheet = sheetSize(format, orientation)
  const placement = planPdfPlacement({ width: drawing.width, height: drawing.height }, sheet, scale)
  const blob = await buildDrawingPdf(drawing, sheet, placement.rect, scale, {
    projectName: 'ROOMIT',
    fields: [],
    scaleBarUnit: 'mm',
  })
  const segments = await pdfSegments(blob, sheet.height)
  /** Trait du PDF qui correspond à un trait du dessin (mm réels), ou `undefined`. */
  const onPaper = (l: Drawing['lines'][number]): Segment | undefined => {
    const x1 = placement.rect.x + l.x1 / scale
    const y1 = placement.rect.y + l.y1 / scale
    const x2 = placement.rect.x + l.x2 / scale
    const y2 = placement.rect.y + l.y2 / scale
    return segments.find(
      (s) =>
        Math.abs(s[0] - x1) <= TOLERANCE_MM &&
        Math.abs(s[1] - y1) <= TOLERANCE_MM &&
        Math.abs(s[2] - x2) <= TOLERANCE_MM &&
        Math.abs(s[3] - y2) <= TOLERANCE_MM,
    )
  }
  /** Traits du dessin longs de `mm` (à 1 mm près) : cotes et traits du plan de cette longueur. */
  const linesOf = (mm: number) =>
    drawing.lines.filter((l) => Math.abs(Math.hypot(l.x2 - l.x1, l.y2 - l.y1) - mm) < 1)
  return { placement, segments, onPaper, linesOf }
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
