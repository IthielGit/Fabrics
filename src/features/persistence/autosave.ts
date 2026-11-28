import type { Project } from '../../types/document'

export type AutosaveStatus = 'saved' | 'saving' | 'error'

export interface AutosaverOptions {
  /** Délai (ms) entre la dernière modification et l'enregistrement. */
  delayMs: number
  save: (project: Project) => Promise<void>
  onStatus: (status: AutosaveStatus) => void
  /** Enregistrement refusé : le projet non enregistré et l'erreur (M24, 24.3, D24-8). */
  onError?: (project: Project, error: unknown) => void
  now?: () => Date
}

export interface Autosaver {
  /** Signale une modification : enregistrera ce projet `delayMs` après le dernier appel. */
  schedule: (project: Project) => void
  /** Enregistre tout de suite ce qui est en attente (fermeture de l'onglet, changement de page). */
  flush: () => Promise<void>
  /** Abandonne ce qui est en attente sans enregistrer. */
  cancel: () => void
  /** Relance l'enregistrement refusé (s'il n'a pas été remplacé par une modification plus récente). */
  retry: () => Promise<void>
}

export function createAutosaver({
  delayMs,
  save,
  onStatus,
  onError,
  now = () => new Date(),
}: AutosaverOptions): Autosaver {
  let pending: Project | null = null
  // Dernier projet dont l'enregistrement a été refusé : jamais oublié tant qu'il n'est pas remplacé.
  let failed: Project | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let version = 0 // augmente à chaque modification

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  async function flush(): Promise<void> {
    clearTimer()
    const project = pending
    if (!project) return
    pending = null
    const savedVersion = version
    onStatus('saving')
    const stamped = { ...project, updatedAt: now().toISOString() }
    try {
      await save(stamped)
      if (failed?.id === project.id) failed = null
      // Si le projet a encore changé pendant l'écriture, une nouvelle sauvegarde est déjà
      // programmée : on ne ment pas en affichant « Enregistré ».
      if (version === savedVersion) onStatus('saved')
    } catch (error) {
      if (!pending) failed = stamped
      onStatus('error')
      onError?.(stamped, error)
    }
  }

  return {
    schedule(project) {
      pending = project
      version += 1
      onStatus('saving')
      clearTimer()
      timer = setTimeout(() => void flush(), delayMs)
    },
    flush,
    async retry() {
      if (!pending && failed) pending = failed
      await flush()
    },
    cancel() {
      clearTimer()
      pending = null
    },
  }
}
