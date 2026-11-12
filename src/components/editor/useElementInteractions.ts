import type Konva from 'konva'
import { useCallback, useMemo, useRef } from 'react'
import { translateBox, unionBoxes, type Box } from '../../features/geometry/box'
import { elementsOfLevel, levelBelow } from '../../features/documents/levels'
import { elementBounds } from '../../features/export/bounds'
import { computeSnap } from '../../features/geometry/guides'
import {
  collectSnapLines,
  EMPTY_SNAP_LINES,
  mergeSnapLines,
  movingSnapLines,
  snapLinesTo,
  type SnapLines,
} from '../../features/geometry/snapLines'
import { hasAbsolutePoints, translateElement } from '../../features/geometry/transform'
import type { Point } from '../../features/geometry/viewport'
import { pxPerUnit } from '../../features/units/scale'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import { connectedWallIds } from '../../features/building/wallChains'
import type { WallElement } from '../../types/document'
import type { ShapeInteraction } from './shapes/shapeTypes'

type Handlers = Pick<
  ShapeInteraction,
  'onPointerDown' | 'onDragStart' | 'onDragMove' | 'onDragEnd' | 'onDoubleClick'
>

/** Distance d'accroche des guides d'alignement, en pixels écran. */
const SNAP_THRESHOLD_PX = 8

interface DragSession {
  /** Position de départ de chaque élément déplacé. */
  origins: Map<string, Point>
  /** Boîte qui englobe tous les éléments déplacés, au départ du geste. */
  groupBox: Box | null
  /** Boîtes sur lesquelles on s'aimante : les autres éléments visibles et la page. */
  targets: Box[]
  /** Ouvertures des murs déplacés : elles suivent leur mur à l'écran, sans être modifiées. */
  followers: Map<string, Point>
  /**
   * Plans : aimantation sur la vraie géométrie (faces et axes des murs, contours, emprises) du
   * niveau actif et du niveau du dessous affiché, puis sur la grille. `null` dans un visuel, qui
   * garde l'aimantation sur les boîtes dessinées (`groupBox`, `targets`).
   */
  plan: { moving: SnapLines; anchor: Point; targets: SnapLines; grid: number | null } | null
}

const EMPTY_SESSION: DragSession = {
  origins: new Map(),
  groupBox: null,
  targets: [],
  followers: new Map(),
  plan: null,
}

/** Aimantation géométrique d'un déplacement dans un plan (voir `DragSession.plan`). */
function planDragSnap(
  ids: ReadonlySet<string>,
  followers: ReadonlySet<string>,
): DragSession['plan'] {
  const store = useEditorStore.getState()
  const project = store.project
  if (!project || project.kind !== 'plan') return null
  const dragged = project.document.elements.filter((element) => ids.has(element.id))
  const box = unionBoxes(
    dragged.flatMap((element) => {
      const bounds = elementBounds(element)
      return bounds ? [bounds] : []
    }),
  )
  if (!box) return null
  const levels = project.document.levels
  const below =
    store.showLowerLevel && levels && store.activeLevelId !== null
      ? levelBelow(levels, store.activeLevelId)
      : undefined
  const exclude = new Set([...ids, ...followers])
  const targets = mergeSnapLines(
    collectSnapLines(selectActiveElements(store), exclude),
    below ? collectSnapLines(elementsOfLevel(project.document.elements, below.id)) : EMPTY_SNAP_LINES,
  )
  const plan = project.document.plan
  return {
    moving: movingSnapLines(dragged),
    anchor: { x: box.x, y: box.y },
    targets,
    grid: plan?.snapToGrid ? plan.gridSize : null,
  }
}

/**
 * Sélection par clic (Maj = ajouter / retirer) et déplacement des éléments.
 * Quand plusieurs éléments sont sélectionnés, ils se déplacent ensemble, aimantés sur les bords
 * et les centres des autres éléments et de la page (Alt enfoncée : pas d'aimantation).
 * Les positions ne sont écrites dans le document qu'à la fin du geste : un seul état d'historique.
 */
export function useElementInteractions(): Handlers {
  const session = useRef<DragSession>(EMPTY_SESSION)

  const onPointerDown = useCallback((event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Clic molette ou clic droit : ni sélection ni glissement ; le clic remonte à la scène, qui
    // déplace la vue avec le clic molette.
    if (event.evt instanceof MouseEvent && event.evt.button !== 0) return
    event.cancelBubble = true // empêche le rectangle de sélection de démarrer
    // `currentTarget` = l'élément du document (un groupe pour un mur, une pièce ou une cote),
    // alors que `target` serait la forme précise cliquée à l'intérieur.
    const id = event.currentTarget.id()
    const { selectedIds, setSelection, project } = useEditorStore.getState()
    // Fond DXF déverrouillé : un clic sur un trait prend tout le fond (il se déplace d'un bloc).
    const clicked = project?.document.elements.find((el) => el.id === id)
    const groupId = clicked?.type === 'line' ? clicked.groupId : undefined
    const ids = groupId
      ? (project?.document.elements ?? [])
          .filter((el) => el.type === 'line' && el.groupId === groupId)
          .map((el) => el.id)
      : [id]
    if (event.evt.shiftKey) {
      const taken = new Set(ids)
      setSelection(
        selectedIds.includes(id) ? selectedIds.filter((i) => !taken.has(i)) : [...selectedIds, ...ids],
      )
    } else if (!selectedIds.includes(id)) {
      setSelection(ids)
    }
  }, [])

  const onDragStart = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    if (!stage) return
    const { selectedIds, project } = useEditorStore.getState()
    // Verrouillés, et ouvertures (leur place vient de leur mur) : jamais déplacés ici.
    const locked = new Set(
      project?.document.elements
        .filter((el) => el.locked || el.type === 'opening')
        .map((el) => el.id),
    )
    const ids = new Set([...selectedIds, event.target.id()])

    const origins = new Map<string, Point>()
    const draggedNodes: Konva.Node[] = []
    for (const id of ids) {
      const node = stage.findOne(`#${id}`)
      if (node && !locked.has(id)) {
        origins.set(id, { x: node.x(), y: node.y() })
        draggedNodes.push(node)
      }
    }

    // Les ouvertures d'un mur déplacé suivent le mur à l'écran (leur place est relative au mur).
    const followers = new Map<string, Point>()
    for (const element of project?.document.elements ?? []) {
      if (element.type !== 'opening' || !origins.has(element.wallId)) continue
      const node = stage.findOne(`#${element.id}`)
      if (node) followers.set(element.id, { x: node.x(), y: node.y() })
    }

    // Boîtes en coordonnées du document (le calque n'a pas de transformation propre).
    const layer = event.target.getLayer() ?? undefined
    const boxOf = (node: Konva.Node): Box => node.getClientRect({ relativeTo: layer })
    const targets = Array.from(stage.find('.element'))
      .filter(
        (node) =>
          node.isVisible() &&
          !origins.has(node.id()) &&
          !followers.has(node.id()) &&
          !node.findAncestor('.reference'), // le niveau de référence n'attire pas les éléments
      )
      .map(boxOf)
    if (project) {
      const { width, height } = project.document.page
      targets.push({ x: 0, y: 0, width, height })
    }

    session.current = {
      origins,
      groupBox: unionBoxes(draggedNodes.map(boxOf)),
      targets,
      followers,
      plan: planDragSnap(new Set(origins.keys()), new Set(followers.keys())),
    }
  }, [])

  const onDragMove = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    const draggedId = event.target.id()
    const { origins, groupBox, targets, followers, plan } = session.current
    const origin = origins.get(draggedId)
    if (!stage || !origin) return

    const store = useEditorStore.getState()
    let dx = event.target.x() - origin.x
    let dy = event.target.y() - origin.y

    if (plan && store.project && !event.evt.altKey) {
      const scale = store.zoom * pxPerUnit(store.project.document.unit)
      const snap = snapLinesTo(
        {
          xs: plan.moving.xs.map((x) => x + dx),
          ys: plan.moving.ys.map((y) => y + dy),
        },
        { x: plan.anchor.x + dx, y: plan.anchor.y + dy },
        { targets: plan.targets, threshold: SNAP_THRESHOLD_PX / scale, grid: plan.grid },
      )
      dx += snap.dx
      dy += snap.dy
      store.setGuides(snap.guides)
    } else if (groupBox && store.project && !event.evt.altKey) {
      const scale = store.zoom * pxPerUnit(store.project.document.unit)
      const snap = computeSnap(translateBox(groupBox, dx, dy), targets, SNAP_THRESHOLD_PX / scale)
      dx += snap.dx
      dy += snap.dy
      store.setGuides(snap.guides)
    } else if (store.guides.length > 0) {
      store.setGuides([])
    }

    event.target.position({ x: origin.x + dx, y: origin.y + dy })
    for (const [id, start] of origins) {
      if (id === draggedId) continue
      stage.findOne(`#${id}`)?.position({ x: start.x + dx, y: start.y + dy })
    }
    for (const [id, start] of followers) {
      stage.findOne(`#${id}`)?.position({ x: start.x + dx, y: start.y + dy })
    }
  }, [])

  const onDragEnd = useCallback((event: Konva.KonvaEventObject<DragEvent>) => {
    const stage = event.target.getStage()
    const { project, replaceElements, setGuides } = useEditorStore.getState()
    setGuides([])
    if (!stage || !project) return
    const byId = new Map(project.document.elements.map((el) => [el.id, el]))
    const updated = [...session.current.origins.keys()].flatMap((id) => {
      const node = stage.findOne(`#${id}`)
      const element = byId.get(id)
      if (!node || !element) return []
      return [translateElement(element, node.x() - element.x, node.y() - element.y)]
    })
    session.current = EMPTY_SESSION
    replaceElements(updated)

    // Murs, pièces et cotes gardent leur position à 0 : ce sont leurs points qui ont bougé.
    // react-konva ne réécrit pas une position inchangée, on remet donc le nœud à sa place.
    for (const element of updated) {
      if (hasAbsolutePoints(element)) stage.findOne(`#${element.id}`)?.position({ x: element.x, y: element.y })
    }
  }, [])

  // Double-clic sur un texte : on passe en édition. Sur un mur : on sélectionne tous les murs liés
  // (Maj : on les ajoute à la sélection).
  const onDoubleClick = useCallback((event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const { project, startEditingText, selectedIds, setSelection } = useEditorStore.getState()
    const id = event.currentTarget.id()
    const elements = project?.document.elements ?? []
    const target = elements.find((el) => el.id === id)
    if (target?.type === 'text') {
      startEditingText(id)
    } else if (target?.type === 'wall') {
      const walls = elements.filter((el): el is WallElement => el.type === 'wall')
      const chain = connectedWallIds(walls, id)
      setSelection(event.evt.shiftKey ? [...new Set([...selectedIds, ...chain])] : chain)
    }
  }, [])

  return useMemo(
    () => ({ onPointerDown, onDragStart, onDragMove, onDragEnd, onDoubleClick }),
    [onPointerDown, onDragStart, onDragMove, onDragEnd, onDoubleClick],
  )
}
