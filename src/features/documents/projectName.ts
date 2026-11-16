import { fr } from '../../i18n/fr'
import type { Project } from '../../types/document'

const dayFormat = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' })
const timeFormat = new Intl.DateTimeFormat('fr', { hour: '2-digit', minute: '2-digit' })

/** Anciens noms par défaut, identiques pour tous les projets : on les remplace à l'affichage. */
const LEGACY_DEFAULT_NAMES = new Set<string>([fr.projects.defaultPlanName, fr.projects.defaultDesignName])

/**
 * Nom donné à un nouveau projet : « Plan du 16 nov. à 14:32 ». Si ce nom existe déjà
 * (deux projets dans la même minute), on ajoute « (2) », « (3) »…
 */
export function defaultProjectName(
  kind: Project['kind'],
  date: Date,
  existingNames: readonly string[] = [],
): string {
  const base = fr.projects.datedName(kind === 'plan', dayFormat.format(date), timeFormat.format(date))
  return uniqueName(base, existingNames)
}

/** `base` s'il est libre, sinon `base (2)`, `base (3)`… */
export function uniqueName(base: string, existingNames: readonly string[]): string {
  const taken = new Set(existingNames)
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base} (${n})`)) n += 1
  return `${base} (${n})`
}

/** Nom à afficher : un ancien « Plan sans titre » devient « Plan du <date de création> ». */
export function displayProjectName(project: Pick<Project, 'name' | 'kind' | 'createdAt'>): string {
  if (!LEGACY_DEFAULT_NAMES.has(project.name)) return project.name
  const created = new Date(project.createdAt)
  if (Number.isNaN(created.getTime())) return project.name
  return defaultProjectName(project.kind, created)
}
