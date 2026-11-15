import { create } from 'zustand'
import type { Comment } from '../features/comments/commentsLogic'
import type { ProjectRole } from '../features/sharing/membersLogic'
import type { ProjectPerson } from '../features/versions/versionsLogic'

/** Commentaire en cours de rédaction : où il sera posé (outil « Commenter », M16 lot B). */
export interface CommentDraft {
  /** Élément visé ; `null` : point libre. */
  elementId: string | null
  levelId: string | null
  /** Point cliqué (mm). */
  x: number
  y: number
}

/**
 * Commentaires du projet ouvert (M16). Hors du document du plan : rien ici n'entre dans l'historique
 * d'annulation, les exports ou les versions.
 */
interface CommentsState {
  comments: Comment[]
  /** Vrai une fois la première lecture faite. */
  loaded: boolean
  draft: CommentDraft | null
  /** Nom, couleur et photo des personnes du projet (auteurs des commentaires). */
  people: ReadonlyMap<string, ProjectPerson>
  /** Fil ouvert dans le panneau « Commentaires » (identifiant de son commentaire de premier niveau). */
  selectedThreadId: string | null
  /** Rôle de la personne sur le projet (suppression des commentaires des autres : propriétaire). */
  myRole: ProjectRole | null
  setPeople: (people: ReadonlyMap<string, ProjectPerson>) => void
  setMyRole: (role: ProjectRole | null) => void
  setComments: (comments: Comment[]) => void
  /** Ajoute un commentaire reçu ou créé (sans doublon). */
  addComment: (comment: Comment) => void
  /** Remplace un commentaire connu (texte modifié, fil résolu…). */
  replaceComment: (comment: Comment) => void
  /** Retire un commentaire et ses réponses. */
  removeComment: (commentId: string) => void
  selectThread: (threadId: string | null) => void
  openDraft: (draft: CommentDraft) => void
  closeDraft: () => void
  reset: () => void
}

export const useCommentsStore = create<CommentsState>((set) => ({
  comments: [],
  loaded: false,
  draft: null,
  people: new Map(),
  selectedThreadId: null,
  myRole: null,
  setPeople: (people) => set({ people }),
  setMyRole: (myRole) => set({ myRole }),
  setComments: (comments) => set({ comments, loaded: true }),
  addComment: (comment) =>
    set((state) =>
      state.comments.some((existing) => existing.id === comment.id)
        ? state
        : { comments: [...state.comments, comment] },
    ),
  replaceComment: (comment) =>
    set((state) => ({
      comments: state.comments.map((existing) => (existing.id === comment.id ? comment : existing)),
    })),
  removeComment: (commentId) =>
    set((state) => ({
      comments: state.comments.filter((comment) => comment.id !== commentId && comment.parentId !== commentId),
      selectedThreadId: state.selectedThreadId === commentId ? null : state.selectedThreadId,
    })),
  selectThread: (selectedThreadId) => set({ selectedThreadId }),
  openDraft: (draft) => set({ draft }),
  closeDraft: () => set({ draft: null }),
  reset: () =>
    set({
      comments: [],
      loaded: false,
      draft: null,
      people: new Map(),
      selectedThreadId: null,
      myRole: null,
    }),
}))
