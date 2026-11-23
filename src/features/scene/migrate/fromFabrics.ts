/**
 * Plan Fabrics (`FabricsDocument`, mm) → scène Pascal (m). Fonction pure (plan M18, lot B).
 *
 * Correspondance (plan M18 § 1) :
 * - niveaux → `level` (dans `site` → `building`), altitudes empilées comme Pascal ;
 * - mur à N côtés → N `wall` (un par côté, point 5 A : le repère reste celui du tracé d'origine) ;
 * - porte → `door`, fenêtre et baie → `window`, enfants du côté de mur qui les porte ;
 * - pièce → `zone`, mobilier → `item`, axe → `structural-grid`,
 *   cote → `construction-dimension` ;
 * - coupe, toiture, escalier, cheminée, plateforme, textes, formes, images et fonds DXF → nœuds Fabrics
 *   (`nodes/fabricsNodes.ts`).
 *
 * Rien n'est perdu : ce que Pascal ne porte pas va dans `metadata.fabrics`, et `toFabricsView` rend
 * le document d'origine (test d'aller-retour). Les anomalies sont signalées dans `issues`, jamais
 * corrigées en silence (EDGE-01).
 */
import {
  BuildingNode,
  ConstructionDimensionNode,
  DoorNode,
  ItemNode,
  LevelNode,
  SiteNode,
  StructuralGridNode,
  WallNode,
  WindowNode,
  ZoneNode,
} from '@pascal-app/core'
import type {
  AxisElement,
  CanvasElement,
  DimensionElement,
  FabricsDocument,
  FurnitureElement,
  OpeningElement,
  RoomElement,
  WallElement,
} from '../../../types/document'
import { FABRICS_NODE_KINDS, FABRICS_NODE_PREFIX, FABRICS_NODE_SCHEMAS, registerFabricsNodes } from '../nodes/fabricsNodes'
import {
  BUILDING_ID,
  SITE_ID,
  type ConversionIssue,
  type FabricsNodeMeta,
  type PlanScene,
  type SceneNodeData,
} from '../sceneTypes'
import { degreesToPascalRotation, flatToPlanPoints, mmToM, takeoffToScene } from '../units'
import { LENGTH_FIELDS, lengthsToMetres } from './lengthFields'
import { dimensionFrame, furnitureCentre } from './geometry'
import { nodeIdOf } from './nodeIds'
import { canConvertRoof, roofToPascal, stairToPascal } from './roofStairNodes'
import { levelAboveOf } from '../../stairs/stairs'

export interface FabricsToSceneResult {
  scene: PlanScene
  issues: ConversionIssue[]
}

/** Copie sans les clés `undefined` (le document d'origine n'en a pas). */
function defined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>
}

/** Valeur d'un nœud validé par Pascal, vue comme une donnée de scène. */
function asData(node: unknown): SceneNodeData {
  return node as SceneNodeData
}

const AXIS_LABEL = /^.{1,12}$/

/** Plan refusé : deux éléments (ou deux niveaux) ont le même identifiant (EDGE-01, `duplicate-id`).
 * La conversion n'écrase jamais un élément par un autre en silence. */
export class DuplicateElementIdError extends Error {
  readonly ids: string[]
  constructor(ids: string[]) {
    super(`Identifiants en double dans le plan : ${ids.join(', ')}`)
    this.name = 'DuplicateElementIdError'
    this.ids = ids
  }
}

function duplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) (seen.has(id) ? duplicates : seen).add(id)
  return [...duplicates]
}

export function fabricsToScene(doc: FabricsDocument): FabricsToSceneResult {
  const duplicates = [
    ...duplicateIds(doc.elements.map((el) => el.id)),
    ...duplicateIds((doc.levels ?? []).map((level) => level.id)),
  ]
  if (duplicates.length > 0) throw new DuplicateElementIdError(duplicates)
  registerFabricsNodes()
  const nodes: Record<string, SceneNodeData> = {}
  const issues: ConversionIssue[] = []

  const add = (node: SceneNodeData): void => {
    nodes[node.id] = node
    if (node.parentId) {
      const parent = nodes[node.parentId]
      parent.children = [...(parent.children ?? []), node.id]
    }
  }

  // --- Site, bâtiment, réglages du document ---
  const plan = doc.plan && {
    ...doc.plan,
    gridSize: mmToM(doc.plan.gridSize),
    defaultWallThickness: mmToM(doc.plan.defaultWallThickness),
    defaultWallHeight: mmToM(doc.plan.defaultWallHeight),
    ...(doc.plan.takeoff && { takeoff: takeoffToScene(doc.plan.takeoff) }),
  }
  const page = { ...doc.page, width: mmToM(doc.page.width), height: mmToM(doc.page.height) }
  add(asData(SiteNode.parse({ id: SITE_ID, children: [] })))
  add(
    asData(
      BuildingNode.parse({
        id: BUILDING_ID,
        parentId: SITE_ID,
        children: [],
        metadata: {
          fabrics: defined({ version: doc.version, unit: doc.unit, page, plan, levelsAbsent: doc.levels ? undefined : true }),
        },
      }),
    ),
  )

  // --- Niveaux (altitudes empilées : base = haut du niveau précédent + décalage) ---
  const levels = doc.levels ?? []
  const levelNodeIds = new Map<string, string>()
  let previousTop: number | null = null
  levels.forEach((level, index) => {
    const id = nodeIdOf('level', level.id)
    levelNodeIds.set(level.id, id)
    const baseElevation = previousTop === null ? level.elevation : level.elevation - previousTop
    previousTop = level.elevation + level.height
    add(
      asData(
        LevelNode.parse({
          id,
          parentId: BUILDING_ID,
          name: level.name,
          level: index,
          height: mmToM(level.height),
          baseElevation: mmToM(baseElevation),
          children: [],
          metadata: { fabrics: { id: level.id, order: index, slabThickness: mmToM(level.slabThickness) } },
        }),
      ),
    )
  })
  let defaultLevelId = levelNodeIds.values().next().value
  if (!defaultLevelId) {
    issues.push({ code: 'no-level', elementId: '' })
    defaultLevelId = nodeIdOf('level', 'fabrics-default')
    add(
      asData(
        LevelNode.parse({
          id: defaultLevelId,
          parentId: BUILDING_ID,
          level: 0,
          children: [],
          metadata: { fabrics: { id: 'fabrics-default', order: 0, synthetic: true } },
        }),
      ),
    )
  }

  // --- Éléments : murs et autres d'abord, ouvertures ensuite (elles s'accrochent aux murs) ---
  const placeOf = (el: CanvasElement): { parentId: string; levelId?: string | null } => {
    if (el.levelId === undefined) return { parentId: defaultLevelId, levelId: null }
    const id = levelNodeIds.get(el.levelId)
    if (id) return { parentId: id }
    issues.push({ code: 'element-without-level', elementId: el.id })
    return { parentId: defaultLevelId, levelId: el.levelId }
  }
  const metaOf = (el: CanvasElement, order: number, levelId: string | null | undefined, extra: Partial<FabricsNodeMeta>) => ({
    fabrics: defined({
      id: el.id,
      order,
      levelId,
      base: defined({ x: mmToM(el.x), y: mmToM(el.y), rotation: el.rotation, opacity: el.opacity, locked: el.locked }),
      ...extra,
    }),
  })

  const openings: [OpeningElement, number][] = []
  doc.elements.forEach((el, order) => {
    if (el.type === 'opening') {
      openings.push([el, order])
      return
    }
    const { parentId, levelId } = placeOf(el)
    const common = { parentId, name: el.name, visible: !el.hidden }
    const meta = (extra: Partial<FabricsNodeMeta> = {}) => metaOf(el, order, levelId, extra)

    switch (el.type) {
      case 'wall':
        addWall(el, common, meta)
        return
      case 'room':
        add(asData(ZoneNode.parse({ ...common, id: nodeIdOf('zone', el.id), name: el.name, polygon: flatToPlanPoints(el.points), metadata: meta({ props: roomProps(el) }) })))
        return
      case 'furniture':
        add(asData(furnitureNode(el, common, metaOf(el, order, levelId, {}))))
        return
      case 'axis':
        add(asData(axisNode(el, common, meta)))
        return
      case 'dimension':
        add(asData(dimensionNode(el, common, meta)))
        return
      // Toitures et escaliers (M19 B6) : nœuds natifs de Pascal, l'élément d'origine gardé avec eux.
      case 'roof':
        if (canConvertRoof(el)) {
          const level = doc.levels?.find((l) => l.id === el.levelId)
          const [roof, ...segments] = roofToPascal(el, { parentId, levelHeight: mmToM(level?.height ?? 0) }, defined({ id: el.id, order, levelId }) as FabricsNodeMeta)
          add({ ...roof, children: [] })
          for (const segment of segments) add(segment)
          return
        }
        break
      case 'stair': {
        const level = doc.levels?.find((l) => l.id === el.levelId)
        const above = levelAboveOf(doc.levels, el.levelId)
        const rise = above && level ? above.elevation - level.elevation : (level?.height ?? 2700)
        const [stair, ...segments] = stairToPascal(el, { parentId, rise }, defined({ id: el.id, order, levelId }) as FabricsNodeMeta)
        add({ ...stair, children: [] })
        for (const segment of segments) add(segment)
        return
      }
    }
    // Autres éléments (et toiture que Pascal ne peut pas porter) : nœud propre à Fabrics.
    const kind = FABRICS_NODE_KINDS[el.type as keyof typeof FABRICS_NODE_KINDS]
    const { id, name, hidden, ...rest } = el
    void name
    void hidden
    add(
      asData(
        FABRICS_NODE_SCHEMAS[kind].parse({
          ...common,
          id: `${FABRICS_NODE_PREFIX[kind]}_${id}`,
          element: lengthsToMetres(rest, LENGTH_FIELDS[el.type]),
          metadata: { fabrics: defined({ id, order, levelId }) },
        }),
      ),
    )
  })

  for (const [el, order] of openings) addOpening(el, order)

  return { scene: { nodes, rootNodeIds: [SITE_ID] }, issues }

  // --- Détails par type ---

  function addWall(
    el: WallElement,
    common: { parentId: string; name: string; visible: boolean },
    meta: (extra?: Partial<FabricsNodeMeta>) => Record<string, unknown>,
  ): void {
    const points = flatToPlanPoints(el.points)
    const props = defined({ fill: el.fill, material: el.material })
    const wall = (index: number, start: [number, number], end: [number, number], degenerate?: true) =>
      add(
        asData(
          WallNode.parse({
            ...common,
            id: nodeIdOf('wall', el.id, index),
            start,
            end,
            thickness: mmToM(el.thickness),
            height: mmToM(el.height),
            children: [],
            metadata: meta(defined({ props, segment: index, degenerate })),
          }),
        ),
      )
    if (points.length < 2) {
      issues.push({ code: 'wall-degenerate', elementId: el.id })
      const p = points[0] ?? [0, 0]
      wall(0, p, p, true)
      return
    }
    for (let i = 0; i + 1 < points.length; i++) wall(i, points[i], points[i + 1])
  }

  function addOpening(el: OpeningElement, order: number): void {
    const place = placeOf(el)
    // Toujours explicite : le niveau d'une ouverture peut différer de celui de son mur.
    const levelId = el.levelId ?? null
    const wallNodeId = nodeIdOf('wall', el.wallId, el.segmentIndex)
    const hosted = nodes[wallNodeId]?.type === 'wall'
    if (!hosted) issues.push({ code: 'opening-without-wall', elementId: el.id })
    const parentId = hosted ? wallNodeId : place.parentId
    const props = defined({
      kind: el.kind,
      style: el.style,
      tiltTurn: el.tiltTurn,
      // Ouverture sans mur : on garde sa référence d'origine telle quelle.
      wallId: hosted ? undefined : el.wallId,
      segmentIndex: hosted ? undefined : el.segmentIndex,
    })
    const data = {
      parentId,
      name: el.name,
      visible: !el.hidden,
      wallId: hosted ? wallNodeId : undefined,
      position: [mmToM(el.offset), mmToM(el.sillHeight + el.height / 2), 0],
      width: mmToM(el.width),
      height: mmToM(el.height),
      hingesSide: el.hinge === 'start' ? 'left' : 'right',
      side: el.side === 'left' ? 'front' : 'back',
      metadata: metaOf(el, order, levelId, { props }),
    }
    add(
      asData(
        el.kind === 'door'
          ? DoorNode.parse({ ...data, id: nodeIdOf('door', el.id) })
          : WindowNode.parse({ ...data, id: nodeIdOf('window', el.id) }),
      ),
    )
  }
}

function roomProps(el: RoomElement) {
  return defined({ fill: el.fill, showLabel: el.showLabel, falseCeiling: el.falseCeiling })
}

type Common = { parentId: string; name: string; visible: boolean }
type Meta = (extra?: Partial<FabricsNodeMeta>) => Record<string, unknown>

function furnitureNode(el: FurnitureElement, common: Common, meta: { fabrics: Record<string, unknown> }) {
  const [cx, cy] = furnitureCentre(el.x, el.y, el.width, el.depth, el.rotation)
  const { base, ...rest } = meta.fabrics as { base?: Record<string, unknown> }
  // Position et rotation sont portées par Pascal : seuls l'opacité et le verrou restent dans `base`.
  const fabrics = { ...rest, base: defined({ opacity: base?.opacity, locked: base?.locked }), props: defined({ mirrored: el.mirrored }) }
  return ItemNode.parse({
    ...common,
    id: nodeIdOf('item', el.id),
    position: [mmToM(cx), 0, mmToM(cy)],
    rotation: [0, degreesToPascalRotation(el.rotation), 0],
    asset: {
      id: el.symbol,
      category: 'fabrics',
      name: el.symbol,
      thumbnail: '',
      src: `asset://fabrics/${encodeURIComponent(el.symbol)}`,
      dimensions: [mmToM(el.width), 1, mmToM(el.depth)],
    },
    metadata: { fabrics },
  })
}

function axisNode(el: AxisElement, common: Common, meta: Meta) {
  const [x1, y1, x2, y2] = el.points
  const valid = AXIS_LABEL.test(el.label.trim()) && el.label.trim() === el.label
  return StructuralGridNode.parse({
    ...common,
    id: nodeIdOf('structural-grid', el.id),
    start: [mmToM(x1), mmToM(y1)],
    end: [mmToM(x2), mmToM(y2)],
    // Pascal exige 1 à 12 caractères sans espace autour : sinon l'étiquette d'origine est gardée à part.
    label: valid ? el.label : '?',
    metadata: meta(valid ? {} : { props: { label: el.label } }),
  })
}

function dimensionNode(el: DimensionElement, common: Common, meta: Meta) {
  const [x1, y1, x2, y2] = el.points
  const { direction, origin } = dimensionFrame(x1, y1, x2, y2, el.offset)
  return ConstructionDimensionNode.parse({
    ...common,
    id: nodeIdOf('construction-dimension', el.id),
    anchors: [
      [mmToM(x1), 0, mmToM(y1)],
      [mmToM(x2), 0, mmToM(y2)],
    ],
    baseline: { origin: [mmToM(origin[0]), mmToM(origin[1])], direction },
    metadata: meta({ props: defined({ visibleIn: el.visibleIn }) }),
  })
}
