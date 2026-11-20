/**
 * Scène Pascal (m) → vue `FabricsDocument` (mm) pour l'éditeur actuel (ADR 0004). Fonction pure.
 *
 * Inverse exact de `fabricsToScene` : un plan converti puis relu redonne le même document, au
 * millionième de mm près. La vue n'est jamais enregistrée : la scène reste la seule source.
 */
import type {
  CanvasElement,
  FabricsDocument,
  Level,
  OpeningElement,
  PlanSettings,
  WallElement,
  WallLayer,
} from '../../../types/document'
import { dimensionOffset, furnitureCorner, roundMm } from '../migrate/geometry'
import { LENGTH_FIELDS, lengthsToMillimetres } from '../migrate/lengthFields'
import { FABRICS_NODE_PREFIX } from '../nodes/fabricsNodes'
import { roofFromPascal, stairFromPascal } from '../migrate/roofStairNodes'
import { pascalQuantitiesOf } from './pascalQuantities'
import { roomClearOutlines } from './roomClearFloor'
import { BUILDING_ID, type FabricsNodeMeta, type PlanScene, type SceneNodeData } from '../sceneTypes'
import { mToMm, pascalRotationToDegrees, planPointsToFlat } from '../units'

type Vec2 = [number, number]
type Vec3 = [number, number, number]

const FABRICS_KINDS = new Set(Object.keys(FABRICS_NODE_PREFIX))

function metaOf(node: SceneNodeData | undefined): FabricsNodeMeta | undefined {
  return node?.metadata?.fabrics as FabricsNodeMeta | undefined
}

/**
 * Nœuds natifs de Pascal (dessinés avec ses outils, M19 B2) lus comme éléments Fabrics : murs, portes,
 * fenêtres et pièces. Sans `metadata.fabrics`, ils prennent l'identifiant du nœud et se rangent après
 * les éléments venus de Fabrics, dans l'ordre de la scène. Toitures, escaliers, dalles… natifs : pas
 * encore lus (voir `docs/phases/M19-report.md`).
 */
export function isNativeElementNode(node: SceneNodeData): boolean {
  if (metaOf(node)) return false
  if (node.type === 'wall' || node.type === 'door' || node.type === 'window') return true
  return node.type === 'zone' && node.spaceRole === 'room'
}

/**
 * Noms par défaut que Pascal écrit en anglais dans son code (« Wall 1 », « Door 2 »…). Pour un nœud
 * natif, ils sont laissés vides : les noms automatiques de Fabrics (« Mur 1 ») les remplacent.
 */
const PASCAL_DEFAULT_NAME = /^(Wall|Door|Window|Room|Zone|Level) \d+$/

export function nativeElementName(node: SceneNodeData): string {
  const name = node.name ?? ''
  return PASCAL_DEFAULT_NAME.test(name) ? '' : name
}

/** Couches du corps d'un mur (composition de Pascal, m) en mm ; rien si le mur n'a pas de composition. */
function wallLayersOf(node: SceneNodeData): { layers?: WallLayer[] } {
  const assembly = node.assembly as { layers?: { id: string; role: string; material?: string; thickness: number }[] } | undefined
  if (!assembly?.layers?.length) return {}
  return {
    layers: assembly.layers.map((layer) =>
      defined({ id: layer.id, role: layer.role, material: layer.material, thickness: mToMm(layer.thickness) }) as WallLayer,
    ),
  }
}

/** Rang des éléments natifs : après tous ceux de Fabrics (dont le rang est leur place dans le plan). */
const NATIVE_ORDER_BASE = 1_000_000

/** Couleurs par défaut d'un mur et d'une pièce dessinés dans Pascal (celles des outils de Fabrics). */
const NATIVE_WALL_FILL = '#475569'
const NATIVE_ROOM_PROPS = { fill: 'rgba(99, 102, 241, 0.18)', showLabel: true }

/** Épaisseur et hauteur par défaut d'un mur de Pascal (m), comme son panneau. */
const PASCAL_WALL_THICKNESS = 0.1
const PASCAL_LEVEL_HEIGHT = 2.5
const NATIVE_SLAB_THICKNESS_MM = 200

/** Copie sans les clés `undefined`. */
function defined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}

export function sceneToFabricsView(scene: PlanScene): FabricsDocument {
  const { nodes } = scene
  const building = nodes[BUILDING_ID]
  const settings = (building?.metadata?.fabrics ?? {}) as {
    version: 4
    unit: 'px' | 'mm'
    page: { width: number; height: number; background: string }
    plan?: PlanSettings
    levelsAbsent?: true
  }

  // --- Niveaux ---
  // Un niveau ajouté dans Pascal (sans `metadata.fabrics`) se place selon son numéro de niveau.
  const levelNodes = Object.values(nodes)
    .filter((n) => n.type === 'level' && !(metaOf(n) as { synthetic?: boolean } | undefined)?.synthetic)
    .sort((a, b) => {
      const ma = metaOf(a)
      const mb = metaOf(b)
      if (ma && mb) return ma.order - mb.order
      return ((a.level as number | undefined) ?? 0) - ((b.level as number | undefined) ?? 0) || (ma ? -1 : mb ? 1 : 0)
    })
  const levels: Level[] = []
  const levelHeights = new Map<string, number>()
  let previousTop: number | null = null
  for (const node of levelNodes) {
    const meta = metaOf(node) as (FabricsNodeMeta & { slabThickness: number }) | undefined
    const height = mToMm((node.height as number | undefined) ?? PASCAL_LEVEL_HEIGHT)
    const base = mToMm((node.baseElevation as number | undefined) ?? 0)
    const elevation = roundMm(previousTop === null ? base : previousTop + base)
    previousTop = elevation + height
    const slabThickness = meta ? mToMm(meta.slabThickness) : NATIVE_SLAB_THICKNESS_MM
    levels.push({ id: meta?.id ?? node.id, name: meta ? (node.name ?? '') : nativeElementName(node), elevation, height, slabThickness })
    levelHeights.set(node.id, height)
  }

  /** Nœud de niveau ancêtre d'un nœud. */
  const levelNodeOf = (node: SceneNodeData): SceneNodeData | undefined => {
    let current: SceneNodeData | undefined = node
    while (current && current.type !== 'level') current = current.parentId ? nodes[current.parentId] : undefined
    return current
  }

  /** Niveau Fabrics d'un nœud : celui de son niveau ancêtre, sauf indication contraire. */
  const levelIdOf = (node: SceneNodeData): string | undefined => {
    const meta = metaOf(node)
    if (meta?.levelId !== undefined) return meta.levelId ?? undefined
    const level = levelNodeOf(node)
    return level ? (metaOf(level)?.id ?? level.id) : undefined
  }

  /** Propriétés Fabrics d'un nœud : les siennes, ou celles déduites d'un nœud natif de Pascal. */
  let nativeRank = 0
  const nativeMeta = (node: SceneNodeData): FabricsNodeMeta => {
    const order = NATIVE_ORDER_BASE + nativeRank++
    if (node.type === 'wall') return { id: node.id, order, segment: 0, props: { fill: NATIVE_WALL_FILL } }
    if (node.type === 'zone') return { id: node.id, order, props: { ...NATIVE_ROOM_PROPS } }
    return { id: node.id, order, props: { kind: node.type } }
  }

  /** Champs communs d'un élément. */
  const baseOf = (node: SceneNodeData, meta: FabricsNodeMeta) =>
    defined({
      id: meta.id,
      name: metaOf(node) ? (node.name ?? '') : nativeElementName(node),
      x: meta.base?.x === undefined ? 0 : mToMm(meta.base.x),
      y: meta.base?.y === undefined ? 0 : mToMm(meta.base.y),
      rotation: meta.base?.rotation ?? 0,
      opacity: meta.base?.opacity ?? 1,
      locked: meta.base?.locked ?? false,
      hidden: node.visible === false,
      levelId: levelIdOf(node),
    })

  // --- Éléments ---
  const clearOutlines = roomClearOutlines(nodes)
  const elements: { order: number; element: CanvasElement }[] = []
  const wallSegments = new Map<string, { node: SceneNodeData; meta: FabricsNodeMeta }[]>()

  for (const node of Object.values(nodes)) {
    const meta = metaOf(node) ?? (isNativeElementNode(node) ? nativeMeta(node) : undefined)
    if (!meta || node.type === 'level' || node.type === 'building' || node.type === 'site') continue
    const props = meta.props ?? {}
    const push = (element: CanvasElement) => elements.push({ order: meta.order, element })

    switch (node.type) {
      case 'wall': {
        const list = wallSegments.get(meta.id) ?? []
        list.push({ node, meta })
        wallSegments.set(meta.id, list)
        break
      }
      case 'door':
      case 'window':
        push(openingOf(node, meta))
        break
      case 'zone': {
        // Pièce fermée par des murs : son sol intérieur (modèle de Pascal) ; sinon le contour tracé.
        const outline = clearOutlines.get(node.id) ?? (node.polygon as Vec2[])
        push({ ...baseOf(node, meta), type: 'room', points: planPointsToFlat(outline), ...props } as CanvasElement)
        break
      }
      case 'item': {
        const asset = node.asset as { id: string; dimensions: Vec3 }
        const position = node.position as Vec3
        const width = mToMm(asset.dimensions[0])
        const depth = mToMm(asset.dimensions[2])
        const rotation = pascalRotationToDegrees((node.rotation as Vec3)[1])
        const [x, y] = furnitureCorner(mToMm(position[0]), mToMm(position[2]), width, depth, rotation)
        push({ ...baseOf(node, meta), x, y, rotation, type: 'furniture', symbol: asset.id, width, depth, ...props } as CanvasElement)
        break
      }
      case 'structural-grid': {
        const [x1, y1] = node.start as Vec2
        const [x2, y2] = node.end as Vec2
        push({
          ...baseOf(node, meta),
          type: 'axis',
          points: [mToMm(x1), mToMm(y1), mToMm(x2), mToMm(y2)],
          label: (props.label as string | undefined) ?? (node.label as string),
        } as CanvasElement)
        break
      }
      case 'construction-dimension': {
        const [a, b] = node.anchors as Vec3[]
        const baseline = node.baseline as { origin: Vec2; direction: Vec2 }
        const x1 = mToMm(a[0])
        const y1 = mToMm(a[2])
        const origin: Vec2 = [mToMm(baseline.origin[0]), mToMm(baseline.origin[1])]
        push({
          ...baseOf(node, meta),
          type: 'dimension',
          points: [x1, y1, mToMm(b[0]), mToMm(b[2])],
          offset: dimensionOffset(x1, y1, origin, baseline.direction),
          ...props,
        } as CanvasElement)
        break
      }
      // Toitures et escaliers convertis (M19 B6) : élément recalculé depuis la géométrie de Pascal.
      case 'roof': {
        const roof = roofFromPascal(node, nodes)
        if (roof) push({ ...roof, ...defined({ levelId: levelIdOf(node) }) } as CanvasElement)
        break
      }
      case 'stair': {
        const stair = stairFromPascal(node, nodes)
        if (stair) push({ ...stair, ...defined({ levelId: levelIdOf(node) }) } as CanvasElement)
        break
      }
      default:
        if (FABRICS_KINDS.has(node.type)) {
          const element = node.element as Record<string, unknown>
          const type = element.type as string
          push({
            ...lengthsToMillimetres(element, LENGTH_FIELDS[type] ?? []),
            id: meta.id,
            name: node.name ?? '',
            hidden: node.visible === false,
            ...defined({ levelId: levelIdOf(node) }),
          } as unknown as CanvasElement)
        }
    }
  }

  for (const [, segments] of wallSegments) {
    segments.sort((a, b) => (a.meta.segment ?? 0) - (b.meta.segment ?? 0))
    const { node: first, meta } = segments[0]
    const start = first.start as Vec2
    const points = meta.degenerate
      ? [mToMm(start[0]), mToMm(start[1])]
      : planPointsToFlat([start, ...segments.map((s) => s.node.end as Vec2)])
    const wall: WallElement = {
      ...(baseOf(first, meta) as Omit<WallElement, 'type' | 'points' | 'thickness' | 'height' | 'fill'>),
      type: 'wall',
      points,
      // Mur de Pascal sans épaisseur ni hauteur : celles de son panneau (0,1 m, hauteur du niveau).
      thickness: mToMm((first.thickness as number | undefined) ?? PASCAL_WALL_THICKNESS),
      height:
        first.height === undefined || first.height === null
          ? (levelHeights.get(levelNodeOf(first)?.id ?? '') ?? mToMm(PASCAL_LEVEL_HEIGHT))
          : mToMm(first.height as number),
      ...(meta.props as { fill: string; material?: WallElement['material'] }),
      ...wallLayersOf(first),
    }
    elements.push({ order: meta.order, element: wall })
  }

  elements.sort((a, b) => a.order - b.order)

  const page = { ...settings.page, width: mToMm(settings.page.width), height: mToMm(settings.page.height) }
  const plan = settings.plan && {
    ...settings.plan,
    gridSize: mToMm(settings.plan.gridSize),
    defaultWallThickness: mToMm(settings.plan.defaultWallThickness),
    defaultWallHeight: mToMm(settings.plan.defaultWallHeight),
  }
  return defined({
    version: settings.version,
    unit: settings.unit,
    page,
    elements: elements.map((e) => e.element),
    plan,
    levels: settings.levelsAbsent ? undefined : levels,
    // Toitures et escaliers dessinés dans Pascal (M19 B6) : leurs quantités, pour les métrés.
    pascalQuantities: pascalQuantitiesOf(scene),
  }) as FabricsDocument

  function openingOf(node: SceneNodeData, meta: FabricsNodeMeta): OpeningElement {
    const props = meta.props ?? {}
    const position = node.position as Vec3
    const height = mToMm(node.height as number)
    const parent = node.parentId ? nodes[node.parentId] : undefined
    const parentMeta =
      parent?.type === 'wall' ? (metaOf(parent) ?? { id: parent.id, order: 0, segment: 0 }) : undefined
    return {
      ...baseOf(node, meta),
      type: 'opening',
      ...defined({ style: props.style as OpeningElement['style'], tiltTurn: props.tiltTurn as boolean | undefined }),
      kind: props.kind as OpeningElement['kind'],
      wallId: parentMeta ? parentMeta.id : (props.wallId as string),
      segmentIndex: parentMeta ? (parentMeta.segment ?? 0) : (props.segmentIndex as number),
      offset: mToMm(position[0]),
      width: mToMm(node.width as number),
      height,
      sillHeight: roundMm(mToMm(position[1]) - height / 2),
      hinge: node.hingesSide === 'right' ? 'end' : 'start',
      side: node.side === 'back' ? 'right' : 'left',
    } as OpeningElement
  }
}
