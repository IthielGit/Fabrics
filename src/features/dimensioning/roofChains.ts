import { DEFAULT_FACADE_OPTIONS, type FacadeChainOptions, type Side } from './facadeChains'
import type { AutoDimension } from './types'

type Pt = [number, number]

/**
 * Cotes extérieures du plan de toiture (M20 20.1b, référence Villa ROOMIT page 7), en mm : de chaque
 * côté, une chaîne qui suit les redents du contour (graduations aux extrémités des bords tournés vers
 * ce côté), puis la cote d'ensemble. Ex. ROOMIT, en haut : `4500 · 7780 · 2790`, puis `15070`.
 * Même écarts entre chaînes que les façades des plans de niveau (`facadeChains`).
 */
export function roofChains(
  outlines: readonly { outer: readonly Pt[]; holes: readonly (readonly Pt[])[] }[],
  options: FacadeChainOptions = DEFAULT_FACADE_OPTIONS,
): AutoDimension[] {
  const rings = outlines.flatMap((o) => [o.outer, ...o.holes]).map(closedFree)
  const all = rings.flat()
  if (all.length === 0) return []
  const box = {
    minX: Math.min(...all.map((p) => p[0])),
    maxX: Math.max(...all.map((p) => p[0])),
    minY: Math.min(...all.map((p) => p[1])),
    maxY: Math.max(...all.map((p) => p[1])),
  }
  const inside = (x: number, y: number) => outlines.some((o) => inRing(o.outer, x, y) && !o.holes.some((h) => inRing(h, x, y)))
  const normals: Record<Side, Pt> = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }
  const ticks: Record<Side, number[]> = { top: [], bottom: [], left: [], right: [] }
  const eps = 1
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]
      const b = ring[(i + 1) % ring.length]
      const mx = (a[0] + b[0]) / 2
      const my = (a[1] + b[1]) / 2
      for (const side of Object.keys(normals) as Side[]) {
        const [nx, ny] = normals[side]
        const along = nx === 0 ? Math.abs(b[1] - a[1]) < 0.5 : Math.abs(b[0] - a[0]) < 0.5
        if (!along) continue
        // Bord tourné vers ce côté : la matière est derrière lui, le vide devant.
        if (inside(mx - nx * eps, my - ny * eps) && !inside(mx + nx * eps, my + ny * eps)) {
          ticks[side].push(...(nx === 0 ? [a[0], b[0]] : [a[1], b[1]]))
        }
      }
    }
  }
  // Signe du décalage vers l'extérieur (comme `outerBoxDimensions` : haut, droite négatifs).
  const outward: Record<Side, number> = { top: -1, right: -1, bottom: 1, left: 1 }
  const edge: Record<Side, number> = { top: box.minY, right: box.maxX, bottom: box.maxY, left: box.minX }
  const range: Record<Side, [number, number]> = {
    top: [box.minX, box.maxX],
    bottom: [box.minX, box.maxX],
    left: [box.minY, box.maxY],
    right: [box.minY, box.maxY],
  }
  const result: AutoDimension[] = []
  for (const side of ['top', 'right', 'bottom', 'left'] as Side[]) {
    const horizontal = side === 'top' || side === 'bottom'
    const at = (u0: number, u1: number): [number, number, number, number] => (horizontal ? [u0, edge[side], u1, edge[side]] : [edge[side], u0, edge[side], u1])
    const list = merge([...range[side], ...ticks[side]])
    let distance = options.gap
    if (list.length > 2) {
      for (let k = 0; k + 1 < list.length; k++) {
        result.push({ id: `roof-${side}-${k}`, points: at(list[k], list[k + 1]), offset: outward[side] * distance, chainIndex: k })
      }
      distance += options.step
    }
    result.push({ id: `roof-${side}-total`, points: at(range[side][0], range[side][1]), offset: outward[side] * distance })
  }
  return result
}

function closedFree(ring: readonly Pt[]): Pt[] {
  const n = ring.length
  return n > 1 && ring[0][0] === ring[n - 1][0] && ring[0][1] === ring[n - 1][1] ? ring.slice(0, -1) : [...ring]
}

/** Graduations triées, celles à moins de 1 mm l'une de l'autre confondues. */
function merge(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.filter((v, i) => i === 0 || v - sorted[i - 1] >= 1)
}

function inRing(ring: readonly Pt[], x: number, y: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}
