// Commentaires ancrés (M16) : accès à Supabase. Sans Supabase (mode local), il n'y a pas de commentaires.
// Les droits (lire, écrire, modifier, supprimer, résoudre) sont tenus par la base (voir supabase/schema.sql,
// « M16 ») ; ici on envoie les demandes.

import { supabase } from '../../lib/supabase'
import { commentAnchorOf } from './commentAnchoring'
import { COMMENT_COLUMNS, rowToComment, type Comment, type CommentRow } from './commentsLogic'

function client() {
  if (!supabase) throw new Error('Supabase non configuré')
  return supabase
}

/** Vrai si les commentaires sont disponibles (compte Supabase configuré). */
export function commentsAvailable(): boolean {
  return supabase !== null
}

/** Tous les commentaires d'un projet, du plus ancien au plus récent. */
export async function listComments(projectId: string): Promise<Comment[]> {
  const { data, error } = await client()
    .from('project_comments')
    .select(COMMENT_COLUMNS)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .overrideTypes<CommentRow[], { merge: false }>()
  if (error) throw error
  return (data ?? []).map(rowToComment)
}

export interface NewComment {
  projectId: string
  /** Texte déjà nettoyé (`normalizeCommentBody`). */
  body: string
  levelId: string | null
  elementId: string | null
  x: number
  y: number
}

/** Pose un commentaire de premier niveau ; l'auteur est le compte connecté (rempli par la base). */
export async function createComment(comment: NewComment): Promise<Comment> {
  const { data, error } = await client()
    .from('project_comments')
    .insert({
      project_id: comment.projectId,
      level_id: comment.levelId,
      // M18 : projet Plan → nœud de la scène Pascal qui porte l'élément.
      element_id: comment.elementId === null ? null : commentAnchorOf(comment.elementId),
      x: comment.x,
      y: comment.y,
      body: comment.body,
    })
    .select(COMMENT_COLUMNS)
    .single()
    .overrideTypes<CommentRow, { merge: false }>()
  if (error) throw error
  return rowToComment(data)
}

/** Répond à un commentaire de premier niveau. */
export async function createReply(projectId: string, parentId: string, body: string): Promise<Comment> {
  const { data, error } = await client()
    .from('project_comments')
    .insert({ project_id: projectId, parent_id: parentId, body })
    .select(COMMENT_COLUMNS)
    .single()
    .overrideTypes<CommentRow, { merge: false }>()
  if (error) throw error
  return rowToComment(data)
}

/** Modifie le texte d'un de ses commentaires. */
export async function editComment(commentId: string, body: string): Promise<Comment> {
  const { data, error } = await client()
    .from('project_comments')
    .update({ body })
    .eq('id', commentId)
    .select(COMMENT_COLUMNS)
    .single()
    .overrideTypes<CommentRow, { merge: false }>()
  if (error) throw error
  return rowToComment(data)
}

/** Supprime un commentaire (et ses réponses) : son auteur, ou le propriétaire du projet. */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await client().from('project_comments').delete().eq('id', commentId)
  if (error) throw error
}

/** Résout ou rouvre un fil. */
export async function setCommentResolved(commentId: string, resolved: boolean): Promise<void> {
  const { error } = await client().rpc('set_comment_resolved', { p_comment_id: commentId, p_resolved: resolved })
  if (error) throw error
}
