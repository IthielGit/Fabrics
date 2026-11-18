// Commentaires ancrés (M16) : lecture des lignes de `project_comments`, fils de discussion, position des
// épingles. Fonctions pures, testées. Voir docs/02-ARCHITECTURE.md, « Commentaires ancrés (M16) ».

import { commentElementOf } from './commentAnchoring'
import { elementBounds } from '../export/bounds'
import type { CanvasElement } from '../../types/document'

export const MAX_COMMENT_LENGTH = 2000

/** Une ligne de `project_comments`. */
export interface CommentRow {
  id: string
  project_id: string
  author_id: string
  parent_id: string | null
  level_id: string | null
  element_id: string | null
  x: number | null
  y: number | null
  body: string
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  edited_at: string | null
}

export const COMMENT_COLUMNS =
  'id, project_id, author_id, parent_id, level_id, element_id, x, y, body, resolved_by, resolved_at, created_at, edited_at'

export interface Comment {
  id: string
  projectId: string
  authorId: string
  /** `null` : commentaire de premier niveau ; sinon identifiant du commentaire auquel il répond. */
  parentId: string | null
  levelId: string | null
  /** Élément sur lequel le commentaire est posé ; `null` pour un point libre. */
  elementId: string | null
  /** Point du plan (mm), ou dernière position connue de l'élément ; `null` pour une réponse. */
  x: number | null
  y: number | null
  body: string
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  editedAt: string | null
}

export function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    projectId: row.project_id,
    authorId: row.author_id,
    parentId: row.parent_id,
    levelId: row.level_id,
    // M18 : ancre sur un nœud de la scène Pascal → élément affiché par l'éditeur.
    elementId: row.element_id === null ? null : commentElementOf(row.element_id),
    x: row.x,
    y: row.y,
    body: row.body,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    editedAt: row.edited_at,
  }
}

/** Texte saisi : fins de ligne unifiées, espaces retirés aux extrémités, 2000 caractères au plus ; vide → `null`. */
export function normalizeCommentBody(input: string): string | null {
  const text = input.replace(/\r\n?/g, '\n').trim().slice(0, MAX_COMMENT_LENGTH).trim()
  return text === '' ? null : text
}

function time(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function byCreation(a: Comment, b: Comment): number {
  return time(a.createdAt) - time(b.createdAt) || a.id.localeCompare(b.id)
}

export interface CommentThread {
  root: Comment
  /** Réponses, de la plus ancienne à la plus récente. */
  replies: Comment[]
  /** Numéro de l'épingle : rang du commentaire parmi ceux du projet, du plus ancien au plus récent. */
  number: number
  resolved: boolean
  /** Date de la dernière réponse (ou du commentaire lui-même). */
  lastActivityAt: string
}

/**
 * Range les commentaires en fils. Une réponse dont le parent n'existe plus (ou n'est pas lisible) est
 * ignorée : elle n'a pas de position à montrer. Les numéros suivent l'ordre de création des commentaires
 * de premier niveau : ajouter un commentaire ne change jamais le numéro des autres.
 */
export function buildThreads(comments: readonly Comment[]): CommentThread[] {
  const roots = comments.filter((comment) => comment.parentId === null).sort(byCreation)
  const repliesByParent = new Map<string, Comment[]>()
  for (const comment of comments) {
    if (comment.parentId === null) continue
    const list = repliesByParent.get(comment.parentId)
    if (list) list.push(comment)
    else repliesByParent.set(comment.parentId, [comment])
  }
  return roots.map((root, index) => {
    const replies = (repliesByParent.get(root.id) ?? []).sort(byCreation)
    const last = replies.length > 0 ? replies[replies.length - 1] : root
    return {
      root,
      replies,
      number: index + 1,
      resolved: root.resolvedAt !== null,
      lastActivityAt: last.createdAt,
    }
  })
}

export type ThreadFilter = 'open' | 'resolved' | 'all'

export function filterThreads(threads: readonly CommentThread[], filter: ThreadFilter): CommentThread[] {
  if (filter === 'all') return [...threads]
  return threads.filter((thread) => (filter === 'resolved' ? thread.resolved : !thread.resolved))
}

/** Nombre de fils encore ouverts (pastille de l'onglet). */
export function countOpenThreads(threads: readonly CommentThread[]): number {
  return threads.reduce((count, thread) => (thread.resolved ? count : count + 1), 0)
}

export interface PinPosition {
  x: number
  y: number
  /** Vrai quand l'élément du commentaire n'existe plus : l'épingle reste à sa dernière position. */
  orphaned: boolean
}

/**
 * Où dessiner l'épingle d'un fil. Posé sur un élément : le centre de l'élément tel qu'il est maintenant
 * (l'épingle le suit s'il est déplacé) ; si l'élément n'existe plus : dernière position connue, signalée
 * « élément supprimé ». Posé sur un point : ce point.
 */
export function pinPosition(root: Comment, elements: readonly CanvasElement[]): PinPosition | null {
  if (root.x === null || root.y === null) return null
  if (root.elementId === null) return { x: root.x, y: root.y, orphaned: false }
  const element = elements.find((candidate) => candidate.id === root.elementId)
  if (!element) return { x: root.x, y: root.y, orphaned: true }
  const box = elementBounds(element)
  if (!box) return { x: root.x, y: root.y, orphaned: false }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, orphaned: false }
}

/** Fils posés sur le niveau affiché (un visuel n'a pas de niveau : `levelId` nul des deux côtés). */
export function threadsOnLevel(threads: readonly CommentThread[], levelId: string | null): CommentThread[] {
  return threads.filter((thread) => (thread.root.levelId ?? null) === levelId)
}

/** Début d'un texte, sur une seule ligne, pour une liste (`…` si coupé). */
export function commentExcerpt(body: string, max = 120): string {
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

/** Fils triés par activité : le plus récemment commenté d'abord. */
export function sortByActivity(threads: readonly CommentThread[]): CommentThread[] {
  return [...threads].sort(
    (a, b) => time(b.lastActivityAt) - time(a.lastActivityAt) || b.number - a.number,
  )
}

/** Nom du niveau d'un fil, ou `null` s'il n'en a pas (visuel) ou si le niveau n'existe plus. */
export function levelNameOf(levels: readonly { id: string; name: string }[] | undefined, levelId: string | null): string | null {
  if (!levelId || !levels) return null
  return levels.find((level) => level.id === levelId)?.name ?? null
}

/**
 * Peut-on supprimer ce commentaire ? Son auteur (membre) ou le propriétaire du projet : la base applique
 * les mêmes règles, ceci ne sert qu'à montrer ou cacher le bouton.
 */
export function canDeleteComment(comment: Comment, userId: string | null, role: string | null): boolean {
  if (!userId) return false
  return comment.authorId === userId || role === 'owner'
}

/** Seul l'auteur modifie le texte de son commentaire. */
export function canEditComment(comment: Comment, userId: string | null): boolean {
  return userId !== null && comment.authorId === userId
}

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * Ligne reçue en direct (Supabase Realtime, M16 lot E) : vérifiée champ par champ avant d'être utilisée.
 * Une ligne incomplète ou de mauvais type est ignorée (`null`) : la relecture régulière la remettra d'aplomb.
 */
export function parseCommentRow(value: unknown): CommentRow | null {
  if (typeof value !== 'object' || value === null) return null
  const row = value as Record<string, unknown>
  const id = text(row.id)
  const projectId = text(row.project_id)
  const authorId = text(row.author_id)
  const body = text(row.body)
  const createdAt = text(row.created_at)
  if (!id || !projectId || !authorId || body === null || !createdAt) return null
  const parentId = text(row.parent_id)
  const x = finiteOrNull(row.x)
  const y = finiteOrNull(row.y)
  // Un commentaire de premier niveau a toujours une position.
  if (parentId === null && (x === null || y === null)) return null
  return {
    id,
    project_id: projectId,
    author_id: authorId,
    parent_id: parentId,
    level_id: text(row.level_id),
    element_id: text(row.element_id),
    x,
    y,
    body,
    resolved_by: text(row.resolved_by),
    resolved_at: text(row.resolved_at),
    created_at: createdAt,
    edited_at: text(row.edited_at),
  }
}
