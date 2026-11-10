import type Konva from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createDimensionElement,
  createRoomElement,
  createWallElement,
  nextElementName,
} from '../../features/documents/elements'
import { flattenPoints, pointDistance } from '../../features/geometry/polygon'
import {
  collectSnapVertices,
  snapPoint,
  type SnapKind,
} from '../../features/geometry/snapping'
import type { Point } from '../../features/geometry/viewport'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import type { CanvasElement } from '../../types/document'
import { isTypingTarget } from './isTypingTarget'

export type PolylineTool = 'wall' | 'room' | 'dimension'

export interface PolylineDraft {
  /** Points déjà posés (coordonnées du document, en mm). */
  points: Point[]
  /** Position aimantée du curseur (point en cours de placement). */
  cursor: Point | null
  snapKind: SnapKind
}

/** Nombre minimal de points pour valider un tracé. */
const MIN_POINTS: Record<PolylineTool, number> = { wall: 2, room: 3, dimension: 2 }

/** Distance d'accroche, en pixels écran. */
const SNAP_THRESHOLD_PX = 8

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

const EMPTY: PolylineDraft = { points: [], cursor: null, snapKind: 'none' }

interface StoredDraft {
  tool: PolylineTool | null
  draft: PolylineDraft
}

function samePoint(a: Point, b: Point): boolean {
  return pointDistance(a, b) < 1e-6
}

/**
 * Tracé « point par point » d'un mur, d'une pièce ou d'une cote :
 * clic = poser un point ; `Maj` = contraindre à 0/45/90° ; double-clic ou `Entrée` = terminer ;
 * `Échap` = annuler ; `Retour arrière` = retirer le dernier point. Les points s'aimantent aux
 * sommets existants, aux angles des faces de murs, puis à la grille.
 *
 * `scale` = pixels écran par mm (pour garder une distance d'accroche constante à l'écran).
 */
export function usePolylineDrawing(tool: PolylineTool | null, scale: number) {
  // Le tracé est rattaché à son outil : changer d'outil abandonne le tracé en cours sans rien
  // remettre à zéro dans un effet (le tracé d'un autre outil est simplement ignoré).
  const [stored, setStored] = useState<StoredDraft>({ tool, draft: EMPTY })
  const storedRef = useRef<StoredDraft>(stored)
  const vertexCache = useRef<{ elements: readonly CanvasElement[]; vertices: Point[] } | null>(null)

  // Changer d'outil (y compris pour « sélection ») repart de zéro : un tracé abandonné ne doit pas
  // réapparaître au retour. Réglage d'état pendant le rendu, sans effet.
  if (stored.tool !== tool) setStored({ tool, draft: EMPTY })
  const draft = stored.tool === tool ? stored.draft : EMPTY

  useEffect(() => {
    storedRef.current = stored
  }, [stored])

  /** Tracé courant, lisible depuis les gestionnaires d'événements. */
  const readDraft = useCallback((): PolylineDraft => {
    const current = storedRef.current
    return current.tool === tool ? current.draft : EMPTY
  }, [tool])

  const setDraft = useCallback(
    (next: PolylineDraft) => {
      const value = { tool, draft: next }
      storedRef.current = value
      setStored(value)
    },
    [tool],
  )

  /** Sommets du plan (mis en cache : le calcul des angles de faces est coûteux). */
  const planVertices = useCallback((elements: readonly CanvasElement[]): Point[] => {
    if (vertexCache.current?.elements !== elements) {
      vertexCache.current = { elements, vertices: collectSnapVertices(elements) }
    }
    return vertexCache.current.vertices
  }, [])

  const snap = useCallback(
    (raw: Point, shift: boolean) => {
      const { project } = useEditorStore.getState()
      if (!project) return { point: raw, kind: 'none' as SnapKind }
      const current = readDraft().points
      const plan = project.document.plan
      return snapPoint(raw, {
        // On ne s'aimante qu'aux éléments du niveau actif.
        vertices: [...planVertices(selectActiveElements(useEditorStore.getState())), ...current],
        gridSize: plan?.snapToGrid ? plan.gridSize : null,
        threshold: SNAP_THRESHOLD_PX / scale,
        from: current.length > 0 ? current[current.length - 1] : null,
        constrain: shift,
      })
    },
    [planVertices, readDraft, scale],
  )

  const finish = useCallback(() => {
    const { points, cursor } = readDraft()
    const { project, addElement } = useEditorStore.getState()
    setDraft({ ...EMPTY, cursor })
    if (!tool || !project || points.length < MIN_POINTS[tool]) return

    const { plan, levels } = project.document
    const state = useEditorStore.getState()
    const name = nextElementName(fr.elements[tool], tool, selectActiveElements(state))
    // Un nouveau mur prend la hauteur d'étage du niveau actif.
    const wallHeight =
      levels?.find((level) => level.id === state.activeLevelId)?.height ??
      plan?.defaultWallHeight ??
      2500
    const flat = flattenPoints(points)
    if (tool === 'wall') {
      addElement(
        createWallElement(
          name,
          flat,
          plan?.defaultWallThickness ?? 200,
          wallHeight,
        ),
      )
    } else if (tool === 'room') {
      addElement(createRoomElement(name, flat))
    } else {
      addElement(createDimensionElement(name, [flat[0], flat[1], flat[2], flat[3]]))
    }
  }, [tool, readDraft, setDraft])

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!tool) return
      const raw = event.target.getStage()?.getRelativePointerPosition()
      if (!raw) return
      const current = readDraft()
      const clicks = event.evt instanceof MouseEvent ? event.evt.detail : 1

      // Double-clic : le premier clic a déjà posé le dernier point, le second termine le tracé.
      if (clicks >= 2 && current.points.length > 0) {
        finish()
        return
      }

      const { point, kind } = snap(raw, event.evt.shiftKey)
      const points = current.points

      // Pièce : un clic sur le premier point ferme le polygone.
      if (tool === 'room' && points.length >= 3 && samePoint(point, points[0])) {
        finish()
        return
      }
      if (points.length > 0 && samePoint(point, points[points.length - 1])) return

      setDraft({ points: [...points, point], cursor: point, snapKind: kind })
      // Une cote n'a que deux points.
      if (tool === 'dimension' && points.length + 1 === 2) finish()
    },
    [tool, readDraft, snap, finish, setDraft],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!tool) return
      const raw = event.target.getStage()?.getRelativePointerPosition()
      if (!raw) return
      const { point, kind } = snap(raw, event.evt.shiftKey)
      setDraft({ ...readDraft(), cursor: point, snapKind: kind })
    },
    [tool, readDraft, snap, setDraft],
  )

  // Clavier : écouté en phase de capture pour passer avant les raccourcis généraux
  // (un premier Échap annule le tracé, un second quitte l'outil).
  useEffect(() => {
    if (!tool) return
    const onKeyDown = (event: KeyboardEvent) => {
      const current = readDraft()
      if (current.points.length === 0 || isTypingTarget(event.target)) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        setDraft({ ...EMPTY, cursor: current.cursor })
      } else if (event.key === 'Enter') {
        event.preventDefault()
        event.stopImmediatePropagation()
        finish()
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        event.stopImmediatePropagation()
        setDraft({ ...current, points: current.points.slice(0, -1) })
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [tool, readDraft, finish, setDraft])

  return useMemo(
    () => ({ draft, isDrawing: draft.points.length > 0, onPointerDown, onPointerMove }),
    [draft, onPointerDown, onPointerMove],
  )
}
