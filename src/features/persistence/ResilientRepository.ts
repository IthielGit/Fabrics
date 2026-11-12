import { del, get, keys, set } from 'idb-keyval'
import type { Project } from '../../types/document'
import { migrateProject, type StoredProject } from '../documents/migrations'
import { isNetworkError } from './networkError'
import type { ProjectRepository, ProjectSummary } from './types'

export interface ResilientOptions {
  /** Appelée avec le nombre d'éléments (projets + images) qui attendent d'être envoyés. */
  onPendingChange?: (count: number) => void
  /** Délai entre deux nouvelles tentatives tant que des éléments attendent. */
  retryMs?: number
}

const DEFAULT_RETRY_MS = 30_000

function toSummary(project: Project): ProjectSummary {
  const { document: _document, ...summary } = project
  return summary
}

/**
 * Entoure un dépôt distant : si le réseau est coupé, l'enregistrement (projet ou image) est gardé
 * sur cet appareil, puis renvoyé dès que la connexion revient. Les erreurs qui ne viennent pas du
 * réseau (droits, données refusées) ne sont pas mises en attente : elles remontent telles quelles.
 *
 * Clés IndexedDB, séparées par compte :
 *   pending:<compte>:project:<id>  → dernier état du projet non envoyé
 *   pending:<compte>:asset:<id>    → image non envoyée (Blob)
 */
export class ResilientRepository implements ProjectRepository {
  private readonly inner: ProjectRepository
  private readonly prefix: string
  private readonly onPendingChange: (count: number) => void
  private readonly retryMs: number

  private readonly pendingProjects = new Set<string>()
  private readonly pendingAssets = new Set<string>()
  private readonly localUrls = new Map<string, string>()
  private readonly ready: Promise<void>
  /** Les écritures passent une par une : un renvoi tardif ne doit jamais écraser un enregistrement plus récent. */
  private queue: Promise<unknown> = Promise.resolve()
  private timer: ReturnType<typeof setInterval> | null = null
  private readonly onOnline = () => void this.flush()

  constructor(inner: ProjectRepository, userId: string, options: ResilientOptions = {}) {
    this.inner = inner
    this.prefix = `pending:${userId}:`
    this.onPendingChange = options.onPendingChange ?? (() => {})
    this.retryMs = options.retryMs ?? DEFAULT_RETRY_MS
    if (typeof window !== 'undefined') window.addEventListener('online', this.onOnline)
    this.ready = this.load()
  }

  /** Arrête les nouvelles tentatives (changement de compte). */
  dispose(): void {
    if (typeof window !== 'undefined') window.removeEventListener('online', this.onOnline)
    this.stopTimer()
    for (const url of this.localUrls.values()) URL.revokeObjectURL(url)
    this.localUrls.clear()
  }

  /** Nombre d'éléments en attente d'envoi. */
  get pendingCount(): number {
    return this.pendingProjects.size + this.pendingAssets.size
  }

  async list(): Promise<ProjectSummary[]> {
    await this.ready
    const remote = await this.inner.list()
    if (this.pendingProjects.size === 0) return remote
    // Les modifications en attente sont plus récentes que ce que le serveur connaît.
    const merged = new Map(remote.map((summary) => [summary.id, summary]))
    for (const id of this.pendingProjects) {
      const project = await this.readPending(id)
      if (project) merged.set(id, toSummary(project))
    }
    return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string): Promise<Project | null> {
    await this.ready
    if (this.pendingProjects.has(id)) {
      const pending = await this.readPending(id)
      if (pending) return pending
    }
    return this.inner.get(id)
  }

  save(project: Project): Promise<void> {
    return this.serial(() => this.doSave(project))
  }

  private async doSave(project: Project): Promise<void> {
    await this.ready
    try {
      await this.inner.save(project)
    } catch (error) {
      if (!isNetworkError(error)) throw error
      await set(this.projectKey(project.id), project)
      this.pendingProjects.add(project.id)
      this.changed()
      return
    }
    // Enregistré : une copie en attente plus ancienne n'a plus de raison d'être.
    if (this.pendingProjects.delete(project.id)) {
      await del(this.projectKey(project.id))
      this.changed()
    }
  }

  remove(id: string): Promise<void> {
    return this.serial(() => this.doRemove(id))
  }

  private async doRemove(id: string): Promise<void> {
    await this.ready
    await this.inner.remove(id)
    if (this.pendingProjects.delete(id)) {
      await del(this.projectKey(id))
      this.changed()
    }
  }

  putAsset(id: string, blob: Blob): Promise<void> {
    return this.serial(() => this.doPutAsset(id, blob))
  }

  private async doPutAsset(id: string, blob: Blob): Promise<void> {
    await this.ready
    try {
      await this.inner.putAsset(id, blob)
    } catch (error) {
      if (!isNetworkError(error)) throw error
      await set(this.assetKey(id), blob)
      this.pendingAssets.add(id)
      this.changed()
    }
  }

  async getAssetUrl(id: string): Promise<string> {
    await this.ready
    if (this.pendingAssets.has(id)) {
      const cached = this.localUrls.get(id)
      if (cached) return cached
      const blob = await get<Blob>(this.assetKey(id))
      if (blob) {
        const url = URL.createObjectURL(blob)
        this.localUrls.set(id, url)
        return url
      }
    }
    return this.inner.getAssetUrl(id)
  }

  /** Renvoie ce qui attend (images d'abord, puis projets). S'arrête dès que le réseau manque encore. */
  flush(): Promise<void> {
    return this.serial(() => this.doFlush())
  }

  private async doFlush(): Promise<void> {
    await this.ready
    if (this.pendingCount === 0) return

    for (const id of [...this.pendingAssets]) {
      const blob = await get<Blob>(this.assetKey(id))
      if (blob) {
        try {
          await this.inner.putAsset(id, blob)
        } catch (error) {
          if (isNetworkError(error)) return
          continue // refusée pour une autre raison : on la garde, sans bloquer le reste
        }
      }
      await del(this.assetKey(id))
      this.pendingAssets.delete(id)
      const url = this.localUrls.get(id)
      if (url) {
        URL.revokeObjectURL(url)
        this.localUrls.delete(id)
      }
      this.changed()
    }

    for (const id of [...this.pendingProjects]) {
      const project = await this.readPending(id)
      if (project) {
        try {
          await this.inner.save(project)
        } catch (error) {
          if (isNetworkError(error)) return
          continue
        }
      }
      await del(this.projectKey(id))
      this.pendingProjects.delete(id)
      this.changed()
    }
  }

  private async load(): Promise<void> {
    const projectPrefix = `${this.prefix}project:`
    const assetPrefix = `${this.prefix}asset:`
    for (const key of await keys()) {
      if (typeof key !== 'string') continue
      if (key.startsWith(projectPrefix)) this.pendingProjects.add(key.slice(projectPrefix.length))
      else if (key.startsWith(assetPrefix)) this.pendingAssets.add(key.slice(assetPrefix.length))
    }
    if (this.pendingCount > 0) {
      this.changed()
      void this.flush()
    }
  }

  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation, operation)
    this.queue = run.catch(() => {})
    return run
  }

  private async readPending(id: string): Promise<Project | null> {
    const stored = await get<StoredProject>(this.projectKey(id))
    return stored ? migrateProject(stored) : null
  }

  private changed(): void {
    this.onPendingChange(this.pendingCount)
    if (this.pendingCount > 0) this.startTimer()
    else this.stopTimer()
  }

  private startTimer(): void {
    if (this.timer) return
    this.timer = setInterval(() => void this.flush(), this.retryMs)
  }

  private stopTimer(): void {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  private projectKey(id: string): string {
    return `${this.prefix}project:${id}`
  }

  private assetKey(id: string): string {
    return `${this.prefix}asset:${id}`
  }
}
