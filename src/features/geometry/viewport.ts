export interface View {
  zoom: number // 1 = 100 %
  x: number // position du canevas dans la fenêtre (px écran)
  y: number
}

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export const MIN_ZOOM = 0.02
export const MAX_ZOOM = 16
export const FIT_PADDING = 48 // px de marge autour de la page

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

/** Convertit un point de l'écran (px) en coordonnées du document. */
export function screenToDocument(point: Point, view: View, pxPerUnit: number): Point {
  const scale = view.zoom * pxPerUnit
  return { x: (point.x - view.x) / scale, y: (point.y - view.y) / scale }
}

/** Change le zoom en gardant fixe le point du document situé sous le curseur. */
export function zoomAtPoint(view: View, pointer: Point, newZoom: number, pxPerUnit: number): View {
  const zoom = clampZoom(newZoom)
  const anchor = screenToDocument(pointer, view, pxPerUnit)
  const scale = zoom * pxPerUnit
  return { zoom, x: pointer.x - anchor.x * scale, y: pointer.y - anchor.y * scale }
}

/** Zoom et position pour afficher toute la page, centrée, dans la zone visible. */
export function fitToScreen(
  page: Size,
  container: Size,
  pxPerUnit: number,
  padding: number = FIT_PADDING,
): View {
  const availableWidth = Math.max(1, container.width - padding * 2)
  const availableHeight = Math.max(1, container.height - padding * 2)
  const zoom = clampZoom(
    Math.min(availableWidth / (page.width * pxPerUnit), availableHeight / (page.height * pxPerUnit)),
  )
  const scale = zoom * pxPerUnit
  return {
    zoom,
    x: (container.width - page.width * scale) / 2,
    y: (container.height - page.height * scale) / 2,
  }
}
