import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import { describe, expect, it } from 'vitest'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'
import {
  applyAwarenessEntries,
  type AwarenessEntry,
  canWrite,
  decodeAwarenessUpdate,
  encodeAwarenessUpdate,
  encodeSyncStep1,
  encodeUpdateMessage,
  handleSyncMessage,
  MESSAGE_SYNC,
  removalEntries,
} from './protocol'

/** Message « mise à jour » tel qu'un client l'envoie, décodé jusqu'après le type. */
function clientUpdateDecoder(update: Uint8Array): decoding.Decoder {
  const decoder = decoding.createDecoder(encodeUpdateMessage(update))
  expect(decoding.readVarUint(decoder)).toBe(MESSAGE_SYNC)
  return decoder
}

function docWithText(text: string): Y.Doc {
  const doc = new Y.Doc()
  doc.getText('t').insert(0, text)
  return doc
}

describe('canWrite', () => {
  it('autorise propriétaire et éditeur, refuse le lecteur', () => {
    expect(canWrite('owner')).toBe(true)
    expect(canWrite('editor')).toBe(true)
    expect(canWrite('viewer')).toBe(false)
  })
})

describe('handleSyncMessage', () => {
  it('applique la mise à jour d’un éditeur avec la connexion comme origine', () => {
    const server = new Y.Doc()
    const origins: unknown[] = []
    server.on('update', (_u: Uint8Array, origin: unknown) => origins.push(origin))
    const update = Y.encodeStateAsUpdate(docWithText('mur'))
    const result = handleSyncMessage(clientUpdateDecoder(update), server, 'editor', 'conn-1')
    expect(result.kind).toBe('applied')
    expect(server.getText('t').toString()).toBe('mur')
    expect(origins).toEqual(['conn-1'])
  })

  it('ignore la mise à jour d’un lecteur', () => {
    const server = new Y.Doc()
    const update = Y.encodeStateAsUpdate(docWithText('pirate'))
    const result = handleSyncMessage(clientUpdateDecoder(update), server, 'viewer', 'conn-2')
    expect(result.kind).toBe('rejected')
    expect(server.getText('t').toString()).toBe('')
  })

  it('ignore aussi l’étape 2 envoyée par un lecteur', () => {
    const server = new Y.Doc()
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.writeSyncStep2(encoder, docWithText('pirate'))
    const decoder = decoding.createDecoder(encoding.toUint8Array(encoder))
    decoding.readVarUint(decoder)
    expect(handleSyncMessage(decoder, server, 'viewer', null).kind).toBe('rejected')
    expect(server.getText('t').toString()).toBe('')
  })

  it('répond à l’étape 1 d’un lecteur avec le contenu manquant (lecture permise)', () => {
    const server = docWithText('plan')
    const reader = new Y.Doc()
    const decoder = decoding.createDecoder(encodeSyncStep1(reader))
    decoding.readVarUint(decoder)
    const result = handleSyncMessage(decoder, server, 'viewer', null)
    expect(result.kind).toBe('reply')
    if (result.kind !== 'reply' || !result.reply) throw new Error('réponse attendue')
    // Le lecteur applique l'étape 2 reçue et obtient le document.
    const replyDecoder = decoding.createDecoder(result.reply)
    expect(decoding.readVarUint(replyDecoder)).toBe(MESSAGE_SYNC)
    syncProtocol.readSyncMessage(replyDecoder, encoding.createEncoder(), reader, null)
    expect(reader.getText('t').toString()).toBe('plan')
  })

  it('refuse un sous-type inconnu', () => {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, 9)
    const decoder = decoding.createDecoder(encoding.toUint8Array(encoder))
    expect(() => handleSyncMessage(decoder, new Y.Doc(), 'owner', null)).toThrow()
  })
})

describe('présence (awareness)', () => {
  const alice: AwarenessEntry = { clientId: 11, clock: 3, state: '{"user":{"name":"A"}}' }
  const bob: AwarenessEntry = { clientId: 22, clock: 1, state: '{"user":{"name":"B"}}' }

  it('encode puis décode à l’identique', () => {
    expect(decodeAwarenessUpdate(encodeAwarenessUpdate([alice, bob]))).toEqual([alice, bob])
  })

  it('garde l’état le plus récent et ignore un état plus ancien', () => {
    const states = new Map<number, AwarenessEntry>()
    expect(applyAwarenessEntries(states, [alice])).toEqual([11])
    applyAwarenessEntries(states, [{ ...alice, clock: 2, state: '{"old":true}' }])
    expect(states.get(11)).toEqual(alice)
    applyAwarenessEntries(states, [{ ...alice, clock: 4, state: '{"new":true}' }])
    expect(states.get(11)?.state).toBe('{"new":true}')
  })

  it('retire un participant qui annonce un état nul', () => {
    const states = new Map([[11, alice]])
    applyAwarenessEntries(states, [{ clientId: 11, clock: 4, state: 'null' }])
    expect(states.has(11)).toBe(false)
  })

  it('prépare un départ avec une horloge supérieure', () => {
    const states = new Map([[11, alice]])
    expect(removalEntries(states, [11, 99])).toEqual([
      { clientId: 11, clock: 4, state: 'null' },
      { clientId: 99, clock: 1, state: 'null' },
    ])
  })
})
