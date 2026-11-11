import { describe, expect, it } from 'vitest'
import {
  centerViewOn,
  documentBoxToMinimap,
  minimapLayout,
  minimapToDocument,
  panView,
  positionAfterThumbDrag,
  scrollMetrics,
  visibleBox,
  WHEEL_ZOOM_STEP,
  wheelAction,
  type WheelInput,
} from './navigation'
import { screenToDocument } from './viewport'

const WHEEL: WheelInput = { deltaX: 0, deltaY: 0, deltaMode: 0, ctrlKey: false, shiftKey: false }

describe('wheelAction', () => {
  it('un cran de molette de souris zoome de 10 %', () => {
    expect(wheelAction({ ...WHEEL, deltaY: -100 })).toEqual({ kind: 'zoom', factor: WHEEL_ZOOM_STEP })
    expect(wheelAction({ ...WHEEL, deltaY: 100 })).toEqual({
      kind: 'zoom',
      factor: 1 / WHEEL_ZOOM_STEP,
    })
  })

  it('un glissement à deux doigts (petits pixels) déplace la vue dans les deux sens', () => {
    expect(wheelAction({ ...WHEEL, deltaX: 12, deltaY: -8 })).toEqual({ kind: 'pan', dx: -12, dy: 8 })
    expect(wheelAction({ ...WHEEL, deltaY: 6 })).toEqual({ kind: 'pan', dx: 0, dy: -6 })
  })

  it('un défilement horizontal seul est un déplacement, même grand', () => {
    expect(wheelAction({ ...WHEEL, deltaX: 120 })).toEqual({ kind: 'pan', dx: -120, dy: 0 })
  })

  it('Maj + molette déplace horizontalement (deltaX ou deltaY selon le système)', () => {
    expect(wheelAction({ ...WHEEL, shiftKey: true, deltaY: 100 })).toEqual({
      kind: 'pan',
      dx: -100,
      dy: 0,
    })
    expect(wheelAction({ ...WHEEL, shiftKey: true, deltaX: -100 })).toEqual({
      kind: 'pan',
      dx: 100,
      dy: 0,
    })
  })

  it('Ctrl (ou pincement) zoome en continu, borné', () => {
    const zoomIn = wheelAction({ ...WHEEL, ctrlKey: true, deltaY: -5 })
    const zoomOut = wheelAction({ ...WHEEL, ctrlKey: true, deltaY: 5 })
    expect(zoomIn?.kind).toBe('zoom')
    if (zoomIn?.kind === 'zoom' && zoomOut?.kind === 'zoom') {
      expect(zoomIn.factor).toBeGreaterThan(1)
      expect(zoomOut.factor).toBeLessThan(1)
    }
    const huge = wheelAction({ ...WHEEL, ctrlKey: true, deltaY: -10000 })
    expect(huge).toEqual({ kind: 'zoom', factor: 1.5 })
  })

  it('un événement sans défilement ne fait rien', () => {
    expect(wheelAction(WHEEL)).toBeNull()
  })

  it('un grand défilement en lignes (deltaMode 1) reste un zoom', () => {
    expect(wheelAction({ ...WHEEL, deltaMode: 1, deltaY: -3 })?.kind).toBe('zoom')
  })
})

describe('vue', () => {
  it('panView décale la position sans toucher au zoom', () => {
    expect(panView({ zoom: 2, x: 10, y: 20 }, 5, -5)).toEqual({ zoom: 2, x: 15, y: 15 })
  })

  it('centerViewOn place le point au centre de la zone', () => {
    const view = centerViewOn({ x: 1000, y: 500 }, { width: 800, height: 600 }, 0.5, 1)
    expect(view.zoom).toBe(0.5)
    const centre = screenToDocument({ x: 400, y: 300 }, view, 1)
    expect(centre.x).toBeCloseTo(1000)
    expect(centre.y).toBeCloseTo(500)
  })

  it('visibleBox : la zone du document que l’on voit', () => {
    const box = visibleBox({ zoom: 0.5, x: -100, y: 50 }, { width: 800, height: 600 }, 2)
    // échelle 1 px par unité : la zone visible commence à (100, −50) et fait 800 × 600
    expect(box).toEqual({ x: 100, y: -50, width: 800, height: 600 })
  })
})

describe('barres de défilement', () => {
  it('page plus petite que la zone : le curseur occupe une partie de la piste', () => {
    // page de 400 px au milieu d'une zone de 1000 px
    const metrics = scrollMetrics(300, 400, 1000)
    expect(metrics.thumbSize).toBeLessThan(1)
    expect(metrics.thumbStart).toBeGreaterThanOrEqual(0)
    expect(metrics.thumbStart + metrics.thumbSize).toBeLessThanOrEqual(1 + 1e-9)
  })

  it('page bien plus grande que la zone : petit curseur au début quand on est en haut à gauche', () => {
    const metrics = scrollMetrics(0, 10000, 1000)
    expect(metrics.thumbSize).toBeCloseTo(1000 / 11000 - 0.0001, 2)
    // la marge d'une demi-zone avant la page place le curseur un peu après le début
    expect(metrics.thumbStart).toBeCloseTo(500 / 11000, 5)
  })

  it('le curseur avance quand on va vers la fin de la page', () => {
    const atStart = scrollMetrics(0, 10000, 1000)
    const scrolled = scrollMetrics(-5000, 10000, 1000)
    expect(scrolled.thumbStart).toBeGreaterThan(atStart.thumbStart)
  })

  it('glisser le curseur déplace le contenu en sens inverse, proportionnellement', () => {
    const metrics = scrollMetrics(0, 10000, 1000)
    const after = positionAfterThumbDrag(0, 100, 1000, metrics)
    // 10 % de la piste = 10 % de la plage défilable, vers l'arrière
    expect(after).toBeCloseTo(-0.1 * metrics.extentLength)
    expect(positionAfterThumbDrag(0, 0, 1000, metrics)).toBeCloseTo(0)
    expect(positionAfterThumbDrag(50, 100, 0, metrics)).toBe(50)
  })

  it('la plage défilable contient toujours la zone visible', () => {
    for (const start of [-9000, -300, 0, 400, 5000]) {
      const m = scrollMetrics(start, 2000, 800)
      expect(m.extentStart).toBeLessThanOrEqual(0)
      expect(m.extentStart + m.extentLength).toBeGreaterThanOrEqual(800)
      expect(m.thumbSize).toBeLessThanOrEqual(1)
    }
  })
})

describe('mini-carte', () => {
  const page = { x: 0, y: 0, width: 2000, height: 1000 }
  const visible = { x: 500, y: 200, width: 400, height: 300 }
  const layout = minimapLayout(page, visible, { width: 200, height: 120 })

  it('tient dans la mini-carte, centrée', () => {
    const drawn = documentBoxToMinimap(layout, page)
    expect(drawn.width).toBeLessThanOrEqual(200)
    expect(drawn.height).toBeLessThanOrEqual(120)
    expect(drawn.x).toBeGreaterThanOrEqual(0)
    expect(drawn.y).toBeGreaterThanOrEqual(0)
  })

  it('un clic sur la mini-carte donne le point du document correspondant (aller-retour)', () => {
    const box = documentBoxToMinimap(layout, { x: 1000, y: 500, width: 0, height: 0 })
    const back = minimapToDocument(layout, { x: box.x, y: box.y })
    expect(back.x).toBeCloseTo(1000)
    expect(back.y).toBeCloseTo(500)
  })

  it('la zone visible hors de la page agrandit la zone représentée', () => {
    const far = minimapLayout(page, { x: 3000, y: -500, width: 400, height: 300 }, { width: 200, height: 120 })
    expect(far.world.x).toBe(0)
    expect(far.world.width).toBe(3400)
    expect(far.world.y).toBe(-500)
    const drawn = documentBoxToMinimap(far, { x: 3000, y: -500, width: 400, height: 300 })
    expect(drawn.x + drawn.width).toBeLessThanOrEqual(200 + 1e-9)
  })
})
