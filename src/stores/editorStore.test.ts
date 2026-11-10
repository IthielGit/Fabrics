import { beforeEach, describe, expect, it } from 'vitest'
import { clearClipboard } from '../features/documents/clipboard'
import { createDesignProject, createPlanProject } from '../features/documents/createProject'
import { createRectElement, createTextElement } from '../features/documents/elements'
import type { TextElement } from '../types/document'
import { HISTORY_LIMIT, useEditorStore } from './editorStore'

const store = () => useEditorStore.getState()
const elements = () => store().project!.document.elements

function rect(name: string) {
  return createRectElement(name, 0, 0, 100, 100)
}

beforeEach(() => {
  clearClipboard()
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

describe('outils réservés aux plans', () => {
  it('refuse les outils de plan dans un visuel', () => {
    for (const tool of ['wall', 'room', 'dimension', 'calibrate'] as const) {
      store().setTool(tool)
      expect(store().activeTool).toBe('select')
    }
  })

  it('accepte les outils de plan dans un plan', () => {
    store().loadProject(createPlanProject('Plan'))
    for (const tool of ['wall', 'room', 'dimension', 'calibrate'] as const) {
      store().setTool(tool)
      expect(store().activeTool).toBe(tool)
    }
  })

  it('les outils communs restent disponibles dans un visuel', () => {
    store().setTool('rect')
    expect(store().activeTool).toBe('rect')
  })
})

describe('réglages du plan', () => {
  it('modifie l’échelle et la grille, et l’annulation les restaure', () => {
    store().loadProject(createPlanProject('Plan'))
    store().updatePlanSettings({ scale: 100, gridSize: 200 })
    expect(store().project!.document.plan).toMatchObject({ scale: 100, gridSize: 200 })
    store().undo()
    expect(store().project!.document.plan).toMatchObject({ scale: 50, gridSize: 100 })
  })

  it('n’ajoute pas d’historique quand rien ne change', () => {
    store().loadProject(createPlanProject('Plan'))
    store().updatePlanSettings({ scale: 50 })
    expect(store().history.past).toHaveLength(0)
  })

  it('est sans effet dans un visuel', () => {
    store().updatePlanSettings({ scale: 100 })
    expect(store().project!.document.plan).toBeUndefined()
    expect(store().history.past).toHaveLength(0)
  })
})

describe('copier / coller', () => {
  it('copie dans un projet et colle dans un autre', () => {
    const a = rect('A')
    store().addElement(a)
    store().setSelection([a.id])
    store().copySelection()

    store().loadProject(createDesignProject('story', 'Autre projet'))
    store().pasteClipboard()

    expect(elements()).toHaveLength(1)
    expect(elements()[0].name).toBe('A')
    expect(elements()[0].id).not.toBe(a.id)
    expect(store().selectedIds).toEqual([elements()[0].id])
    store().undo()
    expect(elements()).toHaveLength(0)
  })

  it('colle plusieurs fois avec un décalage croissant', () => {
    const a = rect('A')
    store().addElement(a)
    store().copySelection()
    store().pasteClipboard()
    store().pasteClipboard()
    expect(elements().map((el) => el.x)).toEqual([0, 20, 40])
  })

  it('refuse de coller un visuel dans un plan et le dit', () => {
    const a = rect('A')
    store().addElement(a)
    store().copySelection()
    store().loadProject(createPlanProject('Plan'))
    store().pasteClipboard()
    expect(elements()).toHaveLength(0)
    expect(store().notice).toMatch(/unité/)
  })
})

describe('tout sélectionner et déplacement aux flèches', () => {
  it('sélectionne tout sauf les éléments verrouillés ou masqués', () => {
    const a = rect('A')
    const b = rect('B')
    const c = rect('C')
    store().addElement(a)
    store().addElement(b)
    store().addElement(c)
    store().updateElements([b.id], (el) => ({ ...el, locked: true }))
    store().updateElements([c.id], (el) => ({ ...el, hidden: true }))
    store().selectAll()
    expect(store().selectedIds).toEqual([a.id])
  })

  it('déplace la sélection de 1 puis de 10, sans bouger les éléments verrouillés', () => {
    const a = rect('A')
    const b = rect('B')
    store().addElement(a)
    store().addElement(b)
    store().updateElements([b.id], (el) => ({ ...el, locked: true }))
    store().setSelection([a.id, b.id])
    store().nudgeSelection(1, 0, 1000)
    store().nudgeSelection(0, 10, 5000)
    expect(elements().map((el) => [el.x, el.y])).toEqual([
      [1, 10],
      [0, 0],
    ])
  })

  it('fusionne les appuis rapprochés en un seul état d’historique', () => {
    const a = rect('A')
    store().addElement(a)
    const before = store().history.past.length
    store().nudgeSelection(1, 0, 10_000)
    store().nudgeSelection(1, 0, 10_200)
    store().nudgeSelection(1, 0, 10_400)
    expect(elements()[0].x).toBe(3)
    expect(store().history.past.length).toBe(before + 1)
    store().undo()
    expect(elements()[0].x).toBe(0)
  })

  it('ne fusionne pas des appuis espacés', () => {
    const a = rect('A')
    store().addElement(a)
    const before = store().history.past.length
    store().nudgeSelection(1, 0, 20_000)
    store().nudgeSelection(1, 0, 30_000)
    expect(store().history.past.length).toBe(before + 2)
  })
})

describe('ordre des calques', () => {
  it('monte un élément et annule', () => {
    const a = rect('A')
    const b = rect('B')
    store().addElement(a)
    store().addElement(b)
    store().stepElementOrder(a.id, 'up')
    expect(elements().map((el) => el.name)).toEqual(['B', 'A'])
    store().undo()
    expect(elements().map((el) => el.name)).toEqual(['A', 'B'])
  })

  it('n’ajoute pas d’historique quand l’ordre ne change pas', () => {
    const a = rect('A')
    store().addElement(a)
    const before = store().history.past.length
    store().stepElementOrder(a.id, 'up')
    store().reorderElement(a.id, 0)
    expect(store().history.past.length).toBe(before)
  })

  it('déplace un élément à un emplacement de la liste', () => {
    const a = rect('A')
    const b = rect('B')
    const c = rect('C')
    store().addElement(a)
    store().addElement(b)
    store().addElement(c)
    store().reorderElement(a.id, 0) // tout en haut de la liste = devant tout
    expect(elements().map((el) => el.name)).toEqual(['B', 'C', 'A'])
  })
})

describe('édition de texte', () => {
  function textElement(text: string) {
    return createTextElement('Texte 1', 0, 0, text, 48)
  }

  it('annuler une modification de texte restaure exactement le contenu précédent', () => {
    const t = textElement('Bonjour\nle monde')
    store().addElement(t)
    store().startEditingText(t.id)
    store().commitTextEdit(t.id, 'Salut')
    expect((elements()[0] as TextElement).text).toBe('Salut')
    store().undo()
    expect((elements()[0] as TextElement).text).toBe('Bonjour\nle monde')
    store().redo()
    expect((elements()[0] as TextElement).text).toBe('Salut')
  })

  it('ne crée pas d’état d’historique si le texte est inchangé', () => {
    const t = textElement('Identique')
    store().addElement(t)
    const before = store().history.past.length
    store().commitTextEdit(t.id, 'Identique')
    expect(store().history.past.length).toBe(before)
    expect(store().editingTextId).toBeNull()
  })

  it('supprime un texte vidé (et l’annulation le ramène)', () => {
    const t = textElement('À effacer')
    store().addElement(t)
    store().commitTextEdit(t.id, '   ')
    expect(elements()).toHaveLength(0)
    store().undo()
    expect((elements()[0] as TextElement).text).toBe('À effacer')
  })

  it('startEditingText sélectionne le texte et repasse sur l’outil Sélection', () => {
    const t = textElement('x')
    store().addElement(t)
    store().setTool('text')
    store().startEditingText(t.id)
    expect(store().editingTextId).toBe(t.id)
    expect(store().selectedIds).toEqual([t.id])
    expect(store().activeTool).toBe('select')
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
