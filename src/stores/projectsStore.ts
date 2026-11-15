import { create } from 'zustand'
import {
  createDesignProject,
  createExamplePlanProject,
  createLargeHouseProject,
  createPlanProject,
  duplicateProject,
  type DesignFormatId,
} from '../features/documents/createProject'
import { rememberCreated } from '../features/persistence/justCreated'
import { repository } from '../features/persistence/repository'
import type { ProjectRepository, ProjectSummary } from '../features/persistence/types'
import type { Project } from '../types/document'
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
  /** Crée une copie de l'exemple « grande maison R+3 » et renvoie son identifiant. */
  createLargeHouse: () => Promise<string>
  rename: (id: string, name: string) => Promise<void>
  duplicate: (id: string) => Promise<string | null>
  remove: (id: string) => Promise<void>
}

export function createProjectsStore(repo: ProjectRepository) {
  return create<ProjectsState>()((set, get) => {
    /**
     * Enregistre un nouveau projet et rend la main tout de suite : la liste de l'accueil se relit
     * en arrière-plan, et l'éditeur reçoit le projet sans le retélécharger.
     */
    const saveNew = async (project: Project): Promise<string> => {
      await repo.save(project)
      rememberCreated(project)
      void get().refresh()
      return project.id
    }

    return {
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
        return saveNew(project)
      },

      createPlan: async () => {
        const project = createPlanProject(fr.projects.defaultPlanName)
        return saveNew(project)
      },

      createExample: async () => {
        const project = createExamplePlanProject()
        return saveNew(project)
      },

      createLargeHouse: async () => {
        const project = createLargeHouseProject()
        return saveNew(project)
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
    }
  })
}

export const useProjectsStore = createProjectsStore(repository)
