import { describe, expect, it } from 'vitest'
import { createWallElement } from '../documents/elements'
import {
  buildThreads,
  canDeleteComment,
  canEditComment,
  commentExcerpt,
  countOpenThreads,
  filterThreads,
  levelNameOf,
  MAX_COMMENT_LENGTH,
  normalizeCommentBody,
  pinPosition,
  rowToComment,
  sortByActivity,
  threadsOnLevel,
  type Comment,
  type CommentRow,
} from './commentsLogic'

function comment(id: string, createdAt: string, extra: Partial<Comment> = {}): Comment {
  return {
    id,
    projectId: 'p1',
    authorId: 'alice',
    parentId: null,
    levelId: 'n1',
    elementId: null,
    x: 100,
    y: 200,
    body: `Texte ${id}`,
    resolvedBy: null,
    resolvedAt: null,
    createdAt,
    editedAt: null,
    ...extra,
  }
}

const T = (minute: number) => new Date(2026, 10, 15, 10, minute).toISOString()

describe('rowToComment', () => {
  it('convertit une ligne de la table', () => {
    const row: CommentRow = {
      id: 'c1',
      project_id: 'p1',
      author_id: 'alice',
      parent_id: null,
      level_id: 'n1',
      element_id: 'e1',
      x: 10,
      y: 20,
      body: 'Mur trop long',
      resolved_by: null,
      resolved_at: null,
      created_at: '2026-11-15T10:00:00Z',
      edited_at: null,
    }
    expect(rowToComment(row)).toEqual({
      id: 'c1',
      projectId: 'p1',
      authorId: 'alice',
      parentId: null,
      levelId: 'n1',
      elementId: 'e1',
      x: 10,
      y: 20,
      body: 'Mur trop long',
      resolvedBy: null,
      resolvedAt: null,
      createdAt: '2026-11-15T10:00:00Z',
      editedAt: null,
    })
  })
})

describe('normalizeCommentBody', () => {
  it('retire les espaces des extrémités et unifie les fins de ligne', () => {
    expect(normalizeCommentBody('  Bonjour\r\nà tous  ')).toBe('Bonjour\nà tous')
  })

  it('refuse un texte vide', () => {
    expect(normalizeCommentBody('  \n ')).toBeNull()
  })

  it(`coupe à ${MAX_COMMENT_LENGTH} caractères`, () => {
    expect(normalizeCommentBody('x'.repeat(MAX_COMMENT_LENGTH + 500))).toHaveLength(MAX_COMMENT_LENGTH)
  })

  it('garde le texte tel quel, sans interpréter le HTML', () => {
    expect(normalizeCommentBody('<b>gras</b>')).toBe('<b>gras</b>')
  })
})

describe('buildThreads', () => {
  const comments = [
    comment('c2', T(5)),
    comment('c1', T(0)),
    comment('r2', T(9), { parentId: 'c1', x: null, y: null, levelId: null }),
    comment('r1', T(3), { parentId: 'c1', x: null, y: null, levelId: null }),
    comment('orpheline', T(8), { parentId: 'disparu', x: null, y: null, levelId: null }),
  ]

  it('range les fils du plus ancien au plus récent, avec leurs réponses dans l’ordre', () => {
    const threads = buildThreads(comments)
    expect(threads.map((thread) => thread.root.id)).toEqual(['c1', 'c2'])
    expect(threads[0].replies.map((reply) => reply.id)).toEqual(['r1', 'r2'])
  })

  it('numérote les épingles dans l’ordre de création', () => {
    expect(buildThreads(comments).map((thread) => thread.number)).toEqual([1, 2])
  })

  it('ajouter un commentaire plus récent ne change pas les numéros existants', () => {
    const before = buildThreads(comments)
    const after = buildThreads([...comments, comment('c3', T(20))])
    expect(after.slice(0, 2).map((thread) => thread.number)).toEqual(before.map((thread) => thread.number))
    expect(after[2].number).toBe(3)
  })

  it('ignore une réponse dont le commentaire n’existe plus', () => {
    const all = buildThreads(comments).flatMap((thread) => [thread.root, ...thread.replies])
    expect(all.some((c) => c.id === 'orpheline')).toBe(false)
  })

  it('donne la date de la dernière activité', () => {
    const [first, second] = buildThreads(comments)
    expect(first.lastActivityAt).toBe(T(9))
    expect(second.lastActivityAt).toBe(T(5))
  })

  it('reconnaît un fil résolu', () => {
    const [thread] = buildThreads([comment('c1', T(0), { resolvedAt: T(4), resolvedBy: 'bruno' })])
    expect(thread.resolved).toBe(true)
  })
})

describe('filtres', () => {
  const threads = buildThreads([
    comment('a', T(0)),
    comment('b', T(1), { resolvedAt: T(2), resolvedBy: 'bruno' }),
    comment('c', T(3)),
  ])

  it('sépare ouverts et résolus', () => {
    expect(filterThreads(threads, 'open').map((t) => t.root.id)).toEqual(['a', 'c'])
    expect(filterThreads(threads, 'resolved').map((t) => t.root.id)).toEqual(['b'])
    expect(filterThreads(threads, 'all')).toHaveLength(3)
  })

  it('compte les fils ouverts', () => {
    expect(countOpenThreads(threads)).toBe(2)
  })

  it('garde les fils du niveau affiché', () => {
    const mixed = buildThreads([comment('a', T(0), { levelId: 'n1' }), comment('b', T(1), { levelId: 'n2' })])
    expect(threadsOnLevel(mixed, 'n2').map((t) => t.root.id)).toEqual(['b'])
    expect(threadsOnLevel(mixed, null)).toEqual([])
  })
})

describe('pinPosition', () => {
  const wall = createWallElement('Mur', [0, 0, 4000, 0], 200, 2700)

  it('un point libre reste où il a été posé', () => {
    expect(pinPosition(comment('c', T(0), { x: 50, y: 60 }), [wall])).toEqual({ x: 50, y: 60, orphaned: false })
  })

  it('suit l’élément quand il est déplacé', () => {
    const root = comment('c', T(0), { elementId: wall.id, x: 0, y: 0 })
    const here = pinPosition(root, [wall])
    const moved = pinPosition(root, [{ ...wall, points: [1000, 1000, 5000, 1000] } as typeof wall])
    expect(here?.orphaned).toBe(false)
    expect(moved?.orphaned).toBe(false)
    expect(moved!.y - here!.y).toBeCloseTo(1000, 0)
    expect(moved!.x - here!.x).toBeCloseTo(1000, 0)
  })

  it('reste à la dernière position quand l’élément est supprimé', () => {
    const root = comment('c', T(0), { elementId: 'disparu', x: 321, y: 654 })
    expect(pinPosition(root, [wall])).toEqual({ x: 321, y: 654, orphaned: true })
  })

  it('une réponse n’a pas de position', () => {
    expect(pinPosition(comment('r', T(0), { parentId: 'c', x: null, y: null }), [wall])).toBeNull()
  })
})

describe('commentExcerpt', () => {
  it('met le texte sur une ligne', () => {
    expect(commentExcerpt('Bonjour\n\n  à   tous')).toBe('Bonjour à tous')
  })

  it('coupe un texte long avec des points de suspension', () => {
    const excerpt = commentExcerpt('mot '.repeat(100), 20)
    expect(excerpt.length).toBeLessThanOrEqual(20)
    expect(excerpt.endsWith('…')).toBe(true)
  })
})

describe('sortByActivity', () => {
  it('met en premier le fil commenté en dernier', () => {
    const threads = buildThreads([
      comment('a', T(0)),
      comment('b', T(5)),
      comment('r', T(9), { parentId: 'a', x: null, y: null, levelId: null }),
    ])
    expect(sortByActivity(threads).map((thread) => thread.root.id)).toEqual(['a', 'b'])
  })
})

describe('levelNameOf', () => {
  const levels = [{ id: 'n1', name: 'Rez-de-chaussée' }]
  it('donne le nom du niveau, ou rien', () => {
    expect(levelNameOf(levels, 'n1')).toBe('Rez-de-chaussée')
    expect(levelNameOf(levels, 'disparu')).toBeNull()
    expect(levelNameOf(levels, null)).toBeNull()
    expect(levelNameOf(undefined, 'n1')).toBeNull()
  })
})

describe('droits sur un commentaire', () => {
  const mine = comment('c', T(0), { authorId: 'alice' })
  it('l’auteur modifie et supprime', () => {
    expect(canEditComment(mine, 'alice')).toBe(true)
    expect(canDeleteComment(mine, 'alice', 'editor')).toBe(true)
  })
  it('le propriétaire supprime mais ne modifie pas le texte des autres', () => {
    expect(canDeleteComment(mine, 'bruno', 'owner')).toBe(true)
    expect(canEditComment(mine, 'bruno')).toBe(false)
  })
  it('un autre membre ne peut ni modifier ni supprimer', () => {
    expect(canDeleteComment(mine, 'bruno', 'editor')).toBe(false)
    expect(canDeleteComment(mine, null, null)).toBe(false)
    expect(canEditComment(mine, null)).toBe(false)
  })
})
