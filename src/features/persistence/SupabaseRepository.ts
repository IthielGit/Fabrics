import type { SupabaseClient } from '@supabase/supabase-js'
import type { CanvasElement, Project } from '../../types/document'
import { migrateProject } from '../documents/migrations'
import {
  SUMMARY_COLUMNS,
  assetPath,
  projectToRow,
  rowToStoredProject,
  rowToSummary,
  unusedAssetIds,
  type ProjectRow,
  type SummaryRow,
} from './cloudMapping'
import type { ProjectRepository, ProjectSummary } from './types'

const BUCKET = 'assets'
/** Durée de validité d'une URL signée d'image, en secondes. */
const SIGNED_URL_SECONDS = 3600
/** On en redemande une un peu avant la fin, pour ne jamais servir une URL qui expire. */
const SIGNED_URL_MARGIN_MS = 5 * 60 * 1000

/**
 * Projets et images d'un compte, dans Supabase. La sécurité est assurée par la base
 * (RLS) : un compte ne voit et ne modifie que ses propres lignes et ses propres fichiers.
 */
export class SupabaseRepository implements ProjectRepository {
  private signedUrls = new Map<string, { url: string; expiresAt: number }>()

  private readonly client: SupabaseClient
  private readonly userId: string

  constructor(client: SupabaseClient, userId: string) {
    this.client = client
    this.userId = userId
  }

  async list(): Promise<ProjectSummary[]> {
    const { data, error } = await this.client
      .from('projects')
      .select(SUMMARY_COLUMNS)
      .order('updated_at', { ascending: false })
      .overrideTypes<SummaryRow[], { merge: false }>()
    if (error) throw error
    return data.map(rowToSummary)
  }

  async get(id: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle<ProjectRow>()
    if (error) throw error
    return data ? migrateProject(rowToStoredProject(data)) : null
  }

  async save(project: Project): Promise<void> {
    const { error } = await this.client.from('projects').upsert(projectToRow(project))
    if (error) throw error
  }

  async remove(id: string): Promise<void> {
    const project = await this.get(id)
    const { error } = await this.client.from('projects').delete().eq('id', id)
    if (error) throw error
    if (!project) return

    // Une image n'est supprimée que si plus aucun projet restant ne l'utilise.
    const { data: others, error: othersError } = await this.client
      .from('projects')
      .select('elements:document->elements')
      .overrideTypes<{ elements: CanvasElement[] | null }[], { merge: false }>()
    if (othersError) throw othersError

    const unused = unusedAssetIds(
      project.document.elements,
      others.map((row) => ({ elements: row.elements ?? [] })),
    )
    if (unused.length === 0) return
    const { error: removeError } = await this.client.storage
      .from(BUCKET)
      .remove(unused.map((assetId) => assetPath(this.userId, assetId)))
    if (removeError) throw removeError
    for (const assetId of unused) this.signedUrls.delete(assetId)
  }

  async putAsset(id: string, blob: Blob): Promise<void> {
    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(assetPath(this.userId, id), blob, { upsert: true, contentType: blob.type || undefined })
    if (error) throw error
    this.signedUrls.delete(id)
  }

  async getAssetUrl(id: string): Promise<string> {
    const cached = this.signedUrls.get(id)
    if (cached && cached.expiresAt > Date.now()) return cached.url
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(assetPath(this.userId, id), SIGNED_URL_SECONDS)
    if (error || !data) throw error ?? new Error(`Image introuvable : ${id}`)
    this.signedUrls.set(id, {
      url: data.signedUrl,
      expiresAt: Date.now() + SIGNED_URL_SECONDS * 1000 - SIGNED_URL_MARGIN_MS,
    })
    return data.signedUrl
  }
}
