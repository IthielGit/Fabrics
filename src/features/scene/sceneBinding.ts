// Liaison entre l'éditeur actuel et la scène Pascal d'un projet Plan (M18, lot C ; ADR 0004, 0005).
//
// La scène vit dans un `Y.Doc` : local quand on travaille seul, partagé en collaboration (lot E).
// L'éditeur affiche une vue calculée (`FabricsDocument`) ; chacun de ses gestes est converti en
// scène, chargé par Pascal (qui reprend les pièces à l'axe des murs), puis seuls les nœuds modifiés
// sont écrits dans le `Y.Doc`. La vue est recalculée depuis la scène : une pièce suit ses murs.
//
// Un seul historique (ADR 0005) : `Y.UndoManager`, qui n'annule que les gestes de cet éditeur.
// Sans React ni réseau : testée avec des `Y.Doc` en mémoire.

import * as Y from 'yjs'
import type { CanvasElement, FabricsDocument, Level } from '../../types/document'
import { isLaterThan } from '../collab/yDocument'
import { fabricsToScene } from './migrate/fromFabrics'
import { emitModelChanged } from './modelEvents'
import type { PlanScene } from './sceneTypes'
import { settleScene } from './settle'
import { sceneToFabricsView } from './view/toFabricsView'
import {
  applySceneDiff,
  changedNodeIdsOf,
  isSceneSavedAtOnly,
  isYSceneEmpty,
  readScene,
  readSceneSavedAt,
  writeScene,
  writeSceneSavedAt,
  ySceneParts,
} from './yScene'

/** Origine des modifications faites dans cet éditeur : les seules que Ctrl+Z annule. */
export const SCENE_LOCAL_ORIGIN = Symbol('fabrics-scene-local')
/** Origine du premier envoi de la scène (ne s'annule pas). */
export const SCENE_SEED_ORIGIN = Symbol('fabrics-scene-seed')
/** Origine de la marque « enregistré dans Supabase ». */
export const SCENE_SAVED_ORIGIN = Symbol('fabrics-scene-saved')

export interface SceneHost {
  /** Document affiché par l'éditeur (vue calculée). */
  getDocument(): FabricsDocument | null
  /** Vrai pendant un geste en direct : la scène n'est écrite qu'à la fin du geste. */
  isLiveEditing(): boolean
  /** Affiche une vue venue de la scène (autre personne, annuler / rétablir, pièce qui suit ses murs). */
  applyRemoteDocument(document: FabricsDocument, fromPeer: boolean): void
  /** Scène enregistrée du projet ouvert (M18, lot D) : point de départ, à la place de la vue. */
  getScene?(): PlanScene | null
  /** La scène a changé (à garder avec le projet : c'est elle qui est enregistrée). */
  onSceneChanged?(scene: PlanScene): void
  /** Heure serveur du dernier enregistrement du projet ouvert (collaboration). */
  getSavedAt?(): string | null
  onHistoryChange?(canUndo: boolean, canRedo: boolean): void
}

/** Plan → scène telle que Pascal la garde. */
export function planToScene(document: FabricsDocument): PlanScene {
  return settleScene(fabricsToScene(document).scene)
}

/** Vue recalculée, en gardant les objets de `previous` qui n'ont pas changé (affichage rapide). */
export function viewOfScene(scene: PlanScene, previous?: FabricsDocument | null): FabricsDocument {
  const view = sceneToFabricsView(scene)
  if (!previous) return view
  const elements = reuse(previous.elements, view.elements)
  const levels = view.levels && previous.levels ? reuse(previous.levels, view.levels) : view.levels
  const same = deepEqual
  const result: FabricsDocument = {
    ...view,
    page: same(previous.page, view.page) ? previous.page : view.page,
    elements: sameList(previous.elements, elements) ? previous.elements : elements,
  }
  if (view.plan) result.plan = previous.plan && same(previous.plan, view.plan) ? previous.plan : view.plan
  if (levels) result.levels = previous.levels && sameList(previous.levels, levels) ? previous.levels : levels
  const unchanged =
    result.version === previous.version &&
    result.unit === previous.unit &&
    result.page === previous.page &&
    result.elements === previous.elements &&
    result.plan === previous.plan &&
    result.levels === previous.levels
  return unchanged ? previous : result
}

function reuse<T extends CanvasElement | Level>(previous: readonly T[], next: readonly T[]): T[] {
  const byId = new Map(previous.map((item) => [item.id, item]))
  return next.map((item) => {
    const before = byId.get(item.id)
    return before && deepEqual(before, item) ? before : item
  })
}

/** Égalité de valeurs JSON, quel que soit l'ordre des propriétés. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const other = b as unknown[]
    return a.length === other.length && a.every((value, index) => deepEqual(value, other[index]))
  }
  const left = Object.entries(a as Record<string, unknown>).filter(([, v]) => v !== undefined)
  const right = b as Record<string, unknown>
  const rightCount = Object.values(right).filter((v) => v !== undefined).length
  return left.length === rightCount && left.every(([key, value]) => deepEqual(value, right[key]))
}

function sameList<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

export class SceneBinding {
  readonly ydoc: Y.Doc
  private readonly host: SceneHost
  private readonly undoManager: Y.UndoManager
  /** Dernière vue identique dans l'éditeur et dans le `Y.Doc` ; `null` avant `start`. */
  private synced: FabricsDocument | null = null
  /** Scène correspondant à `synced`. */
  private scene: PlanScene | null = null
  private pending: Set<string> | null = null
  private pendingFromPeer = false
  private readonly onAfterTransaction: (transaction: Y.Transaction) => void
  private readonly onStackChange: () => void

  constructor(ydoc: Y.Doc, host: SceneHost) {
    this.ydoc = ydoc
    this.host = host
    const parts = ySceneParts(ydoc)
    // Une étape d'annulation par geste : chaque écriture ferme l'étape précédente (`stopCapturing`),
    // sauf quand l'éditeur demande de prolonger le geste (appuis rapides sur les flèches).
    this.undoManager = new Y.UndoManager([parts.meta, parts.nodes], {
      trackedOrigins: new Set([SCENE_LOCAL_ORIGIN]),
      captureTimeout: Number.MAX_SAFE_INTEGER,
    })
    this.onStackChange = () => this.host.onHistoryChange?.(this.canUndo(), this.canRedo())
    this.undoManager.on('stack-item-added', this.onStackChange)
    this.undoManager.on('stack-item-popped', this.onStackChange)
    this.undoManager.on('stack-cleared', this.onStackChange)
    this.onAfterTransaction = (transaction) => this.receive(transaction)
    ydoc.on('afterTransaction', this.onAfterTransaction)
  }

  get started(): boolean {
    return this.synced !== null
  }

  /** Scène actuelle (celle du `Y.Doc` vue par cet éditeur). */
  getScene(): PlanScene | null {
    return this.scene
  }

  /**
   * Première synchronisation. `Y.Doc` vide : on y écrit la scène du plan de l'éditeur. Sinon la scène
   * partagée s'affiche, sauf si le plan de l'éditeur a été enregistré après elle (hors connexion).
   */
  start(): void {
    if (this.synced) return
    const local = this.host.getDocument()
    if (!local) return
    if (isYSceneEmpty(this.ydoc)) {
      const stored = this.host.getScene?.()
      const scene = stored ? settleScene(stored) : planToScene(local)
      writeScene(this.ydoc, scene, SCENE_SEED_ORIGIN)
      this.adopt(scene, local, false)
    } else {
      const shared = readScene(this.ydoc)
      if (!shared) return
      const savedAt = readSceneSavedAt(this.ydoc)
      if (savedAt !== null && isLaterThan(this.host.getSavedAt?.(), savedAt)) {
        const scene = planToScene(local)
        applySceneDiff(this.ydoc, shared, scene, SCENE_SEED_ORIGIN)
        this.adopt(scene, local, false)
      } else {
        this.adopt(shared, local, true)
      }
    }
    this.onStackChange()
  }

  /**
   * À appeler quand le document de l'éditeur ou l'état « geste en cours » change. `merge` : la
   * modification prolonge le geste précédent (même étape d'annulation).
   */
  localChanged(options: { merge?: boolean } = {}): void {
    if (!this.synced || this.host.isLiveEditing()) return
    if (!options.merge) this.undoManager.stopCapturing()
    this.pushLocal()
    if (this.pending) this.applyShared(this.pending)
  }

  undo(): void {
    if (!this.synced) return
    this.undoManager.stopCapturing()
    this.pushLocal()
    this.undoManager.undo()
  }

  redo(): void {
    if (!this.synced) return
    this.undoManager.stopCapturing()
    this.pushLocal()
    this.undoManager.redo()
  }

  canUndo(): boolean {
    return this.undoManager.canUndo()
  }

  /** Nombre d'étapes qu'« annuler » peut défaire. */
  undoDepth(): number {
    return this.undoManager.undoStack.length
  }

  canRedo(): boolean {
    return this.undoManager.canRedo()
  }

  markSaved(savedAt: string): void {
    if (this.synced) writeSceneSavedAt(this.ydoc, savedAt, SCENE_SAVED_ORIGIN)
  }

  destroy(): void {
    this.ydoc.off('afterTransaction', this.onAfterTransaction)
    this.undoManager.destroy()
    this.synced = null
    this.scene = null
    this.pending = null
    this.pendingFromPeer = false
  }

  /** Retient la scène et affiche sa vue si elle diffère du document de l'éditeur. */
  private adopt(scene: PlanScene, shown: FabricsDocument, fromPeer: boolean, changedIds?: ReadonlySet<string>): void {
    const previous = this.scene
    this.scene = scene
    const view = viewOfScene(scene, shown)
    this.synced = view
    if (view !== shown) this.host.applyRemoteDocument(view, fromPeer)
    if (scene !== previous) this.host.onSceneChanged?.(scene)
    emitModelChanged({ scene, previous, changedNodeIds: changedIds ?? null })
  }

  /** Écrit dans le `Y.Doc` ce que l'éditeur a modifié depuis la dernière synchronisation. */
  private pushLocal(): void {
    const current = this.host.getDocument()
    if (!this.synced || !this.scene || !current || current === this.synced) return
    const next = planToScene(current)
    applySceneDiff(this.ydoc, this.scene, next, SCENE_LOCAL_ORIGIN)
    this.adopt(next, current, false)
  }

  private receive(transaction: Y.Transaction): void {
    if (!this.synced) return
    const origin = transaction.origin
    if (origin === SCENE_LOCAL_ORIGIN || origin === SCENE_SEED_ORIGIN || origin === SCENE_SAVED_ORIGIN) return
    if (transaction.changed.size === 0 || isSceneSavedAtOnly(this.ydoc, transaction)) return
    const ids = changedNodeIdsOf(this.ydoc, transaction)
    if (ids.size === 0 && !transaction.changed.has(ySceneParts(this.ydoc).meta as never)) return
    if (origin !== this.undoManager) this.pendingFromPeer = true
    this.pending = this.pending ? new Set([...this.pending, ...ids]) : ids
    if (this.host.isLiveEditing()) return
    this.pushLocal()
    this.applyShared(this.pending)
  }

  private applyShared(changedIds: ReadonlySet<string>): void {
    const fromPeer = this.pendingFromPeer
    this.pending = null
    this.pendingFromPeer = false
    const shared = readScene(this.ydoc, this.scene, changedIds)
    const shown = this.host.getDocument()
    if (!shared || !shown) return
    this.adopt(shared, shown, fromPeer, changedIds)
  }
}
