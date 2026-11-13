import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { joinChunks, restoreDoc, splitIntoChunks } from './persistence'

describe('morceaux', () => {
  it('découpe puis recolle à l’identique', () => {
    const data = Uint8Array.from({ length: 10 }, (_, i) => i)
    const chunks = splitIntoChunks(data, 4)
    expect(chunks.map((c) => c.length)).toEqual([4, 4, 2])
    expect(joinChunks(chunks)).toEqual(data)
  })
  it('rien à découper pour un état vide', () => {
    expect(splitIntoChunks(new Uint8Array(0), 4)).toEqual([])
  })
})

describe('restoreDoc', () => {
  it('reconstitue le document depuis un snapshot découpé et les mises à jour suivantes', () => {
    const source = new Y.Doc()
    source.getText('t').insert(0, 'salon')
    const snapshot = Y.encodeStateAsUpdate(source)
    const updates: Uint8Array[] = []
    source.on('update', (u: Uint8Array) => updates.push(u))
    source.getText('t').insert(5, ' 3500 mm')
    source.getMap('m').set('niveau', 'R+1')

    const restored = restoreDoc(splitIntoChunks(snapshot, 3), updates)
    expect(restored.getText('t').toString()).toBe('salon 3500 mm')
    expect(restored.getMap('m').get('niveau')).toBe('R+1')
  })
})
