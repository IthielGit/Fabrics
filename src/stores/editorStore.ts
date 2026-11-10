import { create } from 'zustand'
import { cloneElements, duplicateOffset } from '../features/documents/elements'
import { copyToClipboard, takePasteCopies } from '../features/documents/clipboard'
import { moveElementToSlot, sameOrder, stepElement } from '../features/documents/layers'
import { fr } from '../i18n/fr'
import type { Guide } from '../features/geometry/guides'
import { fitToScreen, type Size } from '../features/geometry/viewport'
import { pxPerUnit } from '../features/units/scale'
import type { CanvasElement, FabricsDocument, PlanSettings, Project } from '../types/document'

export type EditorTool =
  | 'select'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'text'
  | 'wall'
  | 'room'
  | 'dimension'
  | 'calibrate'

/** Outils qui n'existent que dans un projet de type Plan. */
export const PLAN_TOOLS: readonly EditorTool[] = ['wall', 'room', 'dimension', 'calibrate']

export function isPlanTool(tool: EditorTool): boolean {
  return PLAN_TOOLS.includes(tool)
}
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
  /** Texte en cours d'édition dans la zone de saisie superposée (état d'interface, pas du document). */
  editingTextId: string | null
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

  addElement: (element: CanvasElement) => void
  /** Remplace des éléments (par identifiant) : un seul état d'historique par appel. */
  replaceElements: (elements: CanvasElement[]) => void
  updateElements: (ids: string[], updater: (element: CanvasElement) => CanvasElement) => void
  removeElements: (ids: string[]) => void
  duplicateElements: (ids: string[]) => void
  /** Modifie les réglages du plan (échelle, grille, murs par défaut) ; sans effet dans un visuel. */
  updatePlanSettings: (patch: Partial<PlanSettings>) => void
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

// Dernier déplacement par les flèches (pour fusionner les appuis rapprochés).
let lastNudge: { key: string; at: number; revision: number } | null = null

export const useEditorStore = create<EditorState>()((set, get) => {
  /** Applique une modification du document en empilant l'ancien état dans l'historique. */
  function commit(
    change: (document: FabricsDocument) => FabricsDocument,
    selectedIds?: string[],
  ) {
    const { project, history, revision } = get()
    if (!project) return
    const next = change(project.document)
    if (next === project.document) return
    set({
      project: { ...project, document: next },
      history: {
        past: [...history.past, project.document].slice(-HISTORY_LIMIT),
        future: [],
      },
      revision: revision + 1,
      ...(selectedIds ? { selectedIds } : {}),
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
      revision: revision + 1,
    })
  }

  return {
    project: null,
    selectedIds: [],
    activeTool: 'select',
    editingTextId: null,
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
      set({
        project,
        selectedIds: [],
        activeTool: 'select',
        editingTextId: null,
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
        history: EMPTY_HISTORY,
        revision: 0,
      }),

    setTool: (activeTool) => {
      // Mur, pièce, cote et calibrage n'existent pas dans un visuel.
      if (isPlanTool(activeTool) && get().project?.kind !== 'plan') return
      set({ activeTool })
    },
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

    addElement: (element) =>
      commit((doc) => ({ ...doc, elements: [...doc.elements, element] }), [element.id]),

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

    removeElements: (ids) => {
      const target = new Set(ids)
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
      const sources = project.document.elements.filter((el) => target.has(el.id))
      if (sources.length === 0) return
      const copies = cloneElements(sources, duplicateOffset(project.document.unit))
      commit(
        (doc) => ({ ...doc, elements: [...doc.elements, ...copies] }),
        copies.map((el) => el.id),
      )
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
        selectedIds: project.document.elements
          .filter((el) => !el.locked && !el.hidden)
          .map((el) => el.id),
      })
    },

    copySelection: () => {
      const { project, selectedIds } = get()
      if (!project) return
      const selected = project.document.elements.filter((el) => selectedIds.includes(el.id))
      copyToClipboard(selected, project.document.unit)
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
      const copies = result.elements
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
          movable.has(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el,
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

    reorderElement: (id, slot) =>
      commit((doc) => {
        const elements = moveElementToSlot(doc.elements, id, slot)
        return sameOrder(elements, doc.elements) ? doc : { ...doc, elements }
      }),

    stepElementOrder: (id, direction) =>
      commit((doc) => {
        const elements = stepElement(doc.elements, id, direction)
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
