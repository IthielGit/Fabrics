/**
 * Toitures et escaliers des plans Fabrics ↔ nœuds natifs de Pascal (M19 B6) : visibles et modifiables
 * dans la 3D de Pascal, et toujours métrés par les règles validées de Fabrics.
 *
 * Aller : un élément devient un nœud `roof` (+ un `roof-segment`) ou `stair` (+ ses `stair-segment`) ;
 * l'élément d'origine est gardé dans `metadata.fabrics.element` (longueurs en m).
 * Retour : l'élément est recalculé depuis la géométrie de Pascal ; s'il n'a pas bougé (à 0,001 mm
 * près), l'élément d'origine est rendu tel quel (métrés de référence identiques) ; sinon les nouvelles
 * cotes sont prises. Une forme que Fabrics ne sait pas représenter (mansarde, pan découpé, escalier
 * hélicoïdal…) donne `null` : ses quantités viennent alors de `view/pascalQuantities.ts`.
 */
import { getRoofSegmentDeckReach, RoofNode, RoofSegmentNode, StairNode, StairSegmentNode } from '@pascal-app/core'
import type { RoofElement, StairElement } from '../../../types/document'
import { isRoofRectangle, MAX_PITCH, MIN_PITCH } from '../../building/roof'
import { riserCount, stairLayout, stairToWorld } from '../../stairs/stairs'
import type { FabricsNodeMeta, SceneNodeData } from '../sceneTypes'
import { mmToM, mToMm } from '../units'
import { roundMm } from './geometry'
import { LENGTH_FIELDS, lengthsToMetres, lengthsToMillimetres } from './lengthFields'
import { levelNodeOf } from '../sceneLevels'

type Vec2 = [number, number]
const TOLERANCE_MM = 1e-3

export interface RoofStairMeta extends FabricsNodeMeta {
  /** Élément Fabrics d'origine (sans id, nom, masqué), longueurs en m. */
  element: Record<string, unknown>
  /** Toiture : signe (x, z) de chaque sommet d'origine dans le repère du pan. */
  corners?: Vec2[]
  /** Toiture : côté du contour parallèle au faîtage de Pascal. */
  ridgeSide?: number
}

const metaOf = (node: SceneNodeData | undefined) => node?.metadata?.fabrics as RoofStairMeta | undefined

/** Rotation de Pascal (autour de y) : point local (x, z) → plan. */
function turn(x: number, z: number, yaw: number): Vec2 {
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  return [c * x + s * z, -s * x + c * z]
}

const close = (a: number | undefined, b: number | undefined, tolerance = TOLERANCE_MM) =>
  a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tolerance)

/** Élément d'origine en mm, avec l'identité courante du nœud. */
function storedElement<T>(node: SceneNodeData, meta: RoofStairMeta, type: 'roof' | 'stair'): T {
  return { ...lengthsToMillimetres(meta.element, LENGTH_FIELDS[type]), id: meta.id, name: node.name ?? '', hidden: node.visible === false } as T
}

// ---------------------------------------------------------------------------------------------
// Toitures
// ---------------------------------------------------------------------------------------------

/** Rectangle (et pente valable pour un toit en pente) : sinon la toiture reste un nœud Fabrics. */
export function canConvertRoof(el: RoofElement): boolean {
  if (!isRoofRectangle(el.points)) return false
  return el.shape === 'flat' || (el.pitch >= MIN_PITCH && el.pitch <= MAX_PITCH)
}

export function roofToPascal(
  el: RoofElement,
  place: { parentId: string; levelHeight: number },
  meta: FabricsNodeMeta,
): SceneNodeData[] {
  const p: Vec2[] = []
  for (let i = 0; i + 1 < el.points.length; i += 2) p.push([mmToM(el.points[i]), mmToM(el.points[i + 1])])
  const len = (a: Vec2, b: Vec2) => Math.hypot(b[0] - a[0], b[1] - a[1])
  // Côté du faîtage : celui de Fabrics ; croupe et plat : le grand côté (règle de `building/roof.ts`).
  const side = el.shape === 'hip' || el.shape === 'flat' ? (len(p[0], p[1]) >= len(p[1], p[2]) ? 0 : 1) : ((Math.round(el.ridgeEdge) % 4) + 4) % 4
  const a = p[side]
  const b = p[(side + 1) % 4]
  const width = len(a, b)
  const depth = len(b, p[(side + 2) % 4])
  const center: Vec2 = [(p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4]
  let yaw = Math.atan2(-(b[1] - a[1]) / width, (b[0] - a[0]) / width)
  const toLocal = (q: Vec2) => turn(q[0] - center[0], q[1] - center[1], -yaw)
  // Un pan : le côté haut de Fabrics doit être en z négatif (côté haut de Pascal).
  if (el.shape === 'shed' && toLocal([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2])[1] > 0) yaw += Math.PI
  const corners = p.map((q) => toLocal(q).map((v) => (v >= 0 ? 1 : -1)) as Vec2)
  const d = mmToM(Math.max(0, el.overhang))
  const cos = el.shape === 'flat' ? 1 : Math.cos((el.pitch * Math.PI) / 180)
  const roofId = `roof_${el.id}`
  const segment = RoofSegmentNode.parse({
    id: `rseg_${el.id}`,
    parentId: roofId,
    roofType: el.shape,
    width,
    depth,
    pitch: Math.min(Math.max(el.pitch, 0), MAX_PITCH),
    overhang: d / cos,
    gableOverhang: d,
    wallThickness: 0,
    wallHeight: 0,
  })
  const { id, name, hidden, ...rest } = el
  void id
  void name
  void hidden
  const roof = RoofNode.parse({
    id: roofId,
    parentId: place.parentId,
    name: el.name,
    visible: !el.hidden,
    position: [center[0], place.levelHeight, center[1]],
    rotation: yaw,
    children: [segment.id],
    metadata: { fabrics: { ...meta, element: lengthsToMetres(rest, LENGTH_FIELDS.roof), corners, ridgeSide: side } },
  })
  return [roof as unknown as SceneNodeData, segment as unknown as SceneNodeData]
}

const FABRICS_ROOF_SHAPES = new Set(['flat', 'shed', 'gable', 'hip'])

/** Toiture convertie → élément Fabrics ; `null` si ce n'en est pas une, ou si Fabrics ne sait pas la représenter. */
export function roofFromPascal(roof: SceneNodeData, nodes: Readonly<Record<string, SceneNodeData>>): RoofElement | null {
  const meta = metaOf(roof)
  if (!meta?.element || !meta.corners) return null
  const segments = (roof.children ?? []).map((id) => nodes[id]).filter((n) => n?.type === 'roof-segment')
  if (segments.length !== 1) return null
  const seg = segments[0]
  const shape = seg.roofType as RoofElement['shape']
  if (!FABRICS_ROOF_SHAPES.has(shape)) return null
  const trim = seg.trim as Record<string, unknown> | undefined
  if (trim && Object.values(trim).some((v) => typeof v === 'number' && v > 1e-6)) return null
  const reach = getRoofSegmentDeckReach(seg as never)
  if (Math.abs(reach.x - reach.z) > 1e-6) return null // débord différent aux bouts : pas un débord Fabrics
  const halfW = (seg.width as number) / 2
  const halfD = (seg.depth as number) / 2
  const segPos = (seg.position as [number, number, number] | undefined) ?? [0, 0, 0]
  const segYaw = (seg.rotation as number | undefined) ?? 0
  const roofPos = roof.position as [number, number, number]
  const roofYaw = (roof.rotation as number | undefined) ?? 0
  const points = meta.corners.flatMap(([sx, sz]) => {
    const [rx, rz] = turn(sx * halfW, sz * halfD, segYaw)
    const [wx, wz] = turn(segPos[0] + rx, segPos[2] + rz, roofYaw)
    return [roundMm(mToMm(roofPos[0] + wx)), roundMm(mToMm(roofPos[2] + wz))]
  })
  const stored = storedElement<RoofElement>(roof, meta, 'roof')
  const pitch = shape === 'flat' ? stored.pitch : (seg.pitch as number)
  const overhang = roundMm(mToMm(reach.z))
  const unchanged =
    shape === stored.shape &&
    close(pitch, stored.pitch, 1e-9) &&
    close(overhang, stored.overhang) &&
    points.every((v, i) => close(v, stored.points[i]))
  if (unchanged) return stored
  return {
    ...stored,
    shape,
    points,
    pitch,
    overhang,
    ridgeEdge: shape === stored.shape ? stored.ridgeEdge : (meta.ridgeSide ?? 0),
  }
}

// ---------------------------------------------------------------------------------------------
// Escaliers
// ---------------------------------------------------------------------------------------------

/** Point de départ de la première volée dans le repère local de l'escalier (avant retournement). */
function startLocal(el: Pick<StairElement, 'shape' | 'width' | 'length'>) {
  return { x: el.width / 2, y: el.shape === 'straight' ? el.length : el.width + el.length }
}

/**
 * Escalier → nœud `stair` de Pascal et sa chaîne de volées et de paliers (repère de Pascal : volée
 * montant vers +z, x vers la gauche de la montée). Droit : une volée. L : volée, palier, volée tournée.
 * U : volée, palier, palier du jour central (s'il y en a un), palier, volée revenant.
 */
export function stairToPascal(
  el: StairElement,
  place: { parentId: string; rise: number },
  meta: FabricsNodeMeta,
): SceneNodeData[] {
  const risers = Math.max(1, riserCount(place.rise))
  const layout = stairLayout(el, risers - 1)
  const r1 = el.shape === 'straight' ? risers : Math.min(risers, layout.flights[0].treads + 1)
  const r2 = Math.max(0, risers - r1)
  const rise = mmToM(Math.max(0, place.rise))
  const side = el.mirrored ? 'left' : 'right'
  const w = mmToM(el.width)
  const stairId = `stair_${el.id}`
  let rank = 0
  const segment = (data: Record<string, unknown>) =>
    StairSegmentNode.parse({ id: `sseg_${el.id}__${rank++}`, parentId: stairId, width: w, ...data }) as unknown as SceneNodeData
  const flight1 = segment({ segmentType: 'stair', length: mmToM(el.length), height: (rise * r1) / risers, stepCount: r1 })
  const landing = (length: number, attachmentSide: string) =>
    segment({ segmentType: 'landing', length, height: 0, stepCount: 1, attachmentSide })
  const flight2 = () =>
    segment({ segmentType: 'stair', length: mmToM(el.length2 ?? 0), height: (rise * r2) / risers, stepCount: Math.max(1, r2), attachmentSide: side })
  const segments: SceneNodeData[] = [flight1]
  if (el.shape === 'l') segments.push(landing(w, 'front'), flight2())
  if (el.shape === 'u') {
    const gap = mmToM(el.gap ?? 0)
    segments.push(landing(w, 'front'))
    if (gap > 1e-9) segments.push(landing(gap, side), landing(w, 'front'))
    else segments.push(landing(w, side))
    segments.push(flight2())
  }
  const start = stairToWorld(el, startLocal(el))
  const { id, name, hidden, ...rest } = el
  void id
  void name
  void hidden
  const stair = StairNode.parse({
    id: stairId,
    parentId: place.parentId,
    name: el.name,
    visible: !el.hidden,
    position: [mmToM(start.x), 0, mmToM(start.y)],
    rotation: Math.PI - (el.rotation * Math.PI) / 180,
    stairType: 'straight',
    width: w,
    stepCount: risers,
    children: segments.map((s) => s.id),
    metadata: { fabrics: { ...meta, element: lengthsToMetres(rest, LENGTH_FIELDS.stair) } },
  })
  return [stair as unknown as SceneNodeData, ...segments]
}

/** Escalier converti → élément Fabrics ; `null` si ce n'en est pas un, ou si sa chaîne n'est pas droite, en L ou en U. */
export function stairFromPascal(stair: SceneNodeData, nodes: Readonly<Record<string, SceneNodeData>>): StairElement | null {
  const meta = metaOf(stair)
  if (!meta?.element || (stair.stairType ?? 'straight') !== 'straight') return null
  const segs = (stair.children ?? []).map((id) => nodes[id]).filter((n) => n?.type === 'stair-segment')
  const kind = segs.map((s) => ((s.segmentType ?? 'stair') === 'landing' ? 'L' : 'F')).join('')
  const att = segs.map((s) => (s.attachmentSide as string | undefined) ?? 'front')
  const stored = storedElement<StairElement>(stair, meta, 'stair')
  let shape: StairElement['shape']
  let gap = 0
  let mirrored = false
  if (kind === 'F') shape = 'straight'
  else if (kind === 'FLF' && att[1] === 'front' && att[2] !== 'front') {
    shape = 'l'
    mirrored = att[2] === 'left'
  } else if (kind === 'FLLF' && att[1] === 'front' && att[2] !== 'front' && att[3] === att[2]) {
    shape = 'u'
    mirrored = att[2] === 'left'
  } else if (kind === 'FLLLF' && att[1] === 'front' && att[2] !== 'front' && att[3] === 'front' && att[4] === att[2]) {
    shape = 'u'
    mirrored = att[2] === 'left'
    gap = roundMm(mToMm(segs[2].length as number))
  } else return null

  const first = segs[0]
  const last = segs[segs.length - 1]
  const width = roundMm(mToMm(first.width as number))
  const length = roundMm(mToMm(first.length as number))
  const degrees = ((((Math.PI - ((stair.rotation as number | undefined) ?? 0)) * 180) / Math.PI) % 360 + 540) % 360 - 180
  const rotation = Math.round(degrees * 1e6) / 1e6
  const geometry = {
    shape,
    width,
    length,
    ...(shape === 'straight' ? {} : { length2: roundMm(mToMm(last.length as number)), mirrored }),
    ...(shape === 'u' ? { gap } : {}),
  }
  const position = stair.position as [number, number, number]
  const origin = stairToWorld({ ...stored, ...geometry, x: 0, y: 0, rotation }, startLocal({ ...stored, ...geometry }))
  const x = roundMm(mToMm(position[0]) - origin.x)
  const y = roundMm(mToMm(position[2]) - origin.y)
  const sameRotation = Math.abs(((((rotation - stored.rotation) % 360) + 540) % 360) - 180) <= 1e-6
  const unchanged =
    shape === stored.shape &&
    close(width, stored.width) &&
    close(length, stored.length) &&
    (shape === 'straight' || (close(geometry.length2, stored.length2) && mirrored === Boolean(stored.mirrored))) &&
    (shape !== 'u' || close(gap, stored.gap ?? 0)) &&
    sameRotation &&
    close(x, stored.x) &&
    close(y, stored.y)
  if (unchanged) return stored
  return { ...stored, ...geometry, rotation, x, y }
}

// ---------------------------------------------------------------------------------------------
// Plans enregistrés avant B6 : nœuds `fabrics:roof` / `fabrics:stair` → nœuds de Pascal
// ---------------------------------------------------------------------------------------------

/** Altitude (mm), hauteur (mm) et niveau du dessus de chaque niveau de la scène, comme la vue Fabrics. */
function levelStack(nodes: Readonly<Record<string, SceneNodeData>>) {
  const levels = Object.values(nodes)
    .filter((n) => n.type === 'level')
    .sort((a, b) => ((a.level as number | undefined) ?? 0) - ((b.level as number | undefined) ?? 0))
  const out = new Map<string, { elevation: number; height: number; above?: number }>()
  let top: number | null = null
  let previous: string | null = null
  for (const level of levels) {
    const height = mToMm((level.height as number | undefined) ?? 2.5)
    const base = mToMm((level.baseElevation as number | undefined) ?? 0)
    const elevation: number = top === null ? base : top + base
    top = elevation + height
    out.set(level.id, { elevation, height })
    if (previous) out.get(previous)!.above = elevation
    previous = level.id
  }
  return out
}

/**
 * Toitures (rectangulaires) et escaliers d'un plan enregistré avant B6 remplacés par des nœuds de
 * Pascal, à la même place dans l'arbre ; rien d'autre ne change. Même scène si rien à convertir.
 */
export function upgradeLegacyRoofsAndStairs(scene: { nodes: Record<string, SceneNodeData>; rootNodeIds: string[] }) {
  const legacy = Object.values(scene.nodes).filter((n) => n.type === 'fabrics:roof' || n.type === 'fabrics:stair')
  if (legacy.length === 0) return scene
  const nodes = { ...scene.nodes }
  const stack = levelStack(nodes)
  for (const old of legacy) {
    const meta = old.metadata?.fabrics as FabricsNodeMeta | undefined
    if (!meta || !old.parentId) continue
    const type = old.type === 'fabrics:roof' ? 'roof' : 'stair'
    const element = {
      ...lengthsToMillimetres((old.element as Record<string, unknown>) ?? {}, LENGTH_FIELDS[type]),
      id: meta.id,
      name: old.name ?? '',
      hidden: old.visible === false,
    } as unknown as RoofElement & StairElement
    const level = levelNodeOf(old, nodes)
    const info = level ? stack.get(level.id) : undefined
    let created: SceneNodeData[]
    if (type === 'roof') {
      if (!canConvertRoof(element)) continue
      created = roofToPascal(element, { parentId: old.parentId, levelHeight: mmToM(info?.height ?? 0) }, meta)
    } else {
      const rise = info ? (info.above !== undefined ? info.above - info.elevation : info.height) : 2700
      created = stairToPascal(element, { parentId: old.parentId, rise }, meta)
    }
    delete nodes[old.id]
    for (const node of created) nodes[node.id] = node
    const parent = nodes[old.parentId]
    nodes[old.parentId] = {
      ...parent,
      children: (parent.children ?? []).map((id) => (id === old.id ? created[0].id : id)),
    }
  }
  return { nodes, rootNodeIds: scene.rootNodeIds }
}
