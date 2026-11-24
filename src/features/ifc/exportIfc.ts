/**
 * Export IFC4 d'un plan (M22, 22.2). Le fichier est écrit par l'exportateur de Pascal (D22-1, D22-4) ;
 * Fabrics lui fournit, à partir de la scène (seule source de vérité, D79) :
 * - le contour tracé de chaque pièce, pour que l'`IfcSpace` ait la surface des métrés (D22-5) ;
 * - la dalle de chaque niveau qui n'a pas de dalle dessinée (quantité de M21), en `IfcSlab` ;
 * - les quantités géométriques de M21 dans les jeux de quantités standard, en m, m², m³ (D22-7) ;
 * - la propriété `Fabrics` (élément, version des règles, statut de la quantité, M21) ;
 * - les codes Uniclass 2015 (D22-2) ;
 * - l'exclusion des annotations (cotes, coupes, trames).
 * Rien n'est modifié dans la scène : l'exportateur reçoit une copie. Fonctions pures.
 */
import {
  buildIfcExport,
  type IfcExportExtensions,
  type IfcExportResult,
  type IfcExtraPropertySet,
  type IfcExtraQuantity,
  type IfcExtraQuantitySet,
  type IfcMeshPart,
} from '@pascal-app/ifc-converter/export'
import type { FabricsDocument, OpeningElement, RoomElement } from '../../types/document'
import { computeQuantities } from '../measurements/quantities/quantitySet'
import { GEOMETRY_VERSION } from '../measurements/quantities/rules'
import { LEVEL_SLAB_PART } from '../measurements/quantities/geometric'
import type { Quantity, QuantityStatus } from '../measurements/quantities/status'
import type { QuantityCode } from '../measurements/quantities/types'
import type { PlanScene, SceneNodeData } from '../scene/sceneTypes'
import { levelSlabNode, levelSlabPieces } from '../scene/levelSlabNode'
import { levelFootprintRings, polygonAreaM2 } from '../scene/siteMeasures'
import { flatToPlanPoints } from '../scene/units'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { collectStairVoids } from '../stairs/voids'
import { ifcClassOf, NOT_EXPORTED, UNICLASS } from './classes'
import { wallSegmentQuantities } from './segmentQuantities'

type ExportNodes = Parameters<typeof buildIfcExport>[0]['nodes']

export interface FabricsIfcLabels {
  /** Nom de la dalle de niveau, suivi du nom du niveau. */
  levelSlab: string
}

export interface FabricsIfcAdditions {
  nodes: Record<string, SceneNodeData>
  extensions: IfcExportExtensions
  excludedNodeTypes: string[]
  /** Nœud → élément Fabrics (un mur à plusieurs côtés donne plusieurs nœuds). */
  nodeToElement: Record<string, string>
}

const M = 1e-3
const M2 = 1e-6
const M3 = 1e-9

/** Préfixe des nœuds de dalle de niveau ajoutés à l'export (jamais écrits dans la scène). */
export const LEVEL_SLAB_NODE_PREFIX = 'slab_fabrics-level-'

const STATUS_ORDER: QuantityStatus[] = ['validated', 'provisional', 'unsupported', 'missing_data']
const worst = (statuses: readonly QuantityStatus[]): QuantityStatus =>
  statuses.reduce<QuantityStatus>((a, b) => (STATUS_ORDER.indexOf(b) > STATUS_ORDER.indexOf(a) ? b : a), 'validated')

function fabricsMeta(node: SceneNodeData): { id?: string; segment?: number } {
  return (node.metadata?.fabrics as { id?: string; segment?: number } | undefined) ?? {}
}

/** Ce que Fabrics ajoute à l'export de la scène (voir l'en-tête). */
export function fabricsIfcAdditions(scene: PlanScene, labels: FabricsIfcLabels, document?: FabricsDocument): FabricsIfcAdditions {
  const view = document ?? sceneToFabricsView(scene)
  const { geometric } = computeQuantities({ document: view, scene })
  const byKey = new Map<string, Quantity>()
  const byElement = new Map<string, Quantity[]>()
  for (const q of geometric) {
    const [id] = q.elementIds
    byKey.set(`${q.code}\u0000${id}\u0000${q.partId ?? ''}`, q)
    byElement.set(id, [...(byElement.get(id) ?? []), q])
  }
  const get = (code: QuantityCode, id: string, part: string | null = null) => byKey.get(`${code}\u0000${id}\u0000${part ?? ''}`)
  const segments = wallSegmentQuantities(view)
  const elementById = new Map(view.elements.map((el) => [el.id, el]))

  const nodes: Record<string, SceneNodeData> = { ...scene.nodes }
  const propertySets: Record<string, IfcExtraPropertySet[]> = {}
  const quantitySets: Record<string, IfcExtraQuantitySet[]> = {}
  const references: Record<string, { identification: string; name: string }> = {}
  const nodeToElement: Record<string, string> = {}

  const describe = (nodeId: string, elementId: string, statuses: readonly QuantityStatus[]) => {
    nodeToElement[nodeId] = elementId
    propertySets[nodeId] = [
      {
        name: 'Fabrics',
        properties: [
          { name: 'ElementId', kind: 'identifier', value: elementId },
          { name: 'QuantityRules', kind: 'label', value: GEOMETRY_VERSION },
          { name: 'QuantityStatus', kind: 'label', value: worst(statuses) },
        ],
      },
    ]
  }
  const quantities = (nodeId: string, name: string, list: (IfcExtraQuantity | null)[]) => {
    const kept = list.filter((q): q is IfcExtraQuantity => q !== null)
    if (kept.length > 0) quantitySets[nodeId] = [{ name, quantities: kept }]
  }
  const q = (name: string, kind: IfcExtraQuantity['kind'], value: number | undefined, scale: number): IfcExtraQuantity | null =>
    value === undefined || !Number.isFinite(value) ? null : { name, kind, value: value * scale }

  for (const node of Object.values(scene.nodes)) {
    const rule = ifcClassOf(node.type)
    if (rule?.uniclass) references[node.id] = { ...rule.uniclass }
    const meta = fabricsMeta(node)
    const elementId = meta.id ?? node.id
    const statuses = (byElement.get(elementId) ?? []).map((x) => x.status)

    if (node.type === 'wall') {
      const part = segments.get(elementId)?.[meta.segment ?? 0]
      if (!part) continue
      describe(node.id, elementId, statuses)
      quantities(node.id, 'Qto_WallBaseQuantities', [
        q('Length', 'length', part.length, M),
        q('Width', 'length', part.thickness, M),
        q('Height', 'length', part.height, M),
        q('GrossSideArea', 'area', part.grossArea, M2),
        q('NetSideArea', 'area', part.netArea, M2),
        q('GrossVolume', 'volume', part.grossVolume, M3),
        q('NetVolume', 'volume', part.netVolume, M3),
      ])
    } else if (node.type === 'door' || node.type === 'window') {
      const opening = elementById.get(elementId) as OpeningElement | undefined
      const area = get('opening.area', elementId)?.value
      if (!opening || area === undefined) continue
      describe(node.id, elementId, statuses)
      quantities(node.id, node.type === 'door' ? 'Qto_DoorBaseQuantities' : 'Qto_WindowBaseQuantities', [
        q('Width', 'length', opening.width, M),
        q('Height', 'length', opening.width > 0 ? area / opening.width : undefined, M),
        q('Area', 'area', area, M2),
      ])
    } else if (node.type === 'zone') {
      const room = elementById.get(elementId) as RoomElement | undefined
      if (!room || room.type !== 'room') continue
      // D22-5 : contour tracé de la pièce, celui des métrés.
      nodes[node.id] = { ...node, polygon: flatToPlanPoints(room.points), holes: [] }
      describe(node.id, elementId, statuses)
      quantities(node.id, 'Qto_SpaceBaseQuantities', [
        q('GrossFloorArea', 'area', get('room.area', elementId)?.value, M2),
        q('NetFloorArea', 'area', get('room.netArea', elementId)?.value, M2),
        q('GrossPerimeter', 'length', get('room.perimeter', elementId)?.value, M),
      ])
    } else if (node.type === 'slab') {
      const area = get('slab.area', node.id)
      if (!area) continue
      describe(node.id, node.id, (byElement.get(node.id) ?? []).map((x) => x.status))
      const thickness = typeof node.thickness === 'number' ? node.thickness : undefined
      quantities(node.id, 'Qto_SlabBaseQuantities', [
        q('Width', 'length', thickness, 1),
        q('Perimeter', 'length', get('slab.perimeter', node.id)?.value, M),
        q('NetArea', 'area', area.value, M2),
        q('NetVolume', 'volume', get('slab.volume', node.id)?.value, M3),
      ])
    }
  }

  // Dalles de niveau (M21) : emprise du niveau moins les murs du dessous qui la traversent et les
  // trémies (règle des fixtures) ; dessus au plancher du niveau. Un `IfcSlab` par morceau.
  const rings = levelFootprintRings(scene)
  const voids = collectStairVoids(view.elements, view.levels)
  const sortedLevels = [...(view.levels ?? [])].sort((a, b) => a.elevation - b.elevation)
  sortedLevels.forEach((level, levelIndex) => {
    const area = get('slab.area', level.id, LEVEL_SLAB_PART)
    const footprint = rings.get(level.id)
    if (!area || !footprint || footprint.rings.length === 0) return
    const volume = get('slab.volume', level.id, LEVEL_SLAB_PART)
    const below = levelIndex > 0 ? sortedLevels[levelIndex - 1] : undefined
    const slabBottom = level.elevation - level.slabThickness
    const crossing = new Set(
      below
        ? view.elements
            .filter((el) => el.type === 'wall' && el.levelId === below.id && el.height > 0 && below.elevation + el.height > slabBottom)
            .map((el) => el.id)
        : [],
    )
    const wallsBelow = Object.values(scene.nodes).filter((node) => node.type === 'wall' && crossing.has(fabricsMeta(node).id ?? node.id))
    const pieces = levelSlabPieces({
      rings: footprint.rings,
      wallsBelow,
      voids: voids.filter((v) => v.levelId === level.id).map((v) => v.polygon.map((p): [number, number] => [p.x * M, p.y * M])),
    })
    const levelNode = nodes[footprint.levelNodeId]
    const pieceAreas = pieces.map((piece) => polygonAreaM2(piece.outer) - piece.holes.reduce((sum, hole) => sum + polygonAreaM2(hole), 0))
    const totalPieceArea = pieceAreas.reduce((a, b) => a + b, 0) || 1
    pieces.forEach((piece, index) => {
      const id = `${LEVEL_SLAB_NODE_PREFIX}${footprint.levelNodeId}${pieces.length > 1 ? `-${index + 1}` : ''}`
      nodes[id] = levelSlabNode({
        id,
        levelNodeId: footprint.levelNodeId,
        name: `${labels.levelSlab} ${level.name}`,
        polygon: piece.outer,
        holes: piece.holes,
        thickness: level.slabThickness * M,
        levelId: level.id,
      })
      if (levelNode) nodes[levelNode.id] = { ...nodes[levelNode.id], children: [...(nodes[levelNode.id].children ?? []), id] }
      references[id] = { ...ifcClassOf('slab')!.uniclass! }
      describe(id, level.id, [area.status, ...(volume ? [volume.status] : [])])
      // Quantités de M21 réparties entre les morceaux au prorata de leur surface (somme = M21).
      const netArea = area.value * (pieceAreas[index] / totalPieceArea)
      quantities(id, 'Qto_SlabBaseQuantities', [
        q('Width', 'length', level.slabThickness, M),
        q('NetArea', 'area', netArea, M2),
        q('NetVolume', 'volume', volume ? volume.value * (pieceAreas[index] / totalPieceArea) : undefined, M3),
      ])
    })
  })

  return {
    nodes,
    extensions: {
      propertySets,
      quantitySets,
      classification: { ...UNICLASS, references },
    },
    excludedNodeTypes: Object.keys(NOT_EXPORTED),
    nodeToElement,
  }
}

export interface FabricsIfcOptions {
  projectName: string
  labels: FabricsIfcLabels
  /** Formes 3D de la vue (toitures, escaliers, mobilier) ; sans elles, ces objets sont signalés « sans géométrie ». */
  meshes?: ReadonlyMap<string, IfcMeshPart[]>
  timestamp?: Date
}

/** Fichier IFC4 d'un plan, avec le résumé de l'exportateur (classes, GlobalId, objets laissés de côté). */
export function buildFabricsIfc(scene: PlanScene, options: FabricsIfcOptions): IfcExportResult & { additions: FabricsIfcAdditions } {
  const additions = fabricsIfcAdditions(scene, options.labels)
  const result = buildIfcExport({
    nodes: additions.nodes as unknown as ExportNodes,
    meshes: options.meshes,
    projectName: options.projectName,
    timestamp: options.timestamp,
    onlyVisible: true,
    excludedNodeTypes: additions.excludedNodeTypes,
    extensions: additions.extensions,
  })
  return { ...result, additions }
}

export interface IfcNoteTexts {
  missing: (count: number, names: string) => string
  provisional: (count: number) => string
  unmatched: (count: number) => string
}

/**
 * Remarques après un export (aucune perte silencieuse, G5) : objets affichés laissés hors du fichier,
 * éléments aux quantités non validées, quantités sans objet IFC. Vide si tout est complet.
 */
export function ifcExportNotes(
  summary: Pick<IfcExportResult['summary'], 'unmatchedExtensions'>,
  missing: readonly { nodeId: string }[],
  additions: FabricsIfcAdditions,
  texts: IfcNoteTexts,
): string[] {
  const notes: string[] = []
  if (missing.length > 0) {
    const names = missing.map((skip) => {
      const node = additions.nodes[skip.nodeId]
      return node?.name?.trim() || node?.type || skip.nodeId
    })
    notes.push(texts.missing(missing.length, [...new Set(names)].join(', ')))
  }
  const statuses = additions.extensions.propertySets ?? {}
  const notValidated = new Set<string>()
  for (const [nodeId, sets] of Object.entries(statuses)) {
    const status = sets.flatMap((set) => set.properties).find((p) => p.name === 'QuantityStatus')?.value
    if (status !== undefined && status !== 'validated') notValidated.add(additions.nodeToElement[nodeId] ?? nodeId)
  }
  if (notValidated.size > 0) notes.push(texts.provisional(notValidated.size))
  const missingIds = new Set(missing.map((skip) => skip.nodeId))
  const unmatched = summary.unmatchedExtensions.filter((id) => !missingIds.has(id))
  if (unmatched.length > 0) notes.push(texts.unmatched(new Set(unmatched.map((id) => additions.nodeToElement[id] ?? id)).size))
  return notes
}
