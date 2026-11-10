import { create } from 'zustand'
import { cloneElements, duplicateOffset } from '../features/documents/elements'
import { fitToScreen, type Size } from '../features/geometry/viewport'
import { pxPerUnit } from '../features/units/scale'
import type { CanvasElement, FabricsDocument, Project } from '../types/document'

export type EditorTool = 'select' | 'rect' | 'ellipse' | 'line'
export type SaveStatus = 'saved' | 'saving' | 'error'

export const HISTORY_LIMIT = 100

interface History {
  past: FabricsDocument[]
  future: FabricsDocument[]
}

interface EditorState {
  project: Project | null
  selectedIds: string[]
  activeTool: EditorTool
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
  undo: () => void
  redo: () => void
}

const EMPTY_HISTORY: History = { past: [], future: [] }

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
    zoom: 1,
    stagePosition: { x: 0, y: 0 },
    viewportSize: { width: 0, height: 0 },
    history: EMPTY_HISTORY,
    saveStatus: 'saved',
    revision: 0,

    loadProject: (project) =>
      set({
        project,
        selectedIds: [],
        activeTool: 'select',
        zoom: 1,
        stagePosition: { x: 0, y: 0 },
        history: EMPTY_HISTORY,
        saveStatus: 'saved',
        revision: 0,
      }),

    closeProject: () =>
      set({ project: null, selectedIds: [], history: EMPTY_HISTORY, revision: 0 }),

    setTool: (activeTool) => set({ activeTool }),
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
