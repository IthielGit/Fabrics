import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImageElement, Project } from '../../types/document'

// Faux IndexedDB : une simple Map en mémoire.
const store = new Map<string, unknown>()

vi.mock('idb-keyval', () => ({
  get: async (key: string) => store.get(key),
  set: async (key: string, value: unknown) => void store.set(key, value),
  del: async (key: string) => void store.delete(key),
  delMany: async (keys: string[]) => void keys.forEach((key) => store.delete(key)),
  keys: async () => [...store.keys()],
  getMany: async (keys: string[]) => keys.map((key) => store.get(key)),
  setMany: async (entries: [string, unknown][]) =>
    void entries.forEach(([key, value]) => store.set(key, value)),
}))

const { LocalRepository } = await import('./LocalRepository')

function image(assetId: string): ImageElement {
  return {
    id: crypto.randomUUID(),
    name: 'Image',
    type: 'image',
    assetId,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    hidden: false,
  }
}

function makeProject(id: string, updatedAt: string, assetIds: string[] = []): Project {
  return {
    id,
    name: `Projet ${id}`,
    kind: 'design',
    document: {
      version: 4,
      unit: 'px',
      page: { width: 1080, height: 1080, background: '#ffffff' },
      elements: assetIds.map(image),
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
  }
}

describe('LocalRepository', () => {
  let repo: InstanceType<typeof LocalRepository>

  beforeEach(() => {
    store.clear()
    repo = new LocalRepository()
  })

  it('enregistre puis relit un projet complet', async () => {
    const project = makeProject('a', '2026-02-01T00:00:00.000Z')
    await repo.save(project)
    expect(await repo.get('a')).toEqual(project)
  })

  it('met au format actuel un projet enregistré en version 1', async () => {
    const old = makeProject('ancien', '2026-01-01T00:00:00.000Z', ['a1'])
    store.set('project:ancien', { ...old, document: { ...old.document, version: 1 } })

    const loaded = await repo.get('ancien')
    expect(loaded?.document.version).toBe(4)
    expect(loaded?.document.elements).toEqual(old.document.elements)
  })

  it('renvoie null pour un projet inconnu', async () => {
    expect(await repo.get('inconnu')).toBeNull()
  })

  it('liste les projets sans document, le plus récent en premier', async () => {
    await repo.save(makeProject('vieux', '2026-01-01T00:00:00.000Z'))
    await repo.save(makeProject('recent', '2026-03-01T00:00:00.000Z'))
    const list = await repo.list()
    expect(list.map((p) => p.id)).toEqual(['recent', 'vieux'])
    expect(list[0]).not.toHaveProperty('document')
  })

  it('met à jour le résumé quand on enregistre à nouveau', async () => {
    await repo.save(makeProject('a', '2026-01-01T00:00:00.000Z'))
    await repo.save({ ...makeProject('a', '2026-02-01T00:00:00.000Z'), name: 'Renommé' })
    const list = await repo.list()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Renommé')
  })

  it('supprime un projet', async () => {
    await repo.save(makeProject('a', '2026-01-01T00:00:00.000Z'))
    await repo.remove('a')
    expect(await repo.get('a')).toBeNull()
    expect(await repo.list()).toEqual([])
  })

  it('supprime les images qui ne sont plus utilisées', async () => {
    await repo.putAsset('img1', new Blob(['x']))
    await repo.save(makeProject('a', '2026-01-01T00:00:00.000Z', ['img1']))
    await repo.remove('a')
    await expect(repo.getAssetUrl('img1')).rejects.toThrow()
  })

  it('garde une image encore utilisée par un autre projet', async () => {
    await repo.putAsset('img1', new Blob(['x']))
    await repo.save(makeProject('a', '2026-01-01T00:00:00.000Z', ['img1']))
    await repo.save(makeProject('copie', '2026-01-02T00:00:00.000Z', ['img1']))
    await repo.remove('a')
    await expect(repo.getAssetUrl('img1')).resolves.toMatch(/^blob:/)
  })

  it('refuse de donner l’URL d’une image absente', async () => {
    await expect(repo.getAssetUrl('absente')).rejects.toThrow('Image introuvable')
  })
})
