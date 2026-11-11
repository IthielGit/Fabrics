import type Konva from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createAxisElement,
  createDimensionElement,
  createPlatformElement,
  createRoomElement,
  createSectionElement,
  createWallElement,
  nextElementName,
} from '../../features/documents/elements'
import {
  createRectangleRoom,
  createRoomWithWalls,
  isRectangle,
  rectangleCorners,
} from '../../features/documents/construction'
import { nextAxisLabel } from '../../features/geometry/axes'
import type { Guide } from '../../features/geometry/guides'
import { flattenPoints, pointDistance } from '../../features/geometry/polygon'
import { nextSectionLabel, sectionTitle } from '../../features/geometry/sections'
import {
  collectAlignTargets,
  collectOpeningSnapPoints,
  collectSnapAxes,
  collectSnapVertices,
  collectSnapWallAxes,
  preferredVertexKinds,
  snapPoint,
  type SnapKind,
  type VertexKind,
  type WallAxisSegment,
} from '../../features/geometry/snapping'
import { createRegionFinder, type RegionFinder } from '../../features/geometry/regions'
import type { Point } from '../../features/geometry/viewport'
import { fr } from '../../i18n/fr'
import { selectActiveElements, selectSnapElements, useEditorStore } from '../../stores/editorStore'
import type { CanvasElement } from '../../types/document'
import { isTypingTarget } from './isTypingTarget'

export type PolylineTool = 'wall' | 'room' | 'platform' | 'dimension' | 'axis' | 'section'

export interface PolylineDraft {
  /** Points déjà posés (coordonnées du document, en mm). */
  points: Point[]
  /** Position aimantée du curseur (point en cours de placement). */
  cursor: Point | null
  snapKind: SnapKind
  /** Nature du sommet attrapé (axe, face intérieure…), affichée près du curseur ; sinon `null`. */
  vertexKind: VertexKind | null
  /**
   * Outil Pièce avec Maj et aucun point posé : on survole une zone à remplir. `region` est le
   * contour de la zone fermée par les murs sous le curseur, ou `null` s'il n'y en a pas.
   */
  fillMode: boolean
  region: Point[] | null
}

/** Nombre minimal de points pour valider un tracé. */
const MIN_POINTS: Record<PolylineTool, number> = {
  wall: 2,
  room: 3,
  platform: 3,
  dimension: 2,
  axis: 2,
  section: 2,
}

/** Distance d'accroche, en pixels écran. */
const SNAP_THRESHOLD_PX = 8

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

const EMPTY: PolylineDraft = {
  points: [],
  cursor: null,
  snapKind: 'none',
  vertexKind: null,
  fillMode: false,
  region: null,
}

interface StoredDraft {
  /** Outil et mode du tracé (`wall:straight`, `room:rectangle`…) : changer de mode repart de zéro. */
  key: string | null
  draft: PolylineDraft
}

/** Affiche ces guides d'alignement (ou les efface) sans rien changer s'il n'y a rien de nouveau. */
function setGuidesIfChanged(guides: Guide[]): void {
  const store = useEditorStore.getState()
  if (guides.length === 0 && store.guides.length === 0) return
  store.setGuides(guides)
}

function samePoint(a: Point, b: Point): boolean {
  return pointDistance(a, b) < 1e-6
}

/**
 * Tracé « point par point » d'un mur, d'une pièce, d'une cote ou d'un axe :
 * clic = poser un point ; `Maj` = contraindre à 0/45/90° ; double-clic ou `Entrée` = terminer ;
 * `Échap` = annuler ; `Retour arrière` = retirer le dernier point. Les points s'aimantent aux
 * sommets existants, aux angles des faces de murs, aux axes de construction, à l'axe des murs
 * existants (outil Mur), à l'horizontale ou
 * la verticale du point précédent, puis à la grille ; des guides en pointillé s'affichent quand le
 * point s'aligne sur un autre point du plan (`Alt` désactive alignement, guides et raccord aux murs).
 *
 * `scale` = pixels écran par mm (pour garder une distance d'accroche constante à l'écran).
 */
export function usePolylineDrawing(tool: PolylineTool | null, scale: number) {
  // Le tracé est rattaché à son outil : changer d'outil abandonne le tracé en cours sans rien
  // remettre à zéro dans un effet (le tracé d'un autre outil est simplement ignoré).
  const wallMode = useEditorStore((state) => state.wallMode)
  const roomMode = useEditorStore((state) => state.roomMode)
  const platformMode = useEditorStore((state) => state.platformMode)
  // Mur droit et pièce rectangle : deux clics suffisent (premier point, puis point opposé).
  const rectMode =
    (tool === 'room' && roomMode === 'rectangle') ||
    (tool === 'platform' && platformMode === 'rectangle')
  // Pièce et plateforme sont des polygones fermés (même tracé).
  const polygonTool = tool === 'room' || tool === 'platform'
  const twoClicks = rectMode || (tool === 'wall' && wallMode === 'straight')
  const key =
    tool === 'wall'
      ? `wall:${wallMode}`
      : tool === 'room'
        ? `room:${roomMode}`
        : tool === 'platform'
          ? `platform:${platformMode}`
          : tool
  const [stored, setStored] = useState<StoredDraft>({ key, draft: EMPTY })
  const storedRef = useRef<StoredDraft>(stored)
  const vertexCache = useRef<{ elements: readonly CanvasElement[]; vertices: Point[] } | null>(null)
  const wallAxesCache = useRef<{ elements: readonly CanvasElement[]; axes: WallAxisSegment[] } | null>(
    null,
  )

  // Changer d'outil (y compris pour « sélection ») repart de zéro : un tracé abandonné ne doit pas
  // réapparaître au retour. Réglage d'état pendant le rendu, sans effet.
  if (stored.key !== key) setStored({ key, draft: EMPTY })
  const draft = stored.key === key ? stored.draft : EMPTY

  useEffect(() => {
    storedRef.current = stored
  }, [stored])

  /** Tracé courant, lisible depuis les gestionnaires d'événements. */
  const readDraft = useCallback((): PolylineDraft => {
    const current = storedRef.current
    return current.key === key ? current.draft : EMPTY
  }, [key])

  const setDraft = useCallback(
    (next: PolylineDraft) => {
      const value = { key, draft: next }
      storedRef.current = value
      setStored(value)
    },
    [key],
  )

  /** Sommets du plan (mis en cache : le calcul des angles de faces est coûteux). */
  const planVertices = useCallback((elements: readonly CanvasElement[]): Point[] => {
    if (vertexCache.current?.elements !== elements) {
      vertexCache.current = { elements, vertices: collectSnapVertices(elements) }
    }
    return vertexCache.current.vertices
  }, [])

  // Zones fermées par les murs : le graphe est préparé une fois par état des éléments.
  const regionCache = useRef<{ elements: readonly CanvasElement[]; finder: RegionFinder } | null>(
    null,
  )
  const lastRaw = useRef<Point | null>(null)

  /** Contour de la zone fermée par les murs du niveau actif autour de `raw`, ou `null`. */
  const regionAt = useCallback((raw: Point): Point[] | null => {
    const active = selectActiveElements(useEditorStore.getState())
    if (regionCache.current?.elements !== active) {
      const walls = active.flatMap((element) =>
        element.type === 'wall' && !element.hidden
          ? [{ points: element.points, thickness: element.thickness }]
          : [],
      )
      regionCache.current = { elements: active, finder: createRegionFinder(walls) }
    }
    return regionCache.current.finder.find(raw)
  }, [])

  /** Sommets des murs, pièces et cotes du niveau actif pour les guides d'alignement (en cache). */
  const alignCache = useRef<{ elements: readonly CanvasElement[]; targets: Point[] } | null>(null)
  const alignTargets = useCallback((elements: readonly CanvasElement[]): Point[] => {
    if (alignCache.current?.elements !== elements) {
      alignCache.current = { elements, targets: collectAlignTargets(elements) }
    }
    return alignCache.current.targets
  }, [])

  /** Axes des murs du niveau actif (mis en cache). */
  const wallAxes = useCallback((elements: readonly CanvasElement[]): WallAxisSegment[] => {
    if (wallAxesCache.current?.elements !== elements) {
      wallAxesCache.current = { elements, axes: collectSnapWallAxes(elements) }
    }
    return wallAxesCache.current.axes
  }, [])

  /** Jambages et milieux des ouvertures du niveau actif, pour coter (mis en cache). */
  const openingCache = useRef<{ elements: readonly CanvasElement[]; points: Point[] } | null>(null)
  const openingPoints = useCallback((elements: readonly CanvasElement[]): Point[] => {
    if (openingCache.current?.elements !== elements) {
      openingCache.current = { elements, points: collectOpeningSnapPoints(elements) }
    }
    return openingCache.current.points
  }, [])

  const snap = useCallback(
    (raw: Point, shift: boolean, alt: boolean) => {
      const { project } = useEditorStore.getState()
      if (!project) return { point: raw, kind: 'none' as SnapKind }
      const current = readDraft().points
      const plan = project.document.plan
      // Éléments du niveau actif, plus ceux du niveau du dessous s'il est affiché en transparence
      // (les axes valent pour tous les niveaux).
      const active = selectSnapElements(useEditorStore.getState())
      const onOpenings = tool === 'dimension' ? openingPoints(active) : undefined
      return snapPoint(raw, {
        vertices: [...planVertices(active), ...current],
        // Chaque outil attrape d'abord les sommets qui lui servent (axes pour un mur, faces
        // intérieures pour une pièce…), pour que le curseur ne saute pas entre l'axe et les faces.
        preferredVertices: tool ? preferredVertexKinds(tool) : undefined,
        // Une cote s'aimante aux bords et au milieu des portes, fenêtres et baies.
        openingPoints: onOpenings,
        axes: collectSnapAxes(active),
        // Un mur se raccorde à l'axe d'un mur existant (pas les pièces ni les cotes, qui suivent
        // les faces) ; Alt coupe cette aimantation.
        wallAxes: tool === 'wall' && !alt ? wallAxes(active) : undefined,
        // Guides d'alignement : murs et axes s'alignent sur les points d'axe des autres éléments ;
        // pièces et cotes aussi sur les angles des faces de murs. Alt coupe les guides.
        alignTargets: alt
          ? undefined
          : [
              ...(polygonTool || tool === 'dimension' ? planVertices(active) : alignTargets(active)),
              ...(onOpenings ?? []),
              ...current,
            ],
        gridSize: plan?.snapToGrid ? plan.gridSize : null,
        threshold: SNAP_THRESHOLD_PX / scale,
        // Rectangle : les deux coins sont libres (pas de direction à contraindre, sinon on
        // obtiendrait un rectangle aplati).
        from: current.length > 0 && !rectMode ? current[current.length - 1] : null,
        constrain: shift && !rectMode,
        softAlign: !alt && !rectMode,
      })
    },
    [tool, rectMode, polygonTool, planVertices, wallAxes, alignTargets, openingPoints, readDraft, scale],
  )

  const finish = useCallback(() => {
    const { points, cursor } = readDraft()
    const { project, addElement } = useEditorStore.getState()
    setDraft({ ...EMPTY, cursor })
    if (!tool || !project || points.length < (rectMode ? 2 : MIN_POINTS[tool])) return

    const { plan, levels } = project.document
    const state = useEditorStore.getState()
    const flat = flattenPoints(points)
    // Un nouveau mur prend la hauteur d'étage du niveau actif.
    const levelHeight =
      levels?.find((level) => level.id === state.activeLevelId)?.height ??
      plan?.defaultWallHeight ??
      2500

    if (rectMode && tool === 'platform') {
      const [a, b] = points
      if (!isRectangle(a, b)) return
      const name = nextElementName(fr.elements.platform, 'platform', selectActiveElements(state))
      state.addElement(createPlatformElement(name, flattenPoints(rectangleCorners(a, b))))
      return
    }
    if (rectMode) {
      const [a, b] = points
      if (!isRectangle(a, b)) return
      const active = selectActiveElements(state)
      const roomName = nextElementName(fr.elements.room, 'room', active)
      if (state.roomWithWalls) {
        const thickness = plan?.defaultWallThickness ?? 200
        const wallName = nextElementName(fr.elements.wall, 'wall', active)
        // Pièce et mur fermé en un seul pas d'historique.
        state.addElements(createRoomWithWalls(roomName, wallName, a, b, thickness, levelHeight))
      } else {
        state.addElement(createRectangleRoom(roomName, a, b))
      }
      return
    }

    if (tool === 'axis') {
      // Les axes sont communs à tous les niveaux : le repère suit la suite de tous les axes du plan.
      const axisPoints: [number, number, number, number] = [flat[0], flat[1], flat[2], flat[3]]
      const label = nextAxisLabel(project.document.elements, axisPoints)
      addElement(createAxisElement(`${fr.elements.axis} ${label}`, label, axisPoints))
      return
    }

    if (tool === 'section') {
      // Les coupes sont communes à tous les niveaux : le repère suit la suite de toutes les coupes.
      const sectionPoints: [number, number, number, number] = [flat[0], flat[1], flat[2], flat[3]]
      const label = nextSectionLabel(project.document.elements)
      addElement(createSectionElement(`${fr.elements.section} ${sectionTitle(label)}`, label, sectionPoints))
      return
    }

    const name = nextElementName(fr.elements[tool], tool, selectActiveElements(state))
    if (tool === 'wall') {
      addElement(createWallElement(name, flat, plan?.defaultWallThickness ?? 200, levelHeight))
    } else if (tool === 'platform') {
      addElement(createPlatformElement(name, flat))
    } else if (tool === 'room') {
      addElement(createRoomElement(name, flat))
    } else {
      addElement(createDimensionElement(name, [flat[0], flat[1], flat[2], flat[3]]))
    }
  }, [tool, rectMode, readDraft, setDraft])

  /** Crée une pièce sur le contour d'une zone fermée par des murs (Maj + clic). */
  const commitRegion = useCallback(
    (region: Point[]) => {
      const { addElement } = useEditorStore.getState()
      const state = useEditorStore.getState()
      const name = nextElementName(fr.elements.room, 'room', selectActiveElements(state))
      addElement(createRoomElement(name, flattenPoints(region)))
    },
    [],
  )

  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!tool) return
      const raw = event.target.getStage()?.getRelativePointerPosition()
      if (!raw) return
      const current = readDraft()
      const clicks = event.evt instanceof MouseEvent ? event.evt.detail : 1

      // Pièce, Maj et aucun point posé : un clic remplit la zone fermée sous le curseur.
      if (tool === 'room' && current.points.length === 0 && event.evt.shiftKey) {
        const region = regionAt(raw)
        if (region) commitRegion(region)
        setDraft({ ...EMPTY, cursor: raw, fillMode: true, region: null })
        return
      }

      // Double-clic : le premier clic a déjà posé le dernier point, le second termine le tracé.
      if (clicks >= 2 && current.points.length > 0 && !twoClicks) {
        finish()
        return
      }

      const { point, kind, vertexKind } = snap(raw, event.evt.shiftKey, event.evt.altKey)
      const points = current.points

      // Pièce, plateforme : un clic sur le premier point ferme le polygone.
      if (polygonTool && points.length >= 3 && samePoint(point, points[0])) {
        finish()
        return
      }
      if (points.length > 0 && samePoint(point, points[points.length - 1])) return
      // Rectangle : un coin opposé aligné sur le premier donnerait une pièce aplatie.
      if (rectMode && points.length === 1 && !isRectangle(points[0], point)) return

      setDraft({
        points: [...points, point],
        cursor: point,
        snapKind: kind,
        vertexKind: vertexKind ?? null,
        fillMode: false,
        region: null,
      })
      // Une cote, un axe, un mur droit et un rectangle n'ont que deux points.
      if (
        (tool === 'dimension' || tool === 'axis' || tool === 'section' || twoClicks) &&
        points.length + 1 === 2
      )
        finish()
    },
    [tool, rectMode, twoClicks, polygonTool, readDraft, snap, finish, setDraft, regionAt, commitRegion],
  )

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      if (!tool) return
      const raw = event.target.getStage()?.getRelativePointerPosition()
      if (!raw) return
      lastRaw.current = raw
      const current = readDraft()
      // Pièce avec Maj et aucun point posé : on survole une zone à remplir.
      if (tool === 'room' && current.points.length === 0 && event.evt.shiftKey) {
        setGuidesIfChanged([])
        setDraft({ ...current, cursor: raw, fillMode: true, region: regionAt(raw) })
        return
      }
      const { point, kind, vertexKind, guides } = snap(raw, event.evt.shiftKey, event.evt.altKey)
      setGuidesIfChanged(guides ?? [])
      setDraft({
        ...current,
        cursor: point,
        snapKind: kind,
        vertexKind: vertexKind ?? null,
        fillMode: false,
        region: null,
      })
    },
    [tool, readDraft, snap, setDraft, regionAt],
  )

  // Les guides d'alignement s'effacent quand on quitte l'outil.
  useEffect(() => {
    return () => setGuidesIfChanged([])
  }, [tool])

  // Maj enfoncée ou relâchée sans bouger la souris : l'aperçu de la zone suit tout de suite.
  useEffect(() => {
    if (tool !== 'room') return
    const onShift = (event: KeyboardEvent) => {
      if (event.key !== 'Shift' || isTypingTarget(event.target)) return
      const current = readDraft()
      const raw = lastRaw.current
      if (current.points.length > 0 || !raw) return
      if (event.type === 'keydown') {
        setDraft({ ...current, cursor: raw, fillMode: true, region: regionAt(raw) })
      } else {
        setDraft({ ...current, fillMode: false, region: null })
      }
    }
    window.addEventListener('keydown', onShift)
    window.addEventListener('keyup', onShift)
    return () => {
      window.removeEventListener('keydown', onShift)
      window.removeEventListener('keyup', onShift)
    }
  }, [tool, readDraft, setDraft, regionAt])

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
