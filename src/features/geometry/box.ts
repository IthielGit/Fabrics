import type { Point } from './viewport'

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Rectangle défini par deux coins opposés, quel que soit le sens du tracé. */
export function normalizeBox(a: Point, b: Point): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  }
}

/** Distance entre deux points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Plus petite boîte contenant tous les points donnés (`null` si la liste est vide). */
export function boxOfPoints(points: readonly Point[]): Box | null {
  if (points.length === 0) return null
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

/** Plus petite boîte contenant toutes les boîtes données (`null` si la liste est vide). */
export function unionBoxes(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null
  const left = Math.min(...boxes.map((b) => b.x))
  const top = Math.min(...boxes.map((b) => b.y))
  const right = Math.max(...boxes.map((b) => b.x + b.width))
  const bottom = Math.max(...boxes.map((b) => b.y + b.height))
  return { x: left, y: top, width: right - left, height: bottom - top }
}

export function translateBox(box: Box, dx: number, dy: number): Box {
  return { ...box, x: box.x + dx, y: box.y + dy }
}

/** Vrai si deux boîtes se touchent ou se chevauchent. */
export function boxesIntersect(a: Box, b: Box): boolean {
  return (
    a.x <= b.x + b.width &&
    b.x <= a.x + a.width &&
    a.y <= b.y + b.height &&
    b.y <= a.y + a.height
  )
}
