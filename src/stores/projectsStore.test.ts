import { beforeEach, describe, expect, it } from 'vitest'
import type { ProjectRepository } from '../features/persistence/types'
import type { Project } from '../types/document'
import { createProjectsStore } from './projectsStore'

/** Faux dépôt en mémoire. */
function memoryRepository(): ProjectRepository {
  const projects = new Map<string, Project>()
  return {
    list: async () =>
      [...projects.values()]
        .map(({ document: _document, ...summary }) => summary)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    get: async (id) => projects.get(id) ?? null,
    save: async (project) => void projects.set(project.id, project),
    remove: async (id) => void projects.delete(id),
    putAsset: async () => {},
    getAssetUrl: async () => 'blob:test',
  }
}

describe('projectsStore', () => {
  let useStore: ReturnType<typeof createProjectsStore>
  const state = () => useStore.getState()

  beforeEach(() => {
    useStore = createProjectsStore(memoryRepository())
  })

  it('démarre vide puis liste les projets créés', async () => {
    await state().refresh()
    expect(state().projects).toEqual([])
    expect(state().status).toBe('ready')

    await state().createDesign('post-square')
    await state().createPlan()
    expect(state().projects.map((p) => p.kind).sort()).toEqual(['design', 'plan'])
  })

  it('renvoie l’identifiant du projet créé', async () => {
    const id = await state().createPlan()
    expect(state().projects.some((p) => p.id === id)).toBe(true)
  })

  it('renomme un projet (et ignore un nom vide)', async () => {
    const id = await state().createDesign('a4')
    await state().rename(id, '  Affiche été  ')
    expect(state().projects[0].name).toBe('Affiche été')
    await state().rename(id, '   ')
    expect(state().projects[0].name).toBe('Affiche été')
  })

  it('duplique un projet avec le suffixe « (copie) »', async () => {
    const id = await state().createDesign('a4')
    await state().rename(id, 'Flyer')
    const copyId = await state().duplicate(id)
    expect(copyId).not.toBeNull()
    expect(copyId).not.toBe(id)
    expect(state().projects.map((p) => p.name).sort()).toEqual(['Flyer', 'Flyer (copie)'])
  })

  it('duplicate renvoie null pour un projet inconnu', async () => {
    expect(await state().duplicate('inconnu')).toBeNull()
  })

  it('supprime un projet', async () => {
    const id = await state().createDesign('banner')
    await state().remove(id)
    expect(state().projects).toEqual([])
  })
})
