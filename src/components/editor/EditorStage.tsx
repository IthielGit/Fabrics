import Konva from 'konva'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Ellipse, Group, Layer, Line, Rect, Stage } from 'react-konva'
import {
  createEllipseElement,
  createChimneyElement,
  createFurnitureElement,
  createLineElement,
  createRectElement,
  createTextElement,
  defaultFontSize,
  defaultShapeSize,
  defaultStrokeWidth,
  nextElementName,
} from '../../features/documents/elements'
import { drawOrder } from '../../features/documents/layers'
import { elementsOfLevel, referenceLevels } from '../../features/documents/levels'
import { boxesIntersect, distance, normalizeBox, type Box } from '../../features/geometry/box'
import { panView, wheelAction } from '../../features/geometry/navigation'
import { screenToDocument, zoomAtPoint, type Point } from '../../features/geometry/viewport'
import { computeWallJoinsOf } from '../../features/geometry/wallJoins'
import { getSymbol } from '../../features/library/catalog'
import { getPlaceable } from '../../features/library/catalog/prefabs'
import { elementsForPrefab } from '../../features/library/placeSet'
import type { Guide } from '../../features/geometry/guides'
import {
  collectSnapLines,
  mergeSnapLines,
  snapBox,
  type PlacementSnap,
} from '../../features/geometry/snapLines'
import { collectWallSides } from '../../features/library/againstWall'
import { furniturePlacement, setPlacement, type WallPose } from '../../features/library/placement'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import { FURNITURE_DRAG_TYPE } from '../library/dragType'
import { useLibraryPrefs } from '../library/useLibraryPrefs'
import { symbolName } from '../library/symbolText'
import AlignmentGuides from './AlignmentGuides'
import CalibrateDialog from './CalibrateDialog'
import CalibrationDraftLayer from './CalibrationDraftLayer'
import ElementNode from './ElementNode'
import { importImageFiles } from './importImages'
import { isTypingTarget } from './isTypingTarget'
import OpeningPreviewLayer from './OpeningPreviewLayer'
import PlanGrid from './PlanGrid'
import PolylineDraftLayer from './PolylineDraftLayer'
import SelectionTransformer from './SelectionTransformer'
import { WallJoinsContext } from './shapes/WallJoinsContext'
import FurnitureGhost from './FurnitureGhost'
import AutoDimensionsLayer from './AutoDimensionsLayer'
import PlanMarksLayer from './PlanMarksLayer'
import SurfaceHighlightLayer from './SurfaceHighlightLayer'
import ChimneyUpperGhosts from './ChimneyUpperGhosts'
import StairGhost from './StairGhost'
import StairUpperGhosts from './StairUpperGhosts'
import { planStairPlacement, planStairPlacementWithGuides } from '../../features/stairs/placement'
import {
  DEFAULT_CHIMNEY_HEIGHT_ABOVE_TOP,
  DEFAULT_CHIMNEY_SIZE,
} from '../../features/building/chimney'
import TextEditorOverlay from './TextEditorOverlay'
import { setThumbnailStage } from './thumbnail'
import { useCalibrationTool } from './useCalibrationTool'
import { useContainerSize } from './useContainerSize'
import { useElementInteractions } from './useElementInteractions'
import { useOpeningTool, type OpeningToolKind } from './useOpeningTool'
import { usePanDrag } from './usePanDrag'
import { useTouchGestures } from './useTouchGestures'
import { usePolylineDrawing, type PolylineTool } from './usePolylineDrawing'
import { useStretchTool } from './useStretchTool'
import StretchDraftLayer from './StretchDraftLayer'
import VertexHandles from './VertexHandles'

// Seul le bouton gauche déplace un élément : le bouton du milieu sert à déplacer la vue.
Konva.dragButtons = [0]

/** Opacité du niveau de référence (le niveau du dessous), affiché en transparence. */
const REFERENCE_OPACITY = 0.3
/** En dessous de cette taille (px écran), un tracé ou une sélection est un simple clic. */
const MIN_DRAG_PX = 4
/** Distance d'accroche d'un objet posé sur les murs et éléments voisins, en pixels écran. */
const PLACEMENT_SNAP_PX = 8
/** Distance (px écran) à partir de laquelle un objet mural se colle à une face de mur. */
const WALL_REACH_PX = 28

type PointerEvent = Konva.KonvaEventObject<MouseEvent | TouchEvent>

interface Gesture {
  start: Point
  current: Point
  /** Maj enfoncée au départ : le rectangle de sélection s'ajoute à la sélection existante. */
  additive: boolean
}

interface EditorStageProps {
  /** Lecture seule (page de partage) : on peut déplacer la vue et zoomer, mais rien ne se sélectionne ni ne se modifie. */
  readOnly?: boolean
}

export default function EditorStage({ readOnly = false }: EditorStageProps) {
  const project = useEditorStore((state) => state.project)
  const zoom = useEditorStore((state) => state.zoom)
  const stagePosition = useEditorStore((state) => state.stagePosition)
  const activeTool = useEditorStore((state) => state.activeTool)
  const furnitureSymbolId = useEditorStore((state) => state.furnitureSymbolId)
  const setView = useEditorStore((state) => state.setView)
  const setViewportSize = useEditorStore((state) => state.setViewportSize)
  const fitView = useEditorStore((state) => state.fitView)
  const addElement = useEditorStore((state) => state.addElement)
  const addElements = useEditorStore((state) => state.addElements)
  const setTool = useEditorStore((state) => state.setTool)
  const setSelection = useEditorStore((state) => state.setSelection)
  const setGuides = useEditorStore((state) => state.setGuides)
  const editingTextId = useEditorStore((state) => state.editingTextId)
  const startEditingText = useEditorStore((state) => state.startEditingText)
  const commitTextEdit = useEditorStore((state) => state.commitTextEdit)
  const stopEditingText = useEditorStore((state) => state.stopEditingText)
  const elementHandlers = useElementInteractions()
  // Éléments du niveau actif : ce que l'on voit net, sélectionne et modifie.
  const activeElements = useEditorStore(selectActiveElements)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const showLowerLevel = useEditorStore((state) => state.showLowerLevel)
  const showUpperLevel = useEditorStore((state) => state.showUpperLevel)
  const levels = project?.document.levels
  const allElements = project?.document.elements
  // Niveaux de référence : les éléments du niveau du dessous et, si demandé, du dessus, en
  // transparence, sans interaction.
  const referenceElements = useMemo(() => {
    if (!allElements) return []
    return referenceLevels(levels, activeLevelId, showLowerLevel, showUpperLevel).flatMap((level) =>
      elementsOfLevel(allElements, level.id),
    )
  }, [showLowerLevel, showUpperLevel, levels, allElements, activeLevelId])
  // Raccords d'angle des murs (niveau actif et niveau de référence séparément).
  const wallJoins = useMemo(() => computeWallJoinsOf(activeElements), [activeElements])
  const referenceWallJoins = useMemo(() => computeWallJoinsOf(referenceElements), [referenceElements])
  // Lignes d'aimantation des poses : faces et axes des murs, contours et emprises du niveau actif,
  // et du niveau du dessous quand il est affiché en transparence.
  // Murs du niveau actif, contre lesquels un objet mural (WC, lavabo, meuble de cuisine…) se colle.
  const wallSides = useMemo(() => collectWallSides(activeElements), [activeElements])
  const planSnapTargets = useMemo(
    () => mergeSnapLines(collectSnapLines(activeElements), collectSnapLines(referenceElements)),
    [activeElements, referenceElements],
  )

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>()
  const [spaceDown, setSpaceDown] = useState(false)
  const panDrag = usePanDrag()
  // Tracé d'une forme (outils rectangle / ellipse)
  const [draft, setDraft] = useState<Gesture | null>(null)
  // Rectangle de sélection (outil Sélection)
  const [band, setBand] = useState<Gesture | null>(null)
  // Position du curseur sur le plan pendant la pose d'un objet (aperçu fantôme)
  const [ghostPoint, setGhostPoint] = useState<Point | null>(null)
  const fittedProjectId = useRef<string | null>(null)

  const projectId = project?.id ?? null
  // Pixels écran par unité du document (les hooks ci-dessous doivent précéder le `return` anticipé).
  const unitScale = pxPerUnit(project?.document.unit ?? 'px')
  // Tablette : deux doigts = déplacer et zoomer ; le tracé d'un seul doigt en cours est abandonné.
  const cancelGestures = useCallback(() => {
    setDraft(null)
    setBand(null)
  }, [])
  useTouchGestures(containerRef, unitScale, cancelGestures)
  const scale = zoom * unitScale
  // Formes tracées au glisser (rectangle, ellipse, ligne, texte).
  const drawing =
    activeTool === 'rect' ||
    activeTool === 'ellipse' ||
    activeTool === 'line' ||
    activeTool === 'text'
  // Tracés point par point du plan : mur, pièce, cote, axe.
  const polylineTool: PolylineTool | null =
    activeTool === 'wall' ||
    activeTool === 'room' ||
    activeTool === 'platform' ||
    activeTool === 'roof' ||
    activeTool === 'dimension' ||
    activeTool === 'axis' ||
    activeTool === 'section'
      ? activeTool
      : null
  const polylineDrawing = usePolylineDrawing(polylineTool, scale)
  const calibration = useCalibrationTool(activeTool === 'calibrate')
  const stretch = useStretchTool(activeTool === 'stretch', scale)
  // Pose de portes et de fenêtres sur les murs.
  const openingKind: OpeningToolKind | null =
    activeTool === 'door' || activeTool === 'window' ? activeTool : null
  const openingTool = useOpeningTool(openingKind, scale)
  const selecting = activeTool === 'select' && !spaceDown && !readOnly

  // Communique la taille de la zone au store, et ajuste la page à l'écran à l'ouverture.
  useEffect(() => {
    setViewportSize(size)
    if (projectId && size.width > 0 && fittedProjectId.current !== projectId) {
      fittedProjectId.current = projectId
      fitView()
    }
  }, [size, projectId, setViewportSize, fitView])

  // Espace + glisser = déplacer la vue. Échap annule un tracé en cours.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.code === 'Space') {
        event.preventDefault()
        setSpaceDown(true)
      } else if (event.key === 'Escape') {
        setDraft(null)
        setBand(null)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceDown(false)
    }
    const onBlur = () => setSpaceDown(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  if (!project) return null
  const { page, unit } = project.document
  const elements = activeElements
  // Pas de la grille d'aimantation d'un plan (`null` si l'aimantation est désactivée).
  const furnitureGrid = project.document.plan?.snapToGrid ? project.document.plan.gridSize : null
  const wallPose: WallPose = { walls: wallSides, reach: WALL_REACH_PX / scale }
  const placementSnap: PlacementSnap = {
    targets: planSnapTargets,
    threshold: PLACEMENT_SNAP_PX / scale,
    grid: furnitureGrid,
  }

  /** Guides d'alignement de l'aperçu de pose (objet, ensemble ou escalier) sous le curseur. */
  const placementGuides = (point: Point | null): Guide[] => {
    if (!point) return []
    const state = useEditorStore.getState()
    if (activeTool === 'stair') {
      return (
        planStairPlacementWithGuides(
          project.document.levels,
          state.activeLevelId,
          state.stairShape,
          point,
          placementSnap,
          '',
        )?.guides ?? []
      )
    }
    if (activeTool === 'chimney') {
      return chimneyPlacement(point).guides
    }
    const id = state.furnitureSymbolId
    if (activeTool !== 'furniture' || !id) return []
    const set = getPlaceable(id)
    if (set) return setPlacement(set, point, placementSnap).guides
    const def = getSymbol(id)
    return def ? furniturePlacement(def, point, placementSnap, wallPose).guides : []
  }

  /** Coin haut-gauche d'une cheminée de taille par défaut posée sous `point`. */
  const chimneyPlacement = (point: Point) => {
    const size = DEFAULT_CHIMNEY_SIZE
    return snapBox({ x: point.x - size / 2, y: point.y - size / 2, width: size, height: size }, placementSnap)
  }

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault()
    const pointer = event.target.getStage()?.getPointerPosition()
    if (!pointer) return
    const { deltaX, deltaY, deltaMode, ctrlKey, shiftKey } = event.evt
    const action = wheelAction({ deltaX, deltaY, deltaMode, ctrlKey, shiftKey })
    if (!action) return
    const view = { zoom, x: stagePosition.x, y: stagePosition.y }
    // Glissement à deux doigts ou Maj + molette : on déplace la vue ; sinon on zoome vers le curseur.
    const next =
      action.kind === 'pan'
        ? panView(view, action.dx, action.dy)
        : zoomAtPoint(view, pointer, zoom * action.factor, unitScale)
    setView({ zoom: next.zoom, stagePosition: { x: next.x, y: next.y } })
  }

  const handleDragEnd = (event: Konva.KonvaEventObject<DragEvent>) => {
    // Les glissers d'éléments remontent jusqu'ici : seul le déplacement de la vue nous concerne.
    if (event.target !== event.target.getStage()) return
    setView({ zoom, stagePosition: { x: event.target.x(), y: event.target.y() } })
  }

  const pointerInDocument = (event: PointerEvent) =>
    event.target.getStage()?.getRelativePointerPosition() ?? null

  /**
   * Pose un objet de la bibliothèque, centré sur `point` (aimanté à la grille si elle est active) :
   * celui qu'on a choisi dans le panneau, ou `symbolId` (objet déposé par glisser-déposer).
   */
  const placeFurniture = (point: Point, symbolId?: string) => {
    const id = symbolId ?? useEditorStore.getState().furnitureSymbolId
    if (!id) return
    const set = getPlaceable(id)
    if (set) {
      // Un ensemble ou une pièce préfabriquée : tous ses éléments d'un coup (un seul pas
      // d'historique), centré sur le point.
      const existing = new Map<string, number>()
      for (const el of elements) {
        if (el.type === 'furniture') existing.set(el.symbol, (existing.get(el.symbol) ?? 0) + 1)
      }
      const origin = setPlacement(set, point, placementSnap)
      const state = useEditorStore.getState()
      const wallHeight =
        project.document.levels?.find((level) => level.id === state.activeLevelId)?.height ??
        project.document.plan?.defaultWallHeight ??
        2500
      addElements(
        elementsForPrefab(set, origin, wallHeight, {
          nameOf: symbolName,
          existing,
          roomName: symbolName(set.id),
          wallName: nextElementName(fr.elements.wall, 'wall', elements),
          openingName: (kind) => fr.elements[kind],
        }),
      )
      useLibraryPrefs.getState().addRecent(set.id)
      return
    }
    const def = getSymbol(id)
    if (!def) return
    const { x, y, rotation } = furniturePlacement(def, point, placementSnap, wallPose)
    const count = elements.filter((el) => el.type === 'furniture' && el.symbol === def.id).length
    addElement({
      ...createFurnitureElement(`${symbolName(def.id)} ${count + 1}`, def.id, x, y, def.width, def.depth),
      rotation: rotation ?? 0,
    }) // l'objet posé devient la sélection ; l'outil reste actif pour en poser d'autres
    useLibraryPrefs.getState().addRecent(def.id)
  }

  /** Pose une cheminée de taille par défaut sous `point` (aimantée aux murs voisins, sinon à la grille). */
  const placeChimney = (point: Point) => {
    const size = DEFAULT_CHIMNEY_SIZE
    const { x, y } = chimneyPlacement(point)
    addElement(
      createChimneyElement(
        nextElementName(fr.elements.chimney, 'chimney', elements),
        x,
        y,
        size,
        size,
        DEFAULT_CHIMNEY_HEIGHT_ABOVE_TOP,
      ),
    ) // la cheminée posée devient la sélection ; l'outil reste actif
  }

  /** Pose un escalier centré sur `point` ; refusé s'il n'y a pas de niveau au-dessus du niveau actif. */
  const placeStair = (point: Point) => {
    const state = useEditorStore.getState()
    const stair = planStairPlacement(
      project.document.levels,
      state.activeLevelId,
      state.stairShape,
      point,
      placementSnap,
      nextElementName(fr.elements.stair, 'stair', elements),
    )
    if (!stair) {
      state.setNotice(fr.stairs.lastLevelRefused)
      return
    }
    addElement(stair) // l'escalier posé devient la sélection ; l'outil reste actif
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (readOnly) return // la vue se déplace par le glisser de la scène
    // Clic molette maintenu : déplace la vue, quel que soit l'outil.
    if (event.evt instanceof MouseEvent && event.evt.button === 1) {
      panDrag.start(event.evt)
      return
    }
    if (spaceDown) return
    if (event.evt instanceof MouseEvent && event.evt.button !== 0) return
    const point = pointerInDocument(event)
    if (!point) return

    if (polylineTool) {
      polylineDrawing.onPointerDown(event)
    } else if (activeTool === 'calibrate') {
      calibration.onPointerDown(event)
    } else if (activeTool === 'stretch') {
      stretch.onPointerDown(event)
    } else if (openingKind) {
      openingTool.onPointerDown(event)
    } else if (activeTool === 'furniture') {
      placeFurniture(point)
    } else if (activeTool === 'stair') {
      placeStair(point)
    } else if (activeTool === 'chimney') {
      placeChimney(point)
    } else if (drawing) {
      setDraft({ start: point, current: point, additive: false })
    } else if (activeTool === 'select') {
      // Un clic sur un élément est géré par l'élément lui-même ; un clic sur une poignée du
      // transformateur ne doit pas non plus démarrer de sélection : seul le vide compte.
      const onEmptyArea =
        event.target === event.target.getStage() || event.target.name() === 'page'
      if (!onEmptyArea) return
      setBand({ start: point, current: point, additive: event.evt.shiftKey })
    }
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (polylineTool) polylineDrawing.onPointerMove(event)
    if (activeTool === 'calibrate') calibration.onPointerMove(event)
    if (activeTool === 'stretch') stretch.onPointerMove(event)
    if (openingKind) openingTool.onPointerMove(event)
    if (activeTool === 'furniture' || activeTool === 'stair' || activeTool === 'chimney') {
      const ghost = pointerInDocument(event)
      if (activeTool !== 'chimney') setGhostPoint(ghost)
      setGuides(placementGuides(ghost))
    }
    if (!draft && !band) return
    const point = pointerInDocument(event)
    if (!point) return
    if (draft) setDraft({ ...draft, current: point })
    if (band) setBand({ ...band, current: point })
  }

  const finishDraft = (gesture: Gesture) => {
    if (activeTool === 'text') {
      // Un clic pose un texte à cet endroit et ouvre directement la saisie.
      const fontSize = defaultFontSize(unit)
      const text = createTextElement(
        nextElementName(fr.elements.text, 'text', elements),
        gesture.start.x,
        gesture.start.y,
        fr.elements.defaultText,
        fontSize,
      )
      addElement(text)
      startEditingText(text.id)
      return
    }
    if (activeTool === 'line') {
      const isClick = distance(gesture.start, gesture.current) * scale < MIN_DRAG_PX
      const side = defaultShapeSize(unit)
      const dx = isClick ? side : gesture.current.x - gesture.start.x
      const dy = isClick ? 0 : gesture.current.y - gesture.start.y
      addElement(
        createLineElement(
          nextElementName(fr.elements.line, 'line', elements),
          gesture.start.x,
          gesture.start.y,
          dx,
          dy,
          defaultStrokeWidth(unit),
        ),
      )
      setTool('select')
      return
    }
    if (activeTool !== 'rect' && activeTool !== 'ellipse') return
    const dragged = normalizeBox(gesture.start, gesture.current)
    const isClick = Math.min(dragged.width, dragged.height) * scale < MIN_DRAG_PX
    const side = defaultShapeSize(unit)
    const box: Box = isClick
      ? {
          x: gesture.start.x - side / 2,
          y: gesture.start.y - side / 2,
          width: side,
          height: side,
        }
      : dragged

    const element =
      activeTool === 'rect'
        ? createRectElement(
            nextElementName(fr.elements.rect, 'rect', elements),
            box.x,
            box.y,
            box.width,
            box.height,
          )
        : createEllipseElement(
            nextElementName(fr.elements.ellipse, 'ellipse', elements),
            box.x,
            box.y,
            box.width,
            box.height,
          )
    addElement(element) // l'élément créé devient la sélection
    setTool('select')
  }

  const finishBand = (gesture: Gesture, stage: Konva.Stage) => {
    const { selectedIds } = useEditorStore.getState()
    if (distance(gesture.start, gesture.current) * scale < MIN_DRAG_PX) {
      // Simple clic dans le vide : on désélectionne (sauf avec Maj).
      if (!gesture.additive) setSelection([])
      return
    }
    const bandBox = normalizeBox(gesture.start, gesture.current)
    const hitIds = Array.from(stage.find('.element'))
      .filter((node) => node.isVisible() && node.listening())
      .filter((node) =>
        boxesIntersect(bandBox, node.getClientRect({ relativeTo: node.getLayer() ?? undefined })),
      )
      .map((node) => node.id())
    setSelection(gesture.additive ? [...new Set([...selectedIds, ...hitIds])] : hitIds)
  }

  const handlePointerUp = (event: PointerEvent) => {
    const stage = event.target.getStage()
    if (activeTool === 'stretch') stretch.onPointerUp()
    if (draft) {
      setDraft(null)
      finishDraft(draft)
    }
    if (band) {
      setBand(null)
      if (stage) finishBand(band, stage)
    }
  }

  const editingElement = elements.find((el) => el.id === editingTextId)
  const draftBox = draft ? normalizeBox(draft.start, draft.current) : null
  const bandBox = band ? normalizeBox(band.start, band.current) : null
  const cursor = panDrag.panning
    ? 'grabbing'
    : spaceDown
      ? 'grab'
      : activeTool !== 'select'
        ? 'crosshair'
        : 'default'

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-slate-200"
      style={{ cursor, touchAction: 'none' }}
      onDragOver={(event) => {
        // Autorise le dépôt de fichiers (sans cela le navigateur ouvrirait l'image) et d'un objet
        // de la bibliothèque.
        const types = event.dataTransfer.types
        if (types.includes('Files') || types.includes(FURNITURE_DRAG_TYPE)) event.preventDefault()
      }}
      onDrop={(event) => {
        if (readOnly) {
          event.preventDefault()
          return
        }
        const symbolId = event.dataTransfer.getData(FURNITURE_DRAG_TYPE)
        if (symbolId === '' && event.dataTransfer.files.length === 0) return
        event.preventDefault()
        const bounds = event.currentTarget.getBoundingClientRect()
        const dropPoint = screenToDocument(
          { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
          { zoom, x: stagePosition.x, y: stagePosition.y },
          unitScale,
        )
        if (symbolId !== '') {
          // Un objet glissé depuis la bibliothèque : posé là où on le dépose (un plan seulement).
          if (project.kind === 'plan') placeFurniture(dropPoint, symbolId)
          return
        }
        void importImageFiles(Array.from(event.dataTransfer.files), dropPoint)
      }}
    >
      {size.width > 0 && (
        <Stage
          ref={setThumbnailStage}
          width={size.width}
          height={size.height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={scale}
          scaleY={scale}
          draggable={spaceDown || readOnly}
          onWheel={handleWheel}
          onDragEnd={handleDragEnd}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          onMouseLeave={(event) => {
            setGhostPoint(null)
            if (activeTool === 'furniture' || activeTool === 'stair' || activeTool === 'chimney') {
              setGuides([])
            }
            handlePointerUp(event)
          }}
        >
          <Layer>
            <Rect
              name="page"
              x={0}
              y={0}
              width={page.width}
              height={page.height}
              fill={page.background}
              stroke="#94a3b8"
              strokeWidth={1 / scale}
            />
            {project.document.plan && (
              <PlanGrid
                pageWidth={page.width}
                pageHeight={page.height}
                gridSize={project.document.plan.gridSize}
                scale={scale}
              />
            )}
            {referenceElements.length > 0 && (
              <Group name="reference" listening={false} opacity={REFERENCE_OPACITY}>
                <WallJoinsContext.Provider value={referenceWallJoins}>
                  {drawOrder(referenceElements).map((element) => (
                    <ElementNode
                      key={element.id}
                      element={element}
                      interactive={false}
                      viewScale={scale}
                    />
                  ))}
                </WallJoinsContext.Provider>
              </Group>
            )}
            <StairUpperGhosts scale={scale} />
            <ChimneyUpperGhosts scale={scale} />
            <WallJoinsContext.Provider value={wallJoins}>
              {drawOrder(elements).map((element) => (
                <ElementNode
                  key={element.id}
                  element={element}
                  interactive={selecting}
                  viewScale={scale}
                  editing={element.id === editingTextId}
                  {...elementHandlers}
                />
              ))}
            </WallJoinsContext.Provider>
            <AutoDimensionsLayer scale={scale} />
            <PlanMarksLayer scale={scale} />
            <SurfaceHighlightLayer scale={scale} />
            <SelectionTransformer enabled={selecting && editingTextId === null} />
            <VertexHandles enabled={selecting && editingTextId === null} scale={scale} />
          </Layer>
          <Layer listening={false}>
            {draftBox && activeTool === 'rect' && (
              <Rect
                {...draftBox}
                fill="rgba(99,102,241,0.15)"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
                dash={[6 / scale, 4 / scale]}
              />
            )}
            {draftBox && activeTool === 'ellipse' && (
              <Ellipse
                x={draftBox.x + draftBox.width / 2}
                y={draftBox.y + draftBox.height / 2}
                radiusX={draftBox.width / 2}
                radiusY={draftBox.height / 2}
                fill="rgba(99,102,241,0.15)"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
                dash={[6 / scale, 4 / scale]}
              />
            )}
            {draft && activeTool === 'line' && (
              <Line
                points={[draft.start.x, draft.start.y, draft.current.x, draft.current.y]}
                stroke="#4f46e5"
                strokeWidth={2 / scale}
                dash={[6 / scale, 4 / scale]}
              />
            )}
            <AlignmentGuides pageWidth={page.width} pageHeight={page.height} scale={scale} />
            {activeTool === 'calibrate' && (
              <CalibrationDraftLayer state={calibration.state} scale={scale} />
            )}
            {activeTool === 'stretch' && (
              <StretchDraftLayer state={stretch.state} preview={stretch.preview} scale={scale} />
            )}
            {openingKind && <OpeningPreviewLayer preview={openingTool.preview} scale={scale} />}
            {activeTool === 'stair' && ghostPoint && (
              <StairGhost point={ghostPoint} snap={placementSnap} scale={scale} />
            )}
            {activeTool === 'furniture' && ghostPoint && furnitureSymbolId && (
              <FurnitureGhost
                symbolId={furnitureSymbolId}
                point={ghostPoint}
                snap={placementSnap}
                scale={scale}
                wall={wallPose}
              />
            )}
            {polylineTool && (
              <PolylineDraftLayer
                tool={polylineTool}
                draft={polylineDrawing.draft}
                scale={scale}
                wallThickness={project.document.plan?.defaultWallThickness ?? 200}
              />
            )}
            {bandBox && (
              <Rect
                {...bandBox}
                fill="rgba(79,70,229,0.08)"
                stroke="#4f46e5"
                strokeWidth={1 / scale}
              />
            )}
          </Layer>
        </Stage>
      )}
      {calibration.state.pending && (
        <CalibrateDialog onConfirm={calibration.confirm} onCancel={calibration.cancel} />
      )}
      {editingElement?.type === 'text' && (
        <TextEditorOverlay
          key={editingElement.id}
          element={editingElement}
          scale={scale}
          stagePosition={stagePosition}
          onCommit={(text) => commitTextEdit(editingElement.id, text)}
          onCancel={() => {
            // Échap : on abandonne la saisie ; un texte tout juste créé garde son texte par défaut.
            stopEditingText()
          }}
        />
      )}
    </div>
  )
}
