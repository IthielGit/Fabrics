import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPlanProject } from '../features/documents/createProject'
import { createWallElement } from '../features/documents/elements'
import { setCollabHistory, useEditorStore } from './editorStore'

function wall(name: string) {
  return createWallElement(name, [0, 0, 3500, 0], 200, 2700)
}

beforeEach(() => {
  useEditorStore.getState().loadProject(createPlanProject('Essai'))
})

afterEach(() => {
  setCollabHistory(null)
})

describe('editorStore et collaboration (M14, lot D)', () => {
  it('un document reçu s’affiche sans entrer dans l’historique et garde la sélection valable', () => {
    const store = useEditorStore.getState()
    const a = wall('A')
    store.addElement(a)
    store.setSelection([a.id])
    const before = useEditorStore.getState()
    const document = { ...before.project!.document, elements: [wall('B')] }
    store.applyRemoteDocument(document)
    const after = useEditorStore.getState()
    expect(after.project?.document).toBe(document)
    expect(after.selectedIds).toEqual([])
    expect(after.history).toBe(before.history)
    expect(after.revision).toBe(before.revision + 1)
  })

  it('retient si la dernière modification venait d’une autre personne (lot F)', () => {
    const store = useEditorStore.getState()
    const base = useEditorStore.getState().project!.document
    store.applyRemoteDocument({ ...base, elements: [wall('B')] }, true)
    let state = useEditorStore.getState()
    expect(state.remoteRevision).toBe(state.revision)
    store.addElement(wall('C'))
    state = useEditorStore.getState()
    expect(state.remoteRevision).not.toBe(state.revision)
    store.applyRemoteDocument({ ...state.project!.document, elements: [wall('D')] })
    state = useEditorStore.getState()
    expect(state.remoteRevision).not.toBe(state.revision)
  })

  it('signale le début et la fin d’un geste, même sans modification', () => {
    const store = useEditorStore.getState()
    store.beginLiveEdit()
    expect(useEditorStore.getState().liveEditing).toBe(true)
    store.endLiveEdit()
    expect(useEditorStore.getState().liveEditing).toBe(false)
  })

  it('annuler et rétablir passent par la collaboration quand elle est ouverte', () => {
    const calls: string[] = []
    useEditorStore.getState().addElement(wall('A'))
    setCollabHistory({ undo: () => calls.push('undo'), redo: () => calls.push('redo') })
    expect(useEditorStore.getState().history.past).toHaveLength(0)
    useEditorStore.getState().undo()
    useEditorStore.getState().redo()
    expect(calls).toEqual(['undo', 'redo'])
    expect(useEditorStore.getState().project?.document.elements).toHaveLength(1)
  })
})
