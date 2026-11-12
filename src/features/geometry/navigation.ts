import type { Box } from './box'
import { unionBoxes } from './box'
import { clampZoom, screenToDocument, type Point, type Size, type View } from './viewport'

/** Cran de molette de souris : un cran zoome de 10 %. */
export const WHEEL_ZOOM_STEP = 1.1
/** Au-dessous de ce défilement vertical (px), un geste sans Maj est un pavé tactile, pas un cran de molette. */
const TRACKPAD_MAX_DELTA = 40
/** Pincement sur un pavé tactile : sensibilité du zoom (facteur = exp(−delta × sensibilité)). */
const PINCH_SENSITIVITY = 0.01
/** Limites du facteur de zoom d'un seul événement (évite un saut brutal). */
const MAX_PINCH_FACTOR = 1.5

export interface WheelInput {
  deltaX: number
  deltaY: number
  /** 0 = pixels (souris et pavé tactile), 1 = lignes, 2 = pages. */
  deltaMode: number
  ctrlKey: boolean
  shiftKey: boolean
}

export type WheelAction =
  | { kind: 'zoom'; factor: number }
  | { kind: 'pan'; dx: number; dy: number }

/**
 * Ce que fait un événement de molette :
 * - Ctrl (ou pincement sur un pavé tactile) : zoom continu ;
 * - Maj : déplacement horizontal (molette de souris) ;
 * - glissement à deux doigts sur un pavé tactile (petits déplacements en pixels, ou horizontal) :
 *   déplacement de la vue dans les deux sens ;
 * - sinon, un cran de molette de souris : zoom de 10 %, vers le curseur.
 */
export function wheelAction(input: WheelInput): WheelAction | null {
  const { deltaX, deltaY, deltaMode, ctrlKey, shiftKey } = input
  if (deltaX === 0 && deltaY === 0) return null

  if (ctrlKey) {
    const factor = Math.exp(-deltaY * PINCH_SENSITIVITY)
    return {
      kind: 'zoom',
      factor: Math.min(MAX_PINCH_FACTOR, Math.max(1 / MAX_PINCH_FACTOR, factor)),
    }
  }
  if (shiftKey) {
    // Selon le système, Maj + molette arrive sur deltaX ou sur deltaY.
    const delta = deltaX !== 0 ? deltaX : deltaY
    return { kind: 'pan', dx: 0 - delta, dy: 0 }
  }
  const trackpad = deltaMode === 0 && (deltaX !== 0 || Math.abs(deltaY) < TRACKPAD_MAX_DELTA)
  // `0 - x` plutôt que `-x` : pas de zéro négatif quand un des deux axes ne bouge pas.
  if (trackpad) return { kind: 'pan', dx: 0 - deltaX, dy: 0 - deltaY }
  return { kind: 'zoom', factor: deltaY < 0 ? WHEEL_ZOOM_STEP : 1 / WHEEL_ZOOM_STEP }
}

/** Déplace la vue de (dx, dy) pixels écran. */
export function panView(view: View, dx: number, dy: number): View {
  return { ...view, x: view.x + dx, y: view.y + dy }
}

/** Vue qui place le point `target` du document au centre de la zone visible. */
export function centerViewOn(target: Point, container: Size, zoom: number, pxPerUnit: number): View {
  const scale = zoom * pxPerUnit
  return { zoom, x: container.width / 2 - target.x * scale, y: container.height / 2 - target.y * scale }
}

/** Zone du document actuellement visible (en unités du document). */
export function visibleBox(view: View, container: Size, pxPerUnit: number): Box {
  const scale = view.zoom * pxPerUnit
  return {
    x: -view.x / scale,
    y: -view.y / scale,
    width: container.width / scale,
    height: container.height / scale,
  }
}

// ---------------------------------------------------------------------------------------------
// Barres de défilement
// ---------------------------------------------------------------------------------------------

export interface ScrollMetrics {
  /** Début de la plage défilable, en pixels écran (≤ 0 : la plage commence avant le bord de la zone). */
  extentStart: number
  /** Longueur de la plage défilable, en pixels écran (≥ longueur de la zone visible). */
  extentLength: number
  /** Position du curseur sur la piste, de 0 à 1. */
  thumbStart: number
  /** Taille du curseur sur la piste, de 0 à 1 (1 = tout est visible). */
  thumbSize: number
}

/**
 * Plage défilable d'un axe : le contenu (la page) entouré d'une marge d'une demi-zone de chaque
 * côté, réuni à la zone visible. `contentStart` est la position écran du début du contenu,
 * `contentLength` sa longueur en pixels, `viewLength` la longueur de la zone visible.
 */
export function scrollMetrics(
  contentStart: number,
  contentLength: number,
  viewLength: number,
): ScrollMetrics {
  const margin = viewLength / 2
  const extentStart = Math.min(0, contentStart - margin)
  const extentEnd = Math.max(viewLength, contentStart + contentLength + margin)
  const extentLength = Math.max(1, extentEnd - extentStart)
  return {
    extentStart,
    extentLength,
    thumbStart: (0 - extentStart) / extentLength,
    thumbSize: Math.min(1, viewLength / extentLength),
  }
}

/**
 * Nouvelle position du canevas (px écran) quand on déplace le curseur de `thumbDelta` pixels sur une
 * piste de `trackLength` pixels. Les métriques sont celles prises au début du geste : elles restent
 * figées pendant le glissement, ce qui évite que le curseur ne « fuie ».
 */
export function positionAfterThumbDrag(
  startPosition: number,
  thumbDelta: number,
  trackLength: number,
  metrics: ScrollMetrics,
): number {
  if (trackLength <= 0) return startPosition
  // Le curseur va vers l'avant (droite, bas) : le contenu recule, donc la position diminue.
  return startPosition - (thumbDelta / trackLength) * metrics.extentLength
}

// ---------------------------------------------------------------------------------------------
// Mini-carte
// ---------------------------------------------------------------------------------------------

export interface MinimapLayout {
  /** Zone du document représentée : la page réunie à la zone visible. */
  world: Box
  /** Pixels de la mini-carte par unité du document. */
  scale: number
  /** Décalage pour centrer le dessin dans la mini-carte (px). */
  offsetX: number
  offsetY: number
}

/** Place la page et la zone visible dans une mini-carte de `size` pixels, avec une petite marge. */
export function minimapLayout(page: Box, visible: Box, size: Size, padding = 4): MinimapLayout {
  const world = unionBoxes([page, visible]) ?? page
  const availableWidth = Math.max(1, size.width - padding * 2)
  const availableHeight = Math.max(1, size.height - padding * 2)
  const scale = Math.min(availableWidth / world.width, availableHeight / world.height)
  return {
    world,
    scale,
    offsetX: (size.width - world.width * scale) / 2,
    offsetY: (size.height - world.height * scale) / 2,
  }
}

/** Point de la mini-carte (px) → point du document. */
export function minimapToDocument(layout: MinimapLayout, point: Point): Point {
  return {
    x: layout.world.x + (point.x - layout.offsetX) / layout.scale,
    y: layout.world.y + (point.y - layout.offsetY) / layout.scale,
  }
}

/** Rectangle du document → rectangle de la mini-carte (px). */
export function documentBoxToMinimap(layout: MinimapLayout, box: Box): Box {
  return {
    x: layout.offsetX + (box.x - layout.world.x) * layout.scale,
    y: layout.offsetY + (box.y - layout.world.y) * layout.scale,
    width: box.width * layout.scale,
    height: box.height * layout.scale,
  }
}

/** Deux doigts posés sur l'écran (px, dans la zone du canevas). */
export interface TouchPair {
  a: Point
  b: Point
}

/**
 * Déplacement et zoom à deux doigts : le zoom suit l'écart entre les doigts, et le point du document
 * qui était entre les doigts les suit (glisser les deux doigts déplace donc la vue).
 */
export function pinchView(view: View, from: TouchPair, to: TouchPair, pxPerUnit: number): View {
  const distance = (pair: TouchPair) => Math.hypot(pair.a.x - pair.b.x, pair.a.y - pair.b.y)
  const before = distance(from)
  const middle = (pair: TouchPair): Point => ({ x: (pair.a.x + pair.b.x) / 2, y: (pair.a.y + pair.b.y) / 2 })
  // Doigts confondus : pas de rapport de zoom exploitable, on ne fait que déplacer.
  const ratio = before < 1 ? 1 : distance(to) / before
  const zoom = clampZoom(view.zoom * ratio)
  const anchor = screenToDocument(middle(from), view, pxPerUnit)
  const scale = zoom * pxPerUnit
  const end = middle(to)
  return { zoom, x: end.x - anchor.x * scale, y: end.y - anchor.y * scale }
}

/**
 * Vue qui centre `box` dans la zone visible et la cadre avec une marge, sans dépasser `maxZoom`
 * (une petite zone, comme une porte, n'est pas agrandie à l'extrême).
 */
export function fitBoxView(
  box: Box,
  container: Size,
  pxPerUnit: number,
  padding: number = 160,
  maxZoom: number = 2,
): View {
  const width = Math.max(box.width, 1)
  const height = Math.max(box.height, 1)
  const zoom = clampZoom(
    Math.min(
      maxZoom,
      (container.width - padding * 2) / (width * pxPerUnit),
      (container.height - padding * 2) / (height * pxPerUnit),
    ),
  )
  const scale = zoom * pxPerUnit
  return {
    zoom,
    x: container.width / 2 - (box.x + width / 2) * scale,
    y: container.height / 2 - (box.y + height / 2) * scale,
  }
}
