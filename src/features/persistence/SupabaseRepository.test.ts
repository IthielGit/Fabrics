import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import type { ImageElement, Project } from '../../types/document'
import { SupabaseRepository } from './SupabaseRepository'
import { assetPath, projectToRow, rowToSummary, unusedAssetIds } from './cloudMapping'

interface Row {
  id: string
  document: { elements: ImageElement[] }
  updated_at: string
  [key: string]: unknown
}

/** Faux client Supabase en mémoire : juste ce que SupabaseRepository utilise. */
function fakeClient() {
  const rows = new Map<string, Row>()
  const files = new Map<string, Blob>()
  let clock = 0
  const signed: string[] = []

  const client = {
    from: () => ({
      select: (columns: string) => {
        let wanted: string | null = null
        const query = {
          order: () => query,
          eq: (_column: string, value: string) => {
            wanted = value
            return query
          },
          maybeSingle: async () => ({ data: rows.get(wanted ?? '') ?? null, error: null }),
          overrideTypes: async () => {
            const all = [...rows.values()]
            if (columns.startsWith('elements')) {
              return { data: all.map((row) => ({ elements: row.document.elements })), error: null }
            }
            const sorted = all.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))
            return {
              data: sorted.map(({ document: _document, ...summary }) => summary),
              error: null,
            }
          },
        }
        return query
      },
      upsert: async (row: { id: string; document: Row['document'] }) => {
        clock += 1
        const updated_at = `2026-01-01T00:00:${String(clock).padStart(2, '0')}Z`
        rows.set(row.id, { ...rows.get(row.id), ...row, updated_at })
        return { error: null }
      },
      delete: () => ({
        eq: async (_column: string, value: string) => {
          rows.delete(value)
          return { error: null }
        },
      }),
    }),
    storage: {
      from: () => ({
        upload: async (path: string, blob: Blob) => {
          files.set(path, blob)
          return { error: null }
        },
        remove: async (paths: string[]) => {
          paths.forEach((path) => files.delete(path))
          return { error: null }
        },
        createSignedUrl: async (path: string) => {
          signed.push(path)
          return { data: { signedUrl: `https://signe/${path}?n=${signed.length}` }, error: null }
        },
      }),
    },
  }
  return { client: client as unknown as SupabaseClient, rows, files, signed }
}

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

function makeProject(id: string, assetIds: string[] = []): Project {
  return {
    id,
    name: `Projet ${id}`,
    kind: 'design',
    document: {
      version: 4,
      unit: 'px',
      page: { width: 100, height: 100, background: '#ffffff' },
      elements: assetIds.map(image),
    } as unknown as Project['document'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('SupabaseRepository', () => {
  it('enregistre puis relit un projet', async () => {
    const { client } = fakeClient()
    const repo = new SupabaseRepository(client, 'u1')
    await repo.save(makeProject('a'))
    const loaded = await repo.get('a')
    expect(loaded?.name).toBe('Projet a')
    expect(loaded?.document.elements).toEqual([])
  })

  it("renvoie null pour un projet qui n'existe pas", async () => {
    const { client } = fakeClient()
    expect(await new SupabaseRepository(client, 'u1').get('absent')).toBeNull()
  })

  it('liste les projets sans leur document, le plus récent en premier', async () => {
    const { client } = fakeClient()
    const repo = new SupabaseRepository(client, 'u1')
    await repo.save(makeProject('ancien'))
    await repo.save(makeProject('recent'))
    const list = await repo.list()
    expect(list.map((project) => project.id)).toEqual(['recent', 'ancien'])
    expect('document' in list[0]).toBe(false)
  })

  it('range chaque image sous le dossier du compte', async () => {
    const { client, files } = fakeClient()
    const repo = new SupabaseRepository(client, 'u1')
    await repo.putAsset('img1', new Blob(['x']))
    expect([...files.keys()]).toEqual(['u1/img1'])
  })

  it("réutilise l'URL signée d'une image tant qu'elle est valable", async () => {
    const { client, signed } = fakeClient()
    const repo = new SupabaseRepository(client, 'u1')
    const first = await repo.getAssetUrl('img1')
    const second = await repo.getAssetUrl('img1')
    expect(second).toBe(first)
    expect(signed).toEqual(['u1/img1'])
  })

  it("supprime les images d'un projet supprimé, sauf celles encore utilisées ailleurs", async () => {
    const { client, files } = fakeClient()
    const repo = new SupabaseRepository(client, 'u1')
    await repo.putAsset('seule', new Blob(['1']))
    await repo.putAsset('partagee', new Blob(['2']))
    await repo.save(makeProject('a', ['seule', 'partagee']))
    await repo.save(makeProject('b', ['partagee']))

    await repo.remove('a')

    expect(await repo.get('a')).toBeNull()
    expect([...files.keys()]).toEqual(['u1/partagee'])
  })
})

describe('cloudMapping', () => {
  it('ne met ni owner_id ni updated_at dans la ligne à enregistrer', () => {
    const row = projectToRow(makeProject('a'))
    expect(Object.keys(row).sort()).toEqual(
      ['created_at', 'document', 'id', 'kind', 'name', 'thumbnail_path'].sort(),
    )
    expect(row.thumbnail_path).toBeNull()
  })

  it('reprend la miniature dans le résumé', () => {
    const summary = rowToSummary({
      id: 'a',
      name: 'N',
      kind: 'plan',
      thumbnail_path: 'data:image/png;base64,AAA',
      created_at: 'c',
      updated_at: 'u',
    })
    expect(summary.thumbnail).toBe('data:image/png;base64,AAA')
    expect(summary.updatedAt).toBe('u')
  })

  it('assetPath et unusedAssetIds', () => {
    expect(assetPath('u1', 'x')).toBe('u1/x')
    expect(unusedAssetIds([image('a'), image('b')], [{ elements: [image('b')] }])).toEqual(['a'])
  })
})
