import { describe, expect, it } from 'vitest'
import { BUTTON_ZOOM_STEP, zoomStepAtCenter } from './navigation'
import { MAX_ZOOM, MIN_ZOOM, screenToDocument } from './viewport'

const CONTAINER = { width: 800, height: 600 }
const CENTER = { x: 400, y: 300 }

describe('zoomStepAtCenter', () => {
  it('zoome d’un cran en avant et en arrière', () => {
    const view = { zoom: 0.2, x: 10, y: 20 }
    expect(zoomStepAtCenter(view, CONTAINER, 1, 1).zoom).toBeCloseTo(0.2 * BUTTON_ZOOM_STEP)
    expect(zoomStepAtCenter(view, CONTAINER, -1, 1).zoom).toBeCloseTo(0.2 / BUTTON_ZOOM_STEP)
  })

  it('garde au centre de l’écran le même point du document', () => {
    const view = { zoom: 0.19, x: -120, y: 45 }
    const pxPerUnit = 0.5
    const before = screenToDocument(CENTER, view, pxPerUnit)
    const after = screenToDocument(CENTER, zoomStepAtCenter(view, CONTAINER, 1, pxPerUnit), pxPerUnit)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('reste dans les limites du zoom', () => {
    expect(zoomStepAtCenter({ zoom: MAX_ZOOM, x: 0, y: 0 }, CONTAINER, 1, 1).zoom).toBe(MAX_ZOOM)
    expect(zoomStepAtCenter({ zoom: MIN_ZOOM, x: 0, y: 0 }, CONTAINER, -1, 1).zoom).toBe(MIN_ZOOM)
  })
})
