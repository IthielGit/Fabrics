import type { Project } from '../../types/document'

export type AutosaveStatus = 'saved' | 'saving' | 'error'

export interface AutosaverOptions {
  /** Délai (ms) entre la dernière modification et l'enregistrement. */
  delayMs: number
  save: (project: Project) => Promise<void>
  onStatus: (status: AutosaveStatus) => void
  now?: () => Date
}

export interface Autosaver {
  /** Signale une modification : enregistrera ce projet `delayMs` après le dernier appel. */
  schedule: (project: Project) => void
  /** Enregistre tout de suite ce qui est en attente (fermeture de l'onglet, changement de page). */
  flush: () => Promise<void>
  /** Abandonne ce qui est en attente sans enregistrer. */
  cancel: () => void
}

export function createAutosaver({
  delayMs,
  save,
  onStatus,
  now = () => new Date(),
}: AutosaverOptions): Autosaver {
  let pending: Project | null = null
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
    try {
      await save({ ...project, updatedAt: now().toISOString() })
      // Si le projet a encore changé pendant l'écriture, une nouvelle sauvegarde est déjà
      // programmée : on ne ment pas en affichant « Enregistré ».
      if (version === savedVersion) onStatus('saved')
    } catch {
      onStatus('error')
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
    cancel() {
      clearTimer()
      pending = null
    },
  }
}
