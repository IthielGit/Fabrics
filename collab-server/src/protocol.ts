// Protocole Yjs du serveur temps réel : fonctions pures, sans Cloudflare, testées avec Vitest.
//
// Format des messages (compatible avec le client `y-websocket`) :
//   varUint type (0 = synchronisation, 1 = présence / awareness), puis le contenu.
// Synchronisation : varUint sous-type (0 = étape 1, 1 = étape 2, 2 = mise à jour), puis les octets.
// Présence : varUint8Array contenant [varUint n, puis n × (clientID, clock, état JSON)].

import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'

export const MESSAGE_SYNC = 0
export const MESSAGE_AWARENESS = 1

export type Role = 'owner' | 'editor' | 'viewer'

/** Un lecteur peut lire et signaler sa présence, jamais modifier le document. */
export function canWrite(role: Role): boolean {
  return role === 'owner' || role === 'editor'
}

/** Message d'ouverture envoyé par le serveur : son vecteur d'état (étape 1). */
export function encodeSyncStep1(doc: Y.Doc): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeSyncStep1(encoder, doc)
  return encoding.toUint8Array(encoder)
}

/** Mise à jour du document à relayer aux autres connexions. */
export function encodeUpdateMessage(update: Uint8Array): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_SYNC)
  syncProtocol.writeUpdate(encoder, update)
  return encoding.toUint8Array(encoder)
}

export type SyncResult =
  /** Réponse à renvoyer à l'expéditeur (étape 2), éventuellement vide. */
  | { kind: 'reply'; reply: Uint8Array | null }
  /** Mise à jour appliquée au document (le relais passe par l'événement `update` du `Y.Doc`). */
  | { kind: 'applied' }
  /** Mise à jour d'un lecteur : ignorée. */
  | { kind: 'rejected' }

/**
 * Traite un message de synchronisation (après lecture du type `MESSAGE_SYNC`).
 * `origin` est passé à `Y.applyUpdate` pour ne pas renvoyer la mise à jour à son auteur.
 */
export function handleSyncMessage(
  decoder: decoding.Decoder,
  doc: Y.Doc,
  role: Role,
  origin: unknown,
): SyncResult {
  const subType = decoding.readVarUint(decoder)
  if (subType === syncProtocol.messageYjsSyncStep1) {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, MESSAGE_SYNC)
    syncProtocol.readSyncStep1(decoder, encoder, doc)
    return { kind: 'reply', reply: encoding.toUint8Array(encoder) }
  }
  if (subType === syncProtocol.messageYjsSyncStep2 || subType === syncProtocol.messageYjsUpdate) {
    if (!canWrite(role)) return { kind: 'rejected' }
    const update = decoding.readVarUint8Array(decoder)
    Y.applyUpdate(doc, update, origin)
    return { kind: 'applied' }
  }
  throw new Error(`Sous-type de synchronisation inconnu : ${subType}`)
}

// ---------------------------------------------------------------------------
// Présence (awareness). Le serveur ne garde pas d'objet `Awareness` de y-protocols : il démarre
// un minuteur permanent qui empêcherait la mise en veille du Durable Object. On garde seulement
// le dernier état connu de chaque participant, pour le donner à ceux qui arrivent.
// ---------------------------------------------------------------------------

export interface AwarenessEntry {
  clientId: number
  clock: number
  /** État JSON tel qu'envoyé par le client ; `'null'` = participant parti. */
  state: string
}

export function decodeAwarenessUpdate(update: Uint8Array): AwarenessEntry[] {
  const decoder = decoding.createDecoder(update)
  const count = decoding.readVarUint(decoder)
  const entries: AwarenessEntry[] = []
  for (let i = 0; i < count; i++) {
    entries.push({
      clientId: decoding.readVarUint(decoder),
      clock: decoding.readVarUint(decoder),
      state: decoding.readVarString(decoder),
    })
  }
  return entries
}

export function encodeAwarenessUpdate(entries: readonly AwarenessEntry[]): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, entries.length)
  for (const entry of entries) {
    encoding.writeVarUint(encoder, entry.clientId)
    encoding.writeVarUint(encoder, entry.clock)
    encoding.writeVarString(encoder, entry.state)
  }
  return encoding.toUint8Array(encoder)
}

export function encodeAwarenessMessage(entries: readonly AwarenessEntry[]): Uint8Array {
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, MESSAGE_AWARENESS)
  encoding.writeVarUint8Array(encoder, encodeAwarenessUpdate(entries))
  return encoding.toUint8Array(encoder)
}

/**
 * Applique une mise à jour de présence à la table des états connus (modifiée sur place).
 * Retourne les identifiants de clients présents dans le message (pour savoir lesquels
 * appartiennent à quelle connexion). Un état plus ancien que celui connu est ignoré.
 */
export function applyAwarenessEntries(
  states: Map<number, AwarenessEntry>,
  entries: readonly AwarenessEntry[],
): number[] {
  const ids: number[] = []
  for (const entry of entries) {
    ids.push(entry.clientId)
    const known = states.get(entry.clientId)
    if (known && known.clock > entry.clock) continue
    if (entry.state === 'null') states.delete(entry.clientId)
    else states.set(entry.clientId, entry)
  }
  return ids
}

/** Message qui annonce le départ des participants d'une connexion fermée. */
export function removalEntries(
  states: Map<number, AwarenessEntry>,
  clientIds: readonly number[],
): AwarenessEntry[] {
  return clientIds.map((clientId) => ({
    clientId,
    clock: (states.get(clientId)?.clock ?? 0) + 1,
    state: 'null',
  }))
}
