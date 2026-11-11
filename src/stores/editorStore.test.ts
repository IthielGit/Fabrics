import { beforeEach, describe, expect, it } from 'vitest'
import { clearClipboard } from '../features/documents/clipboard'
import { createDesignProject, createPlanProject } from '../features/documents/createProject'
import {
  createAxisElement,
  createFurnitureElement,
  createOpeningElement,
  createRectElement,
  createTextElement,
  createWallElement,
} from '../features/documents/elements'
import { getSymbol } from '../features/library/catalog'
import type { OpeningElement, TextElement, WallElement } from '../types/document'
import { HISTORY_LIMIT, selectActiveElements, selectSnapElements, useEditorStore } from './editorStore'

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

describe('geste en direct', () => {
  it('un geste de plusieurs mouvements ne crée qu’un seul état d’historique', () => {
    const a = rect('A')
    store().addElement(a)
    const before = store().history.past.length

    store().beginLiveEdit()
    for (let x = 1; x <= 20; x++) store().liveReplaceElements([{ ...a, x }])
    store().endLiveEdit()

    expect(elements()[0].x).toBe(20)
    expect(store().history.past.length).toBe(before + 1)
    store().undo()
    expect(elements()[0].x).toBe(0) // revient à l'état d'avant le geste
  })

  it('un geste sans changement n’empile rien', () => {
    store().addElement(rect('A'))
    const before = store().history.past.length
    store().beginLiveEdit()
    store().endLiveEdit()
    expect(store().history.past.length).toBe(before)
  })

  it('vide le futur à la fin du geste', () => {
    const a = rect('A')
    store().addElement(a)
    store().addElement(rect('B'))
    store().undo()
    expect(store().history.future).toHaveLength(1)
    store().beginLiveEdit()
    store().liveReplaceElements([{ ...a, x: 5 }])
    store().endLiveEdit()
    expect(store().history.future).toHaveLength(0)
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

describe('ouvertures et murs', () => {
  /** Un plan avec un mur de 4 m et une porte au centre. */
  function planWithDoor() {
    store().loadProject(createPlanProject('Plan'))
    const wall = createWallElement('Mur', [0, 0, 4000, 0], 200, 2500)
    const door = createOpeningElement('door', 'Porte 1', {
      wallId: wall.id,
      segmentIndex: 0,
      offset: 2000,
      side: 'left',
    })
    store().addElement(wall)
    store().addElement(door)
    return { wall, door }
  }
  const openings = () => elements().filter((el): el is OpeningElement => el.type === 'opening')
  const walls = () => elements().filter((el): el is WallElement => el.type === 'wall')

  it('supprimer un mur supprime ses ouvertures, en un seul état annulable', () => {
    const { wall } = planWithDoor()
    store().removeElements([wall.id])
    expect(elements()).toHaveLength(0)
    store().undo()
    expect(elements().map((el) => el.type)).toEqual(['wall', 'opening'])
  })

  it('supprimer une ouverture laisse le mur', () => {
    const { door } = planWithDoor()
    store().removeElements([door.id])
    expect(elements().map((el) => el.type)).toEqual(['wall'])
  })

  it('dupliquer un mur copie aussi ses ouvertures, rattachées à la copie', () => {
    const { wall, door } = planWithDoor()
    store().duplicateElements([wall.id])
    expect(walls()).toHaveLength(2)
    expect(openings()).toHaveLength(2)
    const copy = walls()[1]
    const copiedDoor = openings()[1]
    expect(copiedDoor.id).not.toBe(door.id)
    expect(copiedDoor.wallId).toBe(copy.id)
    expect(copiedDoor.offset).toBe(door.offset)
    expect(openings()[0].wallId).toBe(wall.id)
  })

  it('dupliquer une ouverture seule ne fait rien', () => {
    const { door } = planWithDoor()
    const before = store().history.past.length
    store().duplicateElements([door.id])
    expect(openings()).toHaveLength(1)
    expect(store().history.past.length).toBe(before)
  })

  it('copier puis coller un mur emmène ses ouvertures', () => {
    const { wall } = planWithDoor()
    store().setSelection([wall.id])
    store().copySelection()
    store().pasteClipboard()
    expect(walls()).toHaveLength(2)
    expect(openings()).toHaveLength(2)
    expect(openings()[1].wallId).toBe(walls()[1].id)
  })

  it('copier une ouverture seule : rien n’est collé', () => {
    const { door } = planWithDoor()
    store().setSelection([door.id])
    store().copySelection()
    const before = elements().length
    store().pasteClipboard()
    expect(elements()).toHaveLength(before)
  })

  it('déplacer un mur garde ses ouvertures à la même place relative', () => {
    const { wall, door } = planWithDoor()
    store().updateElements([wall.id], (el) =>
      el.type === 'wall' ? { ...el, points: el.points.map((v, i) => v + (i % 2 ? 300 : 500)) } : el,
    )
    expect(openings()[0]).toMatchObject({ id: door.id, offset: 2000, segmentIndex: 0 })
  })

  it('raccourcir un mur ramène l’ouverture sur le mur', () => {
    const { wall } = planWithDoor()
    store().replaceElements([{ ...wall, points: [0, 0, 2000, 0] }])
    expect(openings()[0].offset).toBe(1550)
    store().undo()
    expect(openings()[0].offset).toBe(2000)
  })

  it('une ouverture qui ne tient plus est supprimée, et annuler la rend', () => {
    const { wall } = planWithDoor()
    store().replaceElements([{ ...wall, points: [0, 0, 500, 0] }])
    expect(openings()).toHaveLength(0)
    store().undo()
    expect(openings()).toHaveLength(1)
  })

  it('ajouter un sommet place l’ouverture sur le bon segment', () => {
    const { wall } = planWithDoor()
    store().replaceElements([{ ...wall, points: [0, 0, 1000, 0, 4000, 0] }])
    expect(openings()[0]).toMatchObject({ segmentIndex: 1, offset: 1000 })
  })

  it('un geste en direct rejoue depuis le début : l’ouverture écartée revient', () => {
    const { wall } = planWithDoor()
    store().beginLiveEdit()
    store().liveReplaceElements([{ ...wall, points: [0, 0, 500, 0] }])
    expect(openings()).toHaveLength(0)
    store().liveReplaceElements([{ ...wall, points: [0, 0, 4000, 0] }])
    expect(openings()).toHaveLength(1)
    expect(openings()[0].offset).toBe(2000)
    store().endLiveEdit()
    expect(store().history.past).toHaveLength(3) // ajout du mur, ajout de la porte, puis le geste entier
  })

  it('faire glisser une ouverture seule ne touche pas aux murs', () => {
    const { door } = planWithDoor()
    store().beginLiveEdit()
    store().liveReplaceElements([{ ...door, offset: 1000 }])
    store().endLiveEdit()
    expect(openings()[0].offset).toBe(1000)
    expect(walls()[0].points).toEqual([0, 0, 4000, 0])
  })
})

describe('niveaux', () => {
  const levels = () => store().project!.document.levels!
  const planStore = () => store().loadProject(createPlanProject('Maison'))
  const wallAt = (name: string) => createWallElement(name, [0, 0, 4000, 0], 200, 2700)

  it('un nouveau plan s’ouvre sur son rez-de-chaussée', () => {
    planStore()
    expect(levels()).toHaveLength(1)
    expect(store().activeLevelId).toBe(levels()[0].id)
  })

  it('un visuel n’a pas de niveau', () => {
    expect(store().activeLevelId).toBeNull()
  })

  it('un élément créé appartient au niveau actif', () => {
    planStore()
    store().addElement(wallAt('Mur 1'))
    expect(elements()[0].levelId).toBe(levels()[0].id)
  })

  it('ajouter un niveau l’affiche ; annuler revient au précédent', () => {
    planStore()
    store().addLevel()
    expect(levels().map((l) => l.name)).toEqual(['Rez-de-chaussée', 'Étage 1'])
    expect(store().activeLevelId).toBe(levels()[1].id)
    store().undo()
    expect(levels()).toHaveLength(1)
    expect(store().activeLevelId).toBe(levels()[0].id)
  })

  it('changer de niveau vide la sélection et masque les éléments des autres niveaux', () => {
    planStore()
    store().addElement(wallAt('Mur RDC'))
    const ground = levels()[0].id
    store().addLevel()
    expect(store().selectedIds).toEqual([])
    store().addElement(wallAt('Mur étage'))
    store().selectAll()
    expect(store().selectedIds).toHaveLength(1) // seulement le mur de l’étage
    store().setActiveLevel(ground)
    expect(store().selectedIds).toEqual([])
    store().selectAll()
    const names = store().selectedIds.map((id) => elements().find((el) => el.id === id)?.name)
    expect(names).toEqual(['Mur RDC'])
  })

  it('les nouveaux murs gardent la hauteur donnée par le niveau (modifiable)', () => {
    planStore()
    store().updateLevel(levels()[0].id, { height: 3000 })
    expect(levels()[0].height).toBe(3000)
  })

  it('dupliquer le rez-de-chaussée copie les murs et leurs ouvertures, pas les pièces', () => {
    planStore()
    const ground = levels()[0].id
    const wall = wallAt('Mur 1')
    store().addElement(wall)
    store().addElement(
      createOpeningElement('door', 'Porte 1', {
        wallId: wall.id,
        segmentIndex: 0,
        offset: 2000,
        side: 'left',
      }),
    )
    store().addElement({
      ...rect('Pièce'),
      type: 'room',
      points: [0, 0, 4000, 0, 4000, 3000],
      fill: '#0f0',
      showLabel: true,
    } as never)

    store().duplicateLevel(ground)
    expect(levels().map((l) => l.name)).toEqual(['Rez-de-chaussée', 'Étage 1'])
    expect(levels()[1].elevation).toBe(2700)
    const copy = elements().filter((el) => el.levelId === levels()[1].id)
    expect(copy.map((el) => el.type)).toEqual(['wall', 'opening'])
    expect(elements().filter((el) => el.levelId === ground)).toHaveLength(3)
    // La copie est indépendante : l'ouverture copiée est sur le mur copié.
    const [copiedWall, copiedDoor] = copy as [WallElement, OpeningElement]
    expect(copiedDoor.wallId).toBe(copiedWall.id)
    expect(store().activeLevelId).toBe(levels()[1].id)
  })

  it('supprimer un niveau supprime ses éléments ; le dernier niveau ne se supprime pas', () => {
    planStore()
    const ground = levels()[0].id
    store().removeLevel(ground)
    expect(levels()).toHaveLength(1)

    store().addLevel()
    const upper = levels()[1].id
    store().addElement(wallAt('Mur étage'))
    store().removeLevel(upper)
    expect(levels()).toHaveLength(1)
    expect(elements()).toHaveLength(0)
    expect(store().activeLevelId).toBe(ground)

    store().undo() // supprimer un niveau s’annule d’un coup
    expect(levels()).toHaveLength(2)
    expect(elements()).toHaveLength(1)
  })

  it('l’ordre des calques ne touche pas aux éléments des autres niveaux', () => {
    planStore()
    store().addElement(wallAt('A0'))
    store().addLevel()
    store().addElement(wallAt('A1'))
    store().addElement(wallAt('B1'))
    const [a1, b1] = elements().filter((el) => el.levelId === levels()[1].id)
    store().stepElementOrder(a1.id, 'up')
    expect(elements().map((el) => el.name)).toEqual(['A0', 'B1', 'A1'])
    expect(b1.name).toBe('B1')
  })

  it('un élément collé va sur le niveau actif', () => {
    planStore()
    const ground = levels()[0].id
    store().addElement(wallAt('Mur 1'))
    store().copySelection()
    store().addLevel()
    store().pasteClipboard()
    const pasted = elements().find((el) => el.levelId !== ground)
    expect(pasted?.levelId).toBe(levels()[1].id)
  })
})

describe('axes de construction', () => {
  const levels = () => store().project!.document.levels!
  const axis = (label: string, y: number) => createAxisElement(`Axe ${label}`, label, [0, y, 10000, y])

  beforeEach(() => {
    store().loadProject(createPlanProject('Maison'))
    clearClipboard()
  })

  it('un axe posé n’appartient à aucun niveau, mais un mur oui', () => {
    store().addElement(axis('A', 0))
    store().addElement(createWallElement('Mur', [0, 0, 4000, 0], 200, 2700))
    expect(elements()[0].levelId).toBeUndefined()
    expect(elements()[1].levelId).toBe(levels()[0].id)
  })

  it('un axe est visible, sélectionnable et aimantable sur tous les niveaux', () => {
    store().addElement(axis('A', 0))
    store().addLevel()
    expect(selectActiveElements(store()).map((el) => el.type)).toEqual(['axis'])
    store().selectAll()
    expect(store().selectedIds).toHaveLength(1)
  })

  it('le niveau du dessous attire seulement quand il est affiché en transparence', () => {
    store().addElement(createWallElement('Mur RDC', [0, 0, 4000, 0], 200, 2700))
    store().addLevel() // on passe sur l'étage, vide
    store().setShowLowerLevel(true)
    expect(selectSnapElements(store()).map((el) => el.name)).toEqual(['Mur RDC'])
    // Même référence tant que rien ne change (les calculs d'aimantation sont mis en cache dessus).
    expect(selectSnapElements(store())).toBe(selectSnapElements(store()))
    store().setShowLowerLevel(false)
    expect(selectSnapElements(store())).toEqual([])
  })

  it('supprimer un niveau garde les axes', () => {
    store().addElement(axis('A', 0))
    store().addLevel()
    store().removeLevel(levels()[1].id)
    expect(elements().map((el) => el.type)).toEqual(['axis'])
  })

  it('coller un axe ne lui donne pas de niveau', () => {
    store().addElement(axis('A', 0))
    store().copySelection()
    store().addLevel()
    store().pasteClipboard()
    const copies = elements().filter((el) => el.type === 'axis')
    expect(copies).toHaveLength(2)
    expect(copies.every((el) => el.levelId === undefined)).toBe(true)
  })

  it('l’outil Axe n’existe que dans un plan', () => {
    store().loadProject(createDesignProject('post-square', 'Visuel'))
    store().setTool('axis')
    expect(store().activeTool).toBe('select')
    store().loadProject(createPlanProject('Plan'))
    store().setTool('axis')
    expect(store().activeTool).toBe('axis')
  })
})

describe('objets de la bibliothèque', () => {
  beforeEach(() => {
    store().loadProject(createPlanProject('Maison'))
  })

  it('choisir un objet active l’outil de pose, dans un plan seulement', () => {
    store().startPlacingFurniture('bed-queen')
    expect(store().activeTool).toBe('furniture')
    expect(store().furnitureSymbolId).toBe('bed-queen')

    store().loadProject(createDesignProject('post-square', 'Visuel'))
    store().startPlacingFurniture('bed-queen')
    expect(store().activeTool).toBe('select')
    expect(store().furnitureSymbolId).toBeNull()
  })

  it('un objet posé appartient au niveau actif et se déplace par x, y', () => {
    const bed = getSymbol('bed-queen')!
    store().addElement(createFurnitureElement('Lit 1', bed.id, 0, 0, bed.width, bed.depth))
    const placed = elements()[0]
    expect(placed.levelId).toBe(store().activeLevelId)
    store().nudgeSelection(10, 0)
    expect(elements()[0]).toMatchObject({ x: 10, y: 0, width: 1600, depth: 2000 })
  })
})

describe('setPageSize', () => {
  it("change la taille de la page, bornée, en un pas d'historique", () => {
    store().loadProject(createPlanProject('Plan'))
    store().setPageSize(30000, 5)
    const page = store().project!.document.page
    expect(page.width).toBe(30000)
    expect(page.height).toBe(1000)
    store().undo()
    expect(store().project!.document.page.width).toBe(20000)
  })
})
