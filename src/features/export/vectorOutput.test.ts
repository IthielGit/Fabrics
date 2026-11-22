/**
 * M20 20.6 — sorties vectorielles à l'échelle : SVG du dessin (1:50, 1:100, 1:200, calques par
 * catégorie) et PDF avec Liberation Sans intégrée (SIL OFL 1.1). Cas réel : plan R+1 de ROOMIT.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { fr } from '../../i18n/fr'
import { buildBuildingModel } from '../building/model'
import { levelPlanDrawing, PAPER_TEXT_MM } from '../building/views/drawing'
import { lineWeights } from '../building/views/graphicStyles'
import { sheetPlanOverlay } from '../dimensioning/planOverlay'
import { fixtureBuildingScene, type FixtureSpec } from '../scene/fixturePlan'
import { pascalLevelSymbols } from '../scene/view/levelPlanSymbols'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { setFontLoader } from './pdfFonts'
import { printedDrawing } from './printedPdf'
import { drawingToSvg } from './svg'

const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
const view = sceneToFabricsView(scene)
const level = view.levels!.find((l) => l.id === 'R1')!
const model = buildBuildingModel(view)
const planAt = (scale: number) =>
  levelPlanDrawing(
    model,
    level,
    PAPER_TEXT_MM * scale,
    (f) => sheetPlanOverlay(view, 'R1', 'execution', EXECUTION_LABELS, f),
    pascalLevelSymbols(scene.nodes, 'R1'),
  )!
const layerNames = { ...fr.views.visibility.keys, base: fr.views.svgBaseLayer }

describe('SVG à l’échelle', () => {
  for (const scale of [50, 100, 200]) {
    it(`1:${scale} : taille du papier = dessin / ${scale}, chaque trait à sa place, épaisseurs de la table`, () => {
      const plan = planAt(scale)
      const svg = drawingToSvg(plan, { scale, title: 'ROOMIT R+1', layerNames })
      const width = Number(svg.match(/width="([\d.]+)mm"/)![1])
      const height = Number(svg.match(/height="([\d.]+)mm"/)![1])
      const [, , vbW, vbH] = svg.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number)
      // 1000 mm réels = 1000 / scale mm sur le papier (20 mm à 1:50), à 0,01 mm près.
      expect(Math.abs(width - plan.width / scale)).toBeLessThanOrEqual(0.01)
      expect(Math.abs(height - plan.height / scale)).toBeLessThanOrEqual(0.01)
      expect(Math.abs(vbW / width - scale)).toBeLessThan(0.01)
      expect(Math.abs(vbH / height - scale)).toBeLessThan(0.01)
      // Toutes les lignes du dessin, aux mêmes coordonnées (arrondies à 0,01 mm réel).
      const lines = [...svg.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"[^>]*stroke-width="([\d.]+)"/g)]
      expect(lines.length).toBe(plan.lines.length)
      lines.forEach((m, i) => {
        const l = plan.lines[i]
        expect(Math.abs(Number(m[1]) - l.x1) + Math.abs(Number(m[2]) - l.y1) + Math.abs(Number(m[3]) - l.x2) + Math.abs(Number(m[4]) - l.y2)).toBeLessThan(0.03)
        expect(Number(m[5]) / scale).toBeCloseTo(lineWeights(scale)[l.weight ?? 'normal'], 3)
      })
    })
  }

  it('calques par catégorie (Murs, Cotes, Mobilier…), textes et masques présents, groupes fermés', () => {
    const plan = planAt(50)
    const svg = drawingToSvg(plan, { scale: 50, title: 'ROOMIT R+1 & co', layerNames })
    const categories = new Set([...svg.matchAll(/data-category="(\w+)"/g)].map((m) => m[1]))
    for (const c of ['base', 'walls', 'columns', 'openings', 'stairs', 'furniture', 'rooms', 'dimensions', 'marks']) expect(categories.has(c), c).toBe(true)
    expect(svg).toContain('inkscape:label="Murs"')
    expect(svg).toContain('<title>ROOMIT R+1 &amp; co</title>')
    expect((svg.match(/<g /g) ?? []).length).toBe((svg.match(/<\/g>/g) ?? []).length)
    expect((svg.match(/<text /g) ?? []).length).toBe(plan.texts.length)
    expect(svg).toContain('>Bibliothèque</text>')
    expect((svg.match(/<rect [^>]*fill="#ffffff"\/>/g) ?? []).length).toBe(1 + plan.texts.filter((t) => t.mask).length)
  })
})

describe('PDF : polices intégrées', () => {
  afterEach(() => setFontLoader(null))

  const decode = async (blob: Blob) => Buffer.from(await blob.arrayBuffer()).toString('latin1')

  it('Liberation Sans normal et gras intégrées, aucune police standard non intégrée ; plan toujours à l’échelle', async () => {
    setFontLoader(async (url) => {
      const bytes = await readFile(fileURLToPath(url))
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    })
    const { blob, misplaced } = await printedDrawing(planAt(50), 'a1', 'landscape', 50)
    const raw = await decode(blob)
    const baseFonts = [...raw.matchAll(/\/BaseFont\s*\/([\w+-]+)/g)].map((m) => m[1])
    expect(baseFonts.length).toBeGreaterThan(0)
    expect(baseFonts.every((f) => f.includes('LiberationSans')), baseFonts.join(', ')).toBe(true)
    expect((raw.match(/\/FontFile2/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(misplaced()).toEqual([])
  })

  it('sans fichier de police : Helvetica (police standard), le PDF est produit quand même', async () => {
    setFontLoader(async () => null)
    const { blob } = await printedDrawing(planAt(50), 'a1', 'landscape', 50)
    const raw = await decode(blob)
    expect(raw).toContain('/BaseFont /Helvetica')
    expect(raw).not.toContain('/FontFile2')
  })
})
