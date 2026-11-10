import { describe, expect, it } from 'vitest'
import { pxPerUnit } from '../units/scale'
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  fitToScreen,
  screenToDocument,
  zoomAtPoint,
} from './viewport'

describe('pxPerUnit', () => {
  it('vaut 1 pour un visuel et 0,2 pour un plan (1 m = 200 px)', () => {
    expect(pxPerUnit('px')).toBe(1)
    expect(pxPerUnit('mm')).toBe(0.2)
    expect(1000 * pxPerUnit('mm')).toBe(200)
  })
})

describe('clampZoom', () => {
  it('borne le zoom', () => {
    expect(clampZoom(1000)).toBe(MAX_ZOOM)
    expect(clampZoom(0)).toBe(MIN_ZOOM)
    expect(clampZoom(1.5)).toBe(1.5)
  })
})

describe('zoomAtPoint', () => {
  it('garde fixe le point du document sous le curseur', () => {
    const view = { zoom: 1, x: 100, y: 50 }
    const pointer = { x: 400, y: 300 }
    const before = screenToDocument(pointer, view, 1)
    const next = zoomAtPoint(view, pointer, 2.5, 1)
    expect(next.zoom).toBe(2.5)
    const after = screenToDocument(pointer, next, 1)
    expect(after.x).toBeCloseTo(before.x, 9)
    expect(after.y).toBeCloseTo(before.y, 9)
  })

  it('fonctionne aussi pour un plan en mm (0,2 px par mm)', () => {
    const view = { zoom: 0.5, x: -200, y: 30 }
    const pointer = { x: 250, y: 120 }
    const before = screenToDocument(pointer, view, 0.2)
    const next = zoomAtPoint(view, pointer, 0.8, 0.2)
    const after = screenToDocument(pointer, next, 0.2)
    expect(after.x).toBeCloseTo(before.x, 9)
    expect(after.y).toBeCloseTo(before.y, 9)
  })

  it('respecte les bornes du zoom', () => {
    const next = zoomAtPoint({ zoom: 1, x: 0, y: 0 }, { x: 0, y: 0 }, 9999, 1)
    expect(next.zoom).toBe(MAX_ZOOM)
  })
})

describe('fitToScreen', () => {
  it('centre une page carrée dans une fenêtre plus large', () => {
    const view = fitToScreen({ width: 1000, height: 1000 }, { width: 1000, height: 600 }, 1, 50)
    expect(view.zoom).toBeCloseTo(0.5) // (600 - 100) / 1000
    expect(view.x).toBeCloseTo((1000 - 500) / 2)
    expect(view.y).toBeCloseTo(50)
  })

  it('limite par la largeur quand la fenêtre est étroite', () => {
    const view = fitToScreen({ width: 2000, height: 1000 }, { width: 500, height: 800 }, 1, 0)
    expect(view.zoom).toBeCloseTo(0.25)
  })

  it('ajuste un plan de 20 × 15 m à une fenêtre de 1000 × 800 px', () => {
    const view = fitToScreen({ width: 20000, height: 15000 }, { width: 1000, height: 800 }, 0.2, 0)
    // 20 000 mm × 0,2 = 4000 px de large à 100 % → zoom = 1000 / 4000 = 0,25 ; hauteur : 800 / 3000 ≈ 0,267
    expect(view.zoom).toBeCloseTo(0.25)
    expect(view.x).toBeCloseTo(0)
  })
})
