import { create } from 'zustand'
import { cloneElements, duplicateOffset } from '../features/documents/elements'
import { copyToClipboard, takePasteCopies } from '../features/documents/clipboard'
import { clampPageDimension } from '../features/documents/pageSize'
import { defaultPresets, type OpeningPreset } from '../features/openings/styles'
import { moveElementToSlot, sameOrder, stepElement } from '../features/documents/layers'
import {
  copyLevelWalls,
  elementsOfLevel,
  elementsOnLevel,
  insertLevelAbove,
  levelBelow,
  isLevelIndependent,
  moveLevel as moveLevelInList,
  newTopLevel,
  nextLevelName,
  removeLevel as removeLevelFromList,
  updateLevel as updateLevelInList,
  validActiveLevelId,
  type LevelPatch,
} from '../features/documents/levels'
import {
  includeWallOpenings,
  reconcileOpenings,
  withWallOpeningIds,
} from '../features/documents/wallOpenings'
import { fr } from '../i18n/fr'
import type { Guide } from '../features/geometry/guides'
import type { Box } from '../features/geometry/box'
import { resizeBlock } from '../features/geometry/resizeBlock'
import { splitWallInDocument } from '../features/geometry/splitWall'
import { stretchZone } from '../features/geometry/stretchZone'
import { translateElement } from '../features/geometry/transform'
import { fitToScreen, type Size } from '../features/geometry/viewport'
import { pxPerUnit } from '../features/units/scale'
import type { CanvasElement, FabricsDocument, PlanSettings, Project, RoofShape } from '../types/document'

export type EditorTool =
  | 'select'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'text'
  | 'wall'
  | 'room'
  | 'platform'
  | 'roof'
  | 'stair'
  | 'chimney'
  | 'dimension'
  | 'axis'
  | 'section'
  | 'stretch'
  | 'furniture'
  | 'door'
  | 'window'
  | 'calibrate'

/** Outils qui n'existent que dans un projet de type Plan. */
export const PLAN_TOOLS: readonly EditorTool[] = [
  'wall',
  'room',
  'platform',
  'roof',
  'stair',
  'chimney',
  'dimension',
  'axis',
  'section',
  'stretch',
  'furniture',
  'door',
  'window',
  'calibrate',
]

export function isPlanTool(tool: EditorTool): boolean {
  return PLAN_TOOLS.includes(tool)
}
export type WallMode = 'polyline' | 'straight'
export type RoomMode = 'polygon' | 'rectangle'
export type PlatformMode = 'polygon' | 'rectangle'
/** Tracé d'un toit plat ; un toit en pente se trace toujours en rectangle. */
export type RoofMode = 'polygon' | 'rectangle'
export type StairShapeChoice = 'straight' | 'l' | 'u'
export type SidePanelTab = 'properties' | 'library' | 'layers' | 'measurements'
export type SaveStatus = 'saved' | 'saving' | 'error'

export const HISTORY_LIMIT = 100
/** Des appuis rapprochés sur les flèches comptent pour un seul état d'historique. */
export const NUDGE_MERGE_MS = 600

interface History {
  past: FabricsDocument[]
  future: FabricsDocument[]
}

interface EditorState {
  project: Project | null
  selectedIds: string[]
  activeTool: EditorTool
  /** Objet de la bibliothèque en cours de pose (outil `furniture`) ; état d'interface, hors historique. */
  furnitureSymbolId: string | null
  /** Onglet ouvert du panneau de droite ; état d'interface. */
  sidePanelTab: SidePanelTab
  /** Mode de l'outil Mur : tracé en polyligne ou mur droit (2 clics) ; état d'interface. */
  wallMode: WallMode
  /** Mode de l'outil Pièce : polygone libre ou rectangle (2 clics) ; état d'interface. */
  roomMode: RoomMode
  /** Forme de l'escalier posé par l'outil Escalier ; état d'interface. */
  stairShape: StairShapeChoice
  /** Mode de l'outil Plateforme : polygone libre ou rectangle (2 clics) ; état d'interface. */
  platformMode: PlatformMode
  /** Mode Rectangle : crée aussi un mur fermé autour de la pièce. */
  roomWithWalls: boolean
  /** Forme et tracé de la prochaine toiture (outil Toiture) ; état d'interface. */
  roofShape: RoofShape
  roofMode: RoofMode
  setRoofShape: (shape: RoofShape) => void
  setRoofMode: (mode: RoofMode) => void
  /** Style et taille posés par les outils Porte et Fenêtre ; état d'interface, hors historique. */
  openingPresets: Record<'door' | 'window', OpeningPreset>
  setOpeningPreset: (kind: 'door' | 'window', preset: OpeningPreset) => void
  /** Texte en cours d'édition dans la zone de saisie superposée (état d'interface, pas du document). */
  editingTextId: string | null
  /** Niveau affiché et modifiable (plans uniquement) ; état d'interface, hors historique. */
  activeLevelId: string | null
  /** Affiche le niveau du dessous en transparence (calque de référence). */
  showLowerLevel: boolean
  /** Message affiché à l'utilisateur (par exemple un fichier refusé). */
  notice: string | null
  /** Guides d'alignement affichés pendant un déplacement (état d'interface, pas du document). */
  guides: Guide[]
  zoom: number
  stagePosition: { x: number; y: number }
  /** Taille de la zone d'affichage du canevas (px), renseignée par le composant Stage. */
  viewportSize: Size
  history: History
  saveStatus: SaveStatus
  /** Augmente à chaque modification du document (sert à déclencher la sauvegarde). */
  revision: number

  loadProject: (project: Project) => void
  closeProject: () => void
  setTool: (tool: EditorTool) => void
  /** Choisit un objet de la bibliothèque et active l'outil de pose (sans effet dans un visuel). */
  startPlacingFurniture: (symbolId: string) => void
  setSidePanelTab: (tab: SidePanelTab) => void
  setWallMode: (mode: WallMode) => void
  setRoomMode: (mode: RoomMode) => void
  setPlatformMode: (mode: PlatformMode) => void
  setStairShape: (shape: StairShapeChoice) => void
  setRoomWithWalls: (withWalls: boolean) => void
  setNotice: (notice: string | null) => void
  setGuides: (guides: Guide[]) => void
  startEditingText: (id: string) => void
  stopEditingText: () => void
  /** Valide le texte saisi : un seul état d'historique ; un texte vidé supprime l'élément. */
  commitTextEdit: (id: string, text: string) => void
  setSelection: (ids: string[]) => void
  setView: (view: { zoom: number; stagePosition: { x: number; y: number } }) => void
  setViewportSize: (size: Size) => void
  /** Ajuste le zoom et la position pour voir toute la page. */
  fitView: () => void
  setSaveStatus: (status: SaveStatus) => void
  renameProject: (name: string) => void

  /** Change de niveau : la sélection est vidée (on ne sélectionne que sur le niveau actif). */
  setActiveLevel: (id: string) => void
  setShowLowerLevel: (show: boolean) => void
  /** Ajoute un niveau au sommet du bâtiment et l'affiche. */
  addLevel: () => void
  /** Copie un niveau (ses murs et leurs ouvertures) juste au-dessus de lui et l'affiche. */
  duplicateLevel: (id: string) => void
  updateLevel: (id: string, patch: LevelPatch) => void
  moveLevel: (id: string, direction: 'up' | 'down') => void
  /** Supprime un niveau et ses éléments (le dernier niveau ne se supprime pas). */
  removeLevel: (id: string) => void

  addElement: (element: CanvasElement) => void
  /** Ajoute plusieurs éléments d'un coup (un ensemble de la bibliothèque) : un seul état d'historique, ils deviennent la sélection. */
  addElements: (elements: CanvasElement[]) => void
  /** Remplace des éléments (par identifiant) : un seul état d'historique par appel. */
  replaceElements: (elements: CanvasElement[]) => void
  updateElements: (ids: string[], updater: (element: CanvasElement) => CanvasElement) => void
  /**
   * Redimensionne la sélection comme un bloc (pièce + murs + ouvertures + meubles) à `width × depth`
   * mm : un seul pas d'historique. Renvoie le nombre d'ouvertures retirées, ou `null` si rien n'a
   * été fait (sélection sans mur ni pièce, taille invalide).
   */
  resizeSelectionBlock: (width: number, depth: number) => number | null
  /**
   * Étire la zone `zone` de `delta` mm (outil Étirer, voir `stretchZone`) sur le niveau actif, en un
   * seul pas d'historique. Renvoie le nombre d'ouvertures retirées (elles ne tenaient plus sur leur
   * mur raccourci), ou `null` si rien n'a changé.
   */
  stretchZoneBy: (zone: Box, delta: { x: number; y: number }) => number | null
  /**
   * Sépare un mur à plusieurs côtés en un mur par côté (voir `splitWallInDocument`) : un seul pas
   * d'historique, les nouveaux murs deviennent la sélection. `null` si rien à séparer.
   */
  splitWall: (id: string) => { count: number; removedOpenings: number } | null
  removeElements: (ids: string[]) => void
  duplicateElements: (ids: string[]) => void
  /**
   * Geste en direct (par exemple glisser un sommet) : `beginLiveEdit` mémorise l'état de départ,
   * `liveReplaceElements` met à jour le document à chaque mouvement sans toucher à l'historique,
   * `endLiveEdit` empile l'état de départ une seule fois (annuler revient avant le geste).
   */
  beginLiveEdit: () => void
  liveReplaceElements: (elements: CanvasElement[]) => void
  endLiveEdit: () => void
  /** Modifie les réglages du plan (échelle, grille, murs par défaut) ; sans effet dans un visuel. */
  updatePlanSettings: (patch: Partial<PlanSettings>) => void
  /** Change la taille de la page (dans les limites de l'unité) ; les éléments ne bougent pas. */
  setPageSize: (width: number, height: number) => void
  /** Sélectionne tout ce qui est visible et déverrouillé. */
  selectAll: () => void
  copySelection: () => void
  pasteClipboard: () => void
  /** Déplace la sélection (éléments verrouillés exclus) ; les appuis rapprochés sont fusionnés. */
  nudgeSelection: (dx: number, dy: number, now?: number) => void
  /** Déplace un élément à un emplacement de la liste des calques (voir `moveElementToSlot`). */
  reorderElement: (id: string, slot: number) => void
  /** Monte ou descend un élément d'un cran dans l'ordre d'affichage. */
  stepElementOrder: (id: string, direction: 'up' | 'down') => void
  undo: () => void
  redo: () => void
}

const EMPTY_HISTORY: History = { past: [], future: [] }
const NO_ELEMENTS: readonly CanvasElement[] = []

// Dernier résultat de `selectActiveElements` : même tableau tant que ni le document ni le niveau
// ne changent (un sélecteur Zustand doit renvoyer une valeur stable).
let activeCache: {
  elements: readonly CanvasElement[]
  levelId: string
  result: readonly CanvasElement[]
} | null = null

/**
 * Éléments du niveau actif (et ceux communs à tous les niveaux). Pour un visuel, tous les éléments.
 * C'est ce que l'utilisateur voit, sélectionne et modifie : outils, calques, aimantation.
 */
export function selectActiveElements(state: {
  project: Project | null
  activeLevelId: string | null
}): readonly CanvasElement[] {
  const elements = state.project?.document.elements
  if (!elements) return NO_ELEMENTS
  const levelId = state.activeLevelId
  if (levelId === null) return elements
  if (activeCache?.elements === elements && activeCache.levelId === levelId) {
    return activeCache.result
  }
  const result = elementsOnLevel(elements, levelId)
  activeCache = { elements, levelId, result }
  return result
}

let snapCache: {
  active: readonly CanvasElement[]
  elements: readonly CanvasElement[]
  belowId: string | null
  result: readonly CanvasElement[]
} | null = null

/**
 * Éléments qui attirent le tracé et les déplacements : ceux du niveau actif, plus ceux du niveau
 * du dessous quand il est affiché en transparence (pour aligner un étage sur celui d'en dessous).
 * Même référence tant que rien ne change (les calculs d'aimantation sont mis en cache dessus).
 */
export function selectSnapElements(state: {
  project: Project | null
  activeLevelId: string | null
  showLowerLevel: boolean
}): readonly CanvasElement[] {
  const active = selectActiveElements(state)
  const document = state.project?.document
  const below =
    state.showLowerLevel && document?.levels && state.activeLevelId !== null
      ? levelBelow(document.levels, state.activeLevelId)
      : undefined
  if (!below || !document) return active
  if (
    snapCache?.active === active &&
    snapCache.elements === document.elements &&
    snapCache.belowId === below.id
  ) {
    return snapCache.result
  }
  const result = [...active, ...elementsOfLevel(document.elements, below.id)]
  snapCache = { active, elements: document.elements, belowId: below.id, result }
  return result
}

// Document au début d'un geste en direct (voir `beginLiveEdit`).
let liveBase: FabricsDocument | null = null

// Dernier déplacement par les flèches (pour fusionner les appuis rapprochés).
let lastNudge: { key: string; at: number; revision: number } | null = null

export const useEditorStore = create<EditorState>()((set, get) => {
  /** Applique une modification du document en empilant l'ancien état dans l'historique. */
  function commit(
    change: (document: FabricsDocument) => FabricsDocument,
    selectedIds?: string[],
    extra?: Partial<EditorState>,
    /** Faux quand la modification place elle-même les ouvertures (redimensionnement en bloc). */
    reconcile = true,
  ) {
    const { project, history, revision } = get()
    if (!project) return
    const changed = change(project.document)
    if (changed === project.document) return
    // Les ouvertures suivent leur mur quand sa forme change (sommet déplacé, ajouté, retiré).
    const elements = reconcile
      ? reconcileOpenings(project.document.elements, changed.elements)
      : changed.elements
    const next = elements === changed.elements ? changed : { ...changed, elements: [...elements] }
    set({
      project: { ...project, document: next },
      history: {
        past: [...history.past, project.document].slice(-HISTORY_LIMIT),
        future: [],
      },
      revision: revision + 1,
      // Le niveau actif doit toujours exister (par exemple après la suppression d'un niveau).
      activeLevelId: validActiveLevelId(next.levels, get().activeLevelId),
      ...(selectedIds ? { selectedIds } : {}),
      ...extra,
    })
  }

  /** Restaure un document de l'historique ; la sélection ne garde que les éléments existants. */
  function restore(document: FabricsDocument, history: History) {
    const { project, selectedIds, revision } = get()
    if (!project) return
    const existing = new Set(document.elements.map((el) => el.id))
    set({
      project: { ...project, document },
      history,
      selectedIds: selectedIds.filter((id) => existing.has(id)),
      // Annuler l'ajout d'un niveau ne doit pas laisser un niveau actif qui n'existe plus.
      activeLevelId: validActiveLevelId(document.levels, get().activeLevelId),
      revision: revision + 1,
    })
  }

  return {
    project: null,
    selectedIds: [],
    activeTool: 'select',
    furnitureSymbolId: null,
    sidePanelTab: 'properties',
    wallMode: 'polyline',
    roomMode: 'polygon',
    platformMode: 'polygon',
    stairShape: 'straight',
    roomWithWalls: false,
    roofShape: 'gable',
    roofMode: 'rectangle',
    openingPresets: defaultPresets(),
    editingTextId: null,
    activeLevelId: null,
    showLowerLevel: true,
    notice: null,
    guides: [],
    zoom: 1,
    stagePosition: { x: 0, y: 0 },
    viewportSize: { width: 0, height: 0 },
    history: EMPTY_HISTORY,
    saveStatus: 'saved',
    revision: 0,

    loadProject: (project) => {
      lastNudge = null
      liveBase = null
      set({
        project,
        selectedIds: [],
        activeTool: 'select',
        furnitureSymbolId: null,
        editingTextId: null,
        // On ouvre un plan sur son niveau le plus bas (le rez-de-chaussée).
        activeLevelId: validActiveLevelId(project.document.levels, null),
        notice: null,
        zoom: 1,
        stagePosition: { x: 0, y: 0 },
        history: EMPTY_HISTORY,
        saveStatus: 'saved',
        revision: 0,
      })
    },

    closeProject: () =>
      set({
        project: null,
        selectedIds: [],
        editingTextId: null,
        activeLevelId: null,
        history: EMPTY_HISTORY,
        revision: 0,
      }),

    setTool: (activeTool) => {
      // Mur, pièce, cote et calibrage n'existent pas dans un visuel.
      if (isPlanTool(activeTool) && get().project?.kind !== 'plan') return
      // Les guides d'un outil (aperçu de pose, tracé) ne restent pas à l'écran après lui.
      set({ activeTool, guides: [] })
    },
    startPlacingFurniture: (symbolId) => {
      if (get().project?.kind !== 'plan') return
      set({ activeTool: 'furniture', furnitureSymbolId: symbolId })
    },
    setSidePanelTab: (sidePanelTab) => set({ sidePanelTab }),
    setWallMode: (wallMode) => set({ wallMode }),
    setRoomMode: (roomMode) => set({ roomMode }),
    setPlatformMode: (platformMode) => set({ platformMode }),
    setStairShape: (stairShape) => set({ stairShape }),
    setRoofShape: (roofShape) => set({ roofShape }),
    setRoofMode: (roofMode) => set({ roofMode }),
    setOpeningPreset: (kind, preset) =>
      set((state) => ({ openingPresets: { ...state.openingPresets, [kind]: preset } })),
    setRoomWithWalls: (roomWithWalls) => set({ roomWithWalls }),
    setNotice: (notice) => set({ notice }),
    setGuides: (guides) => set({ guides }),
    startEditingText: (id) => set({ editingTextId: id, selectedIds: [id], activeTool: 'select' }),
    stopEditingText: () => set({ editingTextId: null }),

    commitTextEdit: (id, text) => {
      const { project } = get()
      set({ editingTextId: null })
      const element = project?.document.elements.find((el) => el.id === id)
      if (!element || element.type !== 'text') return
      if (text.trim() === '') {
        get().removeElements([id])
        return
      }
      if (text === element.text) return // rien n'a changé : pas d'état d'historique inutile
      get().updateElements([id], (el) => (el.type === 'text' ? { ...el, text } : el))
    },
    setSelection: (selectedIds) => set({ selectedIds }),
    setView: ({ zoom, stagePosition }) => set({ zoom, stagePosition }),
    setViewportSize: (viewportSize) => set({ viewportSize }),

    fitView: () => {
      const { project, viewportSize } = get()
      if (!project || viewportSize.width === 0 || viewportSize.height === 0) return
      const view = fitToScreen(
        project.document.page,
        viewportSize,
        pxPerUnit(project.document.unit),
      )
      set({ zoom: view.zoom, stagePosition: { x: view.x, y: view.y } })
    },
    setSaveStatus: (saveStatus) => set({ saveStatus }),

    // Le nom n'est pas dans le document : pas d'historique, mais il faut sauvegarder.
    renameProject: (name) => {
      const { project, revision } = get()
      if (!project || project.name === name) return
      set({ project: { ...project, name }, revision: revision + 1 })
    },

    setActiveLevel: (id) => {
      const { project, activeLevelId } = get()
      if (!project?.document.levels?.some((level) => level.id === id) || id === activeLevelId) return
      lastNudge = null
      set({ activeLevelId: id, selectedIds: [], editingTextId: null, guides: [] })
    },

    setShowLowerLevel: (showLowerLevel) => set({ showLowerLevel }),

    addLevel: () => {
      const levels = get().project?.document.levels
      if (!levels) return
      const level = newTopLevel(levels, nextLevelName(levels, fr.levels.floorName))
      commit((doc) => ({ ...doc, levels: [...levels, level] }), [], {
        activeLevelId: level.id,
        editingTextId: null,
      })
    },

    duplicateLevel: (id) => {
      const levels = get().project?.document.levels
      const source = levels?.find((level) => level.id === id)
      if (!levels || !source) return
      const copy = {
        ...newTopLevel(levels, nextLevelName(levels, fr.levels.floorName)),
        height: source.height,
        slabThickness: source.slabThickness,
      }
      commit(
        (doc) => ({
          ...doc,
          levels: insertLevelAbove(levels, id, copy),
          elements: [...doc.elements, ...copyLevelWalls(doc.elements, id, copy.id)],
        }),
        [],
        { activeLevelId: copy.id, editingTextId: null },
      )
    },

    updateLevel: (id, patch) =>
      commit((doc) => {
        if (!doc.levels) return doc
        const levels = updateLevelInList(doc.levels, id, patch)
        return levels === doc.levels ? doc : { ...doc, levels: [...levels] }
      }),

    moveLevel: (id, direction) =>
      commit((doc) => {
        if (!doc.levels) return doc
        const levels = moveLevelInList(doc.levels, id, direction)
        return levels === doc.levels ? doc : { ...doc, levels: [...levels] }
      }),

    removeLevel: (id) => {
      const { project, activeLevelId } = get()
      const levels = project?.document.levels
      if (!levels || levels.length <= 1) return
      const index = levels.findIndex((level) => level.id === id)
      if (index === -1) return
      // Le niveau affiché après la suppression : celui du dessous, sinon celui du dessus.
      const fallback = (levels[index - 1] ?? levels[index + 1]).id
      commit(
        (doc) => ({
          ...doc,
          levels: [...removeLevelFromList(levels, id)],
          elements: doc.elements.filter((el) => el.levelId !== id),
        }),
        [],
        { activeLevelId: activeLevelId === id ? fallback : activeLevelId, editingTextId: null },
      )
    },

    addElement: (element) => {
      // Un élément créé appartient au niveau actif (sauf s'il a déjà un niveau, ou s'il est commun
      // à tous les niveaux comme un axe).
      const { activeLevelId } = get()
      const placed =
        activeLevelId !== null && element.levelId === undefined && !isLevelIndependent(element)
          ? { ...element, levelId: activeLevelId }
          : element
      commit((doc) => ({ ...doc, elements: [...doc.elements, placed] }), [placed.id])
    },

    addElements: (elements) => {
      if (elements.length === 0) return
      const { activeLevelId } = get()
      const placed = elements.map((element) =>
        activeLevelId !== null && element.levelId === undefined && !isLevelIndependent(element)
          ? { ...element, levelId: activeLevelId }
          : element,
      )
      commit((doc) => ({ ...doc, elements: [...doc.elements, ...placed] }), placed.map((el) => el.id))
    },

    replaceElements: (elements) => {
      const byId = new Map(elements.map((el) => [el.id, el]))
      commit((doc) => ({
        ...doc,
        elements: doc.elements.map((el) => byId.get(el.id) ?? el),
      }))
    },

    updateElements: (ids, updater) => {
      const target = new Set(ids)
      commit((doc) => ({
        ...doc,
        elements: doc.elements.map((el) => (target.has(el.id) ? updater(el) : el)),
      }))
    },

    resizeSelectionBlock: (width, depth) => {
      const { project, selectedIds } = get()
      if (!project) return null
      const all = project.document.elements
      const selection = all.filter((el) => selectedIds.includes(el.id))
      const result = resizeBlock(selection, all, { width, depth })
      if (!result) return null
      const byId = new Map(result.elements.map((el) => [el.id, el]))
      const removed = new Set(result.removedIds)
      commit(
        (doc) => ({
          ...doc,
          elements: doc.elements.flatMap((el) => (removed.has(el.id) ? [] : [byId.get(el.id) ?? el])),
        }),
        undefined,
        undefined,
        false,
      )
      return result.removedIds.length
    },

    stretchZoneBy: (zone, delta) => {
      const { project } = get()
      if (!project) return null
      const level = selectActiveElements(get())
      const result = stretchZone(level, zone, delta)
      if (!result) return null
      const byId = new Map(result.elements.map((el) => [el.id, el]))
      const removed = new Set(result.removedIds)
      commit(
        (doc) => ({
          ...doc,
          elements: doc.elements.flatMap((el) => (removed.has(el.id) ? [] : [byId.get(el.id) ?? el])),
        }),
        undefined,
        undefined,
        false,
      )
      return result.removedIds.length
    },

    splitWall: (id) => {
      const { project } = get()
      if (!project) return null
      const result = splitWallInDocument(project.document.elements, id)
      if (!result) return null
      // Les ouvertures sont déjà replacées sur le mur de leur côté : pas de réajustement.
      commit((doc) => ({ ...doc, elements: result.elements }), result.wallIds, undefined, false)
      return { count: result.wallIds.length, removedOpenings: result.removedOpenings }
    },

    removeElements: (ids) => {
      // Supprimer un mur supprime aussi ses ouvertures.
      const target = withWallOpeningIds(get().project?.document.elements ?? [], ids)
      commit(
        (doc) => {
          const elements = doc.elements.filter((el) => !target.has(el.id))
          return elements.length === doc.elements.length ? doc : { ...doc, elements }
        },
        get().selectedIds.filter((id) => !target.has(id)),
      )
    },

    duplicateElements: (ids) => {
      const { project } = get()
      if (!project) return
      const target = new Set(ids)
      const selected = project.document.elements.filter((el) => target.has(el.id))
      // Dupliquer un mur emmène ses ouvertures.
      const sources = includeWallOpenings(project.document.elements, selected)
      if (sources.length === 0) return
      const copies = cloneElements(sources, duplicateOffset(project.document.unit))
      if (copies.length === 0) return // par exemple une ouverture seule : elle ne se duplique pas sans son mur
      commit(
        (doc) => ({ ...doc, elements: [...doc.elements, ...copies] }),
        copies.map((el) => el.id),
      )
    },

    beginLiveEdit: () => {
      liveBase = get().project?.document ?? null
    },

    liveReplaceElements: (elements) => {
      const { project, revision } = get()
      if (!project) return
      const byId = new Map(elements.map((el) => [el.id, el]))
      let from: readonly CanvasElement[] = project.document.elements
      let replaced = project.document.elements.map((el) => byId.get(el.id) ?? el)
      if (liveBase && elements.some((el) => el.type === 'wall')) {
        // Un mur modifié en direct : ses ouvertures repartent de leur place au début du geste
        // (même celles déjà écartées par un mouvement précédent), puis suivent le mur.
        const current = new Map(project.document.elements.map((el) => [el.id, el]))
        from = liveBase.elements
        replaced = liveBase.elements.map((el) =>
          el.type === 'opening' ? el : (byId.get(el.id) ?? current.get(el.id) ?? el),
        )
      }
      set({
        project: {
          ...project,
          document: { ...project.document, elements: [...reconcileOpenings(from, replaced)] },
        },
        revision: revision + 1,
      })
    },

    endLiveEdit: () => {
      const base = liveBase
      liveBase = null
      const { project, history, revision } = get()
      if (!base || !project || project.document === base) return
      set({
        history: { past: [...history.past, base].slice(-HISTORY_LIMIT), future: [] },
        revision: revision + 1,
      })
    },

    setPageSize: (width, height) => {
      const unit = get().project?.document.unit
      if (!unit) return
      const next = { width: clampPageDimension(width, unit), height: clampPageDimension(height, unit) }
      commit((doc) =>
        doc.page.width === next.width && doc.page.height === next.height
          ? doc
          : { ...doc, page: { ...doc.page, ...next } },
      )
      get().fitView()
    },

    updatePlanSettings: (patch) =>
      commit((doc) => {
        if (!doc.plan) return doc
        const plan = { ...doc.plan, ...patch }
        const unchanged = (Object.keys(patch) as (keyof PlanSettings)[]).every(
          (key) => plan[key] === doc.plan![key],
        )
        return unchanged ? doc : { ...doc, plan }
      }),

    selectAll: () => {
      const { project } = get()
      if (!project) return
      set({
        selectedIds: selectActiveElements(get())
          .filter((el) => !el.locked && !el.hidden)
          .map((el) => el.id),
      })
    },

    copySelection: () => {
      const { project, selectedIds } = get()
      if (!project) return
      const selected = project.document.elements.filter((el) => selectedIds.includes(el.id))
      // Copier un mur emmène ses ouvertures.
      copyToClipboard(includeWallOpenings(project.document.elements, selected), project.document.unit)
    },

    pasteClipboard: () => {
      const { project } = get()
      if (!project) return
      const result = takePasteCopies(project.document.unit)
      if (result.status === 'unit-mismatch') {
        set({ notice: fr.notices.pasteUnitMismatch })
        return
      }
      if (result.status !== 'ok') return
      // Les copies collées vont sur le niveau actif, même si elles viennent d'un autre projet.
      const { activeLevelId } = get()
      const copies =
        activeLevelId === null
          ? result.elements
          : result.elements.map((el) => (isLevelIndependent(el) ? el : { ...el, levelId: activeLevelId }))
      if (copies.length === 0) return
      commit(
        (doc) => ({ ...doc, elements: [...doc.elements, ...copies] }),
        copies.map((el) => el.id),
      )
    },

    nudgeSelection: (dx, dy, now = Date.now()) => {
      const { project, selectedIds, history, revision } = get()
      if (!project || (dx === 0 && dy === 0)) return
      const movable = new Set(
        project.document.elements
          .filter((el) => selectedIds.includes(el.id) && !el.locked)
          .map((el) => el.id),
      )
      if (movable.size === 0) return

      const next: FabricsDocument = {
        ...project.document,
        elements: project.document.elements.map((el) =>
          movable.has(el.id) ? translateElement(el, dx, dy) : el,
        ),
      }
      const key = [...movable].sort().join(',')
      const merge =
        lastNudge !== null &&
        lastNudge.key === key &&
        lastNudge.revision === revision &&
        now - lastNudge.at < NUDGE_MERGE_MS &&
        history.past.length > 0

      if (merge) {
        // Même geste que le précédent : on met à jour sans empiler de nouvel état.
        set({ project: { ...project, document: next }, revision: revision + 1 })
      } else {
        commit(() => next)
      }
      lastNudge = { key, at: now, revision: get().revision }
    },

    // Les calques n'affichent que le niveau actif : l'ordre se change parmi ses éléments, et les
    // éléments des autres niveaux gardent leur place.
    reorderElement: (id, slot) =>
      commit((doc) => {
        const elements = reorderOnLevel(doc.elements, get().activeLevelId, (list) =>
          moveElementToSlot(list, id, slot),
        )
        return sameOrder(elements, doc.elements) ? doc : { ...doc, elements }
      }),

    stepElementOrder: (id, direction) =>
      commit((doc) => {
        const elements = reorderOnLevel(doc.elements, get().activeLevelId, (list) =>
          stepElement(list, id, direction),
        )
        return sameOrder(elements, doc.elements) ? doc : { ...doc, elements }
      }),

    undo: () => {
      const { project, history } = get()
      if (!project || history.past.length === 0) return
      const previous = history.past[history.past.length - 1]
      restore(previous, {
        past: history.past.slice(0, -1),
        future: [project.document, ...history.future],
      })
    },

    redo: () => {
      const { project, history } = get()
      if (!project || history.future.length === 0) return
      const [next, ...rest] = history.future
      restore(next, {
        past: [...history.past, project.document].slice(-HISTORY_LIMIT),
        future: rest,
      })
    },
  }
})

/**
 * Applique un réordonnancement aux seuls éléments du niveau actif : ils reprennent, dans le
 * nouvel ordre, les places qu'ils occupaient ; les autres éléments ne bougent pas.
 */
function reorderOnLevel(
  elements: readonly CanvasElement[],
  levelId: string | null,
  reorder: (visible: readonly CanvasElement[]) => CanvasElement[],
): CanvasElement[] {
  if (levelId === null) return reorder(elements)
  const visible = elementsOnLevel(elements, levelId)
  const visibleIds = new Set(visible.map((el) => el.id))
  const reordered = reorder(visible)
  let next = 0
  return elements.map((el) => (visibleIds.has(el.id) ? reordered[next++] : el))
}
