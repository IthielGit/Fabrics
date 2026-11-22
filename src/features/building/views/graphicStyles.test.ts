/**
 * M20 20.5 — styles graphiques : épaisseurs imprimées selon l'échelle, catégories (calques),
 * visibilité, masques sous les étiquettes. Cas réel : plan de niveau R+1 de ROOMIT.
 */
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import rdc from '../../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../../fixtures/ROOMIT-R1/spec.json'
import { EXECUTION_LABELS } from '../../../i18n/dimensioningLabels'
import { sheetPlanOverlay } from '../../dimensioning/planOverlay'
import { printedDrawing } from '../../export/printedPdf'
import { fixtureBuildingScene, type FixtureSpec } from '../../scene/fixturePlan'
import { pascalLevelSymbols } from '../../scene/view/levelPlanSymbols'
import { sceneToFabricsView } from '../../scene/view/toFabricsView'
import { buildBuildingModel } from '../model'
import { levelPlanDrawing, PAPER_TEXT_MM, type Drawing, type PlanOverlay } from './drawing'
import { applyVisibility, lineWeights, tagOverlay, textMask, VISIBILITY_KEYS } from './graphicStyles'

describe('épaisseurs de trait imprimées', () => {
  it('série ISO 128 selon l’échelle : coupé 0,5 / 0,35 / 0,25 mm à 1:50 / 1:100 / 1:200', () => {
    expect(lineWeights(50)).toEqual({ heavy: 0.7, cut: 0.5, normal: 0.25, hair: 0.13, hatch: 0.1 })
    expect(lineWeights(20).cut).toBe(0.5)
    expect(lineWeights(100)).toEqual({ heavy: 0.5, cut: 0.35, normal: 0.18, hair: 0.13, hatch: 0.08 })
    expect(lineWeights(200)).toEqual({ heavy: 0.35, cut: 0.25, normal: 0.13, hair: 0.1, hatch: 0.07 })
    expect(lineWeights(137).cut).toBe(0.35)
  })

  it('à chaque échelle : sol > coupé > vu > filet > hachure (le coupé domine le vu)', () => {
    for (const scale of [10, 20, 50, 100, 200, 500]) {
      const w = lineWeights(scale)
      expect(w.heavy).toBeGreaterThan(w.cut)
      expect(w.cut).toBeGreaterThan(w.normal)
      expect(w.normal).toBeGreaterThan(w.hair)
      expect(w.hair).toBeGreaterThan(w.hatch)
    }
  })
})

describe('catégories et visibilité', () => {
  it('tagOverlay range les éléments sans catégorie et garde celles déjà posées', () => {
    const tagged = tagOverlay<PlanOverlay>(
      { lines: [{ x1: 0, y1: 0, x2: 1, y2: 1 }, { x1: 0, y1: 0, x2: 1, y2: 1, category: 'dimensions' }], texts: [{ x: 0, y: 0, text: 'A', size: 1 }] },
      'axes',
    )
    expect(tagged.lines.map((l) => l.category)).toEqual(['axes', 'dimensions'])
    expect(tagged.texts[0].category).toBe('axes')
    expect(tagOverlay(null, 'axes')).toBeNull()
  })

  it('aucune catégorie masquée : le dessin est rendu tel quel', () => {
    const d: Drawing = { width: 1, height: 1, polygons: [], lines: [], texts: [] }
    expect(applyVisibility(d, new Set())).toBe(d)
  })

  const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
  const view = sceneToFabricsView(scene)
  const level = view.levels!.find((l) => l.id === 'R1')!
  const font = PAPER_TEXT_MM * 50
  const plan = levelPlanDrawing(
    buildBuildingModel(view),
    level,
    font,
    (f) => sheetPlanOverlay(view, 'R1', 'execution', EXECUTION_LABELS, f),
    pascalLevelSymbols(scene.nodes, 'R1'),
  )!
  const all = [...plan.polygons, ...plan.lines, ...plan.texts]
  const count = (d: Drawing, category: string) =>
    [...d.polygons, ...d.lines, ...d.texts].filter((e) => e.category === category).length

  it('plan R+1 de ROOMIT : murs, poteaux, menuiseries, escalier, mobilier, pièces, cotes et repères sont rangés', () => {
    for (const category of ['walls', 'columns', 'openings', 'stairs', 'furniture', 'rooms', 'dimensions', 'marks']) {
      expect(count(plan, category), category).toBeGreaterThan(0)
    }
    // Tout ce qui n'est pas rangé : sols (gris clair) et découpes blanches des ouvertures.
    const loose = plan.polygons.filter((p) => !p.category)
    expect(loose.every((p) => p.fill === 'light' || p.fill === 'white')).toBe(true)
    expect(plan.lines.filter((l) => !l.category)).toEqual([])
    expect(plan.texts.filter((t) => !t.category)).toEqual([])
    expect(all.length).toBeGreaterThan(0)
  })

  it('masquer une catégorie retire tous ses éléments et rien d’autre', () => {
    for (const key of VISIBILITY_KEYS) {
      if (key === 'hatch') continue
      const hidden = applyVisibility(plan, new Set([key]))
      expect(count(hidden, key), key).toBe(0)
      const others = all.filter((e) => e.category !== key).length
      expect([...hidden.polygons, ...hidden.lines, ...hidden.texts].length, key).toBe(others)
    }
  })

  it('« Hachures » retire les hachures des murs et garde leur fond et leur contour', () => {
    const hatchedWalls = plan.polygons.filter((p) => p.hatch?.length)
    expect(hatchedWalls.length).toBeGreaterThan(0)
    const hidden = applyVisibility(plan, new Set(['hatch']))
    expect(hidden.polygons.some((p) => p.hatch?.length)).toBe(false)
    expect(hidden.polygons.length).toBe(plan.polygons.length)
    expect(hidden.lines.length).toBe(plan.lines.length)
  })

  it('les noms de pièces ont un masque ; les repères et les chiffres de cote non', () => {
    const rooms = plan.texts.filter((t) => t.category === 'rooms')
    expect(rooms.length).toBeGreaterThan(0)
    expect(rooms.every((t) => t.mask)).toBe(true)
    expect(plan.texts.filter((t) => t.category === 'dimensions' || t.category === 'marks').some((t) => t.mask)).toBe(false)
  })

  it('masque : couvre le texte centré avec une marge ; aucun pour un texte tourné', () => {
    const rect = textMask({ x: 100, y: 50, text: 'BAR', size: 10, anchor: 'middle' }, 10, 30)!
    expect(rect.x).toBeCloseTo(83, 6)
    expect(rect.width).toBeCloseTo(34, 6)
    expect(rect.y).toBeLessThan(50 - 7)
    expect(rect.y + rect.height).toBeGreaterThan(50)
    expect(textMask({ x: 0, y: 0, text: 'A', size: 1, angle: -90 }, 1, 1)).toBeNull()
  })

  /** Épaisseurs (opérateur « w », en pt) et rectangles pleins (« re » … « f ») écrits dans le PDF. */
  async function pdfOps(blob: Blob) {
    const bytes = Buffer.from(await blob.arrayBuffer())
    const raw = bytes.toString('latin1')
    let content = ''
    for (const match of raw.matchAll(/stream\r?\n/g)) {
      const start = match.index + match[0].length
      try {
        content += inflateSync(bytes.subarray(start, raw.indexOf('endstream', start))).toString('latin1')
      } catch {
        continue
      }
    }
    const widths = new Set([...content.matchAll(/([\d.]+) w\b/g)].map((m) => Math.round((Number(m[1]) * 25.4 * 100) / 72) / 100))
    const filledRects = [...content.matchAll(/re\s+f\b/g)].length
    return { widths, filledRects }
  }

  it('PDF : vu à 0,25 mm à 1:50, coupé 0,35 et vu 0,18 mm à 1:100 ; un masque blanc par ligne d’étiquette', async () => {
    const at50 = await pdfOps((await printedDrawing(plan, 'a1', 'landscape', 50)).blob)
    expect(at50.widths.has(0.5)).toBe(true)
    expect(at50.widths.has(0.25)).toBe(true)
    const masked = plan.texts.filter((t) => t.mask).length
    expect(at50.filledRects).toBeGreaterThanOrEqual(masked)
    const small = levelPlanDrawing(buildBuildingModel(view), level, PAPER_TEXT_MM * 100, undefined, pascalLevelSymbols(scene.nodes, 'R1'))!
    const at100 = await pdfOps((await printedDrawing(small, 'a2', 'landscape', 100)).blob)
    expect(at100.widths.has(0.35)).toBe(true)
    expect(at100.widths.has(0.18)).toBe(true)
    expect(at100.widths.has(0.25)).toBe(false)
  })
})
