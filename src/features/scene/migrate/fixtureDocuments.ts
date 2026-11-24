/**
 * Plans des jeux de tests de référence HOUSE-01 et HOUSE-02, construits à partir de
 * `fixtures/<jeu>/spec.json` (M18). Partagés par les tests des métrés et de l'échange IFC (M21).
 * Les coordonnées des fixtures ont l'axe y vers le nord ; Fabrics a l'axe y vers le bas de l'écran
 * (sans effet sur les surfaces, longueurs et périmètres).
 */
import type { CanvasElement, FabricsDocument, Level } from '../../../types/document'

const SPECS = import.meta.glob<Record<string, unknown>>('../../../../fixtures/*/spec.json', { eager: true, import: 'default' })
type Spec = any // JSON de spécification, lu tel quel (forme documentée dans le fichier lui-même)
export function spec(id: string): Spec {
  return SPECS[`../../../../fixtures/${id}/spec.json`]
}

export const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }


/** Position d'une ouverture de fixture sur la polyligne de son mur : rang du côté et distance au
 * centre depuis le début de ce côté. `side` = sud / nord (y min / max) ou ouest / est (x min / max). */
function placeOnWall(axis: number[], o: { side?: string; centerX?: number; centerY?: number }) {
  const xs = axis.filter((_, i) => i % 2 === 0)
  const ys = axis.filter((_, i) => i % 2 === 1)
  const target =
    o.side === 'sud' ? [o.centerX!, Math.min(...ys)]
    : o.side === 'nord' ? [o.centerX!, Math.max(...ys)]
    : o.side === 'ouest' ? [Math.min(...xs), o.centerY!]
    : o.side === 'est' ? [Math.max(...xs), o.centerY!]
    : [o.centerX ?? xs[0], ys[0]]
  for (let i = 0; i + 3 < axis.length; i += 2) {
    const [x1, y1, x2, y2] = axis.slice(i, i + 4)
    const onX = Math.min(x1, x2) <= target[0] && target[0] <= Math.max(x1, x2)
    const onY = Math.min(y1, y2) <= target[1] && target[1] <= Math.max(y1, y2)
    const collinear = (x2 - x1) * (target[1] - y1) - (y2 - y1) * (target[0] - x1) === 0
    if (onX && onY && collinear) return { segmentIndex: i / 2, offset: Math.hypot(target[0] - x1, target[1] - y1) }
  }
  throw new Error(`ouverture hors de son mur : ${JSON.stringify(o)}`)
}

/** Murs, ouvertures et pièces de HOUSE-01 sur un niveau. */
function houseElements(s: Spec, levelId: string, prefix: string): CanvasElement[] {
  const walls = new Map<string, number[]>()
  const out: CanvasElement[] = []
  for (const w of s.walls) {
    walls.set(w.ref, w.axis)
    out.push({ ...BASE, id: `${prefix}${w.ref}`, levelId, type: 'wall', name: w.ref, points: w.axis, thickness: w.thickness, height: w.height, fill: '#ccc' })
  }
  for (const o of s.openings) out.push(opening(o, walls, levelId, prefix))
  s.rooms.forEach((r: { name: string; polygon: number[] }, i: number) =>
    out.push({ ...BASE, id: `${prefix}room${i}`, levelId, type: 'room', name: r.name, points: r.polygon, fill: '#eef', showLabel: true }),
  )
  return out
}

function opening(o: Spec, walls: Map<string, number[]>, levelId: string, prefix: string): CanvasElement {
  const { segmentIndex, offset } = placeOnWall(walls.get(o.wall)!, o)
  return {
    ...BASE, id: `${prefix}${o.ref ?? 'through'}`, levelId, type: 'opening', name: o.ref ?? 'B', kind: o.kind, ...(o.style ? { style: o.style } : {}),
    wallId: `${prefix}${o.wall}`, segmentIndex, offset, width: o.width, height: o.height, sillHeight: o.sillHeight, hinge: 'start', side: 'left',
  }
}

export function planDocument(levels: Level[], elements: CanvasElement[]): FabricsDocument {
  return { version: 4, unit: 'mm', page: { width: 42000, height: 29700, background: '#ffffff' }, levels, elements }
}

export function house01(): FabricsDocument {
  const s = spec('HOUSE-01')
  return planDocument([{ id: 'L0', ...s.level }], houseElements(s, 'L0', ''))
}

export function house02(): FabricsDocument {
  const s = spec('HOUSE-02')
  const h1 = spec('HOUSE-01')
  const levels: Level[] = s.levels.map((l: Omit<Level, 'id'>, i: number) => ({ id: `L${i}`, ...l }))
  const [rdc, etage] = levels
  const elements = [...houseElements(h1, rdc.id, 'r-'), ...houseElements(h1, etage.id, 'e-')]
  const walls = new Map<string, number[]>(h1.walls.map((w: { ref: string; axis: number[] }) => [w.ref, w.axis]))
  elements.push(opening(s.throughOpening, walls, etage.id, 'e-'))
  elements.push({ ...BASE, id: 'stair', levelId: rdc.id, type: 'stair', name: 'Escalier', x: 300, y: 600, shape: 'straight', width: s.stair.width, length: s.stair.length, voidMargin: s.stair.voidMargin })
  elements.push({ ...BASE, id: 'roof', levelId: etage.id, type: 'roof', name: 'Toiture', points: s.roof.outline, shape: s.roof.shape, pitch: s.roof.pitch, overhang: s.roof.overhang, ridgeEdge: 1 })
  for (const sec of s.sections) elements.push({ ...BASE, id: `section-${sec.label}`, type: 'section', name: sec.label, points: sec.points, label: sec.label, lookLeft: false })
  return planDocument(levels, elements)
}
