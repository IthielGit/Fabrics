/**
 * Copie de secours sur l'appareil (M24, 24.3, D24-8) : un enregistrement refusé pour une autre raison
 * que le réseau (droits, données refusées) n'est pas perdu. La copie est gardée dans IndexedDB, et le
 * bandeau « Reprendre là où vous en étiez ? » ne s'affiche que si elle est plus récente que le projet
 * ouvert (cas rare, jamais à chaque ouverture).
 */
import { del, get, set } from 'idb-keyval'
import type { Project } from '../../types/document'
import { migrateProject, toStoredProject, type StoredProject } from '../documents/migrations'

export type SaveErrorReason = 'forbidden' | 'rejected' | 'other'

/** Raison lisible d'un refus d'enregistrement (codes Postgres / HTTP de Supabase). */
export function saveErrorReason(error: unknown): SaveErrorReason {
  if (!error || typeof error !== 'object') return 'other'
  const { code, status, message } = error as { code?: unknown; status?: unknown; message?: unknown }
  const text = typeof message === 'string' ? message : ''
  if (code === '42501' || status === 401 || status === 403 || /row-level security|permission denied|not allowed/i.test(text)) return 'forbidden'
  if (typeof code === 'string' && /^(22|23)/.test(code)) return 'rejected'
  if (status === 400 || status === 413 || status === 422) return 'rejected'
  return 'other'
}

/** Vrai si la copie de l'appareil est plus récente que le projet ouvert. */
export function isRescueNewer(rescue: Pick<Project, 'updatedAt'> | null, opened: Pick<Project, 'updatedAt'>): boolean {
  return rescue !== null && rescue.updatedAt > opened.updatedAt
}

const key = (projectId: string) => `rescue:${projectId}`

export async function keepRescueCopy(project: Project): Promise<void> {
  await set(key(project.id), toStoredProject(project))
}

export async function readRescueCopy(projectId: string): Promise<Project | null> {
  const stored = await get<StoredProject>(key(projectId))
  if (!stored) return null
  try {
    return migrateProject(stored)
  } catch {
    return null
  }
}

export async function dropRescueCopy(projectId: string): Promise<void> {
  await del(key(projectId))
}
