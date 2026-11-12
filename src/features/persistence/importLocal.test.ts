import { describe, expect, it } from 'vitest'
import type { ImageElement, Project } from '../../types/document'
import { importLocalProjects, type LocalSource } from './importLocal'
import type { ProjectRepository } from './types'

function image(assetId: string): ImageElement {
  return {
    id: crypto.randomUUID(),
    name: 'Image',
    type: 'image',
    assetId,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
  }
}

function makeProject(id: string, assetIds: string[] = []): Project {
  return {
    id,
    name: `Projet ${id}`,
    kind: 'design',
    document: { version: 4, unit: 'px', page: {}, elements: assetIds.map(image) } as unknown as Project['document'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function localSource(projects: Project[], blobs: Record<string, Blob> = {}): LocalSource {
  return {
    list: async () => projects.map(({ document: _document, ...summary }) => summary),
    get: async (id) => projects.find((project) => project.id === id) ?? null,
    getAssetBlob: async (id) => blobs[id] ?? null,
  }
}

function cloudRepo(existing: Project[] = []) {
  const projects = new Map(existing.map((project) => [project.id, project]))
  const assets: string[] = []
  const order: string[] = []
  const repo: ProjectRepository = {
    list: async () => [],
    get: async (id) => projects.get(id) ?? null,
    save: async (project) => {
      order.push(`projet:${project.id}`)
      projects.set(project.id, project)
    },
    remove: async () => {},
    putAsset: async (id) => {
      order.push(`image:${id}`)
      assets.push(id)
    },
    getAssetUrl: async () => '',
  }
  return { repo, projects, assets, order }
}

describe('importLocalProjects', () => {
  it('copie les projets et leurs images, images avant le projet', async () => {
    const local = localSource([makeProject('a', ['img1'])], { img1: new Blob(['x']) })
    const cloud = cloudRepo()
    const result = await importLocalProjects(local, cloud.repo)
    expect(result).toEqual({ imported: 1, skipped: 0, failed: 0 })
    expect(cloud.order).toEqual(['image:img1', 'projet:a'])
  })

  it("n'écrase jamais un projet déjà présent dans le compte", async () => {
    const local = localSource([makeProject('a'), makeProject('b')])
    const cloud = cloudRepo([{ ...makeProject('a'), name: 'Version du compte' }])
    const result = await importLocalProjects(local, cloud.repo)
    expect(result).toEqual({ imported: 1, skipped: 1, failed: 0 })
    expect(cloud.projects.get('a')?.name).toBe('Version du compte')
  })

  it('compte un échec sans arrêter les autres projets', async () => {
    const local = localSource([makeProject('a'), makeProject('b')])
    const cloud = cloudRepo()
    const save = cloud.repo.save
    cloud.repo.save = async (project) => {
      if (project.id === 'a') throw new Error('refusé')
      await save(project)
    }
    const result = await importLocalProjects(local, cloud.repo)
    expect(result).toEqual({ imported: 1, skipped: 0, failed: 1 })
    expect(cloud.projects.has('b')).toBe(true)
  })

  it("passe sur une image locale introuvable et signale l'avancement", async () => {
    const local = localSource([makeProject('a', ['manquante'])])
    const cloud = cloudRepo()
    const steps: [number, number][] = []
    const result = await importLocalProjects(local, cloud.repo, (done, total) => steps.push([done, total]))
    expect(result.imported).toBe(1)
    expect(cloud.assets).toEqual([])
    expect(steps).toEqual([[1, 1]])
  })

  it("ne fait rien quand il n'y a aucun projet local", async () => {
    const result = await importLocalProjects(localSource([]), cloudRepo().repo)
    expect(result).toEqual({ imported: 0, skipped: 0, failed: 0 })
  })
})
