import { describe, expect, it } from 'vitest'
import type { FloorplanGeometry } from '@pascal-app/core'
import { flattenSvgPath, floorplanToDrawing } from './planSymbols'

const close = (a: number, b: number) => Math.abs(a - b) < 1e-6

describe('flattenSvgPath', () => {
  it('lignes absolues et relatives, H, V et Z', () => {
    const [run] = flattenSvgPath('M 0 0 L 1 0 v 1 H 0 Z')
    expect(run.closed).toBe(true)
    expect(run.points).toEqual([[0, 0], [1, 0], [1, 1], [0, 1]])
  })

  it('arc d’un quart de cercle (battant de porte) : rayon constant, arrivée exacte', () => {
    const [run] = flattenSvgPath('M 1 0 A 1 1 0 0 1 0 1')
    const last = run.points[run.points.length - 1]
    expect(last).toEqual([0, 1])
    for (const [x, y] of run.points) expect(close(Math.hypot(x, y), 1)).toBe(true)
    expect(run.points.length).toBeGreaterThan(5)
  })

  it('plusieurs sous-chemins', () => {
    expect(flattenSvgPath('M0 0 L1 1 M2 2 L3 3')).toHaveLength(2)
  })
})

describe('floorplanToDrawing', () => {
  const geometry: FloorplanGeometry = {
    kind: 'group',
    children: [
      // contour d'un meuble, gris clair : filet gris, en mm
      { kind: 'polygon', points: [[1, 1], [2, 1], [2, 2]], fill: 'none', stroke: '#9ca3af', strokeWidth: 0.006 },
      // WC : fond blanc et trait noir
      { kind: 'rect', x: 0, y: 0, width: 0.4, height: 0.7, fill: '#ffffff', stroke: '#1f2937', strokeWidth: 0.012 },
      // ombrage sombre des marches, sans trait : non repris
      { kind: 'polygon', points: [[0, 0], [1, 0], [1, 1]], fill: '#262626', stroke: 'none' },
      // contour de marche épais, tireté
      { kind: 'line', x1: 0, y1: 0, x2: 0, y2: 1, stroke: '#171717', strokeWidth: 0.025, strokeDasharray: '5 4' },
      // nez de marche de Pascal : bande sombre de 40 mm → filet sur son axe
      { kind: 'polygon', points: [[0, 2], [0.85, 2], [0.85, 2.04], [0, 2.04]], fill: '#262626', stroke: 'none' },
      // étiquette anglaise : non reprise
      { kind: 'text', x: 0, y: 0, text: 'WC', fontSize: 0.1 },
    ],
  } as unknown as FloorplanGeometry

  const out = floorplanToDrawing(geometry)

  it('mètres → mm, contour gris en filet gris', () => {
    const grey = out.lines.filter((l) => l.muted)
    expect(grey).toHaveLength(3)
    expect(grey[0]).toMatchObject({ x1: 1000, y1: 1000, x2: 2000, y2: 1000, weight: 'hair' })
  })

  it('fond blanc → masque sans contour ; trait noir fin → filet', () => {
    expect(out.polygons).toEqual([
      { points: [[0, 0], [400, 0], [400, 700], [0, 700]], fill: 'white', edges: [false, false, false, false] },
    ])
    expect(out.lines.filter((l) => !l.muted && !l.dashed && l.weight === 'hair' && (l.y1 < 1000 || l.y2 < 1000))).toHaveLength(4)
  })

  it('trait épais tireté gardé, ombrage et texte écartés', () => {
    expect(out.lines.filter((l) => l.dashed)).toEqual([{ x1: 0, y1: 0, x2: 0, y2: 1000, weight: 'normal', dashed: true }])
    expect(out.texts).toEqual([])
    expect(out.lines).toHaveLength(3 + 4 + 1 + 1)
  })

  it('bande sombre étroite (nez de marche) → un filet sur son axe ; grand fond sombre écarté', () => {
    const tread = out.lines.at(-1)!
    expect([tread.x1, tread.x2].sort((a, b) => a - b)).toEqual([0, 850])
    expect([tread.y1, tread.y2, tread.weight]).toEqual([2020, 2020, 'hair'])
  })

  it('géométrie absente : rien', () => {
    expect(floorplanToDrawing(null)).toEqual({ polygons: [], lines: [], texts: [] })
  })
})
