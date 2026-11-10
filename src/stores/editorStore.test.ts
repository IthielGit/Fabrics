import { beforeEach, describe, expect, it } from 'vitest'
import { createDesignProject } from '../features/documents/createProject'
import { createRectElement } from '../features/documents/elements'
import { HISTORY_LIMIT, useEditorStore } from './editorStore'

const store = () => useEditorStore.getState()
const elements = () => store().project!.document.elements

function rect(name: string) {
  return createRectElement(name, 0, 0, 100, 100)
}

beforeEach(() => {
  store().loadProject(createDesignProject('post-square', 'Test'))
})

describe('historique : annuler / rétablir', () => {
  it('annule 3 ajouts puis les rétablit', () => {
    store().addElement(rect('A'))
    store().addElement(rect('B'))
    store().addElement(rect('C'))
    expect(elements()).toHaveLength(3)

    store().undo()
    store().undo()
    store().undo()
    expect(elements()).toHaveLength(0)

    store().redo()
    store().redo()
    store().redo()
    expect(elements().map((el) => el.name)).toEqual(['A', 'B', 'C'])
  })

  it('ne fait rien quand il n’y a rien à annuler ou rétablir', () => {
    store().undo()
    store().redo()
    expect(elements()).toHaveLength(0)
    expect(store().revision).toBe(0)
  })

  it('vide le futur après une nouvelle modification', () => {
    store().addElement(rect('A'))
    store().undo()
    expect(store().history.future).toHaveLength(1)
    store().addElement(rect('B'))
    expect(store().history.future).toHaveLength(0)
  })

  it('empile un seul état pour une modification de plusieurs éléments', () => {
    const a = rect('A')
    const b = rect('B')
    store().addElement(a)
    store().addElement(b)
    const before = store().history.past.length
    store().updateElements([a.id, b.id], (el) => ({ ...el, x: el.x + 50 }))
    expect(store().history.past.length).toBe(before + 1)
    store().undo()
    expect(elements().map((el) => el.x)).toEqual([0, 0])
  })

  it('limite l’historique à 100 états', () => {
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) store().addElement(rect(`R${i}`))
    expect(store().history.past).toHaveLength(HISTORY_LIMIT)
  })

  it('ne modifie jamais l’ancien document (mises à jour immuables)', () => {
    const a = rect('A')
    store().addElement(a)
    const snapshot = store().project!.document
    store().updateElements([a.id], (el) => ({ ...el, x: 999 }))
    expect(snapshot.elements[0].x).toBe(0)
  })
})

describe('sélection', () => {
  it('sélectionne l’élément ajouté', () => {
    const a = rect('A')
    store().addElement(a)
    expect(store().selectedIds).toEqual([a.id])
  })

  it('supprime tous les éléments sélectionnés d’un coup', () => {
    const a = rect('A')
    const b = rect('B')
    const c = rect('C')
    store().addElement(a)
    store().addElement(b)
    store().addElement(c)
    store().setSelection([a.id, b.id])
    store().removeElements(store().selectedIds)
    expect(elements().map((el) => el.name)).toEqual(['C'])
    expect(store().selectedIds).toEqual([])
    store().undo()
    expect(elements()).toHaveLength(3)
  })

  it('retire de la sélection les éléments qui n’existent plus après annulation', () => {
    const a = rect('A')
    store().addElement(a)
    store().undo()
    expect(store().selectedIds).toEqual([])
  })
})

describe('duplication', () => {
  it('copie les éléments décalés, avec de nouveaux identifiants, et les sélectionne', () => {
    const a = rect('A')
    store().addElement(a)
    store().duplicateElements([a.id])
    expect(elements()).toHaveLength(2)
    const copy = elements()[1]
    expect(copy.id).not.toBe(a.id)
    expect(copy.x).toBe(20)
    expect(copy.y).toBe(20)
    expect(store().selectedIds).toEqual([copy.id])
  })
})

describe('vue', () => {
  it('ajuste la page à la zone visible', () => {
    store().setViewportSize({ width: 1000, height: 1000 })
    store().fitView()
    // page 1080 × 1080, marge de 48 px → zoom = (1000 − 96) / 1080
    expect(store().zoom).toBeCloseTo(904 / 1080)
    expect(store().stagePosition.x).toBeCloseTo(48)
  })

  it('ne fait rien tant que la taille de la zone est inconnue', () => {
    store().setViewportSize({ width: 0, height: 0 })
    store().fitView()
    expect(store().zoom).toBe(1)
  })
})

describe('revision et nom du projet', () => {
  it('augmente la révision à chaque modification', () => {
    const start = store().revision
    store().addElement(rect('A'))
    store().undo()
    expect(store().revision).toBe(start + 2)
  })

  it('renommer ne touche pas à l’historique mais demande une sauvegarde', () => {
    const start = store().revision
    store().renameProject('Nouveau nom')
    expect(store().project!.name).toBe('Nouveau nom')
    expect(store().history.past).toHaveLength(0)
    expect(store().revision).toBe(start + 1)
  })

  it('loadProject remet tout à zéro', () => {
    store().addElement(rect('A'))
    store().loadProject(createDesignProject('story', 'Autre'))
    expect(elements()).toHaveLength(0)
    expect(store().history.past).toHaveLength(0)
    expect(store().revision).toBe(0)
  })
})
