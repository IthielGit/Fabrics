// Liaison entre l'éditeur (document dans `editorStore`) et un `Y.Doc` partagé (M14, lot D).
// Sans React ni réseau : testée avec deux `Y.Doc` reliés en mémoire.

import * as Y from 'yjs'
import type { FabricsDocument } from '../../types/document'
import { createUndoStack } from './undoStack'
import {
  applyDocumentDiff,
  changedIdsOf,
  isLaterThan,
  isSavedAtOnly,
  isYDocumentEmpty,
  readDocument,
  readSavedAt,
  writeDocument,
  writeSavedAt,
  yParts,
} from './yDocument'

/** Origine des modifications faites dans cet éditeur : les seules que Ctrl+Z annule (D70). */
export const LOCAL_ORIGIN = Symbol('fabrics-local')
/** Origine du tout premier envoi du document au serveur : il ne s'annule pas. */
export const SEED_ORIGIN = Symbol('fabrics-seed')
/** Origine de la marque « enregistré dans Supabase » : ni affichée, ni annulable. */
export const SAVED_ORIGIN = Symbol('fabrics-saved')

export interface CollabHost {
  /** Document affiché par l'éditeur. */
  getDocument(): FabricsDocument | null
  /** Vrai pendant un geste en direct (glisser un mur, une poignée…). */
  isLiveEditing(): boolean
  /**
   * Affiche un document venu d'ailleurs (autre personne, annuler / rétablir), sans toucher à l'historique.
   * `fromPeer` : vrai quand le changement vient d'une autre connexion (et non de mon propre annuler / rétablir).
   */
  applyRemoteDocument(document: FabricsDocument, fromPeer: boolean): void
  /** Heure serveur du dernier enregistrement du projet tel que l'éditeur l'a ouvert (lot F). */
  getSavedAt?(): string | null
  /** Prévient quand « annuler » ou « rétablir » devient possible ou impossible. */
  onHistoryChange?(canUndo: boolean, canRedo: boolean): void
}

export class CollabBinding {
  readonly ydoc: Y.Doc
  private readonly host: CollabHost
  private readonly undoManager: Y.UndoManager
  /** Dernier document identique dans l'éditeur et dans le `Y.Doc` ; `null` avant `start`. */
  private synced: FabricsDocument | null = null
  /** Modifications reçues pendant un geste : appliquées à la fin du geste. */
  private pending: Set<string> | null = null
  /** Une des modifications en attente vient d'une autre connexion. */
  private pendingFromPeer = false
  private readonly onAfterTransaction: (transaction: Y.Transaction) => void
  private readonly onStackChange: () => void

  constructor(ydoc: Y.Doc, host: CollabHost) {
    this.ydoc = ydoc
    this.host = host
    const parts = yParts(ydoc)
    this.onStackChange = () => this.host.onHistoryChange?.(this.canUndo(), this.canRedo())
    // Un pas d'annulation par modification de l'éditeur (pas de regroupement dans le temps).
    this.undoManager = createUndoStack(
      [parts.meta, parts.page, parts.plan, parts.order, parts.elements, parts.levelOrder, parts.levels],
      LOCAL_ORIGIN,
      0,
      this.onStackChange,
    )

    this.onAfterTransaction = (transaction) => this.receive(transaction)
    ydoc.on('afterTransaction', this.onAfterTransaction)
  }

  /** Vrai une fois la première synchronisation faite. */
  get started(): boolean {
    return this.synced !== null
  }

  /**
   * À appeler après la première synchronisation avec le serveur. Projet inconnu du serveur :
   * on lui envoie le document de l'éditeur. Sinon, c'est la version du serveur qui s'affiche.
   */
  start(): void {
    if (this.synced) return
    const local = this.host.getDocument()
    if (!local) return
    if (isYDocumentEmpty(this.ydoc)) {
      writeDocument(this.ydoc, local, SEED_ORIGIN)
      this.synced = local
    } else {
      const shared = readDocument(this.ydoc)
      if (!shared) return
      // Lot F : le projet de l'éditeur a été enregistré dans Supabase après le dernier enregistrement
      // noté dans la salle (modifications faites hors connexion) : c'est lui qui est plus récent.
      const savedAt = readSavedAt(this.ydoc)
      if (savedAt !== null && isLaterThan(this.host.getSavedAt?.(), savedAt)) {
        applyDocumentDiff(this.ydoc, shared, local, SEED_ORIGIN)
        this.synced = local
      } else {
        this.synced = shared
        this.host.applyRemoteDocument(shared, true)
      }
    }
    this.onStackChange()
  }

  /** À appeler quand le document de l'éditeur ou l'état « geste en cours » change. */
  localChanged(): void {
    if (!this.synced || this.host.isLiveEditing()) return
    this.pushLocal()
    if (this.pending) this.applyShared(this.pending)
  }

  undo(): void {
    if (!this.synced) return
    this.pushLocal()
    this.undoManager.undo()
  }

  redo(): void {
    if (!this.synced) return
    this.pushLocal()
    this.undoManager.redo()
  }

  /** Note dans la salle l'heure d'un enregistrement réussi dans Supabase (lot F). */
  markSaved(savedAt: string): void {
    if (this.synced) writeSavedAt(this.ydoc, savedAt, SAVED_ORIGIN)
  }

  canUndo(): boolean {
    return this.undoManager.canUndo()
  }

  canRedo(): boolean {
    return this.undoManager.canRedo()
  }

  destroy(): void {
    this.ydoc.off('afterTransaction', this.onAfterTransaction)
    this.undoManager.destroy()
    this.synced = null
    this.pending = null
    this.pendingFromPeer = false
  }

  /** Envoie au `Y.Doc` ce que l'éditeur a modifié depuis la dernière synchronisation. */
  private pushLocal(): void {
    const current = this.host.getDocument()
    if (!this.synced || !current || current === this.synced) return
    const previous = this.synced
    this.synced = current
    applyDocumentDiff(this.ydoc, previous, current, LOCAL_ORIGIN)
  }

  private receive(transaction: Y.Transaction): void {
    if (!this.synced) return
    if (transaction.origin === LOCAL_ORIGIN || transaction.origin === SEED_ORIGIN) return
    if (transaction.origin === SAVED_ORIGIN) return
    if (transaction.changed.size === 0 || isSavedAtOnly(this.ydoc, transaction)) return
    // Annuler / rétablir passe par le gestionnaire d'historique : ce n'est pas une autre personne.
    if (transaction.origin !== this.undoManager) this.pendingFromPeer = true
    const ids = changedIdsOf(this.ydoc, transaction)
    this.pending = this.pending ? new Set([...this.pending, ...ids]) : ids
    if (this.host.isLiveEditing()) return // appliqué à la fin du geste (`localChanged`)
    // Une modification locale pas encore envoyée part d'abord (elle ne doit pas être écrasée).
    this.pushLocal()
    this.applyShared(this.pending)
  }

  private applyShared(changedIds: ReadonlySet<string>): void {
    const fromPeer = this.pendingFromPeer
    this.pending = null
    this.pendingFromPeer = false
    const shared = readDocument(this.ydoc, this.synced, changedIds)
    if (!shared) return
    this.synced = shared
    this.host.applyRemoteDocument(shared, fromPeer)
  }
}
