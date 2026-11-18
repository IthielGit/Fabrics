/**
 * M18, lot E : en collaboration, la scène du plan ouvert devient celle de la salle partagée, avec un
 * seul historique ; à la fin de la collaboration, l'éditeur revient à une scène locale.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { createExamplePlanProject } from '../features/documents/createProject'
import { SceneBinding } from '../features/scene/sceneBinding'
import { readScene } from '../features/scene/yScene'
import type { FabricsDocument, WallElement } from '../types/document'
import { getPlanBinding, setSharedPlanBinding, undoDepth, useEditorStore } from './editorStore'

const NOW = new Date('2026-11-18T00:00:00Z')
const store = () => useEditorStore.getState()
const wallOf = (doc: FabricsDocument) => doc.elements.find((el): el is WallElement => el.type === 'wall')!

beforeEach(() => store().loadProject(createExamplePlanProject(NOW)))

/** Salle partagée : le Y.Doc de l'éditeur relié à celui d'une autre personne (B). */
function sharedRoom() {
  const mine = new Y.Doc()
  const theirs = new Y.Doc()
  mine.on('update', (u: Uint8Array, origin: unknown) => origin !== 'B' && Y.applyUpdate(theirs, u, 'A'))
  theirs.on('update', (u: Uint8Array, origin: unknown) => origin !== 'A' && Y.applyUpdate(mine, u, 'B'))
  const shared = new SceneBinding(mine, {
    getDocument: () => store().project?.document ?? null,
    isLiveEditing: () => store().liveEditing,
    applyRemoteDocument: (document, fromPeer) => store().applyRemoteDocument(document, fromPeer),
    getScene: () => store().project?.scene ?? null,
  })
  shared.start()
  setSharedPlanBinding(shared)
  return { shared, theirs }
}

describe('editorStore et scène partagée (M18, lot E)', () => {
  it('un geste de l’éditeur arrive dans la scène de l’autre personne', () => {
    const { shared, theirs } = sharedRoom()
    expect(getPlanBinding()).toBe(shared)
    const wall = wallOf(store().project!.document)
    store().replaceElements([{ ...wall, points: [wall.points[0] + 300, ...wall.points.slice(1)] }])
    const node = readScene(theirs)!.nodes[`wall_${wall.id}__0`]
    expect((node.start as number[])[0]).toBeCloseTo((wall.points[0] + 300) / 1000, 9)
  })

  it('annuler défait mon geste, pas celui de l’autre personne', () => {
    const { theirs } = sharedRoom()
    const wall = wallOf(store().project!.document)
    store().replaceElements([{ ...wall, points: [wall.points[0] + 300, ...wall.points.slice(1)] }])
    // L'autre personne renomme le même mur (autre propriété du même nœud).
    theirs.transact(() => {
      const nodes = theirs.getMap<Y.Map<unknown>>('sceneNodes')
      nodes.get(`wall_${wall.id}__0`)!.set('name', 'Mur renommé')
    }, 'B-local')
    expect(wallOf(store().project!.document).name).toBe('Mur renommé')
    store().undo()
    const after = wallOf(store().project!.document)
    expect(after.points[0]).toBe(wall.points[0])
    expect(after.name).toBe('Mur renommé')
  })

  it('fin de la collaboration : retour à une scène locale, sans perdre la scène', () => {
    const { shared } = sharedRoom()
    const wall = wallOf(store().project!.document)
    store().replaceElements([{ ...wall, points: [wall.points[0] + 300, ...wall.points.slice(1)] }])
    shared.destroy()
    setSharedPlanBinding(null)
    const local = getPlanBinding()
    expect(local).not.toBe(shared)
    expect(local?.started).toBe(true)
    expect(wallOf(store().project!.document).points[0]).toBe(wall.points[0] + 300)
    expect(undoDepth()).toBe(0) // nouvel historique local
  })
})
