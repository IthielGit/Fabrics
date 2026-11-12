import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Project } from '../../types/document'
import type { ProjectRepository } from './types'

// Faux IndexedDB : une simple Map en mémoire.
const store = new Map<string, unknown>()

vi.mock('idb-keyval', () => ({
  get: async (key: string) => store.get(key),
  set: async (key: string, value: unknown) => void store.set(key, value),
  del: async (key: string) => void store.delete(key),
  keys: async () => [...store.keys()],
}))

const { ResilientRepository } = await import('./ResilientRepository')

function makeProject(id: string, name = `Projet ${id}`, updatedAt = '2026-01-01T00:00:00.000Z'): Project {
  return {
    id,
    name,
    kind: 'plan',
    document: { version: 4, unit: 'mm', page: {}, elements: [] } as unknown as Project['document'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
  }
}

/** Faux serveur : peut être « coupé » pour simuler une panne de réseau. */
function fakeServer() {
  const projects = new Map<string, Project>()
  const assets = new Map<string, Blob>()
  const state = { offline: false }
  const guard = () => {
    if (state.offline) throw new TypeError('Failed to fetch')
  }
  const repo: ProjectRepository = {
    list: async () => {
      guard()
      return [...projects.values()].map(({ document: _document, ...summary }) => summary)
    },
    get: async (id) => {
      guard()
      return projects.get(id) ?? null
    },
    save: async (project) => {
      guard()
      projects.set(project.id, project)
    },
    remove: async (id) => {
      guard()
      projects.delete(id)
    },
    putAsset: async (id, blob) => {
      guard()
      assets.set(id, blob)
    },
    getAssetUrl: async (id) => {
      guard()
      return `https://serveur/${id}`
    },
  }
  return { repo, projects, assets, state }
}

describe('ResilientRepository', () => {
  beforeEach(() => store.clear())

  it('enregistre normalement quand le réseau fonctionne', async () => {
    const server = fakeServer()
    const counts: number[] = []
    const repo = new ResilientRepository(server.repo, 'u1', { onPendingChange: (n) => counts.push(n) })
    await repo.save(makeProject('a'))
    expect(server.projects.has('a')).toBe(true)
    expect(repo.pendingCount).toBe(0)
    expect(counts).toEqual([])
    repo.dispose()
  })

  it('garde le projet sur l’appareil quand le réseau est coupé, sans erreur', async () => {
    const server = fakeServer()
    const counts: number[] = []
    const repo = new ResilientRepository(server.repo, 'u1', { onPendingChange: (n) => counts.push(n) })
    server.state.offline = true

    await expect(repo.save(makeProject('a', 'Hors ligne'))).resolves.toBeUndefined()

    expect(server.projects.size).toBe(0)
    expect(repo.pendingCount).toBe(1)
    expect(counts).toEqual([1])
    expect((await repo.get('a'))?.name).toBe('Hors ligne') // relu depuis l'appareil
    repo.dispose()
  })

  it('renvoie ce qui attendait quand le réseau revient', async () => {
    const server = fakeServer()
    const repo = new ResilientRepository(server.repo, 'u1')
    server.state.offline = true
    await repo.save(makeProject('a'))
    await repo.putAsset('img', new Blob(['x']))
    expect(repo.pendingCount).toBe(2)

    await repo.flush() // toujours hors ligne : rien ne part, rien ne se perd
    expect(repo.pendingCount).toBe(2)

    server.state.offline = false
    await repo.flush()
    expect(server.projects.has('a')).toBe(true)
    expect(server.assets.has('img')).toBe(true)
    expect(repo.pendingCount).toBe(0)
    repo.dispose()
  })

  it('un enregistrement réussi remplace la copie en attente', async () => {
    const server = fakeServer()
    const repo = new ResilientRepository(server.repo, 'u1')
    server.state.offline = true
    await repo.save(makeProject('a', 'Ancien nom'))
    server.state.offline = false
    await repo.save(makeProject('a', 'Nouveau nom'))

    expect(repo.pendingCount).toBe(0)
    expect(server.projects.get('a')?.name).toBe('Nouveau nom')
    expect((await repo.get('a'))?.name).toBe('Nouveau nom')
    repo.dispose()
  })

  it('ne met pas en attente une erreur qui ne vient pas du réseau', async () => {
    const server = fakeServer()
    server.repo.save = async () => {
      throw Object.assign(new Error('droits refusés'), { code: '42501' })
    }
    const repo = new ResilientRepository(server.repo, 'u1')
    await expect(repo.save(makeProject('a'))).rejects.toThrow('droits refusés')
    expect(repo.pendingCount).toBe(0)
    repo.dispose()
  })

  it('la liste montre les projets en attente avec leur dernier état', async () => {
    const server = fakeServer()
    server.projects.set('a', makeProject('a', 'Vieux', '2026-01-01T00:00:00.000Z'))
    const repo = new ResilientRepository(server.repo, 'u1')
    server.state.offline = true
    await repo.save(makeProject('a', 'Modifié hors ligne', '2026-02-01T00:00:00.000Z'))
    await repo.save(makeProject('b', 'Créé hors ligne', '2026-03-01T00:00:00.000Z'))
    server.state.offline = false

    const list = await repo.list()
    expect(list.map((p) => [p.id, p.name])).toEqual([
      ['b', 'Créé hors ligne'],
      ['a', 'Modifié hors ligne'],
    ])
    repo.dispose()
  })

  it('reprend les éléments en attente au démarrage suivant, et seulement ceux du même compte', async () => {
    const server = fakeServer()
    const first = new ResilientRepository(server.repo, 'u1')
    server.state.offline = true
    await first.save(makeProject('a'))
    first.dispose()

    const other = new ResilientRepository(fakeServer().repo, 'u2')
    expect(await other.get('a')).toBeNull()
    expect(other.pendingCount).toBe(0)
    other.dispose()

    server.state.offline = false
    const second = new ResilientRepository(server.repo, 'u1')
    await second.flush()
    expect(server.projects.has('a')).toBe(true)
    expect(second.pendingCount).toBe(0)
    second.dispose()
  })
})
