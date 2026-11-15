// Historique de versions (M15) : accès à Supabase. Sans Supabase (mode local), il n'y a pas d'historique.
// Les versions automatiques sont créées par la base (voir supabase/schema.sql, « M15 ») : ici on lit,
// on nomme et on renomme seulement.

import { supabase } from '../../lib/supabase'
import type { FabricsDocument } from '../../types/document'
import { migrateDocument, type StoredProject } from '../documents/migrations'
import {
  rowToPerson,
  rowToVersion,
  VERSION_COLUMNS,
  type PersonRow,
  type ProjectPerson,
  type ProjectVersion,
  type VersionRow,
} from './versionsLogic'

function client() {
  if (!supabase) throw new Error('Supabase non configuré')
  return supabase
}

/** Vrai si l'historique est disponible (compte Supabase configuré). */
export function versionsAvailable(): boolean {
  return supabase !== null
}

/** Versions d'un projet, sans leur document, la plus récente d'abord. */
export async function listVersions(projectId: string): Promise<ProjectVersion[]> {
  const { data, error } = await client()
    .from('project_versions')
    .select(VERSION_COLUMNS)
    .eq('project_id', projectId)
    .order('saved_at', { ascending: false })
    .overrideTypes<VersionRow[], { merge: false }>()
  if (error) throw error
  return (data ?? []).map(rowToVersion)
}

/** Document d'une version, mis au format actuel ; `null` si la version n'existe plus. */
export async function fetchVersionDocument(versionId: string): Promise<FabricsDocument | null> {
  const { data, error } = await client()
    .from('project_versions')
    .select('document')
    .eq('id', versionId)
    .maybeSingle()
    .overrideTypes<{ document: StoredProject['document'] } | null, { merge: false }>()
  if (error) throw error
  return data ? migrateDocument(data.document) : null
}

/** Nomme l'état enregistré du projet ; renvoie l'identifiant de la nouvelle version. */
export async function createNamedVersion(projectId: string, name: string): Promise<string> {
  const { data, error } = await client().rpc('create_named_version', { p_project_id: projectId, p_name: name })
  if (error) throw error
  return data as string
}

/** Nomme, renomme ou retire le nom (`null`) d'une version. */
export async function renameVersion(versionId: string, name: string | null): Promise<void> {
  const { error } = await client().rpc('rename_version', { p_version_id: versionId, p_name: name ?? '' })
  if (error) throw error
}

/** Nom, couleur et photo des personnes du projet (propriétaire, membres, auteurs de versions). */
export async function listProjectPeople(projectId: string, fallbackName: string): Promise<ProjectPerson[]> {
  const { data, error } = await client().rpc('project_people', { p_project_id: projectId })
  if (error) throw error
  return ((data ?? []) as PersonRow[]).map((row) => rowToPerson(row, fallbackName))
}
