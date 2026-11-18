import { afterEach, describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import type { FabricsDocument, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { commentAnchorOf, setCommentAnchorResolver } from '../comments/commentAnchoring'
import { pinPosition, rowToComment, type CommentRow } from '../comments/commentsLogic'
import { createExamplePlanProject } from '../documents/createProject'
import { anchorOfElement, elementOfAnchor } from './commentAnchors'
import { planToScene, SceneBinding } from './sceneBinding'

const NOW = new Date('2026-11-18T00:00:00Z')

afterEach(() => setCommentAnchorResolver(null))

function example() {
  const document = createExamplePlanProject(NOW).document
  const multiSideWall = document.elements.find((el): el is WallElement => el.type === 'wall' && el.points.length > 4)!
  const door = document.elements.find((el): el is OpeningElement => el.type === 'opening')!
  const room = document.elements.find((el): el is RoomElement => el.type === 'room')!
  return { document, scene: planToScene(document), multiSideWall, door, room }
}

function row(elementId: string | null, x = 0, y = 0): CommentRow {
  return {
    id: 'c1', project_id: 'p', author_id: 'a', parent_id: null, level_id: null, element_id: elementId, x, y,
    body: 'Vérifier', resolved_by: null, resolved_at: null, created_at: '2026-11-18T00:00:00Z', edited_at: null,
  } as CommentRow
}

describe('commentaires ancrés sur les nœuds de la scène (M18, lot E)', () => {
  it('un mur à plusieurs côtés : le commentaire va sur son premier côté (point 5 A)', () => {
    const { scene, multiSideWall, door, room } = example()
    expect(anchorOfElement(scene, multiSideWall.id)).toBe(`wall_${multiSideWall.id}__0`)
    expect(anchorOfElement(scene, door.id)).toMatch(new RegExp(`^(door|window)_${door.id}$`))
    expect(anchorOfElement(scene, room.id)).toBe(`zone_${room.id}`)
  })

  it('l’ancre redevient l’élément affiché ; les ancres d’avant M18 restent valables', () => {
    const { scene, multiSideWall, door } = example()
    for (const id of [multiSideWall.id, door.id]) expect(elementOfAnchor(anchorOfElement(scene, id))).toBe(id)
    expect(elementOfAnchor('5f0c9a52-8d2e-4c1b-9f3a-2b7e1d4c6a90')).toBe('5f0c9a52-8d2e-4c1b-9f3a-2b7e1d4c6a90')
    expect(elementOfAnchor(`wall_${multiSideWall.id}__3`)).toBe(multiSideWall.id) // côté retiré depuis
  })

  it('enregistré sur le nœud, relu sur l’élément : rowToComment / commentAnchorOf', () => {
    const { scene, multiSideWall } = example()
    setCommentAnchorResolver((id) => anchorOfElement(scene, id))
    const anchor = commentAnchorOf(multiSideWall.id)
    expect(anchor).toBe(`wall_${multiSideWall.id}__0`)
    expect(rowToComment(row(anchor)).elementId).toBe(multiSideWall.id)
    setCommentAnchorResolver(null)
    expect(commentAnchorOf(multiSideWall.id)).toBe(multiSideWall.id) // projet Visuel
  })

  it('un commentaire reste attaché à son élément quand un autre éditeur le déplace', () => {
    const { document, multiSideWall } = example()
    const docA = new Y.Doc()
    const docB = new Y.Doc()
    docA.on('update', (u: Uint8Array, origin: unknown) => origin !== 'B' && Y.applyUpdate(docB, u, 'A'))
    docB.on('update', (u: Uint8Array, origin: unknown) => origin !== 'A' && Y.applyUpdate(docA, u, 'B'))
    const editors = [document, structuredClone(document)].map((initial) => {
      const editor = {
        document: initial as FabricsDocument,
        getDocument: () => editor.document,
        isLiveEditing: () => false,
        applyRemoteDocument: (next: FabricsDocument) => void (editor.document = next),
      }
      return editor
    })
    const [a, b] = editors
    const bindingA = new SceneBinding(docA, a)
    bindingA.start()
    const bindingB = new SceneBinding(docB, b)
    bindingB.start()

    const comment = rowToComment(row(anchorOfElement(bindingB.getScene(), multiSideWall.id), 1, 1))
    const before = pinPosition(comment, b.document.elements)!
    a.document = {
      ...a.document,
      elements: a.document.elements.map((el) =>
        el.id === multiSideWall.id ? { ...multiSideWall, points: multiSideWall.points.map((v, i) => (i % 2 === 0 ? v + 1000 : v)) } : el,
      ),
    }
    bindingA.localChanged()
    const after = pinPosition(comment, b.document.elements)!
    expect(after.orphaned).toBe(false)
    expect(after.x).toBeCloseTo(before.x + 1000, 6)
    expect(after.y).toBeCloseTo(before.y, 6)
  })
})
