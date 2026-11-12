import { create } from 'zustand'
import {
  createDesignProject,
  createExamplePlanProject,
  createPlanProject,
  duplicateProject,
  type DesignFormatId,
} from '../features/documents/createProject'
import { repository } from '../features/persistence/repository'
import type { ProjectRepository, ProjectSummary } from '../features/persistence/types'
import { fr } from '../i18n/fr'

interface ProjectsState {
  projects: ProjectSummary[]
  status: 'idle' | 'loading' | 'ready' | 'error'

  refresh: () => Promise<void>
  /** Crée un projet et renvoie son identifiant (pour ouvrir l'éditeur). */
  createDesign: (formatId: DesignFormatId) => Promise<string>
  createPlan: () => Promise<string>
  /** Crée une copie du plan d'exemple et renvoie son identifiant. */
  createExample: () => Promise<string>
  rename: (id: string, name: string) => Promise<void>
  duplicate: (id: string) => Promise<string | null>
  remove: (id: string) => Promise<void>
}

export function createProjectsStore(repo: ProjectRepository) {
  return create<ProjectsState>()((set, get) => ({
    projects: [],
    status: 'idle',

    refresh: async () => {
      set({ status: 'loading' })
      try {
        set({ projects: await repo.list(), status: 'ready' })
      } catch {
        set({ status: 'error' })
      }
    },

    createDesign: async (formatId) => {
      const project = createDesignProject(formatId, fr.projects.defaultDesignName)
      await repo.save(project)
      await get().refresh()
      return project.id
    },

    createPlan: async () => {
      const project = createPlanProject(fr.projects.defaultPlanName)
      await repo.save(project)
      await get().refresh()
      return project.id
    },

    createExample: async () => {
      const project = createExamplePlanProject()
      await repo.save(project)
      await get().refresh()
      return project.id
    },

    rename: async (id, name) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const project = await repo.get(id)
      if (!project) return
      await repo.save({ ...project, name: trimmed, updatedAt: new Date().toISOString() })
      await get().refresh()
    },

    duplicate: async (id) => {
      const source = await repo.get(id)
      if (!source) return null
      const copy = duplicateProject(source, `${source.name} ${fr.projects.copySuffix}`)
      await repo.save(copy)
      await get().refresh()
      return copy.id
    },

    remove: async (id) => {
      await repo.remove(id)
      await get().refresh()
    },
  }))
}

export const useProjectsStore = createProjectsStore(repository)
