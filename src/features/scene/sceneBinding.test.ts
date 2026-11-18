import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { createExamplePlanProject } from '../documents/createProject'
import type { FabricsDocument, RoomElement, WallElement } from '../../types/document'
import { onModelChanged } from './modelEvents'
import { SceneBinding, type SceneHost } from './sceneBinding'
import { readScene } from './yScene'

const NOW = new Date('2026-11-18T00:00:00Z')

/** Éditeur minimal : un document affiché, un état « geste en cours ». */
class FakeEditor implements SceneHost {
  document: FabricsDocument
  live = false
  remote: { document: FabricsDocument; fromPeer: boolean }[] = []
  constructor(document: FabricsDocument) {
    this.document = document
  }
  getDocument() {
    return this.document
  }
  isLiveEditing() {
    return this.live
  }
  applyRemoteDocument(document: FabricsDocument, fromPeer: boolean) {
    this.document = document
    this.remote.push({ document, fromPeer })
  }
  /** Geste de l'éditeur : nouveau document, puis la liaison est prévenue (comme l'abonnement au store). */
  edit(binding: SceneBinding, change: (doc: FabricsDocument) => FabricsDocument) {
    this.document = change(this.document)
    binding.localChanged()
  }
}

function example(): FabricsDocument {
  return createExamplePlanProject(NOW).document
}

const firstWall = (doc: FabricsDocument) => doc.elements.find((el): el is WallElement => el.type === 'wall')!

/** Déplace le premier sommet du premier mur de `dx` mm. */
function moveWallStart(doc: FabricsDocument, dx: number): FabricsDocument {
  const wall = firstWall(doc)
  return {
    ...doc,
    elements: doc.elements.map((el) => (el === wall ? { ...wall, points: [wall.points[0] + dx, ...wall.points.slice(1)] } : el)),
  }
}

function solo(doc = example()) {
  const editor = new FakeEditor(doc)
  const binding = new SceneBinding(new Y.Doc(), editor)
  binding.start()
  return { editor, binding }
}

describe('SceneBinding : la scène Pascal est le document', () => {
  it('écrit la scène du plan dans le Y.Doc à l’ouverture, sans changer ce qu’affiche l’éditeur', () => {
    const doc = example()
    const { editor, binding } = solo(doc)
    expect(editor.document).toBe(doc) // pièces tracées sur les faces : vue identique, aucun réaffichage
    const scene = readScene(binding.ydoc)!
    expect(Object.keys(scene.nodes).length).toBeGreaterThan(doc.elements.length)
    expect(scene.nodes[`wall_${firstWall(doc).id}__0`]).toBeDefined()
  })

  it('un geste devient une modification de la scène (seuls les nœuds touchés)', () => {
    const { editor, binding } = solo()
    const wall = firstWall(editor.document)
    const before = readScene(binding.ydoc)!
    editor.edit(binding, (doc) => moveWallStart(doc, 100))
    const after = readScene(binding.ydoc)!
    const node = after.nodes[`wall_${wall.id}__0`]
    expect((node.start as number[])[0]).toBeCloseTo((before.nodes[`wall_${wall.id}__0`].start as number[])[0] + 0.1, 9)
    expect(Object.keys(after.nodes).sort()).toEqual(Object.keys(before.nodes).sort())
  })

  it('créer, modifier, supprimer puis annuler garde identifiants et dimensions, sans élément fantôme', () => {
    const { editor, binding } = solo()
    const original = editor.document
    const wall = firstWall(original)
    const added: WallElement = { ...wall, id: 'nouveau-mur', name: 'Nouveau', points: [0, 0, 3000, 0] }

    editor.edit(binding, (doc) => ({ ...doc, elements: [...doc.elements, added] }))
    editor.edit(binding, (doc) => ({
      ...doc,
      elements: doc.elements.map((el) => (el.id === 'nouveau-mur' ? { ...(el as WallElement), points: [0, 0, 4000, 0] } : el)),
    }))
    editor.edit(binding, (doc) => ({ ...doc, elements: doc.elements.filter((el) => el.id !== 'nouveau-mur') }))
    expect(editor.document.elements.some((el) => el.id === 'nouveau-mur')).toBe(false)

    binding.undo() // annule la suppression
    expect(editor.document.elements.find((el) => el.id === 'nouveau-mur')).toMatchObject({ points: [0, 0, 4000, 0] })
    binding.undo() // annule la modification
    expect(editor.document.elements.find((el) => el.id === 'nouveau-mur')).toMatchObject({ points: [0, 0, 3000, 0] })
    binding.undo() // annule l'ajout
    expect(editor.document).toStrictEqual(original)
    expect(Object.keys(readScene(binding.ydoc)!.nodes).some((id) => id.includes('nouveau-mur'))).toBe(false)

    binding.redo()
    expect(editor.document.elements.find((el) => el.id === 'nouveau-mur')).toMatchObject({ id: 'nouveau-mur', points: [0, 0, 3000, 0] })
  })

  it('un geste en direct n’écrit la scène qu’à la fin, en une seule étape d’annulation', () => {
    const { editor, binding } = solo()
    const original = editor.document
    editor.live = true
    editor.edit(binding, (doc) => moveWallStart(doc, 50))
    editor.edit(binding, (doc) => moveWallStart(doc, 50))
    expect(binding.canUndo()).toBe(false)
    editor.live = false
    binding.localChanged()
    expect(binding.canUndo()).toBe(true)
    binding.undo()
    expect(editor.document).toStrictEqual(original)
    expect(binding.canUndo()).toBe(false)
  })

  it('une pièce fermée par des murs suit son mur déplacé (modèle de pièces de Pascal)', () => {
    const { editor, binding } = solo()
    const doc = editor.document
    const sejour = doc.elements.find((el): el is RoomElement => el.type === 'room' && el.name === 'Séjour')!
    // Le mur dont un côté borde le Séjour à gauche (x = 3900 à l'axe, 4000 sur la face).
    const left = doc.elements.find(
      (el): el is WallElement => el.type === 'wall' && el.points.some((v, i) => i % 2 === 0 && v === 3900),
    )!
    const shifted = { ...left, points: left.points.map((v, i) => (i % 2 === 0 && v === 3900 ? 3700 : v)) }
    editor.edit(binding, (d) => ({ ...d, elements: d.elements.map((el) => (el.id === left.id ? shifted : el)) }))
    const after = editor.document.elements.find((el) => el.id === sejour.id) as RoomElement
    const xs = after.points.filter((_, i) => i % 2 === 0)
    expect(Math.min(...xs)).toBe(3800) // face intérieure du mur déplacé de 200 mm
  })

  it('prévient les abonnés « modèle changé » à chaque changement de la scène', () => {
    const events: number[] = []
    const off = onModelChanged((event) => events.push(Object.keys(event.scene.nodes).length))
    const { editor, binding } = solo()
    editor.edit(binding, (doc) => moveWallStart(doc, 10))
    binding.undo()
    off()
    expect(events.length).toBe(3) // ouverture, geste, annulation
  })
})

describe('SceneBinding : deux éditeurs sur la même scène', () => {
  function connected() {
    const docA = new Y.Doc()
    const docB = new Y.Doc()
    docA.on('update', (update: Uint8Array, origin: unknown) => origin !== 'B' && Y.applyUpdate(docB, update, 'A'))
    docB.on('update', (update: Uint8Array, origin: unknown) => origin !== 'A' && Y.applyUpdate(docA, update, 'B'))
    const a = new FakeEditor(example())
    const bindingA = new SceneBinding(docA, a)
    bindingA.start()
    const b = new FakeEditor(example())
    const bindingB = new SceneBinding(docB, b)
    bindingB.start()
    return { a, b, bindingA, bindingB }
  }

  it('une modification de A s’affiche chez B, et annuler chez B ne défait pas le geste de A', () => {
    const { a, b, bindingA, bindingB } = connected()
    const wall = firstWall(a.document)
    a.edit(bindingA, (doc) => moveWallStart(doc, 250))
    expect(firstWall(b.document).points[0]).toBe(wall.points[0] + 250)
    expect(b.remote.at(-1)?.fromPeer).toBe(true)
    expect(bindingB.canUndo()).toBe(false)
    bindingB.undo()
    expect(firstWall(b.document).points[0]).toBe(wall.points[0] + 250)
    bindingA.undo()
    expect(firstWall(b.document).points[0]).toBe(wall.points[0])
  })
})

describe('SceneBinding.pushScene : scène venue de l’éditeur de Pascal (M19 A2)', () => {
  /** Même scène, premier mur déplacé de `dx` m (comme un geste dans Pascal). */
  function movedScene(binding: SceneBinding, wallId: string, dx: number) {
    const scene = binding.getScene()!
    const id = `wall_${wallId}__0`
    const node = scene.nodes[id]
    const start = node.start as number[]
    return { ...scene, nodes: { ...scene.nodes, [id]: { ...node, start: [start[0] + dx, start[1]] } } }
  }

  it('écrit la scène dans le Y.Doc et met à jour la vue de l’éditeur (métrés, cotes)', () => {
    const { editor, binding } = solo()
    const wall = firstWall(editor.document)
    const next = movedScene(binding, wall.id, 0.1)
    binding.pushScene(next)
    expect(binding.getScene()).toBe(next)
    expect((readScene(binding.ydoc)!.nodes[`wall_${wall.id}__0`].start as number[])[0]).toBeCloseTo(
      (next.nodes[`wall_${wall.id}__0`].start as number[])[0],
      9,
    )
    expect(firstWall(editor.document).points[0]).toBeCloseTo(wall.points[0] + 100, 6)
    expect(editor.remote.at(-1)?.fromPeer).toBe(false)
  })

  it('une scène identique ne change rien', () => {
    const { editor, binding } = solo()
    const shown = editor.document
    binding.pushScene({ ...binding.getScene()! })
    expect(editor.document).toBe(shown)
    expect(binding.canUndo()).toBe(false)
  })

  it('chaque scène reçue est une étape d’annulation', () => {
    const { editor, binding } = solo()
    const wall = firstWall(editor.document)
    binding.pushScene(movedScene(binding, wall.id, 0.1))
    binding.pushScene(movedScene(binding, wall.id, 0.1))
    binding.undo()
    expect(firstWall(editor.document).points[0]).toBeCloseTo(wall.points[0] + 100, 6)
    binding.undo()
    expect(firstWall(editor.document).points[0]).toBeCloseTo(wall.points[0], 6)
  })
})
