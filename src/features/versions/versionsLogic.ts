// Historique de versions (M15) : lecture des lignes de `project_versions` et regroupement pour l'affichage.
// Fonctions pures, testées. Voir docs/02-ARCHITECTURE.md, « Historique de versions (M15) ».
//
// Vocabulaire :
//   étape    = une ligne de la table (état du plan à la fin d'une fenêtre de ~2 min de travail) ;
//   session  = étapes consécutives d'un même moment de travail (même `session_id`, choisi par la base) ;
//   jour     = sessions dont la dernière étape tombe le même jour (heure locale de l'appareil).

import { colorForUser, safeAvatarUrl } from '../collab/presence'

export const MAX_VERSION_NAME = 100

/** Adresse de l'aperçu d'une version (lecture seule). */
export function versionPath(projectId: string, versionId: string): string {
  return `/p/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`
}

/** Version qui précède `versionId` dans le temps (pour montrer ce qui a changé), ou `null`. */
export function previousVersionOf(versions: readonly ProjectVersion[], versionId: string): ProjectVersion | null {
  const sorted = [...versions].sort((a, b) => time(b.savedAt) - time(a.savedAt) || time(b.startedAt) - time(a.startedAt))
  const index = sorted.findIndex((version) => version.id === versionId)
  return index >= 0 && index + 1 < sorted.length ? sorted[index + 1] : null
}

/** Une ligne de `project_versions`, sans le document (trop lourd pour la liste). */
export interface VersionRow {
  id: string
  session_id: string
  name: string | null
  authors: string[] | null
  started_at: string
  saved_at: string
}

/** Colonnes lues pour la liste. */
export const VERSION_COLUMNS = 'id, session_id, name, authors, started_at, saved_at'

export interface ProjectVersion {
  id: string
  sessionId: string
  /** `null` : version automatique. */
  name: string | null
  /** Comptes qui ont modifié le plan pendant cette étape. */
  authors: string[]
  startedAt: string
  savedAt: string
}

export function rowToVersion(row: VersionRow): ProjectVersion {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name && row.name.trim() !== '' ? row.name : null,
    authors: row.authors ?? [],
    startedAt: row.started_at,
    savedAt: row.saved_at,
  }
}

export interface VersionSession {
  id: string
  /** Étapes de la session, la plus récente d'abord. */
  versions: ProjectVersion[]
  /** Dernière étape : c'est elle qu'on montre quand la session est repliée. */
  latest: ProjectVersion
  startedAt: string
  savedAt: string
  /** Auteurs de toute la session, dans l'ordre de leur première modification. */
  authors: string[]
}

export interface VersionDay {
  /** Jour local, `AAAA-MM-JJ`. */
  key: string
  /** Sessions du jour, la plus récente d'abord. */
  sessions: VersionSession[]
}

function time(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

/** Jour local d'une date ISO, au format `AAAA-MM-JJ`. */
export function localDayKey(iso: string): string {
  const date = new Date(time(iso))
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** « Aujourd'hui », « Hier » ou rien (le jour s'affiche alors en toutes lettres). */
export function relativeDay(key: string, now: Date): 'today' | 'yesterday' | null {
  if (key === localDayKey(now.toISOString())) return 'today'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return key === localDayKey(yesterday.toISOString()) ? 'yesterday' : null
}

/**
 * Range les étapes en jours puis en sessions, le plus récent d'abord.
 * `namedOnly` : ne garde que les versions nommées (les sessions sans version nommée disparaissent).
 */
export function groupVersions(
  versions: readonly ProjectVersion[],
  options: { namedOnly?: boolean } = {},
): VersionDay[] {
  const kept = options.namedOnly ? versions.filter((version) => version.name !== null) : versions
  const sorted = [...kept].sort((a, b) => time(b.savedAt) - time(a.savedAt) || time(b.startedAt) - time(a.startedAt))

  const sessions = new Map<string, ProjectVersion[]>()
  for (const version of sorted) {
    const list = sessions.get(version.sessionId)
    if (list) list.push(version)
    else sessions.set(version.sessionId, [version])
  }

  const days: VersionDay[] = []
  for (const [id, list] of sessions) {
    const latest = list[0]
    const oldest = list[list.length - 1]
    const authors: string[] = []
    for (const version of [...list].reverse()) {
      for (const author of version.authors) if (!authors.includes(author)) authors.push(author)
    }
    const session: VersionSession = {
      id,
      versions: list,
      latest,
      startedAt: oldest.startedAt,
      savedAt: latest.savedAt,
      authors,
    }
    const key = localDayKey(latest.savedAt)
    const day = days.find((candidate) => candidate.key === key)
    if (day) day.sessions.push(session)
    else days.push({ key, sessions: [session] })
  }
  return days
}

/** Nom saisi pour une version : espaces retirés, 100 caractères au plus ; vide → `null`. */
export function normalizeVersionName(input: string): string | null {
  const trimmed = input.trim().slice(0, MAX_VERSION_NAME).trim()
  return trimmed === '' ? null : trimmed
}

// ---------------------------------------------------------------------------
// Personnes du projet (fonction `project_people`)
// ---------------------------------------------------------------------------

export interface PersonRow {
  user_id: string
  display_name: string | null
  avatar_url: string | null
}

export interface ProjectPerson {
  id: string
  name: string
  color: string
  /** Photo en https seulement. */
  avatarUrl?: string
}

export function rowToPerson(row: PersonRow, fallbackName: string): ProjectPerson {
  const name = (row.display_name ?? '').trim().slice(0, 60) || fallbackName
  const person: ProjectPerson = { id: row.user_id, name, color: colorForUser(row.user_id) }
  const avatarUrl = safeAvatarUrl(row.avatar_url)
  if (avatarUrl) person.avatarUrl = avatarUrl
  return person
}
