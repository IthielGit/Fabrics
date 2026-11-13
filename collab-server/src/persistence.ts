// Sauvegarde de l'état Yjs dans le stockage SQLite du Durable Object (fonctions pures).
//
// Deux tables :
//  * `snapshot` : l'état complet compacté, découpé en morceaux (une ligne SQLite est limitée à 2 Mo) ;
//  * `updates`  : chaque mise à jour reçue depuis la dernière compaction, dans l'ordre.
// Au réveil, on applique le snapshot puis les mises à jour. Au-delà de `COMPACT_AFTER` mises à jour,
// on réécrit un snapshot et on vide `updates`.

import * as Y from 'yjs'

export const CHUNK_SIZE = 512 * 1024
export const COMPACT_AFTER = 500

export function splitIntoChunks(data: Uint8Array, size = CHUNK_SIZE): Uint8Array[] {
  if (size <= 0) throw new Error('Taille de morceau invalide')
  const chunks: Uint8Array[] = []
  for (let offset = 0; offset < data.length; offset += size) {
    chunks.push(data.subarray(offset, offset + size))
  }
  return chunks
}

export function joinChunks(chunks: readonly Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const data = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    data.set(chunk, offset)
    offset += chunk.length
  }
  return data
}

/** Reconstitue le document à partir du snapshot (morceaux) et des mises à jour suivantes. */
export function restoreDoc(snapshotChunks: readonly Uint8Array[], updates: readonly Uint8Array[]): Y.Doc {
  const doc = new Y.Doc()
  if (snapshotChunks.length > 0) Y.applyUpdate(doc, joinChunks(snapshotChunks))
  for (const update of updates) Y.applyUpdate(doc, update)
  return doc
}
